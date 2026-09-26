# Autumn — the AI assistant

Autumn is the site's AI guide. It is an agent built on **Vercel AI SDK 7**, grounded in the site's own content through **hybrid retrieval**. It has a **System One layer** (Jev from TypeSafe AI) that makes fast, typed decisions around the language model.

The rest of this page covers how it works and why it was built this way.

```
Browser (useChat, typed UIMessage)
  │  sends only the newest message + thread id + current path
  ▼
POST /api/assistant/chat
  ├─ zod validation · signed visitor cookie · thread ownership
  ├─ rate limits: visitor / IP (proxy-aware, hashed) / global, in Postgres
  ├─ server-side history (the client can't inject turns)
  ├─ in parallel: page context  +  System One gate (1 Jev request, ~100 ms)
  │     intent (choice) · injection (bool) · abuse (bool) · complexity (score)
  │     → deterministic routing in code: fast | deep model, normal | strict | no-tools | blocked
  ▼
ToolLoopAgent ("Autumn")
  prepareCall  → model tier, instructions (locale, page, mode), server-only tool context
  prepareStep  → step 0: compact history · step ≥ 6: tools off, must answer
  stopWhen     → max 8 steps · timeouts: total / step / tool
  tools        → searchKnowledge · listProjects · getProject · listPosts · getPost
                 getCareer · getProfile · contactOwner (policy check + user approval, HMAC-signed)
  ▼
UI message stream
  start(metadata) → data-route → text / tool parts (preliminary results) → data-sources → finish(usage)
  ▼
Post-answer: System One source attribution → "verified" source chips
Persistence: compacted UIMessages, 40 msgs/thread, retention sweep (default 90 days)
```

## Why hybrid retrieval, with Jev on top, instead of embeddings or Jev alone

Jev is a *decision* model. It returns typed answers (Choice, Score, Boolean) with calibrated probabilities. It does not generate text, and it does not retrieve anything.

The public evaluations published so far point one way:

| Evaluation | Finding |
|---|---|
| Graded relevance, 33k-item catalog, 164 tr/en queries ([jev-search-rerank-eval](https://github.com/zhuyansen/jev-search-rerank-eval)) | Jev as a standalone reranker ≈ or below bge-m3 once the judge bias is removed. **`RRF(embedding, Jev)` gives +0.064 to +0.09 nDCG@10.** |
| BEIR SciFact / NFCorpus ([rerank-bench-jev](https://github.com/denser-org/rerank-bench-jev)) | Same quality as Qwen3-Reranker, about 2× faster, about 4× more expensive |
| Memory relevance, 238 items ([jev-recall](https://github.com/samdotmak/jev-recall)) | Jev 17/18 vs embeddings 3/18, where the relevant item is phrased nothing like the query |

Jev alone would work for a small site. It breaks down as content grows, for three reasons:
- Every query would have to read the whole corpus.
- The state is limited to 32k tokens, and Jev's accuracy drops as the state fills with unrelated text.
- It cannot bridge languages: a Turkish question has to find English content.

Embeddings alone miss results that are relevant but worded differently.

This pipeline uses each part for what it does best:

1. **Recall.** Postgres FTS (Turkish + English stemming, OR-query) and pgvector (1536-dim Matryoshka Gemini embeddings, HNSW, cross-lingual) run in parallel. Their results are fused with RRF.
2. **Precision.** Jev answers "does this passage help answer the question?" for every candidate in one request. Its ranking is **fused** back with RRF, because the benchmarks show the fusion wins and Jev alone does not.
3. **Fail-open.** If there is no Jev key, or Jev times out or errors, the pipeline falls back to the first-stage fusion.

Structured questions skip vector search entirely:
- "Which projects use React?", "how many years of experience?" and similar go to typed SQL tools.
- Dates and durations are computed in code. Both LLMs and System One models are unreliable at date arithmetic.

## Where Jev is used, and where it isn't

| Used for | Why |
|---|---|
| Pre-flight gate | Four independent questions in one ~100 ms request. Thresholds live in `lib/ai/config.ts`. |
| Model routing | A complexity score decides whether the fast or the deep Gemini model answers. |
| Retrieval judge (fused) | The only configuration with a measured gain. |
| Contact-request screening | Spam is denied automatically; genuine messages still need the visitor's approval. |
| Source attribution | Marks which sources the answer actually used. |

| Not used for | Why |
|---|---|
| Choosing tools | With about 8 tools the LLM already does this well. |
| Dates, counts, durations | A documented weakness; SQL computes them. |
| Grading its own retrieval in evals | That would be judge circularity. |

Without Jev, the gate falls back to a transparent heuristic. The latency-insensitive steps (source attribution, contact screening) can use Gemini's structured-output evaluator through the same `experimental_evaluate` API.

## Knowledge index

- **Sources.** Published projects, blog posts, work experience and the profile, one per language. Structured attributes become *facts* in a synthetic "overview" chunk, so "which projects use Redis?" matches even when the prose never says it.
- **Chunking.** Heading-aware, about 450 tokens per chunk (max 700) with sentence-level overlap. Every chunk stores its breadcrumb (`Architecture › Caching`), and the breadcrumb is prepended before embedding.
- **Sync.** Admin saves call `scheduleKnowledgeSync()`, which runs after the response through `after()` on a serialized in-process queue. Content hashes make the sync idempotent. Deleted or unpublished content is removed automatically. `yarn ai:reindex` and the admin buttons trigger a full check.
- **Derived data.** The index is excluded from backups and can always be rebuilt from source.

## Conversation storage

These rules keep the tables small:
- Messages are stored as compacted UIMessages: reasoning is dropped and long strings inside tool outputs are truncated.
- Each thread keeps at most 40 messages.
- The retention sweep runs lazily, at most once a day, on a chat request. The default is 90 days and can be changed in the admin.
- No raw IPs, raw cookies or full prompts are stored. Only a prompt *version* is kept with each message.
- Visitors can delete their own conversation from the widget.
- In the admin, conversations are grouped per person: by visitor (signed cookie, one browser) or by network (keyed hash of the IP, which merges one person across browsers). Raw IPs are never stored.

## Evaluation

```bash
yarn ai:eval          # lexical vs vector vs hybrid vs hybrid+judge
yarn test:ai          # unit tests: chunker, fusion, gate policy, identity, citations, stream composition
```

`evals/retrieval.golden.json` holds human-labelled questions, with relevant sources given as citation keys. Extend it with real content before tuning thresholds.

## Files

| Path | Role |
|---|---|
| `lib/ai/config.ts` | Every threshold, budget and limit |
| `lib/ai/models.ts` | Selectable Gemini 3.x models with paid-tier prices (chosen in the admin, stored in `AssistantSettings`) |
| `lib/ai/providers.ts` | Gemini (LLM + embeddings) and the evaluator resolution chain: Jev direct → Jev via Gateway → Gemini → off |
| `lib/ai/system-one/*` | Gate, judge, attribution, contact screening (all fail-open) |
| `lib/ai/knowledge/*` | Text normalisation, chunker, sources, indexer, hybrid search, RRF, related items |
| `lib/ai/agent/*` | Agent, tools, read models, instructions, citation keys |
| `lib/ai/chat/*` | Identity, rate limits, settings and retention, storage, turn stream composition |
| `app/api/assistant/*` | Chat and thread endpoints |
| `components/assistant/*` | Widget: launcher, panel, activity timeline, generative UI cards, approval card |
| `app/[locale]/admin/assistant` | Settings, index status, retrieval lab, conversation viewer |

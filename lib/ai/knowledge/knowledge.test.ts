import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chunkBlocks } from "./chunker";
import { capPerGroup, reciprocalRankFusion, sortByScore } from "./fusion";
import { contentToBlocks, htmlToBlocks, markdownToBlocks, stableHash } from "./text";

describe("htmlToBlocks", () => {
  it("keeps headings, lists, tables and code blocks from TipTap HTML", () => {
    const blocks = htmlToBlocks(`
      <h2>Architecture</h2>
      <p>Built with <strong>Next.js</strong> &amp; Drizzle.</p>
      <ul><li>Postgres</li><li>pgvector</li></ul>
      <table><tr><th>Layer</th><th>Tech</th></tr><tr><td>DB</td><td>Postgres</td></tr></table>
      <pre><code>const a = 1;\nconst b = 2;</code></pre>
      <script>alert(1)</script>
    `);
    assert.deepEqual(blocks, [
      { kind: "heading", level: 2, text: "Architecture" },
      { kind: "text", text: "Built with Next.js & Drizzle." },
      { kind: "text", text: "- Postgres" },
      { kind: "text", text: "- pgvector" },
      { kind: "text", text: "Layer | Tech" },
      { kind: "text", text: "DB | Postgres" },
      { kind: "code", text: "const a = 1;\nconst b = 2;" },
    ]);
  });
});

describe("markdownToBlocks", () => {
  it("parses headings, lists and strips inline markup", () => {
    const blocks = markdownToBlocks("# Role\nLed the **platform** team.\n\n- Shipped [search](https://x.dev)\n- `Redis` caching");
    assert.deepEqual(blocks, [
      { kind: "heading", level: 1, text: "Role" },
      { kind: "text", text: "Led the platform team." },
      { kind: "text", text: "- Shipped search" },
      { kind: "text", text: "- Redis caching" },
    ]);
  });

  it("contentToBlocks detects HTML vs plain text", () => {
    assert.equal(contentToBlocks("<p>hi</p>")[0].text, "hi");
    assert.equal(contentToBlocks("plain text")[0].text, "plain text");
    assert.deepEqual(contentToBlocks(""), []);
  });
});

describe("chunkBlocks", () => {
  const paragraph = (n: number) =>
    Array.from({ length: n }, (_, i) => `Sentence number ${i} explains a detail of the system.`).join(" ");

  it("tags chunks with a heading breadcrumb", () => {
    const chunks = chunkBlocks([
      { kind: "heading", level: 2, text: "Backend" },
      { kind: "heading", level: 3, text: "Caching" },
      { kind: "text", text: "Redis is used for sessions." },
    ]);
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].heading, "Backend › Caching");
  });

  it("splits long content under maxTokens with overlap", () => {
    const chunks = chunkBlocks([{ kind: "text", text: paragraph(120) }], {
      targetTokens: 200,
      maxTokens: 300,
      overlapTokens: 30,
    });
    assert.ok(chunks.length > 2, "expected several chunks");
    for (const chunk of chunks) assert.ok(chunk.tokenCount <= 330, `chunk too big: ${chunk.tokenCount}`);
    // overlap: the start of chunk 2 repeats the end of chunk 1
    const tail = chunks[0].content.split(". ").at(-1)!.slice(0, 20);
    assert.ok(chunks[1].content.includes(tail));
  });

  it("starts a new chunk at a new section once the current one is big enough", () => {
    const chunks = chunkBlocks([
      { kind: "heading", level: 2, text: "One" },
      { kind: "text", text: paragraph(12) },
      { kind: "heading", level: 2, text: "Two" },
      { kind: "text", text: "Short." },
    ]);
    assert.equal(chunks.at(-1)!.heading, "Two");
  });
});

describe("reciprocalRankFusion", () => {
  it("rewards items ranked well by several retrievers", () => {
    const fused = reciprocalRankFusion([
      ["a", "b", "c"],
      ["b", "d", "a"],
    ]);
    assert.deepEqual(sortByScore(fused).slice(0, 2), ["b", "a"]);
    assert.ok(Math.abs(fused.get("b")! - (1 / 62 + 1 / 61)) < 1e-12);
  });

  it("supports weights and keeps single-list items", () => {
    const fused = reciprocalRankFusion([["x"], ["y"]], { weights: [1, 2] });
    assert.deepEqual(sortByScore(fused), ["y", "x"]);
  });

  it("capPerGroup limits items per document", () => {
    const capped = capPerGroup(["a1", "a2", "b1", "a3"], (id) => id[0], 2);
    assert.deepEqual(capped, ["a1", "a2", "b1"]);
  });
});

describe("stableHash", () => {
  it("is deterministic and content-sensitive", () => {
    assert.equal(stableHash({ a: 1 }), stableHash({ a: 1 }));
    assert.notEqual(stableHash({ a: 1 }), stableHash({ a: 2 }));
  });
});

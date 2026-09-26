# Installation Guide

This guide contains the necessary steps to successfully install and run the **Autumnnus Portfolio** project on your local system (localhost) or production environment.

## Prerequisites

- **Node.js**: v18+ (v20+ recommended)
- **Package Manager**: Yarn (recommended) or npm
- **Docker**: For running PostgreSQL (with pgvector) and MinIO locally
- **Git**: For cloning the repository

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repo_url>
cd autumnnus-portfolio
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Set Up Environment Variables

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

Open `.env` and fill in the following:

- **Auth.js**: Generate `AUTH_SECRET` using `openssl rand -base64 32`.
- **API Keys**: Configure GitHub, Turnstile and Telegram tokens.
- **AI Assistant**: Set `GOOGLE_GENERATIVE_AI_API_KEY` (Gemini) to enable the assistant. `TYPESAFE_AI_API_KEY` or `AI_GATEWAY_API_KEY` is optional and enables the Jev "System One" layer. See [docs/ai-assistant.md](./docs/ai-assistant.md).
- **Database**: The default `DATABASE_URL` in `.env.example` points to the local Docker container (Port 5433).

### 4. Start Local Services (Docker)

Spin up the PostgreSQL and MinIO containers:

```bash
docker-compose up -d
```

### 5. Database Initialization

Since the project uses `pgvector` for AI features, the extension must be enabled.

**Enable pgvector (Local Only):**

```bash
docker exec -it autumnnus_postgres psql -U postgres -d autumnnus_portfolio -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

**Sync Schema & Seed:**

```bash
yarn db:push
yarn db:seed
yarn ai:reindex   # build the assistant's knowledge index (needs GOOGLE_GENERATIVE_AI_API_KEY)
```

### 6. Start Development Server

```bash
yarn dev
```

The application will be available at `http://localhost:3001`.

### AI Assistant

- `GOOGLE_GENERATIVE_AI_API_KEY`: Gemini key used for chat and embeddings. The fast/deep chat models are chosen in **Admin > AI Assistant**, where each option shows its price.
- `TYPESAFE_AI_API_KEY` or `AI_GATEWAY_API_KEY` (optional): enables Jev for routing, guardrails, relevance judging and source attribution. Without it the assistant falls back to heuristics, plus Gemini for latency-insensitive checks.
- The knowledge index updates automatically when content is saved in the admin. Run a full check with `yarn ai:reindex` or from **Admin > AI Assistant**.
- Settings (on/off, daily limits, retention) live in **Admin > AI Assistant**.

---

## Deployment (Production)

### Coolify (Dockerfile Recommended)

Use the repository `Dockerfile` for deployment in Coolify. This avoids Nixpacks `apt-get` network issues on some hosts.

1.  Connect your repository to Coolify.
2.  Set the **Build Pack** to `Dockerfile` (or enable Dockerfile auto-detection).
3.  Configure all environment variables in the Coolify dashboard. Be sure to define `SERVICE_FQDN_APP` and `SERVICE_URL_APP`.
4.  **pgvector**: production PostgreSQL must have the `pgvector` extension available (e.g. the `pgvector/pgvector:pg15` image). The migration enables it.
5.  **Migrations**: back up first (`pg_dump`), then run from your machine against the production `DATABASE_URL` (via SSH tunnel if the DB is private):
    ```bash
    DATABASE_URL="postgresql://…prod…" yarn db:migrate:safe --dry-run   # inspect
    DATABASE_URL="postgresql://…prod…" yarn db:migrate:safe --yes       # apply
    ```
    The script baselines databases created with `db:push`. It then applies `0003` (drops the legacy AI tables, including the old `Embedding` vector data), `0004` (assistant tables) and `0005` (model settings, per-visitor grouping), and verifies the result. All three are idempotent.
    After that, open **Admin > AI Assistant** and click **Rebuild everything** to build the knowledge index.
6.  **Analytics (Production):** Make sure to configure `NEXT_PUBLIC_UMAMI_URL` and `NEXT_PUBLIC_UMAMI_ID` to receive statistics directly in the admin panel.

---

## Useful Commands

| Command          | Description                                 |
| :--------------- | :------------------------------------------ |
| `yarn dev`       | Starts the development server               |
| `yarn db:push`   | Syncs schema changes directly to the DB     |
| `yarn db:seed`   | Populates the database with initial data    |
| `yarn db:studio` | Opens Drizzle Studio (GUI for the database) |
| `yarn lint`      | Runs ESLint                                 |
| `yarn build`     | Builds the production bundle                |
| `yarn db:migrate:safe` | Safe migration runner (baseline + migrate + verify; `--dry-run`, `--yes`) |
| `yarn ai:reindex` | Syncs the assistant's knowledge index (`--force` re-embeds all) |
| `yarn ai:eval`   | Retrieval ablation: lexical / vector / hybrid / hybrid+Jev |
| `yarn test:ai`   | Unit tests for the AI layer                 |

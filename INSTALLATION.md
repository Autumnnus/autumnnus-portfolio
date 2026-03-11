# Installation Guide

This guide contains the necessary steps to successfully install and run the **Autumnnus Portfolio** project on your local system (localhost) or production environment.

## Prerequisites

- **Node.js**: v18+ (v20+ recommended)
- **Package Manager**: Yarn (recommended) or npm
- **Docker**: For running PostgreSQL (with pgvector), MinIO, and Redis locally
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
- **API Keys**: Configure GitHub, Turnstile, Telegram tokens, and the Gemini key-pool encryption secret.
- **Redis**: `REDIS_URL` defaults to the local shared Redis container (`redis://127.0.0.1:6379`).
- **Database**: The default `DATABASE_URL` in `.env.example` points to the local Docker container (Port 5433).

### 4. Start Local Services (Docker)

Spin up the PostgreSQL, MinIO, and Redis containers:

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
```

### 6. Start Development Server

```bash
yarn dev
```

The application will be available at `http://localhost:3001`.

### Gemini Key Pool

- Gemini API keys are now managed from the admin panel instead of a single `.env` key.
- Add one or more keys under **Admin > AI Configuration**.
- Set `quotaGroup` per Google Cloud project. Keys from the same Gemini project must share the same `quotaGroup`.
- Runtime rate-limit blocks are stored in Redis, so other local projects can reuse the same Redis instance through `REDIS_URL`.

---

## Deployment (Production)

### Coolify & Nixpacks

The project is optimized for **Coolify** using **Nixpacks**.

1.  Connect your repository to Coolify.
2.  Set the **Build Pack** to `Nixpacks`.
3.  Configure all environment variables in the Coolify dashboard. Be sure to define `SERVICE_FQDN_APP`, `SERVICE_URL_APP`, and explicitly set `NIXPACKS_NODE_VERSION=22.13.0` (or higher) to avoid build errors.
4.  **Important**: Ensure your production PostgreSQL database has the `pgvector` extension installed. You may need to run `CREATE EXTENSION IF NOT EXISTS vector;` manually once in your production DB.
5.  **Analytics (Production):** Make sure to configure `NEXT_PUBLIC_UMAMI_URL` and `NEXT_PUBLIC_UMAMI_ID` to receive statistics directly in the admin panel.

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

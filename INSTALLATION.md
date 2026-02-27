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
- **API Keys**: Configure GitHub, Gemini, Turnstile, and Telegram tokens.
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
```

### 6. Start Development Server

```bash
yarn dev
```

The application will be available at `http://localhost:3001`.

---

## Deployment (Production)

### Coolify & Nixpacks

The project is optimized for **Coolify** using **Nixpacks**.

1.  Connect your repository to Coolify.
2.  Set the **Build Pack** to `Nixpacks`.
3.  Configure all environment variables in the Coolify dashboard.
4.  **Important**: Ensure your production PostgreSQL database has the `pgvector` extension installed. You may need to run `CREATE EXTENSION IF NOT EXISTS vector;` manually once in your production DB.

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

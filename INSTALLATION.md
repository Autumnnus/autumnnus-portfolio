# Installation Guide

This guide contains the necessary steps to successfully install and run the **Autumnnus Portfolio** project on your local system (localhost).

## Prerequisites

- Node.js (v18+)
- Yarn or npm package manager
- Docker and Docker Compose (To spin up PostgreSQL and MinIO databases)
- Git

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repo_url>
cd autumnnus-portfolio
```

### 2. Install Dependencies

The project is configured to use `yarn` for dependency management.

```bash
yarn install
```

### 3. Set Up Environment Variables

Create a new file named `.env` in the root directory by copying the `.env.example` file:

```bash
cp .env.example .env
```

Then, open the `.env` file in a code editor and configure the necessary keys (Telegram tokens, GitHub Client ID, Gemini Key, etc.) according to your setup:

- **Database:** You do not need to change the username, password, or local connection URL; they are automatically configured via `docker-compose`.
- **MinIO (Image/Object Storage):** Contains the bucket credentials where portfolio images will be stored. You can use defaults for local development.
- **Auth.js:** Used for comment infrastructure and Admin privileges. Generate a random secret for `AUTH_SECRET` and specify the admin email in `NEXT_PUBLIC_ADMIN_EMAIL`.
- **Turnstile:** Cloudflare's free API endpoint keys to prevent spam bots.
- **Telegram & Gemini:** For AI features and Notification integrations within the project.

## Deployment (Coolify & Nixpacks)

This project is optimized for deployment on **Coolify** using **Nixpacks**. Nixpacks will automatically detect the Next.js environment and handle the build process.

1.  Connect your repository to Coolify.
2.  Set the **Build Pack** to `Nixpacks`.
3.  Configure your environment variables in the Coolify dashboard (copy from `.env.example`).
4.  Coolify will build and serve the application automatically.

### Running Locally

To run the project locally for development:

1.  **Clone & Install:**

    ```bash
    git clone <repo_url>
    cd autumnnus-portfolio
    yarn install
    ```

2.  **Environment Variables:**
    Copy `.env.example` to `.env` and fill in your local Postgres and MinIO credentials.

3.  **Start Local Services (Docker):**
    Run Postgres and MinIO using the provided `docker-compose.yml`:

    ```bash
    docker-compose up -d
    ```

4.  **Database Setup:**

    ```bash
    yarn db:generate
    yarn db:push
    npx tsx lib/db/seed.ts
    ```

5.  **Start Development Server:**
    ```bash
    yarn dev
    ```

## Useful Drizzle Commands

When you make changes to `lib/db/schema.ts`, use these commands:

| Command                  | Description                                                               |
| ------------------------ | ------------------------------------------------------------------------- |
| `yarn db:push`           | Syncs schema changes directly to the DB without migrations (Development). |
| `yarn db:migrate`        | Creates a migration file and applies it (Production/Stable changes).      |
| `yarn db:generate`       | Generates migration files based on schema changes.                        |
| `yarn db:studio`         | Opens a web browser GUI to view/edit your database data.                  |
| `yarn db:validate`       | Checks if your types are valid.                                           |
| `npx tsx lib/db/seed.ts` | Populates the database with initial data (Profile, Settings, etc.).       |

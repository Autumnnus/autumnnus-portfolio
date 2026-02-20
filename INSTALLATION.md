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

### 4. Start the Database and MinIO

Spin up the PostgreSQL and MinIO services in the background using `docker-compose.yml` located in the root folder:

```bash
docker-compose up -d
```

_Note: Make sure the containers are running successfully using Docker Desktop or the `docker ps` command._

### 5. Push Prisma Schema and Generate Client

Since you just set up the database locally, you need to push the project schemas to the SQL database and generate the Prisma Client for the application:

```bash
yarn prisma generate
yarn prisma db push
```

### 6. Seed the Database (Optional)

If you want to populate the database with basic default projects, skills, or profile data when trying the project for the first time:

```bash
yarn seed
```

### 7. Run the Project

Once all the steps are complete, you can start the Next.js development server:

```bash
yarn dev
```

You're all set! 🎉 You can now view your portfolio by navigating to `http://localhost:3001`.

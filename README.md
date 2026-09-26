# Autumnnus Portfolio

Autumnnus Portfolio is a modern, full-featured, multi-lingual (i18n), and AI-powered personal portfolio and blog application. It includes dynamic modules for showcasing your projects and publishing blog posts.

## ✨ Features

- **Modular Modern Interface:** Fully responsive UI designed with Next.js (App Router), Tailwind CSS, and Framer Motion. Uses Radix UI Primitives for enhanced accessibility.
- **Multi-language (i18n) Support:** Localization with `next-intl` (English, Turkish, etc.).
- **Database & ORM:** Type-safe database interactions with PostgreSQL and Drizzle ORM.
- **Role-based Authentication:** Different roles like Admin and Visitor (e.g., GitHub Auth) using Auth.js.
- **Object Storage (S3 Compatible):** Storing images, media, and other files locally or on your own server with MinIO.
- **AI Assistant ("Autumn"):** A grounded agent built on Vercel AI SDK 7 (`ToolLoopAgent`). It uses typed tools and hybrid retrieval: Postgres FTS plus pgvector, fused with RRF. A "System One" decision layer (TypeSafe AI's Jev) handles routing, guardrails, relevance judging and source attribution. The UI streams generative cards, shows a live "how I found this" trace and asks for approval before sending messages. See [docs/ai-assistant.md](./docs/ai-assistant.md).
- **Rich Text Editor & Comments:** Interactive commenting, liking, and Tiptap rich text editor for blog and project detail pages (Includes source code highlighting using Shiki).
- **Telegram Notifications & Visitor Tier System:** A dynamic notification system that interacts with a Telegram bot to inform the admin about visitor milestones and overall visitor count.
- **Security & Bot Protection:** Cloudflare Turnstile integration to prevent spam comments and form submissions.
- **Analytics & Tracking:** Integrated Umami Analytics for privacy-focused usage tracking and admin panel statistics.
- **Interactive UI Elements:** Beautiful interface additions such as a GitHub-style Activity Calendar, dynamic Carousels, and seasonal visual effects.

---

## 🚀 Installation & Setup

To install the project on your local machine, configure environment variables in detail, and spin up PostgreSQL and MinIO Docker containers, please check out our comprehensive **Installation Guide**. You will find a step-by-step tutorial suited for setting up the application for the first time.

👉 [**Click Here for the Installation Guide (INSTALLATION.md)**](./INSTALLATION.md)

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router), React 19
- **Styling & Animation:** Tailwind CSS v4, Framer Motion, Radix UI Primitives, Lucide Icons
- **Backend & Database:** Node.js, PostgreSQL (+ pgvector), Drizzle ORM, MinIO
- **Security & Auth:** Auth.js (NextAuth), Cloudflare Turnstile
- **Language & Forms:** `next-intl`, React Hook Form, Zod
- **AI:** Vercel AI SDK 7 (`ai`, `@ai-sdk/react`), Google Gemini (`@ai-sdk/google`), TypeSafe Jev (`@ai-sdk/typesafe-ai` / AI Gateway)

## 📄 License

This project is licensed under the MIT License. You can freely fork and adapt it for your own use, giving appropriate credit.

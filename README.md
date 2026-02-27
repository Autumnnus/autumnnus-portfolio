# Autumnnus Portfolio

Autumnnus Portfolio is a modern, full-featured, multi-lingual (i18n), and AI-powered personal portfolio and blog application. It includes dynamic modules for showcasing your projects and publishing blog posts.

## ✨ Features

- **Modular Modern Interface:** Fully responsive UI designed with Next.js (App Router), Tailwind CSS, and Framer Motion. Uses Radix UI Primitives for enhanced accessibility.
- **Multi-language (i18n) Support:** Localization with `next-intl` (English, Turkish, etc.).
- **Database & ORM:** Type-safe database interactions with PostgreSQL and Drizzle ORM.
- **Role-based Authentication:** Different roles like Admin and Visitor (e.g., GitHub Auth) using Auth.js.
- **Object Storage (S3 Compatible):** Storing images, media, and other files locally or on your own server with MinIO.
- **Artificial Intelligence (AI) Integration:** Smart operations (AI Actions) powered by Google Gemini API.
- **Rich Text Editor & Comments:** Interactive commenting, liking, and Tiptap rich text editor for blog and project detail pages.
- **Telegram Notifications & Visitor Tier System:** A dynamic notification system that interacts with a Telegram bot to inform the admin about visitor milestones and overall visitor count.
- **Security & Bot Protection:** Cloudflare Turnstile integration to prevent spam comments and form submissions.

---

## 🚀 Installation & Setup

To install the project on your local machine, configure environment variables in detail, and spin up PostgreSQL and MinIO Docker containers, please check out our comprehensive **Installation Guide**. You will find a step-by-step tutorial suited for setting up the application for the first time.

👉 [**Click Here for the Installation Guide (INSTALLATION.md)**](./INSTALLATION.md)

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router), React 19
- **Styling & Animation:** Tailwind CSS v4, Framer Motion, Radix UI Primitives, Lucide Icons
- **Backend & Database:** Node.js, PostgreSQL, Drizzle ORM, MinIO
- **Security & Auth:** Auth.js (NextAuth), Cloudflare Turnstile
- **Language & Forms:** `next-intl`, React Hook Form, Zod
- **AI Integration:** `@google/generative-ai`

## 📄 License

This project is licensed under the MIT License. You can freely fork and adapt it for your own use, giving appropriate credit.

-- Removes the legacy Gemini AI stack: old embeddings (vector data), chat logs,
-- live-chat config and the encrypted API-key pool. Idempotent.
DROP TABLE IF EXISTS "AiApiKey" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "AiChatMessage" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "AiChatSession" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "ChatRateLimit" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "Embedding" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "LiveChatConfig" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "LiveChatGreeting" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "LiveChatGreetingTranslation" CASCADE;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."AiProvider";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."ApiKeyCategory";
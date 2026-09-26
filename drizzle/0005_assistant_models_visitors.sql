ALTER TABLE "AssistantSettings" ADD COLUMN IF NOT EXISTS "modelFast" text DEFAULT 'gemini-3.5-flash-lite' NOT NULL;--> statement-breakpoint
ALTER TABLE "AssistantSettings" ADD COLUMN IF NOT EXISTS "modelDeep" text DEFAULT 'gemini-3.8-flash' NOT NULL;--> statement-breakpoint
ALTER TABLE "AssistantThread" ADD COLUMN IF NOT EXISTS "ipKey" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AssistantThread_ipKey_index" ON "AssistantThread" USING btree ("ipKey");
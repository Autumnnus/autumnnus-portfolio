ALTER TABLE "AssistantSettings" ADD COLUMN "modelFast" text DEFAULT 'gemini-3.5-flash-lite' NOT NULL;--> statement-breakpoint
ALTER TABLE "AssistantSettings" ADD COLUMN "modelDeep" text DEFAULT 'gemini-3.8-flash' NOT NULL;--> statement-breakpoint
ALTER TABLE "AssistantThread" ADD COLUMN "ipKey" text;--> statement-breakpoint
CREATE INDEX "AssistantThread_ipKey_index" ON "AssistantThread" USING btree ("ipKey");
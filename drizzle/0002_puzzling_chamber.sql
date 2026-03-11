CREATE TYPE "public"."AiProvider" AS ENUM('gemini');--> statement-breakpoint
CREATE TYPE "public"."ApiKeyCategory" AS ENUM('free', 'paid');--> statement-breakpoint
CREATE TABLE "AiApiKey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "AiProvider" NOT NULL,
	"label" text NOT NULL,
	"encryptedKey" text NOT NULL,
	"keyFingerprint" text NOT NULL,
	"category" "ApiKeyCategory" NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"quotaGroup" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "AiApiKey_provider_keyFingerprint_unique" UNIQUE("provider","keyFingerprint")
);
--> statement-breakpoint
CREATE INDEX "AiApiKey_provider_category_priority_index" ON "AiApiKey" USING btree ("provider","category","priority");--> statement-breakpoint
CREATE INDEX "AiApiKey_provider_isActive_index" ON "AiApiKey" USING btree ("provider","isActive");
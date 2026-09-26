CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."KnowledgeSourceType" AS ENUM('project', 'blog', 'experience', 'profile');--> statement-breakpoint
CREATE TABLE "AssistantMessage" (
	"id" text NOT NULL,
	"threadId" text NOT NULL,
	"role" text NOT NULL,
	"parts" jsonb NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "AssistantMessage_threadId_id_pk" PRIMARY KEY("threadId","id")
);
--> statement-breakpoint
CREATE TABLE "AssistantRateLimit" (
	"key" text NOT NULL,
	"window" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "AssistantRateLimit_key_window_pk" PRIMARY KEY("key","window")
);
--> statement-breakpoint
CREATE TABLE "AssistantSettings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"visitorDailyLimit" integer DEFAULT 40 NOT NULL,
	"globalDailyLimit" integer DEFAULT 1500 NOT NULL,
	"retentionDays" integer DEFAULT 90 NOT NULL,
	"lastMaintenanceAt" timestamp,
	"lastIndexReport" jsonb,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AssistantThread" (
	"id" text PRIMARY KEY NOT NULL,
	"visitorId" text NOT NULL,
	"language" "Language" NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"entryPath" text,
	"messageCount" integer DEFAULT 0 NOT NULL,
	"inputTokens" integer DEFAULT 0 NOT NULL,
	"outputTokens" integer DEFAULT 0 NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastMessageAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "KnowledgeChunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documentId" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"heading" text,
	"content" text NOT NULL,
	"tokenCount" integer NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"searchVector" "tsvector" NOT NULL,
	CONSTRAINT "KnowledgeChunk_documentId_ordinal_unique" UNIQUE("documentId","ordinal")
);
--> statement-breakpoint
CREATE TABLE "KnowledgeDocument" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sourceType" "KnowledgeSourceType" NOT NULL,
	"sourceId" text NOT NULL,
	"language" "Language" NOT NULL,
	"title" text NOT NULL,
	"path" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"contentHash" text NOT NULL,
	"embeddingModel" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"chunkCount" integer DEFAULT 0 NOT NULL,
	"indexedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "KnowledgeDocument_sourceType_sourceId_language_unique" UNIQUE("sourceType","sourceId","language")
);
--> statement-breakpoint
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_threadId_AssistantThread_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."AssistantThread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_documentId_KnowledgeDocument_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."KnowledgeDocument"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "AssistantMessage_threadId_createdAt_index" ON "AssistantMessage" USING btree ("threadId","createdAt");--> statement-breakpoint
CREATE INDEX "AssistantThread_visitorId_index" ON "AssistantThread" USING btree ("visitorId");--> statement-breakpoint
CREATE INDEX "AssistantThread_lastMessageAt_index" ON "AssistantThread" USING btree ("lastMessageAt");--> statement-breakpoint
CREATE INDEX "KnowledgeChunk_embedding_hnsw" ON "KnowledgeChunk" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "KnowledgeChunk_searchVector_gin" ON "KnowledgeChunk" USING gin ("searchVector");--> statement-breakpoint
CREATE INDEX "KnowledgeDocument_embedding_hnsw" ON "KnowledgeDocument" USING hnsw ("embedding" vector_cosine_ops);
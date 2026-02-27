CREATE TYPE "public"."Language" AS ENUM('tr', 'en', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'ko', 'ar', 'zh');--> statement-breakpoint
CREATE TABLE "_ProjectToSkill" (
	"A" uuid NOT NULL,
	"B" uuid NOT NULL,
	CONSTRAINT "_ProjectToSkill_A_B_unique" UNIQUE("A","B")
);
--> statement-breakpoint
CREATE TABLE "AiChatMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionId" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AiChatSession" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ipAddress" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AuditLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"entityType" text NOT NULL,
	"entityId" text NOT NULL,
	"details" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "BlogPost" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"coverImage" text,
	"featured" boolean DEFAULT false NOT NULL,
	"tags" text[],
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"category" text,
	"commentsEnabled" boolean DEFAULT true NOT NULL,
	"imageAlt" text,
	"publishedAt" timestamp,
	"status" text DEFAULT 'draft' NOT NULL,
	CONSTRAINT "BlogPost_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "BlogPostTranslation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language" "Language" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"readTime" text NOT NULL,
	"date" text NOT NULL,
	"blogPostId" uuid NOT NULL,
	"excerpt" text,
	"keywords" text[] DEFAULT '{}' NOT NULL,
	"metaDescription" text,
	"metaTitle" text,
	CONSTRAINT "BlogPostTranslation_blogPostId_language_unique" UNIQUE("blogPostId","language")
);
--> statement-breakpoint
CREATE TABLE "ChatRateLimit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ipAddress" text NOT NULL,
	"date" timestamp NOT NULL,
	"requestCount" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ChatRateLimit_ipAddress_date_unique" UNIQUE("ipAddress","date")
);
--> statement-breakpoint
CREATE TABLE "Comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"authorName" text NOT NULL,
	"authorEmail" text NOT NULL,
	"approved" boolean DEFAULT true NOT NULL,
	"blogPostId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text DEFAULT '0.0.0.0' NOT NULL,
	"projectId" uuid,
	"isAdmin" boolean DEFAULT false NOT NULL,
	"parentId" uuid
);
--> statement-breakpoint
CREATE TABLE "Embedding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sourceType" text NOT NULL,
	"sourceId" text NOT NULL,
	"language" text NOT NULL,
	"chunkText" text NOT NULL,
	"chunkIndex" integer NOT NULL,
	"embedding" vector(768),
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Embedding_sourceType_sourceId_language_chunkIndex_unique" UNIQUE("sourceType","sourceId","language","chunkIndex")
);
--> statement-breakpoint
CREATE TABLE "Like" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ipAddress" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"blogPostId" uuid,
	"projectId" uuid,
	CONSTRAINT "Like_ipAddress_blogPostId_unique" UNIQUE("ipAddress","blogPostId"),
	CONSTRAINT "Like_ipAddress_projectId_unique" UNIQUE("ipAddress","projectId")
);
--> statement-breakpoint
CREATE TABLE "LiveChatConfig" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"allowedPaths" text[] DEFAULT '{}' NOT NULL,
	"excludedPaths" text[] DEFAULT '{}' NOT NULL,
	"pingSoundUrl" text,
	"notificationSoundUrl" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LiveChatGreeting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pathname" text NOT NULL,
	"configId" uuid NOT NULL,
	CONSTRAINT "LiveChatGreeting_pathname_unique" UNIQUE("pathname")
);
--> statement-breakpoint
CREATE TABLE "LiveChatGreetingTranslation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language" "Language" NOT NULL,
	"text" text NOT NULL,
	"quickAnswers" text[] DEFAULT '{}' NOT NULL,
	"greetingId" uuid NOT NULL,
	CONSTRAINT "LiveChatGreetingTranslation_greetingId_language_unique" UNIQUE("greetingId","language")
);
--> statement-breakpoint
CREATE TABLE "Profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"avatar" text,
	"email" text NOT NULL,
	"github" text NOT NULL,
	"linkedin" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProfileTranslation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language" "Language" NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"greetingText" text NOT NULL,
	"description" text NOT NULL,
	"aboutTitle" text NOT NULL,
	"aboutDescription" text NOT NULL,
	"profileId" uuid NOT NULL,
	CONSTRAINT "ProfileTranslation_profileId_language_unique" UNIQUE("profileId","language")
);
--> statement-breakpoint
CREATE TABLE "Project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"status" text NOT NULL,
	"category" text NOT NULL,
	"github" text,
	"liveDemo" text,
	"featured" boolean DEFAULT false NOT NULL,
	"coverImage" text,
	"images" text[],
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"imageAlt" text,
	CONSTRAINT "Project_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ProjectTranslation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language" "Language" NOT NULL,
	"title" text NOT NULL,
	"shortDescription" text NOT NULL,
	"fullDescription" text NOT NULL,
	"projectId" uuid NOT NULL,
	"keywords" text[] DEFAULT '{}' NOT NULL,
	"metaDescription" text,
	"metaTitle" text,
	CONSTRAINT "ProjectTranslation_projectId_language_unique" UNIQUE("projectId","language")
);
--> statement-breakpoint
CREATE TABLE "Quest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"profileId" uuid
);
--> statement-breakpoint
CREATE TABLE "QuestTranslation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language" "Language" NOT NULL,
	"title" text NOT NULL,
	"questId" uuid NOT NULL,
	CONSTRAINT "QuestTranslation_questId_language_unique" UNIQUE("questId","language")
);
--> statement-breakpoint
CREATE TABLE "Skill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	CONSTRAINT "Skill_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "SocialLink" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"href" text NOT NULL,
	"icon" text NOT NULL,
	CONSTRAINT "SocialLink_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "UniqueVisitor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ipAddress" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UniqueVisitor_ipAddress_unique" UNIQUE("ipAddress")
);
--> statement-breakpoint
CREATE TABLE "View" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ipAddress" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"blogPostId" uuid,
	"projectId" uuid
);
--> statement-breakpoint
CREATE TABLE "VisitorMilestone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"count" integer NOT NULL,
	"reachedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "VisitorMilestone_count_unique" UNIQUE("count")
);
--> statement-breakpoint
CREATE TABLE "WorkExperience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text NOT NULL,
	"logo" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"startDate" timestamp,
	"endDate" timestamp
);
--> statement-breakpoint
CREATE TABLE "WorkExperienceTranslation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language" "Language" NOT NULL,
	"role" text NOT NULL,
	"description" text NOT NULL,
	"locationType" text NOT NULL,
	"workExperienceId" uuid NOT NULL,
	CONSTRAINT "WorkExperienceTranslation_workExperienceId_language_unique" UNIQUE("workExperienceId","language")
);
--> statement-breakpoint
ALTER TABLE "_ProjectToSkill" ADD CONSTRAINT "_ProjectToSkill_A_Project_id_fk" FOREIGN KEY ("A") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_ProjectToSkill" ADD CONSTRAINT "_ProjectToSkill_B_Skill_id_fk" FOREIGN KEY ("B") REFERENCES "public"."Skill"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AiChatMessage" ADD CONSTRAINT "AiChatMessage_sessionId_AiChatSession_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."AiChatSession"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BlogPostTranslation" ADD CONSTRAINT "BlogPostTranslation_blogPostId_BlogPost_id_fk" FOREIGN KEY ("blogPostId") REFERENCES "public"."BlogPost"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_blogPostId_BlogPost_id_fk" FOREIGN KEY ("blogPostId") REFERENCES "public"."BlogPost"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Like" ADD CONSTRAINT "Like_blogPostId_BlogPost_id_fk" FOREIGN KEY ("blogPostId") REFERENCES "public"."BlogPost"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Like" ADD CONSTRAINT "Like_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "LiveChatGreeting" ADD CONSTRAINT "LiveChatGreeting_configId_LiveChatConfig_id_fk" FOREIGN KEY ("configId") REFERENCES "public"."LiveChatConfig"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "LiveChatGreetingTranslation" ADD CONSTRAINT "LiveChatGreetingTranslation_greetingId_LiveChatGreeting_id_fk" FOREIGN KEY ("greetingId") REFERENCES "public"."LiveChatGreeting"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProfileTranslation" ADD CONSTRAINT "ProfileTranslation_profileId_Profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectTranslation" ADD CONSTRAINT "ProjectTranslation_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_profileId_Profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "QuestTranslation" ADD CONSTRAINT "QuestTranslation_questId_Quest_id_fk" FOREIGN KEY ("questId") REFERENCES "public"."Quest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "View" ADD CONSTRAINT "View_blogPostId_BlogPost_id_fk" FOREIGN KEY ("blogPostId") REFERENCES "public"."BlogPost"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "View" ADD CONSTRAINT "View_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "WorkExperienceTranslation" ADD CONSTRAINT "WorkExperienceTranslation_workExperienceId_WorkExperience_id_fk" FOREIGN KEY ("workExperienceId") REFERENCES "public"."WorkExperience"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "_ProjectToSkill_B_index" ON "_ProjectToSkill" USING btree ("B");--> statement-breakpoint
CREATE INDEX "AiChatSession_ipAddress_index" ON "AiChatSession" USING btree ("ipAddress");
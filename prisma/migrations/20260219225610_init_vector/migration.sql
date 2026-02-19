-- CreateEnum
CREATE TYPE "Language" AS ENUM ('tr', 'en', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'ko', 'ar', 'zh');

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "github" TEXT,
    "liveDemo" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "coverImage" TEXT,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageAlt" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTranslation" (
    "id" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metaDescription" TEXT,
    "metaTitle" TEXT,

    CONSTRAINT "ProjectTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coverImage" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" TEXT,
    "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "imageAlt" TEXT,
    "publishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostTranslation" (
    "id" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readTime" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "excerpt" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metaDescription" TEXT,
    "metaTitle" TEXT,

    CONSTRAINT "BlogPostTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "blogPostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL DEFAULT '0.0.0.0',
    "projectId" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blogPostId" TEXT,
    "projectId" TEXT,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "View" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blogPostId" TEXT,
    "projectId" TEXT,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkExperience" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "WorkExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkExperienceTranslation" (
    "id" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "role" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "locationType" TEXT NOT NULL,
    "workExperienceId" TEXT NOT NULL,

    CONSTRAINT "WorkExperienceTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "github" TEXT NOT NULL,
    "linkedin" TEXT NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileTranslation" (
    "id" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "greetingText" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "aboutTitle" TEXT NOT NULL,
    "aboutDescription" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "ProfileTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniqueVisitor" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniqueVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorMilestone" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "reachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "chunkText" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "embedding" vector(768),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRateLimit" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChatRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProjectToSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectToSkill_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_key_key" ON "Skill"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTranslation_projectId_language_key" ON "ProjectTranslation"("projectId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostTranslation_blogPostId_language_key" ON "BlogPostTranslation"("blogPostId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "Like_ipAddress_blogPostId_key" ON "Like"("ipAddress", "blogPostId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_ipAddress_projectId_key" ON "Like"("ipAddress", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkExperienceTranslation_workExperienceId_language_key" ON "WorkExperienceTranslation"("workExperienceId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "SocialLink_key_key" ON "SocialLink"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileTranslation_profileId_language_key" ON "ProfileTranslation"("profileId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "UniqueVisitor_ipAddress_key" ON "UniqueVisitor"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorMilestone_count_key" ON "VisitorMilestone"("count");

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_sourceType_sourceId_language_chunkIndex_key" ON "Embedding"("sourceType", "sourceId", "language", "chunkIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRateLimit_ipAddress_date_key" ON "ChatRateLimit"("ipAddress", "date");

-- CreateIndex
CREATE INDEX "_ProjectToSkill_B_index" ON "_ProjectToSkill"("B");

-- AddForeignKey
ALTER TABLE "ProjectTranslation" ADD CONSTRAINT "ProjectTranslation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostTranslation" ADD CONSTRAINT "BlogPostTranslation_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkExperienceTranslation" ADD CONSTRAINT "WorkExperienceTranslation_workExperienceId_fkey" FOREIGN KEY ("workExperienceId") REFERENCES "WorkExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileTranslation" ADD CONSTRAINT "ProfileTranslation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToSkill" ADD CONSTRAINT "_ProjectToSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToSkill" ADD CONSTRAINT "_ProjectToSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

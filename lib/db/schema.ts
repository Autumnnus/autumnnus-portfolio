import { relations } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  json,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

export const languageEnum = pgEnum("Language", [
  "tr",
  "en",
  "de",
  "fr",
  "es",
  "it",
  "pt",
  "ru",
  "ja",
  "ko",
  "ar",
  "zh",
]);

export const Language = {
  tr: "tr",
  en: "en",
  de: "de",
  fr: "fr",
  es: "es",
  it: "it",
  pt: "pt",
  ru: "ru",
  ja: "ja",
  ko: "ko",
  ar: "ar",
  zh: "zh",
} as const;

export type LanguageType = (typeof Language)[keyof typeof Language];

export const knowledgeSourceTypeEnum = pgEnum("KnowledgeSourceType", [
  "project",
  "blog",
  "experience",
  "profile",
]);

/** Must match the `dimensions` of every vector column below. */
export const EMBEDDING_DIMENSIONS = 1536;

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const category = pgTable("Category", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").$type<"project" | "blog">().notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const skill = pgTable("Skill", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
});

export const project = pgTable("Project", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull(),
  categoryId: uuid("categoryId").references(() => category.id, {
    onDelete: "set null",
  }),
  github: text("github"),
  liveDemo: text("liveDemo"),
  featured: boolean("featured").default(false).notNull(),
  coverImage: text("coverImage"),
  images: text("images").array(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  imageAlt: text("imageAlt"),
});

// Explicit many-to-many relationship table between Project and Skill
export const _projectToSkill = pgTable(
  "_ProjectToSkill",
  {
    A: uuid("A")
      .notNull()
      .references(() => project.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    B: uuid("B")
      .notNull()
      .references(() => skill.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (t) => ({
    abUnique: unique().on(t.A, t.B),
    bIndex: index().on(t.B),
  }),
);

export const projectTranslation = pgTable(
  "ProjectTranslation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    language: languageEnum("language").notNull(),
    title: text("title").notNull(),
    shortDescription: text("shortDescription").notNull(),
    fullDescription: text("fullDescription").notNull(),
    projectId: uuid("projectId")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    keywords: text("keywords").array().default([]).notNull(),
    metaDescription: text("metaDescription"),
    metaTitle: text("metaTitle"),
  },
  (t) => ({
    unq: unique().on(t.projectId, t.language),
  }),
);

export const blogPost = pgTable("BlogPost", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  coverImage: text("coverImage"),
  featured: boolean("featured").default(false).notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  categoryId: uuid("categoryId").references(() => category.id, {
    onDelete: "set null",
  }),
  commentsEnabled: boolean("commentsEnabled").default(true).notNull(),
  imageAlt: text("imageAlt"),
  publishedAt: timestamp("publishedAt", { mode: "date" }),
  status: text("status").default("draft").notNull(),
});

export const blogPostTranslation = pgTable(
  "BlogPostTranslation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    language: languageEnum("language").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    content: text("content").notNull(),
    readTime: text("readTime").notNull(),
    date: text("date").notNull(),
    blogPostId: uuid("blogPostId")
      .notNull()
      .references(() => blogPost.id, { onDelete: "cascade" }),
    excerpt: text("excerpt"),
    keywords: text("keywords").array().default([]).notNull(),
    metaDescription: text("metaDescription"),
    metaTitle: text("metaTitle"),
  },
  (t) => ({
    unq: unique().on(t.blogPostId, t.language),
  }),
);

export const comment = pgTable("Comment", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  authorName: text("authorName").notNull(),
  authorEmail: text("authorEmail").notNull(),
  approved: boolean("approved").default(true).notNull(),
  blogPostId: uuid("blogPostId").references(() => blogPost.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  ipAddress: text("ipAddress").default("0.0.0.0").notNull(),
  projectId: uuid("projectId").references(() => project.id, {
    onDelete: "cascade",
  }),
  isAdmin: boolean("isAdmin").default(false).notNull(),
  parentId: uuid("parentId"), // SELF-REFERENCE
});

export const like = pgTable(
  "Like",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ipAddress: text("ipAddress").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    blogPostId: uuid("blogPostId").references(() => blogPost.id, {
      onDelete: "cascade",
    }),
    projectId: uuid("projectId").references(() => project.id, {
      onDelete: "cascade",
    }),
  },
  (t) => ({
    unqPost: unique().on(t.ipAddress, t.blogPostId),
    unqProj: unique().on(t.ipAddress, t.projectId),
  }),
);

export const view = pgTable("View", {
  id: uuid("id").primaryKey().defaultRandom(),
  ipAddress: text("ipAddress").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  blogPostId: uuid("blogPostId").references(() => blogPost.id, {
    onDelete: "cascade",
  }),
  projectId: uuid("projectId").references(() => project.id, {
    onDelete: "cascade",
  }),
});

export const workExperience = pgTable("WorkExperience", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: text("company").notNull(),
  logo: text("logo"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  startDate: timestamp("startDate", { mode: "date" }),
  endDate: timestamp("endDate", { mode: "date" }),
});

export const workExperienceTranslation = pgTable(
  "WorkExperienceTranslation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    language: languageEnum("language").notNull(),
    role: text("role").notNull(),
    description: text("description").notNull(),
    locationType: text("locationType").notNull(),
    workExperienceId: uuid("workExperienceId")
      .notNull()
      .references(() => workExperience.id, { onDelete: "cascade" }),
  },
  (t) => ({
    unq: unique().on(t.workExperienceId, t.language),
  }),
);

export const socialLink = pgTable("SocialLink", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  href: text("href").notNull(),
  icon: text("icon").notNull(),
});

export const profile = pgTable("Profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  avatar: text("avatar"),
  email: text("email").notNull(),
  github: text("github").notNull(),
  linkedin: text("linkedin").notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const profileTranslation = pgTable(
  "ProfileTranslation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    language: languageEnum("language").notNull(),
    name: text("name").notNull(),
    title: text("title").notNull(),
    greetingText: text("greetingText").notNull(),
    description: text("description").notNull(),
    aboutTitle: text("aboutTitle").notNull(),
    aboutDescription: text("aboutDescription").notNull(),
    profileId: uuid("profileId")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
  },
  (t) => ({
    unq: unique().on(t.profileId, t.language),
  }),
);

export const quest = pgTable("Quest", {
  id: uuid("id").primaryKey().defaultRandom(),
  completed: boolean("completed").default(false).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  profileId: uuid("profileId").references(() => profile.id, {
    onDelete: "cascade",
  }),
});

export const questTranslation = pgTable(
  "QuestTranslation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    language: languageEnum("language").notNull(),
    title: text("title").notNull(),
    questId: uuid("questId")
      .notNull()
      .references(() => quest.id, { onDelete: "cascade" }),
  },
  (t) => ({
    unq: unique().on(t.questId, t.language),
  }),
);

export const auditLog = pgTable("AuditLog", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: text("action").notNull(),
  entityType: text("entityType").notNull(),
  entityId: text("entityId").notNull(),
  details: json("details"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const uniqueVisitor = pgTable("UniqueVisitor", {
  id: uuid("id").primaryKey().defaultRandom(),
  ipAddress: text("ipAddress").notNull().unique(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const visitorMilestone = pgTable("VisitorMilestone", {
  id: uuid("id").primaryKey().defaultRandom(),
  count: integer("count").notNull().unique(),
  reachedAt: timestamp("reachedAt", { mode: "date" }).defaultNow().notNull(),
});

// ─── AI assistant ────────────────────────────────────────────────────────────
// The knowledge index is derived data: it is rebuilt from the content tables
// above (see lib/ai/knowledge) and is intentionally excluded from backups.

export const knowledgeDocument = pgTable(
  "KnowledgeDocument",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceType: knowledgeSourceTypeEnum("sourceType").notNull(),
    sourceId: text("sourceId").notNull(),
    language: languageEnum("language").notNull(),
    title: text("title").notNull(),
    /** Locale-less path, e.g. `/projects/my-slug`. */
    path: text("path").notNull(),
    summary: text("summary").default("").notNull(),
    contentHash: text("contentHash").notNull(),
    embeddingModel: text("embeddingModel").notNull(),
    /** Document-level vector (title + summary), used for "related content". */
    embedding: vector("embedding", {
      dimensions: EMBEDDING_DIMENSIONS,
    }).notNull(),
    chunkCount: integer("chunkCount").default(0).notNull(),
    indexedAt: timestamp("indexedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    unique().on(t.sourceType, t.sourceId, t.language),
    index("KnowledgeDocument_embedding_hnsw").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const knowledgeChunk = pgTable(
  "KnowledgeChunk",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("documentId")
      .notNull()
      .references(() => knowledgeDocument.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    /** Section breadcrumb, e.g. `Architecture › Caching`. */
    heading: text("heading"),
    content: text("content").notNull(),
    tokenCount: integer("tokenCount").notNull(),
    embedding: vector("embedding", {
      dimensions: EMBEDDING_DIMENSIONS,
    }).notNull(),
    searchVector: tsvector("searchVector").notNull(),
  },
  (t) => [
    unique().on(t.documentId, t.ordinal),
    index("KnowledgeChunk_embedding_hnsw").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops"),
    ),
    index("KnowledgeChunk_searchVector_gin").using("gin", t.searchVector),
  ],
);

export const assistantThread = pgTable(
  "AssistantThread",
  {
    /** Opaque id generated by the client (validated server-side). */
    id: text("id").primaryKey(),
    /** HMAC of the signed visitor cookie — never the raw cookie or an IP. */
    visitorId: text("visitorId").notNull(),
    /** Keyed hash of the client IP (never the raw IP) — groups visitors per network. */
    ipKey: text("ipKey"),
    language: languageEnum("language").notNull(),
    title: text("title").default("").notNull(),
    entryPath: text("entryPath"),
    messageCount: integer("messageCount").default(0).notNull(),
    inputTokens: integer("inputTokens").default(0).notNull(),
    outputTokens: integer("outputTokens").default(0).notNull(),
    flagged: boolean("flagged").default(false).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    lastMessageAt: timestamp("lastMessageAt", { mode: "date" })
      .defaultNow()
      .notNull(),
    /**
     * Set when the visitor deletes the chat from the widget: it disappears
     * for them but stays visible to the admin. Admin deletes are hard.
     */
    deletedAt: timestamp("deletedAt", { mode: "date" }),
  },
  (t) => [index().on(t.visitorId), index().on(t.ipKey), index().on(t.lastMessageAt)],
);

export const assistantMessage = pgTable(
  "AssistantMessage",
  {
    id: text("id").notNull(),
    threadId: text("threadId")
      .notNull()
      .references(() => assistantThread.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    /** UIMessage parts, compacted before storage (see lib/ai/chat/store.ts). */
    parts: jsonb("parts").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.threadId, t.id] }),
    index().on(t.threadId, t.createdAt),
  ],
);

export const assistantRateLimit = pgTable(
  "AssistantRateLimit",
  {
    key: text("key").notNull(),
    window: text("window").notNull(),
    count: integer("count").default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.key, t.window] })],
);

export const assistantSettings = pgTable("AssistantSettings", {
  id: integer("id").primaryKey().default(1),
  enabled: boolean("enabled").default(true).notNull(),
  /** Gemini model ids, chosen in the admin (see lib/ai/models.ts). */
  modelFast: text("modelFast").default("gemini-3.5-flash-lite").notNull(),
  modelDeep: text("modelDeep").default("gemini-3.8-flash").notNull(),
  visitorDailyLimit: integer("visitorDailyLimit").default(40).notNull(),
  globalDailyLimit: integer("globalDailyLimit").default(1500).notNull(),
  retentionDays: integer("retentionDays").default(90).notNull(),
  /** When false, chats are never pruned by the retention job. */
  autoDelete: boolean("autoDelete").default(true).notNull(),
  lastMaintenanceAt: timestamp("lastMaintenanceAt", { mode: "date" }),
  lastIndexReport: jsonb("lastIndexReport"),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Relations
export const projectRelations = relations(project, ({ one, many }) => ({
  technologies: many(_projectToSkill),
  translations: many(projectTranslation),
  category: one(category, {
    fields: [project.categoryId],
    references: [category.id],
  }),
  comments: many(comment),
  likes: many(like),
  views: many(view),
}));

export const skillRelations = relations(skill, ({ many }) => ({
  projects: many(_projectToSkill),
}));

export const _projectToSkillRelations = relations(
  _projectToSkill,
  ({ one }) => ({
    project: one(project, {
      fields: [_projectToSkill.A],
      references: [project.id],
    }),
    skill: one(skill, { fields: [_projectToSkill.B], references: [skill.id] }),
  }),
);

export const projectTranslationRelations = relations(
  projectTranslation,
  ({ one }) => ({
    project: one(project, {
      fields: [projectTranslation.projectId],
      references: [project.id],
    }),
  }),
);

export const blogPostRelations = relations(blogPost, ({ one, many }) => ({
  translations: many(blogPostTranslation),
  category: one(category, {
    fields: [blogPost.categoryId],
    references: [category.id],
  }),
  comments: many(comment),
  likes: many(like),
  views: many(view),
}));

export const blogPostTranslationRelations = relations(
  blogPostTranslation,
  ({ one }) => ({
    blogPost: one(blogPost, {
      fields: [blogPostTranslation.blogPostId],
      references: [blogPost.id],
    }),
  }),
);

export const commentRelations = relations(comment, ({ one, many }) => ({
  blogPost: one(blogPost, {
    fields: [comment.blogPostId],
    references: [blogPost.id],
  }),
  project: one(project, {
    fields: [comment.projectId],
    references: [project.id],
  }),
  parent: one(comment, {
    fields: [comment.parentId],
    references: [comment.id],
    relationName: "CommentReplies",
  }),
  replies: many(comment, { relationName: "CommentReplies" }),
}));

export const likeRelations = relations(like, ({ one }) => ({
  blogPost: one(blogPost, {
    fields: [like.blogPostId],
    references: [blogPost.id],
  }),
  project: one(project, {
    fields: [like.projectId],
    references: [project.id],
  }),
}));

export const viewRelations = relations(view, ({ one }) => ({
  blogPost: one(blogPost, {
    fields: [view.blogPostId],
    references: [blogPost.id],
  }),
  project: one(project, {
    fields: [view.projectId],
    references: [project.id],
  }),
}));

export const workExperienceRelations = relations(
  workExperience,
  ({ many }) => ({
    translations: many(workExperienceTranslation),
  }),
);

export const workExperienceTranslationRelations = relations(
  workExperienceTranslation,
  ({ one }) => ({
    workExperience: one(workExperience, {
      fields: [workExperienceTranslation.workExperienceId],
      references: [workExperience.id],
    }),
  }),
);

export const profileRelations = relations(profile, ({ many }) => ({
  translations: many(profileTranslation),
  quests: many(quest),
}));

export const profileTranslationRelations = relations(
  profileTranslation,
  ({ one }) => ({
    profile: one(profile, {
      fields: [profileTranslation.profileId],
      references: [profile.id],
    }),
  }),
);

export const questRelations = relations(quest, ({ one, many }) => ({
  profile: one(profile, {
    fields: [quest.profileId],
    references: [profile.id],
  }),
  translations: many(questTranslation),
}));

export const questTranslationRelations = relations(
  questTranslation,
  ({ one }) => ({
    quest: one(quest, {
      fields: [questTranslation.questId],
      references: [quest.id],
    }),
  }),
);

export const knowledgeDocumentRelations = relations(
  knowledgeDocument,
  ({ many }) => ({
    chunks: many(knowledgeChunk),
  }),
);

export const knowledgeChunkRelations = relations(knowledgeChunk, ({ one }) => ({
  document: one(knowledgeDocument, {
    fields: [knowledgeChunk.documentId],
    references: [knowledgeDocument.id],
  }),
}));

export const assistantThreadRelations = relations(
  assistantThread,
  ({ many }) => ({
    messages: many(assistantMessage),
  }),
);

export const assistantMessageRelations = relations(
  assistantMessage,
  ({ one }) => ({
    thread: one(assistantThread, {
      fields: [assistantMessage.threadId],
      references: [assistantThread.id],
    }),
  }),
);

export type Skill = typeof skill.$inferSelect;
export type Project = typeof project.$inferSelect;
export type ProjectTranslation = typeof projectTranslation.$inferSelect;
export type BlogPost = typeof blogPost.$inferSelect;
export type BlogPostTranslation = typeof blogPostTranslation.$inferSelect;
export type Comment = typeof comment.$inferSelect;
export type Like = typeof like.$inferSelect;
export type View = typeof view.$inferSelect;
export type WorkExperience = typeof workExperience.$inferSelect;
export type WorkExperienceTranslation =
  typeof workExperienceTranslation.$inferSelect;
export type SocialLink = typeof socialLink.$inferSelect;
export type Profile = typeof profile.$inferSelect;
export type ProfileTranslation = typeof profileTranslation.$inferSelect;
export type Quest = typeof quest.$inferSelect;
export type QuestTranslation = typeof questTranslation.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type Category = typeof category.$inferSelect;
export type KnowledgeDocument = typeof knowledgeDocument.$inferSelect;
export type KnowledgeChunk = typeof knowledgeChunk.$inferSelect;
export type AssistantThread = typeof assistantThread.$inferSelect;
export type AssistantMessage = typeof assistantMessage.$inferSelect;
export type AssistantSettings = typeof assistantSettings.$inferSelect;

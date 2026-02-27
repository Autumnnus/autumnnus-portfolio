import { relations } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
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

// Custom type for vector/embeddings
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(768)";
  },
  toDriver(value: number[] | string): string {
    if (typeof value === "string") return value;
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return value
      .replace(/[\[\]]/g, "")
      .split(",")
      .map(Number);
  },
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
  category: text("category").notNull(),
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
  category: text("category"),
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

export const embedding = pgTable(
  "Embedding",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceType: text("sourceType").notNull(),
    sourceId: text("sourceId").notNull(),
    language: text("language").notNull(),
    chunkText: text("chunkText").notNull(),
    chunkIndex: integer("chunkIndex").notNull(),
    embedding: vector("embedding"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => ({
    unq: unique().on(t.sourceType, t.sourceId, t.language, t.chunkIndex),
  }),
);

export const chatRateLimit = pgTable(
  "ChatRateLimit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ipAddress: text("ipAddress").notNull(),
    date: timestamp("date", { mode: "date" }).notNull(),
    requestCount: integer("requestCount").default(0).notNull(),
  },
  (t) => ({
    unq: unique().on(t.ipAddress, t.date),
  }),
);

export const liveChatConfig = pgTable("LiveChatConfig", {
  id: uuid("id").primaryKey().defaultRandom(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  allowedPaths: text("allowedPaths").array().default([]).notNull(),
  excludedPaths: text("excludedPaths").array().default([]).notNull(),
  pingSoundUrl: text("pingSoundUrl"),
  notificationSoundUrl: text("notificationSoundUrl"),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const liveChatGreeting = pgTable("LiveChatGreeting", {
  id: uuid("id").primaryKey().defaultRandom(),
  pathname: text("pathname").notNull().unique(),
  configId: uuid("configId")
    .notNull()
    .references(() => liveChatConfig.id, { onDelete: "cascade" }),
});

export const liveChatGreetingTranslation = pgTable(
  "LiveChatGreetingTranslation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    language: languageEnum("language").notNull(),
    text: text("text").notNull(),
    quickAnswers: text("quickAnswers").array().default([]).notNull(),
    greetingId: uuid("greetingId")
      .notNull()
      .references(() => liveChatGreeting.id, { onDelete: "cascade" }),
  },
  (t) => ({
    unq: unique().on(t.greetingId, t.language),
  }),
);

export const aiChatSession = pgTable(
  "AiChatSession",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ipAddress: text("ipAddress").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => ({
    ipIdx: index().on(t.ipAddress),
  }),
);

export const aiChatMessage = pgTable("AiChatMessage", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("sessionId")
    .notNull()
    .references(() => aiChatSession.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

// Relations
export const projectRelations = relations(project, ({ many }) => ({
  technologies: many(_projectToSkill),
  translations: many(projectTranslation),
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

export const blogPostRelations = relations(blogPost, ({ many }) => ({
  translations: many(blogPostTranslation),
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

export const liveChatConfigRelations = relations(
  liveChatConfig,
  ({ many }) => ({
    greetings: many(liveChatGreeting),
  }),
);

export const liveChatGreetingRelations = relations(
  liveChatGreeting,
  ({ one, many }) => ({
    config: one(liveChatConfig, {
      fields: [liveChatGreeting.configId],
      references: [liveChatConfig.id],
    }),
    translations: many(liveChatGreetingTranslation),
  }),
);

export const liveChatGreetingTranslationRelations = relations(
  liveChatGreetingTranslation,
  ({ one }) => ({
    greeting: one(liveChatGreeting, {
      fields: [liveChatGreetingTranslation.greetingId],
      references: [liveChatGreeting.id],
    }),
  }),
);

export const aiChatSessionRelations = relations(aiChatSession, ({ many }) => ({
  messages: many(aiChatMessage),
}));

export const aiChatMessageRelations = relations(aiChatMessage, ({ one }) => ({
  session: one(aiChatSession, {
    fields: [aiChatMessage.sessionId],
    references: [aiChatSession.id],
  }),
}));

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

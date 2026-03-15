import {
  SchemaType,
  type FunctionDeclaration,
  type FunctionDeclarationsTool,
} from "@google/generative-ai";
import { db } from "@/lib/db";
import type { SourceItem } from "@/app/api/chat/route";

// ---------------------------------------------------------------------------
// Tool Declarations
// ---------------------------------------------------------------------------

const listProjectsDeclaration: FunctionDeclaration = {
  name: "list_projects",
  description:
    "List or count projects in the portfolio. Use when the user asks how many projects there are, " +
    "wants to see all projects, or wants to filter projects by technology, category, or status.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      language: {
        type: SchemaType.STRING,
        description: "Language code for translations (e.g. 'en', 'tr').",
      },
      technology: {
        type: SchemaType.STRING,
        description:
          "Filter by technology/skill name (e.g. 'React', 'TypeScript'). Case-insensitive partial match.",
      },
      category: {
        type: SchemaType.STRING,
        description: "Filter by category name (e.g. 'Web', 'Mobile').",
      },
      status: {
        type: SchemaType.STRING,
        description: "Filter by project status (e.g. 'published', 'draft').",
      },
      featured_only: {
        type: SchemaType.BOOLEAN,
        description: "If true, return only featured/highlighted projects.",
      },
      count_only: {
        type: SchemaType.BOOLEAN,
        description: "If true, return only the total count instead of full list.",
      },
    },
    required: ["language"],
  },
};

const getProjectDetailsDeclaration: FunctionDeclaration = {
  name: "get_project_details",
  description:
    "Get full details of a single project by its slug. Use when the user asks about a specific project's " +
    "technologies, description, links, creation date, or other details.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      language: {
        type: SchemaType.STRING,
        description: "Language code for translations (e.g. 'en', 'tr').",
      },
      slug: {
        type: SchemaType.STRING,
        description: "The project slug (URL-friendly identifier).",
      },
    },
    required: ["language", "slug"],
  },
};

const listBlogPostsDeclaration: FunctionDeclaration = {
  name: "list_blog_posts",
  description:
    "List or count blog posts. Use when the user asks how many blog posts there are, " +
    "wants to see all posts, or wants to filter by tag or category.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      language: {
        type: SchemaType.STRING,
        description: "Language code for translations (e.g. 'en', 'tr').",
      },
      tag: {
        type: SchemaType.STRING,
        description: "Filter by tag. Case-insensitive partial match.",
      },
      category: {
        type: SchemaType.STRING,
        description: "Filter by category name.",
      },
      featured_only: {
        type: SchemaType.BOOLEAN,
        description: "If true, return only featured blog posts.",
      },
      count_only: {
        type: SchemaType.BOOLEAN,
        description: "If true, return only the total count instead of full list.",
      },
    },
    required: ["language"],
  },
};

const getProfileDeclaration: FunctionDeclaration = {
  name: "get_profile",
  description:
    "Get Kadir's profile information including name, title, contact details, and bio. " +
    "Use when the user asks about contact info, email, social links, or personal details.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      language: {
        type: SchemaType.STRING,
        description: "Language code for translations (e.g. 'en', 'tr').",
      },
    },
    required: ["language"],
  },
};

const listWorkExperienceDeclaration: FunctionDeclaration = {
  name: "list_work_experience",
  description:
    "List work experience entries. Use when the user asks about job history, companies worked at, " +
    "current position, roles, or employment dates.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      language: {
        type: SchemaType.STRING,
        description: "Language code for translations (e.g. 'en', 'tr').",
      },
      current_only: {
        type: SchemaType.BOOLEAN,
        description: "If true, return only the current position (where endDate is null).",
      },
    },
    required: ["language"],
  },
};

const listSkillsDeclaration: FunctionDeclaration = {
  name: "list_skills",
  description:
    "List all technologies and skills in the portfolio. Use when the user asks what technologies " +
    "Kadir knows, what skills he has, or wants a complete list of tools/frameworks.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
    required: [],
  },
};

export const portfolioTools: FunctionDeclarationsTool = {
  functionDeclarations: [
    listProjectsDeclaration,
    getProjectDetailsDeclaration,
    listBlogPostsDeclaration,
    getProfileDeclaration,
    listWorkExperienceDeclaration,
    listSkillsDeclaration,
  ],
};

// ---------------------------------------------------------------------------
// Tool Executors
// ---------------------------------------------------------------------------

interface ListProjectsArgs {
  language: string;
  technology?: string;
  category?: string;
  status?: string;
  featured_only?: boolean;
  count_only?: boolean;
}

async function executeListProjects(args: ListProjectsArgs): Promise<object> {
  const lang = args.language === "tr" ? "tr" : "en";

  const projects = await db.query.project.findMany({
    columns: {
      id: true,
      slug: true,
      status: true,
      featured: true,
      github: true,
      liveDemo: true,
      createdAt: true,
    },
    with: {
      category: { columns: { name: true } },
      technologies: {
        columns: {},
        with: { skill: { columns: { name: true } } },
      },
      translations: {
        where: (t, { eq }) => eq(t.language, lang),
        columns: { title: true, shortDescription: true },
      },
    },
  });

  let filtered = [...projects];

  if (args.status) {
    filtered = filtered.filter(
      (p) => p.status.toLowerCase() === args.status!.toLowerCase(),
    );
  }

  if (args.featured_only) {
    filtered = filtered.filter((p) => p.featured);
  }

  if (args.category) {
    const cat = args.category.toLowerCase();
    filtered = filtered.filter(
      (p) => p.category?.name?.toLowerCase().includes(cat),
    );
  }

  if (args.technology) {
    const tech = args.technology.toLowerCase();
    filtered = filtered.filter((p) =>
      (p.technologies as { skill: { name: string | null } | null }[]).some(
        (t) => t.skill?.name?.toLowerCase().includes(tech),
      ),
    );
  }

  if (args.count_only) {
    return { count: filtered.length };
  }

  return {
    count: filtered.length,
    projects: filtered.map((p) => {
      const translation = p.translations[0];
      const techs = (
        p.technologies as { skill: { name: string | null } | null }[]
      )
        .map((t) => t.skill?.name)
        .filter(Boolean);

      return {
        title: translation?.title ?? p.slug,
        slug: p.slug,
        description: translation?.shortDescription ?? "",
        category: p.category?.name ?? "",
        technologies: techs,
        status: p.status,
        featured: p.featured,
        github: p.github,
        liveDemo: p.liveDemo,
        url: `/${lang}/projects/${p.slug}`,
        createdAt: p.createdAt.toISOString(),
      };
    }),
  };
}

interface GetProjectDetailsArgs {
  language: string;
  slug: string;
}

async function executeGetProjectDetails(
  args: GetProjectDetailsArgs,
): Promise<object> {
  const lang = args.language === "tr" ? "tr" : "en";

  const project = await db.query.project.findFirst({
    where: (p, { eq }) => eq(p.slug, args.slug),
    columns: {
      id: true,
      slug: true,
      status: true,
      featured: true,
      github: true,
      liveDemo: true,
      coverImage: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      category: { columns: { name: true } },
      technologies: {
        columns: {},
        with: { skill: { columns: { name: true } } },
      },
      translations: {
        where: (t, { eq }) => eq(t.language, lang),
        columns: {
          title: true,
          shortDescription: true,
          fullDescription: true,
        },
      },
    },
  });

  if (!project) {
    return { error: "Project not found", slug: args.slug };
  }

  const translation = project.translations[0];
  const techs = (
    project.technologies as { skill: { name: string | null } | null }[]
  )
    .map((t) => t.skill?.name)
    .filter(Boolean);

  return {
    title: translation?.title ?? project.slug,
    slug: project.slug,
    description: translation?.shortDescription ?? "",
    fullDescription: translation?.fullDescription ?? "",
    category: project.category?.name ?? "",
    technologies: techs,
    status: project.status,
    featured: project.featured,
    github: project.github,
    liveDemo: project.liveDemo,
    coverImage: project.coverImage,
    url: `/${lang}/projects/${project.slug}`,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

interface ListBlogPostsArgs {
  language: string;
  tag?: string;
  category?: string;
  featured_only?: boolean;
  count_only?: boolean;
}

async function executeListBlogPosts(args: ListBlogPostsArgs): Promise<object> {
  const lang = args.language === "tr" ? "tr" : "en";

  const posts = await db.query.blogPost.findMany({
    columns: {
      id: true,
      slug: true,
      tags: true,
      featured: true,
      status: true,
      publishedAt: true,
      coverImage: true,
    },
    with: {
      category: { columns: { name: true } },
      translations: {
        where: (t, { eq }) => eq(t.language, lang),
        columns: { title: true, description: true, readTime: true, date: true },
      },
    },
  });

  let filtered = [...posts];

  if (args.featured_only) {
    filtered = filtered.filter((p) => p.featured);
  }

  if (args.category) {
    const cat = args.category.toLowerCase();
    filtered = filtered.filter(
      (p) => p.category?.name?.toLowerCase().includes(cat),
    );
  }

  if (args.tag) {
    const tag = args.tag.toLowerCase();
    filtered = filtered.filter(
      (p) => p.tags?.some((t) => t.toLowerCase().includes(tag)),
    );
  }

  if (args.count_only) {
    return { count: filtered.length };
  }

  return {
    count: filtered.length,
    posts: filtered.map((p) => {
      const translation = p.translations[0];
      return {
        title: translation?.title ?? p.slug,
        slug: p.slug,
        description: translation?.description ?? "",
        category: p.category?.name ?? "",
        tags: p.tags ?? [],
        featured: p.featured,
        readTime: translation?.readTime ?? "",
        date: translation?.date ?? "",
        url: `/${lang}/blog/${p.slug}`,
        publishedAt: p.publishedAt?.toISOString() ?? null,
      };
    }),
  };
}

interface GetProfileArgs {
  language: string;
}

async function executeGetProfile(args: GetProfileArgs): Promise<object> {
  const lang = args.language === "tr" ? "tr" : "en";

  const profileData = await db.query.profile.findFirst({
    columns: {
      id: true,
      email: true,
      github: true,
      linkedin: true,
      avatar: true,
    },
    with: {
      translations: {
        where: (t, { eq }) => eq(t.language, lang),
        columns: {
          name: true,
          title: true,
          greetingText: true,
          description: true,
          aboutTitle: true,
          aboutDescription: true,
        },
      },
    },
  });

  if (!profileData) {
    return { error: "Profile not found" };
  }

  const translation = profileData.translations[0];

  return {
    name: translation?.name ?? "",
    title: translation?.title ?? "",
    email: profileData.email,
    github: profileData.github,
    linkedin: profileData.linkedin,
    avatar: profileData.avatar,
    greetingText: translation?.greetingText ?? "",
    description: translation?.description ?? "",
    aboutTitle: translation?.aboutTitle ?? "",
    aboutDescription: translation?.aboutDescription ?? "",
  };
}

interface ListWorkExperienceArgs {
  language: string;
  current_only?: boolean;
}

async function executeListWorkExperience(
  args: ListWorkExperienceArgs,
): Promise<object> {
  const lang = args.language === "tr" ? "tr" : "en";

  const experiences = await db.query.workExperience.findMany({
    columns: {
      id: true,
      company: true,
      logo: true,
      startDate: true,
      endDate: true,
    },
    with: {
      translations: {
        where: (t, { eq }) => eq(t.language, lang),
        columns: { role: true, description: true, locationType: true },
      },
    },
  });

  let filtered = experiences;

  if (args.current_only) {
    filtered = filtered.filter((e) => !e.endDate);
  }

  return {
    count: filtered.length,
    experiences: filtered.map((e) => {
      const translation = e.translations[0];
      return {
        company: e.company,
        role: translation?.role ?? "",
        description: translation?.description ?? "",
        locationType: translation?.locationType ?? "",
        startDate: e.startDate?.toISOString() ?? null,
        endDate: e.endDate?.toISOString() ?? null,
      };
    }),
  };
}

async function executeListSkills(): Promise<object> {
  const skills = await db.query.skill.findMany({
    columns: {
      name: true,
      key: true,
      icon: true,
    },
  });

  return {
    count: skills.length,
    skills: skills.map((s) => ({
      name: s.name,
      key: s.key,
      icon: s.icon,
    })),
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<object> {
  try {
    switch (name) {
      case "list_projects":
        return await executeListProjects(args as unknown as ListProjectsArgs);
      case "get_project_details":
        return await executeGetProjectDetails(
          args as unknown as GetProjectDetailsArgs,
        );
      case "list_blog_posts":
        return await executeListBlogPosts(args as unknown as ListBlogPostsArgs);
      case "get_profile":
        return await executeGetProfile(args as unknown as GetProfileArgs);
      case "list_work_experience":
        return await executeListWorkExperience(
          args as unknown as ListWorkExperienceArgs,
        );
      case "list_skills":
        return await executeListSkills();
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    console.error(`Tool execution error [${name}]:`, error);
    return {
      error: `Failed to execute ${name}`,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Source Extraction from Tool Results
// ---------------------------------------------------------------------------

interface ToolCallRecord {
  name: string;
  response: object;
}

export function extractSourcesFromToolResults(
  toolCalls: ToolCallRecord[],
  lang: string,
): SourceItem[] {
  const sources: SourceItem[] = [];
  const seen = new Set<string>();

  for (const call of toolCalls) {
    const data = call.response as Record<string, unknown>;

    if (call.name === "list_projects" || call.name === "get_project_details") {
      const projects =
        call.name === "get_project_details"
          ? data.error
            ? []
            : [data]
          : ((data.projects as Record<string, unknown>[]) ?? []);

      for (const p of projects) {
        const url = (p.url as string) ?? `/${lang}/projects/${p.slug}`;
        if (seen.has(url)) continue;
        seen.add(url);

        sources.push({
          sourceType: "project",
          title: (p.title as string) ?? "",
          description: (p.description as string) ?? "",
          url,
          imageUrl: (p.coverImage as string) ?? undefined,
          github: (p.github as string) ?? undefined,
          liveDemo: (p.liveDemo as string) ?? undefined,
          category: (p.category as string) ?? "",
          technologies: (p.technologies as string[]) ?? [],
          similarity: 1,
        });
      }
    }

    if (call.name === "list_blog_posts") {
      const posts = (data.posts as Record<string, unknown>[]) ?? [];
      for (const p of posts) {
        const url = (p.url as string) ?? `/${lang}/blog/${p.slug}`;
        if (seen.has(url)) continue;
        seen.add(url);

        sources.push({
          sourceType: "blog",
          title: (p.title as string) ?? "",
          description: (p.description as string) ?? "",
          url,
          imageUrl: (p.coverImage as string) ?? undefined,
          category: (p.category as string) ?? "",
          tags: (p.tags as string[]) ?? [],
          similarity: 1,
        });
      }
    }
  }

  return sources;
}

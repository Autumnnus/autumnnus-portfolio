import { BlogPost } from "@/types/blog";

export const blogPosts: BlogPost[] = [
  {
    title: "What is taste and how can you develop it?",
    description: "Understanding what is taste, resources and how to practice",
    slug: "what-is-taste",
    date: "2025-12-07",
    readTime: "8 min",
    tags: ["Frontend", "Design"],
    coverImage: "/blog/taste-cover.jpg",
    featured: true,
    stats: {
      likes: 834,
      views: 733,
      comments: 7,
    },
    content: `Hey just a heads up this blog is heavily inspired by Emil Kowalski, Josh W. Comeau, Manu Arora tweet's, blogs or videos.

With my experiences and how I improved my **taste of design**. And how you can too.

## What is Taste?

Taste is the ability to recognize good design. It's about understanding what works and what doesn't in visual communication, user experience, and aesthetics.

## How to Develop Your Taste

### 1. Consume Great Design

Look at exceptional work every day. Follow designers you admire. Study award-winning websites. Browse Dribbble, Behance, and Awwwards.

### 2. Practice Deliberately

Don't just look - recreate. Pick a design you love and rebuild it from scratch. This forces you to understand the decisions behind every pixel.

### 3. Get Feedback

Share your work. Join design communities. Learn to accept critique and use it to improve.

### 4. Study the Fundamentals

Typography, color theory, spacing, hierarchy - these aren't optional. Master the basics before breaking the rules.

## Conclusion

Developing taste takes time, but it's a skill anyone can learn. Start today by consuming great design and practicing regularly.`,
  },
  {
    title: "Go in bits",
    description: "Archive of all the links from my socials for go tuts.",
    slug: "go-in-bits",
    date: "2025-10-02",
    readTime: "5 min",
    tags: ["Go", "Development", "Backend"],
    coverImage: "/blog/go-cover.jpg",
    featured: false,
    stats: {
      likes: 421,
      views: 892,
      comments: 12,
    },
    content: `This is a collection of Go programming resources and links that I've found useful over the years.

## Getting Started with Go

Go is a statically typed, compiled programming language designed at Google. It's known for its simplicity and efficiency.

## Essential Resources

- Official Go Documentation
- Go by Example
- Effective Go
- The Go Blog

## Why Go?

Go excels at:
- Concurrent programming
- Server-side development
- Cloud infrastructure
- DevOps tools

Start learning today!`,
  },
  {
    title: "Building Modern Web Apps with Next.js",
    description:
      "A comprehensive guide to creating production-ready applications",
    slug: "nextjs-modern-apps",
    date: "2025-11-15",
    readTime: "12 min",
    tags: ["Next.js", "React", "Frontend"],
    coverImage: "/blog/nextjs-cover.jpg",
    featured: true,
    stats: {
      likes: 1243,
      views: 2134,
      comments: 23,
    },
    content: `Next.js has become the go-to framework for building React applications. Let's explore why and how to use it effectively.`,
  },
  {
    title: "TypeScript Best Practices in 2025",
    description: "Level up your TypeScript skills with these proven patterns",
    slug: "typescript-best-practices",
    date: "2025-09-20",
    readTime: "10 min",
    tags: ["TypeScript", "JavaScript", "Development"],
    coverImage: "/blog/typescript-cover.jpg",
    featured: false,
    stats: {
      likes: 678,
      views: 1456,
      comments: 15,
    },
    content: `TypeScript has revolutionized how we write JavaScript. Here are the best practices you should follow.`,
  },
  {
    title: "CSS Animations That Wow Users",
    description: "Create smooth, performant animations that enhance UX",
    slug: "css-animations",
    date: "2025-08-10",
    readTime: "7 min",
    tags: ["CSS", "Frontend", "Design"],
    coverImage: "/blog/css-animations-cover.jpg",
    featured: false,
    stats: {
      likes: 512,
      views: 934,
      comments: 8,
    },
    content: `Animation is a powerful tool for creating engaging user experiences. Let's learn how to do it right.`,
  },
  {
    title: "The Future of Web Development",
    description: "Trends and technologies shaping the next decade",
    slug: "future-web-dev",
    date: "2025-07-05",
    readTime: "15 min",
    tags: ["Development", "Frontend", "JavaScript"],
    coverImage: "/blog/future-web-cover.jpg",
    featured: true,
    stats: {
      likes: 2104,
      views: 4521,
      comments: 45,
    },
    content: `The web development landscape is constantly evolving. Here's what you need to know about the future.`,
  },
  {
    title: "Mastering React Hooks",
    description: "Deep dive into hooks and custom hook patterns",
    slug: "mastering-react-hooks",
    date: "2025-06-18",
    readTime: "11 min",
    tags: ["React", "JavaScript", "Frontend"],
    coverImage: "/blog/react-hooks-cover.jpg",
    featured: false,
    stats: {
      likes: 891,
      views: 1678,
      comments: 19,
    },
    content: `React Hooks changed how we write components. Let's master them together.`,
  },
  {
    title: "My Winter Arc Journey",
    description: "Personal growth through the coldest season",
    slug: "winter-arc",
    date: "2025-12-01",
    readTime: "6 min",
    tags: ["Personal", "Life", "Winter Arc"],
    coverImage: "/blog/winter-arc-cover.jpg",
    featured: false,
    stats: {
      likes: 345,
      views: 623,
      comments: 11,
    },
    content: `Winter is not just a season - it's an opportunity for transformation and growth.`,
  },
];

export const getAllTags = (): { name: string; count: number }[] => {
  const tagCounts = new Map<string, number>();

  blogPosts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

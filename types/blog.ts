export interface BlogPost {
  title: string;
  description: string;
  slug: string;
  date: string;
  readTime: string;
  tags: string[];
  coverImage: string;
  content: string;
  featured?: boolean;
  stats: {
    likes: number;
    views: number;
    comments: number;
  };
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  postSlug: string;
  content: string;
  likes: number;
  dislikes: number;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  replies?: Comment[];
}

export interface CommentAction {
  commentId: string;
  userId: string;
  type: "like" | "dislike";
}

"use client";

import { Comment, CommentAction, User } from "@/types/blog";

const USER_KEY = "autumnnus_user";
const COMMENTS_KEY = "autumnnus_comments";
const COMMENT_ACTIONS_KEY = "autumnnus_comment_actions";

export const getOrCreateUser = (): User => {
  if (typeof window === "undefined") {
    throw new Error("This function can only be called on the client side");
  }

  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    name: "Anonymous User",
    username: `user_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  return newUser;
};

export const updateUser = (updates: Partial<Omit<User, "id">>) => {
  const user = getOrCreateUser();
  const updated = { ...user, ...updates };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
};

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const getComments = (postSlug?: string): Comment[] => {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(COMMENTS_KEY);
  const allComments: Comment[] = stored ? JSON.parse(stored) : [];

  if (postSlug) {
    return allComments.filter((c) => c.postSlug === postSlug);
  }
  return allComments;
};

export const addComment = (
  postSlug: string,
  content: string,
  parentId?: string,
): Comment => {
  const user = getOrCreateUser();
  const comments = getComments();

  const newComment: Comment = {
    id: crypto.randomUUID(),
    userId: user.id,
    postSlug,
    content,
    likes: 0,
    dislikes: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentId,
    replies: [],
  };

  comments.push(newComment);
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  return newComment;
};

export const getCommentActions = (): CommentAction[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(COMMENT_ACTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const toggleCommentAction = (
  commentId: string,
  type: "like" | "dislike",
): void => {
  const user = getOrCreateUser();
  const actions = getCommentActions();
  const comments = getComments();

  const existingActionIndex = actions.findIndex(
    (a) => a.commentId === commentId && a.userId === user.id,
  );

  if (existingActionIndex !== -1) {
    const existingAction = actions[existingActionIndex];
    if (existingAction.type === type) {
      actions.splice(existingActionIndex, 1);
      const comment = comments.find((c) => c.id === commentId);
      if (comment) {
        comment[type === "like" ? "likes" : "dislikes"]--;
      }
    } else {
      const comment = comments.find((c) => c.id === commentId);
      if (comment) {
        comment[existingAction.type === "like" ? "likes" : "dislikes"]--;
        comment[type === "like" ? "likes" : "dislikes"]++;
      }
      actions[existingActionIndex].type = type;
    }
  } else {
    actions.push({ commentId, userId: user.id, type });
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      comment[type === "like" ? "likes" : "dislikes"]++;
    }
  }

  localStorage.setItem(COMMENT_ACTIONS_KEY, JSON.stringify(actions));
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
};

export const getUserAction = (commentId: string): "like" | "dislike" | null => {
  const user = getCurrentUser();
  if (!user) return null;

  const actions = getCommentActions();
  const action = actions.find(
    (a) => a.commentId === commentId && a.userId === user.id,
  );
  return action ? action.type : null;
};

export const getCommentCount = (postSlug: string): number => {
  return getComments(postSlug).length;
};

export const seedComments = () => {
  if (typeof window === "undefined") return;

  const existing = localStorage.getItem(COMMENTS_KEY);
  if (existing) return;

  const sampleComments: Comment[] = [
    {
      id: "1",
      userId: "sample-user-1",
      postSlug: "what-is-taste",
      content: "Your portfolio is amazing dude",
      likes: 1,
      dislikes: 0,
      createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      replies: [],
    },
    {
      id: "2",
      userId: "sample-user-2",
      postSlug: "what-is-taste",
      content: "really worth reading. Very well explained!",
      likes: 2,
      dislikes: 0,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      replies: [],
    },
    {
      id: "3",
      userId: "sample-user-3",
      postSlug: "what-is-taste",
      content:
        "Very indepth and Informative blog, was studying the same things recently like typography and design. Need one more thing from you can you please make a video or blog something about using figma or any such tools for creating designs.\n\nKeep growing and looking forward to more such blogs.",
      likes: 5,
      dislikes: 0,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      replies: [],
    },
  ];

  localStorage.setItem(COMMENTS_KEY, JSON.stringify(sampleComments));
};

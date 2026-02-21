"use client";

import {
  addComment,
  getComments,
  getCurrentUser,
  getOrCreateUser,
  seedComments,
} from "@/lib/storage";
import { Comment, User } from "@/types/blog";
import * as Dialog from "@radix-ui/react-dialog";
import { MessageSquare, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import CommentComponent from "./Comment";

interface CommentsectionProps {
  postSlug: string;
}

export default function CommentSection({ postSlug }: CommentsectionProps) {
  const t = useTranslations("Blog");
  const tComments = useTranslations("Comments");
  const tCommon = useTranslations("Common");
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  useEffect(() => {
    seedComments();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setComments(getComments(postSlug));
    setUser(getCurrentUser());
  }, [postSlug]);

  const handleSignIn = () => {
    const newUser = getOrCreateUser();
    setUser(newUser);
    setIsSignInOpen(false);
  };

  const handleAddComment = () => {
    if (!user) {
      setIsSignInOpen(true);
      return;
    }

    if (!newComment.trim()) return;

    const comment = addComment(postSlug, newComment);
    setComments([...comments, comment]);
    setNewComment("");
  };

  return (
    <section className="mt-16 pt-12 border-t border-border">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <MessageSquare className="w-5 h-5" />
        <h2 className="text-2xl font-bold">
          {t("comments")} ({comments.length})
        </h2>
      </div>

      {/* Sign in to comment box */}
      {!user ? (
        <div className="mb-8 p-8 border border-border rounded-lg bg-muted/30 text-center space-y-4">
          <UserIcon className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {t("signInToComment")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("joinConversation")}
            </p>
          </div>
          <button
            onClick={handleSignIn}
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-md font-medium hover:opacity-90 transition-opacity"
          >
            <UserIcon className="w-4 h-4" />
            {t("signInButton")}
          </button>
        </div>
      ) : (
        /* Add comment form */
        <div className="mb-8 space-y-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={tComments("writePlaceholder")}
            className="w-full p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("signedInAs")} <span className="font-medium">{user.name}</span>
            </p>
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("postComment")}
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-1 divide-y divide-border/50">
        {comments.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">
            {t("noCommentsYet")}
          </p>
        ) : (
          comments.map((comment) => (
            <CommentComponent key={comment.id} comment={comment} user={user} />
          ))
        )}
      </div>

      {/* Sign in Dialog */}
      <Dialog.Root open={isSignInOpen} onOpenChange={setIsSignInOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-lg p-6 w-full max-w-md z-50 space-y-4">
            <Dialog.Title className="text-xl font-bold">
              {t("signInToComment")}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              {tComments("signInRequired")}
            </Dialog.Description>
            <div className="flex gap-3 justify-end">
              <Dialog.Close asChild>
                <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                  {tCommon("cancel")}
                </button>
              </Dialog.Close>
              <button
                onClick={handleSignIn}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                {tCommon("continue")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}

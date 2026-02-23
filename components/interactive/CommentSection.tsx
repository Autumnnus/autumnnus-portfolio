/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  CommentItemType,
  createComment,
  deleteComment,
  getComments,
} from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile } from "@marsidev/react-turnstile";
import { formatDistanceToNow } from "date-fns";
import { de, enUS, tr } from "date-fns/locale";
import { Loader2, Reply, Trash2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const createCommentSchema = (t: any) =>
  z.object({
    authorName: z.string().min(
      2,
      t("authorNameMin", {
        defaultMessage: "Name must be at least 2 characters.",
      }),
    ),
    authorEmail: z
      .string()
      .email(
        t("authorEmailInvalid", { defaultMessage: "Invalid email address." }),
      ),
    content: z.string().min(
      2,
      t("contentMin", {
        defaultMessage: "Comment must be at least 2 characters.",
      }),
    ),
  });

type CommentFormValues = z.infer<ReturnType<typeof createCommentSchema>>;

interface Comment {
  id: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: Date;
  isAdmin: boolean;
  parentId?: string | null;
  replies?: Comment[];
}

interface CommentSectionProps {
  itemId: string;
  itemType: CommentItemType;
}

export default function CommentSection({
  itemId,
  itemType,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [adminAvatar, setAdminAvatar] = useState<string>("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const { data: session } = useSession();
  const locale = useLocale();
  const formRef = useRef<HTMLDivElement>(null);

  const isDev = process.env.NODE_ENV === "development";

  const adminEmail =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || "prost.alchemist@gmail.com";
  const isAdmin = session?.user?.email === adminEmail;

  const t = useTranslations("Comments");
  const commentSchema = createCommentSchema(t);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      authorName: "",
      authorEmail: "",
      content: "",
    },
  });

  useEffect(() => {
    if (session?.user) {
      form.setValue("authorName", session.user.name || "");
      form.setValue("authorEmail", session.user.email || "");
    } else {
      const savedName = localStorage.getItem("commentAuthorName");
      const savedEmail = localStorage.getItem("commentAuthorEmail");
      if (savedName) form.setValue("authorName", savedName);
      if (savedEmail) form.setValue("authorEmail", savedEmail);
    }
  }, [form, session]);

  useEffect(() => {
    let mounted = true;
    async function fetchComments() {
      try {
        const result = await getComments(itemId, itemType);
        if (mounted) {
          const mapComments = (cs: Comment[]): Comment[] =>
            cs.map((c) => ({
              ...c,
              createdAt: new Date(c.createdAt),
              replies: c.replies ? mapComments(c.replies) : [],
            }));

          setComments(mapComments(result.comments as unknown as Comment[]));
          if (result.adminAvatar) setAdminAvatar(result.adminAvatar);
        }
      } catch (error) {
        console.error("Failed to load comments:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchComments();
    return () => {
      mounted = false;
    };
  }, [itemId, itemType]);

  const onSubmit = async (values: CommentFormValues) => {
    if (!isDev && !turnstileToken) {
      toast.error(t("securityVerification"));
      return;
    }

    setSubmitting(true);
    try {
      const result = await createComment(
        itemId,
        itemType,
        values.content,
        values.authorName,
        values.authorEmail,
        replyTo?.id,
        turnstileToken,
      );

      if (result.success && result.comment) {
        if (!session) {
          localStorage.setItem("commentAuthorName", values.authorName);
          localStorage.setItem("commentAuthorEmail", values.authorEmail);
        }

        const newComment: Comment = {
          ...result.comment,
          createdAt: new Date(result.comment.createdAt),
          replies: [],
        };

        if (replyTo) {
          setComments((prev) => {
            const updateReplies = (cs: Comment[]): Comment[] =>
              cs.map((c) => {
                if (c.id === replyTo.id) {
                  return { ...c, replies: [...(c.replies || []), newComment] };
                }
                if (c.replies && c.replies.length > 0) {
                  return { ...c, replies: updateReplies(c.replies) };
                }
                return c;
              });
            return updateReplies(prev);
          });
        } else {
          setComments((prev) => [newComment, ...prev]);
        }

        form.reset({
          authorName: values.authorName,
          authorEmail: values.authorEmail,
          content: "",
        });
        setReplyTo(null);
        setTurnstileToken("");
      } else {
        toast.error(result.error || t("postCommentError"));
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error(t("errorOccurred"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      const result = await deleteComment(commentId);
      if (result.success) {
        const removeComment = (cs: Comment[]): Comment[] =>
          cs
            .filter((c) => c.id !== commentId)
            .map((c) => ({
              ...c,
              replies: c.replies ? removeComment(c.replies) : [],
            }));

        setComments((prev) => removeComment(prev));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const startReply = (comment: Comment) => {
    setReplyTo(comment);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      form.setFocus("content");
    }, 100);
  };

  const getDateLocale = () => {
    switch (locale) {
      case "tr":
        return tr;
      case "de":
        return de;
      default:
        return enUS;
    }
  };

  const CommentItem = ({
    comment,
    isReply = false,
  }: {
    comment: Comment;
    isReply?: boolean;
  }) => (
    <div className={`space-y-4 ${isReply ? "ml-8 sm:ml-12 mt-4" : ""}`}>
      <div
        className={`flex gap-4 p-4 rounded-lg border ${comment.isAdmin ? "bg-yellow-500/5 border-yellow-500/20" : "bg-card"}`}
      >
        <Avatar>
          <AvatarImage
            src={
              comment.isAdmin && adminAvatar
                ? adminAvatar
                : `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(comment.authorEmail)}`
            }
          />
          <AvatarFallback>
            {comment.authorName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{comment.authorName}</h4>
              {comment.isAdmin && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-[10px] px-1.5 py-0 h-4">
                  {t("admin")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(comment.createdAt, {
                  addSuffix: true,
                  locale: getDateLocale(),
                })}
              </span>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title={t("delete")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="pt-1">
            <button
              onClick={() => startReply(comment)}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
            >
              <Reply className="w-3 h-3" />
              {t("reply")}
            </button>
          </div>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 mt-12 border-t pt-8">
      <h3 className="text-2xl font-semibold">
        {t("title")} ({comments.length})
      </h3>

      <div
        ref={formRef}
        className={`bg-card p-6 rounded-lg border relative transition-all duration-300 ${replyTo ? "ring-2 ring-primary pt-10" : ""}`}
      >
        {replyTo && (
          <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground px-4 py-2 rounded-t-lg flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <Reply className="w-4 h-4" />
              {t("replyingTo")}{" "}
              <span className="underline font-bold">{replyTo.authorName}</span>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="authorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("yourName")}
                        {...field}
                        disabled={!!session}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="authorEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("yourEmail")}
                        {...field}
                        disabled={!!session}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {replyTo
                      ? t("yourReplyTo", { name: replyTo.authorName })
                      : t("comment")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        replyTo ? t("writeReply") : t("shareThoughts")
                      }
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Button
                type="submit"
                disabled={submitting || (!isDev && !turnstileToken)}
                className="w-full sm:w-auto"
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {replyTo ? t("postReply") : t("postComment")}
              </Button>

              {!isDev && (
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken("")}
                  onError={() => setTurnstileToken("")}
                  options={{ theme: "light", size: "normal" }}
                />
              )}
            </div>
          </form>
        </Form>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {t("noComments")}
          </p>
        )}
      </div>
    </div>
  );
}

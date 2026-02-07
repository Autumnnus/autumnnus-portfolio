"use client";

import { CommentItemType, createComment, getComments } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { formatDistanceToNow } from "date-fns";
import { de, enUS, tr } from "date-fns/locale"; // Add more locales as needed
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const commentSchema = z.object({
  authorName: z.string().min(2, "Name must be at least 2 characters."),
  authorEmail: z.string().email("Invalid email address."),
  content: z.string().min(2, "Comment must be at least 2 characters."),
});

type CommentFormValues = z.infer<typeof commentSchema>;

interface Comment {
  id: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: Date;
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
  const locale = useLocale();

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      authorName: "",
      authorEmail: "",
      content: "",
    },
  });

  // Load user details from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("commentAuthorName");
    const savedEmail = localStorage.getItem("commentAuthorEmail");
    if (savedName) form.setValue("authorName", savedName);
    if (savedEmail) form.setValue("authorEmail", savedEmail);
  }, [form]);

  // Fetch comments
  useEffect(() => {
    let mounted = true;
    async function fetchComments() {
      try {
        const result = await getComments(itemId, itemType);
        if (mounted) {
          setComments(
            result.comments.map((c) => ({
              ...c,
              createdAt: new Date(c.createdAt), // Ensure Date object
            })),
          );
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
    setSubmitting(true);
    try {
      const result = await createComment(
        itemId,
        itemType,
        values.content,
        values.authorName,
        values.authorEmail,
      );

      if (result.success && result.comment) {
        // Save to localStorage
        localStorage.setItem("commentAuthorName", values.authorName);
        localStorage.setItem("commentAuthorEmail", values.authorEmail);

        // Add to list (optimistic-ish, or real from server response)
        const newComment = {
          ...result.comment,
          createdAt: new Date(result.comment.createdAt),
        };

        setComments((prev) => [newComment, ...prev]);
        form.reset({
          authorName: values.authorName,
          authorEmail: values.authorEmail,
          content: "",
        });
      } else {
        alert(result.error || "Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("An error occurred.");
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="space-y-8 mt-12 border-t pt-8">
      <h3 className="text-2xl font-semibold">Comments ({comments.length})</h3>

      {/* Comment Form */}
      <div className="bg-card p-6 rounded-lg border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="authorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" {...field} />
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
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Share your thoughts..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Comment
            </Button>
          </form>
        </Form>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar>
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.authorName}`}
                />
                <AvatarFallback>
                  {comment.authorName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{comment.authorName}</h4>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(comment.createdAt, {
                      addSuffix: true,
                      locale: getDateLocale(),
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </div>
  );
}

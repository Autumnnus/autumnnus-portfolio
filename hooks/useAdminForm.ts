import { useTranslations } from "next-intl";
import { useState } from "react";
import { FieldErrors, FieldValues, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface UseAdminFormProps<
  TFieldValues extends FieldValues,
  TResponse = unknown,
> {
  form: UseFormReturn<TFieldValues>;
  onSubmitAction: (data: TFieldValues) => Promise<TResponse>;
  onSuccess?: (response: TResponse, data: TFieldValues) => void;
  onError?: (error: unknown) => void;
  onInvalid?: (errors: FieldErrors<TFieldValues>) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useAdminForm<
  TFieldValues extends FieldValues,
  TResponse = unknown,
>({
  form,
  onSubmitAction,
  onSuccess,
  onError,
  onInvalid,
  successMessage,
  errorMessage,
}: UseAdminFormProps<TFieldValues, TResponse>) {
  const [loading, setLoading] = useState(false);
  const t = useTranslations("Admin.Form");

  const handleSubmit = form.handleSubmit(
    async (data) => {
      setLoading(true);
      try {
        const response = await onSubmitAction(data);
        const resolvedSuccessMessage = successMessage || t("saveSuccess");
        toast.success(resolvedSuccessMessage);

        if (onSuccess) {
          onSuccess(response, data);
        }
      } catch (error) {
        console.error("Form submission error:", error);
        const resolvedErrorMessage =
          errorMessage ||
          (error instanceof Error ? error.message : t("errorProcess"));
        toast.error(resolvedErrorMessage);

        if (onError) {
          onError(error);
        }
      } finally {
        setLoading(false);
      }
    },
    (errors) => {
      console.warn("Form validation errors:", errors);
      if (onInvalid) {
        onInvalid(errors);
      }
      // Let the user know validation failed
      toast.error(t("validationErrorTitle"), {
        description: t("validationError"),
      });
    },
  );

  return {
    loading,
    handleSubmit,
  };
}

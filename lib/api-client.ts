import { toast } from "sonner";

/**
 * Global API client for centralized error handling
 */
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.error || data.message || `İşlem başarısız: ${response.status}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message !== "Failed to fetch") {
        // Only toast if it's not a generic network error (to avoid double toast if we already toasted above)
        // Actually, let's toast network errors too if they haven't been handled
      } else {
        toast.error("Ağ hatası: Sunucuya erişilemiyor");
      }
    } else {
      toast.error("Beklenmedik bir hata oluştu");
    }
    throw error;
  }
}

/**
 * Wrapper for Server Actions for global error handling
 */
export async function handleAction<T>(
  action: () => Promise<T>,
  successMessage?: string,
): Promise<T | null> {
  try {
    const result = await action();
    if (successMessage) {
      toast.success(successMessage);
    }
    return result;
  } catch (error) {
    console.error("Action Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "İşlem sırasında bir hata oluştu";
    toast.error(message);
    return null;
  }
}

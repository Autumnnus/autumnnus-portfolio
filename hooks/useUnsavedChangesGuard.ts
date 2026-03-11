import { useEffect } from "react";

interface UseUnsavedChangesGuardOptions {
  enabled: boolean;
  message?: string;
}

const DEFAULT_MESSAGE =
  "Kaydedilmemis degisiklikler var. Sayfadan cikmak istediginize emin misiniz?";

export function useUnsavedChangesGuard({
  enabled,
  message = DEFAULT_MESSAGE,
}: UseUnsavedChangesGuardOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Browser shows built-in prompt text on modern clients.
      event.returnValue = "";
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const currentUrl = new URL(window.location.href);
      const nextUrl = new URL(link.href, window.location.href);
      if (currentUrl.href === nextUrl.href) return;

      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [enabled, message]);

  const confirmNavigation = () => {
    if (!enabled) return true;
    return window.confirm(message);
  };

  return { confirmNavigation };
}

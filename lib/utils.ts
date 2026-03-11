import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

type DateValue = Date | string | number | null | undefined;

const FALLBACK_LOCALE = "tr-TR";

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

const DEFAULT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DEFAULT_DATE_OPTIONS,
  hour: "2-digit",
  minute: "2-digit",
};

const parseDateValue = (value: DateValue): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getBrowserLocale = () => {
  if (typeof navigator === "undefined") {
    return FALLBACK_LOCALE;
  }

  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return navigator.languages[0];
  }

  return navigator.language || FALLBACK_LOCALE;
};

const formatWithOptions = (
  value: DateValue,
  options: Intl.DateTimeFormatOptions,
  locale?: string,
) => {
  const date = parseDateValue(value);
  if (!date) return "";

  const resolvedLocale = locale || getBrowserLocale();

  try {
    return new Intl.DateTimeFormat(resolvedLocale, options).format(date);
  } catch {
    return new Intl.DateTimeFormat(FALLBACK_LOCALE, options).format(date);
  }
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  value: DateValue,
  options?: Intl.DateTimeFormatOptions,
  locale?: string,
): string {
  return formatWithOptions(value, options ?? DEFAULT_DATE_OPTIONS, locale);
}

export function formatDateTime(
  value: DateValue,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatWithOptions(
    value,
    options ?? DEFAULT_DATE_TIME_OPTIONS,
    locale,
  );
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `about ${months} month${months > 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(diffInSeconds / 31536000);
  return `about ${years} year${years > 1 ? "s" : ""} ago`;
}

export function shouldNotify(n: number): boolean {
  if (n <= 0) return false;
  if (n === 1) return true;
  const log = Math.floor(Math.log10(n));
  const base = 10 ** log;
  const normalized = n / base;
  return normalized === 1 || normalized === 2.5 || normalized === 5;
}

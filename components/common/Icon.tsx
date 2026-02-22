"use client";

import Image, { StaticImageData } from "next/image";
import { useEffect, useState } from "react";

interface IconProps {
  src: string | StaticImageData;
  alt: string;
  className?: string;
  size?: number;
}

export default function Icon({
  src,
  alt,
  className = "",
  size = 24,
}: IconProps) {
  const [mounted, setMounted] = useState(false);

  const [error, setError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isUrl =
    typeof src !== "string" ||
    src.startsWith("http") ||
    src.startsWith("/") ||
    src.startsWith("assets/") ||
    src.startsWith("data:") ||
    src.includes(".") ||
    src.includes("/");

  if (!mounted) {
    return (
      <div
        className={`relative inline-block ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Use fallback if error occurred or src is missing
  const finalSrc = error || !src ? "/images/default-tech.png" : src;

  if (isUrl || error) {
    return (
      <div
        className={`relative inline-block ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={finalSrc}
          alt={alt}
          fill
          className="object-contain"
          unoptimized
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <span
      className={`text-2xl leading-none ${className}`}
      style={{ fontSize: size }}
    >
      {src}
    </span>
  );
}

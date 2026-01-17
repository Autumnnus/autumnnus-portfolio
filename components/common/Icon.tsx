"use client";

import Image from "next/image";

interface IconProps {
  src: string; // Creates flexibility: can be a URL or a simple string
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
  // Check if it's an HTTP URL (Online SVG/Image)
  const isUrl = src.startsWith("http") || src.startsWith("/");

  if (isUrl) {
    return (
      <div
        className={`relative inline-block ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          unoptimized // Valid for simple usages like this where we might use external CDNs
        />
      </div>
    );
  }

  // Fallback for emojis if they still sneak in, wrapping them in a span to treat as icon
  // Or if we decide to pass simple strings later.
  return (
    <span
      className={`text-2xl leading-none ${className}`}
      style={{ fontSize: size }}
    >
      {src}
    </span>
  );
}

"use client";

import Image, { StaticImageData } from "next/image";

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
  const isUrl =
    typeof src !== "string" || src.startsWith("http") || src.startsWith("/");

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
          unoptimized
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

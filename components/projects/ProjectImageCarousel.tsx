"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import { useCallback, useEffect, useState } from "react";

interface ProjectImageCarouselProps {
  images: (string | StaticImageData)[];
  title: string;
}

export default function ProjectImageCarousel({
  images,
  title,
}: ProjectImageCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [carouselState, setCarouselState] = useState({
    selectedIndex: 0,
    prevBtnEnabled: false,
    nextBtnEnabled: false,
  });

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCarouselState({
      selectedIndex: emblaApi.selectedScrollSnap(),
      prevBtnEnabled: emblaApi.canScrollPrev(),
      nextBtnEnabled: emblaApi.canScrollNext(),
    });
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    const timer = setTimeout(onSelect, 0);

    return () => {
      clearTimeout(timer);
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const { selectedIndex, prevBtnEnabled, nextBtnEnabled } = carouselState;

  return (
    <div className="relative group">
      <div
        className="overflow-hidden rounded-lg shadow-xl bg-muted"
        ref={emblaRef}
      >
        <div className="flex">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative flex-[0_0_100%] min-w-0 aspect-video sm:aspect-[16/9] lg:aspect-[21/9]"
            >
              <Image
                src={image}
                alt={`${title} - Image ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === selectedIndex
                    ? "bg-foreground w-4"
                    : "bg-foreground/40 hover:bg-foreground/60"
                }`}
                onClick={() => emblaApi && emblaApi.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

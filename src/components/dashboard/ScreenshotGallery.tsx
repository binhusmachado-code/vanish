"use client";

import { useState } from "react";
import type { ScreenshotRef } from "@/lib/engine-types";

/** Thumbnail strip + click-to-zoom lightbox for a broker's proof screenshots. */
export function ScreenshotGallery({ shots }: { shots: ScreenshotRef[] }) {
  const [active, setActive] = useState<ScreenshotRef | null>(null);

  if (shots.length === 0) {
    return (
      <p className="text-xs text-muted">Screenshots appear here as we work.</p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {shots.map((s) => (
          <button
            key={s.path}
            onClick={() => setActive(s)}
            className="group relative h-16 w-24 overflow-hidden rounded-md border border-line transition-colors hover:border-safe"
            title={s.label}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.path}
              alt={s.label}
              className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-6 backdrop-blur-sm"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <figure className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.path}
              alt={active.label}
              className="max-h-[80vh] w-auto rounded-lg border border-line"
            />
            <figcaption className="mt-3 flex items-center justify-between text-sm text-muted">
              <span>{active.label}</span>
              <button
                onClick={() => setActive(null)}
                className="rounded-full border border-line px-4 py-1.5 hover:text-bone"
              >
                Close
              </button>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}

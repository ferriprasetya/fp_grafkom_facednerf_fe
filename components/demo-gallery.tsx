"use client";

import { cn } from "@/lib/utils";
import type { GalleryEntry } from "@/src/services/types";
import { Box, Clock } from "lucide-react";

interface DemoGalleryProps {
  entries: GalleryEntry[];
  activeEntry: GalleryEntry | null;
  onSelect: (entry: GalleryEntry) => void;
}

function formatRelativeTime(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

function truncatePrompt(prompt: string, maxLen = 28): string {
  if (!prompt) return "No prompt";
  return prompt.length > maxLen ? `${prompt.slice(0, maxLen)}…` : prompt;
}

export function DemoGallery({
  entries,
  activeEntry,
  onSelect,
}: DemoGalleryProps) {
  if (entries.length === 0) return null;

  return (
    <section className='flex flex-col gap-2'>
      <span className='text-xs font-medium text-muted-foreground uppercase tracking-widest'>
        Gallery
      </span>

      <div className='flex flex-col gap-1'>
        {entries.map((entry) => {
          const isActive = entry.jobId === activeEntry?.jobId;

          return (
            <button
              key={entry.jobId}
              onClick={() => onSelect(entry)}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/60 text-muted-foreground hover:text-foreground",
              )}
            >
              <Box
                className={cn(
                  "size-3.5 shrink-0",
                  isActive ? "text-primary" : "opacity-50",
                )}
              />

              <div className='min-w-0 flex-1'>
                <p className='truncate text-xs font-medium leading-tight'>
                  {truncatePrompt(entry.prompt)}
                </p>
                <p className='flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5'>
                  <Clock className='size-2.5' />
                  {formatRelativeTime(entry.completedAt)}
                </p>
              </div>

              {isActive && (
                <span className='size-1.5 shrink-0 rounded-full bg-primary' />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}


"use client";

import { useCallback, useState } from "react";
import type { GalleryEntry } from "@/src/services/types";

const MAX_ENTRIES = 12;

export function useGallery() {
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<GalleryEntry | null>(null);

  const addEntry = useCallback((entry: GalleryEntry) => {
    setEntries((prev) => {
      const deduplicated = prev.filter((e) => e.jobId !== entry.jobId);
      const updated = [entry, ...deduplicated];
      return updated.slice(0, MAX_ENTRIES);
    });
    setActiveEntry(entry);
  }, []);

  const selectEntry = useCallback((entry: GalleryEntry) => {
    setActiveEntry(entry);
  }, []);

  const clearGallery = useCallback(() => {
    setEntries([]);
    setActiveEntry(null);
  }, []);

  return { entries, activeEntry, addEntry, selectEntry, clearGallery };
}


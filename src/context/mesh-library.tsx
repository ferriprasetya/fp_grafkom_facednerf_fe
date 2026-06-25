"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface MeshLibraryEntry {
  id: string;
  label: string;
  url: string;
  source: "preset" | "inference" | "upload";
}

interface MeshLibraryValue {
  entries: MeshLibraryEntry[];
  addEntry: (entry: Omit<MeshLibraryEntry, "id">) => string;
}

const PRESET_ENTRIES: MeshLibraryEntry[] = [
  {
    id: "subject-1-facednerf",
    label: "Subject 1 · FaceDNeRF",
    url: "/comparison/subject-1/facednerf.ply",
    source: "preset",
  },
  {
    id: "subject-1-triposr",
    label: "Subject 1 · TripoSR",
    url: "/comparison/subject-1/triposr.ply",
    source: "preset",
  },
  {
    id: "subject-2-facednerf",
    label: "Subject 2 · FaceDNeRF",
    url: "/comparison/subject-2/facednerf.ply",
    source: "preset",
  },
  {
    id: "subject-2-triposr",
    label: "Subject 2 · TripoSR",
    url: "/comparison/subject-2/triposr.ply",
    source: "preset",
  },
];

const MeshLibraryContext = createContext<MeshLibraryValue | null>(null);

export function MeshLibraryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState(PRESET_ENTRIES);

  const addEntry = useCallback((entry: Omit<MeshLibraryEntry, "id">) => {
    const id = `${entry.source}-${crypto.randomUUID()}`;
    setEntries((current) => [{ ...entry, id }, ...current]);
    return id;
  }, []);

  const value = useMemo(() => ({ entries, addEntry }), [entries, addEntry]);

  return (
    <MeshLibraryContext.Provider value={value}>
      {children}
    </MeshLibraryContext.Provider>
  );
}

export function useMeshLibrary() {
  const value = useContext(MeshLibraryContext);
  if (!value) {
    throw new Error("useMeshLibrary must be used inside MeshLibraryProvider");
  }
  return value;
}

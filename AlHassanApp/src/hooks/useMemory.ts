import { useMemoryStore } from "../store/memory.store";
import { useEffect } from "react";

export function useMemory() {
  const { entries, notes, profile, isLoaded, loadAll, refreshNotes, refreshEntries } =
    useMemoryStore();

  useEffect(() => {
    if (!isLoaded) {
      loadAll();
    }
  }, [isLoaded]);

  return { entries, notes, profile, isLoaded, refreshNotes, refreshEntries };
}

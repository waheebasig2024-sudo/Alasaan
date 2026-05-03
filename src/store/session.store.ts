import { create } from "zustand";
import { generateId } from "../utils/text";

interface SessionStore {
  sessionId: string;
  userId: string;
  isOnboarded: boolean;
  setOnboarded: (value: boolean) => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: generateId(),
  userId: generateId(),
  isOnboarded: false,

  setOnboarded: (isOnboarded) => set({ isOnboarded }),

  resetSession: () =>
    set({
      sessionId: generateId(),
    }),
}));

import { create } from "zustand";
import type { ToolStatus } from "../types/tool.types";
import { ALL_TOOLS } from "../tools";

interface ToolState {
  name: string;
  status: ToolStatus;
  lastMessage?: string;
}

interface ToolsStore {
  toolStates: ToolState[];
  activeToolName: string | null;
  setToolStatus: (name: string, status: ToolStatus, message?: string) => void;
  setActiveTool: (name: string | null) => void;
  resetAll: () => void;
}

const initialStates: ToolState[] = ALL_TOOLS.map((t) => ({
  name: t.name,
  status: "idle",
}));

export const useToolsStore = create<ToolsStore>((set) => ({
  toolStates: initialStates,
  activeToolName: null,

  setToolStatus: (name, status, message) =>
    set((state) => ({
      toolStates: state.toolStates.map((t) =>
        t.name === name ? { ...t, status, lastMessage: message } : t
      ),
    })),

  setActiveTool: (activeToolName) => set({ activeToolName }),

  resetAll: () =>
    set({
      toolStates: initialStates,
      activeToolName: null,
    }),
}));

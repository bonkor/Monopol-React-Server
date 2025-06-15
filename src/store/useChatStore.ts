import { create } from 'zustand';

interface ChatMessage {
  from: string | undefined;
  text: string;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),
  reset: () => set({ messages: [] }),
}));

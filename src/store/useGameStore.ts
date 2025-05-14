import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Player } from '@shared/types';
import { sendMessage } from '../services/socket';

interface GameState {
  players: Player[];
  localPlayerIds: string[];
  pendingNames: string[];
  setPlayers: (players: Player[]) => void;
  addLocalPlayer: (name: string) => void;
  confirmLocalPlayer: (playerId: string) => void;
  removePendingName: (name: string) => void;
  reset: () => void;
  errorMessage: string | null;
  setError: (msg: string | null) => void;
  gameStarted: boolean;
  setGameStarted: (value: boolean) => void;

// old
  currentPlayerId: string | null;
  addPlayer: (name: string) => void;
  startGame: () => void;
  movePlayer: (playerId: string, position: number) => void;
  setCurrentPlayer: (playerId: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  players: [],
  localPlayerIds: [],
  pendingNames: [],

  currentPlayerId: null,

  gameStarted: false,
  setGameStarted: (value) => set({ gameStarted: value }),

  setPlayers: (players) => set({ players }),

  addLocalPlayer: (name) => {
    name = name.trim();
    if (!name) return;

    if (get().pendingNames.includes(name)) return;

    sendMessage({ type: 'register', name });

    set((state) => ({
      pendingNames: [...state.pendingNames, name],
    }));
  },

  confirmLocalPlayer: (playerId: string, name: string) => {
    set((state) => ({
      players: [...state.players, {
        id: playerId,
        name: name,
        position: 0,
      }],
      localPlayerIds: [...state.localPlayerIds, playerId],
      pendingNames: state.pendingNames.filter((n) => n !== name),
    }));
  },

  removePendingName: (name) =>
    set((state) => ({
      pendingNames: state.pendingNames.filter((n) => n !== name),
    })),

  reset: () => set({ players: [], localPlayerIds: [], pendingNames: [] }),

  errorMessage: null,
  setError: (msg) => set({ errorMessage: msg }),

  addPlayer: (name: string) => {
    // Генерация ID только на клиенте, если сервер не присваивает
    const id = nanoid();
    const newPlayer: Player = { id, name, position: 0 };

    set((state) => ({
      players: [...state.players, newPlayer],
    }));

    sendMessage({ type: 'register', name });
  },

  startGame: () => {
    sendMessage({ type: 'start' });
  },

  movePlayer: (playerId, position) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, position } : p
      ),
    })),

  setCurrentPlayer: (playerId) => set({ currentPlayerId: playerId }),
}));

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Player } from '@shared/types';
import { sendMessage } from '../services/socket';
import { playSound } from '../utils/playSound';

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
  startGame: () => void;
  diceResult: number | null;
  setDiceResult: (value: number | null) => void;
  animatePlayerMovement: (playerId: string, to: number) => Promise<void>;

// old
  currentPlayerId: string | null;
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

  startGame: () => {
    sendMessage({ type: 'start' });
  },

  diceResult: null,
  setDiceResult: (value) => set({ diceResult: value }),

  movePlayer: (playerId, position) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, position } : p
      ),
    })),

  animatePlayerMovement: async (playerId: string, to: number) => {
    const state = get();
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return;

    const from = player.position;
    const pathLength = (to - from + 42) % 42; // 42 — количество клеток

    for (let i = 1; i <= pathLength; i++) {
      const newPos = (from + i) % 42;
      state.movePlayer(playerId, newPos);
      playSound('step', 0.5);
      await new Promise((resolve) => setTimeout(resolve, 300)); // задержка между шагами
    }
  },

  setCurrentPlayer: (playerId) => set({ currentPlayerId: playerId }),
}));

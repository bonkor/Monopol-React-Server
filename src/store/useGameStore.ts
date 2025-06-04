import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { type Player, Direction } from '@shared/types';
import { calculateMovementPath } from '@shared/movement';
import { type FieldState, InvestmentType } from '@shared/fields';
import { sendMessage } from '../services/socket';
import { playSound } from '../utils/playSound';

interface SacrificeMode {
  targetFieldIndex: number;
  type: InvestmentType;
  buyOrInvest: string;
}

interface GameState {
  players: Player[];
  currentPlayerId: string | null;
  setCurrentPlayer: (playerId: string) => void;
  lastLocalPlayerId: string | null;
  setLastLocalCurrentPlayer: (playerId: string) => void;
  myTurn: boolean;
  setMyTurn: (value: boolean) => void;
  fieldStates: FieldState[];
  getFieldStateByIndex: (index: number) => FieldState | undefined;
  setFieldStates: (states: FieldState[]) => void;
  updateFieldState: (updated: FieldState) => void;
  localPlayerIds: string[];
  pendingNames: string[];
  setPlayers: (players: Player[]) => void;
  addLocalPlayer: (name: string) => void;
  confirmLocalPlayer: (playerId: string, name: string) => void;
  removePendingName: (name: string) => void;
  reset: () => void;
  errorMessage: string | null;
  setError: (msg: string | null) => void;
  gameStarted: boolean;
  setGameStarted: (value: boolean) => void;
  startGame: () => void;
  allowGoStayBut: boolean;
  setAllowGoStayBut: (value: boolean) => void;
  goStayDir: Direction;
  setGoStayDir: (value: Direction) => void;
  allowCenterBut: boolean;
  setAllowCenterBut: (value: boolean) => void;
  allowDice: boolean;
  setAllowDice: (value: boolean) => void;
  allowEndTurn: boolean;
  setAllowEndTurn: (value: boolean) => void;
  diceResult: number | null;
  setDiceResult: (value: number | null) => void;
  animatePlayerMovement: (playerId: string, path: number[]) => Promise<void>;
  getCurrentPlayer: () => Player | null;
  movePlayer: (playerId: string, position: number) => void;
  animatingPlayers: Set<string>;
  sacrificeMode: SacrificeMode | null;
  setSacrificeMode: (data: SacrificeMode | null) => void;
  showMonopolyList: boolean;
  setShowMonopolyList: (value: boolean) => void;
  highlightedCompanies: number[];
  setHighlightedCompanies: (indexes: number[]) => void;
  clearHighlightedCompanies: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  players: [],
  fieldStates: [],
  localPlayerIds: [],
  pendingNames: [],
  currentPlayerId: null,
  lastLocalPlayerId: null,

  animatingPlayers: new Set(),

  setLastLocalCurrentPlayer: (playerId) => set({ lastLocalPlayerId: playerId }),

  getCurrentPlayer: () => {
    const { players, currentPlayerId } = get();
    return players.find((p) => p.id === currentPlayerId) || null;
  },

  setFieldStates: (states) => set({ fieldStates: states }),
  updateFieldState: (updated) =>
    set((state) => ({
      fieldStates: state.fieldStates.map((f) =>
        f.index === updated.index ? updated : f
      ),
    })),
  getFieldStateByIndex: (index) =>
    get().fieldStates.find((f) => f.index === index),

  gameStarted: false,
  setGameStarted: (value) => set({ gameStarted: value }),

  myTurn: false,
  setMyTurn: (value) => set({ myTurn: value }),

  allowGoStayBut: false,
  setAllowGoStayBut: (value) => set({ allowGoStayBut: value }),

  goStayDir: null,
  setGoStayDir: (value) => set({ goStayDir: value }),

  allowCenterBut: false,
  setAllowCenterBut: (value) => set({ allowCenterBut: value }),

  allowDice: false,
  setAllowDice: (value) => set({ allowDice: value }),

  allowEndTurn: false,
  setAllowEndTurn: (value) => set({ allowEndTurn: value }),

  setPlayers: (incomingPlayers) => {
    const { players: currentPlayers, animatingPlayers } = get();

    const mergedPlayers = incomingPlayers.map((incoming) => {
      const current = currentPlayers.find((p) => p.id === incoming.id);
      if (!current) return incoming;

      return {
        ...incoming,
        position: animatingPlayers.has(incoming.id)
          ? current.position
          : incoming.position,
      };
    });

    set({ players: mergedPlayers });
  },

  addLocalPlayer: (name) => {
    name = name.trim();
    if (!name) return;
    if (get().pendingNames.includes(name)) return;

    sendMessage({ type: 'register', name });
    set((state) => ({
      pendingNames: [...state.pendingNames, name],
    }));
  },

  confirmLocalPlayer: (playerId, name) =>
    set((state) => ({
      players: [
        ...state.players,
        {
          id: playerId,
          name,
          position: 0,
        },
      ],
      localPlayerIds: [...state.localPlayerIds, playerId],
      pendingNames: state.pendingNames.filter((n) => n !== name),
    })),

  removePendingName: (name) =>
    set((state) => ({
      pendingNames: state.pendingNames.filter((n) => n !== name),
    })),

  reset: () =>
    set({ players: [], localPlayerIds: [], pendingNames: [], animatingPlayers: new Set() }),

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

  animatePlayerMovement: async (playerId, path) => {
    const animatingPlayers = new Set(get().animatingPlayers);
    animatingPlayers.add(playerId);
    set({ animatingPlayers });

    for (const pos of path) {
      get().movePlayer(playerId, pos);
      playSound('step', 0.5);
      await new Promise((res) => setTimeout(res, 300));
    }

    animatingPlayers.delete(playerId);
    set({ animatingPlayers });
  },

  setCurrentPlayer: (playerId) => set({ currentPlayerId: playerId }),

  sacrificeMode: null,
  setSacrificeMode: (data) => set({ sacrificeMode: data }),

  showMonopolyList: false,
  setShowMonopolyList: (value) => set({ showMonopolyList: value }),

  highlightedCompanies: [],
  setHighlightedCompanies: (indexes) => set({ highlightedCompanies: indexes }),
  clearHighlightedCompanies: () => set({ highlightedCompanies: [] }),
}));

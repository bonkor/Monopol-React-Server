import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { type Player, Direction } from '@shared/types';
import { calculateMovementPath } from '@shared/movement';
import { type FieldState, InvestmentType } from '@shared/fields';
import { sendMessage } from '../services/socket';
import { playSound } from '../utils/playSound';

export type ChancePanelState =
  | null
  | { res1: 0 | null; res2: 0 | null } // просто показать
  | { res1: number; res2: 0 | null }   // строка выделена
  | { res1: number; res2: number };    // строка + столбец выделены

interface SacrificeMode {
  targetFieldIndex: number;
  type: InvestmentType;
  buyOrInvest: string;
}

export type CellInteractionMode =
  | { type: 'none' }
  | { type: 'change'; targetFieldIndex?: number }
  | { type: 'needSell' }
  | { type: 'needSellMonopoly' }
  | { type: 'needBuy' }
  | { type: 'needInvestFree' }
  | { type: 'needRemoveInvest' }
  | { type: 'sacrificeFromChance' }
  | { type: 'loose' }
  | { type: 'choosePos'; positions: number[] };

interface GameState {
  reset: () => void;

  stopConnecting: boolean;
  setStopConnecting: () => void;

  players: Player[];
  currentPlayerId: string | null;
  setCurrentPlayer: (playerId: string) => void;
  lastLocalPlayerId: string | null;
  setLastLocalCurrentPlayer: (playerId: string) => void;

  confirmationPending: boolean;
  setConfirmationPending: (value: boolean) => void;

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
  setLocalPlayerIds: (localPlayerIds: string[]) => void;

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
  showMonopolyList: boolean;
  setShowMonopolyList: (value: boolean) => void;
  highlightedCompanies: number[];
  setHighlightedCompanies: (indexes: number[]) => void;
  clearHighlightedCompanies: () => void;
  currentChance: ChancePanelState;
  chanceQueue: { res1: number; res2: number }[];
  addChanceToQueue: (res1: number, res2: number) => void;
  markChanceAsHandled: () => void;
  sacrificeMode: SacrificeMode | null;
  setSacrificeMode: (data: SacrificeMode | null) => void;

  interactionMode: CellInteractionMode;
  setInteractionMode: (mode: CellInteractionMode) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  players: [],
  fieldStates: [],
  localPlayerIds: [],
  pendingNames: [],
  currentPlayerId: null,
  lastLocalPlayerId: null,

  animatingPlayers: new Set(),

  reset: () => { console.log('reset');
    set({
      players: [],
      localPlayerIds: [],
      pendingNames: [],
      animatingPlayers: new Set(),
      currentPlayerId: null,
      lastLocalPlayerId: null,
      confirmationPending: false,
      myTurn: false,
      fieldStates: [],
      errorMessage: null,
      gameStarted: false,
      allowGoStayBut: false,
      allowCenterBut: false,
      allowDice: false,
      allowEndTurn: false,
      showMonopolyList: false,
      highlightedCompanies: [],
      currentChance: null,
      chanceQueue: [],
      sacrificeMode: null,
      interactionMode: { type: 'none' },
    })},

  stopConnecting: false,
  setStopConnecting: () => set({ stopConnecting: true }),

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

  confirmationPending: false,
  setConfirmationPending: (value: boolean) => set({ confirmationPending: value }),

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

  setLocalPlayerIds: (value) => set({ localPlayerIds: value }),

  errorMessage: null,
  setError: (msg) => set({ errorMessage: msg }),
  //setError: (msg) => {console.log('setting: ', msg); set({ errorMessage: msg }); console.log('setted: ', get().errorMessage)},

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
    const prev = get().animatingPlayers;
    const newSet = new Set(prev);
    newSet.add(playerId);
    set({ animatingPlayers: newSet });

    for (const pos of path) {
      get().movePlayer(playerId, pos);
      playSound('step', 0.5);
      await new Promise((res) => setTimeout(res, 300));
    }

    const after = new Set(get().animatingPlayers);
    after.delete(playerId);
    set({ animatingPlayers: after });
  },

  setCurrentPlayer: (playerId) => set({ currentPlayerId: playerId }),

  showMonopolyList: false,
  setShowMonopolyList: (value) => set({ showMonopolyList: value }),

  highlightedCompanies: [],
  setHighlightedCompanies: (indexes) => set({ highlightedCompanies: indexes }),
  clearHighlightedCompanies: () => set({ highlightedCompanies: [] }),

  currentChance: null,
  chanceQueue: [],

  addChanceToQueue: (res1, res2) => {
    const { currentChance } = get();
    const newItem = { res1, res2 };

    // Если сейчас ничего не отображается (null или невалидные данные) — сразу отображаем
    if (
      !currentChance || res1 > 0 || res2 > 0
    ) {
      set({ currentChance: newItem });
    } else {
      // Иначе — шанс уже отображается, добавляем в очередь
      set((state) => ({
        chanceQueue: [...state.chanceQueue, newItem],
      }));
    }
  },

  markChanceAsHandled: () => {
    set((state) => {
      const [next, ...rest] = state.chanceQueue;
      return {
        currentChance: next ?? null,
        chanceQueue: rest,
      };
    });
  },

  sacrificeMode: null,
  setSacrificeMode: (data) => set({ sacrificeMode: data }),

  interactionMode: { type: 'none' },
  setInteractionMode: (mode) => set({ interactionMode: mode }),
}));

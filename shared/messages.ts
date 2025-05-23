import type { Player } from './types';

export enum ErrorReason {
  NameTaken = 'name-taken',
  GameFull = 'game-full',
  InvalidAction = 'invalid-action',
  Unknown = 'unknown',
};

export type ServerToClientMessage =
  | { type: 'players'; players: Player[] }
  | { type: 'player-registered'; playerId: string }
  | { type: 'move'; playerId: string; path: number[] }
  | { type: 'turn'; playerId: string }
  | { type: 'allow-dice'; playerId: string;  value: number }
  | { type: 'allow-end-turn'; playerId: string }
  | { type: 'show-dice-result'; playerId: string; value: number }
  | { type: 'chat'; from: string; text: string }
  | { type: 'game-over'; winner: Player }
  | { type: 'game-started' }
  | { type: 'error'; reason: ErrorReason; name?: string; message: string };

export type ClientToServerMessage =
  | { type: 'register'; name: string }
  | { type: 'roll-dice'; playerId: string }
  | { type: 'roll-dice-end'; playerId: string }
  | { type: 'end-of-turn'; playerId: string }
  | { type: 'chat'; playerId: string; text: string }
  | { type: 'start' };
  

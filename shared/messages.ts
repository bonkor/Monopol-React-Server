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
  | { type: 'move'; playerId: string; position: number }
  | { type: 'turn'; playerId: string }
  | { type: 'dice-result'; playerId: string; value: number }
  | { type: 'chat'; from: string; text: string }
  | { type: 'game-over'; winner: Player }
  | { type: 'game-started' }
  | { type: 'error'; reason: ErrorReason; name?: string; message: string };

export type ClientToServerMessage =
  | { type: 'register'; name: string }
  | { type: 'roll-dice' }
  | { type: 'chat'; text: string }
  | { type: 'start' };
  

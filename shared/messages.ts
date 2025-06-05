import { type Player, Direction, GoStay } from './types';
import { FieldState, type FieldDefinition } from '../shared/fields';

export enum ErrorReason {
  NameTaken = 'name-taken',
  GameFull = 'game-full',
  InvalidAction = 'invalid-action',
  Unknown = 'unknown',
};

export type ServerToClientMessage =
  | { type: 'players'; players: Player[] }
  | { type: 'field-states-init'; fieldsStates: FieldState[] }
  | { type: 'field-states-update'; fieldState: FieldState }
  | { type: 'player-registered'; playerId: string }
  | { type: 'move'; playerId: string; path: number[]; stay: boolean }
  | { type: 'turn'; playerId: string }
  | { type: 'allow-center-but'; playerId: string }
  | { type: 'dir-choose'; playerId: string; dir: Direction }
  | { type: 'allow-go-stay-but'; playerId: string; dir: Direction }
  | { type: 'allow-dice'; playerId: string;  value: number }
  | { type: 'allow-end-turn'; playerId: string }
  | { type: 'show-dice-result'; playerId: string; value: number }
  | { type: 'show-chance'; res1: number; res2: number }
  | { type: 'chat'; from: string; text: string }
  | { type: 'game-over'; winner: Player }
  | { type: 'game-started' }
  | { type: 'error'; reason: ErrorReason; name?: string; message: string };

export type ClientToServerMessage =
  | { type: 'register'; name: string }
  | { type: 'dir-choose'; playerId: string; dir: Direction }
  | { type: 'go-stay-choose'; playerId: string; dec: GoStay }
  | { type: 'roll-dice'; playerId: string }
  | { type: 'roll-dice-end'; playerId: string }
  | { type: 'end-of-turn'; playerId: string }
  | { type: 'buy'; playerId: string; field: FieldDefinition; sacrificeFirmId?: number }
  | { type: 'sell'; playerId: string; field: FieldDefinition }
  | { type: 'invest'; playerId: string; field: FieldDefinition; sacrificeFirmId?: number }
  | { type: 'income'; playerId: string; field: FieldDefinition }
  | { type: 'chat'; playerId: string; text: string }
  | { type: 'start' };
  

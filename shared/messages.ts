import { type Player, Direction } from './types';
import { type FieldState, type FieldDefinition } from '../shared/fields';

export type ErrorReason = 'name-taken' | 'game-full' | 'invalid-action' | 'not-implemented' | 'unknown';
export const ErrorReason = {
  NameTaken: 'name-taken',
  GameFull: 'game-full',
  InvalidAction: 'invalid-action',
  NotImplemented: 'not-implemented',
  Unknown: 'unknown',
} as const;

export type IpSessionPlayers = {
  sessionId: string;
  ip: string;
  players: Player[];
};

export type ServerToClientMessage =
  | { type: 'set-admin'; isAdmin: boolean }
  | { type: 'list_ips'; ips: IpSessionPlayers[] }
  | { type: 'players'; players: Player[] }
  | { type: 'local-player-ids'; localPlayerIds: string[] }
  | { type: 'field-states-init'; fieldsStates: FieldState[] }
  | { type: 'field-states-update'; fieldState: FieldState }
  | { type: 'player-registered'; playerId: string; name: string }
  | { type: 'alreadyRegistered' }
  | { type: 'move'; playerId: string; path: number[]; stay: boolean }
  | { type: 'turn'; playerId: string }
  | { type: 'need-sacrifice'; playerId: string }
  | { type: 'change'; playerId: string }
  | { type: 'need-buy'; playerId: string }
  | { type: 'need-sell'; playerId: string }
  | { type: 'need-sell-monopoly'; playerId: string }
  | { type: 'need-invest-free'; playerId: string }
  | { type: 'need-remove-invest'; playerId: string }
  | { type: 'choose-pos'; playerId: string; positions: number[] }
  | { type: 'allow-center-but'; playerId: string }
  | { type: 'dir-choose'; playerId: string; dir: Direction }
  | { type: 'allow-go-stay-but'; playerId: string; dir: Direction }
  | { type: 'allow-dice'; playerId: string;  value: number }
  | { type: 'allow-end-turn'; playerId: string }
  | { type: 'show-dice-result'; playerId: string; result: number }
  | { type: 'show-chance'; res1: number; res2: number }
  | { type: 'allow-chance-decision'; playerId: string; text: string }
  | { type: 'chat'; from: string; text: string }
  | { type: 'game-over'; winner: Player }
  | { type: 'game-started' }
  | { type: 'error'; reason: ErrorReason; name?: string; message: string };

export type ClientToServerMessage =
  | { type: 'restart' }
  | { type: 'admin_auth'; password: string }
  | { type: 'list_ips' }
  | { type: 'register'; name: string }
  | { type: 'change-bot'; playerId: string; }
  | { type: 'change-color'; playerId: string; color: string }
  | { type: 'dir-choose'; playerId: string; dir: Direction }
  | { type: 'go-stay-choose'; playerId: string; dec: Direction }
  | { type: 'roll-dice'; playerId: string }
  | { type: 'roll-dice-end'; playerId: string }
  | { type: 'end-of-turn'; playerId: string }
  | { type: 'go'; playerId: string; position: number }
  | { type: 'buy'; playerId: string; field: FieldDefinition; sacrificeFirmId?: number }
  | { type: 'sell'; playerId: string; field: FieldDefinition }
  | { type: 'sacrifice'; playerId: string; field: FieldDefinition }
  | { type: 'loose'; playerId: string; field: FieldDefinition }
  | { type: 'change'; playerId: string; takeField: FieldDefinition; giveFirmId: number }
  | { type: 'invest'; playerId: string; field: FieldDefinition; sacrificeFirmId?: number }
  | { type: 'rem-invest'; playerId: string; field: FieldDefinition }
  | { type: 'income'; playerId: string; field: FieldDefinition }
  | { type: 'payment-decision'; playerId: string; pay: boolean }
  | { type: 'chance-decision'; playerId: string; make: boolean }
  | { type: 'chat'; playerId: string; text: string }
  | { type: 'start' };
  

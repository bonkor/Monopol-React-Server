import { type Money } from './fields';

export type Direction = 'up' | 'down' | 'left' | 'right' | 'move' | 'stay';
export const Direction = {
  Up: 'up',
  Down: 'down',
  Left: 'left',
  Right: 'right',
  Move: 'move',
  Stay: 'stay',
} as const;

export type Action =
  | { type: 'move'; backward: boolean }
  | { type: 'chance' };

export type ActionRequest =
  | {
      type: 'payment';
      to?: string; // ID получателя
      amount: number;
      reason: string;
    }
  | { type: 'loose' };

export type Case = {
  case: string;
  value: string;
};

export type Player = {
  id: string;
  name: string;
  cases?: Case[];
  isBankrupt: boolean;
  isOffline: boolean;
  position?: number;
  direction: Direction | null;
  balance: Money;
  investIncomeBlock: number[];  // запрет на инвестирование и снятие на этом ходу
  inBirja: boolean;
  inJail: boolean;
  inTaxi: boolean;
  turnToStart: number;
  sequester: number;
  refusalToPay: number;
  pendingActions: ActionRequest[];
  refusalToChance: number;
  plusStart: number;
  color: string;
  bot: boolean;
};

export function getPlayerById(players: Player[], id: string): Player | undefined {
  return players?.find((p) => p.id === id);
}

export function getPlayerByName(players: Player[], name: string): Player | undefined {
  return players?.find((p) => p.name === name);
}

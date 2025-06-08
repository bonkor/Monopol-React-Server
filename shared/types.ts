import { type Money } from './fields';

export enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
  Move = 'move',
  Stay = 'stay',
}

export type Action =
  | { type: 'move'; backward: boolean }
  | { type: 'chance' };

export type PaymentRequest = {
  to?: string; // ID получателя
  amount: number;
  reason: string;
};

export type Player = {
  id: string;
  name: string;
  isBankrupt: boolean;
  position?: number;
  direction: Direction;
  balance: Money;
  investIncomeBlock: [number];  // запрет на инвестирование и снятие на этом ходу
  inBirja: boolean;
  inJail: boolean;
  inTaxi: boolean;
  sequester: number;
  refusalToPay: number;
  pendingPayments: PaymentRequest[];
  refusalToChance: number;
  // можно добавить: properties и т.д.
};

export function getPlayerById(players: Player[], id: string): Player {
  return players?.find((p) => p.id === id);
}

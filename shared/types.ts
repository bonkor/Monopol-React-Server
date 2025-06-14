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
  position?: number;
  direction: Direction;
  balance: Money;
  investIncomeBlock: [number];  // запрет на инвестирование и снятие на этом ходу
  inBirja: boolean;
  inJail: boolean;
  inTaxi: boolean;
  turnToStart: number;
  sequester: number;
  refusalToPay: number;
  pendingActions: ActionRequest[];
  refusalToChance: number;
  plusStart: number;
};

export function getPlayerById(players: Player[], id: string): Player {
  return players?.find((p) => p.id === id);
}

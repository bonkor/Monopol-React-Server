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

export type Player = {
  id: string;
  name: string;
  isBankrupt: boolean;
  position: number;
  direction: Direction;
  balance: Money;
  // можно добавить: inJail, properties и т.д.
};

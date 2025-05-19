export enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

export type Action =
  | { type: 'move'; backward: boolean }
  | { type: 'chance' };

export type Player = {
  id: string;
  name: string;
  position: number;
  direction: Direction;
  // можно добавить: balance, inJail, properties и т.д.
};

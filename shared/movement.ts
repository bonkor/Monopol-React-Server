import { Direction } from '@shared/types';

interface MovementOptions {
  from: number;
  steps: number;
  directionOnCross?: Direction;
  backward?: boolean;
  goToStart?: boolean;
}

interface MovementResult {
  path: number[];
  turnedToCenter: boolean;
  passedStart: boolean;
}

const perimeterOrder = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34, 35, 36, 37, 38, 39
];

const crossPoints = [5, 15, 25, 35]; // точки входа на крест

const crossOrderMap: Record<Direction, number[]> = {
  [Direction.Up]: [25, 56, 55, 54, 53, 44, 52, 51, 50, 49, 5],
  [Direction.Down]: [5, 49, 50, 51, 52, 44, 53, 54, 55, 56, 25],
  [Direction.Left]: [15, 48, 47, 46, 45, 44, 43, 42, 41, 40, 35],
  [Direction.Right]: [35, 40, 41, 42, 43, 44, 45, 46, 47, 48, 15],
};

const isPerimeter = (index: number) => index >= 0 && index <= 39;
const isCross = (index: number) => index >= 40 && index <= 56;
const isCrossEntry = (index: number) => crossPoints.includes(index);
const isStart = (index: number) => index === 44;

function getPerimeterNext(current: number, backward: boolean) {
  const idx = perimeterOrder.indexOf(current);
  const len = perimeterOrder.length;
  const nextIdx = (idx + (backward ? -1 : 1) + len) % len;
  return perimeterOrder[nextIdx];
}

export function calculateMovementPath({
  from,
  steps,
  directionOnCross,
  backward = false,
  goToStart = false,
}: MovementOptions): MovementResult {
  const path: number[] = [];
  let turnedToCenter = false;
  let passedStart = false;
  let current = from;

  if (isCross(current) || isCrossEntry(current))
    goToStart = false;

  for (let step = 0; step < steps; step++) {
    // Стартовая позиция - порт
    if (
      step === 0 &&
      isCrossEntry(current)
    ) {
      const direction = (() => {
        switch (current) {
          case 5: return 'down';
          case 15: return 'left';
          case 25: return 'up';
          case 35: return 'right';
        }
      })() as keyof typeof crossOrderMap;

      const crossPath = [...crossOrderMap[direction]];
      // обрезаем путь до steps + 1
      const remaining = steps + 1;
      const segment = crossPath.slice(1, remaining);
      path.push(...segment);
      if (segment.includes(44)) passedStart = true;
      return { path, turnedToCenter, passedStart };
    }

    // Свернуть к старту с периметра, если встречаем вход на крест
    if (
      goToStart &&
      isPerimeter(current) &&
      isCrossEntry(current) &&
      step !== steps - 1
    ) {
      const direction = (() => {
        switch (current) {
          case 5: return 'down';
          case 15: return 'left';
          case 25: return 'up';
          case 35: return 'right';
        }
      })() as keyof typeof crossOrderMap;

      turnedToCenter = true;
      const crossPath = [...crossOrderMap[direction]];
      // обрезаем путь до steps - step + 1
      const remaining = steps - step + 1;
      const segment = crossPath.slice(1, remaining);
      path.push(...segment);
      if (segment.includes(44)) passedStart = true;
      return { path, turnedToCenter, passedStart };
    }

    // Движение по кресту
    if (isCross(current)) {
      let crossPath = crossOrderMap[directionOnCross];
      const idx = crossPath.indexOf(current);
      const next = crossPath[idx + 1];

      if (next !== undefined) {
        current = next;
        path.push(current);
        if (current === 44) passedStart = true;
        continue;
      }

      // Вышли с креста на периметральную точку
      switch (directionOnCross) {
        case 'up': current = 5; break;
        case 'down': current = 25; break;
        case 'left': current = 35; break;
        case 'right': current = 15; break;
      }
      path.push(current);
      continue;
    }

    // Движение по периметру
    if (isPerimeter(current)) {
      const next = getPerimeterNext(current, backward);
      current = next;
      path.push(current);
    }
  }

  return { path, turnedToCenter, passedStart };
}

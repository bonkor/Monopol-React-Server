import { Direction } from './types';

interface MovementOptions {
  from: number;
  steps: number;
  directionOnCross: Direction | null;
  backward?: boolean;
  goToStart?: boolean;
}

interface MovementResult {
  path: number[];
  directionOnCross: Direction | null;
  turnedToCenter: boolean;
  passedStart: boolean;
}

export const perimeterOrder = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34, 35, 36, 37, 38, 39
];

export const crossList = [
  5, 15, 25, 35,
  40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
  51, 52, 53, 54, 55, 56
];

const crossPoints = [5, 15, 25, 35]; // точки входа на крест

const crossOrderMap: Record<Direction, number[]> = {
  [Direction.Up]: [25, 56, 55, 54, 53, 44, 52, 51, 50, 49, 5],
  [Direction.Down]: [5, 49, 50, 51, 52, 44, 53, 54, 55, 56, 25],
  [Direction.Left]: [15, 48, 47, 46, 45, 44, 43, 42, 41, 40, 35],
  [Direction.Right]: [35, 40, 41, 42, 43, 44, 45, 46, 47, 48, 15],
};

export const isPerimeter = (index: number) => index >= 0 && index <= 39;
export const isCross = (index: number) => index >= 40 && index <= 56;
export const isCrossEntry = (index: number) => crossPoints.includes(index);
export const isStart = (index: number) => index === 44;

function getPerimeterNext(current: number, backward: boolean) {
  const idx = perimeterOrder.indexOf(current);
  const len = perimeterOrder.length;
  const nextIdx = (idx + (backward ? -1 : 1) + len) % len;
  return perimeterOrder[nextIdx];
}

export function getCurrentDir(pos: number, dir: Direction, backward = false) {
  if (isCrossEntry(pos)) {
    if (pos === 5) return Direction.Down;
    if (pos === 15) return Direction.Left;
    if (pos === 25) return Direction.Up;
    if (pos === 35) return Direction.Right;
  } else if (isCross(pos)) {
    return dir;
  } else {
    if (backward) {
      if (pos >= 1 && pos <= 10) return Direction.Left;
      if (pos >= 11 && pos <= 20) return Direction.Up;
      if (pos >= 21 && pos <= 30) return Direction.Right;
      if (pos >= 31 && pos <= 39 || pos == 0) return Direction.Down;
    } else {
      if (pos >= 0 && pos <= 9) return Direction.Right;
      if (pos >= 10 && pos <= 19) return Direction.Down;
      if (pos >= 20 && pos <= 29) return Direction.Left;
      if (pos >= 30 && pos <= 39) return Direction.Up;
    }
  }
}

export function getDirOnCross(pos: number): Direction | undefined {
  for (const [dir, arr] of Object.entries(crossOrderMap) as [Direction, number[]][]) {
    const shortened = arr.slice(0, 5);
    if (shortened.includes(pos)) {
      return dir;
    }
  }
  return undefined;
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
      return { path, directionOnCross: direction, turnedToCenter, passedStart };
    }

    // Свернуть к старту с периметра, если встречаем вход на крест
    if (
      goToStart &&
      isPerimeter(current) &&
      isCrossEntry(current) &&
      step !== steps
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
      return { path, directionOnCross: direction, turnedToCenter, passedStart };
    }

    // Движение по кресту
    if (isCross(current)) {
      const crossPath = crossOrderMap[directionOnCross ?? 'down'];
      const idx = crossPath.indexOf(current);
      const next = crossPath[idx + 1];

      if (next !== undefined) {
        current = next;
        path.push(current);
        if (current === 44) passedStart = true;
        continue;
      }

      // Вышли с креста на периметральную точку
      directionOnCross = null;
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

  return { path, directionOnCross, turnedToCenter, passedStart };
}

export function getPathToCenter(from: number, backward: boolean): number[] {
  // Центр
  const CENTER = 44;

  if (from === CENTER) return [CENTER];

  // Если уже на кресте
  for (const dir in crossOrderMap) {
    const path = crossOrderMap[dir as Direction];
    const idx = path.indexOf(from);
    if (idx !== -1 && idx < 5) {
      return [from, ...path.slice(idx + 1, 6)];
    }
  }

  // Если на периметре — ищем первую точку входа на крест
  const pathToCross: number[] = [];
  let current = from;
  while (!isCrossEntry(current)) {
    current = getPerimeterNext(current, backward);
    pathToCross.push(current);
    if (pathToCross.length > 40) break; // защита от бесконечного цикла
  }

  // Добавить путь по кресту
  const direction = (() => {
    switch (current) {
      case 5: return Direction.Down;
      case 15: return Direction.Left;
      case 25: return Direction.Up;
      case 35: return Direction.Right;
      default: return null;
    }
  })();

  const crossPath = direction ? crossOrderMap[direction] : [];
  const pathFromCross = crossPath.slice(1, 6); // без точки входа
  return [from, ...pathToCross, ...pathFromCross];
}

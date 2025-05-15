import { describe, test, expect } from 'vitest';
import { calculateMovementPath, Direction } from './movement';
import { Direction } from './types';

describe('calculateMovementPath', () => {
  test('движение по периметру вперёд без спец. флагов', () => {
    const result = calculateMovementPath({
      from: 0,
      steps: 6,
      backward: false,
      goToStart: false,
    });

    expect(result.path).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.turnedToCenter).toBe(false);
    expect(result.passedStart).toBe(false);
  });

  test('движение по периметру вперёд без спец. флагов с проходом через 0', () => {
    const result = calculateMovementPath({
      from: 37,
      steps: 5,
      backward: false,
      goToStart: false,
    });

    expect(result.path).toEqual([38, 39, 0, 1, 2]);
    expect(result.turnedToCenter).toBe(false);
    expect(result.passedStart).toBe(false);
  });

  test('движение по периметру назад без спец. флагов', () => {
    const result = calculateMovementPath({
      from: 6,
      steps: 3,
      backward: true,
      goToStart: false,
    });

    expect(result.path).toEqual([5, 4, 3]);
    expect(result.turnedToCenter).toBe(false);
    expect(result.passedStart).toBe(false);
  });

  test('движение по периметру назад без спец. флагов с проходом через 0', () => {
    const result = calculateMovementPath({
      from: 2,
      steps: 4,
      backward: true,
      goToStart: false,
    });

    expect(result.path).toEqual([1, 0, 39, 38]);
    expect(result.turnedToCenter).toBe(false);
    expect(result.passedStart).toBe(false);
  });

  test('поворот к старту при встрече с клеткой пересечения', () => {
    const result = calculateMovementPath({
      from: 3,
      steps: 4,
      backward: false,
      goToStart: true,
    });

    expect(result.path).toEqual([4, 5, 49, 50]);
    expect(result.turnedToCenter).toBe(true);
    expect(result.passedStart).toBe(false);
  });

  test('поворот к старту с флагом при движении назад', () => {
    const result = calculateMovementPath({
      from: 16,
      steps: 6,
      directionOnCross: Direction.Right,
      backward: true,
      goToStart: true,
    });

    expect(result.path).toEqual([15, 48, 47, 46, 45, 44]);
    expect(result.turnedToCenter).toBe(true);
    expect(result.passedStart).toBe(true);
  });

  test('поворот к старту сснизу', () => {
    const result = calculateMovementPath({
      from: 24,
      steps: 5,
      backward: false,
      goToStart: true,
    });

    expect(result.path).toEqual([25, 56, 55, 54, 53]);
    expect(result.turnedToCenter).toBe(true);
    expect(result.passedStart).toBe(false);
  });

  test('если стартовая позиция — пересечение, идем сразу по кресту к центру', () => {
    const result = calculateMovementPath({
      from: 35,
      steps: 6,
      directionOnCross: Direction.Left,
      backward: false,
      goToStart: false,
    });

console.log(result);
    expect(result.path).toEqual([40, 41, 42, 43, 44, 45]);
    expect(result.turnedToCenter).toBe(false);
    expect(result.passedStart).toBe(true);
  });

  test('если стартовая позиция — пересечение, идем сразу по кресту к центру с флагом', () => {
    const result = calculateMovementPath({
      from: 35,
      steps: 6,
      directionOnCross: Direction.Left,
      backward: false,
      goToStart: true,
    });

console.log(result);
    expect(result.path).toEqual([40, 41, 42, 43, 44, 45]);
    expect(result.turnedToCenter).toBe(false);
    expect(result.passedStart).toBe(true);
  });

  test('движение по кресту к центру', () => {
    const result = calculateMovementPath({
      from: 40,
      steps: 2,
      directionOnCross: Direction.Right,
      backward: true,
      goToStart: true,
    });

    expect(result.path).toEqual([41, 42]);
    expect(result.turnedToCenter).toBe(false);
    expect(result.passedStart).toBe(false);
  });

  test('выход с креста на периметр, продолжаем по периметру по часовой стрелке', () => {
    const result = calculateMovementPath({
      from: 41,
      steps: 4,
      directionOnCross: Direction.Left,
      backward: false,
      goToStart: false,
    });

    expect(result.path).toEqual([40, 35, 36, 37]);
    expect(result.turnedToCenter).toBe(false);
    expect(result.passedStart).toBe(false);
  });

  test('выход с креста на периметр, идём против часовой при backward', () => {
    const result = calculateMovementPath({
      from: 50,
      steps: 4,
      directionOnCross: Direction.Up,
      backward: true,
      goToStart: true,
    });

    expect(result.path).toEqual([49, 5, 4, 3]);
    expect(result.turnedToCenter).toBe(false);
    expect(result.passedStart).toBe(false);
  });

  test('проход через старт учитывается', () => {
    const result = calculateMovementPath({
      from: 55,
      steps: 3,
      directionOnCross: Direction.Up,
      backward: true,
      goToStart: true,
    });

    expect(result.path).toEqual([54, 53, 44]);
    expect(result.turnedToCenter).toBe(false);
    expect(result.passedStart).toBe(true);
  });

});

import { describe, test, expect } from 'vitest';
import { getCurrentIncome } from './game-rules';
import { type FieldState } from './fields';

describe('getCurrentIncome', () => {
  test('Доход от "Мурзилки 0"', () => {
    const fieldState: FieldState[] = [{ index: 49 }];
    expect(getCurrentIncome({ fieldIndex: 49, gameState: fieldState }))
      .toBe(5);
  });
  test('Доход от "Мурзилки 1"', () => {
    const fieldState: FieldState[] = [{ index: 49, investmentLevel: 1 }];
    expect(getCurrentIncome({ fieldIndex: 49, gameState: fieldState }))
      .toBe(10);
  });
  test('Доход от "Мурзилки 2"', () => {
    const fieldState: FieldState[] = [{ index: 49, investmentLevel: 2 }];
    expect(getCurrentIncome({ fieldIndex: 49, gameState: fieldState }))
      .toBe(15);
  });
  test('Доход от "Мурзилки 0 с книжной монополией"', () => {
    const fieldState: FieldState[] = [{ index: 49,  ownerId: '1'},
      { index: 42,  ownerId: '1'},
      { index: 53,  ownerId: '1'},
      { index: 54,  ownerId: '1'},
    ];
    expect(getCurrentIncome({ fieldIndex: 49, gameState: fieldState }))
      .toBe(10);
  });
  test('Доход от "Мурзилки 1 с книжной монополией"', () => {
    const fieldState: FieldState[] = [{ index: 49,  ownerId: '1', investmentLevel: 1},
      { index: 42,  ownerId: '1'},
      { index: 53,  ownerId: '1'},
      { index: 54,  ownerId: '1'},
    ];
    expect(getCurrentIncome({ fieldIndex: 49, gameState: fieldState }))
      .toBe(20);
  });
  test('Доход от "Мурзилки 2 с книжной монополией"', () => {
    const fieldState: FieldState[] = [{ index: 49,  ownerId: '1', investmentLevel: 2},
      { index: 42,  ownerId: '1'},
      { index: 53,  ownerId: '1'},
      { index: 54,  ownerId: '1'},
    ];
    expect(getCurrentIncome({ fieldIndex: 49, gameState: fieldState }))
      .toBe(30);
  });
});

// shared/getPathToCenter.test.ts
import { describe, expect } from 'vitest';
import { getPathToCenter } from './movement';

describe('getPathToCenter', () => {
  it('возвращает путь от периметра до центра по часовой', () => {
    expect(getPathToCenter(3, false)).toEqual([3, 4, 5, 49, 50, 51, 52, 44]);
  });

  it('возвращает путь от периметра до центра против часовой', () => {
    expect(getPathToCenter(7, true)).toEqual([7, 6, 5, 49, 50, 51, 52, 44]);
  });

  it('возвращает путь от креста до центра', () => {
    expect(getPathToCenter(49, false)).toEqual([49, 50, 51, 52, 44]);
  });

  it('возвращает путь от порта до центра', () => {
    expect(getPathToCenter(35, true)).toEqual([35, 40, 41, 42, 43, 44]);
  });

  it('возвращает пустой путь если уже в центре', () => {
    expect(getPathToCenter(44, false)).toEqual([44]);
  });
});

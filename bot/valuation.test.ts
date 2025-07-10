import { describe, test } from 'vitest';
import { buyValuation, looseValuation } from './bot'; // путь зависит от места
import { fieldDefinitions } from '../shared/fields'; // функция, возвращающая все FieldDefinition[]
import type { FieldDefinition, Player, FieldState } from '../shared/types';

describe('valuation of all companies', () => {
  const mockPlayer: Player = {
    id: 'test-player',
    balance: 1000,
    color: 'red',
    // Добавь нужные поля, если у тебя есть другие в типе Player
  };

  const emptyGameState: FieldState[] = [];

  const companyFields = fieldDefinitions.filter(f => f.investments?.[0]);

  test('вывести ценность всех фирм', () => {
    for (const field of companyFields) {
      const buyVal = buyValuation(mockPlayer, field, emptyGameState, false);
      const sellVal = looseValuation(mockPlayer, field, emptyGameState, false);
      const looseVal = looseValuation(mockPlayer, field, emptyGameState, true);
      console.log(`${field.index} ${field.name ?? 'без названия'} — BUY: ${buyVal}, SELL: ${sellVal}, LOOSE: ${looseVal}`);
    }
  });
});

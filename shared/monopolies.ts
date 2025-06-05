import { type FieldState, getFieldStateByIndex } from './fields';

export type Monopoly = {
  id: string; // уникальный идентификатор, напр. 'USA_Ind', 'USA', 'GER'
  name: string;
  type: string;
  companyIndexes: number[]; // индексы компаний, входящих в монополию
  multiplier: number; // например, 2 для обычной, 4 для двойной и т.п.
};

export const monopolies: Monopoly[] = [
  { id: 'USA_Ind', name: 'США (пром)', group: 'country', companyIndexes: [1, 12, 24], multiplier: 2 },
  { id: 'USA_Int', name: 'США (интелект)', group: 'country', companyIndexes: [29, 34, 54], multiplier: 2 },
  { id: 'USA', name: 'США', ids: ['USA_Ind', 'USA_Int'], companyIndexes: [1, 12, 24, 29, 34, 54], multiplier: 2 },

  { id: 'DDR', name: 'ГДР', group: 'country', companyIndexes: [15, 32, 41], multiplier: 2 },
  { id: 'BRD', name: 'ФРГ', group: 'country', companyIndexes: [17, 22, 46], multiplier: 2 },
  { id: 'GER', name: 'Германия', ids: ['DDR', 'BRD'], companyIndexes: [15, 32, 41, 17, 22, 46], multiplier: 2 },

  { id: 'URS', name: 'СССР', group: 'country', companyIndexes: [9, 31, 43, 49, 52], multiplier: 2 },
  { id: 'ENG', name: 'Англия', group: 'country', companyIndexes: [2, 7, 16, 27, 37], multiplier: 2 },
  { id: 'JAP', name: 'Япония', group: 'country', companyIndexes: [5, 40, 51], multiplier: 2 },
  { id: 'BLK', name: 'Балканы', group: 'country', companyIndexes: [6, 11, 36], multiplier: 2 },
  { id: 'FRA', name: 'Франция', group: 'country', companyIndexes: [19, 26, 39, 47, 55], multiplier: 2 },
  { id: 'HUN', name: 'Венгрия', group: 'country', companyIndexes: [14, 45], multiplier: 2 },
  { id: 'ITA', name: 'Италия', group: 'country', companyIndexes: [35, 48, 53, 56], multiplier: 2 },
  { id: 'HOL', name: 'Голландия', group: 'country', companyIndexes: [4, 25], multiplier: 2 },
  { id: 'SWI', name: 'Швейцария', group: 'country', companyIndexes: [21, 42, 50], multiplier: 2 },

  { id: 'Port', name: 'Порты', group: 'industry', inList: false, companyIndexes: [5, 15, 25, 35], multiplier: 2 },
  { id: 'Spy', name: 'Разведка', group: 'industry', inList: false, companyIndexes: [26, 27, 29], multiplier: 2 },
  { id: 'Healthcare', name: 'Здоровье', group: 'industry', companyIndexes: [43, 47, 50], multiplier: 2 },
  { id: 'Tourism', name: 'Туризм', group: 'industry', companyIndexes: [41, 51, 56], multiplier: 2 },
  { id: 'Radio', name: 'Радиостанции', group: 'industry', inList: false, companyIndexes: [6, 7, 9], multiplier: 2 },
  { id: 'Food', name: 'Пищевые', group: 'industry', inList: false, companyIndexes: [11, 12, 14], multiplier: 2 },
  { id: 'Media', name: 'Информагентства', group: 'industry', inList: false, companyIndexes: [36, 37, 39], multiplier: 2 },
  { id: 'Automotive', name: 'Автоконцерны', group: 'industry', companyIndexes: [40, 45, 46, 48, 52, 55], multiplier: 2 },
  { id: 'Electro', name: 'Электронная промышленность', group: 'industry', inList: false, companyIndexes: [21, 22, 24], multiplier: 2 },
  { id: 'Oil', name: 'Нефтяная промышленность', group: 'industry', inList: false, companyIndexes: [1, 2, 4], multiplier: 2 },
  { id: 'Studio', name: 'Киностудии', group: 'industry', inList: false, companyIndexes: [31, 32, 34], multiplier: 2 },
  { id: 'Avia', name: 'Авиация', group: 'industry', inList: false, companyIndexes: [16, 17, 19], multiplier: 2 },
  { id: 'Newspaper', name: 'Пресса', group: 'industry', companyIndexes: [42, 49, 53, 54], multiplier: 2 },
];

export const firmToMonopolies: Record<number, string[]> = (() => {
  const map: Record<number, string[]> = {};
  for (const mono of monopolies) {
    for (const idx of mono.companyIndexes) {
      if (!map[idx]) map[idx] = [];
      map[idx].push(mono.id);
    }
  }
  return map;
})();

export function getMonopoliesOfPlayer(playerId: string, fieldStates: FieldState[]): Monopoly[] {
  return monopolies.filter(monopoly =>
    monopoly.companyIndexes.every(index => {
      const state = fieldStates.find(f => f.index === index);
      return state?.ownerId === playerId;
    })
  );
}

export type isFieldInCompetedMonopolyResult = {
  ownerId?: number;
  monopolies: Monopoly[];
};

export function isFieldInCompetedMonopoly({
  fieldIndex,
  gameState,
}: {
  fieldIndex: number;
  gameState: FieldState[];
}): isFieldInCompetedMonopolyResult | undefined {
  const fieldState = getFieldStateByIndex(gameState, fieldIndex);
  if (!fieldState) return undefined;

  const ownerId = fieldState.ownerId;
  if (!ownerId) return { ownerId: undefined, monopolies: [] };

  // Найдём все монополии, куда входит данное поле
  const relatedMonopolies = monopolies.filter(mon =>
    mon.companyIndexes.includes(fieldIndex)
  );

  const completedMonopolies: Monopoly[] = [];

  for (const mon of relatedMonopolies) {
    const ownerIds = mon.companyIndexes.map(i => {
      return gameState.find(f => f.index === i)?.ownerId ?? null;
    });

    const allOwned = ownerIds.every(id => id !== null);
    const uniqueOwners = [...new Set(ownerIds.filter(id => id !== null))];

    if (allOwned && uniqueOwners.length === 1 && uniqueOwners[0] === ownerId) {
      completedMonopolies.push(mon);
    }
  }

  return {
    ownerId,
    monopolies: completedMonopolies,
  };
}

export function getIncomeMultiplier(index: number, fieldStates: FieldState[]): number {
  const state = getFieldStateByIndex(fieldStates, index);
  const ownerId = state.ownerId;
  if (!ownerId) return 1;

  const monopolyIds = firmToMonopolies[index];
  let multiplier = 1;
  for (const id of monopolyIds) {
    const monopoly = monopolies.find(m => m.id === id);
    if (!monopoly) continue;
    const ownsAll = monopoly.companyIndexes.every(i => {
      const f = fieldStates.find(f => f.index === i);
      return f?.ownerId === ownerId;
    });
    if (ownsAll) multiplier *= monopoly.multiplier;
  }
  return multiplier;
}

import { type FieldState, getFieldStateByIndex } from './fields';

export type Monopoly = {
  id: string; // уникальный идентификатор, напр. 'USA_Ind', 'USA', 'GER'
  name: string;
  ids: string[] | null; // сюда пишем составляющие для составных монополий
  companyIndexes: number[]; // индексы компаний, входящих в монополию
  group: string; // в какую группу в списке выводить (или не выводить)
  inList: boolean; // выводить или не выводить в список
  multiplier: number; // например, 2 для обычной, 4 для двойной и т.п.
};

export const monopolies: Monopoly[] = [
  { id: 'USA_Ind', name: 'США (пром)', ids: null, inList: true, group: 'country', companyIndexes: [1, 12, 24], multiplier: 2 },
  { id: 'USA_Int', name: 'США (интелект)', ids: null, inList: true, group: 'country', companyIndexes: [29, 34, 54], multiplier: 2 },
  { id: 'USA', name: 'США', ids: ['USA_Ind', 'USA_Int'], inList: true, group: '', companyIndexes: [1, 12, 24, 29, 34, 54], multiplier: 2 },

  { id: 'DDR', name: 'ГДР', ids: null, inList: true, group: 'country', companyIndexes: [15, 32, 41], multiplier: 2 },
  { id: 'BRD', name: 'ФРГ', ids: null, inList: true, group: 'country', companyIndexes: [17, 22, 46], multiplier: 2 },
  { id: 'GER', name: 'Германия', ids: ['DDR', 'BRD'], inList: true, group: '', companyIndexes: [15, 32, 41, 17, 22, 46], multiplier: 2 },

  { id: 'URS', name: 'СССР', ids: null, inList: true, group: 'country', companyIndexes: [9, 31, 43, 49, 52], multiplier: 2 },
  { id: 'ENG', name: 'Англия', ids: null, inList: true, group: 'country', companyIndexes: [2, 7, 16, 27, 37], multiplier: 2 },
  { id: 'JAP', name: 'Япония', ids: null, inList: true, group: 'country', companyIndexes: [5, 40, 51], multiplier: 2 },
  { id: 'BLK', name: 'Балканы', ids: null, inList: true, group: 'country', companyIndexes: [6, 11, 36], multiplier: 2 },
  { id: 'FRA', name: 'Франция', ids: null, inList: true, group: 'country', companyIndexes: [19, 26, 39, 47, 55], multiplier: 2 },
  { id: 'HUN', name: 'Венгрия', ids: null, inList: true, group: 'country', companyIndexes: [14, 45], multiplier: 2 },
  { id: 'ITA', name: 'Италия', ids: null, inList: true, group: 'country', companyIndexes: [35, 48, 53, 56], multiplier: 2 },
  { id: 'HOL', name: 'Голландия', ids: null, inList: true, group: 'country', companyIndexes: [4, 25], multiplier: 2 },
  { id: 'SWI', name: 'Швейцария', ids: null, inList: true, group: 'country', companyIndexes: [21, 42, 50], multiplier: 2 },

  { id: 'Port', name: 'Порты', ids: null, group: 'industry', inList: false, companyIndexes: [5, 15, 25, 35], multiplier: 2 },
  { id: 'Spy', name: 'Разведка', ids: null, group: 'industry', inList: false, companyIndexes: [26, 27, 29], multiplier: 2 },
  { id: 'Healthcare', name: 'Здоровье', ids: null, inList: true, group: 'industry', companyIndexes: [43, 47, 50], multiplier: 2 },
  { id: 'Tourism', name: 'Туризм', ids: null, inList: true, group: 'industry', companyIndexes: [41, 51, 56], multiplier: 2 },
  { id: 'Radio', name: 'Радиостанции', ids: null, group: 'industry', inList: false, companyIndexes: [6, 7, 9], multiplier: 2 },
  { id: 'Food', name: 'Пищевые', ids: null, group: 'industry', inList: false, companyIndexes: [11, 12, 14], multiplier: 2 },
  { id: 'Media', name: 'Информагентства', ids: null, group: 'industry', inList: false, companyIndexes: [36, 37, 39], multiplier: 2 },
  { id: 'Automotive', name: 'Автоконцерны', ids: null, inList: true, group: 'industry', companyIndexes: [40, 45, 46, 48, 52, 55], multiplier: 2 },
  { id: 'Electro', name: 'Электронная промышленность', ids: null, group: 'industry', inList: false, companyIndexes: [21, 22, 24], multiplier: 2 },
  { id: 'Oil', name: 'Нефтяная промышленность', ids: null, group: 'industry', inList: false, companyIndexes: [1, 2, 4], multiplier: 2 },
  { id: 'Studio', name: 'Киностудии', ids: null, group: 'industry', inList: false, companyIndexes: [31, 32, 34], multiplier: 2 },
  { id: 'Avia', name: 'Авиация', ids: null, group: 'industry', inList: false, companyIndexes: [16, 17, 19], multiplier: 2 },
  { id: 'Newspaper', name: 'Пресса', ids: null, inList: true, group: 'industry', companyIndexes: [42, 49, 53, 54], multiplier: 2 },
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
  ownerId?: string;
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
  const ownerId = state?.ownerId;
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

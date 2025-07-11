import { type Player, Direction, getPlayerById } from '../shared/types';
import { m, InvestmentType, type FieldDefinition, fieldDefinitions, getFieldByIndex, getFieldStateByIndex,
  getNextInvestmentType, getNextInvestmentCost, getPropertyPosOfPlayerId, getCurrentInvestmentType,
  getCurrentInvestmentCost } from '../shared/fields';
import { buy, sell, invest } from '../server/game';
import { getCurrentIncome, canBuy, canSell, canInvest, canInvestFree, canIncome } from '../shared/game-rules';
import { monopolies, firmToMonopolies, getMonopoliesOfPlayer } from '../shared/monopolies';

const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export type botDecisionResult = {
  field: FieldDefinition;
  sacrificeId?: number;
};

export async function botCheckAnyAction({
  playerId,
  gameState,
  players,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
}): Promise<void> {
  const player = getPlayerById(players, playerId);
  const position = player.position;
  const field = getFieldByIndex(position);
  const state = getFieldStateByIndex(gameState, position);

  const ownedIndexes = getPropertyPosOfPlayerId({ playerId, gameState });
  const monopolies = getMonopoliesOfPlayer(player.id, gameState);
  const monopolyIndexes = Array.from(new Set(monopolies.flatMap((m) => m.companyIndexes)));

  // === 1. Покупка текущей клетки, если доступна ===
  if (
    field.investments &&
    canBuy({ playerId, fieldIndex: position, gameState, players, fromChance: false })
  ) {
    const type = field.investments[0].type;
    const cost = field.investments[0].cost;
    const value = buyValuation(player, field, gameState, false);

    if ((type === InvestmentType.Regular || type === InvestmentType.Infinite) && player.balance >= cost) {
      await delay(900);
      buy(playerId, field);
      return;
    } else if (type === InvestmentType.SacrificeCompany) {
      for (const ownedIdx of ownedIndexes) {
        const owned = getFieldByIndex(ownedIdx);
        const netValue = value - looseValuation(player, owned, gameState);
        if (player.balance >= cost && netValue > 0) {
          await delay(900);
          buy(playerId, field, owned.index);
          return;
        }
      }
    } else if (type === InvestmentType.SacrificeMonopoly) {
      for (const ownedIdx of monopolyIndexes) {
        const owned = getFieldByIndex(ownedIdx);
        const netValue = value - looseValuation(player, owned, gameState);
        if (player.balance >= cost && netValue > 0) {
          await delay(900);
          buy(playerId, field, owned.index);
          return;
        }
      }
    }
  }

  // === 2. Инвестирование ===
  if (state.ownerId === playerId && canInvest({ playerId, fieldIndex: position, gameState, players, fromChance: false })) {
    const investCost = getNextInvestmentCost({ fieldIndex: field.index, gameState });
    const investType = getNextInvestmentType({ fieldIndex: field.index, gameState });

    if (investCost !== undefined && investType !== undefined) {
      const value = investValuation(player, field, gameState, false);

      if ((investType === InvestmentType.Regular || investType === InvestmentType.Infinite) && value > player.balance * 0.25) {
        if (player.balance >= investCost) {
          await delay(800);
          invest(playerId, field);
          return;
        }
      } else if (investType === InvestmentType.SacrificeCompany) {
        for (const ownedIdx of ownedIndexes) {
          const owned = getFieldByIndex(ownedIdx);
          const net = value - looseValuation(player, owned, gameState);
          if (player.balance >= investCost && net > player.balance * 0.25) {
            await delay(800);
            invest(playerId, field, owned.index);
            return;
          }
        }
      } else if (investType === InvestmentType.SacrificeMonopoly) {
        for (const ownedIdx of monopolyIndexes) {
          const owned = getFieldByIndex(ownedIdx);
          const net = value - looseValuation(player, owned, gameState);
          if (player.balance >= investCost && net > player.balance * 0.25) {
            await delay(800);
            invest(playerId, field, owned.index);
            return;
          }
        }
      }
    }
  }

  // === 3. Покупка на бирже ===
  if (player.inBirja) {
    const allFields = gameState
      .filter((f) => f.ownerId == null)
      .map((f) => getFieldByIndex(f.index))
      .filter((f): f is FieldDefinition => !!f && !!f.investments?.[0])
      .filter((f) =>
        canBuy({
          playerId,
          fieldIndex: f.index,
          gameState,
          players,
          fromChance: false,
        })
      );

    let bestField: FieldDefinition | null = null;
    let bestScore = -Infinity;
    let bestSacrifice: number | undefined = undefined;

    for (const candidate of allFields) {
      const type = candidate.investments[0].type;
      const cost = candidate.investments[0].cost;
      const value = buyValuation(player, candidate, gameState, false);

      if ((type === InvestmentType.Regular || type === InvestmentType.Infinite) && player.balance >= cost) {
        if (value > bestScore) {
          bestScore = value;
          bestField = candidate;
          bestSacrifice = undefined;
        }
      } else if (type === InvestmentType.SacrificeCompany) {
        for (const ownedIdx of ownedIndexes) {
          const owned = getFieldByIndex(ownedIdx);
          const net = value - looseValuation(player, owned, gameState);
          if (player.balance >= cost && net > bestScore) {
            bestScore = net;
            bestField = candidate;
            bestSacrifice = owned.index;
          }
        }
      } else if (type === InvestmentType.SacrificeMonopoly) {
        for (const ownedIdx of monopolyIndexes) {
          const owned = getFieldByIndex(ownedIdx);
          const net = value - looseValuation(player, owned, gameState);
          if (player.balance >= cost && net > bestScore) {
            bestScore = net;
            bestField = candidate;
            bestSacrifice = owned.index;
          }
        }
      }
    }

    if (bestField) {
      if (bestSacrifice !== undefined) {
        const toSell = getFieldByIndex(bestSacrifice);
        await delay(900);
        buy(playerId, bestField, toSell.index);
      } else {
        await delay(900);
        buy(playerId, bestField);
      }
      return;
    }
  }

  return;
}

export async function botCenterDecision({
  playerId,
  gameState,
  players,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
}): Direction {
  botCheckAnyAction({playerId: playerId, gameState: gameState, players: players});
  await delay(400);
  //return Direction.Right;
  switch (Math.floor(Math.random() * 4)) {
    case 0: return Direction.Left;
    case 1: return Direction.Right;
    case 2: return Direction.Up;
    case 3: return Direction.Down;
    default: return Direction.Left;
  }
}

export async function botStayDecision({
  playerId,
  gameState,
  players,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
}): Direction {
  botCheckAnyAction({playerId: playerId, gameState: gameState, players: players});
  await delay(400);
  //return Direction.Stay;
  switch (Math.floor(Math.random() * 2)) {
    case 0: return Direction.Stay;
    case 1: return Direction.Move;
    default: return Direction.Move;
  }
}

export async function botStayJailOrTaxiDecision({
  playerId,
  gameState,
  players,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
}): Direction {
  botCheckAnyAction({playerId: playerId, gameState: gameState, players: players});
  await delay(400);
  const player = getPlayerById(players, playerId);
  if (player.balance > m(20))
    return Direction.Move;
  else
    return Direction.Stay;
}

export async function botBuyDecision({
  playerId,
  gameState,
  players,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
}): botDecisionResult {
  const player = players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');

  const freeFields: FieldDefinition[] = gameState
    .filter(f => f.ownerId == null)
    .map(f => getFieldByIndex(f.index))
    .filter((def): def is FieldDefinition => !!def && !!def.investments?.[0])
    .filter(f => canBuy({ playerId, fieldIndex: f.index, gameState, players, fromChance: true }));

  const ownedIndexes = getPropertyPosOfPlayerId({ playerId, gameState });
  const monopolies = getMonopoliesOfPlayer(player.id, gameState);
  const monopolyFirmIndexes = Array.from(
    new Set(monopolies.flatMap(m => m.companyIndexes))
  );

  let bestField: FieldDefinition | null = null;
  let bestSacrificeId: number | undefined = undefined;
  let bestScore = -Infinity;

  for (const field of freeFields) {
    const investType = field.investments![0].type;

    if (investType === InvestmentType.Regular || investType === InvestmentType.Infinite) {
      const val = buyValuation(player, field, gameState, false);
      if (val > bestScore) {
        bestScore = val;
        bestField = field;
        bestSacrificeId = undefined;
      }
    }

    else if (investType === InvestmentType.SacrificeCompany) {
      for (const ownedIdx of ownedIndexes) {
        const sacrificeField = getFieldByIndex(ownedIdx);
        const gain = buyValuation(player, field, gameState, false);
        const loss = looseValuation(player, sacrificeField, gameState, true);
        const net = gain - loss;

        if (net > bestScore) {
          bestScore = net;
          bestField = field;
          bestSacrificeId = ownedIdx;
        }
      }
    }

    else if (investType === InvestmentType.SacrificeMonopoly) {
      for (const ownedIdx of monopolyFirmIndexes) {
        const sacrificeField = getFieldByIndex(ownedIdx);
        const gain = buyValuation(player, field, gameState, false);
        const loss = looseValuation(player, sacrificeField, gameState, true);
        const net = gain - loss;

        if (net > bestScore) {
          bestScore = net;
          bestField = field;
          bestSacrificeId = ownedIdx;
        }
      }
    }
  }

  await delay(400);
  if (!bestField) throw new Error('No suitable field to buy');

  return {
    field: bestField,
    sacrificeId: bestSacrificeId,
  };
}

export async function botChangeDecision({
  playerId,
  gameState,
  players,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
}): botDecisionResult {
  const player = players.find(p => p.id === playerId);
  if (!player) throw new Error("Player not found");

  const ownedPropertyIndexes = getPropertyPosOfPlayerId({ playerId, gameState });
  const freeProperties: FieldDefinition[] = gameState
    .filter((f) => f.ownerId == null)
    .map((f) => getFieldByIndex(f.index))
    .filter((def): def is FieldDefinition => !!def && !!def.investments?.[0]);

  let bestScore = -Infinity;
  let bestFreeField: FieldDefinition | null = null;
  let bestSacrificeId: number | undefined = undefined;

  for (const freeField of freeProperties) {
    const freeValuation = buyValuation(player, freeField, gameState, true);

    for (const ownedIndex of ownedPropertyIndexes) {
      const ownedFieldDef = getFieldByIndex(ownedIndex);
      const ownedValuation = looseValuation(player, ownedFieldDef, gameState, true);

      // Проверяем условие: приобретаемая фирма должна быть дешевле (по цене покупки)
      if (
        freeField.investments &&
        ownedFieldDef.investments &&
        freeField.investments[0].cost < ownedFieldDef.investments[0].cost
      ) {
        const score = freeValuation - ownedValuation;
        if (score > bestScore) {
          bestScore = score;
          bestFreeField = freeField;
          bestSacrificeId = ownedFieldDef.index;
        }
      }
    }
  }

  if (!bestFreeField || bestSacrificeId === undefined) {
    throw new Error("No valid exchange found, but function was called anyway");
  }

  await delay(400);
  return {
    field: bestFreeField,
    sacrificeId: bestSacrificeId,
  };
}

export async function botInvestDecision({
  playerId,
  gameState,
  players,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
}): FieldDefinition {
  const player = players.find(p => p.id === playerId);
  if (!player) throw new Error("Player not found");

  const fieldPositions = getPropertyPosOfPlayerId({playerId: playerId, gameState: gameState});
  if (fieldPositions.length === 0) {
    throw new Error("Player has no properties to invest");
  }
  const fieldCanInvest = fieldPositions
    .filter((p) => canInvestFree({playerId: playerId, fieldIndex: p, gameState: gameState, players: players, fromChance: true}));

  let bestField: FieldDefinition | null = null;
  let bestValuation = -Infinity;

  for (const index of fieldCanInvest) {
    const field = getFieldByIndex(index);
    const val = investValuation(player, field, gameState, true);

    if (val > bestValuation) {
      bestValuation = val;
      bestField = field;
    }
  }

  if (!bestField) throw new Error("Failed to determine field to invest");

  await delay(400);
  return bestField;
}

export async function botRemInvestDecision({
  playerId,
  gameState,
  players,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
}): FieldDefinition {
  const player = players.find(p => p.id === playerId);
  if (!player) throw new Error("Player not found");

  const playerProperties = gameState
    .filter((f) => f.ownerId == playerId && f.investmentLevel > 0);

  if (playerProperties.length === 0) {
    throw new Error("Player has no properties to rem invest");
  }

  let worstField: FieldDefinition | null = null;
  let worstValuation = Infinity;

  for (const state of playerProperties) {
    const field = getFieldByIndex(state.index);
    const val = looseValuation(player, field, gameState, false);

    if (val < worstValuation) {
      worstValuation = val;
      worstField = field;
    }
  }

  if (!worstField) throw new Error("Failed to determine field to rem invest");

  await delay(400);
  return worstField;
}

export async function botSellDecision({
  playerId,
  gameState,
  players,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
}): FieldDefinition {
  const player = players.find(p => p.id === playerId);
  if (!player) throw new Error("Player not found");

  const fieldPositions = getPropertyPosOfPlayerId({ playerId, gameState });

  if (fieldPositions.length === 0) {
    throw new Error("Player has no properties to sell");
  }

  let worstField: FieldDefinition | null = null;
  let worstValuation = Infinity;

  for (const index of fieldPositions) {
    const field = getFieldByIndex(index);
    const val = looseValuation(player, field, gameState, false);

    if (val < worstValuation) {
      worstValuation = val;
      worstField = field;
    }
  }

  if (!worstField) throw new Error("Failed to determine field to sell");

  await delay(400);
  return worstField;
}

export async function botSellMonopolyDecision({
  playerId,
  gameState,
  players,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
}): FieldDefinition {
  const player = players.find(p => p.id === playerId);
  if (!player) throw new Error("Player not found");

  const monopolies = getMonopoliesOfPlayer(player.id, gameState);
  const monopolyFirmIndexes = Array.from(
    new Set(monopolies.flatMap(m => m.companyIndexes))
  );

  if (monopolyFirmIndexes.length === 0) {
    throw new Error("Player has no properties to sell");
  }

  let worstField: FieldDefinition | null = null;
  let worstValuation = Infinity;

  for (const index of monopolyFirmIndexes) {
    const field = getFieldByIndex(index);
    const val = looseValuation(player, field, gameState, false);

    if (val < worstValuation) {
      worstValuation = val;
      worstField = field;
    }
  }

  if (!worstField) throw new Error("Failed to determine field to sell");

  await delay(400);
  return worstField;
}

export async function botSacrificeDecision({
  playerId,
  gameState,
  players,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
}): FieldDefinition {
  const player = players.find(p => p.id === playerId);
  if (!player) throw new Error("Player not found");

  const fieldPositions = getPropertyPosOfPlayerId({ playerId, gameState });

  if (fieldPositions.length === 0) {
    throw new Error("Player has no properties to sell");
  }

  let worstField: FieldDefinition | null = null;
  let worstValuation = Infinity;

  for (const index of fieldPositions) {
    const field = getFieldByIndex(index);
    const val = looseValuation(player, field, gameState, true);

    if (val < worstValuation) {
      worstValuation = val;
      worstField = field;
    }
  }

  if (!worstField) throw new Error("Failed to determine field to sell");

  await delay(400);
  return worstField;
}

export function buyValuation(player: Player, field: FieldDefinition, gameState: gameState, free: boolean): number {
  let multiplier = 1;
  const monopolyIds = firmToMonopolies[field.index];
  if (monopolyIds)
    for (const id of monopolyIds) {
      const monopoly = monopolies.find(m => m.id === id);
      if (!monopoly) continue;
      const ownsAll = monopoly.companyIndexes.every(i => {
        const f = gameState.find(f => f.index === i);
        return f?.ownerId === player.id || f?.index === field.index;
      });
      if (ownsAll) multiplier *= monopoly.multiplier;
    }

  var valuation = 0;
  valuation += field.investments[0].resultingIncome * 5 * multiplier;
  if (!free) {
    valuation -= (field.investments[0].type === InvestmentType.Regular) ? field.investments[0].cost : 0;
  }
  if ([5, 15, 25, 35].includes(field.index)) valuation += 3000;
  if (field.investments[field.investments.length - 1].type === InvestmentType.Infinite) valuation += 500 * multiplier;
  valuation += field.investments[field.investments.length - 1].resultingIncome * 5 * multiplier;
  valuation -= field.investments[field.investments.length - 1].cost;
console.log(buyValuation, field.name, valuation);
  return valuation;
}

export function looseValuation(player: Player, field: FieldDefinition, gameState: gameState, free: boolean): number {
  let multiplier = 1;
  const monopolyIds = firmToMonopolies[field.index];
  if (monopolyIds)
    for (const id of monopolyIds) {
      const monopoly = monopolies.find(m => m.id === id);
      if (!monopoly) continue;
      const ownsAll = monopoly.companyIndexes.every(i => {
        const f = gameState.find(f => f.index === i);
        return f?.ownerId === player.id || f?.index === field.index;
      });
      if (ownsAll) multiplier *= monopoly.multiplier;
    }

  const state = getFieldStateByIndex(gameState, field.index);
  var valuation = 0;
  valuation += getCurrentIncome({fieldIndex: field.index, gameState: gameState}) * 5;
  if (!free) valuation -= field.investments[0].cost;
  if ([5, 15, 25, 35].includes(field.index)) valuation += 3000;
  if (state.investmentLevel < field.investments.length - 1)
    valuation += field.investments[field.investments.length - 1].resultingIncome * 5 * multiplier;
console.log(looseValuation, field.name, valuation);
  return valuation;
}

export function investValuation(player: Player, field: FieldDefinition, gameState: gameState, free: boolean): number {
  let multiplier = 1;
  const monopolyIds = firmToMonopolies[field.index];
  if (monopolyIds)
    for (const id of monopolyIds) {
      const monopoly = monopolies.find(m => m.id === id);
      if (!monopoly) continue;
      const ownsAll = monopoly.companyIndexes.every(i => {
        const f = gameState.find(f => f.index === i);
        return f?.ownerId === player.id || f?.index === field.index;
      });
      if (ownsAll) multiplier *= monopoly.multiplier;
    }

  const cost = getNextInvestmentCost({fieldIndex: field.index, gameState: gameState});
  const type = getNextInvestmentType({fieldIndex: field.index, gameState: gameState});
  var valuation = 0;
  if (cost) valuation += cost;
  if (type && type === InvestmentType.SacrificeCompany) valuation += 1000;
  if (type && type === InvestmentType.SacrificeCompany) valuation += 2000;
  valuation *= multiplier;
console.log(investValuation, field.name, valuation);
  return valuation;
}

export function remInvestValuation(player: Player, field: FieldDefinition, gameState: gameState, free: boolean): number {
  let multiplier = 1;
  const monopolyIds = firmToMonopolies[field.index];
  if (monopolyIds)
    for (const id of monopolyIds) {
      const monopoly = monopolies.find(m => m.id === id);
      if (!monopoly) continue;
      const ownsAll = monopoly.companyIndexes.every(i => {
        const f = gameState.find(f => f.index === i);
        return f?.ownerId === player.id || f?.index === field.index;
      });
      if (ownsAll) multiplier *= monopoly.multiplier;
    }

  const cost = getCurrentInvestmentCost({fieldIndex: field.index, gameState: gameState});
  const type = getCurrentInvestmentType({fieldIndex: field.index, gameState: gameState});
  var valuation = 0;
  if (cost) valuation += cost;
  if (type && type === InvestmentType.SacrificeCompany) valuation += 1000;
  if (type && type === InvestmentType.SacrificeCompany) valuation += 2000;
  valuation *= multiplier;
console.log(remInvestValuation, field.name, valuation);
  return valuation;
}

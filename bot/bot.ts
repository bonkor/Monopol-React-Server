import { type Player, Direction, getPlayerById } from '../shared/types';
import { Money, m, FieldType, InvestmentType, type FieldDefinition, fieldDefinitions, getFieldByIndex,
  getFieldStateByIndex, getNextInvestmentType, getNextInvestmentCost, getPropertyPosOfPlayerId,
  getCurrentInvestmentType, getCurrentInvestmentCost, getMinFreePropertyPrice, getPropertyTotalCost } from '../shared/fields';
import { buy, sell, invest, getGameState } from '../server/game';
import { getCurrentIncome, canBuy, canSell, canInvest, canInvestFree, canIncome } from '../shared/game-rules';
import { monopolies, firmToMonopolies, getMonopoliesOfPlayer } from '../shared/monopolies';
import { calculateMovementPath } from '../shared/movement';

const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

function findFirmToSacrificeToAfford({
  player,
  gameState,
  cost,
  desiredValue,
  ownedIndexes,
}: {
  player: Player;
  gameState: FieldState[];
  cost: number;
  desiredValue: number;
  ownedIndexes: number[];
}): number | undefined {
  let bestScore = -Infinity;
  let bestIdx: number | undefined = undefined;

  for (const idx of ownedIndexes) {
    const owned = getFieldByIndex(idx);
    const ownedValue = looseValuation(player, owned, gameState);
    const ownedCost = owned.investments?.[0].cost ?? 0;
    const score = desiredValue - ownedValue;

    if (score > 0 && score > bestScore && player.balance + ownedCost >= cost) {
      bestScore = score;
      bestIdx = idx;
    }
  }

  return bestIdx;
}

function findBestSacrifice({
  player,
  candidateValue,
  candidateCost,
  ownedIndexes,
  gameState,
}: {
  player: Player;
  candidateValue: number;
  candidateCost: number;
  ownedIndexes: number[];
  gameState: FieldState[];
}): number | undefined {
  let bestScore = -Infinity;
  let bestIdx: number | undefined = undefined;

  for (const idx of ownedIndexes) {
    const field = getFieldByIndex(idx);
    const net = candidateValue - looseValuation(player, field, gameState);
    if (player.balance >= candidateCost && net > bestScore) {
      bestScore = net;
      bestIdx = idx;
    }
  }

  return bestIdx;
}

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

  // === 1. Покупка текущей клетки ===
  if (
    field.investments &&
    canBuy({ playerId, fieldIndex: position, gameState, players, fromChance: false, ignoreBalance: true, })
  ) {
    const type = field.investments[0].type;
    const cost = field.investments[0].cost;
    const value = buyValuation(player, field, gameState, false);

    let bestSacrifice: number | undefined;

    if (type === InvestmentType.Regular || type === InvestmentType.Infinite) {
      if (player.balance < cost) {
        bestSacrifice = findFirmToSacrificeToAfford({ player, gameState, cost, desiredValue: value, ownedIndexes });
        if (bestSacrifice === undefined) return;
        await delay(600);
        sell(playerId, getFieldByIndex(bestSacrifice));
      }
      await delay(900);
      buy(playerId, field);
      return;
    }

    if (type === InvestmentType.SacrificeCompany) {
      bestSacrifice = findBestSacrifice({
        player,
        candidateValue: value,
        candidateCost: cost,
        ownedIndexes,
        gameState,
      });
    }

    if (type === InvestmentType.SacrificeMonopoly) {
      bestSacrifice = findBestSacrifice({
        player,
        candidateValue: value,
        candidateCost: cost,
        ownedIndexes: monopolyIndexes,
        gameState,
      });
    }

    if (bestSacrifice !== undefined) {
      await delay(900);
      buy(playerId, field, bestSacrifice);
      return;
    }
  }

  // === 2. Инвестирование ===
  if (state && state.ownerId === playerId &&
    canInvest({ playerId, fieldIndex: position, gameState, players, fromChance: false, ignoreBalance: true, })) {
    const investCost = getNextInvestmentCost({ fieldIndex: field.index, gameState });
    const investType = getNextInvestmentType({ fieldIndex: field.index, gameState });

    if (investCost !== undefined && investType !== undefined) {
      const value = investValuation(player, field, gameState, false);

      if ((investType === InvestmentType.Regular || investType === InvestmentType.Infinite)) {
        if (value > player.balance * 0.25) {
          if (player.balance >= investCost) {
            await delay(800);
            invest(playerId, field);
            return;
          } else {
            const bestSacrifice = findFirmToSacrificeToAfford({ player, gameState, cost: investCost, desiredValue: value, ownedIndexes });
            if (bestSacrifice !== undefined) {
              await delay(600);
              sell(playerId, getFieldByIndex(bestSacrifice));
              await delay(800);
              invest(playerId, field);
              return;
            }
          }
        }
      }

      if (investType === InvestmentType.SacrificeCompany) {
        const best = findBestSacrifice({
          player,
          candidateValue: value,
          candidateCost: investCost,
          ownedIndexes,
          gameState,
        });
        if (best !== undefined && value - looseValuation(player, getFieldByIndex(best), gameState) > player.balance * 0.25) {
          await delay(800);
          invest(playerId, field, best);
          return;
        }
      }

      if (investType === InvestmentType.SacrificeMonopoly) {
        const best = findBestSacrifice({
          player,
          candidateValue: value,
          candidateCost: investCost,
          ownedIndexes: monopolyIndexes,
          gameState,
        });
        if (best !== undefined && value - looseValuation(player, getFieldByIndex(best), gameState) > player.balance * 0.25) {
          await delay(800);
          invest(playerId, field, best);
          return;
        }
      }
    }
  }

  // === 3. Биржа: покупка любой фирмы ===
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
          ignoreBalance: true,
        })
      );

    let bestField: FieldDefinition | null = null;
    let bestScore = -Infinity;
    let bestSacrifice: number | undefined = undefined;
    let sacrificeReason: 'sellToAfford' | 'sacrificeToBuy' | undefined = undefined;

    for (const candidate of allFields) {
      const type = candidate.investments[0].type;
      const cost = candidate.investments[0].cost;
      const value = buyValuation(player, candidate, gameState, false);

      if (type === InvestmentType.Regular || type === InvestmentType.Infinite) {
        if (player.balance >= cost) {
          if (value > bestScore) {
            bestScore = value;
            bestField = candidate;
            bestSacrifice = undefined;
            sacrificeReason = undefined;
          }
        } else {
          const sacrifice = findFirmToSacrificeToAfford({ player, gameState, cost, desiredValue: value, ownedIndexes });
          if (sacrifice !== undefined) {
            const score = value - looseValuation(player, getFieldByIndex(sacrifice), gameState);
            if (score > bestScore) {
              bestScore = score;
              bestField = candidate;
              bestSacrifice = sacrifice;
              sacrificeReason = 'sellToAfford';
            }
          }
        }
      }

      if (type === InvestmentType.SacrificeCompany) {
        const sacrifice = findBestSacrifice({
          player,
          candidateValue: value,
          candidateCost: cost,
          ownedIndexes,
          gameState,
        });
        if (sacrifice !== undefined && value - looseValuation(player, getFieldByIndex(sacrifice), gameState) > bestScore) {
          bestScore = value - looseValuation(player, getFieldByIndex(sacrifice), gameState);
          bestField = candidate;
          bestSacrifice = sacrifice;
          sacrificeReason = 'sacrificeToBuy';
        }
      }

      if (type === InvestmentType.SacrificeMonopoly) {
        const sacrifice = findBestSacrifice({
          player,
          candidateValue: value,
          candidateCost: cost,
          ownedIndexes: monopolyIndexes,
          gameState,
        });
        if (sacrifice !== undefined && value - looseValuation(player, getFieldByIndex(sacrifice), gameState) > bestScore) {
          bestScore = value - looseValuation(player, getFieldByIndex(sacrifice), gameState);
          bestField = candidate;
          bestSacrifice = sacrifice;
          sacrificeReason = 'sacrificeToBuy';
        }
      }
    }

    if (bestField) {
      if (bestSacrifice !== undefined) {
        if (sacrificeReason === 'sellToAfford') {
          await delay(600);
          sell(playerId, getFieldByIndex(bestSacrifice));
          await delay(900);
          buy(playerId, bestField);
        } else if (sacrificeReason === 'sacrificeToBuy') {
          await delay(900);
          buy(playerId, bestField, bestSacrifice);
        }
      } else {
        await delay(900);
        buy(playerId, bestField);
      }
      return;
    }
  }
}

export async function botCenterDecision({
  playerId,
  gameState,
  players,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
}): Promise<Direction> {
  await botCheckAnyAction({ playerId, gameState, players });
  await delay(400);
return Direction.Left;

  const player = getPlayerById(players, playerId);
  const directions: Direction[] = [Direction.Left, Direction.Right, Direction.Up, Direction.Down];

  let bestDirection: Direction = Direction.Left;
  let bestValue = -Infinity;

  for (const direction of directions) {
    const result = calculateMovementPath({
      from: 44,
      steps: 10,
      directionOnCross: direction,
      backward: false,
    });

console.log(botCenterDecision, result.path);
    const pathValue = result.path.reduce((sum, index) => {
      const field = getFieldByIndex(index);
      if (!field) return sum;
      return sum + standValuation(player, field, gameState, players);
    }, 0);
console.log(botCenterDecision, pathValue);

    if (pathValue > bestValue) {
      bestValue = pathValue;
      bestDirection = direction;
    }
  }

  return bestDirection;
}

export async function botStayDecision({
  playerId,
  gameState,
  players,
  backward,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
  backward: boolean;
}): Promise<Direction> {
  await botCheckAnyAction({ playerId, gameState, players });
  await delay(400);

  const player = getPlayerById(players, playerId);
  const position = player.position;

  // Получаем направление, если стоим на кресте
  const direction = player.direction;
  const movement = calculateMovementPath({
    from: position,
    steps: 6,
    directionOnCross: direction,
    backward: backward,
  });

  const moveToIndex = movement.path[movement.path.length - 1];
  const moveToField = getFieldByIndex(moveToIndex);
  const moveValue = moveToField ? standValuation(player, moveToField, gameState, players) : 0;

  const currentField = getFieldByIndex(position);
  const stayCurrent = currentField ? 0.5 * standValuation(player, currentField, gameState, players) : 0;

  const stayPathValue = movement.path.reduce((sum, idx) => {
    const f = getFieldByIndex(idx);
    return sum + (f ? standValuation(player, f, gameState, players) / 12 : 0);
  }, 0);

  const stayValue = stayCurrent + stayPathValue;

console.log(botStayDecision, 'stay:', stayValue, 'move:', moveValue);

  return moveValue > stayValue ? Direction.Move : Direction.Stay;
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

export async function botPositionDecision({
  playerId,
  gameState,
  players,
  positions,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
  positions: number[];
}): number {
  const player = players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');

  let bestPosition: number = positions?.[0];
  let bestValue = -Infinity;

  for (const pos of positions) {
    const field = getFieldByIndex(pos);
    const valuation = standValuation(player, field, gameState, players);

    if (valuation > bestValue) {
      bestValue = valuation;
      bestPosition = pos;
    }
  }
  return bestPosition;
}

export function botChanceDecision( player: Player,  key: string): boolean {
  switch (key) {
    case '2,3': // пожертвуй фирму
    case '5,3': // продай монополию
      return false;
      break;
    case '4,3': // -50
      if (player.balance < 50)
        return false;
      else return true;
      break;
    default:
      return true;
  }
}

export function botPaymentDecision( player: Player,  amount: Money): boolean {
  if (player.balance < amount) {
    const propCost = getPropertyTotalCost({playerId: player.id, gameState: getGameState()});
    if (propCost && propCost < 5 * amount) return false;
  }
  return true;
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

  let valuation = 0;
  valuation += field.investments[0].resultingIncome * 5 * multiplier;
  if (!free) {
    valuation -= (field.investments[0].type === InvestmentType.Regular) ? field.investments[0].cost : 0;
  }
  if ([5, 15, 25, 35].includes(field.index)) valuation += 4000;
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
  let valuation = 0;
  valuation += getCurrentIncome({fieldIndex: field.index, gameState: gameState}) * 5;
  if (!free) valuation -= field.investments[0].cost;
  if ([5, 15, 25, 35].includes(field.index)) valuation += 4000;
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
  let valuation = 0;
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
  let valuation = 0;
  if (cost) valuation += cost;
  if (type && type === InvestmentType.SacrificeCompany) valuation += 1000;
  if (type && type === InvestmentType.SacrificeCompany) valuation += 2000;
  valuation *= multiplier;
console.log(remInvestValuation, field.name, valuation);
  return valuation;
}

export function standValuation(player: Player, field: FieldDefinition, gameState: gameState, players: Player[]): number {
  let valuation = 0;
  switch (field.type) {
    case FieldType.Start:
      valuation += 250;
      break;
    case FieldType.Taxi:
    case FieldType.Jail:
      valuation -= 100;
      break;
    case FieldType.Birga:
      valuation -= 100;
      const minPrice = getMinFreePropertyPrice(gameState);
      if (player.balance >= minPrice + 100) {
        const freeProperties = gameState
          .filter((f) => f.ownerId == null)
          .map((f) => getFieldByIndex(f.index))
          .filter((def): def is FieldDefinition => !!def && !!def.investments?.[0])
          .filter((f) => f.investments[0].cost <= player.balance - 100)
          .map((f) => canBuy({
            playerId: player.id,
            fieldIndex: f.index,
            gameState: gameState,
            players: players,
            fromChance: true,
            }) ? buyValuation(player, f, gameState, false) : 0);
        const max: number = Math.max(...freeProperties);
        valuation += max / 10;
      }
      break;
    case FieldType.Firm:
      const state = getFieldStateByIndex(gameState, field.index);
      const ownerId = state.ownerId;
      if (!ownerId) {
        if (canBuy({
            playerId: player.id,
            fieldIndex: field.index,
            gameState: gameState,
            players: players,
            fromChance: true,
            }))
          valuation += buyValuation(player, field, gameState, false) / 10;
      } else {
        const income = getCurrentIncome({fieldIndex: field.index, gameState});
        if (ownerId === player.id)
          valuation += income;
        else
          valuation -= income;
      }
  }
  if ([5, 15, 25, 35].includes(field.index) || field.index >= 40) valuation += 250;
console.log(standValuation, field.name, valuation);
  return valuation;
}

import { type Player, Direction, getPlayerById } from '../shared/types';
import { m, InvestmentType, type FieldDefinition, fieldDefinitions, getFieldByIndex, getFieldStateByIndex,
  getNextInvestmentType } from '../shared/fields';
import { buy } from '../server/game';
import { getCurrentIncome, canBuy, canSell, canInvest, canInvestFree, canIncome } from '../shared/game-rules';

const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export async function botCheckAnyAction({
  playerId,
  gameState,
  players,
}: {
  playerId: string;
  gameState: FieldState[];
  players: Player[];
}): void {
  const player = getPlayerById(players, playerId);
  const position = player.position;
  const field = getFieldByIndex(position);
  const state = getFieldStateByIndex(gameState, position);

  // пока покупаем все, что можем
  if (field.investments && field.investments[0]?.type === InvestmentType.Regular &&
    canBuy({playerId: playerId, fieldIndex: position, gameState: gameState, players: players, fromChance: false})) {
    await delay(900);
    buy(playerId, field);
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

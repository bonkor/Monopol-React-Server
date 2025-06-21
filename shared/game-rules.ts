import { type Player, getPlayerById } from './types';
import type { FieldState, FieldType, Money } from './fields';
import { getIncomeMultiplier, getMonopoliesOfPlayer } from './monopolies';
import { InvestmentType, FieldType, getFieldByIndex, getFieldStateByIndex,
  m, getNextInvestmentCost, getNextInvestmentType } from './fields';

export function getCurrentIncome({
  fieldIndex,
  gameState,
}: {
  fieldIndex: number;
  gameState: FieldState[];
}): Money | undefined {
  const fieldDef = getFieldByIndex(fieldIndex);
  if (fieldDef.type !== FieldType.Firm) return undefined;
  const fieldState = getFieldStateByIndex(gameState, fieldIndex);

  const level = fieldState.investmentLevel ?? 0;
  const investmentOptions = fieldDef.investments;
  const lastInvestmentType = investmentOptions.at(-1).type;

  const mult = getIncomeMultiplier(fieldIndex, gameState);

  if (lastInvestmentType === InvestmentType.Infinite && level >= investmentOptions.length - 1) {
    return (investmentOptions.at(-2).resultingIncome + investmentOptions.at(-1).resultingIncome *
      (level - investmentOptions.length + 2)) * mult;
  }

  if (!investmentOptions || level >= investmentOptions.length) {
    return m(0);
  }

  return investmentOptions[level].resultingIncome * mult;
}

export function canBuy({
  playerId,
  fieldIndex,
  gameState,
  players,
  fromChance,
}: {
  playerId: string;
  fieldIndex: number;
  gameState: GameFieldState;
  players: Player[];
  fromChance?: boolean;
}): boolean {
  const field = getFieldByIndex(fieldIndex);
  // Поле должно быть типа 'firm'
  if (field?.type !== FieldType.Firm) return false;

  const player = getPlayerById(players, playerId);
  if (! player || player.isBankrupt) return false;

  const fieldState = getFieldStateByIndex(gameState, fieldIndex);
  // У поля не должно быть владельца
  if (fieldState.ownerId !== null && fieldState.ownerId !== undefined) return false;

  // Игрок должен находиться на этом поле или на бирже
  if (player.position !== fieldIndex && !player.inBirja && !fromChance) return false;

  // Не должно быть других игроков на этом поле или с шанса
  const others = players.filter(p => p.id !== playerId && p.position === fieldIndex);
  if (others.length > 0) return false;

  // У игрока должно хватать денег на покупку
  const purchaseCost = field.investments?.[0]?.cost ?? Infinity;
  if (player.balance < purchaseCost) return false;

  // Если секвестр, то оплата невозможна
  if (player.sequester && purchaseCost > 0) return false;

  const purchaseType = field.investments?.[0]?.type;

  // Если покупка со * у игрока должны быть фирмы
  if (purchaseType === InvestmentType.SacrificeCompany) {
    const ownedFields = gameState.filter(f => f.ownerId === playerId);
    if (ownedFields.length == 0) return false;
  }

  // Если покупка со ** у игрока должны быть монополии
  if (purchaseType === InvestmentType.SacrificeMonopoly) {
    const ownedMonopolies = getMonopoliesOfPlayer(playerId, gameState);
    if (ownedMonopolies.length == 0) return false;
  }

  return true;
}

export function canSell({
  playerId,
  fieldIndex,
  gameState,
  players,
}: {
  playerId: string;
  fieldIndex: number;
  gameState: GameFieldState;
  players: Player[];
}): boolean {
  const field = getFieldByIndex(fieldIndex);
  // Поле должно быть типа 'firm'
  if (field?.type !== FieldType.Firm) return false;

  const player = getPlayerById(players, playerId);
  if (! player || player.isBankrupt) return false;

  const fieldState = getFieldStateByIndex(gameState, fieldIndex);
  // Владелец не совпадает
  if (fieldState.ownerId !== playerId) return false;

  // Если секвестр, то оплата невозможна
  if (player.sequester) return false;

  return true;
}

export function canInvest({
  playerId,
  fieldIndex,
  gameState,
  players,
  fromChance,
}: {
  playerId: string;
  fieldIndex: number;
  gameState: GameFieldState;
  players: Player[];
  fromChance?: boolean;
}): boolean {
  const field = getFieldByIndex(fieldIndex);
  // Поле должно быть типа 'firm'
  if (field?.type !== FieldType.Firm) return false;

  const player = getPlayerById(players, playerId);
  if (! player || player.isBankrupt) return false;

  const fieldState = getFieldStateByIndex(gameState, fieldIndex);
  // Владелец не совпадает
  if (fieldState.ownerId !== playerId) return false;

//console.log('canInvest', player, fieldState);

  // Игрок должен находиться на этом поле или с шанса
  if (player.position !== fieldIndex && !fromChance) return false;

  // Не должно быть других игроков на этом поле
  const others = players.filter(p => p.id !== playerId && p.position === fieldIndex);
  if (others.length > 0) return false;

  // Не должно быть запрета на инвестиции
  if (player.investIncomeBlock?.find((f) => f === fieldIndex)) return false;

  const investCost = getNextInvestmentCost({fieldIndex: fieldIndex, gameState: gameState});

  // Закончился массив инвестиций
  if (investCost === undefined) return false;

  // У игрока должно хватать денег на покупку
  if (player.balance < investCost) return false;

  // Если секвестр, то оплата невозможна
  if (player.sequester && investCost > 0) return false;

  const investType = getNextInvestmentType({fieldIndex: fieldIndex, gameState: gameState});

  // Если мезон с * у игрока должны быть фирмы
  if (investType === InvestmentType.SacrificeCompany) {
    const ownedFields = gameState.filter(f => f.ownerId === playerId);
    if (ownedFields.length == 0) return false;
  }

  // Если мезон с ** у игрока должны быть монополии
  if (investType === InvestmentType.SacrificeMonopoly) {
    const ownedMonopolies = getMonopoliesOfPlayer(playerId, gameState);
    if (ownedMonopolies.length == 0) return false;
  }

  return true;
}

export function canInvestFree({
  playerId,
  fieldIndex,
  gameState,
  players,
  fromChance,
}: {
  playerId: string;
  fieldIndex: number;
  gameState: GameFieldState;
  players: Player[];
  fromChance?: boolean;
}): boolean {
  const field = getFieldByIndex(fieldIndex);
  // Поле должно быть типа 'firm'
  if (field?.type !== FieldType.Firm) return false;

  const player = getPlayerById(players, playerId);
  if (! player || player.isBankrupt) return false;

  const fieldState = getFieldStateByIndex(gameState, fieldIndex);
  // Владелец не совпадает
  if (fieldState.ownerId !== playerId) return false;

  // Игрок должен находиться на этом поле или с шанса
  if (player.position !== fieldIndex && !fromChance) return false;

  // Не должно быть других игроков на этом поле
  const others = players.filter(p => p.id !== playerId && p.position === fieldIndex);
  if (others.length > 0) return false;

  // Не должно быть запрета на инвестиции
  if (player.investIncomeBlock?.find((f) => f === fieldIndex)) return false;

  const investCost = getNextInvestmentCost({fieldIndex: fieldIndex, gameState: gameState});

  // Закончился массив инвестиций
  if (investCost === undefined) return false;

  return true;
}

export function canIncome({
  playerId,
  fieldIndex,
  gameState,
  players,
}: {
  playerId: string;
  fieldIndex: number;
  gameState: GameFieldState;
  players: Player[];
}): boolean {
  const field = getFieldByIndex(fieldIndex);
  // Поле должно быть типа 'firm'
  if (field?.type !== FieldType.Firm) return false;

  const player = getPlayerById(players, playerId);
  if (! player || player.isBankrupt) return false;

  const fieldState = getFieldStateByIndex(gameState, fieldIndex);
  // Владелец не совпадает
  if (fieldState.ownerId !== playerId) return false;

  // Игрок должен находиться на этом поле
  if (player.position !== fieldIndex) return false;

  // Не должно быть запрета на инвестиции или получение
  if (player.investIncomeBlock?.find((f) => f === fieldIndex)) return false;

  // Если секвестр, то оплата невозможна
  if (player.sequester) return false;

  return true;
}

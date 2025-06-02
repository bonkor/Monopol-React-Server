import { type Player, getPlayerById } from './types';
import type { FieldState, FieldDefinition, FieldType, Money } from './fields';
import { InvestmentType, FieldType, fieldDefinitions, getFieldByIndex, getFieldStateByIndex, m, getCompanyCostByIndex } from './fields';

export function getPropertyTotalCost({
  playerId,
  gameState,
}: {
  playerId: string;
  gameState: FieldState[];
}): Player | undefined {

  const ownedFields = gameState.filter(f => f.ownerId === playerId);
  return ownedFields.reduce((sum, f) => sum + (getCompanyCostByIndex(f.index) ?? 0), m(0));
}

export function getFieldOwnerId({
  fieldIndex,
  gameState,
}: {
  fieldIndex: number;
  gameState: FieldState[];
}): Player | undefined {
  const fieldState = getFieldStateByIndex(gameState, fieldIndex);
  if (! fieldState) return undefined;

  const ownerId = fieldState.ownerId;
  if (! ownerId) return undefined;

  return ownerId;
}

export function getCurrentIncome({
  fieldIndex,
  gameState,
}: {
  fieldIndex: number;
  gameState: FieldState[];
}): Money {
  const fieldDef = getFieldByIndex(fieldIndex);
  const fieldState = getFieldStateByIndex(gameState, fieldIndex);

  const level = fieldState.investmentLevel ?? 0;
  const investmentOptions = fieldDef.investments;
  const lastInvestmentType = investmentOptions.at(-1).type;

  if (lastInvestmentType === InvestmentType.Infinite && level >= investmentOptions.length - 1) {
    return investmentOptions.at(-2).resultingIncome + investmentOptions.at(-1).resultingIncome * (level - investmentOptions.length + 2);
  }

  if (!investmentOptions || level >= investmentOptions.length) {
    return m(0);
  }

  return investmentOptions[level].resultingIncome;
}

export function getNextInvestmentCost({
  fieldIndex,
  gameState,
}: {
  fieldIndex: number;
  gameState: FieldState[];
}): Money | undefined {
  const fieldDef = getFieldByIndex(fieldIndex);
  const fieldState = getFieldStateByIndex(gameState, fieldIndex);

  const level = fieldState.investmentLevel ?? 0;
  const investmentOptions = fieldDef.investments;
  const lastInvestmentType = investmentOptions.at(-1).type;

  if (lastInvestmentType !== InvestmentType.Infinite && level >= investmentOptions.length - 1) return undefined;

  if (lastInvestmentType === InvestmentType.Infinite && level >= investmentOptions.length - 1) {
    return investmentOptions.at(-1).cost;
  } else {
    return investmentOptions.at(level + 1).cost;
  }
}

export function getNextInvestmentType({
  fieldIndex,
  gameState,
}: {
  fieldIndex: number;
  gameState: FieldState[];
}): InvestmentType | undefined {
  const fieldDef = getFieldByIndex(fieldIndex);
  const fieldState = getFieldStateByIndex(gameState, fieldIndex);

  const level = fieldState.investmentLevel ?? 0;
  const investmentOptions = fieldDef.investments;
  const lastInvestmentType = investmentOptions.at(-1).type;

  if (lastInvestmentType !== InvestmentType.Infinite && level >= investmentOptions.length - 1) return undefined;

  if (lastInvestmentType === InvestmentType.Infinite && level >= investmentOptions.length - 1) {
    return InvestmentType.Infinite;
  } else {
    return investmentOptions.at(level + 1).type;
  }
}

export function canBuy({
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
  // У поля не должно быть владельца
  if (fieldState.ownerId !== null && fieldState.ownerId !== undefined) return false;

  // Игрок должен находиться на этом поле или на бирже
  if (player.position !== fieldIndex && !player.inBirja) return false;

  // Не должно быть других игроков на этом поле
  const others = players.filter(p => p.id !== playerId && p.position === fieldIndex);
  if (others.length > 0) return false;

  // У игрока должно хватать денег на покупку
  const purchaseCost = field.investments?.[0]?.cost ?? Infinity;
  if (player.balance < purchaseCost) return false;

  const purchaseType = field.investments?.[0]?.type;
  // Если покупка со * у игрока должны быть фирмы
  if (purchaseType === InvestmentType.SacrificeCompany || purchaseType === InvestmentType.SacrificeMonopoly) {
    const ownedFields = gameState.filter(f => f.ownerId === playerId);
    if (ownedFields.length == 0) return false;
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

  return true;
}

export function canInvest({
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

//console.log('canInvest', player, fieldState);

  // Игрок должен находиться на этом поле
  if (player.position !== fieldIndex) return false;

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

  const investType = getNextInvestmentType({fieldIndex: fieldIndex, gameState: gameState});
  // Если мезон с * у игрока должны быть фирмы
  if (investType === InvestmentType.SacrificeCompany || investType === InvestmentType.SacrificeMonopoly) {
    const ownedFields = gameState.filter(f => f.ownerId === playerId);
    if (ownedFields.length == 0) return false;
  }

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

  return true;
}

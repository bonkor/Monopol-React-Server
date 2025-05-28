import { type Player, getPlayerById } from './types';
import type { GameFieldState, FieldState, FieldDefinition, FieldType } from './fields';
import { FieldType, fieldDefinitions, getFieldByIndex, getFieldStateByIndex } from './fields';

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

  // Игрок должен находиться на этом поле
  if (player.position !== fieldIndex) return false;

  // У игрока должно хватать денег на покупку
  const purchaseCost = field.investments?.[0]?.cost ?? Infinity;
  if (player.balance < purchaseCost) return false;

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

console.log('canInvest', player, fieldState);

  // Игрок должен находиться на этом поле
  if (player.position !== fieldIndex) return false;

  // Не должно быть запрета на инвестиции
  if (player.investIncomeBlock?.find((f) => f === fieldIndex)) return false;

  // У игрока должно хватать денег на покупку
  const investCost = field.investments?.[fieldState.investmentLevel + 1]?.cost;
console.log('canInvest cost', investCost);
  if (player.balance < investCost) return false;

  return true;
}

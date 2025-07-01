import { useMemo } from 'react';
import { isFieldInCompetedMonopoly } from '@shared/monopolies';
import { InvestmentType, getMaxPlayerIdPropertyPrice, getFieldByIndex } from '@shared/fields';
import { canBuy, canInvestFree } from '@shared/game-rules';
import { useGameStore } from '../../store/useGameStore';

interface CellInteractionState {
  isTarget: boolean;
  isCandidate: boolean;
}

export function useCellInteractionState(field: FieldDefinition, fieldState: FieldState): CellInteractionState {
  const lastLocalPlayerId = useGameStore((s) => s.lastLocalPlayerId);
  const fieldStates = useGameStore((s) => s.fieldStates);
  const players = useGameStore((state) => state.players);
  const sacrificeMode = useGameStore((s) => s.sacrificeMode);
  const interactionMode = useGameStore((s) => s.interactionMode);

  const ownerId = fieldState.ownerId;

  const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({
    fieldIndex: field.index,
    gameState: fieldStates,
  });

  const canBuyResult = useMemo(() => {
    return lastLocalPlayerId && field.index !== null
      ? canBuy({ playerId: lastLocalPlayerId, fieldIndex: field.index, gameState: fieldStates, players: players, fromChance: true })
      : false;
  }, [lastLocalPlayerId, field?.index, fieldStates, players]);
  const canIvnestFreeResult =
    canInvestFree({ playerId: lastLocalPlayerId, fieldIndex: field.index, gameState: fieldStates, players: players, fromChance: true })

  const targetCost =
    interactionMode.type === 'change' &&
    interactionMode.targetFieldIndex !== undefined &&
    getFieldByIndex(interactionMode.targetFieldIndex).investments?.[0].cost;

  const maxPlayerIdPropertyPrice = getMaxPlayerIdPropertyPrice(fieldStates, lastLocalPlayerId);

  const isTarget =
    // ------------------------------------------------------- sacrificeMode
    ['none'].includes(interactionMode.type) && sacrificeMode?.targetFieldIndex === field.index ||
    // ------------------------------------------------------- change
    interactionMode.type === 'change' &&
    (interactionMode.targetFieldIndex === undefined || interactionMode.targetFieldIndex === field.index) &&
    !ownerId &&
    field.investments &&
    (field.investments[0]?.cost ?? 0) < (maxPlayerIdPropertyPrice ?? 0) ||
    // ------------------------------------------------------- needBuy
    interactionMode.type === 'needBuy' &&
    (canBuyResult && !sacrificeMode || sacrificeMode?.targetFieldIndex === field.index) ||
    // ------------------------------------------------------- needInvestFree
    interactionMode.type === 'needInvestFree' &&
    (canIvnestFreeResult) ||
    // ------------------------------------------------------- choosePos
    interactionMode.type === 'choosePos' &&
    interactionMode.positions.includes(field.index);

  const isCandidate =
    // ------------------------------------------------------- sacrificeMode
    (sacrificeMode && sacrificeMode.type === InvestmentType.SacrificeCompany &&
      fieldState.ownerId === lastLocalPlayerId &&
      field.index !== sacrificeMode.targetFieldIndex) ||
    (sacrificeMode && sacrificeMode.type === InvestmentType.SacrificeMonopoly &&
      fieldInCompetedMonopoly?.ownerId === lastLocalPlayerId &&
      (fieldInCompetedMonopoly?.monopolies?.length ?? 0) > 0 &&
      field.index !== sacrificeMode.targetFieldIndex) ||
    // ------------------------------------------------------- needSell
    (interactionMode.type === 'needSell' && fieldState.ownerId === lastLocalPlayerId) ||
    // ------------------------------------------------------- loose
    (interactionMode.type === 'loose' && fieldState.ownerId === lastLocalPlayerId) ||
    // ------------------------------------------------------- needSellMonopoly
    (interactionMode.type === 'needSellMonopoly' &&
      fieldInCompetedMonopoly?.ownerId === lastLocalPlayerId &&
      (fieldInCompetedMonopoly?.monopolies?.length ?? 0) > 0) ||
    // ------------------------------------------------------- sacrificeFromChance
    (interactionMode.type === 'sacrificeFromChance' && fieldState.ownerId === lastLocalPlayerId) ||
    // ------------------------------------------------------- needRemoveInvest
    interactionMode.type === 'needRemoveInvest' &&
    (ownerId === lastLocalPlayerId && fieldState.investmentLevel > 0) ||
    // ------------------------------------------------------- change
    (interactionMode.type === 'change' &&
      targetCost &&
      ownerId === lastLocalPlayerId &&
      field.investments &&
      targetCost < field.investments[0].cost);

  return {
    isTarget,
    isCandidate,
  };
}

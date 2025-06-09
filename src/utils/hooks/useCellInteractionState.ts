import { useMemo } from 'react';
import { isFieldInCompetedMonopoly } from '@shared/monopolies';
import { InvestmentType, getMaxPlayerIdPropertyPrice } from '@shared/fields';
import { useGameStore } from '../../store/useGameStore';

interface CellInteractionState {
  isTarget: boolean;
  isCandidate: boolean;
  disableBuy: boolean;
  disableInvest: boolean;
  disableSell: boolean;
  disableIncome: boolean;
}

export function useCellInteractionState(field: FieldDefinition, fieldState: FieldState): CellInteractionState {
  const interactionMode = useGameStore((s) => s.interactionMode);
  const confirmationPending = useGameStore((s) => s.confirmationPending);
  const lastLocalPlayerId = useGameStore((s) => s.lastLocalPlayerId);
  const fieldStates = useGameStore((s) => s.fieldStates);
  const sacrificeMode = useGameStore((s) => s.sacrificeMode);

  const ownerId = fieldState.ownerId;

  const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({
    fieldIndex: field.index,
    gameState: fieldStates,
  });

  const targetCost =
    interactionMode.type === 'change' &&
    interactionMode.targetFieldIndex !== undefined &&
    field.investments?.[0].cost;

  const maxPlayerIdPropertyPrice = getMaxPlayerIdPropertyPrice(fieldStates, lastLocalPlayerId);

  const isTarget =
    sacrificeMode?.targetFieldIndex === field.index ||
    interactionMode.type === 'change' &&
    (interactionMode.targetFieldIndex === undefined || interactionMode.targetFieldIndex === field.index) &&
    !ownerId &&
    field.investments &&
    targetCost !== undefined &&
    field.investments[0].cost < maxPlayerIdPropertyPrice;

  const isCandidate =
    (sacrificeMode && sacrificeMode.type === InvestmentType.SacrificeCompany &&
      fieldState.ownerId === lastLocalPlayerId &&
      field.index !== sacrificeMode.targetFieldIndex) ||
    (sacrificeMode && sacrificeMode.type === InvestmentType.SacrificeMonopoly &&
      fieldInCompetedMonopoly.ownerId === lastLocalPlayerId &&
      fieldInCompetedMonopoly.monopolies.length > 0 &&
      field.index !== sacrificeMode.targetFieldIndex) ||
    (interactionMode.type === 'needSell' && fieldState.ownerId === lastLocalPlayerId) ||
    (interactionMode.type === 'chance' &&
      interactionMode.fromSacrifice &&
      fieldState.ownerId === lastLocalPlayerId) ||
    (interactionMode.type === 'change' &&
      targetCost !== undefined &&
      ownerId === lastLocalPlayerId &&
      field.investments &&
      targetCost < field.investments[0].cost);

  const disableBuy =
    confirmationPending ||
    (interactionMode.type === 'sacrifice' && interactionMode.data.targetFieldIndex !== field.index) ||
    (interactionMode.type === 'change' && !isTarget);

  const disableInvest =
    confirmationPending ||
    (interactionMode.type === 'sacrifice' && interactionMode.data.targetFieldIndex !== field.index);

  const disableSell =
    confirmationPending ||
    (interactionMode.type === 'sacrifice' &&
      ((interactionMode.data.type === InvestmentType.SacrificeCompany &&
        interactionMode.data.targetFieldIndex === field.index) ||
      (interactionMode.data.type === InvestmentType.SacrificeMonopoly &&
        interactionMode.data.targetFieldIndex === field.index &&
        fieldInCompetedMonopoly.monopolies.length > 0)));

  const disableIncome = confirmationPending || interactionMode.type === 'sacrifice';

  return {
    isTarget,
    isCandidate,
    disableBuy,
    disableInvest,
    disableSell,
    disableIncome,
  };
}

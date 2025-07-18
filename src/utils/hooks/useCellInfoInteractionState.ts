import { useMemo } from 'react';
import { isFieldInCompetedMonopoly } from '@shared/monopolies';
import { type FieldState, type FieldDefinition, InvestmentType } from '@shared/fields';
import { useGameStore } from '../../store/useGameStore';
import { useCellInteractionState } from './useCellInteractionState';
import { canBuy, canSell, canInvest, canIncome } from '@shared/game-rules';

interface CellInfoInteractionState {
  isTarget: boolean;
  showSell: boolean;  // показывать sell или buy
  showRemInvest: boolean;  // показывать кнопку убрать мезон вместо мезонировать
  showGo: boolean;  // показывать кнопку перейти
  disableBuy: boolean;
  disableInvest: boolean;
  disableSell: boolean;
  disableIncome: boolean;
  buyTitle: string;
  sellTitle: string;
}

export function useCellInfoInteractionState(field: FieldDefinition, fieldState: FieldState | undefined): CellInfoInteractionState {
  if (! fieldState) return {
    isTarget: false,
    showSell: false,
    showRemInvest: false,
    showGo: false,
    disableBuy: false,
    disableInvest: false,
    disableSell: false,
    disableIncome: false,
    buyTitle: '',
    sellTitle: '',
  };

  const interactionMode = useGameStore((s) => s.interactionMode);
  const confirmationPending = useGameStore((s) => s.confirmationPending);
  const lastLocalPlayerId = useGameStore((s) => s.lastLocalPlayerId);
  const fieldStates = useGameStore((s) => s.fieldStates);
  const players = useGameStore((state) => state.players);
  const sacrificeMode = useGameStore((s) => s.sacrificeMode);

  const ownerId = fieldState.ownerId;
  const interaction = useCellInteractionState(field, fieldState);

  const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({
    fieldIndex: field.index,
    gameState: fieldStates,
  });

  const canBuyResult = useMemo(() => {
    return lastLocalPlayerId && field.index !== null
      ? canBuy({ playerId: lastLocalPlayerId, fieldIndex: field.index, gameState: fieldStates, players: players })
      : false;
  }, [lastLocalPlayerId, field?.index, fieldStates]);
  const canSellResult = useMemo(() => {
    return lastLocalPlayerId && field.index !== null
      ? canSell({ playerId: lastLocalPlayerId, fieldIndex: field.index, gameState: fieldStates, players: players })
      : false;
  }, [lastLocalPlayerId, field?.index, fieldStates]);
  const canIvnestResult = useMemo(() => {
    return lastLocalPlayerId && field.index !== null
      ? canInvest({ playerId: lastLocalPlayerId, fieldIndex: field.index, gameState: fieldStates, players: players })
      : false;
  }, [lastLocalPlayerId, field?.index, fieldStates]);
  const canIncomeResult = useMemo(() => {
    return lastLocalPlayerId && field.index !== null
      ? canIncome({ playerId: lastLocalPlayerId, fieldIndex: field.index, gameState: fieldStates, players: players })
      : false;
  }, [lastLocalPlayerId, field?.index, fieldStates]);

  const isTarget = interactionMode.type === 'change' && interaction.isTarget;
  const showSell = ownerId === lastLocalPlayerId;
  const showGo = interactionMode.type === 'choosePos' && interaction.isTarget;
  const showRemInvest = interactionMode.type === 'needRemoveInvest' && interaction.isCandidate;

  const disableBuy =
    confirmationPending ||
    ['choosePos', 'needInvestFree', 'needRemoveInvest', 'needSell', 'needSellMonopoly', 'loose'].includes(interactionMode.type) ||
    ['none'].includes(interactionMode.type) && !canBuyResult ||
    sacrificeMode && sacrificeMode.targetFieldIndex !== field.index ||
    (interactionMode.type === 'change' && !isTarget);

  const disableInvest = Boolean(
    confirmationPending ||
    ['choosePos', 'needRemoveInvest', 'needSell', 'needSellMonopoly', 'loose'].includes(interactionMode.type) ||
    ['none'].includes(interactionMode.type) && !sacrificeMode && !canIvnestResult ||
    (interactionMode.type === 'needInvestFree' && ! interaction.isTarget) ||
    (interactionMode.type !== 'needInvestFree' && !canIvnestResult ||
    (sacrificeMode && sacrificeMode.targetFieldIndex !== field.index))
  );

  const disableSell =
    confirmationPending ||
    ['choosePos', 'needInvestFree', 'needRemoveInvest'].includes(interactionMode.type) ||
    ['none'].includes(interactionMode.type) && !sacrificeMode && !canSellResult ||
    ['none'].includes(interactionMode.type) &&
      sacrificeMode && sacrificeMode.type === InvestmentType.SacrificeCompany && sacrificeMode.targetFieldIndex === field.index ||
    ['none'].includes(interactionMode.type) && sacrificeMode &&
      sacrificeMode.type === InvestmentType.SacrificeMonopoly && sacrificeMode.targetFieldIndex === field.index &&
      (fieldInCompetedMonopoly?.monopolies?.length ?? 0) > 0 ||
    interactionMode.type === 'loose' && !interaction.isCandidate ||
    (interactionMode.type === 'change' && !interaction.isCandidate) ||
    (interactionMode.type === 'needRemoveInvest' &&  interaction.isCandidate) ||
    (interactionMode.type === 'needBuy' && !sacrificeMode);

  const disableIncome = Boolean(
    confirmationPending ||
    ['choosePos', 'needInvestFree', 'needRemoveInvest', 'needSell', 'needSellMonopoly', 'loose'].includes(interactionMode.type) ||
    !canIncomeResult || sacrificeMode
  );

  const buyTitle = isTarget ? 'Поменять' : 'Купить';
  const sellTitle = sacrificeMode || interactionMode.type === 'sacrificeFromChance' ? 'Пожертвовать'
    : interactionMode.type === 'change' && interaction.isCandidate ? 'Поменять'
    : interactionMode.type === 'loose' ? 'Потерять'
    : 'Продать';

  return {
    isTarget,
    showSell,
    showRemInvest,
    showGo,
    disableBuy,
    disableInvest,
    disableSell,
    disableIncome,
    buyTitle,
    sellTitle,
  };
}

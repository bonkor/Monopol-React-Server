import { useMemo } from 'react';
import { isFieldInCompetedMonopoly } from '@shared/monopolies';
import { InvestmentType } from '@shared/fields';
import { useGameStore } from '../../store/useGameStore';
import { useCellInteractionState } from './useCellInteractionState';
import { canBuy, canSell, canInvest, canIncome } from '@shared/game-rules';

interface CellInfoInteractionState {
  isTarget: boolean;
  showSell: boolean;  // показывать sell или buy
  showGo: boolean;  // показывать кнопку перейти
  disableBuy: boolean;
  disableInvest: boolean;
  disableSell: boolean;
  disableIncome: boolean;
  buyTitle: string;
  sellTitle: string;
}

export function useCellInfoInteractionState(field: FieldDefinition, fieldState: FieldState): CellInfoInteractionState {
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
  const canIvnestFreeResult = canInvest({ playerId: lastLocalPlayerId, fieldIndex: field.index,
    gameState: fieldStates, players: players, fromChance: true  })

  const isTarget = interactionMode.type === 'change' && interaction.isTarget;
  const showSell = canSellResult;
  const showGo = interactionMode.type === 'choosePos' && interaction.isTarget;

  const disableBuy =
    confirmationPending ||
    ['choosePos', 'needInvestFree'].includes(interactionMode.type) ||
    ['none'].includes(interactionMode.type) && !canBuyResult ||
    sacrificeMode && sacrificeMode.targetFieldIndex !== field.index ||
    (interactionMode.type === 'change' && !isTarget);

  const disableInvest =
    confirmationPending ||
    ['choosePos'].includes(interactionMode.type) ||
    (interactionMode.type === 'needInvestFree' && ! interaction.isTarget) ||
    (interactionMode.type !== 'needInvestFree' && !canIvnestResult ||
    (sacrificeMode && sacrificeMode.targetFieldIndex !== field.index));

  const disableSell =
    confirmationPending || !canSellResult ||
    ['choosePos', 'needInvestFree'].includes(interactionMode.type) ||
    (sacrificeMode && sacrificeMode.type === InvestmentType.SacrificeCompany && sacrificeMode.targetFieldIndex === field.index) ||
    (sacrificeMode && sacrificeMode.type === InvestmentType.SacrificeMonopoly && sacrificeMode.targetFieldIndex === field.index &&
    fieldInCompetedMonopoly.monopolies.length > 0) ||
    (interactionMode.type === 'change' && interactionMode.targetFieldIndex === undefined) ||
    (interactionMode.type === 'needBuy' && !sacrificeMode);

  const disableIncome = confirmationPending ||
    ['choosePos', 'needInvestFree'].includes(interactionMode.type) ||
    !canIncomeResult || sacrificeMode;

  const buyTitle = isTarget ? 'Поменять' : 'Купить';
  const sellTitle = sacrificeMode || interactionMode.type === 'sacrificeFromChance' ? 'Пожертвовать'
    : interactionMode.type === 'change' && interaction.isCandidate ? 'Поменять'
    : 'Продать';

  return {
    isTarget,
    showSell,
    showGo,
    disableBuy,
    disableInvest,
    disableSell,
    disableIncome,
    buyTitle,
    sellTitle,
  };
}

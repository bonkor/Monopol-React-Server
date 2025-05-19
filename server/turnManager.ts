import { type Action } from '../shared/types';
import { allowDice, allowEndTurn } from './game';

interface TurnState {
  playerId: string;
  actionQueue: Action[];
  currentAction: Action | null;
  awaitingDiceRoll: boolean;
  awaitingChance1: boolean;
  awaitingChance2: boolean;
  awaitingEndTurn: boolean;
}

export function startTurn(playerId: string): TurnState {
  return {
    playerId,
    actionQueue: [{ type: 'move', backward: false }],
    currentAction: null,
    awaitingDiceRoll: false,
    awaitingChance1: false,
    awaitingChance2: false,
    awaitingEndTurn: false,
  };
}

export function chkTurn(turnState: TurnState): TurnState {
  if (turnState.currentAction !== null) {
    return prepCurAction(turnState);
  } else if (turnState.actionQueue.length > 0) {
    const [nextAction, ...restQueue] = turnState.actionQueue;
    return prepCurAction({
      ...turnState,
      currentAction: nextAction,
      actionQueue: restQueue,
    });
  } else {
    console.log("Ходы закончились", turnState);
    turnState.awaitingDiceRoll = true;
    turnState.awaitingChance1 = false;
    turnState.awaitingChance2 = false;
    turnState.awaitingEndTurn = true;
    allowEndTurn(turnState.playerId);
  }
  return turnState;
}

function prepCurAction(turnState: TurnState): TurnState {
  console.log(prepCurAction, turnState);
  switch (turnState.currentAction.type) {
    case 'move': {
      console.log('move');
      turnState.awaitingDiceRoll = true;
      turnState.awaitingChance1 = false;
      turnState.awaitingChance2 = false;
      turnState.awaitingEndTurn = false;
      allowDice(turnState.playerId);
    }
    case 'chance': {
    }
  }
  return turnState;
}

export function isTurnComplete(turnState: TurnState): boolean {
  return turnState.actionQueue.length === 0 && turnState.currentAction === null;
}

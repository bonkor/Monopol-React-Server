import { type Action } from '../shared/types';
import { players, allowDice, allowEndTurn, allowCenterBut } from './game';

interface TurnState {
  playerId: string;
  actionQueue: Action[];
  currentAction: Action | null;
  awaitingCenterBut: boolean;
  awaitingGoStayBut: boolean;
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
    awaitingCenterBut: false,
    awaitingGoStayBut: false,
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
    turnState.awaitingCenterBut = false;
    turnState.awaitingGoStayBut = false;
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
      const player = players.find(p => (p.id) === turnState.playerId);
      if (!player) return;

      if (player.position === 44 && player.direction === null) { // start
        turnState.awaitingCenterBut = true;
        turnState.awaitingGoStayBut = false;
        turnState.awaitingDiceRoll = false;
        turnState.awaitingChance1 = false;
        turnState.awaitingChance2 = false;
        turnState.awaitingEndTurn = false;
        allowCenterBut(turnState.playerId);
      } else {
        turnState.awaitingCenterBut = false;
        turnState.awaitingGoStayBut = false;
        turnState.awaitingDiceRoll = true;
        turnState.awaitingChance1 = false;
        turnState.awaitingChance2 = false;
        turnState.awaitingEndTurn = false;
        allowDice(turnState.playerId);
      }
    }
    case 'chance': {
    }
  }
  return turnState;
}

export function isTurnComplete(turnState: TurnState): boolean {
  return turnState.actionQueue.length === 0 && turnState.currentAction === null;
}

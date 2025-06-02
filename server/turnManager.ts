import { type Action } from '../shared/types';
import { players, allowDice, allowEndTurn, allowCenterBut, allowGoStayBut, processJail } from './game';

export enum TurnStateAwaiting {
  Nothing = 'Nothing',
  CenterBut = 'CenterBut',
  GoStayBut = 'GoStayBut',
  DiceRoll = 'DiceRoll',
  Chance1 = 'Chance1',
  Chance2 = 'Chance2',
  EndTurn = 'EndTurn',
  FromJail = 'FromJail',
}

interface TurnState {
  playerId: string;
  actionQueue: Action[];
  currentAction: Action | null;
  awaiting: TurnStateAwaiting;
}

export function startTurn(playerId: string): TurnState {
  return {
    playerId,
    actionQueue: [{ type: 'move', backward: false }],
    currentAction: null,
    awaiting: TurnStateAwaiting.Nothing,
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
    turnState.awaiting = TurnStateAwaiting.EndTurn;
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
        turnState.awaiting = TurnStateAwaiting.CenterBut;
        allowCenterBut(turnState.playerId);
      } else if (player.inJail) {
  console.log(prepCurAction, 'inJail', turnState);
        processJail(turnState);
      } else {
        turnState.awaiting = TurnStateAwaiting.DiceRoll;
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

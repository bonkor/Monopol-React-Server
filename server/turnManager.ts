import { type Action } from '../shared/types';
import { players } from './game';

interface TurnCheckResult {
  turnState: TurnState;
  effect?: TurnEffect;
}

export type TurnEffect =
  | { type: 'nothing' }
  | { type: 'clear-pending' }
  | { type: 'need-positive-balance' }
  | { type: 'need-sacrifice' }
  | { type: 'change' }
  | { type: 'buy' }
  | { type: 'sell' }
  | { type: 'sell-monopoly' }
  | { type: 'invest-free' }
  | { type: 'rem-invest' }
  | { type: 'go-to-cross' }
  | { type: 'go-to-perimeter' }
  | { type: 'go-between-start' }
  | { type: 'go-to-exchange' }
  | { type: 'go-to-jail' }
  | { type: 'go-to-taxi' }
  | { type: 'go-to-start' }
  | { type: 'check-chance' }
  | { type: 'need-dice-roll' }
  | { type: 'need-center-button' }
  | { type: 'need-go-stay-button' }
  | { type: 'need-jail-or-taxi-decision' }
  | { type: 'turn-ended' };

export enum TurnStateAwaiting {
  Nothing = 'Nothing',
  PositiveBalance = 'PositiveBalance',
  PendingPayOrLoose = 'PendingPayOrLoose',
  CenterBut = 'CenterBut',
  GoStayBut = 'GoStayBut',
  DiceRoll = 'DiceRoll',
  Chance = 'Chance',  // используется после перезагрузки, когдла неизвестно, какой бросок
  Chance1 = 'Chance1',
  Chance2 = 'Chance2',
  EndTurn = 'EndTurn',
  FromJailOrTaxi = 'FromJailOrTaxi',
  Sacrifice = 'Sacrifice',
  Change = 'Change',
  Buy = 'Buy',
  Sell = 'Sell',
  SellMonopoly = 'SellMonopoly',
  InvestFree = 'InvestFree',
  RemoveInvest = 'RemoveInvest',
  GoToCross = 'GoToCross',
  GoToPerimeter = 'GoToPerimeter',
  GoBetweenStart = 'GoBetweenStart',
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

export function addChance(turnState: TurnState, num?: number): TurnState {
  if (!num) num = 1;
  for (let i = 0; i < num; i++) turnState.actionQueue.unshift({type: 'chance'});
  return turnState;
}

export function addMove(turnState: TurnState, num: number, backward: boolean): TurnState {
  for (let i = 0; i < num; i++) turnState.actionQueue.unshift({ type: 'move', backward: backward });
  return turnState;
}

export function isNowBackward(turnState: TurnState): boolean {
  const firstMove = turnState.currentAction?.type === 'move' ?
    turnState.currentAction
    : turnState.actionQueue.find((a) => a.type === 'move');

  return firstMove ? firstMove.backward : false;
}

export function chkTurn(turnState: TurnState): TurnCheckResult {
  const player = players.find(p => p.id === turnState.playerId);
  if (!player) return { turnState };

  if (player.pendingActions.length > 0) {
    return {
      turnState: {
        ...turnState,
        awaiting: TurnStateAwaiting.PendingPayOrLoose,
      },
      effect: { type: 'clear-pending' },
    };
  }
  if (player.balance < 0) {
    return {
      turnState: {
        ...turnState,
        awaiting: TurnStateAwaiting.PositiveBalance,
      },
      effect: { type: 'need-positive-balance' },
    };
  }
  if (turnState.awaiting === TurnStateAwaiting.Sacrifice) {
    return {
      turnState: {
        ...turnState,
        awaiting: TurnStateAwaiting.Sacrifice,
      },
      effect: { type: 'need-sacrifice' },
    };
  }
  if (turnState.awaiting === TurnStateAwaiting.Change) {
    return {
      turnState: {
        ...turnState,
        awaiting: TurnStateAwaiting.Change,
      },
      effect: { type: 'change' },
    };
  }
  if (turnState.awaiting === TurnStateAwaiting.Buy) {
    return {
      turnState: {
        ...turnState,
        awaiting: TurnStateAwaiting.Buy,
      },
      effect: { type: 'buy' },
    };
  }
  if (turnState.awaiting === TurnStateAwaiting.Sell) {
    return {
      turnState: {
        ...turnState,
        awaiting: TurnStateAwaiting.Sell,
      },
      effect: { type: 'sell' },
    };
  }
  if (turnState.awaiting === TurnStateAwaiting.GoToCross) {
    return {
      turnState: {
        ...turnState,
        awaiting: TurnStateAwaiting.GoToCross,
      },
      effect: { type: 'go-to-cross' },
    };
  }
  if (turnState.awaiting === TurnStateAwaiting.InvestFree) {
    return {
      turnState: {
        ...turnState,
        awaiting: TurnStateAwaiting.InvestFree,
      },
      effect: { type: 'invest-free' },
    };
  }
  if (turnState.awaiting === TurnStateAwaiting.RemoveInvest) {
    return {
      turnState: {
        ...turnState,
        awaiting: TurnStateAwaiting.RemoveInvest,
      },
      effect: { type: 'rem-invest' },
    };
  }
  if (turnState.awaiting === TurnStateAwaiting.GoToPerimeter) {
    return {
      turnState: {
        ...turnState,
        awaiting: TurnStateAwaiting.GoToPerimeter,
      },
      effect: { type: 'go-to-perimeter' },
    };
  }
  if (turnState.awaiting === TurnStateAwaiting.SellMonopoly) {
    return {
      turnState: {
        ...turnState,
        awaiting: TurnStateAwaiting.SellMonopoly,
      },
      effect: { type: 'sell-monopoly' },
    };
  }
  if (turnState.awaiting === TurnStateAwaiting.GoBetweenStart) {
    return {
      turnState: {
        ...turnState,
        awaiting: TurnStateAwaiting.GoBetweenStart,
      },
      effect: { type: 'go-between-start' },
    };
  }

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
    return {
      turnState: {
        ...turnState,
        awaiting: TurnStateAwaiting.EndTurn,
      },
      effect: { type: 'turn-ended' },
    };
  }
}

function prepCurAction(turnState: TurnState): TurnCheckResult {
  const player = players.find(p => p.id === turnState.playerId);
  if (!player) return { turnState };

  const action = turnState.currentAction;

console.log(prepCurAction, turnState);

  if (action.type === 'move') {
    if (turnState.awaiting === TurnStateAwaiting.GoStayBut) {
      return {
        turnState: {
          ...turnState,
          awaiting: TurnStateAwaiting.GoStayBut,
        },
        effect: { type: 'need-go-stay-button' },
      };
    } else if (player.position === 44 && player.direction === null) {
      return {
        turnState: {
          ...turnState,
          awaiting: TurnStateAwaiting.CenterBut,
        },
        effect: { type: 'need-center-button' },
      };
    } else if (player.inJail || player.inTaxi) {
      if (player.sequester > 0)
        return {
          turnState: {
            ...turnState,
            awaiting: TurnStateAwaiting.EndTurn,
          },
          effect: { type: 'turn-ended-sequester' },
        };
      else
        return {
          turnState: {
            ...turnState,
            awaiting: TurnStateAwaiting.FromJailOrTaxi,
          },
          effect: { type: 'need-jail-or-taxi-decision' },
        };
    } else {
      return {
        turnState: {
          ...turnState,
          awaiting: TurnStateAwaiting.DiceRoll,
        },
        effect: { type: 'need-dice-roll' },
      };
    }
  }

  if (action.type === 'chance') {
    if (turnState.awaiting === TurnStateAwaiting.Chance1) {
      return {
        turnState: {
          ...turnState,
          awaiting: TurnStateAwaiting.Chance1,
        },
        effect: { type: 'need-dice-roll' },
      };
    } else if (turnState.awaiting === TurnStateAwaiting.Chance2) {
      return {
        turnState: {
          ...turnState,
          awaiting: TurnStateAwaiting.Chance2,
        },
        effect: { type: 'need-dice-roll' },
      };
    } else {
      return {
        turnState: {
          ...turnState,
          awaiting: TurnStateAwaiting.Chance,
        },
        effect: { type: 'check-chance' },
      };
    }
  }

  return { turnState };
}

export function isTurnComplete(turnState: TurnState): boolean {
  return turnState.actionQueue.length === 0 && turnState.currentAction === null;
}

import { WebSocket } from 'ws';
import type { ClientToServerMessage, ServerToClientMessage, ErrorReason } from '../shared/messages';
import { ErrorReason } from '../shared/messages';
import { type Player, Direction, getPlayerById } from '../shared/types';
import { calculateMovementPath, getCurrentDir, crossList, perimeterOrder, getDirOnCross, getPathToCenter } from '../shared/movement';
import { type Money, m, moneyToString, InvestmentType, type FieldDefinition, fieldDefinitions, type FieldState,
  getFieldStateByIndex, getFieldByIndex, getPropertyTotalCost, getFieldOwnerId, getNextInvestmentCost,
  getNextInvestmentType, getPropertyPosOfPlayerId, getMinFreePropertyPrice, getMaxPlayerIdPropertyPrice } from '../shared/fields';
import { v4 as uuidv4 } from 'uuid';
import { type TurnEffect, startTurn, chkTurn, isTurnComplete, TurnStateAwaiting,
  addChance, addMove, isNowBackward } from './turnManager';
import { handlePayment, processPayment } from './payment';
import { getCurrentIncome, canBuy, canSell, canInvest, canInvestFree, canIncome } from '../shared/game-rules';
import { isFieldInCompetedMonopoly, getMonopoliesOfPlayer } from '../shared/monopolies';

//import {fs} from 'fs';
import * as fs from 'fs';

export const sockets: WebSocket[] = [];
const socketSessionMap = new Map<WebSocket, string>();
const sessionSocketMap = new Map<string, WebSocket>(); // key: sessionId, value: socket

export const players: Player[] = [];
const sessionPlayerMap = new Map<string, string[]>(); // sessionId → array of playerId
export const playerSocketMap = new Map<string, WebSocket>();

export const adminSessions = new Set<string>(); // админы

export const fieldState: FieldState[] = [];

let gameStarted = false;
let currentPlayer;
let turnState;
let diceResult;
let chance1, chance2;

function handleTurnEffect(effect: TurnEffect | undefined, playerId: string) {
  if (!effect) return;
  const player = getPlayerById(players, playerId);

console.log(handleTurnEffect, effect, turnState.awaiting);

  switch (effect.type) {
    case 'nothing':
      break;
    case 'clear-pending':
      broadcast({ type: 'players', players: players });
      break;
    case 'need-sacrifice':
      send(playerId, {type: 'need-sacrifice', playerId: playerId});
      break;
    case 'change':
      send(playerId, {type: 'change', playerId: playerId});
      break;
    case 'buy':
      send(playerId, {type: 'need-buy', playerId: playerId});
      break;
    case 'sell':
      send(playerId, {type: 'need-sell', playerId: playerId});
      break;
    case 'sell-monopoly':
      send(playerId, {type: 'need-sell-monopoly', playerId: playerId});
      break;
    case 'invest-free':
      send(playerId, {type: 'need-invest-free', playerId: playerId});
      break;
    case 'rem-invest':
      send(playerId, {type: 'need-remove-invest', playerId: playerId});
      break;
    case 'need-positive-balance':
      send(playerId, {type: 'need-sell', playerId: playerId});
      broadcast({ type: 'chat', text: `{p:${player.id}} Должен что нибудь продать. Баланс отрицательный` });
      break;
    case 'go-to-cross':
      send(playerId, {type: 'choose-pos', playerId: playerId, positions: crossList});
      break;
    case 'go-to-perimeter':
      send(playerId, {type: 'choose-pos', playerId: playerId, positions: perimeterOrder});
      break;
    case 'go-between-start':
      send(playerId, {type: 'choose-pos', playerId: playerId, positions: getPathToCenter(player.position, isNowBackward(turnState))});
      break;
    case 'go-to-taxi': {
      movePlayer(player, 0, 10);
      turnState.currentAction = null;
      turnState.awaiting = TurnStateAwaiting.Nothing;
      const result = chkTurn(turnState);
      turnState = result.turnState;
      handleTurnEffect(result.effect, player.id);
      break;
    }
    case 'go-to-exchange': {
      movePlayer(player, 0, 20);
      turnState.currentAction = null;
      turnState.awaiting = TurnStateAwaiting.Nothing;
      const result = chkTurn(turnState);
      turnState = result.turnState;
      handleTurnEffect(result.effect, player.id);
      break;
    }
    case 'go-to-jail': {
      movePlayer(player, 0, 30);
      turnState.currentAction = null;
      turnState.awaiting = TurnStateAwaiting.Nothing;
      const result = chkTurn(turnState);
      turnState = result.turnState;
      handleTurnEffect(result.effect, player.id);
      break;
    }
    case 'go-to-start': {
      movePlayer(player, 0, 44);
      turnState.currentAction = null;
      turnState.awaiting = TurnStateAwaiting.Nothing;
      const result = chkTurn(turnState);
      turnState = result.turnState;
      handleTurnEffect(result.effect, player.id);
      break;
    }
    case 'check-chance': {
      if (!chance1 && !chance2) turnState.awaiting = TurnStateAwaiting.Chance1;
      else if (chance1 && !chance2) turnState.awaiting = TurnStateAwaiting.Chance2;
      handleTurnEffect({ type: 'need-dice-roll' }, player.id);
      break;
    }
    case 'need-dice-roll':
      if (turnState.awaiting === TurnStateAwaiting.Chance1) {
        chance1 = 0;
        chance2 = 0;
        showChance(chance1, chance2);
      } else if (turnState.awaiting === TurnStateAwaiting.Chance2) {
        chance2 = 0;
        showChance(chance1, chance2);
      }
      allowDice(playerId);
      break;
    case 'need-center-button':
      allowCenterBut(playerId);
      break;
    case 'need-go-stay-button':
      allowGoStayBut(playerId);
      break;
    case 'need-jail-or-taxi-decision':
      processJailOrTaxi(playerId);
      break;
    case 'turn-ended-sequester':
      broadcast({ type: 'chat', text: `{p:${player.id}} не может выкупиться. Секвестр` });
    case 'turn-ended':
      allowEndTurn(playerId);
      break;
  }
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 70%, 50%)`;
}

export function initGameFieldState() {
  for (const field of fieldDefinitions) {
    fieldState.push({index: field.index, investmentLevel: 0});
  }
}

function getNextPlayer(): Player {
  if (players.length === 0) {
    throw new Error("Нет доступных игроков.");
  }

  const alivePlayers = players.filter(p => !p.isBankrupt);
  if (alivePlayers.length === 0) {
    throw new Error("Все игроки банкроты.");
  }

  // Если currentPlayer не установлен, вернуть первого живого игрока
  if (!currentPlayer) {
    return alivePlayers[0];
  }

  const currentIndex = players.findIndex(p => p.id === currentPlayer.id);

  // Проходим по кругу, начиная со следующего
  const total = players.length;
  for (let i = 1; i <= total; i++) {
    const nextIndex = (currentIndex + i) % total;
    const nextPlayer = players[nextIndex];
    if (!nextPlayer.isBankrupt) {
      return nextPlayer;
    }
  }

  // Теоретически недостижимо, если выше уже проверили, что есть живые игроки
  throw new Error("Не удалось найти следующего игрока.");
}

export function broadcast(message: ServerToClientMessage) {
  const data = JSON.stringify(message);
  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
  }
}

export function send(playerId: string, message: ServerToClientMessage) {
  const socket = playerSocketMap.get(playerId);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.warn(`Socket for client ${clientId} not found or not open`);
  }
}

function getMoneyFromChance(player: Player, sum: Money) {
  if (player.sequester === 0) {
    player.balance += sum;
    broadcast({ type: 'chat', text: `{p:${player.id}} получает +${moneyToString(sum)}` });
    broadcast({ type: 'players', players: players });
  } else 
    broadcast({ type: 'chat', text: `{p:${player.id}}  не получает +${moneyToString(sum)}. Секвестр` });
}

type ChanceHandler = {
  name: string;
  negative: boolean;
  handler: (player: Player) => boolean;
};

// обработчики шанса
const chanceHandlers: Record<string, ChanceHandler> = {
  '1,1': {
    name: '+10',
    negative: false,
    handler: (player: Player) => {
      getMoneyFromChance(player, m(10));
    },
  },
  '1,2': {
    name: '-10',
    negative: true,
    handler: (player: Player) => {
      handlePayment(player, null, m(10), '');
      broadcast({ type: 'players', players: players });
    },
  },
  '1,3': {
    name: '5 ходов вперед',
    negative: true,
    handler: () => {
      turnState = addMove(turnState, 5, false);
    },
  },
  '1,4': {
    name: '5 ходов назад',
    negative: true,
    handler: () => {
      turnState = addMove(turnState, 5, true);
    },
  },
  '1,5': {
    name: 'отказ от вопроса',
    negative: false,
    handler: (player: Player) => {
      player.refusalToChance += 1;
      broadcast({ type: 'players', players: players });
    },
  },
  '1,6': {
    name: 'еще три вопроса',
    negative: true,
    handler: () => {
      turnState = addChance(turnState, 3);
    },
  },
  '2,1': {
    name: '-15',
    negative: true,
    handler: (player: Player) => {
      handlePayment(player, null, m(15), '');
      broadcast({ type: 'players', players: players });
    },
  },
  '2,2': {
    name: '+15',
    negative: false,
    handler: (player: Player) => {
      getMoneyFromChance(player, m(15));
    },
  },
  '2,3': {
    name: 'пожертвуй фирму',
    negative: true,
    handler: (player: Player) => {
      const firmList = getPropertyPosOfPlayerId({playerId: player.id, gameState: fieldState});
      if (firmList.length === 0) {
        broadcast({ type: 'chat', text: `{p:${player.id}:д} нечего жертвовать` });
      } else {
        turnState.awaiting = TurnStateAwaiting.Sacrifice;
        handleTurnEffect({type: 'need-sacrifice'}, player.id);
        return true;
      }
    },
  },
  '2,4': {
    name: 'поменяй фирму',
    negative: true,
    handler: (player: Player) => {
      const minFreePropertyPrice = getMinFreePropertyPrice(fieldState);
      const maxPlayerIdPropertyPrice = getMaxPlayerIdPropertyPrice(fieldState, player.id);

      if (!minFreePropertyPrice || !maxPlayerIdPropertyPrice || minFreePropertyPrice >= maxPlayerIdPropertyPrice) {
        broadcast({ type: 'chat', text: `нечего менять` });
        return false;
      }

      turnState.awaiting = TurnStateAwaiting.Change;
      handleTurnEffect({type: 'change'}, player.id);
      return true;
    },
  },
  '2,5': {
    name: 'еще вопрос',
    negative: true,
    handler: () => {
      turnState = addChance(turnState);
    },
  },
  '2,6': {
    name: 'три отказа от оплаты',
    negative: false,
    handler: (player: Player) => {
      player.refusalToPay += 3;
      broadcast({ type: 'players', players: players });
    },
  },
  '3,1': {
    name: 'купи',
    negative: false,
    handler: (player: Player) => {
      if (player.sequester > 0) {
        broadcast({ type: 'chat', text: `{p:${player.id}} не может покупать. Секвестр` });
        return false;
      }
      const freeProperties = fieldState
        .filter((f) => f.ownerId == null)
        .map((f) => getFieldByIndex(f.index))
        .filter((def): def is FieldDefinition => !!def && !!def.investments?.[0])
        .filter((f) => f.investments[0].cost <= player.balance)
        .map((f) => canBuy({
          playerId: player.id,
          fieldIndex: f.index,
          gameState: fieldState,
          players: players,
          fromChance: true,
          }))
        .filter((f) => f === true);
      if (freeProperties.length === 0) {
        broadcast({ type: 'chat', text: `нечего купить` });
        return false;
      }

      turnState.awaiting = TurnStateAwaiting.Buy;
      handleTurnEffect({type: 'buy'}, player.id);
      return true;
    },
  },
  '3,2': {
    name: '-30',
    negative: true,
    handler: (player: Player) => {
      handlePayment(player, null, m(30), '');
      broadcast({ type: 'players', players: players });
    },
  },
  '3,3': {
    name: '+30',
    negative: false,
    handler: (player: Player) => {
      getMoneyFromChance(player, m(30));
    },
  },
  '3,4': {
    name: 'продай',
    negative: true,
    handler: (player: Player) => {
      if (player.sequester > 0) {
        broadcast({ type: 'chat', text: `нельзя продавать. Секвестр` });
        return false;
      }
      const properties = getPropertyPosOfPlayerId({
        playerId: player.id,
        gameState: fieldState,
      });
      if (properties.length === 0) {
        broadcast({ type: 'chat', text: `нечего продавать` });
        return false;
      }

      turnState.awaiting = TurnStateAwaiting.Sell;
      handleTurnEffect({type: 'sell'}, player.id);
      return true;
    },
  },
  '3,5': {
    name: 'на любую из креста',
    negative: true,
    handler: (player: Player) => {
      turnState.awaiting = TurnStateAwaiting.GoToCross;
      handleTurnEffect({type: 'go-to-cross'}, player.id);
      return true;
    },
  },
  '3,6': {
    name: 'на биржу',
    negative: true,
    handler: (player: Player) => {
      handleTurnEffect({type: 'go-to-exchange'}, player.id);
      return true;
    },
  },
  '4,1': {
    name: 'поставь мезон',
    negative: false,
    handler: (player: Player) => {
      const freeProperties = fieldState
        .filter((f) => f.ownerId == player.id)
        .map((f) => canInvestFree({
          playerId: player.id,
          fieldIndex: f.index,
          gameState: fieldState,
          players: players,
          fromChance: true,
          }))
        .filter((f) => f === true);
      if (freeProperties.length === 0) {
        broadcast({ type: 'chat', text: `некуда ставить` });
        return false;
      }

      turnState.awaiting = TurnStateAwaiting.InvestFree;
      handleTurnEffect({type: 'invest-free'}, player.id);
      return true;
    },
  },
  '4,2': {
    name: 'убери мезон',
    negative: true,
    handler: (player: Player) => {
      const freeProperties = fieldState
        .filter((f) => f.ownerId == player.id && f.investmentLevel > 0);
      if (freeProperties.length === 0) {
        broadcast({ type: 'chat', text: `нечего убирать` });
        return false;
      }

      turnState.awaiting = TurnStateAwaiting.RemoveInvest;
      handleTurnEffect({type: 'rem-invest'}, player.id);
      return true;
    },
  },
  '4,3': {
    name: '-50',
    negative: true,
    handler: (player: Player) => {
      handlePayment(player, null, m(50), '');
      broadcast({ type: 'players', players: players });
    },
  },
  '4,4': {
    name: '+50',
    negative: false,
    handler: (player: Player) => {
      getMoneyFromChance(player, m(50));
    },
  },
  '4,5': {
    name: 'на любую из перефирии',
    negative: true,
    handler: (player: Player) => {
      turnState.awaiting = TurnStateAwaiting.GoToPerimeter;
      handleTurnEffect({type: 'go-to-perimeter'}, player.id);
      return true;
    },
  },
  '4,6': {
    name: 'в тюрьму',
    negative: true,
    handler: (player: Player) => {
      handleTurnEffect({type: 'go-to-jail'}, player.id);
      return true;
    },
  },
  '5,1': {
    name: 'плюс старт',
    negative: false,
    handler: (player: Player) => {
      player.plusStart += 1;
      broadcast({ type: 'players', players: players });
    },
  },
  '5,2': {
    name: 'минус старт',
    negative: true,
    handler: (player: Player) => {
      player.plusStart -= 1;
      broadcast({ type: 'players', players: players });
    },
  },
  '5,3': {
    name: 'продай монополию',
    negative: true,
    handler: (player: Player) => {
      const monList = getMonopoliesOfPlayer(player.id, fieldState);
      if (monList.length === 0) {
        broadcast({ type: 'chat', text: `нечего продавать` });
        return false;
      }
      if (player.sequester > 0) {
        broadcast({ type: 'chat', text: `нельзя продавать. Секвестр` });
        return false;
      }

      turnState.awaiting = TurnStateAwaiting.SellMonopoly;
      handleTurnEffect({type: 'sell-monopoly'}, player.id);
      return true;

    },
  },
  '5,4': {
    name: 'всем по 10',
    negative: true,
    handler: (player: Player) => {
      const pl = players
        .filter((p) => !p.isBankrupt && p.id !== player.id);
      if (pl.length === 0) {
        broadcast({ type: 'chat', text: `некому платить` });
        return false;
      }

      pl.forEach((p) => {
        handlePayment(player, p, m(10), '');
        broadcast({ type: 'players', players: players });
      });
    },
  },
  '5,5': {
    name: 'от всех по 10',
    negative: false,
    handler: (player: Player) => {
      const pl = players
        .filter((p) => !p.isBankrupt && p.id !== player.id);
      if (pl.length === 0) {
        broadcast({ type: 'chat', text: `некому платить` });
        return false;
      }

      pl.forEach((p) => handlePayment(p, player, m(10), ''));
      broadcast({ type: 'players', players: players });
    },
  },
  '5,6': {
    name: 'все теряют',
    negative: false,
    handler: (player: Player) => {
      const pl = players
        .filter((p) => !p.isBankrupt && p.id !== player.id)
        .filter((p) => getPropertyPosOfPlayerId({playerId: p.id, gameState: fieldState}).length > 0);
      if (pl.length === 0) {
        broadcast({ type: 'chat', text: `некому терять` });
        return false;
      }

      pl.forEach((p) => p.pendingActions.push({ type: 'loose' }));
      broadcast({ type: 'players', players: players });
    },
  },
  '6,1': {
    name: 'свернуть к старту',
    negative: true,
    handler: (player: Player) => {
      player.turnToStart += 1;
      broadcast({ type: 'players', players: players });
    },
  },
  '6,2': {
    name: 'секвестр',
    negative: true,
    handler: (player: Player) => {
      player.sequester += 5;
      broadcast({ type: 'players', players: players });
    },
  },
  '6,3': {
    name: 'в такси',
    negative: true,
    handler: (player: Player) => {
      handleTurnEffect({type: 'go-to-taxi'}, player.id);
      return true;
    },
  },
  '6,4': {
    name: 'между фишкой и стартом',
    negative: true,
    handler: (player: Player) => {
      turnState.awaiting = TurnStateAwaiting.GoBetweenStart;
      handleTurnEffect({type: 'go-between-start'}, player.id);
      return true;
    },
  },
  '6,5': {
    name: 'всем по 15',
    negative: true,
    handler: (player: Player) => {
      const pl = players
        .filter((p) => !p.isBankrupt && p.id !== player.id);
      if (pl.length === 0) {
        broadcast({ type: 'chat', text: `некому платить` });
        return false;
      }

      pl.forEach((p) => {
        handlePayment(player, p, m(15), '');
        broadcast({ type: 'players', players: players });
      });
    },
  },
  '6,6': {
    name: 'от всех по 15',
    negative: false,
    handler: (player: Player) => {
      const pl = players
        .filter((p) => !p.isBankrupt && p.id !== player.id);
      if (pl.length === 0) {
        broadcast({ type: 'chat', text: `некому платить` });
        return false;
      }

      pl.forEach((p) => handlePayment(p, player, m(15), ''));
      broadcast({ type: 'players', players: players });
    },
  },
};

function applyChanceEffect(chance: ChanceHandler, playerId: string, player: Player) {
  chance1 = 0;
  chance2 = 0;
  const stopFinish = chance.handler(player);
  if (!stopFinish) finishTurn(playerId);
}

function finishTurn(playerId: string) {
  turnState.currentAction = null;
  turnState.awaiting = TurnStateAwaiting.Nothing;
  const result = chkTurn(turnState);
  turnState = result.turnState;
  handleTurnEffect(result.effect, playerId);
}

function processChance(playerId: string, make?: boolean) {
  const player = getPlayerById(players, playerId);
  const handlerKey = `${chance1},${chance2}`;
  const chance = chanceHandlers[handlerKey];

  if (!chance) {
    console.warn(`Нет обработчика шанса для ${handlerKey}`);
    return;
  }

  // Первый вызов — отображение шанса и, при необходимости, выбор игрока
  if (make === null) {
    broadcast({ type: 'chat', text: `{p:${player.id}} выбросил "${chance.name}"` });

    if (player.refusalToChance > 0 && chance.negative) {
      send(playerId, {
        type: 'allow-chance-decision',
        playerId: player.id,
        text: chance.name,
      });
      return;
    }

    // если отказ невозможен — сразу применяем
    applyChanceEffect(chance, playerId, player);
    return;
  }

  // Второй вызов — решение принято
  if (make) {
    applyChanceEffect(chance, playerId, player);
  } else {
    chance1 = 0;
    chance2 = 0;
    player.refusalToChance -= 1;
    broadcast({ type: 'chat', text: `{p:${player.id}} отказался от "${chance.name}"` });
    broadcast({ type: 'players', players: players });
    finishTurn(playerId);
  }
}


export function makePlayerBankrupt(playerId: number) {
  const ownedFields = fieldState.filter(f => f.ownerId === playerId);
  ownedFields.forEach(f => {f.investmentLevel = 0; f.ownerId = undefined});
  const player = getPlayerById(players, playerId);
  player.balance = m(0);
  player.position = undefined;
  player.isBankrupt = true;
  player.pendingActions = [];

  broadcast({ type: 'chat', text: `{p:${player.id}} объявляется БАНКРОТОМ. Он покидает игру` });
  broadcast({ type: 'field-states-init', fieldsStates: fieldState });
}

function doIncome(player: Player, fieldIndex: number) {
  const state = getFieldStateByIndex(fieldState, fieldIndex);
  const field = getFieldByIndex(fieldIndex);
  const income = getCurrentIncome({fieldIndex: fieldIndex, gameState: fieldState});
  broadcast({ type: 'chat', text: `{p:${player.id}} получает с {F:${field.index}} ${moneyToString(income)}` });
  player.balance += income;
  // установить запрет на инвестиции здесь
  player.investIncomeBlock.push(field.index);
  broadcast({ type: 'players', players: players });
  broadcast({ type: 'field-states-update', fieldState: state });
}

function processGoToNewField(player: Player) {
  // если попадаем на чужое поле - заплатить
  const newPosOwnerId = getFieldOwnerId({fieldIndex: player.position, gameState: fieldState});
  if (newPosOwnerId && newPosOwnerId !== player.id) {
    const income = getCurrentIncome({fieldIndex: player.position, gameState: fieldState});
    const owner = getPlayerById(players, newPosOwnerId);
    const newField = getFieldByIndex(player.position);

    handlePayment(player, owner, income, `за {F:${newField.index}:в}`);
  }

  if (player.position === 20) {
    // биржа
    handlePayment(player, null, m(10), `за использоваание БИРЖИ`);
    player.inBirja = true;
  }

  if (player.position === 10) {
    // такси
    player.inTaxi = true;
  }
  if (player.position === 30) {
    // тюрьма
    player.inJail = true;
  }

  // Пипка
  if (player.position === 8 || player.position === 18 || player.position === 28 || player.position === 38) {
    const injail = players.filter ((p) => p.inJail === true);
    const intaxi = players.filter ((p) => p.inTaxi === true);

    injail.forEach((p) => {
      p.inJail = false;
      broadcast({ type: 'chat', text: `{p:${p.id}} бесплатно выходит из тюрьмы` });
    });
    intaxi.forEach((p) => {
      p.inTaxi = false;
      p.position = player.position - 3;
      const newFirm = getFieldByIndex(p.position);
      broadcast({ type: 'chat', text: `{p:${p.id}} бесплатно переносится на {F:${newFirm.index}:в}` });
      processGoToNewField(p);
    });
  }

  // Вопросы
  if (player.position === 0) turnState = addChance(turnState, 3);
  if (player.position === 3 || player.position === 13 || player.position === 23 || player.position === 33)
    turnState = addChance(turnState);

  broadcast({ type: 'players', players: players });
}

function movePlayer(player: Player, steps: number, posFromChance?: number) {
  let path = [];
  let stay = true;
  let passStart = false;

  // если не получил доход - начислить
  if (canIncome({ playerId: player.id, fieldIndex: player.position, gameState: fieldState, players: players })) {
    doIncome(player, player.position);
  }

  // снимаем запреты на инвестиции
  player.investIncomeBlock = [];
  player.inBirja = false;

  // усли переход с шанса, то снимаем флаги тюрьма и такси
  if (steps === 0) {
    player.inTaxi = false;
    player.inJail = false;
  }

  if (posFromChance !== undefined) {
    steps = 0;
    if (player.position !== posFromChance) stay = false;
    player.position = posFromChance;
    if (crossList.includes(player.position)) player.direction = getDirOnCross(player.position);
    path = [player.position];
  }
  if (steps === 0 && player.position === 44) passStart = true;
  if (steps > 0) {
    const moveResult = calculateMovementPath({
      from: player.position,
      steps: diceResult,
      backward: isNowBackward(turnState),
      goToStart: player.turnToStart > 0 ? true : false,
      directionOnCross: player.direction
    });
    player.direction = moveResult.directionOnCross
    player.position = moveResult.path.at(-1)!;
    path = moveResult.path;
    stay = false;
    passStart = moveResult.passedStart;
    if (player.turnToStart > 0 && moveResult.turnedToCenter) player.turnToStart -= 1;
  }
  if (player.position === 44) player.direction = null;

  // Рассылаем новое положение игрока
  broadcast({
    type: 'move',
    playerId: player.id,
    path: path,
    stay: stay,
  });

  if (passStart) {
    if (player.plusStart > 0) {
      if (player.sequester === 0) {
        player.plusStart -= 1;
        player.balance += m(50);
        broadcast({ type: 'chat', text: `{p:${player.id}} использует +st и получает +50 за проход через СТАРТ` });
      } else
        broadcast({ type: 'chat', text: `{p:${player.id}} не получает за проход через СТАРТ. Секвестр` });
    } else if (player.plusStart < 0) {
      player.plusStart += 1;
      broadcast({ type: 'chat', text: `{p:${player.id}} использует -st и не получает за проход через СТАРТ` });
    } else {
      if (player.sequester === 0) {
        player.balance += m(25);
        broadcast({ type: 'chat', text: `{p:${player.id}} получает +25 за проход через СТАРТ` });
      } else
        broadcast({ type: 'chat', text: `{p:${player.id}} не получает за проход через СТАРТ. Секвестр` });
    }
  }

  processGoToNewField(player);
}

export function allowCenterBut(playerId: string) {
  send(playerId, {type: 'allow-center-but', playerId: playerId})
}

export function allowGoStayBut(playerId: string) {
  const player = players.find(p => (p.id) === playerId);
  const dir = getCurrentDir(player.position, player.direction, turnState.currentAction.backward);
  send(player.id, {type: 'allow-go-stay-but', playerId: player.id, dir: dir})
}

export function showChance(res1?: num, res2?: num) {
  broadcast({type: 'show-chance', res1: res1, res2: res2})
}

let json;
export function allowDice(playerId: string) {

////////////// debug ///////////////////////////
const debugPath = './debug.json';
let dRes = 0;
try {
  if (!json) {
    const file = fs.readFileSync(debugPath, 'utf8');
    json = JSON.parse(file);
  }

  if (Array.isArray(json.forcedDice) && json.forcedDice.length !== 0) {
    const value = json.forcedDice.shift();
    if (!json.once && json.forcedDice.length === 0) {
      json = null;
    }
    dRes = value;
  }
} catch {
  dRes = 0;
}
////////////////////////////////////////////////

  if (dRes) diceResult = dRes;
  else diceResult = Math.floor(Math.random() * 6) + 1;
  //diceResult = 6;
  send(playerId, {type: 'allow-dice', playerId: playerId, value: diceResult})
}

export function allowEndTurn(playerId: string) {
  send(playerId, {type: 'allow-end-turn', playerId: playerId})
}

export function processJailOrTaxi(playerId: string) {
  const player = players.find(p => (p.id) === playerId);
  if (!player) return;
  if (player.balance + getPropertyTotalCost({playerId: player.id, gameState: fieldState}) >= m(10)) {
    // можно выкупиться
    turnState.awaiting = TurnStateAwaiting.FromJailOrTaxi;
    allowGoStayBut(playerId);
  } else {
    // нельзя выкупиться
    broadcast ({ type: 'chat', text: `{p:${player.id}:д} не хватает денег, чтобы выкупится из тюрьмы` })
    turnState.currentAction = null;
    turnState.awaiting = TurnStateAwaiting.Nothing;
    const result = chkTurn(turnState);
    turnState = result.turnState;
    handleTurnEffect(result.effect, playerId);
  }
}

function reCalcPendingActions(player: Player): void {
  if (player.pendingActions.length === 0) return;

  // Новый массив без "payment"-действий, которые были обработаны
  const newPendingActions: typeof player.pendingActions = [];

  for (const a of player.pendingActions) {
    if (player.isBankrupt) break;

    if (a.type === 'payment' && player.refusalToPay === 0) {
      processPayment(player, a.to, a.amount, a.reason);
      // не добавляем в новый список — считается "удалённым"
    } else {
      newPendingActions.push(a);
    }
  }

  player.pendingActions = newPendingActions;

  // Обработка 'loose'
  if (
    player.pendingActions.some((a) => a.type === 'loose') &&
    getPropertyPosOfPlayerId({playerId: player.id, gameState: fieldState}).length === 0
  ) {
    broadcast({ type: 'chat', text: `{p:${player.id}:д} больше нечего терять` });

    player.pendingActions = player.pendingActions.filter((a) => a.type !== 'loose');
  }
}

export function handleMessage(clientSocket: WebSocket, raw: string) {
  let message: ClientToServerMessage;

  try {
    message = JSON.parse(raw);
  } catch {
    console.error('Invalid JSON:', raw);
    return;
  }

  console.log(message);

  switch (message.type) {
    case 'restart': {
      const sessionId = socketSessionMap.get(clientSocket);
      if (!sessionId) {
        clientSocket.send(JSON.stringify({ type: 'error', message: 'Нет sessionId' }));
        break;
      }

      // Проверяем права: админ или нет живых игроков (не банкротов и не оффлайн) с другими session
      const isAdmin = adminSessions.has(sessionId);

      // Проверяем живых игроков вне этой сессии
      const otherSessions = Array.from(sessionPlayerMap.keys()).filter(sid => sid !== sessionId);
      let hasAlivePlayers = false;
      for (const sid of otherSessions) {
        const pids = sessionPlayerMap.get(sid) || [];
        for (const pid of pids) {
          const player = getPlayerById(players, pid);
          if (player && !player.isBankrupt && !player.isOffline) {
            hasAlivePlayers = true;
            break;
          }
        }
        if (hasAlivePlayers) break;
      }

      if (!isAdmin && hasAlivePlayers) {
        clientSocket.send(JSON.stringify({ type: 'error', message: 'Нет прав на рестарт' }));
        break;
      }

      console.log(`[WebSocket] Restart initiated by session ${sessionId}`);

      // Очищаем все игровые структуры
      socketSessionMap.clear();
      sessionSocketMap.clear();

      players.length = 0;
      sessionPlayerMap.clear();
      playerSocketMap.clear();

      adminSessions.clear();

      fieldState.length = 0;
      initGameFieldState();

      gameStarted = false;
      currentPlayer = undefined;
      turnState = undefined;
      diceResult = undefined;
      chance1 = undefined;
      chance2 = undefined;

      // Отправляем клиенту подтверждение рестарта
      clientSocket.send(JSON.stringify({ type: 'restart-confirmed' }));

      // По идее, все клиенты отсоединятся (или будут отсоединены) и подключатся заново
      // Закрываем все активные соединения
      for (const s of sockets) {
        try {
          s.close(1000, 'Server restart');
        } catch {
          // Игнорируем ошибки закрытия
        }
      }
      sockets.length = 0;

      break;
    }
    case 'admin_auth': {
      const sessionId = socketSessionMap.get(clientSocket);
      if (!sessionId) {
        console.warn('[WebSocket] admin_auth without sessionId');
        clientSocket.send(JSON.stringify({ type: 'set-admin', isAdmin: false }));
        break;
      }

      const isValid = message.password === process.env.ADMIN_PASSWORD;

      if (isValid) {
        adminSessions.add(sessionId);
        console.log(`[WebSocket] Session ${sessionId} granted admin rights`);
      } else {
        adminSessions.delete(sessionId);
        console.log(`[WebSocket] Session ${sessionId} failed admin auth`);
      }

      clientSocket.send(JSON.stringify({ type: 'set-admin', isAdmin: isValid }));
      break;
    }
    case 'list_ips': {
      const sessionId = socketSessionMap.get(clientSocket);
      if (!sessionId) {
        clientSocket.send(JSON.stringify({ type: 'error', message: 'Нет sessionId' }));
        break;
      }

      if (!adminSessions.has(sessionId)) {
        clientSocket.send(JSON.stringify({ type: 'error', message: 'Нет прав для просмотра списка IP' }));
        break;
      }

      // Собираем данные по сессиям
      const ips: IpSessionPlayers[] = [];

      for (const socket of sockets) {
        const sid = socketSessionMap.get(socket);
        if (!sid) continue;

        // @ts-ignore — у WebSocket в Node.js есть _socket.remoteAddress
        const ip = (socket as any)._socket?.remoteAddress || 'unknown';

        const playerIds = sessionPlayerMap.get(sid) || [];
        const playersForSession = playerIds
          .map(pid => getPlayerById(players, pid))
          .filter(Boolean) as Player[];

        ips.push({
          sessionId: sid,
          ip,
          players: playersForSession,
        });
      }

      clientSocket.send(JSON.stringify({
        type: 'list_ips',
        ips,
      }));

      break;
    }
    case 'register': {
      const { name } = message;

      // Проверка на повторяющееся имя
      if (players.some((p) => p.name === name)) {
        const errorMessage = {
          type: 'error',
          reason: ErrorReason.NameTaken,
          name,
          message: 'Имя ' + name + ' уже занято. Выберите другое.',
        } satisfies ServerToClientMessage;
        clientSocket.send(JSON.stringify(errorMessage));
        return;
      }

      const playerId = uuidv4();
      const newPlayer: Player = {
        id: playerId,
        name: name,
        isBankrupt: false,
        isOffline: false,
        position: 44,
        direction: null,
        balance: m(75),
        investIncomeBlock: [],
        inBirja: false,
        inJail: false,
        inTaxi: false,
        turnToStart: 0,
        sequester: 0,
        refusalToPay: 0,
        pendingActions: [],
        refusalToChance: 0,
        plusStart:0,
        color: stringToColor(name),
        bot: false,
      };

      players.push(newPlayer);
      const sessionId = socketSessionMap.get(clientSocket);
      let sessionPlayers = sessionPlayerMap.get(sessionId);
      if (!sessionPlayers) {
        sessionPlayers = [];
        sessionPlayerMap.set(sessionId, sessionPlayers);
      }
      sessionPlayers.push(playerId);

      playerSocketMap.set(playerId, clientSocket);

      clientSocket.send(JSON.stringify({ type: 'player-registered', playerId: playerId, name: name }));
      broadcast({ type: 'players', players: players });
      break;
    }

    case 'change-bot': {
      const socket = playerSocketMap.get(message.playerId);
      if (socket !== clientSocket) return;

      const player = players.find(p => (p.id) === message.playerId);
      if (!player) return;
      player.bot = !player.bot;
      broadcast({ type: 'players', players: players });
      if (player.bot)
        send(message.playerId, { type: 'error', reason: ErrorReason.NotImplemented, message: 'Боты еще не реализованы' });

      break;
    }

    case 'change-color': {
      const socket = playerSocketMap.get(message.playerId);
      if (socket !== clientSocket) return;

      const player = players.find(p => (p.id) === message.playerId);
      if (!player) return;
      player.color = message.color;
      broadcast({ type: 'players', players: players });

      break;
    }

    case 'start': {
      if (gameStarted) break;

      // Проверяем, есть ли у этого сокета хотя бы один игрок
      const playerIds = Array.from(playerSocketMap.entries())
        .filter(([_, s]) => s === clientSocket)
        .map(([id]) => id);

      if (playerIds.length === 0) {
        clientSocket.send(JSON.stringify({
          type: 'error',
          reason: ErrorReason.InvalidAction,
          message: 'У вас нет зарегистрированных игроков'
        }));
        break;
      }

      gameStarted = true;

      broadcast({ type: 'field-states-init', fieldsStates: fieldState });
      broadcast({ type: 'game-started' });

      currentPlayer = getNextPlayer();
      const playerId = currentPlayer.id;
      turnState = startTurn(playerId);
      const result = chkTurn(turnState);
      turnState = result.turnState;
      handleTurnEffect(result.effect, playerId);
      broadcast({ type: 'turn', playerId: playerId });

      break;
    }

    case 'chat': {
      const socket = playerSocketMap.get(message.playerId);
      if (socket !== clientSocket) return;

      const player = players.find(p => (p.id) === message.playerId);
      if (!player) return;

      const broadcastMsg: ServerToClientMessage = {
        type: 'chat',
        from: player.name,
        text: message.text,
      };

      broadcast(broadcastMsg);
      break;
    }

    case 'go-stay-choose': {
      const socket = playerSocketMap.get(message.playerId);
      if (socket !== clientSocket) return;

      const player = players.find(p => (p.id) === message.playerId);
      if (!player || player.id !== turnState.playerId) return;

      if (turnState.currentAction.type === 'move') {
        if (turnState.awaiting === TurnStateAwaiting.GoStayBut) {
          // Рассылаем результат выбора
          broadcast({
            type: 'dir-choose',
            playerId: player.id,
            dir: message.dec,
          });
          if (message.dec === Direction.Move) {
            movePlayer(player, diceResult);
          } else if (message.dec === Direction.Stay) {
            movePlayer(player, 0);
          }
          diceResult = 0;
          turnState.currentAction = null;
          turnState.awaiting = TurnStateAwaiting.Nothing;
          const result = chkTurn(turnState);
          turnState = result.turnState;
          handleTurnEffect(result.effect, player.id);
        } else if (turnState.awaiting === TurnStateAwaiting.FromJailOrTaxi) {
          let from1 = 'тюрьмы';
          let from2 = 'тюрьме';
          if (player.inTaxi) {
            from1 = 'такси';
            from2 = 'такси';
          }
          if (message.dec === Direction.Move) {
            broadcast({ type: 'chat', text: `{p:${player.id}} решил выйти из ${from1}` });
            handlePayment(player, null, m(10), `за выход из ${from1}`);
            player.inJail = false;
            player.inTaxi = false;
            // сообщаем об изменении баланса
            broadcast({ type: 'players', players: players });
            turnState.awaiting = TurnStateAwaiting.Nothing;
            const result = chkTurn(turnState);
            turnState = result.turnState;
            handleTurnEffect(result.effect, player.id);
          } else if (message.dec === Direction.Stay) {
            broadcast({ type: 'chat', text: `{p:${player.id}} решил остаться в ${from2}` });
            turnState.currentAction = null;
            turnState.awaiting = TurnStateAwaiting.Nothing;
            const result = chkTurn(turnState);
            turnState = result.turnState;
            handleTurnEffect(result.effect, player.id);
          }
        }
      }
      break;
    }

    case 'dir-choose': {
      const socket = playerSocketMap.get(message.playerId);
      if (socket !== clientSocket) return;

      const player = players.find(p => (p.id) === message.playerId);
      if (!player || player.id !== turnState.playerId) return;

      if (turnState.currentAction.type === 'move' && turnState.awaiting === TurnStateAwaiting.CenterBut) {
        player.direction = message.dir;

        // Рассылаем результат выбора
        broadcast({
          type: 'dir-choose',
          playerId: player.id,
          dir: message.dir,
        });
        
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, player.id);
      }

      break;
    }

    case 'roll-dice': {
      break;
    }

    case 'roll-dice-end': {
      const socket = playerSocketMap.get(message.playerId);
      if (socket !== clientSocket) return;

      const player = players.find(p => (p.id) === message.playerId);
      if (!player || player.id !== turnState.playerId) return;

      if (turnState.currentAction.type === 'move' && turnState.awaiting === TurnStateAwaiting.DiceRoll) {
        // Рассылаем результат броска
        broadcast({
          type: 'show-dice-result',
          playerId: player.id,
          result: diceResult,
        });
        if (diceResult === 6) {
          turnState.awaiting = TurnStateAwaiting.GoStayBut;
          allowGoStayBut(player.id);
        } else {
          // Переместим игрока
          movePlayer(player, diceResult);
          turnState.currentAction = null;
          turnState.awaiting = TurnStateAwaiting.Nothing;
          const result = chkTurn(turnState);
          turnState = result.turnState;
          handleTurnEffect(result.effect, player.id);
        }
      } else if (turnState.currentAction.type === 'chance' && turnState.awaiting === TurnStateAwaiting.Chance1) {
        chance1 = diceResult;
        chance2 = 0;
        diceResult = 0;
        broadcast({ type: 'chat', text: `{p:${player.id}} бросил в первый раз ${chance1}` });
        turnState.awaiting = TurnStateAwaiting.Chance2;
        handleTurnEffect({ type: 'need-dice-roll' }, player.id);
      } else if (turnState.currentAction.type === 'chance' && turnState.awaiting === TurnStateAwaiting.Chance2) {
        chance2 = diceResult;
        diceResult = 0;
        broadcast({ type: 'chat', text: `{p:${player.id}} бросил во второй раз ${chance2}` });
        showChance(chance1, chance2);
        processChance(player.id, null);
      }

      break;
    }

    case 'end-of-turn': {
      const socket = playerSocketMap.get(message.playerId);
      if (socket !== clientSocket) return;

      const player = players.find(p => (p.id) === message.playerId);
      if (!player || player.id !== turnState.playerId) return;

      if (isTurnComplete && turnState.awaiting === TurnStateAwaiting.EndTurn) {
        if (player.sequester > 0) {
          player.sequester -= 1;
          broadcast({ type: 'players', players: players });
          if (player.sequester === 0) broadcast({ type: 'chat', text: `У {p:${player.id}:р} закончился секвестр` });
        }
        currentPlayer = getNextPlayer();

        broadcast({ type: 'turn', playerId: currentPlayer.id });
        turnState = startTurn(currentPlayer.id);
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, currentPlayer.id);

      } else {
        console.log('Какая то фигня с переходом хода');
      }

      break;
    }

    case 'buy': {
      const { playerId, field, sacrificeFirmId } = message;

      const socket = playerSocketMap.get(playerId);
      if (socket !== clientSocket) return;

      const player = getPlayerById(players, playerId);
      if (!player) return;

      if (! canBuy({
          playerId: player.id,
          fieldIndex: field.index,
          gameState: fieldState,
          players: players,
          fromChance: (turnState.playerId === playerId && turnState.awaiting === TurnStateAwaiting.Buy),
      })) {
        console.log('Какая то фигня с покупкой');
        break;
      }

      if (player.inBirja) player.inBirja = false;

      const cost = field.investments[0].cost;
      const type = field.investments[0].type;
      let sacrificeInCompetedMonopoly;
      if (type === InvestmentType.SacrificeCompany || type === InvestmentType.SacrificeMonopoly) {
        const sacrificeCompanyState = getFieldStateByIndex(fieldState, sacrificeFirmId);
        if (sacrificeCompanyState && sacrificeCompanyState.ownerId === playerId) {
          sacrificeInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: sacrificeFirmId, gameState: fieldState});

          if (type === InvestmentType.SacrificeMonopoly && sacrificeInCompetedMonopoly.monopolies.length === 0) {
            console.log('Какая то фигня с покупкой');
            break;
          }

          broadcast({ type: 'chat', text: `{p:${player.id}} жертвует {F:${getFieldByIndex(sacrificeFirmId).index}:в} и покупает {F:${field.index}:в} за ${moneyToString(cost)}` });
          sacrificeCompanyState.ownerId = undefined;
          sacrificeCompanyState.investmentLevel = 0; 
          broadcast({ type: 'field-states-update', fieldState: sacrificeCompanyState });
        } else {
          console.log('Какая то фигня с жертвой при покупке');
        }
      } else {
        broadcast({ type: 'chat', text: `{p:${player.id}} покупает {F:${field.index}:в} за ${moneyToString(cost)}` });
      }
      player.balance -= cost;
      const state = getFieldStateByIndex(fieldState, field.index);
      state.ownerId = playerId;
      // установить запрет на инвестиции здесь
      player.investIncomeBlock.push(field.index);

      sacrificeInCompetedMonopoly?.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `{p:${player.id}} теряет монополию ${mon.name}` });
      });
      const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: field.index, gameState: fieldState});
      fieldInCompetedMonopoly.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `{p:${player.id}} образовал монополию ${mon.name}` });
      });

      broadcast({ type: 'players', players: players });
      broadcast({ type: 'field-states-update', fieldState: state });

      if (turnState.playerId === playerId && turnState.awaiting === TurnStateAwaiting.Buy) {
        turnState.currentAction = null;
        turnState.awaiting = TurnStateAwaiting.Nothing;
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, player.id);
      }
      break;
    }

    case 'change': {
      const { playerId, takeField, giveFirmId } = message;

      const socket = playerSocketMap.get(playerId);
      if (socket !== clientSocket) return;

      const player = getPlayerById(players, playerId);
      if (!player || player.id !== turnState.playerId) return;

      const takeFieldState = getFieldStateByIndex(fieldState, takeField.index);
      const giveFirmState = getFieldStateByIndex(fieldState, giveFirmId);
      const giveFirm = getFieldByIndex(giveFirmId);

      if (takeFieldState.ownerId || giveFirmState.ownerId !== playerId ||
        giveFirm.investments[0].cost <= takeField.investments[0].cost) {
        console.log('Какая то фигня с обменом');
        break;
      }

      const giveInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: giveFirmId, gameState: fieldState});

      broadcast({ type: 'chat', text: `{p:${player.id}} меняет {F:${giveFirm.index}:в} на {F:${takeField.index}:в}` });
      giveFirmState.ownerId = undefined;
      giveFirmState.investmentLevel = 0; 
      takeFieldState.ownerId = playerId;
      // установить запрет на инвестиции здесь
      player.investIncomeBlock.push(takeField.index);
      broadcast({ type: 'field-states-update', fieldState: giveFirmState });
      broadcast({ type: 'field-states-update', fieldState: takeFieldState });
      broadcast({ type: 'players', players: players });

      giveInCompetedMonopoly?.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `{p:${player.id}} теряет монополию ${mon.name}` });
      });
      const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: takeField.index, gameState: fieldState});
      fieldInCompetedMonopoly.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `{p:${player.id}} образовал монополию ${mon.name}` });
      });

      if (turnState.playerId === playerId && turnState.awaiting === TurnStateAwaiting.Change) {
        turnState.currentAction = null;
        turnState.awaiting = TurnStateAwaiting.Nothing;
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, player.id);
      }
      break;
    }

    case 'sell': {
      const { playerId, field } = message;

      const socket = playerSocketMap.get(playerId);
      if (socket !== clientSocket) return;

      const player = getPlayerById(players, playerId);
      if (!player) return;

      if (! canSell({ playerId: player.id, fieldIndex: field.index, gameState: fieldState, players: players })) {
        console.log('Какая то фигня с продажей');
        break;
      }

      const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: field.index, gameState: fieldState});

      if (turnState.awaiting === TurnStateAwaiting.SellMonopoly &&
        (fieldInCompetedMonopoly?.ownerId !== turnState.playerId || !fieldInCompetedMonopoly?.monopolies?.length)) {
        console.log('Какая то фигня с продажей');
        break;
      }

      const cost = field.investments[0].cost;
      broadcast({ type: 'chat', text: `{p:${player.id}} породает {F:${field.index}:в} за ${moneyToString(cost)}` });
      player.balance += cost;
      const state = getFieldStateByIndex(fieldState, field.index);
      state.ownerId = undefined;
      state.investmentLevel = 0; 
      // снимаем запрет на инвестиции здесь
      player.investIncomeBlock = player.investIncomeBlock?.filter(e => e !== field.index);

      fieldInCompetedMonopoly.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `{p:${player.id}} теряет монополию ${mon.name}` });
      });

      broadcast({ type: 'players', players: players });
      broadcast({ type: 'field-states-update', fieldState: state });

      if (turnState.playerId === playerId &&
        [TurnStateAwaiting.PositiveBalance, TurnStateAwaiting.Sell, TurnStateAwaiting.SellMonopoly]
          .includes(turnState.awaiting)) {
        turnState.currentAction = null;
        turnState.awaiting = TurnStateAwaiting.Nothing;
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, currentPlayer.id);
      }
      break;
    }

    case 'sacrifice': {
      const { playerId, field } = message;

      const socket = playerSocketMap.get(playerId);
      if (socket !== clientSocket) return;

      const player = getPlayerById(players, playerId);
      if (!player || player.id !== turnState.playerId) return;

      const state = getFieldStateByIndex(fieldState, field.index);
      if (state.ownerId !== playerId) {
        console.log('Какая то фигня с жертвой');
        break;
      }

      const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: field.index, gameState: fieldState});

      broadcast({ type: 'chat', text: `{p:${player.id}} жертвует {F:${field.index}:в}` });
      state.ownerId = undefined;
      state.investmentLevel = 0; 
      // снимаем запрет на инвестиции здесь
      player.investIncomeBlock = player.investIncomeBlock?.filter(e => e !== field.index);

      fieldInCompetedMonopoly.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `{p:${player.id}} теряет монополию ${mon.name}` });
      });

      broadcast({ type: 'players', players: players });
      broadcast({ type: 'field-states-update', fieldState: state });

      if (turnState.playerId === playerId && turnState.awaiting === TurnStateAwaiting.Sacrifice) {
        turnState.currentAction = null;
        turnState.awaiting = TurnStateAwaiting.Nothing;
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, currentPlayer.id);
      }
      break;
    }

    case 'invest': {
      const { playerId, field, sacrificeFirmId } = message;

      const socket = playerSocketMap.get(playerId);
      if (socket !== clientSocket) return;

      const player = getPlayerById(players, playerId);
      if (!player) return;

      const state = getFieldStateByIndex(fieldState, field.index);

      // сначала обработаем бесплатное инвестирование с шанса
      if (turnState.playerId === playerId && turnState.awaiting === TurnStateAwaiting.InvestFree) {
        if (! canInvestFree({ playerId: player.id, fieldIndex: field.index, gameState: fieldState, players: players, fromChance: true })) {
          console.log('Какая то фигня с бесплатным инвестирванием');
          break;
        }
        state.investmentLevel += 1;
        // установить запрет на инвестиции здесь
        player.investIncomeBlock.push(field.index);
        broadcast({ type: 'chat', text: `{p:${player.id}} бесплатно инвестирует в {F:${field.index}:в}` });
        broadcast({ type: 'field-states-update', fieldState: state });
        turnState.currentAction = null;
        turnState.awaiting = TurnStateAwaiting.Nothing;
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, currentPlayer.id);
        break;
      }

      if (! canInvest({ playerId: player.id, fieldIndex: field.index, gameState: fieldState, players: players })) {
        console.log('Какая то фигня с инвестирванием');
        break;
      }

      const cost = getNextInvestmentCost({fieldIndex: field.index, gameState: fieldState});
      const type = getNextInvestmentType({fieldIndex: field.index, gameState: fieldState});
      let sacrificeInCompetedMonopoly;
      if (type === InvestmentType.SacrificeCompany || type === InvestmentType.SacrificeMonopoly) {
        const sacrificeCompanyState = getFieldStateByIndex(fieldState, sacrificeFirmId);
        if (sacrificeCompanyState && sacrificeCompanyState.ownerId === playerId) {
          sacrificeInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: sacrificeFirmId, gameState: fieldState});

          if (type === InvestmentType.SacrificeMonopoly && sacrificeInCompetedMonopoly.monopolies.length === 0) {
            console.log('Какая то фигня с инвестирванием');
            break;
          }

          broadcast({ type: 'chat', text: `{p:${player.id}} жертвует {F:${getFieldByIndex(sacrificeFirmId).index}:в} и инвестирует в {F:${field.index}:в} за ${moneyToString(cost)}` });
          sacrificeCompanyState.ownerId = undefined;
          sacrificeCompanyState.investmentLevel = 0; 
          broadcast({ type: 'field-states-update', fieldState: sacrificeCompanyState });
        } else {
          console.log('Какая то фигня с жертвой при инвестиции');
        }
      } else {
        broadcast({ type: 'chat', text: `{p:${player.id}} инвестирует в {F:${field.index}:в} ${moneyToString(cost)}` });
      }

      player.balance -= cost;
      state.investmentLevel += 1;
      // установить запрет на инвестиции здесь
      player.investIncomeBlock.push(field.index);

      sacrificeInCompetedMonopoly?.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `{p:${player.id}} теряет монополию ${mon.name}` });
      });

      broadcast({ type: 'players', players: players });
      broadcast({ type: 'field-states-update', fieldState: state });
//      broadcast({ type: 'field-states-init', fieldsStates: fieldState });
      break;
    }

    case 'rem-invest': {
      const { playerId, field } = message;

      const socket = playerSocketMap.get(playerId);
      if (socket !== clientSocket) return;

      const player = getPlayerById(players, playerId);
      if (!player || player.id !== turnState.playerId) return;

      const state = getFieldStateByIndex(fieldState, field.index);
      if (state.ownerId !== playerId || state.investmentLevel < 1) {
        console.log('Какая то фигня снятием мезона');
        break;
      }

      broadcast({ type: 'chat', text: `{p:${player.id}} снимает мезон с {F:${field.index}:р}` });
      state.investmentLevel -= 1; 

      broadcast({ type: 'players', players: players });
      broadcast({ type: 'field-states-update', fieldState: state });

      if (turnState.playerId === playerId && turnState.awaiting === TurnStateAwaiting.RemoveInvest) {
        turnState.currentAction = null;
        turnState.awaiting = TurnStateAwaiting.Nothing;
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, currentPlayer.id);
      }
      break;
    }

    case 'income': {
      const { playerId, field } = message;

      const socket = playerSocketMap.get(playerId);
      if (socket !== clientSocket) return;

      const player = getPlayerById(players, playerId);
      if (!player) return;

      if (! canIncome({ playerId: player.id, fieldIndex: field.index, gameState: fieldState, players: players })) {
        console.log('Какая то фигня с получением');
        break;
      }

      doIncome(player, field.index);
      break;
    }

    case 'go': {
      const { playerId, position } = message;

      const socket = playerSocketMap.get(playerId);
      if (socket !== clientSocket) return;

      const player = getPlayerById(players, playerId);
      if (!player || player.id !== turnState.playerId) return;

      const positions =
        turnState.awaiting === TurnStateAwaiting.GoToCross ? crossList
        : turnState.awaiting === TurnStateAwaiting.GoToPerimeter ? perimeterOrder
        : turnState.awaiting === TurnStateAwaiting.GoBetweenStart ? getPathToCenter(player.position, isNowBackward(turnState))
        : [];

      if (! positions.includes(position)) {
        console.log('Какая то фигня с переходом');
        break;
      }

      movePlayer(player, 0, position);

      if (turnState.playerId === playerId &&
        [TurnStateAwaiting.GoToCross, TurnStateAwaiting.GoToPerimeter, TurnStateAwaiting.GoBetweenStart]
          .includes(turnState.awaiting)) {
        turnState.currentAction = null;
        turnState.awaiting = TurnStateAwaiting.Nothing;
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, currentPlayer.id);
      }
      break;
    }

    case 'chance-decision': {
      const { playerId, make } = message;

      const socket = playerSocketMap.get(playerId);
      if (socket !== clientSocket) return;

      const player = getPlayerById(players, playerId);
      if (!player || player.id !== turnState.playerId) return;

      processChance(playerId, make);
      break;
    }

    case 'payment-decision': {
      const { playerId, pay } = message;

      const socket = playerSocketMap.get(playerId);
      if (socket !== clientSocket) return;

      const player = getPlayerById(players, playerId);
      if (!player) return;

      if (player.refusalToPay === 0 || player.pendingActions.length === 0 || player.sequester > 0) {
        console.log('Какая то фигня с отложенной оплатой');
        break;
      }

      const payment = player.pendingActions[0];

      if (payment.type !== 'payment') {
        console.log('Какая то фигня с отложенной оплатой');
        break;
      }

      const recipient = payment.to ? getPlayerById(players, payment.to) : null;
      const recName = recipient?.name || null;
      const prefix = pay ? 'платит' : 'отказался платить';
      const recipientPart = recName ? ` ${recName}` : '';
      const mes = `${player.name} ${prefix}${recipientPart} ${moneyToString(payment.amount)} ${payment.reason}`;

      if (pay) {
        processPayment(player, recipient, payment.amount, payment.reason);
      } else {
        player.refusalToPay -= 1;
        broadcast({ type: 'chat', text: mes });
      }
      player.pendingActions.shift();
      broadcast({ type: 'players', players: players });

      if (player.refusalToPay === 0) reCalcPendingActions(player);

      if (turnState.playerId === playerId && (turnState.awaiting === TurnStateAwaiting.PositiveBalance ||
        turnState.awaiting === TurnStateAwaiting.PendingPayOrLoose)) {
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, currentPlayer.id);
      }
      break;
    }

    case 'loose': {
      const { playerId, field } = message;

      const socket = playerSocketMap.get(playerId);
      if (socket !== clientSocket) return;

      const player = getPlayerById(players, playerId);
      if (!player) return;

      const state = getFieldStateByIndex(fieldState, field.index);

      if (player.pendingActions.length === 0 ||
        player.pendingActions[0].type !== 'loose' ||
        state.ownerId !== playerId) {
        console.log('Какая то фигня с потерей');
        break;
      }

      const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: field.index, gameState: fieldState});

      broadcast({ type: 'chat', text: `{p:${player.id}} теряет {F:${field.index}:в}` });
      state.ownerId = undefined;
      state.investmentLevel = 0; 
      // снимаем запрет на инвестиции здесь
      player.investIncomeBlock = player.investIncomeBlock?.filter(e => e !== field.index);

      fieldInCompetedMonopoly.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `{p:${player.id}} теряет монополию ${mon.name}` });
      });

      broadcast({ type: 'field-states-update', fieldState: state });

      player.pendingActions.shift();
      if (getPropertyPosOfPlayerId({playerId: player.id, gameState: fieldState}).length === 0) reCalcPendingActions(player);
      broadcast({ type: 'players', players: players });

      if (turnState.playerId === playerId && (turnState.awaiting === TurnStateAwaiting.PendingPayOrLoose)) {
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, currentPlayer.id);
      }
      break;
    }
  }
}

export function registerClient(socket: WebSocket, sessionId?: string) {
  if (!sessionId) {
    console.warn('[WebSocket] Connection without sessionId — rejecting');
    socket.close();
    return;
  }

  const existingSocket = sessionSocketMap.get(sessionId);

  if (existingSocket && existingSocket.readyState === WebSocket.OPEN) {
    console.log(`[WebSocket] Duplicate sessionId: ${sessionId} — rejecting`);
    const message: ServerToClientMessage = { type: 'alreadyRegistered' };
    socket.send(JSON.stringify(message));
    socket.close();
    return;
  }

  // Новое подключение
  sockets.push(socket);
  socketSessionMap.set(socket, sessionId);
  sessionSocketMap.set(sessionId, socket);

  console.log(`[WebSocket] Registered sessionId: ${sessionId}`);

  // 👉 Восстанавливаем всех игроков для этой сессии
  const playerIds = sessionPlayerMap.get(sessionId);
  if (playerIds && playerIds.length > 0) {
    for (const playerId of playerIds) {
      console.log(`[WebSocket] Restored playerSocketMap for playerId: ${playerId}`);
      playerSocketMap.set(playerId, socket);
      const player = getPlayerById(players, playerId);
      player.isOffline = false;
      broadcast({ type: 'chat', text: `{p:${playerId}} вернулся в игру` });
    }
  }

  // Отправляем клиенту информацию о том, что он админ, если применимо
  if (adminSessions.has(sessionId)) {
    socket.send(JSON.stringify({ type: 'set-admin', isAdmin: true }));
  }

  socket.on('message', (data) => {
    handleMessage(socket, data.toString());
  });

  socket.on('close', () => {
    console.log('[WebSocket] Connection closed');

    const index = sockets.findIndex((s) => s === socket);
    if (index !== -1) sockets.splice(index, 1);

    const sid = socketSessionMap.get(socket);
    if (sid) {
      sessionSocketMap.delete(sid);
    }
    socketSessionMap.delete(socket);

    // Удаляем сокет из playerSocketMap
    for (const [pid, s] of playerSocketMap.entries()) {
      if (s === socket) {
        playerSocketMap.delete(pid);
      }
    }

    const playerIds = sessionPlayerMap.get(sessionId);
    if (playerIds && playerIds.length > 0) {
      for (const playerId of playerIds) {
        const player = getPlayerById(players, playerId);
        player.isOffline = true;
        broadcast({ type: 'chat', text: `{p:${playerId}} отключился от игры` });
      }
    }

    broadcast({ type: 'players', players });
  });

  // Отправляем данные
  socket.send(JSON.stringify({ type: 'players', players }));
  if (playerIds && playerIds.length > 0) {
    socket.send(JSON.stringify({
      type: 'local-player-ids',
      localPlayerIds: playerIds,
    }));
  }
  if (gameStarted) {
    socket.send(JSON.stringify({ type: 'field-states-init', fieldsStates: fieldState }));
    socket.send(JSON.stringify({ type: 'game-started' }));
    socket.send(JSON.stringify({
      type: 'turn',
      playerId: currentPlayer.id,
    }));
    if (playerIds?.includes(currentPlayer.id)) {
      const result = chkTurn(turnState);
      turnState = result.turnState;
      handleTurnEffect(result.effect, currentPlayer.id);
    }
  }
}

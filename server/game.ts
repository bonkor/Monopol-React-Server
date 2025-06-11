import { WebSocket } from 'ws';
import type { ClientToServerMessage, ServerToClientMessage, ErrorReason } from '../shared/messages';
import { ErrorReason } from '../shared/messages';
import { type Player, Direction, getPlayerById } from '../shared/types';
import { calculateMovementPath, getCurrentDir, crossList, perimeterOrder, getDirOnCross } from '../shared/movement';
import { type Money, m, InvestmentType, type FieldDefinition, fieldDefinitions, type FieldState,
  getFieldStateByIndex, getFieldByIndex, getPropertyTotalCost, getFieldOwnerId, getNextInvestmentCost,
  getNextInvestmentType, getPropertyPosOfPlayerId, getMinFreePropertyPrice, getMaxPlayerIdPropertyPrice } from '../shared/fields';
import { v4 as uuidv4 } from 'uuid';
import { type TurnEffect, TurnCheckResult, startTurn, chkTurn, isTurnComplete, TurnStateAwaiting,
  addChance, addMove } from './turnManager';
import { handlePayment, processPayment } from './payment';
import { getCurrentIncome, canBuy, canSell, canInvest, canInvestFree, canIncome } from '../shared/game-rules';
import { isFieldInCompetedMonopoly, isFieldInCompetedMonopolyResult } from '../shared/monopolies';

//import {fs} from 'fs';
import * as fs from 'fs';

const sockets: WebSocket[] = [];
export const players: Player[] = [];
export const fieldState: FieldState[] = [];

let gameStarted = false;
let turnIndex = 0;
let currentPlayer = 0;
let turnState;
let diceResult;
let chance1, chance2;

const playerSocketMap = new Map<string, WebSocket>();

function handleTurnEffect(effect: TurnEffect | undefined, playerId: string) {
  if (!effect) return;
  const player = getPlayerById(players, playerId);

console.log(handleTurnEffect, effect, turnState.awaiting);

  switch (effect.type) {
    case 'nothing':
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
    case 'invest-free':
      send(playerId, {type: 'need-invest-free', playerId: playerId});
      break;
    case 'need-positive-balance':
      send(playerId, {type: 'need-sell', playerId: playerId});
      broadcast({ type: 'chat', text: `${player.name} Должен что нибудь продать. Баланс отрицательный` });
      break;
    case 'go-to-cross':
      send(playerId, {type: 'choose-pos', playerId: playerId, positions: crossList});
      break;
    case 'go-to-exchange':
      movePlayer(player, 0, 20);
      turnState.currentAction = null;
      turnState.awaiting = TurnStateAwaiting.Nothing;
      const result = chkTurn(turnState);
      turnState = result.turnState;
      handleTurnEffect(result.effect, player.id);
      break;
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
      broadcast({ type: 'chat', text: `${player.name} не может выкупиться. Секвестр` });
    case 'turn-ended':
      allowEndTurn(playerId);
      break;
  }
}


export function initGameFieldState() {
  for (const field of fieldDefinitions) {
    fieldState.push({index: field.index, investmentLevel: 0});
  }
}

function getNextPlayer() {
  return (currentPlayer +  1) % players.length;
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
      player.balance += m(10);
      broadcast({ type: 'players', players: players });
      broadcast({ type: 'chat', text: `${player.name} получает +10` });
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
    handler: (player: Player) => {
      turnState = addMove(turnState, 5, false);
    },
  },
  '1,4': {
    name: '5 ходов назад',
    negative: true,
    handler: (player: Player) => {
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
    handler: (player: Player) => {
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
      player.balance += m(15);
      broadcast({ type: 'players', players: players });
      broadcast({ type: 'chat', text: `${player.name} получает +15` });
    },
  },
  '2,3': {
    name: 'пожертвуй фирму',
    negative: true,
    handler: (player: Player) => {
      const firmList = getPropertyPosOfPlayerId({playerId: player.id, gameState: fieldState});
      if (firmList.length === 0) {
        broadcast({ type: 'chat', text: `${player.name} нечего жертвовать` });
      } else {
        turnState.awaiting = TurnStateAwaiting.Sacrifice;
        handleTurnEffect({type: 'need-sacrifice'}, player.id);
        return true;
      }
    },
  },
  '2,4': {
    name: 'поменяй фирму',
    negative: false,
    handler: (player: Player) => {
      const minFreePropertyPrice = getMinFreePropertyPrice(fieldState);
      const maxPlayerIdPropertyPrice = getMaxPlayerIdPropertyPrice(fieldState, player.id);

      if (!minFreePropertyPrice || !maxPlayerIdPropertyPrice || minFreePropertyPrice >= maxPlayerIdPropertyPrice) {
        broadcast({ type: 'chat', text: `${player.name} нечего менять` });
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
    handler: (player: Player) => {
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
        broadcast({ type: 'chat', text: `${player.name} не может покупать. Секвестр` });
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
        broadcast({ type: 'chat', text: `${player.name} нечего купить` });
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
      player.balance += m(30);
      broadcast({ type: 'players', players: players });
      broadcast({ type: 'chat', text: `${player.name} получает +30` });
    },
  },
  '3,4': {
    name: 'продай',
    negative: true,
    handler: (player: Player) => {
      const properties = getPropertyPosOfPlayerId({
        playerId: player.id,
        gameState: fieldState,
      });
      if (properties.length === 0) {
        broadcast({ type: 'chat', text: `${player.name} нечего продавать` });
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
        broadcast({ type: 'chat', text: `${player.name} некуда ставить` });
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

    },
  },
  '4,3': {
    name: '-50',
    negative: true,
    handler: (player: Player) => {

    },
  },
  '4,4': {
    name: '+50',
    negative: false,
    handler: (player: Player) => {

    },
  },
  '4,5': {
    name: 'на любую из перефирии',
    negative: true,
    handler: (player: Player) => {

    },
  },
  '4,6': {
    name: 'в тюрьму',
    negative: true,
    handler: (player: Player) => {

    },
  },
  '5,1': {
    name: 'плюс старт',
    negative: false,
    handler: (player: Player) => {

    },
  },
  '5,2': {
    name: 'минус старт',
    negative: true,
    handler: (player: Player) => {

    },
  },
  '5,3': {
    name: 'продай монополию',
    negative: true,
    handler: (player: Player) => {

    },
  },
  '5,4': {
    name: 'всем по 10',
    negative: true,
    handler: (player: Player) => {

    },
  },
  '5,5': {
    name: 'от всех по 10',
    negative: false,
    handler: (player: Player) => {

    },
  },
  '5,6': {
    name: 'все жертвуют',
    negative: false,
    handler: (player: Player) => {

    },
  },
  '6,1': {
    name: 'минус старт',
    negative: true,
    handler: (player: Player) => {

    },
  },
  '6,2': {
    name: 'секвестр',
    negative: true,
    handler: (player: Player) => {

    },
  },
  '6,3': {
    name: 'в такси',
    negative: true,
    handler: (player: Player) => {

    },
  },
  '6,4': {
    name: 'между фишкой и стартом',
    negative: true,
    handler: (player: Player) => {

    },
  },
  '6,5': {
    name: 'всем по 15',
    negative: true,
    handler: (player: Player) => {

    },
  },
  '6,6': {
    name: 'от всех по 15',
    negative: false,
    handler: (player: Player) => {

    },
  },
};

function applyChanceEffect(chance: ChanceHandler, playerId: string, player: Player) {
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
  console.log('processChance', chance1, chance2);
  const player = getPlayerById(players, playerId);
  const handlerKey = `${chance1},${chance2}`;
  const chance = chanceHandlers[handlerKey];

  if (!chance) {
    console.warn(`Нет обработчика шанса для ${handlerKey}`);
    return;
  }

  // Первый вызов — отображение шанса и, при необходимости, выбор игрока
  if (make === null) {
    broadcast({ type: 'chat', text: `${player.name} выбросил "${chance.name}"` });

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
    player.refusalToChance -= 1;
    broadcast({ type: 'chat', text: `${player.name} отказался от "${chance.name}"` });
    broadcast({ type: 'players', players: players });
    finishTurn(playerId);
  }
}


export function makePlayerBankrupt(playerId: number) {
  console.log('makePlayerBankrupt');

  const ownedFields = fieldState.filter(f => f.ownerId === playerId);
  ownedFields.foreach(f => {f.investmentLevel = 0; f.ownerId = undefined});
  const player = getPlayerById(players, playerId);
  player.balance = m(0);
  player.position = undefined;
  player.isBankrupt = true;

  broadcast({ type: 'chat', text: `${player.name} объявляется БАНКРОТОМ. Он покидает игру` });
}

function doIncome(player: Player, fieldIndex: number) {
  const state = getFieldStateByIndex(fieldState, fieldIndex);
  const field = getFieldByIndex(fieldIndex);
  const income = getCurrentIncome({fieldIndex: fieldIndex, gameState: fieldState});
  broadcast({ type: 'chat', text: `${player.name} получает с ${field.name} ${income}` });
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
    const totalProp = getPropertyTotalCost({playerId: player.id, gameState: fieldState});
    const owner = getPlayerById(players, newPosOwnerId);
    const newField = getFieldByIndex(player.position);

    handlePayment(player, owner, income, `за ${newField.name}`);
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
      broadcast({ type: 'chat', text: `${p.name} бесплатно выходит из тюрьмы` });
    });
    intaxi.forEach((p) => {
      p.inTaxi = false;
      p.position = player.position - 3;
      const newFirm = getFieldByIndex(p.position);
      broadcast({ type: 'chat', text: `${p.name} бесплатно переносится на ${newFirm.name}` });
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

  if (posFromChance !== undefined) {
    steps = 0;
    if (player.position !== posFromChance) stay = false;
    player.position = posFromChance;
    if (crossList.includes(player.position)) player.direction = getDirOnCross(player.position);
    path = [player.position];
  }
  if (steps === 0 && player.position === 44) passStart = true;
  if (steps > 0) {
    const moveResult = calculateMovementPath({from: player.position, steps: diceResult, directionOnCross: player.direction});
    player.direction = moveResult.directionOnCross
    player.position = moveResult.path.at(-1)!;
    path = moveResult.path;
    stay = false;
    passStart = moveResult.passedStart;
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
    // тут надо еще проверить что нету флага -st
    player.balance += m(25);
    broadcast({ type: 'chat', text: `${player.name} получает +25 за проход через СТАРТ` });
  }

  processGoToNewField(player);
}

export function allowCenterBut(playerId: string) {
  console.log('allowCenterBut');
  send(playerId, {type: 'allow-center-but', playerId: playerId})
}

export function allowGoStayBut(playerId: string) {
  console.log('allowGoStayBut', turnState);
  const player = players.find(p => (p.id) === playerId);
  console.log(player);
  const dir = getCurrentDir(player.position, player.direction, turnState.currentAction.backward);
  send(player.id, {type: 'allow-go-stay-but', playerId: player.id, dir: dir})
}

export function showChance(res1?: num, res2?: num) {
  console.log('showChance', res1, res2);
  broadcast({type: 'show-chance', res1: res1, res2: res2})
}

let json;
export function allowDice(playerId: string) {

////////////// debug ///////////////////////////
let debugPath = './debug.json';
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
  console.log('json error');
}
////////////////////////////////////////////////

  console.log('allowDice');
  if (dRes) diceResult = dRes;
  else diceResult = Math.floor(Math.random() * 6) + 1;
  //diceResult = 6;
  send(playerId, {type: 'allow-dice', playerId: playerId, value: diceResult})
}

export function allowEndTurn(playerId: string) {
  console.log('allowEndTurn');
  send(playerId, {type: 'allow-end-turn', playerId: playerId})
}

export function processJailOrTaxi(playerId: string) {
  console.log(processJailOrTaxi);
  const player = players.find(p => (p.id) === playerId);
  if (!player) return;
  if (player.balance + getPropertyTotalCost({playerId: player.id, gameState: fieldState}) >= m(10)) {
    // можно выкупиться
    turnState.awaiting = TurnStateAwaiting.FromJailOrTaxi;
    allowGoStayBut(playerId);
  } else {
    // нельзя выкупиться
    broadcast ({ type: 'chat', text: `${player.name} не хватает денег, чтобы выкупится из тюрьмы` })
    turnState.currentAction = null;
    turnState.awaiting = TurnStateAwaiting.Nothing;
    const result = chkTurn(turnState);
    turnState = result.turnState;
    handleTurnEffect(result.effect, playerId);
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
        position: 44,
        direction: null,
        balance: m(75),
        investIncomeBlock: [],
        inBirja: false,
        inJail: false,
        inTaxi: false,
        sequester: 0,
        refusalToPay: 5,
        pendingPayments: [],
        refusalToChance: 0,
      };

      players.push(newPlayer);
      playerSocketMap.set(newPlayer.id, clientSocket);

      clientSocket.send(JSON.stringify({ type: 'player-registered', playerId: playerId, name: name }));
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

      const playerId = players[currentPlayer].id;
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
            broadcast({ type: 'chat', text: `${player.name} решил выйти из ${from1}` });
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
            broadcast({ type: 'chat', text: `${player.name} решил остаться в ${from2}` });
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
        broadcast({ type: 'chat', text: `${player.name} бросил в первый раз ${chance1}` });
        turnState.awaiting = TurnStateAwaiting.Chance2;
        handleTurnEffect({ type: 'need-dice-roll' }, player.id);
      } else if (turnState.currentAction.type === 'chance' && turnState.awaiting === TurnStateAwaiting.Chance2) {
        chance2 = diceResult;
        diceResult = 0;
        broadcast({ type: 'chat', text: `${player.name} бросил во второй раз ${chance2}` });
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
          if (player.sequester === 0) broadcast({ type: 'chat', text: `У ${player.name} закончился секвестр` });
        }
        currentPlayer = getNextPlayer();

        broadcast({ type: 'turn', playerId: players[currentPlayer].id });
        turnState = startTurn(players[currentPlayer].id);
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, players[currentPlayer].id);

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

          broadcast({ type: 'chat', text: `${player.name} жертвует ${getFieldByIndex(sacrificeFirmId).name} и покупает ${field.name} за ${cost}` });
          sacrificeCompanyState.ownerId = undefined;
          sacrificeCompanyState.investmentLevel = 0; 
          broadcast({ type: 'field-states-update', fieldState: sacrificeCompanyState });
        } else {
          console.log('Какая то фигня с жертвой при покупке');
        }
      } else {
        broadcast({ type: 'chat', text: `${player.name} покупает ${field.name} за ${cost}` });
      }
      player.balance -= cost;
      const state = getFieldStateByIndex(fieldState, field.index);
      state.ownerId = playerId;
      // установить запрет на инвестиции здесь
      player.investIncomeBlock.push(field.index);

      sacrificeInCompetedMonopoly?.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `${player.name} теряет монополию ${mon.name}` });
      });
      const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: field.index, gameState: fieldState});
      fieldInCompetedMonopoly.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `${player.name} образовал монополию ${mon.name}` });
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

      broadcast({ type: 'chat', text: `${player.name} меняет ${giveFirm.name} на ${takeField.name}` });
      giveFirmState.ownerId = undefined;
      giveFirmState.investmentLevel = 0; 
      takeFieldState.ownerId = playerId;
      // установить запрет на инвестиции здесь
      player.investIncomeBlock.push(takeField.index);
      broadcast({ type: 'field-states-update', fieldState: giveFirmState });
      broadcast({ type: 'field-states-update', fieldState: takeFieldState });
      broadcast({ type: 'players', players: players });

      giveInCompetedMonopoly?.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `${player.name} теряет монополию ${mon.name}` });
      });
      const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: takeField.index, gameState: fieldState});
      fieldInCompetedMonopoly.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `${player.name} образовал монополию ${mon.name}` });
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

      const cost = field.investments[0].cost;
      broadcast({ type: 'chat', text: `${player.name} породает ${field.name} за ${cost}` });
      player.balance += cost;
      const state = getFieldStateByIndex(fieldState, field.index);
      state.ownerId = undefined;
      state.investmentLevel = 0; 
      // снимаем запрет на инвестиции здесь
      player.investIncomeBlock = player.investIncomeBlock?.filter(e => e !== field.index);

      fieldInCompetedMonopoly.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `${player.name} теряет монополию ${mon.name}` });
      });

      broadcast({ type: 'players', players: players });
      broadcast({ type: 'field-states-update', fieldState: state });

      if (turnState.playerId === playerId &&
        (turnState.awaiting === TurnStateAwaiting.PositiveBalance || turnState.awaiting === TurnStateAwaiting.Sell)) {
        turnState.currentAction = null;
        turnState.awaiting = TurnStateAwaiting.Nothing;
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, players[currentPlayer].id);
      }
      break;
    }

    case 'sacrifice': {
      const { playerId, field } = message;

      const socket = playerSocketMap.get(playerId);
      if (socket !== clientSocket) return;

      const player = getPlayerById(players, playerId);
      if (!player) return;

      const state = getFieldStateByIndex(fieldState, field.index);
      if (state.ownerId !== playerId) {
        console.log('Какая то фигня с жертвой');
        break;
      }

      const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: field.index, gameState: fieldState});

      broadcast({ type: 'chat', text: `${player.name} жертвует ${field.name}` });
      state.ownerId = undefined;
      state.investmentLevel = 0; 
      // снимаем запрет на инвестиции здесь
      player.investIncomeBlock = player.investIncomeBlock?.filter(e => e !== field.index);

      fieldInCompetedMonopoly.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `${player.name} теряет монополию ${mon.name}` });
      });

      broadcast({ type: 'players', players: players });
      broadcast({ type: 'field-states-update', fieldState: state });

      if (turnState.playerId === playerId && turnState.awaiting === TurnStateAwaiting.Sacrifice) {
        turnState.currentAction = null;
        turnState.awaiting = TurnStateAwaiting.Nothing;
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, players[currentPlayer].id);
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
        if (! canInvest({ playerId: player.id, fieldIndex: field.index, gameState: fieldState, players: players, fromChance: true })) {
          console.log('Какая то фигня с бесплатным инвестирванием');
          break;
        }
        state.investmentLevel += 1;
        // установить запрет на инвестиции здесь
        player.investIncomeBlock.push(field.index);
        broadcast({ type: 'chat', text: `${player.name} бесплатно инвестирует в ${field.name}` });
        broadcast({ type: 'field-states-update', fieldState: state });
        turnState.currentAction = null;
        turnState.awaiting = TurnStateAwaiting.Nothing;
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, players[currentPlayer].id);
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

          broadcast({ type: 'chat', text: `${player.name} жертвует ${getFieldByIndex(sacrificeFirmId).name} и инвестирует в ${field.name} за ${cost}` });
          sacrificeCompanyState.ownerId = undefined;
          sacrificeCompanyState.investmentLevel = 0; 
          broadcast({ type: 'field-states-update', fieldState: sacrificeCompanyState });
        } else {
          console.log('Какая то фигня с жертвой при инвестиции');
        }
      } else {
        broadcast({ type: 'chat', text: `${player.name} инвестирует в ${field.name} ${cost}` });
      }

      player.balance -= cost;
      state.investmentLevel += 1;
      // установить запрет на инвестиции здесь
      player.investIncomeBlock.push(field.index);

      sacrificeInCompetedMonopoly?.monopolies.forEach((mon) => {
        broadcast({ type: 'chat', text: `${player.name} теряет монополию ${mon.name}` });
      });

      broadcast({ type: 'players', players: players });
      broadcast({ type: 'field-states-update', fieldState: state });
//      broadcast({ type: 'field-states-init', fieldsStates: fieldState });
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
        : [];

      if (! positions.includes(position)) {
        console.log('Какая то фигня с переходом');
        break;
      }

      movePlayer(player, 0, position);

      if (turnState.playerId === playerId && turnState.awaiting === TurnStateAwaiting.GoToCross) {
        turnState.currentAction = null;
        turnState.awaiting = TurnStateAwaiting.Nothing;
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, players[currentPlayer].id);
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

      if (player.refusalToPay === 0 || player.pendingPayments.length === 0 || player.sequester > 0) {
        console.log('Какая то фигня с отложенной оплатой');
        break;
      }

      const payment = player.pendingPayments[0];
      const recipient = payment.to ? getPlayerById(players, payment.to) : null;
      const recName = recipient?.name || null;
      const prefix = pay ? 'платит' : 'отказался платить';
      const recipientPart = recName ? ` ${recName}` : '';
      const mes = `${player.name} ${prefix}${recipientPart} ${payment.amount} ${payment.reason}`;

      if (pay) {
        processPayment(player, recipient, payment.amount, payment.reason);
      } else {
        player.refusalToPay -= 1;
        broadcast({ type: 'chat', text: mes });
      }
      player.pendingPayments.shift();
      broadcast({ type: 'players', players: players });

      if (turnState.playerId === playerId && (turnState.awaiting === TurnStateAwaiting.PositiveBalance ||
        turnState.awaiting === TurnStateAwaiting.Nothing)) {
        const result = chkTurn(turnState);
        turnState = result.turnState;
        handleTurnEffect(result.effect, players[currentPlayer].id);
      }
      break;
    }
  }
}

export function registerClient(socket: WebSocket) {
  sockets.push(socket);

  socket.on('message', (data) => {
    handleMessage(socket, data.toString());
  });

  socket.on('close', () => {
    console.log('[WebSocket] Close connection');
    const index = sockets.findIndex((c) => c === socket);
    if (index !== -1) {
      sockets.splice(index, 1);
      broadcast({ type: 'players', players: players });
    }
  });

  const message: ServerToClientMessage = {
    type: 'players',
    players,
  };
  socket.send(JSON.stringify(message));

  // отправляем флаг, что игра уже началась (если да) и состояние игры
  if (gameStarted) {
    const stateMessage: ServerToClientMessage = { type: 'field-states-init', fieldsStates: fieldState };
    socket.send(JSON.stringify(stateMessage));
    const startedMessage: ServerToClientMessage = { type: 'game-started' };
    socket.send(JSON.stringify(startedMessage));
  }
}

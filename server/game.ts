import { WebSocket } from 'ws';
import type { ClientToServerMessage, ServerToClientMessage, ErrorReason } from '../shared/messages';
import { ErrorReason } from '../shared/messages';
import { type Player, Direction } from '../shared/types';
import { calculateMovementPath, getCurrentDir } from '../shared/movement';
import { type Money, m, type FieldDefinition, fieldDefinitions, type FieldState, type GameFieldState } from '../shared/fields';
import { v4 as uuidv4 } from 'uuid';
import { startTurn, chkTurn, isTurnComplete } from './turnManager';

const sockets: WebSocket[] = [];
export const players: Player[] = [];
export const fieldState: GameFieldState = [];

let gameStarted = false;
let turnIndex = 0;
let currentPlayer = 0;
let turnState;
let diceResult;

const playerSocketMap = new Map<string, WebSocket>();

export function initGameFieldState() {
  for (const field of fieldDefinitions) {
    fieldState.push({index: field.index});
  }
}

function getNextPlayer() {
  return (currentPlayer +  1) % players.length;
}

function broadcast(message: ServerToClientMessage) {
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

function movePlayer(player: Player, steps: number) {
  let path = [];
  let stay = true;
  let passStart = false;
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
    broadcast({ type: 'players', players: players });
    broadcast({ type: 'chat', text: `${player.name} получает +25 за проход через СТАРТ` });
  }
}

export function allowCenterBut(playerId: string) {
  console.log('allowCenterBut');
  send(playerId, {type: 'allow-center-but', playerId: playerId})
}

export function allowDice(playerId: string) {
  console.log('allowDice');
  diceResult = Math.floor(Math.random() * 6) + 1;
  //diceResult = 6;
  send(playerId, {type: 'allow-dice', playerId: playerId, value: diceResult})
}

export function allowEndTurn(playerId: string) {
  console.log('allowEndTurn');
  send(playerId, {type: 'allow-end-turn', playerId: playerId})
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

      broadcast({ type: 'field-states-init', fieldsState: fieldState });
      broadcast({ type: 'game-started' });
      turnState = startTurn(players[currentPlayer].id);
      turnState = chkTurn(turnState);
      broadcast({ type: 'turn', playerId: players[currentPlayer].id });

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

      if (turnState.currentAction.type === 'move' && turnState.awaitingGoStayBut) {
        if (true) { // тут потом будет проверка, что это не выбор выходить из такси или тюрьмы
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
          turnState.awaitingGoStayBut = false;
          turnState = chkTurn(turnState);
        } else {
        }
      }

      break;
    }

    case 'dir-choose': {
      const socket = playerSocketMap.get(message.playerId);
      if (socket !== clientSocket) return;

      const player = players.find(p => (p.id) === message.playerId);
      if (!player || player.id !== turnState.playerId) return;

      if (turnState.currentAction.type === 'move' && turnState.awaitingCenterBut) {
        player.direction = message.dir;

        // Рассылаем результат выбора
        broadcast({
          type: 'dir-choose',
          playerId: player.id,
          dir: message.dir,
        });
        
        turnState.awaitingCenterBut = false;
        turnState = chkTurn(turnState);
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

      if (turnState.currentAction.type === 'move' && turnState.awaitingDiceRoll) {
        // Рассылаем результат броска
        broadcast({
          type: 'show-dice-result',
          playerId: player.id,
          result: diceResult,
        });
        if (diceResult === 6) {
          const dir = getCurrentDir(player.position, player.direction, turnState.currentAction.backward);
          send(player.id, {type: 'allow-go-stay-but', playerId: player.id, dir: dir})
          turnState.awaitingDiceRoll = false;
          turnState.awaitingGoStayBut = true;
        } else {
          // Переместим игрока
          movePlayer(player, diceResult);
          turnState.currentAction = null;
          turnState.awaitingDiceRoll = false;
          turnState = chkTurn(turnState);
        }
      } else if (turnState.currentAction.type === 'chance') {
      }

      break;
    }

    case 'end-of-turn': {
      const socket = playerSocketMap.get(message.playerId);
      if (socket !== clientSocket) return;

      const player = players.find(p => (p.id) === message.playerId);
      if (!player || player.id !== turnState.playerId) return;

      if (isTurnComplete && turnState.awaitingEndTurn) {
        currentPlayer = getNextPlayer();

        turnState = startTurn(players[currentPlayer].id);
        turnState = chkTurn(turnState);
        broadcast({ type: 'turn', playerId: players[currentPlayer].id });
      } else {
        console.log('Какая то фигня с переходом хода');
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
    const stateMessage: ServerToClientMessage = { type: 'field-states-init', fieldsState: fieldState };
    socket.send(JSON.stringify(stateMessage));
    const startedMessage: ServerToClientMessage = { type: 'game-started' };
    socket.send(JSON.stringify(startedMessage));
  }
}

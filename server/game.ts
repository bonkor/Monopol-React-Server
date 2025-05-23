import { WebSocket } from 'ws';
import type { ClientToServerMessage, ServerToClientMessage, ErrorReason } from '../shared/messages';
import { ErrorReason } from '../shared/messages';
import { type Player, Direction } from '../shared/types';
import { calculateMovementPath } from '../shared/movement';
import { v4 as uuidv4 } from 'uuid';
import { startTurn, chkTurn, isTurnComplete } from './turnManager';

const sockets: WebSocket[] = [];
const players: Player[] = [];

let gameStarted = false;
let turnIndex = 0;
let currentPlayer = 0;
let turnState;
let diceResult;

const playerSocketMap = new Map<string, WebSocket>();

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

export function allowDice(playerId: string) {
  console.log('allowDice');
  diceResult = Math.floor(Math.random() * 6) + 1;
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
        position: 44,
        direction: Direction.Left,
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

    case 'roll-dice': {
      break;
    }

    case 'roll-dice-end': {
      const socket = playerSocketMap.get(message.playerId);
      if (socket !== clientSocket) return;

      const player = players.find(p => (p.id) === message.playerId);
      if (!player || player.id !== turnState.playerId) return;

      if (turnState.currentAction.type === 'move' && turnState.awaitingDiceRoll) {
        // Переместим игрока
        const moveResult = calculateMovementPath({from: player.position, steps: diceResult, directionOnCross: player.direction});
        player.direction = moveResult.directionOnCross
        player.position = moveResult.path.at(-1)!;

        // Рассылаем результат броска и новое положение игрока
        broadcast({
          type: 'show-dice-result',
          playerId: player.id,
          result: diceResult,
        });
        broadcast({
          type: 'move',
          playerId: player.id,
          path: moveResult.path,
        });
        
        turnState.currentAction = null;
        turnState.awaitingDiceRoll = false;
        turnState = chkTurn(turnState);
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

  // отправляем флаг, что игра уже началась (если да)
  if (gameStarted) {
    const startedMessage: ServerToClientMessage = { type: 'game-started' };
    socket.send(JSON.stringify(startedMessage));
  }
}

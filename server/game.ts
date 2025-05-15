import { WebSocket } from 'ws';
import type { ClientToServerMessage, ServerToClientMessage, ErrorReason } from '../shared/messages';
import { ErrorReason } from '../shared/messages';
import type { Player } from '../shared/types';
import { calculateMovementPath } from '../shared/movement';
import { v4 as uuidv4 } from 'uuid';

const sockets: WebSocket[] = [];
const players: Player[] = [];

let gameStarted = false;
let turnIndex = 0;

const playerSocketMap = new Map<string, WebSocket>();

function broadcast(message: ServerToClientMessage) {
  const data = JSON.stringify(message);
  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
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
        position: 44,
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

      break;
    }

    case 'chat': {
      const player = players.find(p => playerSocketMap.get(p.id) === clientSocket);
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
      const player = players.find(p => playerSocketMap.get(p.id) === clientSocket);
      if (!player) return;

      const result = Math.floor(Math.random() * 6) + 1;

      // Переместим игрока
      const path = calculateMovementPath(player.position, result);
      player.position = path.at(-1)!;

      // Обновим
      //players.set(playerId, player);

      // Рассылаем результат броска и новое положение игрока
      broadcast({
        type: 'dice-result',
        playerId: player.id,
        result: result,
      });
      broadcast({
        type: 'move',
        playerId: player.id,
        position: player.position,
      });

      break;
    }

    case 'roll': {
      const player = players.find((p) => playerSocketMap.get(p.id) === socket);
      if (!player) return;

      const steps = Math.floor(Math.random() * 6) + 1;
      player.position = (player.position + steps) % 57;

      broadcast({ type: 'move', playerId: player.id, position: player.position });

      // Переход хода
      turnIndex = (turnIndex + 1) % players.length;
      const nextPlayer = players[turnIndex];
      if (nextPlayer) {
        broadcast({ type: 'turn', playerId: nextPlayer.id });
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

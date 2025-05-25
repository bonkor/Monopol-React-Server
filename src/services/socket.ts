import type { ServerToClientMessage, ClientToServerMessage } from '@shared/messages';
import { ErrorReason } from '@shared/messages';
import { useGameStore } from '../store/useGameStore';
import { useChatStore } from '../store/useChatStore';
import { Direction } from '@shared/types';

export const socket = new WebSocket('ws://localhost:3000');

socket.onopen = () => {
  console.log('[WebSocket] connected');
};

function addChatMessage(str: string, from?: string): string {
  useChatStore.getState().addMessage({
    from: from,
    text: str,
  });
}

socket.onmessage = async (event) => {
  const message: ServerToClientMessage = JSON.parse(event.data);
  const { setPlayers, animatePlayerMovement, movePlayer, setCurrentPlayer, confirmLocalPlayer, removePendingName,
    setGameStarted, setError, players, localPlayerIds, setAllowDice, setGoStayDir, setAllowGoStayBut,
    setAllowCenterBut, setAllowEndTurn, setMyTurn } = useGameStore.getState();

  console.log(message);

  switch (message.type) {
    case 'players':
      setPlayers(message.players);
      break;

    case 'player-registered':
      setError(null);
      confirmLocalPlayer(message.playerId, message.name);
      break;

    case 'game-started': {
      setGameStarted(true);
      addChatMessage(`Игра началась`);
      break;
    }

    case 'allow-go-stay-but': {
      const { playerId, dir } = message;

      setGoStayDir(dir);
      setAllowGoStayBut(true);
      break;
    }

    case 'allow-center-but': {
      setAllowCenterBut(true);
      break;
    }

    case 'dir-choose': {
      const { playerId, dir } = message;
      const player = players.find((p) => p.id === playerId);
      
      let d = '';
      switch (dir) {
        case Direction.Left:
          d = 'налево';
          break;
        case Direction.Right:
          d = 'направо';
          break;
        case Direction.Up:
          d = 'наверх';
          break;
        case Direction.Down:
          d = 'вниз';
          break;
      }

      if (player) {
        addChatMessage(`${player.name} идет ${d}`);
      }
      break;
    }

    case 'allow-dice': {
      const { value } = message;
      useGameStore.getState().setDiceResult(value);
      setAllowDice(true);
      break;
    }

    case 'allow-end-turn': {
      setAllowEndTurn(true);
      break;
    }

    case 'chat': {
      addChatMessage(message.text, message.from);
      break;
    }

    case 'show-dice-result': {
      const { playerId, result } = message;
      useGameStore.getState().setDiceResult(result);

      const player = players.find((p) => p.id === playerId);
      if (player) {
        addChatMessage(`${player.name} бросил кубик и выбросил ${result}`);
      }
      break;
    }

    case 'move': {
      const player = players.find((p) => p.id === message.playerId);
      if (player) {
        addChatMessage(`${player.name} переместился на поле #${message.path.at(-1)!}`);
        //addChatMessage(`${player.name} переместился на поле #${message.position}`);
      }
      await animatePlayerMovement(message.playerId, message.path);
      //movePlayer(message.playerId, message.position);
      break;
    }

    case 'turn':
      const player = players.find((p) => p.id === message.playerId);
      setCurrentPlayer(message.playerId);
      addChatMessage(`ходит ${player.name}`);
      const lPlayer = localPlayerIds.find((p) => p === message.playerId);
      if (lPlayer) {
        setMyTurn(true);
      } else {
        setMyTurn(false);
      }
      break;

    case 'error':
      setError(message.message);

      if (message.reason === ErrorReason.NameTaken && message.name) {
        removePendingName(message.name);
      }

      break;
  }
};

export function sendMessage(msg: ClientToServerMessage) {
  socket.send(JSON.stringify(msg));
}

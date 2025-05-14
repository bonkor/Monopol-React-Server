import type { ServerToClientMessage, ClientToServerMessage } from '@shared/messages';
import { ErrorReason } from '@shared/messages';
import { useGameStore } from '../store/useGameStore';
import { useChatStore } from '../store/useChatStore';

export const socket = new WebSocket('ws://localhost:3000');

socket.onopen = () => {
  console.log('[WebSocket] connected');
};

socket.onmessage = (event) => {
  const message: ServerToClientMessage = JSON.parse(event.data);
  const { setPlayers, movePlayer, setCurrentPlayer, confirmLocalPlayer, removePendingName,
    setGameStarted, setError } = useGameStore.getState();

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
      break;
    }

    case 'chat': {
      useChatStore.getState().addMessage({
        from: message.from,
        text: message.text,
      });
      break;
    }

    case 'move':
      movePlayer(message.playerId, message.position);
      break;

    case 'turn':
      setCurrentPlayer(message.playerId);
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

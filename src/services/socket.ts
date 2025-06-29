// services/socket.ts
import type { ServerToClientMessage, ClientToServerMessage } from '@shared/messages';

type MessageCallback = (message: ServerToClientMessage) => void;

let socket: WebSocket | null = null;
const sessionId: string = localStorage.getItem('sessionId') || crypto.randomUUID();
const subscribers = new Set<MessageCallback>();

if (!localStorage.getItem('sessionId')) {
  localStorage.setItem('sessionId', sessionId);
}

type SocketEvents = {
  onOpen?: () => void;
  onClose?: () => void;
};

export function connectSocket({ onOpen, onClose }: SocketEvents = {}) {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

  //const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const hostname = location.hostname;
  //socket = new WebSocket(`${protocol}://${host}/ws?sessionId=${sessionId}`);
  socket = new WebSocket(`ws://${hostname}:3000/?sessionId=${sessionId}`);
  //socket = new WebSocket(`ws://localhost:3000/?sessionId=${sessionId}`);

  socket.addEventListener('open', () => {
    console.log('[WebSocket] connected');
    onOpen?.();
  });

  socket.addEventListener('message', (event) => {
    const message: ServerToClientMessage = JSON.parse(event.data);
    for (const callback of subscribers) {
      callback(message);
    }
  });

  socket.addEventListener('close', () => {
    console.warn('[WebSocket] disconnected');
    socket = null;
    onClose?.();
  });
}

export function sendMessage(message: ClientToServerMessage) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.warn('[WebSocket] not connected. Message not sent:', message);
  }
}

// Подписка на сообщения
export function onSocketMessage(callback: MessageCallback) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback); // отписка
  };
}

export function getSocket() {
  return socket;
}

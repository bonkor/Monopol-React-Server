import { WebSocketServer } from 'ws';
import { initGameFieldState, registerClient } from './game';

initGameFieldState();

const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws) => {
  console.log('[WebSocket] New connection');
  registerClient(ws);
});

console.log('✅ WebSocket server running on ws://localhost:3000');

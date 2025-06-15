import { WebSocketServer } from 'ws';
import { parse } from 'url';
import { initGameFieldState, registerClient } from './game';

initGameFieldState();

const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws, req) => {
  const url = parse(req.url || '', true);
  const sessionId = url.query.sessionId as string | undefined;

  console.log('[WebSocket] New connection with sessionId:', sessionId);
  registerClient(ws, sessionId);
});

console.log('✅ WebSocket server running on ws://localhost:3000');

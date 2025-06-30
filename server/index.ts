import fs from 'fs';
import https from 'https';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { parse, fileURLToPath } from 'url';
import { initGameFieldState, registerClient } from './game';

dotenv.config();

// Инициализация состояния
initGameFieldState();

// __filename и __dirname для ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загрузка сертификатов (те же, что в Vite)
const server = https.createServer({
  key: fs.readFileSync(path.resolve(__dirname, '../certs/key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, '../certs/cert.pem')),
});

// Инициализация WSS поверх HTTPS
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const url = parse(req.url || '', true);
  const sessionId = url.query.sessionId as string | undefined;

  console.log('[WebSocket] New connection with sessionId:', sessionId);
  registerClient(ws, sessionId);
});

// Старт HTTPS-сервера
server.listen(3000, '0.0.0.0', () => {
  console.log('✅ WebSocket server running on wss://0.0.0.0:3000');
});

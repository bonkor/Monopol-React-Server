import fs from 'fs';
import https from 'https';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { parse, fileURLToPath } from 'url';
import { initGameFieldState, registerClient } from './game';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Получаем путь из env или используем дефолт для локальной работы
const certsDir = process.env.CERTS_PATH || path.resolve(__dirname, './certs');

// Проверяем наличие файлов
const keyPath = path.resolve(certsDir, 'key.pem');
const certPath = path.resolve(certsDir, 'cert.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  throw new Error(`SSL certificates not found in ${certsDir}`);
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

const server = https.createServer(httpsOptions);

// Инициализация состояния
initGameFieldState();

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

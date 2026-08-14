import type http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { addClient, removeClient } from './connection-manager.js';
import { logger } from '../utils/logger.js';

/**
 * WebSocket server attached to the HTTP server.
 *
 * Path: /ws
 *
 * TODO: Phase 4 —
 * - Authenticate via JWT (query param or first message)
 * - Subscribe clients to channels
 * - Heartbeat / ping-pong
 * - Reconnect guidance for frontend
 */
let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: http.Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket, _req) => {
    const clientId = randomUUID();
    // TODO: Phase 4 — extract JWT from req.url query (?token=) and resolve user
    addClient(clientId, socket);

    socket.send(
      JSON.stringify({
        type: 'SYSTEM_STATUS',
        channel: 'system-events',
        payload: { status: 'connected', clientId },
        timestamp: new Date().toISOString(),
      }),
    );

    socket.on('close', () => {
      removeClient(clientId);
    });

    socket.on('error', (error) => {
      logger.warn('WS client error', { clientId, error: error.message });
      removeClient(clientId);
    });
  });

  logger.info('WebSocket server initialized', { path: '/ws' });
  return wss;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}

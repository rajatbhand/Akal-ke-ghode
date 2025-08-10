import type { NextApiRequest, NextApiResponse } from 'next';
import { Server as IOServer } from 'socket.io';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const anyRes = res as any;
  if (!anyRes.socket?.server) {
    res.status(500).end('No server');
    return;
  }
  if (!anyRes.socket.server.io) {
    const io = new IOServer(anyRes.socket.server, {
      path: '/api/socketio',
    });
    anyRes.socket.server.io = io;
    (globalThis as any).io = io;
  }
  res.end('ok');
}



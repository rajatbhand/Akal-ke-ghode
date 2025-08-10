import type { Server as IOServer } from 'socket.io';
import Pusher from 'pusher';

export type BusEvent =
  | { type: 'state:update' }
  | { type: 'reveal' }
  | { type: 'scores:update' }
  | { type: 'audience:update' };

export function emitBus(event: BusEvent) {
  const io: IOServer | undefined = (globalThis as any).io;
  try {
    io?.emit(event.type, event);
  } catch {}

  // Also broadcast via Pusher if configured (for production)
  try {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.PUSHER_CLUSTER;
    if (appId && key && secret && cluster) {
      const globalAny = globalThis as any;
      if (!globalAny.__pusher) {
        globalAny.__pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });
      }
      globalAny.__pusher.trigger('show', event.type, event);
    }
  } catch {}
}



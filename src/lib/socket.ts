import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

let socket: Socket | null = null;

export function connectSocket(token: string) {
  if (socket?.connected) {
    return socket;
  }

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}

// Event listeners
export function onIdleComplete(callback: (data: any) => void) {
  socket?.on('idle_complete', callback);
}

export function onDungeonComplete(callback: (data: any) => void) {
  socket?.on('dungeon_complete', callback);
}

export function onLevelUp(callback: (data: any) => void) {
  socket?.on('level_up', callback);
}

export function offIdleComplete(callback: (data: any) => void) {
  socket?.off('idle_complete', callback);
}

export function offDungeonComplete(callback: (data: any) => void) {
  socket?.off('dungeon_complete', callback);
}

export function offLevelUp(callback: (data: any) => void) {
  socket?.off('level_up', callback);
}

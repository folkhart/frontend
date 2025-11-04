import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

let socket: Socket | null = null;

// React hook to use socket in components
export function useSocket() {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(socket);

  useEffect(() => {
    setSocketInstance(socket);
    
    const interval = setInterval(() => {
      if (socket && socket !== socketInstance) {
        setSocketInstance(socket);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [socketInstance]);

  return socketInstance;
}

export function connectSocket(token: string) {
  if (socket?.connected) {
    // Also make sure it's on window
    (window as any).socket = socket;
    return socket;
  }

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
    timeout: 5000, // 5 second connection timeout
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.warn('⚠️ Socket connection error (non-blocking):', error.message);
    // Don't throw - allow app to continue without socket
  });

  socket.on('connect_timeout', () => {
    console.warn('⚠️ Socket connection timeout (non-blocking)');
    // Don't throw - allow app to continue without socket
  });

  // Expose socket on window for easy access in components
  (window as any).socket = socket;

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

// Friend & Message events
export function onNewMessage(callback: (data: any) => void) {
  socket?.on('new_message', callback);
}

export function offNewMessage(callback: (data: any) => void) {
  socket?.off('new_message', callback);
}

export function onNewFriendRequest(callback: (data: any) => void) {
  socket?.on('new_friend_request', callback);
}

export function offNewFriendRequest(callback: (data: any) => void) {
  socket?.off('new_friend_request', callback);
}

export function onFriendRequestAccepted(callback: (data: any) => void) {
  socket?.on('friend_request_accepted', callback);
}

export function offFriendRequestAccepted(callback: (data: any) => void) {
  socket?.off('friend_request_accepted', callback);
}

export function emitSendMessage(receiverId: string, message: any) {
  socket?.emit('send_message', { receiverId, message });
}

export function emitFriendRequestSent(receiverId: string, request: any) {
  socket?.emit('friend_request_sent', { receiverId, request });
}

export function emitFriendRequestAccepted(senderId: string, accepter: any) {
  socket?.emit('friend_request_accepted', { senderId, accepter });
}

import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If VITE_API_URL is set (e.g. from .env or build time env var), use it
  if (envUrl && envUrl.startsWith('http')) {
     return envUrl.replace('/api', '').replace(/\/$/, '');
  }
  
  const hostname = window.location.hostname;

  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://ayarfarmlink-api.onrender.com';
  }

  // Fallback for local development
  return 'http://localhost:3000';
};



let socket: Socket | null = null;
export const initSocket = (token?: string) => {
  if (socket) return socket;
  
  const SOCKET_URL = getSocketUrl();
  console.log("Connecting to socket at:", SOCKET_URL);

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'], // Try websocket first
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    withCredentials: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

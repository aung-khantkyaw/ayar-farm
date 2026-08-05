const envUrl = process.env.NEXT_PUBLIC_API_URL;
let apiUrl = envUrl;

if (typeof window !== 'undefined') {
  if (!apiUrl || !apiUrl.startsWith('http')) {
    const hostname = window.location.hostname;
    apiUrl = hostname !== 'localhost' && hostname !== '127.0.0.1'
      ? 'https://ayarfarmlink-api.onrender.com/api'
      : 'http://localhost:4000/api';
  }
} else {
  apiUrl ||= 'http://localhost:4000/api';
}


export const API_URL = apiUrl;
export const SOCKET_URL = apiUrl.replace(/\/api$/, '');

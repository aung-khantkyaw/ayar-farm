export const getApiConfig = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  let apiUrl = envUrl;

  // If VITE_API_URL is missing or invalid, determine based on hostname
  if (!apiUrl || !apiUrl.startsWith('http')) {
    const hostname = window.location.hostname;
    // Production fallbacks
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      apiUrl = 'https://ayarfarmlink-api.onrender.com/api';
    } else {
      // Local development fallback
      apiUrl = 'http://localhost:3000/api';
    }
  }

  // Ensure no trailing slash
  apiUrl = apiUrl.replace(/\/$/, '');

  // Derive socket URL (remove /api suffix)
  const socketUrl = apiUrl.replace('/api', '');

  return {
    API_URL: apiUrl,
    SOCKET_URL: socketUrl,
  };
};

export const { API_URL, SOCKET_URL } = getApiConfig();

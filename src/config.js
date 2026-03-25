const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Evitar duplicados si el usuario ya puso /api en la variable de entorno
export const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
export const BASE_URL = API_BASE_URL;

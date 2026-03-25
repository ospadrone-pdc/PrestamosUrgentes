import { API_URL } from '../config';
const API_BASE_URL = API_URL;

export const clientService = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/clients`);
    return res.json();
  },
  create: async (clientData) => {
    const res = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData)
    });
    return res.json();
  }
};

export const loanService = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/loans`);
    return res.json();
  }
};

export const dashboardService = {
  getStats: async () => {
    const res = await fetch(`${API_URL}/stats`);
    return res.json();
  }
};

import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Ajoute automatiquement le token de connexion (Super Admin ou Village Admin)
// à chaque requête, s'il existe dans le stockage local du navigateur.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('akyeToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si le token est invalide/expiré, on déconnecte proprement l'utilisateur.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('akyeToken');
      localStorage.removeItem('akyeUser');
      window.location.href = '/connexion';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

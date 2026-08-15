import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Endpoints where a 401 is the answer to the request, not a dead session.
// Redirecting on these reloads the page mid-submit and throws away the error
// the form was about to show — which is why a wrong password looked like a
// silent refresh instead of "invalid credentials".
const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/select-workspace',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// Handle 401 errors (token expired/invalid)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? '';
    const isAuthAttempt = AUTH_ENDPOINTS.some((path) => url.includes(path));

    if (error.response?.status === 401 && !isAuthAttempt) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('workspace');
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

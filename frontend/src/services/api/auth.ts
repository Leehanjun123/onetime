import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized requests
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token is invalid, clear auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response;
  },

  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    phone?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response;
  },

  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
  },

  // Token refresh not implemented in backend yet
  // refreshToken: async (token: string) => {
  //   return api.post('/auth/refresh', { token });
  // },

  getCurrentUser: async () => {
    return api.get('/auth/profile');
  },

  updateProfile: async (data: any) => {
    return api.put('/auth/profile', data);
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  forgotPassword: async (email: string) => {
    return api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string) => {
    return api.post('/auth/reset-password', { token, newPassword });
  },

  verifyEmail: async (token: string) => {
    return api.post('/auth/verify-email', { token });
  },

  resendVerification: async () => {
    return api.post('/auth/resend-verification');
  },
};

export default api;
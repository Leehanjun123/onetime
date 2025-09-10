import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';
import { AuthTokens, ApiResponse } from '../types';

class ApiService {
  private api: AxiosInstance;
  private refreshingToken: Promise<string | null> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            await this.logout();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string | null> {
    if (this.refreshingToken) {
      return this.refreshingToken;
    }

    this.refreshingToken = this.performTokenRefresh();
    const token = await this.refreshingToken;
    this.refreshingToken = null;
    return token;
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<ApiResponse<AuthTokens>>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken }
      );

      if (response.data.success && response.data.data) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.ACCESS_TOKEN,
          response.data.data.accessToken
        );
        await AsyncStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          response.data.data.refreshToken
        );
        return response.data.data.accessToken;
      }

      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  private async logout() {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
    // Navigate to login screen (implement navigation service)
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.post<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.put<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.patch<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  // File upload
  async uploadFile(url: string, file: any, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'photo.jpg',
    } as any);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    };

    return this.post(url, formData, config);
  }
}

export default new ApiService();
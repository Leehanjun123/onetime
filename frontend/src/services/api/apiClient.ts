import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://onetime-production.up.railway.app';
    
    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        // Add timestamp
        config.headers['X-Request-Time'] = new Date().toISOString();

        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response time
        const requestTime = response.config.headers['X-Request-Time'];
        if (requestTime) {
          const responseTime = Date.now() - new Date(requestTime).getTime();
          console.debug(`API Response Time: ${responseTime}ms`);
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              this.setToken(newToken);
              originalRequest.headers!.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        // Handle 429 Too Many Requests
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
          
          if (retryAfter && originalRequest) {
            await this.delay(parseInt(retryAfter) * 1000);
            return this.client(originalRequest);
          }
        }

        // Handle network errors
        if (!error.response) {
          this.handleNetworkError(error);
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  private removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  private async refreshToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefreshToken();
    
    try {
      const token = await this.refreshPromise;
      this.refreshPromise = null;
      return token;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  private async doRefreshToken(): Promise<string | null> {
    try {
      const currentToken = this.getToken();
      if (!currentToken) return null;

      const response = await this.client.post('/api/v1/auth/refresh', {
        token: currentToken
      });

      return response.data.data.token;
    } catch (error) {
      this.removeToken();
      throw error;
    }
  }

  private handleAuthError() {
    this.removeToken();
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login?error=session_expired';
    }
  }

  private handleNetworkError(error: AxiosError) {
    console.error('Network error:', error.message);
    
    // Show offline notification
    if (typeof window !== 'undefined' && !navigator.onLine) {
      this.showNotification('You are offline. Please check your internet connection.');
    }
  }

  private formatError(error: AxiosError): ApiError {
    if (error.response) {
      return {
        message: (error.response.data as any)?.error || 
                 (error.response.data as any)?.message || 
                 'An error occurred',
        code: (error.response.data as any)?.code,
        status: error.response.status,
        details: (error.response.data as any)?.details
      };
    }

    if (error.request) {
      return {
        message: 'No response from server',
        code: 'NETWORK_ERROR',
        status: 0
      };
    }

    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    };
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private showNotification(message: string) {
    // Implement notification system
    console.warn(message);
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  // File upload
  async uploadFile(url: string, file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    return this.post(url, formData, config);
  }

  // Batch requests
  async batch<T>(requests: Array<() => Promise<any>>): Promise<T[]> {
    try {
      const results = await Promise.all(requests.map(req => req()));
      return results;
    } catch (error) {
      console.error('Batch request failed:', error);
      throw error;
    }
  }

  // Cancel request
  getCancelToken() {
    return axios.CancelToken.source();
  }
}

// Singleton instance
const apiClient = new ApiClient();

export default apiClient;
export type { ApiError };
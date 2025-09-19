import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://onetime-production.up.railway.app';

export interface DeviceToken {
  token: string;
  platform: 'web' | 'ios' | 'android';
}

export interface NotificationData {
  type: string;
  data: Record<string, any>;
}

export interface NotificationResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * 알림 API 서비스 클래스
 */
class NotificationService {
  private token: string | null = null;

  /**
   * 인증 토큰 설정
   */
  setAuthToken(token: string): void {
    this.token = token;
  }

  /**
   * API 헤더 생성
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * 디바이스 토큰 등록
   */
  async registerDeviceToken(tokenData: DeviceToken): Promise<NotificationResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/notifications/device-token`,
        tokenData,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to register device token:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * 디바이스 토큰 해제
   */
  async unregisterDeviceToken(token: string): Promise<NotificationResponse> {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/notifications/device-token`,
        {
          data: { token },
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to unregister device token:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * 사용자의 디바이스 토큰 목록 조회
   */
  async getUserDeviceTokens(): Promise<NotificationResponse> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/notifications/device-tokens`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to get user device tokens:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * 테스트 알림 전송
   */
  async sendTestNotification(notificationData: NotificationData): Promise<NotificationResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/notifications/test`,
        notificationData,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to send test notification:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * 토픽 구독
   */
  async subscribeToTopic(topic: string): Promise<NotificationResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/notifications/topics/subscribe`,
        { topic },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to subscribe to topic:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * 토픽 구독 해제
   */
  async unsubscribeFromTopic(topic: string): Promise<NotificationResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/notifications/topics/unsubscribe`,
        { topic },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to unsubscribe from topic:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

// 싱글톤 인스턴스 생성 및 export
export const notificationService = new NotificationService();
export default NotificationService;
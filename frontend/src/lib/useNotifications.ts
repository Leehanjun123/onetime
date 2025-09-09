import { useEffect, useState, useCallback } from 'react';
import { 
  getFCMToken, 
  setupMessageListener, 
  requestNotificationPermission, 
  showBrowserNotification,
  registerServiceWorker
} from './firebase';
import { notificationService } from '../services/notification.service';

export interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface NotificationHookReturn {
  state: NotificationState;
  requestPermission: () => Promise<boolean>;
  sendTestNotification: (type: string, data: any) => Promise<void>;
  subscribeToTopic: (topic: string) => Promise<boolean>;
  unsubscribeFromTopic: (topic: string) => Promise<boolean>;
}

/**
 * 푸시 알림 관리 훅
 */
export function useNotifications(authToken?: string): NotificationHookReturn {
  const [state, setState] = useState<NotificationState>({
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
    permission: typeof window !== 'undefined' ? Notification.permission : null,
    token: null,
    isLoading: false,
    error: null
  });

  // 인증 토큰 설정
  useEffect(() => {
    if (authToken) {
      notificationService.setAuthToken(authToken);
    }
  }, [authToken]);

  // 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    async function initializeNotifications() {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Service Worker 등록
        await registerServiceWorker();

        // 권한이 이미 허용된 경우 토큰 가져오기
        if (Notification.permission === 'granted') {
          const token = await getFCMToken();
          if (token) {
            setState(prev => ({ ...prev, token }));

            // 서버에 토큰 등록
            if (authToken) {
              await notificationService.registerDeviceToken({
                token,
                platform: 'web'
              });
            }
          }
        }

        setState(prev => ({ 
          ...prev, 
          permission: Notification.permission,
          isLoading: false 
        }));
      } catch (error: any) {
        console.error('Failed to initialize notifications:', error);
        setState(prev => ({ 
          ...prev, 
          error: error.message,
          isLoading: false 
        }));
      }
    }

    initializeNotifications();
  }, [authToken]);

  // 포그라운드 메시지 리스너 설정
  useEffect(() => {
    if (!state.token) return;

    setupMessageListener((payload) => {
      console.log('Foreground message received:', payload);

      // 브라우저 알림 표시
      showBrowserNotification(
        payload.notification?.title || '새 알림',
        {
          body: payload.notification?.body || '',
          icon: payload.notification?.image || '/icon-192x192.png',
          data: payload.data
        }
      );
    });
  }, [state.token]);

  /**
   * 알림 권한 요청
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const granted = await requestNotificationPermission();

      if (granted) {
        const token = await getFCMToken();
        if (token) {
          setState(prev => ({ 
            ...prev, 
            token, 
            permission: 'granted',
            isLoading: false 
          }));

          // 서버에 토큰 등록
          if (authToken) {
            const result = await notificationService.registerDeviceToken({
              token,
              platform: 'web'
            });

            if (!result.success) {
              console.error('Failed to register token with server:', result.error);
            }
          }

          return true;
        }
      }

      setState(prev => ({ 
        ...prev, 
        permission: Notification.permission,
        isLoading: false 
      }));

      return granted;
    } catch (error: any) {
      console.error('Failed to request notification permission:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message,
        isLoading: false 
      }));
      return false;
    }
  }, [authToken]);

  /**
   * 테스트 알림 전송
   */
  const sendTestNotification = useCallback(async (type: string, data: any): Promise<void> => {
    try {
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const result = await notificationService.sendTestNotification({
        type,
        data
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send test notification');
      }

      console.log('Test notification sent successfully');
    } catch (error: any) {
      console.error('Failed to send test notification:', error);
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [authToken]);

  /**
   * 토픽 구독
   */
  const subscribeToTopic = useCallback(async (topic: string): Promise<boolean> => {
    try {
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const result = await notificationService.subscribeToTopic(topic);

      if (!result.success) {
        throw new Error(result.error || 'Failed to subscribe to topic');
      }

      console.log(`Successfully subscribed to topic: ${topic}`);
      return true;
    } catch (error: any) {
      console.error(`Failed to subscribe to topic ${topic}:`, error);
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [authToken]);

  /**
   * 토픽 구독 해제
   */
  const unsubscribeFromTopic = useCallback(async (topic: string): Promise<boolean> => {
    try {
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const result = await notificationService.unsubscribeFromTopic(topic);

      if (!result.success) {
        throw new Error(result.error || 'Failed to unsubscribe from topic');
      }

      console.log(`Successfully unsubscribed from topic: ${topic}`);
      return true;
    } catch (error: any) {
      console.error(`Failed to unsubscribe from topic ${topic}:`, error);
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [authToken]);

  return {
    state,
    requestPermission,
    sendTestNotification,
    subscribeToTopic,
    unsubscribeFromTopic
  };
}

/**
 * 알림 설정을 위한 간단한 훅
 */
export function useSimpleNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setIsEnabled(
      typeof window !== 'undefined' && 
      'Notification' in window && 
      Notification.permission === 'granted'
    );
  }, []);

  const enable = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setIsEnabled(granted);
    return granted;
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (isEnabled) {
      showBrowserNotification(title, options);
    }
  }, [isEnabled]);

  return {
    isEnabled,
    enable,
    showNotification
  };
}
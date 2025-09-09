import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(userId?: string): Socket {
    if (!this.socket || !this.socket.connected) {
      this.socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
        transports: ['websocket', 'polling']
      });

      this.setupEventListeners();

      if (userId) {
        this.socket.emit('join_user_room', userId);
      }
    }

    return this.socket;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket 연결 성공:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket 연결 해제:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket 연결 오류:', error);
    });

    // 매칭 관련 이벤트 리스너들
    this.socket.on('matching_found', (data) => {
      console.log('매칭 발견:', data);
      // 매칭 발견 알림 표시
      this.showNotification('매칭 발견!', data.message, 'success');
    });

    this.socket.on('match_request', (data) => {
      console.log('매칭 요청 받음:', data);
      // 매칭 요청 알림 표시
      this.showNotification('새로운 매칭 요청', data.message, 'info');
    });

    this.socket.on('match_accepted', (data) => {
      console.log('매칭 수락됨:', data);
      // 매칭 수락 알림 표시
      this.showNotification('매칭 성공!', data.message, 'success');
    });

    this.socket.on('match_rejected', (data) => {
      console.log('매칭 거절됨:', data);
      // 매칭 거절 알림 표시
      this.showNotification('매칭 거절됨', data.message, 'warning');
    });

    this.socket.on('matching_queue_joined', (data) => {
      console.log('매칭 큐 참가:', data);
      this.showNotification('매칭 요청 접수', data.message, 'info');
    });

    this.socket.on('matching_queue_left', (data) => {
      console.log('매칭 큐 나감:', data);
      this.showNotification('매칭 요청 취소', data.message, 'info');
    });
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 매칭 관련 메소드들
  public joinMatchingQueue(userId: string, preferences: any): void {
    if (this.socket) {
      this.socket.emit('join_matching_queue', { userId, preferences });
    }
  }

  public leaveMatchingQueue(userId: string): void {
    if (this.socket) {
      this.socket.emit('leave_matching_queue', { userId });
    }
  }

  public respondToMatch(matchId: string, response: 'accept' | 'reject', message?: string): void {
    if (this.socket) {
      this.socket.emit('match_response', { matchId, response, message });
    }
  }

  public markNotificationAsRead(notificationId: string, userId: string): void {
    if (this.socket) {
      this.socket.emit('notification_read', { notificationId, userId });
    }
  }

  // 알림 표시 메소드 (실제로는 toast 라이브러리나 notification 컴포넌트 사용)
  private showNotification(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    // 브라우저 알림 API 사용
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        tag: 'matching-notification'
      });
    }

    // 커스텀 이벤트 발생시켜서 UI에서 처리하도록 할 수도 있음
    window.dispatchEvent(new CustomEvent('socket-notification', {
      detail: { title, message, type }
    }));
  }

  // 알림 권한 요청
  public static async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }
}

export default SocketService;
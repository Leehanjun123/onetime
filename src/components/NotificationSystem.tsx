'use client';

import { useState, useEffect } from 'react';
import SocketService from '../lib/socket';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  isRead: boolean;
  actionRequired?: boolean;
  matchId?: string;
}

interface NotificationSystemProps {
  userId?: string;
  maxNotifications?: number;
}

export default function NotificationSystem({ userId, maxNotifications = 5 }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [socketService] = useState(() => SocketService.getInstance());

  useEffect(() => {
    // Socket 연결 및 알림 이벤트 리스너 설정
    const socket = socketService.connect(userId);

    // 커스텀 이벤트 리스너 (Socket 서비스에서 발생시키는 이벤트)
    const handleSocketNotification = (event: CustomEvent) => {
      const { title, message, type } = event.detail;
      addNotification(title, message, type);
    };

    // 매칭 관련 알림 이벤트들
    const handleMatchingFound = (data: any) => {
      addNotification(
        '매칭 발견!',
        `${data.matches?.length || 0}개의 매칭된 일자리를 찾았습니다!`,
        'success',
        true
      );
    };

    const handleMatchRequest = (data: any) => {
      addNotification(
        '새로운 매칭 요청',
        data.message || '새로운 구직자가 관심을 표현했습니다!',
        'info',
        true,
        data.matchId
      );
    };

    const handleMatchAccepted = (data: any) => {
      addNotification(
        '매칭 성사!',
        data.message || '매칭이 성사되었습니다!',
        'success'
      );
    };

    const handleMatchRejected = (data: any) => {
      addNotification(
        '매칭 거절됨',
        data.message || '아쉽게도 이번 매칭은 성사되지 않았습니다.',
        'warning'
      );
    };

    const handleMatchConfirmed = (data: any) => {
      addNotification(
        '매칭 확정',
        data.message || '매칭이 확정되었습니다.',
        'success'
      );
    };

    // 이벤트 리스너 등록
    window.addEventListener('socket-notification', handleSocketNotification as EventListener);
    socket.on('matching_found', handleMatchingFound);
    socket.on('match_request', handleMatchRequest);
    socket.on('match_accepted', handleMatchAccepted);
    socket.on('match_rejected', handleMatchRejected);
    socket.on('match_confirmed', handleMatchConfirmed);

    // 정리 함수
    return () => {
      window.removeEventListener('socket-notification', handleSocketNotification as EventListener);
      socket.off('matching_found', handleMatchingFound);
      socket.off('match_request', handleMatchRequest);
      socket.off('match_accepted', handleMatchAccepted);
      socket.off('match_rejected', handleMatchRejected);
      socket.off('match_confirmed', handleMatchConfirmed);
    };
  }, [userId, socketService]);

  const addNotification = (
    title: string, 
    message: string, 
    type: Notification['type'], 
    actionRequired: boolean = false,
    matchId?: string
  ) => {
    const newNotification: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date(),
      isRead: false,
      actionRequired,
      matchId
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    // 자동으로 알림창 열기 (중요한 알림의 경우)
    if (actionRequired) {
      setIsOpen(true);
    }

    // 일정 시간 후 자동 제거 (액션이 필요하지 않은 알림만)
    if (!actionRequired) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));

    // Socket을 통해 서버에 읽음 처리 알림
    if (userId) {
      socketService.markNotificationAsRead(id, userId);
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      case 'error': return 'border-red-200 bg-red-50 text-red-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const handleMatchResponse = async (matchId: string, response: 'accept' | 'reject') => {
    try {
      const responseData = await fetch(`http://localhost:4000/api/v1/matching/${matchId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          response,
          message: response === 'accept' ? '매칭을 수락합니다.' : '조건이 맞지 않아 거절합니다.'
        })
      });

      const result = await responseData.json();
      
      if (result.success) {
        // 해당 알림 제거
        setNotifications(prev => prev.filter(n => n.matchId !== matchId));
        
        // 응답 결과 알림
        addNotification(
          response === 'accept' ? '매칭 수락' : '매칭 거절',
          result.message,
          response === 'accept' ? 'success' : 'info'
        );
      } else {
        addNotification('오류', result.message || '응답 처리 중 오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('매칭 응답 오류:', error);
      addNotification('오류', '매칭 응답 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  return (
    <>
      {/* 알림 버튼 */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <span className="sr-only">알림 보기</span>
          <div className="w-6 h-6">🔔</div>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>

        {/* 알림 드롭다운 */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">알림</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    모두 지우기
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">알림이 없습니다.</p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${getNotificationColor(notification.type)} ${
                        !notification.isRead ? 'ring-2 ring-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                            <h4 className="text-sm font-medium">{notification.title}</h4>
                          </div>
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>

                          {/* 매칭 요청 액션 버튼들 */}
                          {notification.actionRequired && notification.matchId && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleMatchResponse(notification.matchId!, 'accept')}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                수락
                              </button>
                              <button
                                onClick={() => handleMatchResponse(notification.matchId!, 'reject')}
                                className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                              >
                                거절
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              읽음
                            </button>
                          )}
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 오버레이 (드롭다운 외부 클릭시 닫기) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Toast 알림 (화면 우상단에 일시적으로 표시) */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications
          .filter(n => !n.isRead && !n.actionRequired)
          .slice(0, 3)
          .map((notification) => (
            <div
              key={`toast-${notification.id}`}
              className={`p-4 rounded-lg shadow-lg border max-w-sm ${getNotificationColor(notification.type)} animate-slide-in-right`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <div>
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <p className="text-sm">{notification.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
      </div>
    </>
  );
}
'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  category: '일자리' | '메시지' | '급여' | '안전' | '교육' | '긴급' | '커뮤니티' | '시스템';
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isPinned: boolean;
  actionUrl?: string;
  actionLabel?: string;
  sender?: string;
  metadata?: {
    amount?: number;
    location?: string;
    date?: string;
    jobId?: string;
  };
}

interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  categories: {
    [key: string]: {
      enabled: boolean;
      push: boolean;
      email: boolean;
      sms: boolean;
    };
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      category: '긴급',
      type: 'error',
      title: '🚨 긴급 안전 경보',
      message: '강남구 건설현장에서 안전사고 발생. 해당 지역 근무자는 주의하세요.',
      timestamp: '2024-01-30 14:30',
      isRead: false,
      isPinned: true,
      actionUrl: '/safety',
      actionLabel: '안전 정보 확인'
    },
    {
      id: '2',
      category: '일자리',
      type: 'success',
      title: '새로운 일자리 매칭',
      message: '선호 조건과 95% 일치하는 건설현장 일자리가 있습니다.',
      timestamp: '2024-01-30 13:00',
      isRead: false,
      isPinned: false,
      actionUrl: '/jobs/123',
      actionLabel: '일자리 보기',
      metadata: {
        location: '서울 강남구',
        date: '2024-01-31'
      }
    },
    {
      id: '3',
      category: '급여',
      type: 'success',
      title: '💰 급여 입금 완료',
      message: '1월 25일 근무 급여 350,000원이 입금되었습니다.',
      timestamp: '2024-01-30 09:00',
      isRead: false,
      isPinned: false,
      actionUrl: '/payments',
      actionLabel: '상세 내역',
      metadata: {
        amount: 350000
      }
    },
    {
      id: '4',
      category: '메시지',
      type: 'info',
      title: '새 메시지',
      message: '대한건설 담당자님이 메시지를 보냈습니다.',
      timestamp: '2024-01-30 08:30',
      isRead: true,
      isPinned: false,
      actionUrl: '/messages',
      actionLabel: '메시지 읽기',
      sender: '대한건설 김과장'
    },
    {
      id: '5',
      category: '교육',
      type: 'warning',
      title: '교육 마감 임박',
      message: '안전교육 신청 마감이 2일 남았습니다.',
      timestamp: '2024-01-29 18:00',
      isRead: true,
      isPinned: false,
      actionUrl: '/education',
      actionLabel: '교육 신청'
    },
    {
      id: '6',
      category: '커뮤니티',
      type: 'info',
      title: '인기 게시글',
      message: '회원님의 게시글에 10개의 좋아요가 달렸습니다.',
      timestamp: '2024-01-29 15:30',
      isRead: true,
      isPinned: false,
      actionUrl: '/community',
      actionLabel: '게시글 보기'
    },
    {
      id: '7',
      category: '안전',
      type: 'warning',
      title: '안전 체크리스트 미완료',
      message: '오늘의 안전 체크리스트를 완료해주세요.',
      timestamp: '2024-01-29 07:00',
      isRead: true,
      isPinned: false,
      actionUrl: '/safety',
      actionLabel: '체크리스트 작성'
    },
    {
      id: '8',
      category: '시스템',
      type: 'info',
      title: '시스템 업데이트',
      message: '새로운 기능이 추가되었습니다. 업데이트 내용을 확인하세요.',
      timestamp: '2024-01-28 20:00',
      isRead: true,
      isPinned: false
    }
  ]);

  const [settings, setSettings] = useState<NotificationSettings>({
    push: true,
    email: true,
    sms: false,
    categories: {
      '일자리': { enabled: true, push: true, email: true, sms: false },
      '메시지': { enabled: true, push: true, email: false, sms: false },
      '급여': { enabled: true, push: true, email: true, sms: true },
      '안전': { enabled: true, push: true, email: true, sms: true },
      '교육': { enabled: true, push: false, email: true, sms: false },
      '긴급': { enabled: true, push: true, email: true, sms: true },
      '커뮤니티': { enabled: false, push: false, email: false, sms: false },
      '시스템': { enabled: true, push: false, email: true, sms: false }
    },
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '07:00'
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const pinnedNotifications = notifications.filter(n => n.isPinned);
  const regularNotifications = notifications.filter(n => !n.isPinned);

  const filteredNotifications = selectedCategory === '전체' 
    ? notifications 
    : notifications.filter(n => n.category === selectedCategory);

  const displayNotifications = activeTab === 'unread' 
    ? filteredNotifications.filter(n => !n.isRead)
    : filteredNotifications;

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case '일자리': return '💼';
      case '메시지': return '💬';
      case '급여': return '💰';
      case '안전': return '🛡️';
      case '교육': return '📚';
      case '긴급': return '🚨';
      case '커뮤니티': return '👥';
      case '시스템': return '⚙️';
      default: return '📢';
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const togglePin = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isPinned: !n.isPinned } : n
    ));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const deleteSelected = () => {
    setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
    setSelectedNotifications([]);
    setShowDeleteModal(false);
  };

  const toggleNotificationSelection = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  const toggleCategorySettings = (category: string, field: keyof typeof settings.categories['일자리']) => {
    setSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          [field]: !prev.categories[category][field]
        }
      }
    }));
  };

  useEffect(() => {
    // Simulate real-time notifications
    const interval = setInterval(() => {
      const random = Math.random();
      if (random > 0.95) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          category: '일자리',
          type: 'info',
          title: '새로운 일자리 알림',
          message: '인근 지역에 새로운 일자리가 등록되었습니다.',
          timestamp: new Date().toLocaleString('ko-KR'),
          isRead: false,
          isPinned: false
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">알림 센터</h1>
          <p className="text-gray-600">모든 알림을 한 곳에서 관리하세요</p>
        </div>

        {/* Notification Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-gray-900">{notifications.length}</div>
            <div className="text-sm text-gray-500">전체 알림</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
            <div className="text-sm text-gray-500">읽지 않음</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">{pinnedNotifications.length}</div>
            <div className="text-sm text-gray-500">고정됨</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(settings.categories).filter(c => c.enabled).length}
            </div>
            <div className="text-sm text-gray-500">활성 카테고리</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'all', label: '전체 알림', count: notifications.length },
                { id: 'unread', label: '읽지 않음', count: unreadCount },
                { id: 'settings', label: '알림 설정', count: null }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab !== 'settings' ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Actions Bar */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                {['전체', '일자리', '메시지', '급여', '안전', '교육', '긴급'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedCategory === category
                        ? 'bg-orange-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {category !== '전체' && getCategoryIcon(category)} {category}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {selectedNotifications.length > 0 ? (
                  <>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      삭제 ({selectedNotifications.length})
                    </button>
                    <button
                      onClick={() => setSelectedNotifications([])}
                      className="text-gray-600 hover:text-gray-700 text-sm"
                    >
                      선택 취소
                    </button>
                  </>
                ) : (
                  <button
                    onClick={markAllAsRead}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    모두 읽음 표시
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
              {/* Pinned Notifications */}
              {pinnedNotifications.length > 0 && displayNotifications.some(n => n.isPinned) && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">📌 고정된 알림</h3>
                  {displayNotifications.filter(n => n.isPinned).map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      isSelected={selectedNotifications.includes(notification.id)}
                      onToggleSelection={() => toggleNotificationSelection(notification.id)}
                      onMarkAsRead={() => markAsRead(notification.id)}
                      onTogglePin={() => togglePin(notification.id)}
                      onDelete={() => deleteNotification(notification.id)}
                      getTypeColor={getTypeColor}
                      getCategoryIcon={getCategoryIcon}
                    />
                  ))}
                </div>
              )}

              {/* Regular Notifications */}
              {displayNotifications.filter(n => !n.isPinned).length > 0 ? (
                displayNotifications.filter(n => !n.isPinned).map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    isSelected={selectedNotifications.includes(notification.id)}
                    onToggleSelection={() => toggleNotificationSelection(notification.id)}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onTogglePin={() => togglePin(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                    getTypeColor={getTypeColor}
                    getCategoryIcon={getCategoryIcon}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  알림이 없습니다
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Settings Tab */
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">알림 설정</h2>

            {/* Global Settings */}
            <div className="mb-8">
              <h3 className="font-medium mb-4">전체 설정</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span>푸시 알림</span>
                  <input
                    type="checkbox"
                    checked={settings.push}
                    onChange={(e) => setSettings(prev => ({ ...prev, push: e.target.checked }))}
                    className="w-5 h-5 text-orange-600"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span>이메일 알림</span>
                  <input
                    type="checkbox"
                    checked={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.checked }))}
                    className="w-5 h-5 text-orange-600"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span>SMS 알림</span>
                  <input
                    type="checkbox"
                    checked={settings.sms}
                    onChange={(e) => setSettings(prev => ({ ...prev, sms: e.target.checked }))}
                    className="w-5 h-5 text-orange-600"
                  />
                </label>
              </div>
            </div>

            {/* Category Settings */}
            <div className="mb-8">
              <h3 className="font-medium mb-4">카테고리별 설정</h3>
              <div className="space-y-4">
                {Object.entries(settings.categories).map(([category, config]) => (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getCategoryIcon(category)}</span>
                        <span className="font-medium">{category}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={() => toggleCategorySettings(category, 'enabled')}
                        className="w-5 h-5 text-orange-600"
                      />
                    </div>
                    {config.enabled && (
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={config.push}
                            onChange={() => toggleCategorySettings(category, 'push')}
                            className="w-4 h-4"
                          />
                          푸시
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={config.email}
                            onChange={() => toggleCategorySettings(category, 'email')}
                            className="w-4 h-4"
                          />
                          이메일
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={config.sms}
                            onChange={() => toggleCategorySettings(category, 'sms')}
                            className="w-4 h-4"
                          />
                          SMS
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="mb-8">
              <h3 className="font-medium mb-4">방해 금지 시간</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span>방해 금지 모드 사용</span>
                  <input
                    type="checkbox"
                    checked={settings.quietHours.enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, enabled: e.target.checked }
                    }))}
                    className="w-5 h-5 text-orange-600"
                  />
                </label>
                {settings.quietHours.enabled && (
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm text-gray-500">시작 시간</label>
                      <input
                        type="time"
                        value={settings.quietHours.start}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, start: e.target.value }
                        }))}
                        className="block w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">종료 시간</label>
                      <input
                        type="time"
                        value={settings.quietHours.end}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, end: e.target.value }
                        }))}
                        className="block w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button className="w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700">
              설정 저장
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4">알림 삭제</h3>
              <p className="text-gray-600 mb-6">
                선택한 {selectedNotifications.length}개의 알림을 삭제하시겠습니까?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Notification Item Component
function NotificationItem({ 
  notification, 
  isSelected, 
  onToggleSelection, 
  onMarkAsRead, 
  onTogglePin, 
  onDelete,
  getTypeColor,
  getCategoryIcon 
}: any) {
  return (
    <div className={`border rounded-lg p-4 transition-all ${
      notification.isRead ? 'bg-gray-50' : 'bg-white border-l-4 ' + getTypeColor(notification.type)
    }`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getCategoryIcon(notification.category)}</span>
              <div>
                <h3 className="font-semibold">{notification.title}</h3>
                {notification.sender && (
                  <p className="text-xs text-gray-500">from: {notification.sender}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePin}
                className={`text-gray-400 hover:text-gray-600 ${
                  notification.isPinned ? 'text-orange-600' : ''
                }`}
              >
                📌
              </button>
              <button
                onClick={onDelete}
                className="text-gray-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>

          <p className="text-gray-600 mb-2">{notification.message}</p>

          {notification.metadata && (
            <div className="flex gap-4 text-sm text-gray-500 mb-2">
              {notification.metadata.amount && (
                <span>💰 {notification.metadata.amount.toLocaleString()}원</span>
              )}
              {notification.metadata.location && (
                <span>📍 {notification.metadata.location}</span>
              )}
              {notification.metadata.date && (
                <span>📅 {notification.metadata.date}</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{notification.timestamp}</span>
            <div className="flex gap-2">
              {!notification.isRead && (
                <button
                  onClick={onMarkAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  읽음 표시
                </button>
              )}
              {notification.actionUrl && (
                <Link
                  href={notification.actionUrl}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  {notification.actionLabel || '자세히 보기'} →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
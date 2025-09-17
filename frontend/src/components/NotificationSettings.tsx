'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '../lib/useNotifications';

interface NotificationSettingsProps {
  authToken?: string;
  className?: string;
}

interface TopicSubscription {
  topic: string;
  label: string;
  description: string;
  subscribed: boolean;
}

const AVAILABLE_TOPICS: TopicSubscription[] = [
  {
    topic: 'job_alerts',
    label: '일자리 알림',
    description: '새로운 일자리 정보를 받아보세요',
    subscribed: false
  },
  {
    topic: 'urgent_jobs',
    label: '급구 알림',
    description: '급하게 구인하는 일자리를 우선 받아보세요',
    subscribed: false
  },
  {
    topic: 'location_seoul',
    label: '서울 지역 알림',
    description: '서울 지역의 일자리만 받아보세요',
    subscribed: false
  },
  {
    topic: 'system_notices',
    label: '시스템 공지',
    description: '중요한 시스템 공지사항을 받아보세요',
    subscribed: false
  }
];

export default function NotificationSettings({ authToken, className = '' }: NotificationSettingsProps) {
  const { state, requestPermission, sendTestNotification, subscribeToTopic, unsubscribeFromTopic } = useNotifications(authToken);
  const [topics, setTopics] = useState<TopicSubscription[]>(AVAILABLE_TOPICS);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 메시지 자동 숨김
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 권한 요청 핸들러
  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        setMessage({ type: 'success', text: '알림 권한이 허용되었습니다!' });
      } else {
        setMessage({ type: 'error', text: '알림 권한이 거부되었습니다.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // 테스트 알림 전송
  const handleTestNotification = async () => {
    setIsLoading(true);
    try {
      await sendTestNotification('SYSTEM', {
        message: '테스트 알림입니다.',
        timestamp: new Date().toISOString()
      });
      setMessage({ type: 'success', text: '테스트 알림을 전송했습니다!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // 토픽 구독/구독해제 토글
  const handleTopicToggle = async (topicIndex: number) => {
    const topic = topics[topicIndex];
    setIsLoading(true);

    try {
      let success: boolean;
      if (topic.subscribed) {
        success = await unsubscribeFromTopic(topic.topic);
      } else {
        success = await subscribeToTopic(topic.topic);
      }

      if (success) {
        setTopics(prev => prev.map((t, index) => 
          index === topicIndex ? { ...t, subscribed: !t.subscribed } : t
        ));
        setMessage({ 
          type: 'success', 
          text: topic.subscribed ? '구독을 해제했습니다.' : '구독했습니다.' 
        });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // 권한 상태에 따른 버튼 텍스트
  const getPermissionButtonText = () => {
    if (isLoading) return '처리중...';
    if (state.permission === 'granted') return '알림 권한 허용됨';
    if (state.permission === 'denied') return '알림 권한 거부됨 (브라우저 설정에서 변경)';
    return '알림 권한 요청';
  };

  if (!state.isSupported) {
    return (
      <div className={`bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded ${className}`}>
        <p>이 브라우저는 푸시 알림을 지원하지 않습니다.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">알림 설정</h2>

      {/* 오류/성공 메시지 */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* 상태 정보 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">권한 상태:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              state.permission === 'granted' 
                ? 'bg-green-100 text-green-800' 
                : state.permission === 'denied'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {state.permission === 'granted' ? '허용됨' : 
               state.permission === 'denied' ? '거부됨' : '대기중'}
            </span>
          </div>
          <div>
            <span className="font-semibold">토큰 상태:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              state.token ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {state.token ? '등록됨' : '미등록'}
            </span>
          </div>
        </div>
      </div>

      {/* 권한 요청 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">알림 권한</h3>
        <button
          onClick={handleRequestPermission}
          disabled={isLoading || state.permission === 'granted'}
          className={`px-4 py-2 rounded font-medium ${
            state.permission === 'granted'
              ? 'bg-green-100 text-green-800 cursor-not-allowed'
              : state.permission === 'denied'
              ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
          }`}
        >
          {getPermissionButtonText()}
        </button>
      </div>

      {/* 테스트 알림 */}
      {state.permission === 'granted' && authToken && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">테스트 알림</h3>
          <button
            onClick={handleTestNotification}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? '전송중...' : '테스트 알림 보내기'}
          </button>
        </div>
      )}

      {/* 토픽 구독 설정 */}
      {state.permission === 'granted' && authToken && (
        <div>
          <h3 className="text-lg font-semibold mb-3">알림 주제 설정</h3>
          <div className="space-y-3">
            {topics.map((topic, index) => (
              <div key={topic.topic} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{topic.label}</h4>
                  <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                </div>
                <button
                  onClick={() => handleTopicToggle(index)}
                  disabled={isLoading}
                  className={`ml-4 px-3 py-1 rounded text-sm font-medium ${
                    topic.subscribed
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50`}
                >
                  {topic.subscribed ? '구독중' : '구독'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 인증이 필요한 경우 */}
      {!authToken && (
        <div className="mt-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p>알림 기능을 사용하려면 로그인이 필요합니다.</p>
        </div>
      )}
    </div>
  );
}
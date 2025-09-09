'use client'

import { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'worker' | 'employer';
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'location' | 'system';
  isRead: boolean;
}

interface Chat {
  id: string;
  title: string;
  participants: {
    id: string;
    name: string;
    role: 'worker' | 'employer';
    avatar?: string;
    isOnline: boolean;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  jobTitle?: string;
  workDate?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

const SAMPLE_CHATS: Chat[] = [
  {
    id: '1',
    title: '아파트 리모델링 마감재 시공',
    participants: [
      { id: 'emp1', name: '김현수 팀장', role: 'employer', isOnline: true },
      { id: 'worker1', name: '이철수', role: 'worker', isOnline: true }
    ],
    unreadCount: 2,
    jobTitle: '아파트 리모델링 마감재 시공',
    workDate: '2024-12-31',
    status: 'active',
    createdAt: '2024-12-30T09:00:00Z',
    lastMessage: {
      id: 'msg1',
      chatId: '1',
      senderId: 'emp1',
      senderName: '김현수 팀장',
      senderRole: 'employer',
      content: '내일 오전 8시까지 현장 도착 가능하신가요?',
      timestamp: '2024-12-30T15:30:00Z',
      type: 'text',
      isRead: false
    }
  },
  {
    id: '2',
    title: '상가 인테리어 철거 작업',
    participants: [
      { id: 'emp2', name: '박미영 실장', role: 'employer', isOnline: false },
      { id: 'worker1', name: '이철수', role: 'worker', isOnline: true }
    ],
    unreadCount: 0,
    jobTitle: '상가 인테리어 철거 작업',
    workDate: '2024-12-29',
    status: 'completed',
    createdAt: '2024-12-28T10:00:00Z',
    lastMessage: {
      id: 'msg2',
      chatId: '2',
      senderId: 'worker1',
      senderName: '이철수',
      senderRole: 'worker',
      content: '작업 완료했습니다. 수고하셨어요!',
      timestamp: '2024-12-29T17:00:00Z',
      type: 'text',
      isRead: true
    }
  },
  {
    id: '3',
    title: '펜션 외벽 도색 작업',
    participants: [
      { id: 'emp3', name: '정대호 대리', role: 'employer', isOnline: true },
      { id: 'worker1', name: '이철수', role: 'worker', isOnline: true }
    ],
    unreadCount: 5,
    jobTitle: '펜션 외벽 도색 작업',
    workDate: '2025-01-02',
    status: 'active',
    createdAt: '2024-12-30T11:00:00Z',
    lastMessage: {
      id: 'msg3',
      chatId: '3',
      senderId: 'emp3',
      senderName: '정대호 대리',
      senderRole: 'employer',
      content: '날씨 때문에 하루 연기될 것 같습니다.',
      timestamp: '2024-12-30T14:45:00Z',
      type: 'text',
      isRead: false
    }
  }
];

const SAMPLE_MESSAGES: { [chatId: string]: Message[] } = {
  '1': [
    {
      id: 'msg1-1',
      chatId: '1',
      senderId: 'system',
      senderName: 'System',
      senderRole: 'worker',
      content: '채팅이 시작되었습니다. 원활한 소통을 위해 예의를 지켜주세요.',
      timestamp: '2024-12-30T09:00:00Z',
      type: 'system',
      isRead: true
    },
    {
      id: 'msg1-2',
      chatId: '1',
      senderId: 'emp1',
      senderName: '김현수 팀장',
      senderRole: 'employer',
      content: '안녕하세요! 내일 작업 관련해서 몇 가지 확인하고 싶은 것이 있어서 연락드립니다.',
      timestamp: '2024-12-30T14:20:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: 'msg1-3',
      chatId: '1',
      senderId: 'worker1',
      senderName: '이철수',
      senderRole: 'worker',
      content: '네, 안녕하세요! 말씀하세요.',
      timestamp: '2024-12-30T14:22:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: 'msg1-4',
      chatId: '1',
      senderId: 'emp1',
      senderName: '김현수 팀장',
      senderRole: 'employer',
      content: '타일 시공 도구는 개인 지참이신가요? 아니면 저희가 준비해드릴까요?',
      timestamp: '2024-12-30T14:25:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: 'msg1-5',
      chatId: '1',
      senderId: 'worker1',
      senderName: '이철수',
      senderRole: 'worker',
      content: '기본 도구는 제가 가져가겠습니다. 특수 장비가 필요하시면 미리 말씀해주세요.',
      timestamp: '2024-12-30T14:28:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: 'msg1-6',
      chatId: '1',
      senderId: 'emp1',
      senderName: '김현수 팀장',
      senderRole: 'employer',
      content: '내일 오전 8시까지 현장 도착 가능하신가요?',
      timestamp: '2024-12-30T15:30:00Z',
      type: 'text',
      isRead: false
    },
    {
      id: 'msg1-7',
      chatId: '1',
      senderId: 'emp1',
      senderName: '김현수 팀장',
      senderRole: 'employer',
      content: '주소는 서울 강남구 테헤란로 123 아파트 201호입니다.',
      timestamp: '2024-12-30T15:32:00Z',
      type: 'text',
      isRead: false
    }
  ]
};

export default function MessagesPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [chats, setChats] = useState<Chat[]>(SAMPLE_CHATS);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedChat) {
      setMessages(SAMPLE_MESSAGES[selectedChat.id] || []);
      // 선택된 채팅의 읽지 않은 메시지를 읽음 처리
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, unreadCount: 0 }
          : chat
      ));
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      chatId: selectedChat.id,
      senderId: user?.id || 'worker1',
      senderName: (user?.firstName || '') + (user?.lastName || '') || '이철수',
      senderRole: 'worker',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // 타이핑 시뮬레이션
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      // 자동 응답 시뮬레이션 (실제로는 실시간 소켓 통신)
      const autoReply: Message = {
        id: `reply-${Date.now()}`,
        chatId: selectedChat.id,
        senderId: selectedChat.participants.find(p => p.role === 'employer')?.id || 'emp1',
        senderName: selectedChat.participants.find(p => p.role === 'employer')?.name || '김현수 팀장',
        senderRole: 'employer',
        content: '네, 확인했습니다! 감사합니다.',
        timestamp: new Date().toISOString(),
        type: 'text',
        isRead: false
      };
      
      setMessages(prev => [...prev, autoReply]);
    }, 2000);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '방금';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChatStatus = (status: string) => {
    switch (status) {
      case 'active': return { text: '진행중', color: 'bg-green-100 text-green-700' };
      case 'completed': return { text: '완료', color: 'bg-gray-100 text-gray-700' };
      case 'cancelled': return { text: '취소', color: 'bg-red-100 text-red-700' };
      default: return { text: '알 수 없음', color: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="flex h-full">
            {/* 채팅 목록 */}
            <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedChat ? 'hidden md:flex' : ''}`}>
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">메시지</h2>
                <div className="mt-2 text-sm text-gray-600">
                  총 {chats.filter(c => c.unreadCount > 0).length}개의 읽지 않은 채팅
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-orange-50 border-orange-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0"></div>
                        <h3 className="font-medium text-gray-900 text-sm truncate">{chat.jobTitle}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${getChatStatus(chat.status).color}`}>
                          {getChatStatus(chat.status).text}
                        </span>
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">
                        👤 {chat.participants.find(p => p.role === 'employer')?.name}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${
                        chat.participants.find(p => p.role === 'employer')?.isOnline 
                          ? 'bg-green-400' : 'bg-gray-300'
                      }`}></span>
                      {chat.workDate && (
                        <span className="text-xs text-gray-500">📅 {chat.workDate}</span>
                      )}
                    </div>
                    
                    {chat.lastMessage && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {chat.lastMessage.content}
                        </p>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {formatTime(chat.lastMessage.timestamp)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 채팅 내용 */}
            {selectedChat ? (
              <div className={`flex-1 flex flex-col ${selectedChat ? '' : 'hidden md:flex'}`}>
                {/* 채팅 헤더 */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedChat(null)}
                        className="md:hidden text-gray-500 hover:text-gray-700"
                      >
                        ←
                      </button>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedChat.jobTitle}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>👤 {selectedChat.participants.find(p => p.role === 'employer')?.name}</span>
                          <span className={`w-2 h-2 rounded-full ${
                            selectedChat.participants.find(p => p.role === 'employer')?.isOnline 
                              ? 'bg-green-400' : 'bg-gray-300'
                          }`}></span>
                          <span className="text-xs">
                            {selectedChat.participants.find(p => p.role === 'employer')?.isOnline ? '온라인' : '오프라인'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${getChatStatus(selectedChat.status).color}`}>
                        {getChatStatus(selectedChat.status).text}
                      </span>
                      <button className="text-gray-500 hover:text-gray-700">
                        📞
                      </button>
                      <button className="text-gray-500 hover:text-gray-700">
                        ⚙️
                      </button>
                    </div>
                  </div>
                </div>

                {/* 메시지 목록 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.type === 'system' ? (
                        <div className="text-center">
                          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                            {message.content}
                          </span>
                        </div>
                      ) : (
                        <div className={`flex ${message.senderId === (user?.id || 'worker1') ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md ${message.senderId === (user?.id || 'worker1') ? 'order-2' : 'order-1'}`}>
                            {message.senderId !== (user?.id || 'worker1') && (
                              <div className="text-xs text-gray-500 mb-1">{message.senderName}</div>
                            )}
                            <div className={`px-4 py-2 rounded-lg ${
                              message.senderId === (user?.id || 'worker1')
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <div className={`text-xs text-gray-400 mt-1 ${
                              message.senderId === (user?.id || 'worker1') ? 'text-right' : 'text-left'
                            }`}>
                              {formatMessageTime(message.timestamp)}
                              {message.senderId === (user?.id || 'worker1') && (
                                <span className="ml-1">{message.isRead ? '읽음' : '전송됨'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 메시지 입력 */}
                {selectedChat.status === 'active' && (
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <button className="text-gray-500 hover:text-gray-700">
                        📎
                      </button>
                      <button className="text-gray-500 hover:text-gray-700">
                        📷
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="메시지를 입력하세요..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ➤
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">채팅을 선택하세요</h3>
                  <p className="text-gray-600">왼쪽에서 채팅을 선택하여 대화를 시작하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
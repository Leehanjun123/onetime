'use client'

import { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

interface ChatWindowProps {
  chatRoomId: string;
  otherUserId: string;
  otherUserName: string;
  jobTitle?: string;
  onClose: () => void;
}

export default function ChatWindow({ chatRoomId, otherUserId, otherUserName, jobTitle, onClose }: ChatWindowProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    // Socket.IO 연결
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // 연결 이벤트
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('채팅 소켓 연결됨');
      
      // 채팅방 참가
      newSocket.emit('join_chat_room', { 
        chatRoomId, 
        userId: user.id 
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('채팅 소켓 연결 끊김');
    });

    // 메시지 수신
    newSocket.on('chat_message', (messageData: ChatMessage) => {
      console.log('채팅 메시지 수신:', messageData);
      setMessages(prev => [...prev, messageData]);
    });

    // 타이핑 상태 수신
    newSocket.on('user_typing', (data: { userId: string, isTyping: boolean }) => {
      if (data.userId !== user.id) {
        setOtherUserTyping(data.isTyping);
        
        // 3초 후 타이핑 상태 자동 해제
        if (data.isTyping) {
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      }
    });

    // 이전 메시지 불러오기
    fetchChatHistory();

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, chatRoomId]);

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/chat/${chatRoomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.data.messages);
        }
      } else {
        // API 실패 시 샘플 메시지 표시
        setMessages([
          {
            id: '1',
            senderId: otherUserId,
            senderName: otherUserName,
            message: `안녕하세요! ${jobTitle ? `"${jobTitle}" 관련해서` : ''} 문의드립니다.`,
            timestamp: new Date(Date.now() - 300000).toISOString(),
            type: 'text'
          },
          {
            id: '2',
            senderId: user?.id || '',
            senderName: `${user?.firstName}${user?.lastName}`,
            message: '안녕하세요! 궁금한 점이 있으시면 언제든 말씀해주세요.',
            timestamp: new Date(Date.now() - 240000).toISOString(),
            type: 'text'
          }
        ]);
      }
    } catch (error) {
      console.error('채팅 히스토리 조회 실패:', error);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !user) return;

    const messageData: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: `${user.firstName}${user.lastName}`,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    // 소켓으로 메시지 전송
    socket.emit('send_message', {
      chatRoomId,
      message: messageData
    });

    // 내 메시지를 즉시 화면에 추가
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
    
    // 타이핑 상태 해제
    if (isTyping) {
      socket.emit('typing_status', { chatRoomId, isTyping: false });
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    if (!socket || !user) return;

    // 타이핑 상태 전송
    if (value.trim() && !isTyping) {
      socket.emit('typing_status', { chatRoomId, isTyping: true });
      setIsTyping(true);
    } else if (!value.trim() && isTyping) {
      socket.emit('typing_status', { chatRoomId, isTyping: false });
      setIsTyping(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB를 초과할 수 없습니다.');
      return;
    }

    // TODO: 실제 파일 업로드 구현
    console.log('파일 업로드:', file.name);
    alert('파일 업로드 기능은 추후 구현 예정입니다.');
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 sm:w-96 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 bg-orange-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <div>
            <h3 className="font-semibold text-sm">{otherUserName}</h3>
            {jobTitle && (
              <p className="text-xs opacity-90 truncate">{jobTitle}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-orange-700 rounded-full p-1 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.map((message) => {
          const isMyMessage = message.senderId === user.id;
          
          return (
            <div
              key={message.id}
              className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs ${isMyMessage ? 'order-2' : 'order-1'}`}>
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    isMyMessage
                      ? 'bg-orange-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {message.message}
                </div>
                <div
                  className={`text-xs text-gray-500 mt-1 ${
                    isMyMessage ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* 타이핑 인디케이터 */}
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex items-end gap-2">
          <button
            onClick={handleFileUpload}
            className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
            title="파일 첨부"
          >
            📎
          </button>
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-orange-500 text-sm"
              rows={1}
              style={{ minHeight: '36px', maxHeight: '72px' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            전송
          </button>
        </div>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.doc,.docx"
        onChange={handleFileSelect}
      />
    </div>
  );
}
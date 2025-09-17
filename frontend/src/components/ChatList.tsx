'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import ChatWindow from './ChatWindow';
import { API_CONFIG } from '@/lib/config';

interface ChatRoom {
  id: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  jobTitle?: string;
  isOnline: boolean;
}

export default function ChatList() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchChatRooms();
    }
  }, [isAuthenticated, user]);

  const fetchChatRooms = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/chat/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setChatRooms(data.data.rooms);
        }
      } else {
        // API 실패 시 샘플 데이터 사용
        setChatRooms([
          {
            id: 'room1',
            otherUserId: 'user1',
            otherUserName: '한빛전기 김사장',
            lastMessage: '내일 아침 9시에 현장에서 뵙겠습니다.',
            lastMessageTime: new Date(Date.now() - 1800000).toISOString(),
            unreadCount: 2,
            jobTitle: '아파트 전기 배선 작업',
            isOnline: true
          },
          {
            id: 'room2',
            otherUserId: 'user2',
            otherUserName: '청솔도배 박팀장',
            lastMessage: '자재는 저희가 준비해드릴게요.',
            lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
            unreadCount: 0,
            jobTitle: '원룸 도배 작업',
            isOnline: false
          },
          {
            id: 'room3',
            otherUserId: 'user3',
            otherUserName: '대한철거 이사장',
            lastMessage: '안전장비는 꼭 착용해주세요.',
            lastMessageTime: new Date(Date.now() - 7200000).toISOString(),
            unreadCount: 1,
            jobTitle: '상가 철거 작업',
            isOnline: true
          }
        ]);
      }
    } catch (error) {
      console.error('채팅방 목록 조회 실패:', error);
      // 에러 시 샘플 데이터 사용
      setChatRooms([
        {
          id: 'room1',
          otherUserId: 'user1',
          otherUserName: '한빛전기 김사장',
          lastMessage: '내일 아침 9시에 현장에서 뵙겠습니다.',
          lastMessageTime: new Date(Date.now() - 1800000).toISOString(),
          unreadCount: 2,
          jobTitle: '아파트 전기 배선 작업',
          isOnline: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (chatRoom: ChatRoom) => {
    setSelectedChat(chatRoom);
    
    // 읽지 않은 메시지 카운트 리셋
    setChatRooms(prev => 
      prev.map(room => 
        room.id === chatRoom.id 
          ? { ...room, unreadCount: 0 }
          : room
      )
    );
  };

  const closeChat = () => {
    setSelectedChat(null);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const totalUnreadCount = chatRooms.reduce((sum, room) => sum + room.unreadCount, 0);

  if (!isAuthenticated) return null;

  return (
    <>
      {/* 채팅 버튼 */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 채팅 목록 패널 */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 sm:w-96 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-40">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 bg-orange-600 text-white rounded-t-lg">
            <h3 className="font-semibold">💬 채팅</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-orange-700 rounded-full p-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 채팅방 목록 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm text-center px-4">
                  아직 채팅 내역이 없습니다.<br />
                  일자리에 지원하면 채팅을 시작할 수 있어요!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {chatRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => openChat(room)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* 프로필 아바타 */}
                      <div className="relative">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold text-sm">
                          {room.otherUserName.charAt(0)}
                        </div>
                        {room.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* 사용자 이름과 시간 */}
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {room.otherUserName}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatTime(room.lastMessageTime)}
                          </span>
                        </div>

                        {/* 작업 제목 */}
                        {room.jobTitle && (
                          <p className="text-xs text-orange-600 mb-1 truncate">
                            {room.jobTitle}
                          </p>
                        )}

                        {/* 마지막 메시지와 읽지 않은 수 */}
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate flex-1 mr-2">
                            {room.lastMessage}
                          </p>
                          {room.unreadCount > 0 && (
                            <span className="bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                              {room.unreadCount > 99 ? '99+' : room.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 새 채팅 버튼 */}
          <div className="p-3 border-t border-gray-200">
            <button className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
              + 새 채팅
            </button>
          </div>
        </div>
      )}

      {/* 채팅 윈도우 */}
      {selectedChat && (
        <ChatWindow
          chatRoomId={selectedChat.id}
          otherUserId={selectedChat.otherUserId}
          otherUserName={selectedChat.otherUserName}
          jobTitle={selectedChat.jobTitle}
          onClose={closeChat}
        />
      )}
    </>
  );
}
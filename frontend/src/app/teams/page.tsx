'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface Team {
  id: string;
  name: string;
  description: string;
  leader: {
    id: string;
    name: string;
    tier: string;
  };
  members: {
    id: string;
    name: string;
    role: string;
    skills: string[];
    rating: number;
    status: 'active' | 'busy' | 'offline';
  }[];
  projects: {
    id: string;
    title: string;
    status: 'ongoing' | 'completed' | 'upcoming';
    startDate: string;
    endDate?: string;
    location: string;
    budget: number;
  }[];
  rating: number;
  completedProjects: number;
  totalEarnings: number;
  tags: string[];
  isRecruiting: boolean;
}

interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  invitedBy: string;
  message: string;
  role: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string[];
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dueDate: string;
  createdAt: string;
}

const SAMPLE_TEAMS: Team[] = [
  {
    id: 'team1',
    name: '프로 마감팀',
    description: '고품질 마감작업 전문 팀입니다. 10년 이상 경력자로 구성되어 있습니다.',
    leader: {
      id: 'leader1',
      name: '김팀장',
      tier: '전문가'
    },
    members: [
      {
        id: 'member1',
        name: '이철수',
        role: '타일 전문',
        skills: ['타일시공', '방수작업'],
        rating: 4.8,
        status: 'active'
      },
      {
        id: 'member2',
        name: '박영희',
        role: '도배 전문',
        skills: ['도배', '벽지시공'],
        rating: 4.9,
        status: 'active'
      },
      {
        id: 'member3',
        name: '정민수',
        role: '목공 전문',
        skills: ['목공', '가구제작'],
        rating: 4.7,
        status: 'busy'
      }
    ],
    projects: [
      {
        id: 'proj1',
        title: '강남 아파트 리모델링',
        status: 'ongoing',
        startDate: '2024-12-28',
        location: '서울 강남구',
        budget: 15000000
      },
      {
        id: 'proj2',
        title: '서초 오피스텔 마감',
        status: 'upcoming',
        startDate: '2025-01-05',
        location: '서울 서초구',
        budget: 20000000
      }
    ],
    rating: 4.8,
    completedProjects: 45,
    totalEarnings: 450000000,
    tags: ['마감작업', '리모델링', '고품질'],
    isRecruiting: true
  },
  {
    id: 'team2',
    name: '스피드 철거단',
    description: '신속하고 안전한 철거 전문 팀입니다.',
    leader: {
      id: 'leader2',
      name: '박대표',
      tier: '전문가'
    },
    members: [
      {
        id: 'member4',
        name: '최강철',
        role: '중장비 운전',
        skills: ['중장비', '안전관리'],
        rating: 4.7,
        status: 'active'
      },
      {
        id: 'member5',
        name: '한동수',
        role: '폐기물 처리',
        skills: ['폐기물처리', '재활용'],
        rating: 4.6,
        status: 'offline'
      }
    ],
    projects: [
      {
        id: 'proj3',
        title: '상가 철거 작업',
        status: 'completed',
        startDate: '2024-12-20',
        endDate: '2024-12-25',
        location: '서울 마포구',
        budget: 8000000
      }
    ],
    rating: 4.6,
    completedProjects: 32,
    totalEarnings: 280000000,
    tags: ['철거작업', '안전', '신속'],
    isRecruiting: false
  }
];

const SAMPLE_INVITATIONS: TeamInvitation[] = [
  {
    id: 'inv1',
    teamId: 'team1',
    teamName: '프로 마감팀',
    invitedBy: '김팀장',
    message: '전기작업 전문가를 찾고 있습니다. 함께 일하시겠습니까?',
    role: '전기 전문',
    createdAt: '2024-12-29T10:00:00Z',
    status: 'pending'
  }
];

const SAMPLE_TASKS: Task[] = [
  {
    id: 'task1',
    projectId: 'proj1',
    title: '거실 타일 시공',
    description: '거실 바닥 타일 시공 완료',
    assignedTo: ['member1'],
    priority: 'high',
    status: 'in_progress',
    dueDate: '2024-12-31',
    createdAt: '2024-12-28T09:00:00Z'
  },
  {
    id: 'task2',
    projectId: 'proj1',
    title: '벽지 도배',
    description: '전체 벽면 도배 작업',
    assignedTo: ['member2'],
    priority: 'medium',
    status: 'todo',
    dueDate: '2025-01-02',
    createdAt: '2024-12-28T09:00:00Z'
  }
];

export default function TeamsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [teams, setTeams] = useState<Team[]>(SAMPLE_TEAMS);
  const [invitations, setInvitations] = useState<TeamInvitation[]>(SAMPLE_INVITATIONS);
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [selectedTab, setSelectedTab] = useState<'my-teams' | 'find-teams' | 'create-team' | 'invitations'>('my-teams');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case '전문가': return 'text-purple-700 bg-purple-100';
      case '숙련자': return 'text-blue-700 bg-blue-100';
      case '경험자': return 'text-green-700 bg-green-100';
      case '초보자': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700 bg-red-100';
      case 'medium': return 'text-orange-700 bg-orange-100';
      case 'low': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-400';
      case 'busy': return 'bg-orange-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const handleInvitation = (invitationId: string, action: 'accept' | 'decline') => {
    setInvitations(prev => prev.map(inv => 
      inv.id === invitationId 
        ? { ...inv, status: action === 'accept' ? 'accepted' : 'declined' }
        : inv
    ));
  };

  const handleJoinTeam = (teamId: string) => {
    alert('팀 가입 신청이 완료되었습니다.');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">팀 협업</h1>
          <p className="text-gray-600">팀을 구성하고 프로젝트를 함께 진행하세요</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'my-teams', label: '내 팀', icon: '👥' },
                { key: 'find-teams', label: '팀 찾기', icon: '🔍' },
                { key: 'create-team', label: '팀 만들기', icon: '➕' },
                { key: 'invitations', label: '초대', icon: '📬', badge: invitations.filter(i => i.status === 'pending').length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm relative ${
                    selectedTab === tab.key
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 내 팀 */}
        {selectedTab === 'my-teams' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">소속 팀</h3>
              
              {/* 팀 카드 */}
              {teams.slice(0, 1).map((team) => (
                <div key={team.id} className="bg-white rounded-lg p-6 shadow-sm mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{team.name}</h4>
                      <p className="text-gray-600 mb-3">{team.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>👑 {team.leader.name}</span>
                        <span>⭐ {team.rating}</span>
                        <span>👥 {team.members.length + 1}명</span>
                        <span>📊 {team.completedProjects}개 완료</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTeam(team)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                    >
                      상세보기
                    </button>
                  </div>

                  {/* 팀원 목록 */}
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-900 mb-3">팀원</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {team.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`}></span>
                            <div>
                              <div className="font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-600">{member.role}</div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">⭐ {member.rating}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 진행중인 프로젝트 */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">진행중인 프로젝트</h5>
                    <div className="space-y-3">
                      {team.projects.filter(p => p.status === 'ongoing').map((project) => (
                        <div key={project.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-gray-900">{project.title}</h6>
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                              진행중
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>📍 {project.location}</div>
                            <div>💰 {(project.budget / 10000).toFixed(0)}만원</div>
                            <div>📅 {project.startDate}</div>
                            <div>👥 {team.members.length + 1}명</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* 작업 관리 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">내 작업</h4>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{task.title}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>📅 {task.dueDate}</span>
                          <span>👤 {task.assignedTo.join(', ')}</span>
                        </div>
                        <select 
                          value={task.status}
                          onChange={(e) => {
                            setTasks(prev => prev.map(t => 
                              t.id === task.id ? { ...t, status: e.target.value as any } : t
                            ));
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="todo">할 일</option>
                          <option value="in_progress">진행중</option>
                          <option value="review">검토</option>
                          <option value="done">완료</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 사이드바 */}
            <div className="space-y-6">
              {/* 팀 통계 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">팀 성과</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">이번 달 수익</span>
                    <span className="font-medium text-gray-900">2,500만원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">완료 프로젝트</span>
                    <span className="font-medium text-gray-900">3개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">평균 평점</span>
                    <span className="font-medium text-gray-900">4.8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">팀 랭킹</span>
                    <span className="font-medium text-orange-600">#12</span>
                  </div>
                </div>
              </div>

              {/* 팀 공지 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">팀 공지</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-600">📢</span>
                      <span className="text-sm font-medium text-yellow-900">중요</span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      내일 오전 8시 강남 현장 집합입니다.
                    </p>
                    <span className="text-xs text-yellow-700">2시간 전</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-blue-600">ℹ️</span>
                      <span className="text-sm font-medium text-blue-900">정보</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      다음 주 프로젝트 일정이 확정되었습니다.
                    </p>
                    <span className="text-xs text-blue-700">1일 전</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 팀 찾기 */}
        {selectedTab === 'find-teams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div key={team.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="mb-4">
                  {team.isRecruiting && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                      모집중
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{team.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{team.description}</p>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div>👑 리더: {team.leader.name}</div>
                  <div>⭐ 평점: {team.rating}</div>
                  <div>👥 팀원: {team.members.length + 1}명</div>
                  <div>📊 완료: {team.completedProjects}개</div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {team.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                {team.isRecruiting ? (
                  <button
                    onClick={() => handleJoinTeam(team.id)}
                    className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
                  >
                    가입 신청
                  </button>
                ) : (
                  <button className="w-full bg-gray-200 text-gray-500 py-2 rounded" disabled>
                    모집 마감
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 팀 만들기 */}
        {selectedTab === 'create-team' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">새 팀 만들기</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    팀 이름
                  </label>
                  <input
                    type="text"
                    placeholder="예: 프로 마감팀"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    팀 소개
                  </label>
                  <textarea
                    placeholder="팀의 전문 분야와 특징을 소개해주세요"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주요 작업 분야
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['마감작업', '철거작업', '전기작업', '배관작업', '도색작업', '목공작업'].map((field) => (
                      <label key={field} className="flex items-center">
                        <input type="checkbox" className="mr-2 text-orange-600" />
                        <span className="text-sm text-gray-700">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    팀원 모집
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="필요한 역할 (예: 전기 전문가)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <input
                        type="number"
                        placeholder="인원"
                        className="w-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        추가
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    팀 규칙
                  </label>
                  <textarea
                    placeholder="팀 운영 규칙과 정책을 작성해주세요"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-medium">
                    팀 생성하기
                  </button>
                  <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 초대 */}
        {selectedTab === 'invitations' && (
          <div className="max-w-3xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">팀 초대</h3>
            
            {invitations.filter(i => i.status === 'pending').length > 0 ? (
              <div className="space-y-4">
                {invitations.filter(i => i.status === 'pending').map((invitation) => (
                  <div key={invitation.id} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-lg font-semibold text-gray-900">{invitation.teamName}</h4>
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                            초대
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{invitation.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>👤 {invitation.invitedBy}님이 초대</span>
                          <span>💼 역할: {invitation.role}</span>
                          <span>📅 {new Date(invitation.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleInvitation(invitation.id, 'accept')}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        수락
                      </button>
                      <button
                        onClick={() => handleInvitation(invitation.id, 'decline')}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200"
                      >
                        거절
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-12 shadow-sm text-center">
                <div className="text-4xl mb-4">📬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">초대가 없습니다</h3>
                <p className="text-gray-600">새로운 팀 초대가 오면 여기에 표시됩니다</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
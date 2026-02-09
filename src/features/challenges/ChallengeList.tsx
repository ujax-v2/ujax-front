import React, { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { navigationState, currentChallengeState } from '../../store/atoms';
import { Button, Card, Badge, Modal } from '../../components/ui/Base';
import { Trophy, Users, Clock, Plus, Target, Calendar, Archive, Timer } from 'lucide-react';

export const ChallengeList = () => {
  const setPage = useSetRecoilState(navigationState);
  const setCurrentChallenge = useSetRecoilState(currentChallengeState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock Data
  const [challenges, setChallenges] = useState([
    {
      id: 1,
      title: "30일 알고리즘 챌린지 5기",
      participants: 156,
      duration: "30 Days",
      startDate: "2024.03.01",
      reward: "Gold Badge + 500 XP",
      status: "active", // active, recruiting, ended
      color: "bg-emerald-500",
      description: "매일 한 문제씩! 꾸준함이 실력이다."
    },
    {
      id: 2,
      title: "삼성 SW 역량테스트 대비반",
      participants: 42,
      duration: "14 Days",
      startDate: "2024.03.10",
      reward: "Premium Membership 1 Month",
      status: "recruiting",
      color: "bg-blue-500",
      description: "기출문제를 분석하고 완벽하게 대비하세요."
    },
    {
      id: 3,
      title: "주말 코딩 마라톤",
      participants: 89,
      duration: "2 Days",
      startDate: "2024.02.24",
      reward: "Coffee Coupon",
      status: "ended",
      color: "bg-purple-500",
      description: "주말 이틀동안 불태우는 코딩 열정!"
    },
    {
      id: 4,
      title: "동계 알고리즘 캠프",
      participants: 230,
      duration: "60 Days",
      startDate: "2023.12.01",
      reward: "Certificate",
      status: "ended",
      color: "bg-indigo-500",
      description: "겨울방학동안 알고리즘 마스터하기"
    }
  ]);

  // Create Challenge Form State
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    duration: '7',
    category: 'Algorithm',
    problems: ''
  });

  const handleCreateChallenge = (e) => {
    e.preventDefault();
    const challenge = {
      id: challenges.length + 1,
      title: newChallenge.title,
      participants: 1,
      duration: `${newChallenge.duration} Days`,
      startDate: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      reward: "Custom Reward",
      status: "recruiting",
      color: "bg-pink-500",
      description: `Category: ${newChallenge.category}`
    };
    setChallenges([challenge, ...challenges]);
    setIsModalOpen(false);
    setNewChallenge({ title: '', duration: '7', category: 'Algorithm', problems: '' });
  };

  const activeChallenges = challenges.filter(c => c.status !== 'ended');
  const endedChallenges = challenges.filter(c => c.status === 'ended');

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1117] p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">챌린지 & 대회</h1>
            <p className="text-slate-400 mt-1">동료들과 함께 성장하는 즐거움을 경험하세요.</p>
          </div>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" /> 챌린지 생성
          </Button>
        </div>

        {/* Active & Recruiting Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-200">
             <Trophy className="w-5 h-5 text-emerald-500" /> 진행중인 챌린지
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeChallenges.map((challenge) => (
              <div 
                key={challenge.id}
                onClick={() => {
                  setCurrentChallenge(challenge);
                  setPage('challenge-detail');
                }}
                className="group relative overflow-hidden bg-slate-900/50 border border-slate-800 rounded-xl p-6 cursor-pointer hover:bg-slate-800/50 hover:border-slate-700 transition-all"
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${challenge.color}`}></div>
                
                <div className="flex justify-between items-start mb-4 pl-2">
                  <div className={`w-10 h-10 rounded-lg ${challenge.color} bg-opacity-20 flex items-center justify-center text-slate-200`}>
                    <Trophy className="w-5 h-5" />
                  </div>
                  <Badge variant={challenge.status === 'active' ? 'success' : 'warning'}>
                    {challenge.status === 'active' ? '진행중' : '모집중'}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-slate-200 mb-2 group-hover:text-emerald-400 transition-colors pl-2">
                  {challenge.title}
                </h3>

                <div className="space-y-3 pl-2 text-sm text-slate-400 mt-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>{challenge.participants}명 참가 중</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>{challenge.duration} ({challenge.startDate} 시작)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-500" />
                    <span className="text-emerald-500">{challenge.reward}</span>
                  </div>
                </div>

                <div className="mt-6 pl-2">
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full ${challenge.color} w-3/4`}></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>진행률 75%</span>
                    <span>D-7</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ended Challenges Section */}
        <section className="space-y-6 pt-6 border-t border-slate-800/50">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-200">
             <Archive className="w-5 h-5 text-slate-500" /> 종료된 챌린지
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {endedChallenges.map((challenge) => (
              <div 
                key={challenge.id}
                onClick={() => {
                  setCurrentChallenge(challenge);
                  setPage('challenge-detail');
                }}
                className="group relative overflow-hidden bg-slate-900/30 border border-slate-800 rounded-xl p-6 cursor-pointer hover:bg-slate-800/50 hover:border-slate-700 transition-all grayscale hover:grayscale-0"
              >
                <div className={`absolute top-0 left-0 w-1 h-full bg-slate-600`}></div>
                
                <div className="flex justify-between items-start mb-4 pl-2">
                   <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                    <Archive className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary">종료</Badge>
                </div>

                <h3 className="text-lg font-bold text-slate-300 mb-2 group-hover:text-white transition-colors pl-2">
                  {challenge.title}
                </h3>
                
                <div className="pl-2 text-sm text-slate-500 mb-4 h-10 line-clamp-2">
                  {challenge.description}
                </div>

                <div className="space-y-2 pl-2 text-xs text-slate-500 border-t border-slate-800 pt-3">
                  <div className="flex justify-between">
                    <span>참여자</span>
                    <span className="text-slate-400">{challenge.participants}명</span>
                  </div>
                  <div className="flex justify-between">
                    <span>기간</span>
                    <span className="text-slate-400">{challenge.startDate} ~</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Create Challenge Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="새 챌린지 생성">
          <form onSubmit={handleCreateChallenge} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">챌린지 제목</label>
              <input 
                type="text" 
                required
                value={newChallenge.title}
                onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                placeholder="예: 1일 1문제 뽀개기"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-sm font-medium text-slate-400">기간 (일)</label>
                 <div className="relative">
                   <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                   <input 
                    type="number" 
                    min="1"
                    value={newChallenge.duration}
                    onChange={(e) => setNewChallenge({...newChallenge, duration: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                 </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400">분류</label>
                <select 
                  value={newChallenge.category}
                  onChange={(e) => setNewChallenge({...newChallenge, category: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option>알고리즘</option>
                  <option>프로젝트</option>
                  <option>스터디</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">문제 선택</label>
              <div className="border border-slate-800 rounded-lg bg-slate-900/50 p-3 h-32 overflow-y-auto space-y-2">
                 {/* Mock Problem Selector */}
                 <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer p-1 hover:bg-slate-800 rounded">
                   <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500" />
                   1000. A+B
                 </label>
                 <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer p-1 hover:bg-slate-800 rounded">
                   <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500" />
                   1920. 수 찾기
                 </label>
                 <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer p-1 hover:bg-slate-800 rounded">
                   <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500" />
                   2557. Hello World
                 </label>
                 <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer p-1 hover:bg-slate-800 rounded">
                   <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500" />
                   2739. 구구단
                 </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>취소</Button>
              <Button type="submit">챌린지 개설</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

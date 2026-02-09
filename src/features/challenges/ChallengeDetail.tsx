import React from 'react';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { navigationState, currentChallengeState } from '../../store/atoms';
import { Button, Card, Badge } from '../../components/ui/Base';
import { ArrowLeft, Calendar, CheckCircle2, XCircle, Flame, Trophy, Clock, Code2, Medal } from 'lucide-react';

export const ChallengeDetail = () => {
  const setPage = useSetRecoilState(navigationState);
  const currentChallenge = useRecoilValue(currentChallengeState);
  
  // If no challenge is selected (e.g. direct load), fallback or redirect
  if (!currentChallenge) {
    // In a real app we'd redirect, but for now let's just show a loading or error state
    // Or we can just redirect back to list
    setPage('challenges');
    return null;
  }

  const isEndedView = currentChallenge.status === 'ended';

  const participants = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    name: `User ${i + 1}`,
    avatar: i,
    status: i < 6 ? 'survived' : 'dropped',
    streak: i < 6 ? Math.floor(Math.random() * 10) + 1 : 0,
    score: 1500 - (i * 50),
    rank: i + 1,
    solvedCount: 28
  }));

  // Ranking data for ended view
  const ranking = participants.sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1117] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-6">
          <Button variant="ghost" className="w-fit -ml-2 text-slate-400" onClick={() => setPage('challenges')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> 챌린지 목록
          </Button>
          
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                 {isEndedView ? (
                    <Badge variant="secondary">Ended</Badge>
                 ) : (
                    <div className="flex items-center gap-2">
                        <Badge variant="success">Day 12</Badge>
                        <span className="text-slate-500 text-sm">/ {currentChallenge.duration}</span>
                    </div>
                 )}
              </div>
              <h1 className="text-3xl font-bold text-slate-100">{currentChallenge.title}</h1>
            </div>
            
            {/* Timer or Result Badge */}
            <div className="text-right">
              {isEndedView ? (
                 <div className="flex flex-col items-end">
                    <span className="text-sm text-slate-400 mb-1">Final Status</span>
                    <span className="text-xl font-bold text-emerald-500 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Completed
                    </span>
                 </div>
              ) : (
                <>
                  <div className="text-sm text-slate-400 mb-1">남은 시간</div>
                  <div className="text-2xl font-mono font-bold text-emerald-500">14:22:05</div>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar (Show in both but different context) */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">
                {isEndedView ? '최종 달성률' : '전체 진행률'}
              </span>
              <span className="text-emerald-500 font-bold">
                 {isEndedView ? '92%' : '40%'}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r from-emerald-600 to-emerald-400 relative ${isEndedView ? 'w-[92%]' : 'w-2/5'}`}
              >
                {!isEndedView && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 animate-pulse"></div>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">{isEndedView ? '완주자' : '생존자'}</div>
                <div className="text-xl font-bold text-slate-200">124<span className="text-slate-500 text-sm font-normal">/156</span></div>
              </div>
              <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">평균 문제 해결</div>
                <div className="text-xl font-bold text-slate-200">{isEndedView ? '28.5' : '12'}</div>
              </div>
              <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">총 상금 포인트</div>
                <div className="text-xl font-bold text-yellow-500">50,000 P</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {isEndedView ? (
              /* ENDED VIEW: Ranking & Results */
              <>
                 <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                  <Medal className="w-5 h-5 text-yellow-500" /> 최종 랭킹
                </h2>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="border-b border-slate-800 bg-[#141820] text-slate-400 text-sm">
                         <th className="p-4 font-medium w-16 text-center">Rank</th>
                         <th className="p-4 font-medium">User</th>
                         <th className="p-4 font-medium text-center">Solved</th>
                         <th className="p-4 font-medium text-right">Score</th>
                         <th className="p-4 font-medium text-center">Code</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800/50">
                       {ranking.map((user, idx) => (
                         <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                           <td className="p-4 text-center">
                             {idx === 0 ? <span className="text-xl">🥇</span> : 
                              idx === 1 ? <span className="text-xl">🥈</span> : 
                              idx === 2 ? <span className="text-xl">🥉</span> : 
                              <span className="text-slate-500 font-mono">#{user.rank}</span>}
                           </td>
                           <td className="p-4">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt={user.name} />
                               </div>
                               <span className="text-slate-200 font-medium">{user.name}</span>
                             </div>
                           </td>
                           <td className="p-4 text-center text-slate-400">{user.solvedCount}</td>
                           <td className="p-4 text-right font-mono text-emerald-400">{user.score.toLocaleString()}</td>
                           <td className="p-4 text-center">
                             <button className="text-slate-500 hover:text-emerald-500 transition-colors" title="View Code">
                               <Code2 className="w-4 h-4 mx-auto" />
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
              </>
            ) : (
              /* ACTIVE VIEW: Daily Mission */
              <>
                <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" /> 오늘의 미션
                </h2>
                
                <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy className="w-32 h-32 text-emerald-500" />
                  </div>
                  
                  <div className="relative z-10">
                    <Badge className="bg-emerald-500/10 text-emerald-400 mb-3 border-emerald-500/20">Today's Problem</Badge>
                    <h3 className="text-2xl font-bold text-white mb-2">1920. 수 찾기</h3>
                    <div className="flex gap-2 mb-6">
                      <Badge variant="secondary">Silver 4</Badge>
                      <Badge variant="secondary">Binary Search</Badge>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-6 text-lg" onClick={() => setPage('ide')}>
                        도전하기
                      </Button>
                      <Button variant="secondary" className="px-6">
                        문제 보기
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Upcoming Schedule (Mini) */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h3 className="font-bold text-slate-200 mb-4">내일 예고</h3>
                  <div className="flex items-center gap-4 text-slate-400">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-500">?</div>
                    <div>
                      <div className="font-semibold text-slate-300">내일 00:00 공개</div>
                      <div className="text-sm">난이도: Gold 5 예상</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar: Participants */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" /> {isEndedView ? '참가자' : '생존자 현황'}
            </h2>
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/80">
                <div className="flex justify-between text-xs font-medium text-slate-400 uppercase tracking-wider">
                  <span>Member</span>
                  <span>{isEndedView ? 'Score' : 'Streak'}</span>
                </div>
              </div>
              <div className="divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto">
                {participants.map((p) => (
                  <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`} alt={p.name} />
                        </div>
                        {!isEndedView && p.status === 'dropped' && (
                          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                            <XCircle className="w-4 h-4 text-red-500" />
                          </div>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${!isEndedView && p.status === 'dropped' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {p.name}
                      </span>
                    </div>
                    
                    {isEndedView ? (
                        <span className="text-sm font-mono text-emerald-500">{p.score}</span>
                    ) : (
                        p.status === 'survived' ? (
                        <div className="flex items-center gap-1 text-orange-400 font-mono text-sm">
                            <Flame className="w-3 h-3 fill-current" /> {p.streak}
                        </div>
                        ) : (
                        <Badge variant="destructive" className="text-[10px] py-0 h-5">Failed</Badge>
                        )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

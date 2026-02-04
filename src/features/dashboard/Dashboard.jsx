import React from 'react';
import { Card, Button, Badge } from '../../components/ui/Base';
import { Trophy, Flame, Target, CheckCircle, Clock, ArrowRight, TrendingUp, MoreHorizontal } from 'lucide-react';
export const Dashboard = () => {
    return (<div className="flex-1 overflow-y-auto bg-[#0F1117] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">안녕하세요, 개발자님 👋</h1>
            <p className="text-slate-400 mt-1">오늘도 즐거운 코딩 되세요!</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary">프로필 편집</Button>
            <Button>문제 풀러가기</Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5 flex items-center gap-4 border-slate-800 bg-slate-900/40">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-6 h-6"/>
            </div>
            <div>
              <div className="text-slate-400 text-xs font-medium uppercase">해결한 문제</div>
              <div className="text-2xl font-bold text-slate-100">142</div>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-slate-800 bg-slate-900/40">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6"/>
            </div>
            <div>
              <div className="text-slate-400 text-xs font-medium uppercase">현재 랭킹</div>
              <div className="text-2xl font-bold text-slate-100">Top 5%</div>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-slate-800 bg-slate-900/40">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <Flame className="w-6 h-6"/>
            </div>
            <div>
              <div className="text-slate-400 text-xs font-medium uppercase">연속 풀이</div>
              <div className="text-2xl font-bold text-slate-100">12일</div>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-slate-800 bg-slate-900/40">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Target className="w-6 h-6"/>
            </div>
            <div>
              <div className="text-slate-400 text-xs font-medium uppercase">이번 달 목표</div>
              <div className="text-2xl font-bold text-slate-100">85%</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Recent Activity & Recommended Problems */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recommended Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400"/>
                  오늘의 추천 문제
                </h2>
                <button className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">모두 보기</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (<Card key={i} className="p-5 group hover:border-emerald-500/50 transition-all cursor-pointer bg-[#141820]">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="warning">Gold V</Badge>
                      <button className="text-slate-500 hover:text-emerald-400"><MoreHorizontal className="w-4 h-4"/></button>
                    </div>
                    <h3 className="font-semibold text-slate-100 mb-2 group-hover:text-emerald-400 transition-colors">평범한 배낭</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>DP</span>
                      <span>•</span>
                      <span>정답률 34%</span>
                    </div>
                  </Card>))}
              </div>
            </section>

            {/* Recent Solutions */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400"/>
                  최근 풀이 내역
                </h2>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (<Card key={i} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer bg-[#141820]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle className="w-5 h-5"/>
                      </div>
                      <div>
                        <div className="font-medium text-slate-200">DFS와 BFS</div>
                        <div className="text-xs text-slate-500">2시간 전 • Python3</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="success">맞았습니다</Badge>
                      <ArrowRight className="w-4 h-4 text-slate-600"/>
                    </div>
                  </Card>))}
              </div>
            </section>
          </div>

          {/* Sidebar Stats & Ranking */}
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400"/>
                실시간 랭킹
              </h2>
              <Card className="divide-y divide-slate-800 bg-[#141820]">
                {[1, 2, 3, 4, 5].map((rank) => (<div key={rank} className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                    <div className={`w-6 h-6 flex items-center justify-center font-bold text-sm ${rank === 1 ? 'text-yellow-400' :
                rank === 2 ? 'text-slate-300' :
                    rank === 3 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {rank}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rank}`} alt="avatar"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-200 truncate">User_{rank}23</div>
                      <div className="text-xs text-slate-500">1,240 Solved</div>
                    </div>
                  </div>))}
              </Card>
            </section>

            <Card className="p-5 bg-gradient-to-br from-emerald-900/40 to-slate-900 border-emerald-500/20">
              <h3 className="font-bold text-emerald-400 mb-2">프리미엄 멤버십</h3>
              <p className="text-sm text-slate-400 mb-4">
                무제한 테스트 케이스와 AI 코드 리뷰를 경험해보세요.
              </p>
              <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500">업그레이드</Button>
            </Card>
          </div>
        </div>
      </div>
    </div>);
};

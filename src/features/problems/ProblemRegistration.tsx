import React, { useState } from 'react';
import { Card, Button, Badge } from '../../components/ui/Base';
import { ArrowLeft, Save, Calendar, Tag, Bell, Settings } from 'lucide-react';
import { useSetRecoilState } from 'recoil';
import { navigationState } from '../../store/atoms';

export const ProblemRegistration = () => {
  const setPage = useSetRecoilState(navigationState);
  const [useAlarm, setUseAlarm] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1117] p-8 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-100">문제 등록</h1>
          <Button variant="secondary" onClick={() => setPage('problems')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> 돌아가기
          </Button>
        </div>

        <div className="bg-[#141820] border border-slate-800 rounded-xl p-8 space-y-8">
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">백준 문제 번호</label>
              <input 
                type="text" 
                placeholder="예: 125"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">마감일</label>
              <input 
                type="text" 
                placeholder="25-10-06"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400">문제 제목</label>
            <input 
              type="text" 
              placeholder="예: 괄호의 값"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
             <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">티어</label>
              <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200">G5</div>
            </div>
             <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">상태</label>
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button className="flex-1 py-1.5 text-sm font-medium rounded bg-slate-700 text-white shadow-sm">미제출</button>
                <button className="flex-1 py-1.5 text-sm font-medium rounded text-slate-500 hover:text-slate-300">제출완료</button>
              </div>
            </div>
             <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">제출자 수</label>
              <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200">5</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400">태그</label>
            <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-500">
               스택, 시뮬
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
             <div className="flex items-center justify-between mb-4">
               <div>
                 <div className="font-bold text-slate-200 text-sm">알람 설정</div>
                 <div className="text-xs text-slate-500">마감 전 알림 (시간 단위)</div>
               </div>
               <div 
                 className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${useAlarm ? 'bg-indigo-500' : 'bg-slate-700'}`}
                 onClick={() => setUseAlarm(!useAlarm)}
               >
                 <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${useAlarm ? 'translate-x-6' : 'translate-x-0'}`} />
               </div>
             </div>
             <div className="flex gap-3">
               <input 
                  type="text" 
                  defaultValue="2"
                  disabled={!useAlarm}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 disabled:opacity-50"
               />
               <Button variant="secondary" className="bg-slate-100 hover:bg-white text-slate-900 font-bold border-none w-24">적용</Button>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400">메모</label>
            <textarea 
              placeholder="(선택) 풀이 포인트"
              className="w-full h-32 bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-20">등록</Button>
            <Button variant="secondary" className="bg-white hover:bg-slate-100 text-slate-900 font-bold w-20 border-none">취소</Button>
          </div>

        </div>
      </div>
    </div>
  );
};

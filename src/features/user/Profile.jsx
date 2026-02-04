import React from 'react';
import { Card, Button, Badge } from '../../components/ui/Base';
import { User, Mail, Lock, Github, Globe, Save } from 'lucide-react';
export const Profile = () => {
    return (<div className="flex-1 overflow-y-auto bg-[#0F1117] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-slate-100">프로필 설정</h1>

        <div className="grid gap-8">
          {/* Profile Image & Basic Info */}
          <Card className="p-6 bg-[#141820] border-slate-800">
            <h2 className="text-lg font-semibold text-slate-200 mb-6">기본 정보</h2>
            <div className="flex items-start gap-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-slate-800 overflow-hidden border-2 border-slate-700">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover"/>
                </div>
                <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">이미지 변경</Button>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase">닉네임</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                      <input type="text" defaultValue="CodingMaster" className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"/>
                    </div>
                    <Button variant="secondary">중복 확인</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase">이메일</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                    <input type="email" defaultValue="user@example.com" disabled className="w-full h-10 bg-slate-900/50 border border-slate-800 rounded-lg pl-10 pr-4 text-slate-400 focus:outline-none cursor-not-allowed"/>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Social & Links */}
          <Card className="p-6 bg-[#141820] border-slate-800">
            <h2 className="text-lg font-semibold text-slate-200 mb-6">소셜 연동</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="flex items-center gap-4">
                  <Github className="w-6 h-6 text-slate-300"/>
                  <div>
                    <div className="font-medium text-slate-200">GitHub</div>
                    <div className="text-xs text-slate-500">github.com/username</div>
                  </div>
                </div>
                <Button variant="secondary" size="sm">연동 해제</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="flex items-center gap-4">
                  <Globe className="w-6 h-6 text-slate-300"/>
                  <div>
                    <div className="font-medium text-slate-200">Solved.ac</div>
                    <div className="text-xs text-slate-500">solved.ac/profile/username</div>
                  </div>
                </div>
                <Badge variant="success">연동됨</Badge>
              </div>
            </div>
          </Card>

          {/* Password */}
          <Card className="p-6 bg-[#141820] border-slate-800">
            <h2 className="text-lg font-semibold text-slate-200 mb-6">보안</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase">현재 비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                  <input type="password" className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase">새 비밀번호</label>
                  <input type="password" className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg px-4 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"/>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase">새 비밀번호 확인</label>
                  <input type="password" className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg px-4 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"/>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="ghost">취소</Button>
            <Button variant="primary" className="px-8"><Save className="w-4 h-4 mr-2"/> 저장하기</Button>
          </div>
        </div>
      </div>
    </div>);
};

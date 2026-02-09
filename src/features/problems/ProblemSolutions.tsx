import React, { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { navigationState } from '../../store/atoms';
import { Card, Button, Badge } from '../../components/ui/Base';
import { 
  ThumbsUp,
  Eye,
  Calendar,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import Editor from '@monaco-editor/react';

export const ProblemSolutions = () => {
  const setPage = useSetRecoilState(navigationState);
  const [activeSolutionId, setActiveSolutionId] = useState(1);

  // Mock solutions for the specific problem (1000. A+B)
  const solutions = [
    { 
      id: 1, 
      title: "1000번 A+B Java 최적화 풀이입니다.", 
      user: '알고리즘마스터', 
      avatar: 'Felix',
      time: '3시간 전', 
      lang: 'Java', 
      likes: 42, 
      views: 128,
      tags: ['Math', 'Implementation'],
      code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
        
        // Scanner is slower than BufferedReader but easier to use for beginners
        sc.close();
    }
}`
    },
    { 
      id: 2, 
      title: "Python 한 줄 코딩 (Short coding)", 
      user: 'pythonista', 
      avatar: 'Aneka',
      time: '5시간 전', 
      lang: 'Python3', 
      likes: 38, 
      views: 95,
      tags: ['Short', 'Math'],
      code: `print(sum(map(int, input().split())))`
    },
    { 
      id: 3, 
      title: "C++ 입출력 속도 향상 팁 포함", 
      user: 'cppNinja', 
      avatar: 'Bob',
      time: '1일 전', 
      lang: 'C++', 
      likes: 29, 
      views: 150,
      tags: ['Performance', 'IO'],
      code: `#include <iostream>
using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int a, b;
    cin >> a >> b;
    cout << a + b;
    return 0;
}`
    },
  ];

  const activeSolution = solutions.find(s => s.id === activeSolutionId) || solutions[0];
  const comments = [
    { id: 1, user: 'user123', content: '깔끔한 풀이네요! 배웠습니다.', time: '2시간 전' },
    { id: 2, user: 'coder99', content: 'Scanner 대신 BufferedReader를 쓰면 더 빠르지 않을까요?', time: '1시간 전' },
  ];

  return (
    <div className="flex h-full bg-[#0F1117]">
      {/* Sidebar: Solutions List for Selected Problem */}
      <div className="w-80 bg-[#0F1117] border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPage('ide')} className="-ml-2 text-slate-400 hover:text-white">
             <ArrowLeft className="w-4 h-4 mr-2" /> 문제로 돌아가기
          </Button>
        </div>
        <div className="p-4 border-b border-slate-800 bg-[#141820]">
            <h2 className="font-bold text-slate-200">1000. A+B 풀이</h2>
            <p className="text-xs text-slate-500 mt-1">총 152개의 풀이가 있습니다.</p>
        </div>
        <div className="p-4 border-b border-slate-800">
          <input 
            type="text" 
            placeholder="언어, 작성자 검색" 
            className="w-full h-9 bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {solutions.map((sol) => (
            <div 
              key={sol.id}
              onClick={() => setActiveSolutionId(sol.id)}
              className={`p-4 border-b border-slate-800/50 cursor-pointer transition-all hover:bg-slate-800/30 ${
                sol.id === activeSolutionId ? 'bg-slate-800/40 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <Badge className="text-[10px] px-1.5 py-0.5">{sol.lang}</Badge>
                <span className="text-[10px] text-slate-500">{sol.time}</span>
              </div>
              <h3 className={`font-semibold text-sm mb-2 line-clamp-2 ${sol.id === activeSolutionId ? 'text-emerald-400' : 'text-slate-300'}`}>
                {sol.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{sol.user}</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5"><ThumbsUp className="w-3 h-3" /> {sol.likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0F1117]">
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between bg-[#0F1117]">
          <div>
            <h1 className="text-lg font-bold text-slate-100">{activeSolution.title}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {activeSolution.time}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {activeSolution.views}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <ThumbsUp className="w-3 h-3" /> {activeSolution.likes}
            </Button>
          </div>
        </div>

        {/* Code */}
        <div className="flex-1 bg-[#1e1e1e] relative">
          <Editor
            height="100%"
            theme="vs-dark"
            language={activeSolution.lang.toLowerCase().replace('python3', 'python').replace('c++', 'cpp')}
            value={activeSolution.code}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              readOnly: true,
              scrollBeyondLastLine: false,
              padding: { top: 16 }
            }}
          />
        </div>

        {/* Comments (Collapsible or Fixed Height) */}
        <div className="h-64 border-t border-slate-800 bg-[#0F1117] flex flex-col">
          <div className="p-3 border-b border-slate-800 font-bold text-slate-200 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-500" /> 댓글
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3 text-sm">
                <div className="font-bold text-slate-300">{c.user}</div>
                <div className="text-slate-400 flex-1">{c.content}</div>
                <div className="text-slate-600 text-xs">{c.time}</div>
              </div>
            ))}
          </div>
           <div className="p-3 border-t border-slate-800 bg-[#141820]">
            <div className="relative">
              <input 
                type="text" 
                placeholder="댓글 작성..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-3 pr-10 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

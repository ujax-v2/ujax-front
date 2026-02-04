import React, { useState } from 'react';
import { Button, Badge } from '../../components/ui/Base';
import { MessageSquare, Share2, Search, Filter, ThumbsUp, Eye, Calendar } from 'lucide-react';
import Editor from '@monaco-editor/react';
export const Community = () => {
    const [activeSolutionId, setActiveSolutionId] = useState(1);
    // Mock data representing shared solutions
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
    return (<div className="flex h-full bg-[#0F1117]">
      {/* Left Sidebar: Solution List (Workspace style) */}
      <div className="w-96 bg-[#0F1117] border-r border-slate-800 flex flex-col">
        {/* List Header */}
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100 mb-4">문제 풀이 공유</h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
            <input type="text" placeholder="제목, 태그, 언어 검색" className="w-full h-10 bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"/>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1 text-xs">
              <Filter className="w-3 h-3 mr-1"/> 최신순
            </Button>
            <Button variant="secondary" size="sm" className="flex-1 text-xs">
              언어 필터
            </Button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto">
          {solutions.map((sol) => (<div key={sol.id} onClick={() => setActiveSolutionId(sol.id)} className={`p-5 border-b border-slate-800/50 cursor-pointer transition-all hover:bg-slate-800/30 ${sol.id === activeSolutionId ? 'bg-slate-800/40 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}>
              <div className="flex justify-between items-start mb-2">
                <Badge className={`
                  ${sol.lang === 'Java' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                  ${sol.lang === 'Python3' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : ''}
                  ${sol.lang === 'C++' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : ''}
                `}>
                  {sol.lang}
                </Badge>
                <span className="text-xs text-slate-500">{sol.time}</span>
              </div>
              <h3 className={`font-semibold text-sm mb-3 line-clamp-2 ${sol.id === activeSolutionId ? 'text-emerald-400' : 'text-slate-200'}`}>
                {sol.title}
              </h3>
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-700 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sol.avatar}`} alt={sol.user}/>
                  </div>
                  <span>{sol.user}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3"/> {sol.likes}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3"/> {sol.views}</span>
                </div>
              </div>
            </div>))}
        </div>
      </div>

      {/* Main Content: Solution Detail */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0F1117] relative">
        {/* Solution Header */}
        <div className="h-20 px-8 border-b border-slate-800 flex items-center justify-between bg-[#0F1117]">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-slate-100">{activeSolution.title}</h1>
              <Badge variant="success">{activeSolution.lang}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {activeSolution.time}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3"/> {activeSolution.views} views</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="gap-2">
              <Share2 className="w-4 h-4"/> 공유
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <ThumbsUp className="w-4 h-4"/> 좋아요 {activeSolution.likes}
            </Button>
          </div>
        </div>

        {/* Code Viewer */}
        <div className="flex-1 bg-[#1e1e1e] relative">
          <Editor height="100%" theme="vs-dark" language={activeSolution.lang.toLowerCase().replace('python3', 'python').replace('c++', 'cpp')} value={activeSolution.code} options={{
            minimap: { enabled: false },
            fontSize: 14,
            readOnly: true,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            padding: { top: 24, bottom: 24 },
            fontFamily: 'Consolas, "Courier New", monospace',
            renderLineHighlight: 'none'
        }}/>
        </div>

        {/* Comments Section (Bottom Panel) */}
        <div className="h-80 border-t border-slate-800 bg-[#0F1117] flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2 bg-[#141820]">
            <MessageSquare className="w-4 h-4 text-emerald-500"/>
            <span className="font-bold text-slate-200">댓글 ({comments.length})</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {comments.map(comment => (<div key={comment.id} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 mt-1 border border-slate-700"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-200 text-sm">{comment.user}</span>
                    <span className="text-xs text-slate-500">{comment.time}</span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                    {comment.content}
                  </p>
                </div>
              </div>))}
          </div>

          <div className="p-4 border-t border-slate-800 bg-[#141820]">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                ME
              </div>
              <div className="flex-1 relative">
                <input type="text" placeholder="댓글을 남겨보세요..." className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-4 pr-12 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"/>
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-400 p-1">
                  <MessageSquare className="w-4 h-4"/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
};

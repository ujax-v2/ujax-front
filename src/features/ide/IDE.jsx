import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/ui/Base';
import { Play, RotateCcw, Save, Settings, CheckCircle2, AlertCircle, Loader2, Share, ArrowLeft } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { ideCodeState, ideLanguageState, ideOutputState, ideIsExecutingState, navigationState } from '../../store/atoms';
// Language ID mapping for Judge0
const LANGUAGE_OPTIONS = [
    { id: 63, name: 'JavaScript (Node.js 12.14.0)', value: 'javascript', monaco: 'javascript' },
    { id: 71, name: 'Python (3.8.1)', value: 'python', monaco: 'python' },
    { id: 54, name: 'C++ (GCC 9.2.0)', value: 'cpp', monaco: 'cpp' },
    { id: 62, name: 'Java (OpenJDK 13.0.1)', value: 'java', monaco: 'java' },
];
const CODE_TEMPLATES = {
    javascript: `const fs = require('fs');
const input = fs.readFileSync('/dev/stdin').toString().trim().split(' ');

function solve() {
  const a = parseInt(input[0]);
  const b = parseInt(input[1]);
  console.log(a + b);
}

solve();`,
    python: `import sys
input = sys.stdin.readline

def solve():
    a, b = map(int, input().split())
    print(a + b)

if __name__ == '__main__':
    solve()`,
    cpp: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,
    java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}`
};
export const IDE = () => {
    const [code, setCode] = useRecoilState(ideCodeState);
    const [language, setLanguage] = useRecoilState(ideLanguageState);
    const [output, setOutput] = useRecoilState(ideOutputState);
    const [isExecuting, setIsExecuting] = useRecoilState(ideIsExecutingState);
    const setPage = useSetRecoilState(navigationState);
    const [activeTab, setActiveTab] = useState('problem');
    // Initialize code with template if empty or if it matches the default 'Hello World'
    useEffect(() => {
        if (code.includes('Hello, World!') || code.trim() === '') {
            setCode(CODE_TEMPLATES[language] || '');
        }
    }, []);
    const handleEditorChange = (value) => {
        if (value !== undefined) {
            setCode(value);
        }
    };
    const handleLanguageChange = (e) => {
        const selectedLang = LANGUAGE_OPTIONS.find(lang => lang.value === e.target.value);
        if (selectedLang) {
            setLanguage(selectedLang.value);
            // Automatically switch to the template for the new language
            setCode(CODE_TEMPLATES[selectedLang.value] || '');
        }
    };
    const executeCode = async () => {
        setIsExecuting(true);
        setActiveTab('output');
        setOutput(null);
        // Mock Judge0 API call
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const mockResponse = {
                stdout: "3\n",
                stderr: null,
                status: { id: 3, description: "Accepted" },
                time: "0.045",
                memory: "12480"
            };
            if (code.includes("error")) {
                setOutput({
                    stdout: null,
                    stderr: "ReferenceError: error is not defined\n    at Object.<anonymous> (/script.js:1:1)",
                    status: { id: 11, description: "Runtime Error" },
                    time: "0.050",
                    memory: "13000"
                });
            }
            else {
                setOutput(mockResponse);
            }
        }
        catch (error) {
            setOutput({
                stdout: null,
                stderr: "Failed to execute code. Please check your connection.",
                status: { id: 0, description: "Network Error" },
                time: null,
                memory: null
            });
        }
        finally {
            setIsExecuting(false);
        }
    };
    const handleSubmit = () => {
        // In a real app, we would validate the solution first
        // For now, we just navigate to the sharing page (which is the form)
        setPage('solution-form');
    };
    return (<div className="flex h-full flex-col bg-[#0F1117] text-slate-300">
      {/* IDE Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-[#0F1117]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setPage('problems')}>
            <ArrowLeft className="w-4 h-4 mr-2"/> 문제집으로
          </Button>
          <div className="h-4 w-px bg-slate-800"/>
          <div className="flex items-center gap-2">
            <Badge variant="success">Easy</Badge>
            <h1 className="font-semibold text-slate-100">1000. A+B</h1>
          </div>
          <div className="h-4 w-px bg-slate-800 mx-2"/>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>제한시간: 1초</span>
            <span>•</span>
            <span>메모리: 128MB</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCode(CODE_TEMPLATES[language])}>
            <RotateCcw className="w-4 h-4 mr-2"/> 초기화
          </Button>
          <Button variant="secondary" size="sm"><Save className="w-4 h-4 mr-2"/> 저장</Button>
          <Button variant="primary" size="sm" onClick={executeCode} disabled={isExecuting}>
            {isExecuting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Play className="w-4 h-4 mr-2"/>}
            실행
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm" onClick={handleSubmit}>
            <Share className="w-4 h-4 mr-2"/>
            제출
          </Button>
        </div>
      </div>

      {/* Main Split Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Problem Description or Output */}
        <div className="w-[40%] border-r border-slate-800 flex flex-col bg-[#0F1117]">
          <div className="flex items-center gap-6 px-4 py-3 border-b border-slate-800 text-sm font-medium">
            <button onClick={() => setActiveTab('problem')} className={`pb-3 -mb-3.5 transition-colors ${activeTab === 'problem' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
              문제 설명
            </button>
            <button onClick={() => setActiveTab('output')} className={`pb-3 -mb-3.5 transition-colors ${activeTab === 'output' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
              실행 결과
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {activeTab === 'problem' ? (<>
                <section>
                  <h3 className="text-lg font-bold text-slate-100 mb-3">문제</h3>
                  <p className="text-slate-400 leading-relaxed">
                    두 정수 A와 B를 입력받은 다음, A+B를 출력하는 프로그램을 작성하시오.
                  </p>
                </section>
                
                <section>
                  <h3 className="text-lg font-bold text-slate-100 mb-3">입력</h3>
                  <p className="text-slate-400 leading-relaxed">
                    첫째 줄에 A와 B가 주어진다. (0 &lt; A, B &lt; 10)
                  </p>
                </section>
                
                <section>
                  <h3 className="text-lg font-bold text-slate-100 mb-3">출력</h3>
                  <p className="text-slate-400 leading-relaxed">
                    첫째 줄에 A+B를 출력한다.
                  </p>
                </section>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-slate-900 border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase">예제 입력 1</h4>
                    <code className="text-sm font-mono text-slate-200">1 2</code>
                  </Card>
                  <Card className="p-4 bg-slate-900 border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase">예제 출력 1</h4>
                    <code className="text-sm font-mono text-slate-200">3</code>
                  </Card>
                </div>
              </>) : (<div className="space-y-4">
                 {isExecuting ? (<div className="flex flex-col items-center justify-center h-64 text-slate-500">
                     <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500"/>
                     <p>코드를 실행하고 있습니다...</p>
                   </div>) : output ? (<>
                    <div className="flex items-center gap-3 mb-6">
                      {output.status?.id === 3 ? (<div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="w-5 h-5"/>
                          <span className="font-bold text-lg">테스트 통과</span>
                        </div>) : (<div className="flex items-center gap-2 text-red-400">
                          <AlertCircle className="w-5 h-5"/>
                          <span className="font-bold text-lg">{output.status?.description || 'Error'}</span>
                        </div>)}
                      <div className="h-4 w-px bg-slate-700 mx-2"/>
                      <div className="text-sm text-slate-500">
                        시간: {output.time || '0'}s • 메모리: {output.memory || '0'}KB
                      </div>
                    </div>

                    <Card className="p-4 bg-slate-900 border-slate-800">
                      <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase">표준 출력 (Stdout)</h4>
                      <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap">
                        {output.stdout || <span className="text-slate-600 italic">No output</span>}
                      </pre>
                    </Card>

                    {output.stderr && (<Card className="p-4 bg-red-900/10 border-red-500/20">
                        <h4 className="text-xs font-semibold text-red-400 mb-2 uppercase">에러 메시지 (Stderr)</h4>
                        <pre className="text-sm font-mono text-red-300 whitespace-pre-wrap">
                          {output.stderr}
                        </pre>
                      </Card>)}
                   </>) : (<div className="flex flex-col items-center justify-center h-64 text-slate-600">
                     <Play className="w-12 h-12 mb-4 opacity-20"/>
                     <p>코드를 실행하여 결과를 확인하세요.</p>
                   </div>)}
              </div>)}
          </div>
        </div>

        {/* Right Panel: Monaco Editor */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
          <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-[#0F1117]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Language:</span>
              <select value={language} onChange={handleLanguageChange} className="bg-transparent text-xs font-medium text-slate-300 focus:outline-none cursor-pointer">
                {LANGUAGE_OPTIONS.map(opt => (<option key={opt.id} value={opt.value}>{opt.name}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-slate-500 cursor-pointer hover:text-slate-300"/>
            </div>
          </div>
          
          <div className="flex-1 relative">
            <Editor height="100%" theme="vs-dark" language={LANGUAGE_OPTIONS.find(l => l.value === language)?.monaco || 'javascript'} value={code} onChange={handleEditorChange} options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            padding: { top: 16 }
        }}/>
          </div>
        </div>
      </div>
    </div>);
};

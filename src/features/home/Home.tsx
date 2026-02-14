import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { userState, isCreateWorkspaceModalOpenState } from '../../store/atoms';
import { Button, Card } from '../../components/ui/Base';
import { Code2, Users, Zap, Layout, Monitor } from 'lucide-react';

export const Home = () => {
    const navigate = useNavigate();
    const user = useRecoilValue(userState);
    const setCreateWorkspaceOpen = useSetRecoilState(isCreateWorkspaceModalOpenState);

    return (
        <div className="min-h-screen bg-[#0F1117] text-white flex flex-col">
            {/* Navbar (Mock - or rely on Sidebar if collapsed) */}
            <nav className="border-b border-slate-800 bg-[#141820]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            U
                        </div>
                        <span className="font-bold text-xl tracking-tight">UJAX</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {user.isLoggedIn ? (
                            <>
                                <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                                    <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="User" />
                                </div>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => navigate('/login')}>
                                    Log In
                                </Button>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('/signup')}>
                                    Sign Up
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex flex-col">
                {/* Hero Section */}
                <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-0 relative overflow-hidden">
                    {/* Background Gradients */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" />

                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Code Together.<br />Grow Together.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
                        실시간 알고리즘 스터디 플랫폼 UJAX에서<br className="hidden md:block" />
                        팀원들과 함께 코드를 리뷰하고 성장하세요.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {user.isLoggedIn ? (
                            <Button
                                className="h-12 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-900/20"
                                onClick={() => setCreateWorkspaceOpen(true)}
                            >
                                <Zap className="w-5 h-5 mr-2" />
                                워크스페이스 생성하기
                            </Button>
                        ) : (
                            <Button
                                className="h-12 px-8 text-lg bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20"
                                onClick={() => navigate('/login')}
                            >
                                지금 무료로 시작하기
                            </Button>
                        )}
                        {/* Removed '문제 둘러보기' button */}
                    </div>
                </section>

                {/* Features Section */}
                <section className="pt-10 pb-20 bg-[#0F1117]">
                    <div className="max-w-7xl mx-auto px-6">
                        <h2 className="text-3xl font-bold text-center mb-16">Why UJAX?</h2>

                        <div className="grid md:grid-cols-3 gap-8">
                            <Card className="p-8 bg-[#141820] border-slate-800 hover:border-indigo-500/50 transition-colors group">
                                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                                    <Layout className="w-6 h-6 text-indigo-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-100">워크스페이스 기반</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    스터디 그룹별로 독립된 공간을 제공합니다. 멤버 초대, 권한 관리, 공지사항 등 스터디 운영에 필요한 모든 기능을 지원합니다.
                                </p>
                            </Card>

                            <Card className="p-8 bg-[#141820] border-slate-800 hover:border-emerald-500/50 transition-colors group">
                                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                                    <Code2 className="w-6 h-6 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-100">강력한 IDE</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    설치 없이 브라우저에서 바로 코딩하세요. 다양한 언어 지원과 실시간 실행 결과를 제공하는 웹 IDE가 내장되어 있습니다.
                                </p>
                            </Card>

                            <Card className="p-8 bg-[#141820] border-slate-800 hover:border-purple-500/50 transition-colors group">
                                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                                    <Monitor className="w-6 h-6 text-purple-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-100">실시간 피드백</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    작성한 코드에 대해 즉각적인 피드백을 주고받으세요. 코드 리뷰 기능을 통해 더 나은 알고리즘 해결책을 찾아갈 수 있습니다.
                                </p>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-slate-800 py-12 text-center text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} UJAX Platform. All rights reserved.</p>
                </footer>
            </main>
        </div>
    );
};

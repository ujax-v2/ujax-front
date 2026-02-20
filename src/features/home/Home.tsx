import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import { userState, workspacesState, currentWorkspaceState, isCreateWorkspaceModalOpenState, Workspace } from '@/store/atoms';
import { getWorkspaces } from '@/api/workspace';
import { logoutApi } from '@/api/auth';
import { Button, Card } from '@/components/ui/Base';
import { Code2, Users, Zap, Layout, Monitor, Search, LogOut, Settings, ChevronDown } from 'lucide-react';

export const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useRecoilState(userState);
    const [workspaces, setWorkspaces] = useRecoilState(workspacesState);
    const currentWsId = useRecoilValue(currentWorkspaceState);
    const setCreateWorkspaceOpen = useSetRecoilState(isCreateWorkspaceModalOpenState);
    const [exploreQuery, setExploreQuery] = useState('');
    const [loading, setLoading] = useState(user.isLoggedIn && workspaces.length === 0);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // 프로필 메뉴 외부 클릭 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            if (user.refreshToken) {
                await logoutApi(user.refreshToken);
            }
        } catch {
            // logout API 실패해도 로컬 상태는 초기화
        }
        localStorage.removeItem('auth');
        setUser({ isLoggedIn: false, name: 'Guest', email: '', avatar: '', profileImageUrl: '', baekjoonId: '', accessToken: '', refreshToken: '' });
        setWorkspaces([]);
        setProfileMenuOpen(false);
        navigate('/login');
    };

    // 로그인 상태에서 워크스페이스 목록 fetch
    useEffect(() => {
        if (!user.isLoggedIn) return;
        if (workspaces.length > 0) return; // 이미 로드됨

        let cancelled = false;
        (async () => {
            try {
                const res = await getWorkspaces();
                if (cancelled) return;
                const items = (res.items ?? []).map((w: any) => ({
                    id: w.id!,
                    name: w.name!,
                    description: w.description ?? null,
                })) as Workspace[];
                setWorkspaces(items);
            } catch (err) {
                console.error('Failed to fetch workspaces:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [user.isLoggedIn]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
                <div className="text-slate-400">워크스페이스 로딩 중...</div>
            </div>
        );
    }

    // 로그인 유저 + 기존 WS 있으면 → 최근 WS 대시보드로 자동 이동
    if (user.isLoggedIn && workspaces.length > 0) {
        const targetWsId = currentWsId || workspaces[0].id;
        return <Navigate to={`/ws/${targetWsId}/dashboard`} replace />;
    }

    // WS 탐색 검색 실행
    const handleExploreSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (exploreQuery.trim()) {
            navigate(`/explore?q=${encodeURIComponent(exploreQuery.trim())}`);
        } else {
            navigate('/explore');
        }
    };

    return (
        <div className="h-full overflow-y-auto overflow-x-hidden scroll-smooth bg-[#0F1117] text-white flex flex-col relative" id="home-scroll-container">
            {/* Navbar */}
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
                            <div className="relative" ref={profileMenuRef}>
                                <button
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold border border-indigo-500">
                                        {user.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-slate-200 hidden sm:block">{user.name}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {profileMenuOpen && (
                                    <div className="absolute right-0 top-12 w-56 bg-[#1e1e1e] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-100">
                                        <div className="px-4 py-3 border-b border-slate-700/50">
                                            <div className="text-sm font-medium text-slate-200 truncate">{user.name}</div>
                                            <div className="text-xs text-slate-500 truncate">{user.email}</div>
                                        </div>
                                        <div className="py-1">
                                            <button
                                                onClick={() => { setProfileMenuOpen(false); navigate('/settings'); }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/40 transition-colors"
                                            >
                                                <Settings className="w-4 h-4 text-slate-400" />
                                                설정
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-slate-700/40 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                로그아웃
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => navigate('/login')}>
                                    로그인
                                </Button>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('/signup')}>
                                    회원가입
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex flex-col">
                {/* Hero Section */}
                <section id="hero" className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden shrink-0">
                    {/* Background Gradients */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" />

                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mt-[-4rem]">
                        함께 코딩하고,<br />함께 성장하세요.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
                        실시간 알고리즘 스터디 플랫폼 UJAX에서<br className="hidden md:block" />
                        팀원들과 함께 코드를 리뷰하고 성장하세요.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-4 z-10">
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
                    </div>

                    {/* 스크롤 화살표 */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 mx-auto animate-bounce z-20">
                        <button
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <ChevronDown className="w-6 h-6" />
                        </button>
                    </div>
                </section>

                {/* ═══ Features Section (두 번째 섹션) ═══ */}
                <section id="features" className="min-h-screen pt-24 pb-32 bg-[#0F1117] flex flex-col justify-center relative overflow-hidden shrink-0">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50"></div>
                    <div className="max-w-7xl mx-auto px-6 relative z-10 w-full mb-12">
                        <div className="text-center mb-16 mt-[-2rem]">
                            <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-slate-400">
                                왜 UJAX인가요?
                            </h2>
                            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                                성장에 필요한 모든 것을 담았습니다. 압도적인 몰입감과 실용성을 바탕으로 알고리즘 스터디의 새로운 표준을 제시합니다.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Card 1 */}
                            <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-indigo-500 hover:to-purple-500 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-indigo-500/25">
                                <div className="relative h-full bg-[#141820] p-8 rounded-2xl flex flex-col items-start overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/30 transition-colors duration-500"></div>
                                    <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-indigo-500/20">
                                        <Layout className="w-7 h-7 text-indigo-400 group-hover:text-indigo-300" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-slate-100 group-hover:text-white transition-colors">독립된 워크스페이스</h3>
                                    <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                                        스터디별로 완벽히 분리된 팀 공간을 제공합니다. 멤버 초대부터 문제집 공유, 공지사항 관리까지 스터디 운영이 한결 쉬워집니다.
                                    </p>
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-emerald-500 hover:to-teal-500 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-emerald-500/25">
                                <div className="relative h-full bg-[#141820] p-8 rounded-2xl flex flex-col items-start overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/30 transition-colors duration-500"></div>
                                    <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-emerald-500/20">
                                        <Code2 className="w-7 h-7 text-emerald-400 group-hover:text-emerald-300" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-slate-100 group-hover:text-white transition-colors">강력한 브라우저 IDE</h3>
                                    <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                                        번거로운 환경 설정 없이 브라우저에서 즉시 코딩을 시작하세요. 다크 테마, 문법 강조 및 코드 자동 완성을 지원하는 편집기를 경험할 수 있습니다.
                                    </p>
                                </div>
                            </div>

                            {/* Card 3 */}
                            <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-purple-500 hover:to-pink-500 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-purple-500/25">
                                <div className="relative h-full bg-[#141820] p-8 rounded-2xl flex flex-col items-start overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/30 transition-colors duration-500"></div>
                                    <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-purple-500/20">
                                        <Monitor className="w-7 h-7 text-purple-400 group-hover:text-purple-300" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-slate-100 group-hover:text-white transition-colors">실시간 코드 피드백</h3>
                                    <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                                        문제 풀이 결과를 투명하게 공유하고 동료들과 의견을 나눕니다. 집단 지성을 통한 코드 리뷰로 더 우수하고 효율적인 최적의 알고리즘을 발견하세요.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 스크롤 화살표 */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 mx-auto animate-bounce z-20">
                        <button
                            onClick={() => document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <ChevronDown className="w-6 h-6" />
                        </button>
                    </div>
                </section>

                {/* ═══ 탐색 섹션 (마지막 섹션) ═══ */}
                <section id="explore" className="min-h-screen py-16 bg-[#0a0d13] flex flex-col justify-center shrink-0 relative">
                    <div className="max-w-3xl mx-auto px-6 text-center w-full mt-[-2rem]">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
                            워크스페이스 탐색
                        </h2>
                        <p className="text-lg text-slate-400 mb-10">
                            공개 스터디를 찾아 참여하세요. 같은 목표를 가진 동료들과 함께 성장할 수 있습니다.
                        </p>

                        {/* 탐색 검색바 */}
                        <form onSubmit={handleExploreSearch} className="flex gap-3 max-w-xl mx-auto">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={exploreQuery}
                                    onChange={(e) => setExploreQuery(e.target.value)}
                                    placeholder="스터디 이름, 태그 검색..."
                                    className="w-full h-14 bg-[#141820] border border-slate-700 rounded-xl pl-12 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-lg"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg"
                            >
                                검색
                            </Button>
                        </form>

                        {/* 인기 태그 */}
                        <div className="flex flex-wrap gap-3 justify-center mt-8 cursor-pointer">
                            {['알고리즘', 'SSAFY', '코테대비', 'LeetCode', '대회준비'].map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                        setExploreQuery(tag);
                                        navigate(`/explore?q=${encodeURIComponent(tag)}`);
                                    }}
                                    className="px-4 py-2 text-sm rounded-full bg-slate-800 text-slate-400 border border-slate-700 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                >
                                    #{tag}
                                </button>
                            ))}
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

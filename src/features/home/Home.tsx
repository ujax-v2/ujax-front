import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import { userState, workspacesState, currentWorkspaceState, isCreateWorkspaceModalOpenState, Workspace } from '@/store/atoms';
import { getWorkspaces } from '@/api/workspace';
import { Button, Card } from '@/components/ui/Base';
import { useAuth } from '@/hooks/useAuth';
import { Code2, Users, Zap, Layout, Monitor, Search, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useT } from '@/i18n';

export const Home = () => {
    const navigate = useNavigate();
    const t = useT();
    const [user] = useRecoilState(userState);
    const [workspaces, setWorkspaces] = useRecoilState(workspacesState);
    const { logout } = useAuth();
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
        setProfileMenuOpen(false);
        await logout(user.refreshToken);
    };

    // 로그인 상태에서 워크스페이스 목록 fetch
    useEffect(() => {
        if (!user.isLoggedIn) return;
        if (workspaces.length > 0) return; // 이미 로드됨

        let cancelled = false;
        (async () => {
            try {
                const list = await getWorkspaces();
                if (cancelled) return;
                const items = (list ?? []).map((w) => ({
                    id: w.id,
                    name: w.name,
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
            <div className="min-h-screen bg-page flex items-center justify-center">
                <div className="text-text-muted">{t('home.loadingWorkspaces')}</div>
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
        <div className="h-full overflow-y-auto overflow-x-hidden scroll-smooth bg-page text-text-primary flex flex-col relative" id="home-scroll-container">
            {/* Navbar */}
            <nav className="border-b border-border-default bg-surface/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                            U
                        </div>
                        <span className="font-bold text-xl tracking-tight">UJAX</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {user.isLoggedIn ? (
                            <div className="relative" ref={profileMenuRef}>
                                <button
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-hover-bg transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white text-sm font-bold border border-indigo-600">
                                        {user.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-text-secondary hidden sm:block">{user.name}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {profileMenuOpen && (
                                    <div className="absolute right-0 top-12 w-56 bg-surface-overlay border border-border-subtle rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-100">
                                        <div className="px-4 py-3 border-b border-border-subtle/50">
                                            <div className="text-sm font-medium text-text-secondary truncate">{user.name}</div>
                                            <div className="text-xs text-text-faint truncate">{user.email}</div>
                                        </div>
                                        <div className="py-1">
                                            <button
                                                onClick={() => { setProfileMenuOpen(false); navigate('/settings'); }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:bg-hover-bg transition-colors"
                                            >
                                                <Settings className="w-4 h-4 text-text-muted" />
                                                {t('nav.settings')}
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-hover-bg transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                {t('nav.logout')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Button variant="ghost" className="text-text-muted hover:text-text-primary" onClick={() => navigate('/login')}>
                                    {t('auth.login')}
                                </Button>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('/signup')}>
                                    {t('auth.signup')}
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
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse" />

                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-muted mt-[-4rem]">
                        {t('home.heroTitle1')}<br />{t('home.heroTitle2')}
                    </h1>
                    <p className="text-lg md:text-xl text-text-muted max-w-2xl mb-10 leading-relaxed">
                        {t('home.heroSubtitle1')}<br className="hidden md:block" />
                        {t('home.heroSubtitle2')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-4 z-10">
                        {user.isLoggedIn ? (
                            <Button
                                className="h-12 px-8 text-lg bg-indigo-700 hover:bg-indigo-800 shadow-lg shadow-indigo-900/20"
                                onClick={() => setCreateWorkspaceOpen(true)}
                            >
                                <Zap className="w-5 h-5 mr-2" />
                                {t('home.ctaCreate')}
                            </Button>
                        ) : (
                            <Button
                                className="h-12 px-8 text-lg bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20"
                                onClick={() => navigate('/login')}
                            >
                                {t('home.ctaStart')}
                            </Button>
                        )}
                    </div>

                    {/* 스크롤 화살표 */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 mx-auto animate-bounce z-20">
                        <button
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="p-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-primary"
                        >
                            <ChevronDown className="w-6 h-6" />
                        </button>
                    </div>
                </section>

                {/* ═══ Features Section (두 번째 섹션) ═══ */}
                <section id="features" className="min-h-screen pt-24 pb-32 bg-page flex flex-col justify-center relative overflow-hidden shrink-0">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border-default to-transparent opacity-50"></div>
                    <div className="max-w-7xl mx-auto px-6 relative z-10 w-full mb-12">
                        <div className="text-center mb-16 mt-[-2rem]">
                            <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-text-primary via-indigo-600 dark:via-indigo-300 to-text-muted">
                                {t('home.whyUjax')}
                            </h2>
                            <p className="text-lg text-text-muted max-w-2xl mx-auto">
                                {t('home.whyUjaxDesc')}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Card 1 */}
                            <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-border-subtle to-surface-subtle dark:from-slate-800 dark:to-slate-900 hover:from-indigo-600 hover:to-purple-500 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-indigo-600/25">
                                <div className="relative h-full bg-surface p-8 rounded-2xl flex flex-col items-start overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-600/30 transition-colors duration-500"></div>
                                    <div className="w-14 h-14 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-indigo-600/20">
                                        <Layout className="w-7 h-7 text-indigo-700 dark:text-indigo-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-text-primary group-hover:text-text-primary transition-colors">{t('home.featureWorkspace')}</h3>
                                    <p className="text-text-muted leading-relaxed group-hover:text-text-secondary transition-colors">
                                        {t('home.featureWorkspaceDesc')}
                                    </p>
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-border-subtle to-surface-subtle dark:from-slate-800 dark:to-slate-900 hover:from-emerald-500 hover:to-teal-500 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-emerald-500/25">
                                <div className="relative h-full bg-surface p-8 rounded-2xl flex flex-col items-start overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/30 transition-colors duration-500"></div>
                                    <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-emerald-500/20">
                                        <Code2 className="w-7 h-7 text-emerald-400 group-hover:text-emerald-300" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-text-primary group-hover:text-text-primary transition-colors">{t('home.featureIde')}</h3>
                                    <p className="text-text-muted leading-relaxed group-hover:text-text-secondary transition-colors">
                                        {t('home.featureIdeDesc')}
                                    </p>
                                </div>
                            </div>

                            {/* Card 3 */}
                            <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-border-subtle to-surface-subtle dark:from-slate-800 dark:to-slate-900 hover:from-purple-500 hover:to-pink-500 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-purple-500/25">
                                <div className="relative h-full bg-surface p-8 rounded-2xl flex flex-col items-start overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/30 transition-colors duration-500"></div>
                                    <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-purple-500/20">
                                        <Monitor className="w-7 h-7 text-purple-400 group-hover:text-purple-300" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-text-primary group-hover:text-text-primary transition-colors">{t('home.featureFeedback')}</h3>
                                    <p className="text-text-muted leading-relaxed group-hover:text-text-secondary transition-colors">
                                        {t('home.featureFeedbackDesc')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 스크롤 화살표 */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 mx-auto animate-bounce z-20">
                        <button
                            onClick={() => document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })}
                            className="p-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-primary"
                        >
                            <ChevronDown className="w-6 h-6" />
                        </button>
                    </div>
                </section>

                {/* ═══ 탐색 섹션 (마지막 섹션) ═══ */}
                <section id="explore" className="min-h-screen py-16 bg-page-deep flex flex-col justify-center shrink-0 relative">
                    <div className="max-w-3xl mx-auto px-6 text-center w-full mt-[-2rem]">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            {t('home.exploreTitle')}
                        </h2>
                        <p className="text-lg text-text-muted mb-10">
                            {t('home.exploreDesc')}
                        </p>

                        {/* 탐색 검색바 */}
                        <form onSubmit={handleExploreSearch} className="flex gap-3 max-w-xl mx-auto">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-faint" />
                                <input
                                    type="text"
                                    value={exploreQuery}
                                    onChange={(e) => setExploreQuery(e.target.value)}
                                    placeholder={t('home.searchPlaceholder')}
                                    className="w-full h-14 bg-surface border border-border-subtle rounded-xl pl-12 pr-4 text-text-secondary placeholder:text-text-faint focus:outline-none focus:border-indigo-600 transition-colors shadow-lg"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="h-14 px-8 bg-indigo-700 hover:bg-indigo-800 text-white font-medium shadow-lg"
                            >
                                {t('common.search')}
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
                                    className="px-4 py-2 text-sm rounded-full bg-surface-subtle text-text-muted border border-border-subtle hover:border-indigo-600/50 hover:text-indigo-700 dark:hover:text-indigo-500 hover:bg-indigo-600/10 transition-colors"
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-border-default py-12 text-center text-text-faint text-sm">
                    <p>&copy; {new Date().getFullYear()} UJAX Platform. All rights reserved.</p>
                </footer>
            </main>
        </div>
    );
};

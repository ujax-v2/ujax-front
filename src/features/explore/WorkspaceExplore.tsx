import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { Card, Button, Badge } from '@/components/ui/Base';
import { Search, Users, Globe, Lock, ArrowRight } from 'lucide-react';
import { workspacesState, currentWorkspaceState } from '@/store/atoms';

/**
 * 워크스페이스 탐색 페이지
 *
 * - 검색바로 키워드 검색
 * - 공개 워크스페이스 목록 표시
 * - "참여하기" 버튼으로 워크스페이스 진입 (향후 구현)
 * - BE: GET /api/v1/workspaces/explore, GET /api/v1/workspaces/search
 */

// 목 데이터: 공개 워크스페이스들
const MOCK_PUBLIC_WORKSPACES = [
    {
        id: 'ws-pub-1',
        name: '알고리즘 초보 스터디',
        description: '프로그래밍을 처음 시작하는 분들을 위한 알고리즘 스터디입니다. 매주 3문제씩 함께 풀어봐요!',
        icon: '🌱',
        members: 23,
        isPublic: true,
        tags: ['초급', '알고리즘', '파이썬'],
        owner: 'studymaster',
        createdAt: '2024.01.15',
    },
    {
        id: 'ws-pub-2',
        name: 'SSAFY 10기 알고리즘반',
        description: 'SSAFY 10기생을 위한 알고리즘 문제풀이 스터디. 매일 1문제씩 도전!',
        icon: '🏫',
        members: 45,
        isPublic: true,
        tags: ['SSAFY', '코테대비', 'Java'],
        owner: 'ssafy_admin',
        createdAt: '2024.02.01',
    },
    {
        id: 'ws-pub-3',
        name: '카카오 코테 준비방',
        description: '카카오 공채 코딩테스트 기출문제를 분석하고 풀어보는 스터디',
        icon: '💛',
        members: 67,
        isPublic: true,
        tags: ['카카오', '기출분석', 'Gold+'],
        owner: 'kakao_lover',
        createdAt: '2024.01.20',
    },
    {
        id: 'ws-pub-4',
        name: 'LeetCode Daily Challenge',
        description: 'LeetCode 데일리 챌린지를 함께 풀며 영어 문제에 익숙해지기',
        icon: '🌍',
        members: 31,
        isPublic: true,
        tags: ['LeetCode', '영어', '해외취업'],
        owner: 'global_coder',
        createdAt: '2024.02.10',
    },
    {
        id: 'ws-pub-5',
        name: 'PS 고인물 모임',
        description: 'Diamond 이상 난이도 문제를 다루는 하드코어 PS 스터디. 주 5문제 필수!',
        icon: '💎',
        members: 12,
        isPublic: true,
        tags: ['고급', 'Diamond', 'Platinum'],
        owner: 'ps_master',
        createdAt: '2024.01.05',
    },
    {
        id: 'ws-pub-6',
        name: '대학생 알고리즘 동아리',
        description: 'ICPC 대비 알고리즘 훈련 모임. 대학생이라면 누구나 환영!',
        icon: '🎓',
        members: 56,
        isPublic: true,
        tags: ['ICPC', '대학생', '대회준비'],
        owner: 'univ_club',
        createdAt: '2023.12.01',
    },
];

export const WorkspaceExplore = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const myWorkspaces = useRecoilValue(workspacesState);
    const currentWsId = useRecoilValue(currentWorkspaceState);

    // URL 쿼리에서 초기 검색어 가져오기
    const initialQuery = searchParams.get('q') || '';
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [submittedQuery, setSubmittedQuery] = useState(initialQuery);

    // 검색 실행
    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        setSubmittedQuery(searchQuery);
        // URL에 검색어 반영 (히스토리 관리)
        navigate(`/explore?q=${encodeURIComponent(searchQuery)}`, { replace: true });
    };

    // 검색 필터링 (향후 BE API 호출로 대체)
    const filteredWorkspaces = useMemo(() => {
        if (!submittedQuery.trim()) return MOCK_PUBLIC_WORKSPACES;
        const q = submittedQuery.toLowerCase();
        return MOCK_PUBLIC_WORKSPACES.filter(
            ws =>
                ws.name.toLowerCase().includes(q) ||
                ws.description.toLowerCase().includes(q) ||
                ws.tags.some(tag => tag.toLowerCase().includes(q))
        );
    }, [submittedQuery]);

    // 이미 참여 중인 WS인지 확인
    const isJoined = (wsId: string) => myWorkspaces.some(w => w.id === wsId);

    const handleJoin = (wsId: string, wsName: string) => {
        if (isJoined(wsId)) {
            navigate(`/ws/${wsId}/dashboard`);
        } else {
            // TODO: BE API 연동 — POST /api/v1/workspaces/{wsId}/join
            alert(`"${wsName}" 워크스페이스 참여 기능은 준비 중입니다.`);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#0F1117] p-8 pb-24">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* 헤더 */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">워크스페이스 탐색</h1>
                    <p className="text-slate-400 mt-1">공개 워크스페이스를 탐색하고 원하는 스터디에 참여하세요.</p>
                </div>

                {/* 검색바 */}
                <form onSubmit={handleSearch} className="relative">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="워크스페이스 이름, 태그, 키워드로 검색..."
                                className="w-full h-12 bg-[#141820] border border-slate-800 rounded-xl pl-12 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            검색
                        </Button>
                    </div>
                </form>

                {/* 검색 결과 정보 */}
                {submittedQuery && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                            "<span className="text-slate-200 font-medium">{submittedQuery}</span>" 검색 결과 · {filteredWorkspaces.length}개
                        </p>
                        {submittedQuery && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSubmittedQuery('');
                                    navigate('/explore', { replace: true });
                                }}
                                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                검색 초기화
                            </button>
                        )}
                    </div>
                )}

                {/* 워크스페이스 카드 목록 */}
                <div className="grid gap-4">
                    {filteredWorkspaces.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-slate-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-300 mb-2">검색 결과가 없습니다</h3>
                            <p className="text-slate-500">다른 키워드로 검색해보세요.</p>
                        </div>
                    ) : (
                        filteredWorkspaces.map((ws) => (
                            <div
                                key={ws.id}
                                className="group bg-[#141820] border border-slate-800 rounded-xl p-6 hover:border-slate-700 hover:bg-slate-800/30 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    {/* 아이콘 */}
                                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-slate-700 transition-colors">
                                        {ws.icon}
                                    </div>

                                    {/* 정보 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-semibold text-slate-100 group-hover:text-white transition-colors truncate">
                                                {ws.name}
                                            </h3>
                                            {ws.isPublic ? (
                                                <Globe className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                            ) : (
                                                <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">{ws.description}</p>

                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                {ws.members}명
                                            </span>
                                            <span>· {ws.owner}</span>
                                            <span>· {ws.createdAt}</span>
                                        </div>

                                        {/* 태그 */}
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {ws.tags.map(tag => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-0.5 text-xs rounded bg-slate-800 text-slate-400 border border-slate-700 cursor-pointer hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
                                                    onClick={() => {
                                                        setSearchQuery(tag);
                                                        setSubmittedQuery(tag);
                                                        navigate(`/explore?q=${encodeURIComponent(tag)}`, { replace: true });
                                                    }}
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 참여 버튼 */}
                                    <div className="flex-shrink-0">
                                        {isJoined(ws.id) ? (
                                            <Button
                                                variant="secondary"
                                                className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                                                onClick={() => navigate(`/ws/${ws.id}/dashboard`)}
                                            >
                                                이동하기
                                                <ArrowRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        ) : (
                                            <Button
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                onClick={() => handleJoin(ws.id, ws.name)}
                                            >
                                                참여하기
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

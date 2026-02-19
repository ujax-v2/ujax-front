import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { currentWorkspaceState } from '@/store/atoms';

/**
 * 워크스페이스 스코프 네비게이션 훅
 *
 * 현재 워크스페이스 ID를 자동으로 포함하여 /ws/:wsId/... 경로를 생성
 * - toWs('problems')  → /ws/ws-1/problems
 * - toWs('problems/new') → /ws/ws-1/problems/new
 * - 글로벌 경로는 기존 navigate를 그대로 사용
 */
export function useWorkspaceNavigate() {
    const navigate = useNavigate();
    const currentWsId = useRecoilValue(currentWorkspaceState);

    /** 워크스페이스 스코프 경로로 이동 */
    const toWs = (subpath: string) => {
        navigate(`/ws/${currentWsId}/${subpath}`);
    };

    return { navigate, toWs, currentWsId };
}

import { useRecoilState } from 'recoil';
import { themeState, ThemeMode } from '@/store/atoms';

export const GeneralTab = () => {
  const [theme, setTheme] = useRecoilState(themeState);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-text-primary pb-4 border-b border-border-default">기본 설정</h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium text-text-secondary">테마</div>
            <div className="text-xs text-text-faint">내 기기에서 UJAX의 모습을 마음껏 바꿔보세요.</div>
          </div>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeMode)}
            className="bg-transparent border border-border-subtle rounded px-2 py-1 text-sm text-text-secondary"
          >
            <option value="system">시스템 설정 사용</option>
            <option value="light">라이트 모드</option>
            <option value="dark">다크 모드</option>
          </select>
        </div>

        <div className="pt-6 border-t border-border-default">
          <h3 className="text-sm font-bold text-text-secondary mb-4">언어 및 시간</h3>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium text-text-secondary">언어</div>
              <div className="text-xs text-text-faint">UJAX에서 사용하는 언어를 변경하세요.</div>
            </div>
            <select className="bg-transparent border border-border-subtle rounded px-2 py-1 text-sm text-text-secondary">
              <option>한국어</option>
              <option>English</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 mt-4">
            <div>
              <div className="text-sm font-medium text-text-secondary">텍스트 방향 제어 항상 표시</div>
              <div className="text-xs text-text-faint max-w-md">언어가 왼쪽에서 오른쪽으로 표시되는 경우에도 편집기 메뉴에 텍스트 방향(LTR/RTL)을 변경하는 옵션을 표시합니다.</div>
            </div>
            <div className="relative inline-block w-10 h-5 transition duration-200 ease-in-out">
              <input type="checkbox" className="peer absolute opacity-0 w-0 h-0" />
              <label className="block w-10 h-5 bg-border-subtle rounded-full cursor-pointer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:left-[22px]"></label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

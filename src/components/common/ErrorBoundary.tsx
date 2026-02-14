import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * 전역 에러 바운더리
 * 렌더링 중 발생하는 예외를 포착하여 흰 화면 방지 및 복구 UI 제공
 */
class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    // 로컬 스토리지 데이터 오염으로 인한 에러일 수 있으므로 초기화 시도
    handleReset = () => {
        try {
            localStorage.removeItem('auth');
            sessionStorage.clear();
            window.location.href = '/';
        } catch (e) {
            window.location.reload();
        }
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F1117] text-white p-4">
                    <div className="max-w-md w-full bg-[#141820] border border-slate-800 rounded-xl p-8 shadow-2xl text-center space-y-6">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-3xl">⚠️</span>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-slate-100 mb-2">예기치 못한 오류가 발생했습니다</h2>
                            <p className="text-sm text-slate-400">
                                죄송합니다. 요청을 처리하는 중에 문제가 발생했습니다.<br />
                                지속적으로 발생할 경우 캐시를 삭제해 보세요.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="text-left bg-black/50 p-4 rounded text-xs font-mono text-red-300 overflow-auto max-h-32">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                            >
                                페이지 새로고침
                            </button>

                            <button
                                onClick={this.handleReset}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors text-sm"
                            >
                                초기화 후 메인으로 (로그아웃)
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

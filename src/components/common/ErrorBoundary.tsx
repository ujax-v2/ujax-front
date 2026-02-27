import React, { Component, ErrorInfo, ReactNode } from 'react';
import { getT } from '@/i18n';

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

            const t = getT();

            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-page text-text-primary p-4">
                    <div className="max-w-md w-full bg-surface border border-border-default rounded-xl p-8 shadow-2xl text-center space-y-6">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-3xl">⚠️</span>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-text-primary mb-2">{t('error.unexpectedError')}</h2>
                            <p className="text-sm text-text-muted whitespace-pre-line">
                                {t('error.unexpectedErrorDesc')}
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="text-left bg-black/50 p-4 rounded text-xs font-mono text-red-600 dark:text-red-300 overflow-auto max-h-32">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                            >
                                {t('error.refreshPage')}
                            </button>

                            <button
                                onClick={this.handleReset}
                                className="w-full py-3 bg-surface-subtle hover:bg-border-subtle text-text-secondary font-medium rounded-lg transition-colors text-sm"
                            >
                                {t('error.resetAndGoHome')}
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

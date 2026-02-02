import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-50 p-4">
                    <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
                        <div className="bg-red-500 p-6 text-white">
                            <h2 className="text-2xl font-bold">오류가 발생했습니다 🚨</h2>
                            <p className="opacity-90 mt-1">프로그램 실행 중 예상치 못한 문제가 발생했습니다.</p>
                        </div>
                        <div className="p-6">
                            <h3 className="font-semibold text-gray-700 mb-2">에러 메시지:</h3>
                            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm text-red-600 mb-6 overflow-auto">
                                {this.state.error?.toString()}
                            </div>

                            <div className="border-t pt-6 bg-gray-50 -mx-6 -mb-6 px-6 pb-6">
                                <p className="text-sm text-gray-500 mb-4">
                                    아래 해결 방법을 시도해보세요:
                                </p>
                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-2 mb-6">
                                    <li>브라우저를 <strong>새로고침(F5)</strong> 해보세요.</li>
                                    <li>개발자 도구(F12)의 콘솔 탭을 확인해보세요.</li>
                                    <li>로컬 스토리지를 초기화해보세요 (Application 탭 → Local Storage → Clear).</li>
                                </ul>
                                <button
                                    onClick={() => {
                                        localStorage.clear();
                                        window.location.reload();
                                    }}
                                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    데이터 초기화 및 새로고침
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

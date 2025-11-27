import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('خطأ في التطبيق:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
          <div className="bg-red-900/20 border-2 border-red-600/50 rounded-2xl p-8 max-w-md w-full backdrop-blur-sm">
            <div className="flex items-center justify-center w-16 h-16 bg-red-600/20 rounded-full mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-200 mb-3 text-center">
              ⚠️ حدث خطأ غير متوقع
            </h2>
            <p className="text-red-100 mb-6 text-center">
              {this.state.error?.message || 'خطأ غير معروف'}
            </p>
            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

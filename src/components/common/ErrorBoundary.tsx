import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('AmarSchool Handled UI Error:', error?.message, errorInfo?.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearAndReload = () => {
    try {
      // Clear possible corrupted session caches
      sessionStorage.clear();
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl border border-rose-100 p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800">
                {this.props.fallbackTitle || 'একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে'}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                সিস্টেমে কোনো ডেটা বা স্ক্রিন লোডিং ত্রুটি হয়েছিল, তবে সমস্ত তথ্য সুরক্ষিত রয়েছে। নিচে ক্লিক করে পুনরায় লোড করুন।
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left">
                <p className="text-xs font-mono text-slate-600 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                পুনরায় পেজ লোড করুন
              </button>
              <button
                type="button"
                onClick={this.handleClearAndReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
              >
                <Home className="w-4 h-4" />
                মূল পাতায় যান
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

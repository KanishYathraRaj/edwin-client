"use client";

import { Component, ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; message: string; }

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, message: "" };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error) {
        console.error("ErrorBoundary caught:", error);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div className="flex items-center justify-center min-h-[60vh] px-6">
                    <div className="max-w-md text-center space-y-4">
                        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
                        <p className="text-gray-500 text-sm">{this.state.message || "An unexpected error occurred."}</p>
                        <button
                            onClick={() => this.setState({ hasError: false, message: "" })}
                            className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChange } from "@/lib/firebase/auth";
import Sidebar from "@/components/sidebar/Sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2, PanelLeftOpen } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [authChecked, setAuthChecked] = useState(false);
    const [authed, setAuthed] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem("sidebarCollapsed");
        if (stored === "true") setCollapsed(true);
    }, []);

    const toggleSidebar = () => {
        setCollapsed(c => {
            localStorage.setItem("sidebarCollapsed", String(!c));
            return !c;
        });
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            if (user) {
                setAuthed(true);
            } else {
                router.replace("/auth");
            }
            setAuthChecked(true);
        });
        return () => unsubscribe();
    }, [router]);

    if (!authChecked) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!authed) return null;

    return (
        <div className="flex h-screen overflow-hidden">
            <div className={`relative flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${collapsed ? "w-0" : "w-64"}`}>
                <Sidebar onToggle={toggleSidebar} />
            </div>
            <main className="flex-1 overflow-y-auto relative">
                {collapsed && (
                    <button
                        onClick={toggleSidebar}
                        aria-label="Open sidebar"
                        className="absolute top-4 left-4 z-10 p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:shadow-sm transition-all"
                    >
                        <PanelLeftOpen className="w-4 h-4" />
                    </button>
                )}
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            </main>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChange } from "@/lib/firebase/auth";
import Sidebar from "@/components/sidebar/Sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2, PanelLeftOpen } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [authChecked, setAuthChecked] = useState(false);
    const [authed, setAuthed] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setCollapsed(true);
            }
        };
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        if (!isMobile) {
            const stored = localStorage.getItem("sidebarCollapsed");
            setCollapsed(stored === "true");
        }
    }, [isMobile]);

    // Auto-close drawer on mobile when navigating
    useEffect(() => {
        if (isMobile) setCollapsed(true);
    }, [pathname, isMobile]);

    const toggleSidebar = () => {
        setCollapsed(c => {
            if (!isMobile) localStorage.setItem("sidebarCollapsed", String(!c));
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

    const sidebarOpen = !collapsed;

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Mobile backdrop */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar wrapper — drawer on mobile, inline on desktop */}
            <div className={
                isMobile
                    ? `fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
                    : `relative flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${sidebarOpen ? "w-64" : "w-0"}`
            }>
                <Sidebar onToggle={toggleSidebar} />
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Reopen button — desktop collapsed or mobile always */}
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

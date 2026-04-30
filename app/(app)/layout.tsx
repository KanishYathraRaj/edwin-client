"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChange } from "@/lib/firebase/auth";
import Sidebar from "@/components/sidebar/Sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [authChecked, setAuthChecked] = useState(false);
    const [authed, setAuthed] = useState(false);
    const router = useRouter();

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
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            </main>
        </div>
    );
}

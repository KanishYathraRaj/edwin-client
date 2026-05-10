"use client";

import { useState, useEffect } from "react";
import SidebarCourseItem from "./SidebarCourseItem";
import CourseSwitcher from "./CourseSwitcher";
import Link from "next/link";
import { onAuthStateChange, signOutUser } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Settings, LogOut, PanelLeftClose } from "lucide-react";

interface Course { id: string; name: string; }

interface Props { onToggle: () => void; }

export default function Sidebar({ onToggle }: Props) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();

    const currentCourseId = params.courseId as string | undefined;

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (u) => {
            setUser(u);
            if (u) {
                const { getUserCourses } = await import("@/lib/firebase/firestore");
                setCourses(await getUserCourses(u.uid));
            } else {
                setCourses([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOutUser();
            router.push("/auth");
        } catch (e) {
            console.error("Logout failed:", e);
        }
    };

    return (
        <div className="w-64 h-screen bg-gray-50 border-r flex flex-col font-sans">
            {/* Header */}
            <div className="px-4 pt-5 pb-4 border-b bg-white space-y-3">
                <div className="flex items-center justify-between px-1">
                    <p className="text-lg font-extrabold text-gray-900 tracking-tight">Edwin AI</p>
                    <button
                        onClick={onToggle}
                        aria-label="Collapse sidebar"
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>
                <CourseSwitcher
                    courses={courses}
                    currentCourseId={currentCourseId}
                    userId={user?.uid ?? ""}
                    onCourseCreated={(course) => setCourses(prev => [course, ...prev])}
                />
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto py-3">
                <div className="px-3 mb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1.5 flex items-center justify-between">
                        <span>Course</span>
                        {!currentCourseId && <span className="text-[9px] text-gray-300">Select above</span>}
                    </p>
                    <div className={`transition-opacity duration-200 ${!currentCourseId ? "opacity-40 pointer-events-none select-none" : ""}`}>
                        <SidebarCourseItem courseId={currentCourseId || "__none__"} />
                    </div>
                </div>
            </div>

            {/* Account Footer */}
            <div className="p-4 border-t bg-white">
                {user && (
                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Account</p>
                            <div className="flex items-center gap-0.5">
                                <Link
                                    href="/settings"
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    aria-label="Settings"
                                >
                                    <Settings className="w-4 h-4" />
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    aria-label="Log out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-xs font-semibold text-gray-700 truncate" title={user.email || ""}>
                            {user.email}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

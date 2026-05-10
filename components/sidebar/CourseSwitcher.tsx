"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Check, Loader2, BookOpen, X } from "lucide-react";
import { createCourse, getUserCourses } from "@/lib/firebase/firestore";

interface Course { id: string; name: string; }

interface Props {
    courses: Course[];
    currentCourseId?: string;
    userId: string;
    onCourseCreated: (course: Course) => void;
}

export default function CourseSwitcher({ courses, currentCourseId, userId, onCourseCreated }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const current = courses.find(c => c.id === currentCourseId);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setIsCreating(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (isCreating) setTimeout(() => inputRef.current?.focus(), 50);
    }, [isCreating]);

    const handleSelect = (courseId: string) => {
        setIsOpen(false);
        router.push(`/course/${courseId}`);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setCreating(true);
        setCreateError("");
        try {
            const created = await createCourse(userId, newTitle.trim());
            if (created) {
                onCourseCreated(created);
                setNewTitle("");
                setIsCreating(false);
                setIsOpen(false);
                router.push(`/course/${created.id}`);
            } else {
                setCreateError("Failed to create. Try again.");
            }
        } catch {
            setCreateError("Something went wrong.");
        } finally {
            setCreating(false);
        }
    };

    const avatar = (name: string) => name.charAt(0).toUpperCase();

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger */}
            <button
                onClick={() => { setIsOpen(o => !o); setIsCreating(false); }}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all duration-150 text-left group ${
                    isOpen ? "bg-blue-50/80" : "hover:bg-gray-100/80"
                }`}
            >
                {current ? (
                    <>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                            {avatar(current.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{current.name}</p>
                            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">Switch course</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-400 leading-tight">Select a course</p>
                        </div>
                    </>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/60 z-50 overflow-hidden">
                    {/* Course list */}
                    {courses.length > 0 && (
                        <div className="max-h-52 overflow-y-auto py-1.5">
                            {courses.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handleSelect(c.id)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                        {avatar(c.name)}
                                    </div>
                                    <span className={`flex-1 text-sm truncate ${c.id === currentCourseId ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                                        {c.name}
                                    </span>
                                    {c.id === currentCourseId && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Divider */}
                    {courses.length > 0 && <div className="h-px bg-gray-100 mx-3" />}

                    {/* New Course */}
                    {isCreating ? (
                        <form onSubmit={handleCreate} className="p-3 space-y-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="Course title..."
                                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                disabled={creating}
                            />
                            {createError && <p className="text-xs text-red-500 font-medium">{createError}</p>}
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={creating || !newTitle.trim()}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg transition-colors"
                                >
                                    {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsCreating(false); setNewTitle(""); setCreateError(""); }}
                                    className="px-2.5 py-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-blue-600 hover:bg-blue-50 transition-colors text-left"
                        >
                            <div className="w-6 h-6 rounded-md border-2 border-dashed border-blue-300 flex items-center justify-center flex-shrink-0">
                                <Plus className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-semibold">New Course</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

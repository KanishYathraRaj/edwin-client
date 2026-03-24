"use client";

import { useState, useEffect } from "react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { getUserCourses, createCourse, deleteCourse, Course } from "@/lib/firebase/firestore";
import { User } from "firebase/auth";
import { Plus, Trash2, BookOpen, Clock, Users, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newCourseTitle, setNewCourseTitle] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const fetchedCourses = await getUserCourses(currentUser.uid);
                setCourses(fetchedCourses);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newCourseTitle.trim()) return;

        setActionLoading("create");
        const newCourse = await createCourse(user.uid, newCourseTitle);
        if (newCourse) {
            setCourses([...courses, newCourse]);
            setNewCourseTitle("");
            setIsCreating(false);
        }
        setActionLoading(null);
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (!user) return;
        
        if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;

        setActionLoading(courseId);
        const success = await deleteCourse(user.uid, courseId);
        if (success) {
            setCourses(courses.filter(c => c.id !== courseId));
        }
        setActionLoading(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center p-12">
                <h2 className="text-2xl font-bold text-gray-900">Please log in to view your dashboard</h2>
                <Link href="/auth" className="text-blue-600 hover:underline mt-4 inline-block font-medium">
                    Go to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                       Dashboard
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Manage your courses and AI-powered workflows here.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    New Course
                </button>
            </div>

            {/* Courses Grid */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Your Courses</h2>
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Recent
                    </span>
                </div>

                {courses.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">No courses yet</h3>
                        <p className="text-gray-500 mt-2 mb-6 font-medium">Create your first course to start using Edwin AI's workflows.</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="text-blue-600 font-bold hover:underline"
                        >
                            + Create a course
                        </button>
                    </div>
                ) : (
                   <div className="space-y-4">
                        {courses.map((course, index) => (
                            <div
                                key={course.id}
                                className="flex items-center justify-between p-5 rounded-2xl bg-white/80 backdrop-blur border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-200 group"
                            >
                                {/* LEFT */}
                                <div className="flex items-center gap-4">
                                    {/* Icon */}
                                    <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center font-semibold shadow-sm">
                                        {course.name.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                                            {course.name}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Last accessed recently
                                        </p>
                                    </div>
                                </div>

                                {/* RIGHT */}
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/course/${course.id}/agent-chat`}
                                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium flex items-center gap-1 transition-all hover:bg-gray-900 hover:text-white"
                                    >
                                        Open
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>

                                    <button
                                        onClick={() => handleDeleteCourse(course.id)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Course Modal Overlay */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200 border">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-gray-900">Create New Course</h3>
                            <p className="text-gray-500 text-sm mt-1 font-medium">Start by giving your course a title.</p>
                        </div>
                        
                        <form onSubmit={handleCreateCourse} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                    Course Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={newCourseTitle}
                                    onChange={(e) => setNewCourseTitle(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-bold text-gray-900"
                                    placeholder="e.g. Mathematics Grade 10"
                                    disabled={actionLoading === "create"}
                                />
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading === "create"}
                                    className="flex-[2] py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-blue-400"
                                >
                                    {actionLoading === "create" ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Course"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
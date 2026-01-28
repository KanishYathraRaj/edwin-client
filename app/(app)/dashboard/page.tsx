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
                        Welcome back, <span className="text-blue-600">{user.email?.split('@')[0]}</span>
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Manage your courses and AI-powered workflows here.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-200 hover:scale-[1.02] transition-all active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5" />
                    Create New Course
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:shadow-md group">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 transition-transform group-hover:scale-110">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Active Courses</p>
                    <h3 className="text-3xl font-bold mt-1 text-gray-900">{courses.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:shadow-md group">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4 transition-transform group-hover:scale-110">
                        <Clock className="w-6 h-6" />
                    </div>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Workflows Run</p>
                    <h3 className="text-3xl font-bold mt-1 text-gray-900">12</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:shadow-md group">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4 transition-transform group-hover:scale-110">
                        <Users className="w-6 h-6" />
                    </div>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Students Enrolled</p>
                    <h3 className="text-3xl font-bold mt-1 text-gray-900">120</h3>
                </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div 
                                key={course.id}
                                className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-6 flex flex-col justify-end transition-colors group-hover:from-blue-500/20 group-hover:to-indigo-500/20">
                                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2" title={course.name}>
                                        {course.name}
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 font-semibold">
                                        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                            <Clock className="w-4 h-4 text-gray-400" /> 5 tasks
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                            <Users className="w-4 h-4 text-gray-400" /> 32 students
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <Link 
                                            href={`/course/${course.id}/agent-chat`}
                                            className="flex-1 bg-gray-50 hover:bg-blue-600 hover:text-white text-gray-700 py-3 rounded-xl text-center font-bold text-sm transition-all flex items-center justify-center gap-2 group/btn shadow-sm"
                                        >
                                            View Course
                                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                        <button 
                                            onClick={() => handleDeleteCourse(course.id)}
                                            disabled={actionLoading === course.id}
                                            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                            title="Delete Course"
                                        >
                                            {actionLoading === course.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
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
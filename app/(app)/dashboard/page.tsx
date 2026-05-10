"use client";

import { useState, useEffect } from "react";
import { BookOpen, MessageSquare, FileText, BrainCircuit, HelpCircle, LayoutGrid, Sparkles } from "lucide-react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { getUserCourses } from "@/lib/firebase/firestore";

const FEATURES = [
    {
        icon: <MessageSquare className="w-6 h-6" />,
        label: "Agent Chat",
        desc: "Have a conversation with your course AI. Ask questions, get explanations, and explore your material.",
        color: "bg-blue-50 text-blue-600",
    },
    {
        icon: <BookOpen className="w-6 h-6" />,
        label: "Lesson Planner",
        desc: "Generate structured, week-by-week lesson plans from your syllabus in seconds.",
        color: "bg-indigo-50 text-indigo-600",
    },
    {
        icon: <FileText className="w-6 h-6" />,
        label: "Content Preparation",
        desc: "Create reading materials, summaries, and handouts tailored to your students.",
        color: "bg-purple-50 text-purple-600",
    },
    {
        icon: <BrainCircuit className="w-6 h-6" />,
        label: "Quiz Generation",
        desc: "Instantly build assessments and quizzes from your course content.",
        color: "bg-orange-50 text-orange-600",
    },
    {
        icon: <HelpCircle className="w-6 h-6" />,
        label: "Question Bank",
        desc: "Maintain a reusable library of questions across all your courses.",
        color: "bg-green-50 text-green-600",
    },
];

export default function HomePage() {
    const [hasCourses, setHasCourses] = useState<boolean | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChange(async (user) => {
            if (user) {
                const courses = await getUserCourses(user.uid);
                setHasCourses(courses.length > 0);
            } else {
                setHasCourses(false);
            }
        });
        return () => unsub();
    }, []);

    if (hasCourses === null) return null;

    if (!hasCourses) {
        return (
            <div className="flex flex-col items-center justify-center min-h-full p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mb-6">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                    Welcome to Edwin AI
                </h1>
                <p className="text-gray-500 text-base max-w-md mb-3">
                    Create your first course to get started. Use the course switcher in the top-left of the sidebar.
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 px-4 py-2 rounded-full border border-blue-100 mb-10">
                    <span className="text-base">←</span> Click the course switcher above to create a course
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl w-full text-left opacity-50 pointer-events-none select-none">
                    {FEATURES.map((f) => (
                        <div key={f.label} className="p-5 rounded-2xl border border-gray-100 bg-white">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                                {f.icon}
                            </div>
                            <h3 className="font-bold text-gray-900 text-sm mb-1">{f.label}</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mb-6">
                <LayoutGrid className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                Welcome to Edwin AI
            </h1>
            <p className="text-gray-500 text-base max-w-md mb-10">
                Select a course from the sidebar to get started, or create a new one using the course switcher above.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl w-full text-left">
                {FEATURES.map((f) => (
                    <div
                        key={f.label}
                        className="p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                            {f.icon}
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm mb-1">{f.label}</h3>
                        <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import { BookOpen, MessageSquare, FileText, BrainCircuit, HelpCircle, LayoutGrid } from "lucide-react";

const FEATURES = [
    {
        icon: <MessageSquare className="w-6 h-6" />,
        label: "Agent Chat",
        desc: "Have a conversation with your course AI. Ask questions, get explanations, and explore your material.",
        color: "bg-blue-50 text-blue-600",
        slug: "agent-chat",
    },
    {
        icon: <BookOpen className="w-6 h-6" />,
        label: "Lesson Planner",
        desc: "Generate structured, week-by-week lesson plans from your syllabus in seconds.",
        color: "bg-indigo-50 text-indigo-600",
        slug: "lesson-planner",
    },
    {
        icon: <FileText className="w-6 h-6" />,
        label: "Content Preparation",
        desc: "Create reading materials, summaries, and handouts tailored to your students.",
        color: "bg-purple-50 text-purple-600",
        slug: "content-prep",
    },
    {
        icon: <BrainCircuit className="w-6 h-6" />,
        label: "Quiz Generation",
        desc: "Instantly build assessments and quizzes from your course content.",
        color: "bg-orange-50 text-orange-600",
        slug: "quiz-gen",
    },
    {
        icon: <HelpCircle className="w-6 h-6" />,
        label: "Question Bank",
        desc: "Maintain a reusable library of questions across all your courses.",
        color: "bg-green-50 text-green-600",
        slug: "question-bank",
    },
];

export default function HomePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-full p-10 text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mb-6">
                <LayoutGrid className="w-8 h-8 text-white" />
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                Welcome to Edwin AI
            </h1>
            <p className="text-gray-500 text-base max-w-md mb-10">
                Select a course from the sidebar to get started, or create a new one using the course switcher above.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl w-full text-left">
                {FEATURES.map((f) => (
                    <div
                        key={f.slug}
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

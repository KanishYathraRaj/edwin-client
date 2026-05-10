"use client";

import { useState, useEffect, use } from "react";
import {
    MessageSquare, BookOpen, FileText, BrainCircuit,
    Database, HelpCircle, CheckCircle2, ArrowRight,
    Loader2, Sparkles, LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getCourseDetails, getSavedPreparedContent } from "@/lib/firebase/firestore";
import { apiGet } from "@/lib/api";

interface CourseStats {
    title: string;
    createdAt: Date | null;
    hasSyllabus: boolean;
    referenceCount: number;
    lessonPlanUnits: number;
    lessonPlanTopics: number;
    preparedContentCount: number;
    questionBankCount: number;
    chatExchanges: number;
}

const FEATURE_CARDS = [
    {
        id: "resources",
        label: "Resources",
        description: "Manage syllabus and course materials",
        icon: Database,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        getStatus: (s: CourseStats) =>
            s.hasSyllabus
                ? `Syllabus uploaded${s.referenceCount > 0 ? ` · ${s.referenceCount} reference${s.referenceCount !== 1 ? "s" : ""}` : ""}`
                : "No files uploaded yet",
        isDone: (s: CourseStats) => s.hasSyllabus,
    },
    {
        id: "lesson-planner",
        label: "Lesson Planner",
        description: "AI-structured lesson plan from your materials",
        icon: BookOpen,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        getStatus: (s: CourseStats) =>
            s.lessonPlanUnits > 0
                ? `${s.lessonPlanUnits} unit${s.lessonPlanUnits !== 1 ? "s" : ""} · ${s.lessonPlanTopics} topics`
                : "Plan not generated yet",
        isDone: (s: CourseStats) => s.lessonPlanUnits > 0,
    },
    {
        id: "content-prep",
        label: "Content Prep",
        description: "AI-written materials for each topic",
        icon: FileText,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        getStatus: (s: CourseStats) =>
            s.preparedContentCount > 0
                ? `${s.preparedContentCount} material${s.preparedContentCount !== 1 ? "s" : ""} prepared`
                : "No content prepared yet",
        isDone: (s: CourseStats) => s.preparedContentCount > 0,
    },
    {
        id: "question-bank",
        label: "Question Bank",
        description: "Persistent bank of saved questions",
        icon: HelpCircle,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        getStatus: (s: CourseStats) =>
            s.questionBankCount > 0
                ? `${s.questionBankCount} question${s.questionBankCount !== 1 ? "s" : ""}`
                : "No questions yet",
        isDone: (s: CourseStats) => s.questionBankCount > 0,
    },
    {
        id: "quiz-gen",
        label: "Quiz Generation",
        description: "Generate interactive practice quizzes",
        icon: BrainCircuit,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
        getStatus: (_s: CourseStats) => "Generate on demand",
        isDone: (_s: CourseStats) => false,
    },
    {
        id: "agent-chat",
        label: "AI Chat",
        description: "Ask Edwin anything about your course",
        icon: MessageSquare,
        color: "text-green-600",
        bgColor: "bg-green-50",
        getStatus: (s: CourseStats) =>
            s.chatExchanges > 0
                ? `${s.chatExchanges} conversation${s.chatExchanges !== 1 ? "s" : ""}`
                : "No conversations yet",
        isDone: (s: CourseStats) => s.chatExchanges > 0,
    },
] as const;

const PROGRESS_STEPS = FEATURE_CARDS.filter(f => f.id !== "quiz-gen");

export default function CourseOverview({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = use(params);
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<CourseStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChange(u => setUser(u));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!user || !courseId) return;
        (async () => {
            setIsLoading(true);
            try {
                const [courseData, preparedContent, qbResult] = await Promise.all([
                    getCourseDetails(user.uid, courseId),
                    getSavedPreparedContent(user.uid, courseId),
                    apiGet(`/question-bank?courseId=${encodeURIComponent(courseId)}`).catch(() => ({ questions: [] })),
                ]);

                const planUnits: any[] = courseData?.lessonPlan?.syllabus ?? [];

                setStats({
                    title: courseData?.title || "Untitled Course",
                    createdAt: courseData?.createdAt?.toDate?.() ?? null,
                    hasSyllabus: !!courseData?.syllabus,
                    referenceCount: (courseData?.references ?? []).length,
                    lessonPlanUnits: planUnits.length,
                    lessonPlanTopics: planUnits.reduce((acc: number, u: any) => acc + (u.topics?.length ?? 0), 0),
                    preparedContentCount: preparedContent.length,
                    questionBankCount: (qbResult.questions ?? []).length,
                    chatExchanges: Math.floor((courseData?.history ?? []).length / 2),
                });
            } catch {
                setStats({
                    title: courseId, createdAt: null, hasSyllabus: false, referenceCount: 0,
                    lessonPlanUnits: 0, lessonPlanTopics: 0, preparedContentCount: 0,
                    questionBankCount: 0, chatExchanges: 0,
                });
            } finally {
                setIsLoading(false);
            }
        })();
    }, [user, courseId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!stats) return null;

    const completedSteps = PROGRESS_STEPS.filter(f => f.isDone(stats)).length;
    const totalSteps = PROGRESS_STEPS.length;
    const progressPct = Math.round((completedSteps / totalSteps) * 100);
    const isComplete = completedSteps === totalSteps;

    return (
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

            {/* Course header */}
            <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-200 flex-shrink-0">
                    {stats.title.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {stats.title}
                        <LayoutGrid className="w-5 h-5 text-gray-300" />
                    </h1>
                    {stats.createdAt && (
                        <p className="text-sm text-gray-400 mt-0.5">
                            Created {stats.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                    )}
                </div>
            </div>

            {/* Progress card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Setup Progress</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {completedSteps} of {totalSteps} workflows activated
                        </p>
                    </div>
                    {isComplete ? (
                        <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> All workflows active
                        </div>
                    ) : (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                            {progressPct}%
                        </span>
                    )}
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {PROGRESS_STEPS.map(f => (
                        <span
                            key={f.id}
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                                f.isDone(stats)
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    : "bg-gray-50 text-gray-400 border-gray-100"
                            }`}
                        >
                            {f.isDone(stats) ? "✓ " : ""}{f.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Next step CTA */}
            {!isComplete && (() => {
                const next = PROGRESS_STEPS.find(f => !f.isDone(stats));
                if (!next) return null;
                const Icon = next.icon;
                return (
                    <Link
                        href={`/course/${courseId}/${next.id}`}
                        className="flex items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-5 py-4 transition-all group shadow-sm shadow-blue-200"
                    >
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Recommended next step</p>
                            <p className="font-semibold text-white">Go to {next.label}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-blue-300 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </Link>
                );
            })()}

            {/* Feature grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FEATURE_CARDS.map(feature => {
                    const Icon = feature.icon;
                    const done = feature.isDone(stats);
                    return (
                        <Link
                            key={feature.id}
                            href={`/course/${courseId}/${feature.id}`}
                            className={`group rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border ${
                                done
                                    ? "bg-green-50/50 border-green-200 hover:border-green-300"
                                    : "bg-white border-gray-100 hover:border-gray-200"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className={`w-10 h-10 ${feature.bgColor} rounded-xl flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 ${feature.color}`} />
                                </div>
                                {done && <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
                            </div>
                            <div className="space-y-0.5">
                                <p className="font-semibold text-gray-900 text-sm">{feature.label}</p>
                                <p className="text-xs text-gray-400">{feature.description}</p>
                            </div>
                            <div className="mt-auto flex items-center justify-between pt-1">
                                <span className={`text-xs font-medium ${done ? "text-gray-600" : "text-gray-400"}`}>
                                    {feature.getStatus(stats)}
                                </span>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Getting started guide for empty courses */}
            {completedSteps === 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        <p className="font-semibold text-blue-900">Getting Started</p>
                    </div>
                    <ol className="space-y-2.5 text-sm text-blue-800">
                        {[
                            { step: 1, text: "Upload your", link: "resources", label: "syllabus and course files" },
                            { step: 2, text: "Generate your", link: "lesson-planner", label: "lesson plan" },
                            { step: 3, text: "Prepare", link: "content-prep", label: "content for each topic" },
                            { step: 4, text: "Build your", link: "question-bank", label: "question bank" },
                            { step: 5, text: "Chat with", link: "agent-chat", label: "Edwin AI assistant" },
                        ].map(({ step, text, link, label }) => (
                            <li key={step} className="flex items-start gap-2.5">
                                <span className="font-extrabold text-blue-500 flex-shrink-0 w-4">{step}.</span>
                                <span>
                                    {text}{" "}
                                    <Link
                                        href={`/course/${courseId}/${link}`}
                                        className="underline font-semibold hover:text-blue-900 transition-colors"
                                    >
                                        {label}
                                    </Link>
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

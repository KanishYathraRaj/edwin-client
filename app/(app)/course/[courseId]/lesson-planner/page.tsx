"use client";

import { useState, useEffect, use } from "react";
import { BookOpen, Sparkles, ChevronRight, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getCourseDetails, updateCompletedTopics } from "@/lib/firebase/firestore";
import { apiPost } from "@/lib/api";

interface Topic {
    unit: string;
    topics: string[];
}

interface SyllabusData {
    syllabus: Topic[];
}

export default function LessonPlanner({ params }: {
    params: Promise<{
        courseId: string;
    }>;
}) {
    const { courseId } = use(params);
    const [user, setUser] = useState<User | null>(null);
    const [isPlanning, setIsPlanning] = useState(false);
    const [planError, setPlanError] = useState("");
    const [syllabusData, setSyllabusData] = useState<SyllabusData | null>(null);
    const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());

    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        async function loadLessonPlan() {
            if (user && courseId) {
                const data = await getCourseDetails(user.uid, courseId);
                if (data && data.lessonPlan) {
                    // The backend saves { syllabus: [...] } inside lessonPlan
                    if (data.lessonPlan.syllabus) {
                        setSyllabusData(data.lessonPlan);
                    } else if (Array.isArray(data.lessonPlan)) {
                        setSyllabusData({ syllabus: data.lessonPlan });
                    }
                }
                if (data?.completedTopics) {
                    setCompletedTopics(new Set(data.completedTopics));
                }
            }
        }
        loadLessonPlan();
    }, [user, courseId]);

    const handleToggleTopic = async (topic: string) => {
        if (!user) return;
        const next = new Set(completedTopics);
        next.has(topic) ? next.delete(topic) : next.add(topic);
        setCompletedTopics(next);
        await updateCompletedTopics(user.uid, courseId, Array.from(next));
    };

    const handleStartPlanning = async () => {
        if (!user) return;
        setPlanError("");
        setIsPlanning(true);
        try {
            const data = await apiPost("/plan-lesson", { courseId });
            if (data.syllabus?.syllabus) {
                setSyllabusData(data.syllabus);
            } else if (Array.isArray(data.syllabus)) {
                setSyllabusData({ syllabus: data.syllabus });
            } else {
                throw new Error("Unexpected response format");
            }
        } catch (error) {
            console.error("Error planning lesson:", error);
            setPlanError("Failed to generate lesson plan. Please ensure you have uploaded a syllabus in Resources.");
        } finally {
            setIsPlanning(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-5 space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200">
                <div className="text-left">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <BookOpen className="w-7 h-7 text-blue-600" />
                        Lesson Planner
                    </h1>
                    <p className="text-gray-500 mt-2 max-w-xl">
                        Transform your course materials into a structured, comprehensive syllabus using AI.
                    </p>
                </div>
                
                {syllabusData && (
                    <button
                        onClick={handleStartPlanning}
                        disabled={isPlanning}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isPlanning ? 'animate-spin' : ''}`} />
                        Regenerate Plan
                    </button>
                )}
            </div>

            {!syllabusData ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-8 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2 max-w-md">
                        <h2 className="text-xl font-bold text-gray-900">Generate your course plan</h2>
                        <p className="text-gray-500">
                            Edwin will analyze your course materials and create a structured list of topics.
                        </p>
                    </div>
                    <button
                        onClick={handleStartPlanning}
                        disabled={isPlanning}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
                    >
                        {isPlanning ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                Generate Lesson Plan
                                <Sparkles className="w-4 h-4" />
                            </>
                        )}
                    </button>
                    {planError && <p className="text-sm text-red-600 font-medium">{planError}</p>}
                </div>
            ) : (
                <div className="space-y-6 text-left">
                    {(() => {
                        const total = syllabusData.syllabus.reduce((acc, u) => acc + u.topics.length, 0);
                        const done = completedTopics.size;
                        return (
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-sm font-semibold uppercase tracking-wider">Plan Generated</span>
                                </div>
                                {total > 0 && (
                                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                                        {done}/{total} topics covered
                                    </span>
                                )}
                            </div>
                        );
                    })()}

                    <div className="space-y-12">
                        {syllabusData.syllabus.map((unit, unitIdx) => (
                            <div key={unitIdx}
                                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                        {unitIdx + 1}
                                    </div>
                                    <h3 className="text-base font-bold text-blue-900">{unit.unit}</h3>
                                </div>
                                <div className="p-6">
                                
                                <ul className="grid gap-4 ml-1">
                                    {unit.topics.map((topic, topicIdx) => {
                                        const done = completedTopics.has(topic);
                                        return (
                                        <li key={topicIdx} className="flex items-start gap-3 group">
                                            <div className="flex items-center h-6">
                                                <input
                                                    type="checkbox"
                                                    id={`topic-${unitIdx}-${topicIdx}`}
                                                    checked={done}
                                                    onChange={() => handleToggleTopic(topic)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </div>
                                            <label
                                                htmlFor={`topic-${unitIdx}-${topicIdx}`}
                                                className={`transition-colors leading-relaxed cursor-pointer ${
                                                    done ? "line-through text-gray-400" : "text-gray-600 group-hover:text-gray-900"
                                                }`}
                                            >
                                                {topic}
                                            </label>
                                        </li>
                                        );
                                    })}
                                </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="pt-12 flex justify-center border-t border-gray-50">
                        <p className="text-gray-400 text-sm italic">
                            Generated by Edwin AI Agent based on course materials.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

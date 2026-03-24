"use client";

import { useState, useEffect, use } from "react";
import { BookOpen, Sparkles, ChevronRight, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getCourseDetails } from "@/lib/firebase/firestore";

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
    const [syllabusData, setSyllabusData] = useState<SyllabusData | null>(null);

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
            }
        }
        loadLessonPlan();
    }, [user, courseId]);

    const handleStartPlanning = async () => {
        if (!user) return;
        setIsPlanning(true);
        try {
            const response = await fetch("http://localhost:3000/plan-lesson", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.uid,
                    courseId: courseId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to plan lesson");
            }

            const data = await response.json();
            // The API returns { success: true, syllabus: { syllabus: [...] } }
            if (data.syllabus && data.syllabus.syllabus) {
                setSyllabusData(data.syllabus);
            } else if (Array.isArray(data.syllabus)) {
                setSyllabusData({ syllabus: data.syllabus });
            } else {
                throw new Error("Invalid response format");
            }
        } catch (error) {
            console.error("Error planning lesson:", error);
            alert("Failed to plan lesson. Please ensure you have uploaded a syllabus in the Resources page.");
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
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
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
                </div>
            ) : (
                <div className="space-y-6 text-left">
                    <div className="flex items-center gap-2 text-green-600 mb-8">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Plan Generated</span>
                    </div>

                    <div className="space-y-12">
                        {syllabusData.syllabus.map((unit, unitIdx) => (
                            <div key={unitIdx} 
                                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Unit {unitIdx + 1}</p>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {unit.unit}
                                    </h3>
                                </div>
                                
                                <ul className="grid gap-4 ml-1">
                                    {unit.topics.map((topic, topicIdx) => (
                                        <li key={topicIdx} className="flex items-start gap-3 group">
                                            <div className="flex items-center h-6">
                                                <input
                                                    type="checkbox"
                                                    id={`topic-${unitIdx}-${topicIdx}`}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </div>
                                            <label 
                                                htmlFor={`topic-${unitIdx}-${topicIdx}`}
                                                className="text-gray-600 group-hover:text-gray-900 transition-colors leading-relaxed cursor-pointer peer-checked:line-through peer-checked:text-gray-400"
                                            >
                                                {topic}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
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

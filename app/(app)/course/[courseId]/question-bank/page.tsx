"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";

export default function QuestionBank() {
    const { courseId } = useParams() as { courseId: string };

    const [user, setUser] = useState<User | null>(null);
    const [questions, setQuestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [instruction, setInstruction] = useState("");

    // 🔐 Get logged-in user
    useEffect(() => {
        const unsubscribe = onAuthStateChange((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // 🚀 Generate questions
    const generateQuestions = async () => {
    if (!user) {
        setError("User not logged in");
        return;
    }

    if (!instruction.trim()) {
        setError("Please enter an instruction");
        return;
    }

    setLoading(true);
    setError("");

    try {
        const res = await fetch("http://localhost:3000/generate-questions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                courseId,
                userId: user.uid,
                instruction
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("Backend error:", text);
            throw new Error("Failed to generate questions");
        }

        const data = await res.json();
        console.log(data);
        setQuestions(data.questionBank.questions);
        // if (Array.isArray(data.questions)) {
        //     setQuestions(data.questions);
        // }

    } catch (err) {
        console.error(err);
        setError("Failed to generate questions");
    } finally {
        setLoading(false);
    }
};
    return (
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-gray-900">Question Bank</h1>
                <p className="text-sm text-gray-500">
                    Generate and manage questions for this course.
                </p>
            </div>

            {/* Instruction */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Instruction</label>
                <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="e.g. Generate 10 important exam questions for this course"
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    rows={3}
                />
                <div className="flex gap-2 flex-wrap">
                    {[
                        "Generate 10 exam questions",
                        "Generate MCQs with answers",
                        "Generate difficult conceptual questions",
                    ].map((preset) => (
                        <button
                            key={preset}
                            onClick={() => setInstruction(preset)}
                            className="text-xs border border-gray-300 px-3 py-1 rounded-full hover:bg-gray-100"
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            </div>

            {/* Button */}
            <div>
                <button
                    onClick={generateQuestions}
                    disabled={loading}
                    className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Generating..." : "Generate Questions"}
                </button>
            </div>

            {/* Error */}
            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* Content */}
            {questions.length === 0 && !loading ? (
                <div className="text-gray-400 text-sm py-10">
                    No questions yet. Click generate to create questions.
                </div>
            ) : (
                <div className="space-y-3">
                    {questions.map((q, i) => (
                        <div
                            key={i}
                            className="border border-gray-200 rounded-lg p-4 text-gray-800 text-sm hover:bg-gray-50 transition"
                        >
                            <span className="font-medium text-gray-500 mr-2">Q{i + 1}.</span>
                            {q}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
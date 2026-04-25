"use client";

import { useState, useEffect, use } from "react";
import { BrainCircuit, Sparkles, Loader2, CheckCircle2, XCircle, ChevronDown, RotateCcw } from "lucide-react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { apiPost } from "@/lib/api";

type QuizType = "mcq" | "tf" | "short" | "mixed";
type Difficulty = "easy" | "medium" | "hard";

interface MCQQuestion { type: "mcq"; question: string; options: string[]; answer: string; explanation: string; }
interface TFQuestion  { type: "tf";  question: string; answer: boolean; explanation: string; }
interface SAQuestion  { type: "short"; question: string; answer: string; }
type Question = MCQQuestion | TFQuestion | SAQuestion;

interface Quiz { title: string; difficulty: string; questions: Question[]; }

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
    easy:   "bg-green-100 text-green-700 border-green-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    hard:   "bg-red-100 text-red-700 border-red-200",
};

export default function QuizGen({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = use(params);
    const [user, setUser]         = useState<User | null>(null);
    const [quizType, setQuizType] = useState<QuizType>("mixed");
    const [difficulty, setDifficulty] = useState<Difficulty>("medium");
    const [count, setCount]       = useState(10);
    const [quiz, setQuiz]         = useState<Quiz | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError]       = useState("");

    // Interactive quiz state
    const [answers, setAnswers]   = useState<Record<number, string | boolean>>({});
    const [revealed, setRevealed] = useState<Record<number, boolean>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore]       = useState<number | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChange(u => setUser(u));
        return () => unsub();
    }, []);

    const handleGenerate = async () => {
        if (!user) return;
        setIsGenerating(true);
        setError("");
        setQuiz(null);
        setAnswers({});
        setRevealed({});
        setSubmitted(false);
        setScore(null);

        try {
            const data = await apiPost("/generate-quiz", { courseId, type: quizType, difficulty, count });
            setQuiz(data.quiz);
        } catch (err: any) {
            setError(err.message || "Failed to generate quiz. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = () => {
        if (!quiz) return;
        let correct = 0;
        quiz.questions.forEach((q, i) => {
            const userAns = answers[i];
            if (q.type === "mcq" && userAns === q.answer) correct++;
            if (q.type === "tf" && userAns === q.answer) correct++;
            if (q.type === "short") correct++; // Self-graded
        });
        setScore(correct);
        setSubmitted(true);
        setRevealed(Object.fromEntries(quiz.questions.map((_, i) => [i, true])));
    };

    const handleReset = () => {
        setAnswers({});
        setRevealed({});
        setSubmitted(false);
        setScore(null);
    };

    return (
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
            {/* Header */}
            <div className="pb-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <BrainCircuit className="w-7 h-7 text-purple-600" />
                    Quiz Generation
                </h1>
                <p className="text-gray-500 mt-1">Generate an interactive quiz from your course materials.</p>
            </div>

            {/* Config Panel */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 space-y-5">
                <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Quiz Settings</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Question Type */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Question Type</label>
                        <div className="relative">
                            <select
                                value={quizType}
                                onChange={e => setQuizType(e.target.value as QuizType)}
                                className="w-full appearance-none bg-white border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 pr-8 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            >
                                <option value="mixed">Mixed</option>
                                <option value="mcq">Multiple Choice</option>
                                <option value="tf">True / False</option>
                                <option value="short">Short Answer</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Difficulty</label>
                        <div className="flex gap-2">
                            {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg border capitalize transition-all ${
                                        difficulty === d
                                            ? DIFFICULTY_COLORS[d]
                                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100"
                                    }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Count */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Questions: <span className="font-bold text-purple-600">{count}</span>
                        </label>
                        <input
                            type="range"
                            min={3} max={20} step={1}
                            value={count}
                            onChange={e => setCount(Number(e.target.value))}
                            className="w-full accent-purple-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>3</span><span>20</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !user}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-[0.98] shadow-sm"
                >
                    {isGenerating ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating Quiz...</>
                    ) : (
                        <><Sparkles className="w-4 h-4" /> Generate Quiz</>
                    )}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Quiz Display */}
            {quiz && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize mt-1 inline-block ${DIFFICULTY_COLORS[quiz.difficulty as Difficulty] || "bg-gray-100 text-gray-600"}`}>
                                {quiz.difficulty}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {submitted && (
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" /> Retry
                                </button>
                            )}
                            {!submitted && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={Object.keys(answers).length < quiz.questions.filter(q => q.type !== "short").length}
                                    className="flex items-center gap-1 text-sm bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white px-4 py-1.5 rounded-lg font-semibold transition-all"
                                >
                                    Submit Quiz
                                </button>
                            )}
                        </div>
                    </div>

                    {submitted && score !== null && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center space-y-1">
                            <p className="text-3xl font-extrabold text-blue-700">
                                {score} / {quiz.questions.filter(q => q.type !== "short").length}
                            </p>
                            <p className="text-sm text-blue-600 font-medium">
                                {score === quiz.questions.filter(q => q.type !== "short").length ? "Perfect score! Excellent work." :
                                 score >= quiz.questions.filter(q => q.type !== "short").length * 0.7 ? "Great job! Keep it up." :
                                 "Keep studying and try again!"}
                            </p>
                            {quiz.questions.some(q => q.type === "short") && (
                                <p className="text-xs text-gray-400 mt-1">Short answer questions are self-graded</p>
                            )}
                        </div>
                    )}

                    <div className="space-y-4">
                        {quiz.questions.map((q, i) => (
                            <QuestionCard
                                key={i}
                                index={i}
                                question={q}
                                userAnswer={answers[i]}
                                revealed={revealed[i] ?? false}
                                submitted={submitted}
                                onAnswer={(ans) => setAnswers(prev => ({ ...prev, [i]: ans }))}
                                onReveal={() => setRevealed(prev => ({ ...prev, [i]: true }))}
                            />
                        ))}
                    </div>

                    {!submitted && quiz.questions.length > 0 && (
                        <div className="flex justify-center pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length < quiz.questions.filter(q => q.type !== "short").length}
                                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white px-8 py-3 rounded-xl font-bold transition-all active:scale-[0.98]"
                            >
                                Submit Quiz
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function QuestionCard({
    index, question, userAnswer, revealed, submitted, onAnswer, onReveal
}: {
    index: number;
    question: Question;
    userAnswer: string | boolean | undefined;
    revealed: boolean;
    submitted: boolean;
    onAnswer: (ans: string | boolean) => void;
    onReveal: () => void;
}) {
    const isCorrect = (() => {
        if (!submitted) return null;
        if (question.type === "mcq") return userAnswer === question.answer;
        if (question.type === "tf") return userAnswer === question.answer;
        return null;
    })();

    return (
        <div className={`bg-white border rounded-2xl p-5 space-y-4 transition-all ${
            submitted && isCorrect === true  ? "border-green-200 bg-green-50/30" :
            submitted && isCorrect === false ? "border-red-200 bg-red-50/30" :
            "border-gray-100 hover:border-gray-200"
        }`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-600 text-xs font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                    </span>
                    <p className="text-gray-900 font-medium leading-relaxed text-sm">{question.question}</p>
                </div>
                {submitted && isCorrect === true  && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
                {submitted && isCorrect === false && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
            </div>

            {question.type === "mcq" && (
                <div className="space-y-2 ml-9">
                    {question.options.map((opt, oi) => {
                        const optLetter = opt[0];
                        const selected = userAnswer === optLetter;
                        const isAnswer = submitted && optLetter === question.answer;
                        const isWrong  = submitted && selected && !isAnswer;
                        return (
                            <button
                                key={oi}
                                onClick={() => !submitted && onAnswer(optLetter)}
                                disabled={submitted}
                                className={`w-full text-left text-sm px-4 py-2.5 rounded-xl border font-medium transition-all ${
                                    isAnswer  ? "bg-green-100 border-green-300 text-green-800" :
                                    isWrong   ? "bg-red-100 border-red-300 text-red-800" :
                                    selected  ? "bg-blue-100 border-blue-300 text-blue-800" :
                                    "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700"
                                }`}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            )}

            {question.type === "tf" && (
                <div className="flex gap-3 ml-9">
                    {[true, false].map(val => {
                        const selected = userAnswer === val;
                        const isAnswer = submitted && val === question.answer;
                        const isWrong  = submitted && selected && !isAnswer;
                        return (
                            <button
                                key={String(val)}
                                onClick={() => !submitted && onAnswer(val)}
                                disabled={submitted}
                                className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-all ${
                                    isAnswer  ? "bg-green-100 border-green-300 text-green-800" :
                                    isWrong   ? "bg-red-100 border-red-300 text-red-800" :
                                    selected  ? "bg-blue-100 border-blue-300 text-blue-800" :
                                    "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700"
                                }`}
                            >
                                {val ? "True" : "False"}
                            </button>
                        );
                    })}
                </div>
            )}

            {question.type === "short" && (
                <div className="ml-9 space-y-2">
                    {revealed ? (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
                            <span className="font-semibold">Model Answer: </span>{question.answer}
                        </div>
                    ) : (
                        <button
                            onClick={onReveal}
                            className="text-xs text-purple-600 hover:text-purple-800 font-semibold underline"
                        >
                            Reveal answer
                        </button>
                    )}
                </div>
            )}

            {revealed && (question.type === "mcq" || question.type === "tf") && (question as any).explanation && (
                <div className="ml-9 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs text-gray-600">
                    <span className="font-semibold text-gray-700">Explanation: </span>
                    {(question as any).explanation}
                </div>
            )}
        </div>
    );
}

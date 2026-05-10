"use client";

import { useState, useEffect, use } from "react";
import {
    HelpCircle, Sparkles, Loader2, Trash2, ChevronDown, ChevronUp,
    Download, Eye, EyeOff, BookOpen, RotateCcw, CheckCircle2, XCircle,
    ClipboardCopy, AlertCircle, Search,
} from "lucide-react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getCourseDetails } from "@/lib/firebase/firestore";
import { apiPost, apiGet, apiDelete } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type QType = "mcq" | "tf" | "short";
type QDifficulty = "easy" | "medium" | "hard";
type GenType = QType | "mixed";
type FilterType = "all" | QType;

interface Question {
    id: string;
    type: QType;
    question: string;
    options?: string[];
    answer: string | boolean;
    explanation?: string;
    topic?: string;
    difficulty: QDifficulty;
    createdAt?: string;
}

interface Topic { unit: string; topics: string[] }

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<QType, string>   = { mcq: "MCQ", tf: "True/False", short: "Short Answer" };
const TYPE_COLOR: Record<QType, string>   = {
    mcq:   "bg-purple-100 text-purple-700 border-purple-200",
    tf:    "bg-blue-100   text-blue-700   border-blue-200",
    short: "bg-green-100  text-green-700  border-green-200",
};
const DIFF_COLOR: Record<QDifficulty, string> = {
    easy:   "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100   text-amber-700",
    hard:   "bg-red-100     text-red-700",
};

function normalizeLetter(s: string): string {
    return s.match(/^([A-D])[.)]/i)?.[1]?.toUpperCase() ?? s[0]?.toUpperCase() ?? s;
}

function exportAsText(questions: Question[], courseTitle: string): string {
    const counts = { mcq: 0, tf: 0, short: 0 };
    questions.forEach(q => counts[q.type]++);
    const header = [
        `Question Bank — ${courseTitle}`,
        `Total: ${questions.length} questions  (MCQ: ${counts.mcq} | T/F: ${counts.tf} | Short: ${counts.short})`,
        `Exported: ${new Date().toLocaleDateString()}`,
        "─".repeat(60),
    ].join("\n");

    const body = questions.map((q, i) => {
        const parts = [`Q${i + 1}. [${TYPE_LABEL[q.type]} · ${q.difficulty}${q.topic ? ` · ${q.topic}` : ""}]`];
        parts.push(q.question);
        if (q.type === "mcq" && q.options) {
            q.options.forEach(opt => parts.push(`    ${opt}`));
            parts.push(`    Answer: ${q.answer}`);
        } else if (q.type === "tf") {
            parts.push(`    Answer: ${q.answer ? "True" : "False"}`);
        } else {
            parts.push(`    Answer: ${q.answer}`);
        }
        if (q.explanation) parts.push(`    Explanation: ${q.explanation}`);
        return parts.join("\n");
    }).join("\n\n");

    return `${header}\n\n${body}`;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function QuestionBank({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = use(params);

    const [user, setUser]           = useState<User | null>(null);
    const [courseTitle, setCourseTitle] = useState("");
    const [allTopics, setAllTopics] = useState<string[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Generation config
    const [genType, setGenType]           = useState<GenType>("mixed");
    const [difficulty, setDifficulty]     = useState<QDifficulty>("medium");
    const [count, setCount]               = useState(10);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [instruction, setInstruction]   = useState("");
    const [isTopicOpen, setIsTopicOpen]   = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState("");

    // Display
    const [filter, setFilter]   = useState<FilterType>("all");
    const [search, setSearch]   = useState("");
    const [revealed, setRevealed] = useState<Set<string>>(new Set());
    const [isClearing, setIsClearing] = useState(false);
    const [copiedExport, setCopiedExport] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(() => {
        if (typeof window === "undefined") return true;
        try { return JSON.parse(localStorage.getItem("qbPanelOpen") ?? "true"); } catch { return true; }
    });

    useEffect(() => {
        try { localStorage.setItem("qbPanelOpen", JSON.stringify(isPanelOpen)); } catch {}
    }, [isPanelOpen]);

    useEffect(() => {
        const unsub = onAuthStateChange(u => setUser(u));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!user || !courseId) return;
        (async () => {
            setIsLoading(true);
            try {
                // Load course details (for title + lesson plan topics)
                const data = await getCourseDetails(user.uid, courseId);
                setCourseTitle(data?.title || courseId);
                if (data?.lessonPlan?.syllabus) {
                    setAllTopics(data.lessonPlan.syllabus.flatMap((u: Topic) => u.topics));
                }
                // Load saved question bank
                const res = await apiGet(`/question-bank?courseId=${encodeURIComponent(courseId)}`);
                setQuestions(res.questions ?? []);
            } catch (e) {
                console.error("Failed to load question bank:", e);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [user, courseId]);

    const toggleTopic = (t: string) =>
        setSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

    const toggleReveal = (id: string) =>
        setRevealed(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const handleGenerate = async () => {
        if (!user) return;
        setIsGenerating(true);
        setGenerateError("");
        try {
            const res = await apiPost("/generate-questions", {
                courseId,
                type: genType,
                difficulty,
                count,
                topics: selectedTopics.length > 0 ? selectedTopics : undefined,
                instruction: instruction.trim() || undefined,
            });
            // Prepend new questions to existing bank
            setQuestions(prev => [...(res.questions ?? []), ...prev]);
            setIsPanelOpen(false);
        } catch (err: any) {
            setGenerateError(err.message || "Generation failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (id: string) => {
        setQuestions(prev => prev.filter(q => q.id !== id));
        try {
            await apiDelete(`/question-bank/${id}?courseId=${encodeURIComponent(courseId)}`);
        } catch (e) {
            console.error("Delete failed:", e);
        }
    };

    const handleClearAll = async () => {
        if (!confirm(`Delete all ${questions.length} questions? This cannot be undone.`)) return;
        setIsClearing(true);
        try {
            await apiDelete(`/question-bank?courseId=${encodeURIComponent(courseId)}`);
            setQuestions([]);
            setRevealed(new Set());
        } catch (e) {
            console.error("Clear failed:", e);
        } finally {
            setIsClearing(false);
        }
    };

    const handleExport = async () => {
        const text = exportAsText(questions, courseTitle || courseId);
        try {
            await navigator.clipboard.writeText(text);
            setCopiedExport(true);
            setTimeout(() => setCopiedExport(false), 2000);
        } catch {
            const blob = new Blob([text], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `question-bank-${courseId}.txt`; a.click();
            URL.revokeObjectURL(url);
        }
    };

    // Filtered + counted
    const countByType = { mcq: 0, tf: 0, short: 0 } as Record<QType, number>;
    questions.forEach(q => countByType[q.type]++);
    const searchLower = search.toLowerCase();
    const filtered = questions.filter(q => {
        if (filter !== "all" && q.type !== filter) return false;
        if (!searchLower) return true;
        return (
            q.question.toLowerCase().includes(searchLower) ||
            (q.topic ?? "").toLowerCase().includes(searchLower)
        );
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <HelpCircle className="w-7 h-7 text-purple-600" />
                        Question Bank
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Build and manage a bank of questions from your course materials.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {questions.length > 0 && (
                        <>
                            <button
                                onClick={handleExport}
                                aria-label="Copy question bank to clipboard"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                {copiedExport
                                    ? <><CheckCircle2 className="w-4 h-4 text-green-500" /> Copied</>
                                    : <><ClipboardCopy className="w-4 h-4" /> Export</>
                                }
                            </button>
                            <button
                                onClick={handleClearAll}
                                disabled={isClearing}
                                aria-label="Clear all questions"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                                {isClearing
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <RotateCcw className="w-4 h-4" />}
                                Clear All
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Stats Strip ────────────────────────────────────────────── */}
            {questions.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700">{questions.length} questions</span>
                    <span className="text-gray-300">|</span>
                    {(["mcq", "tf", "short"] as QType[]).map(t => countByType[t] > 0 && (
                        <span key={t} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${TYPE_COLOR[t]}`}>
                            {TYPE_LABEL[t]}: {countByType[t]}
                        </span>
                    ))}
                </div>
            )}

            {/* ── Generation Panel ───────────────────────────────────────── */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                <button
                    onClick={() => setIsPanelOpen((p: boolean) => !p)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-gray-800 text-sm">Generate Questions</span>
                    </div>
                    {isPanelOpen
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {isPanelOpen && (
                    <div className="px-5 pb-5 space-y-5 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            {/* Question type */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {(["mixed", "mcq", "tf", "short"] as GenType[]).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setGenType(t)}
                                            className={`py-2 px-3 text-xs font-semibold rounded-lg border capitalize transition-all ${
                                                genType === t
                                                    ? "bg-purple-600 text-white border-purple-600"
                                                    : "bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700"
                                            }`}
                                        >
                                            {t === "tf" ? "True/False" : t === "short" ? "Short Ans." : t.charAt(0).toUpperCase() + t.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulty */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Difficulty</label>
                                <div className="flex gap-1.5">
                                    {(["easy", "medium", "hard"] as QDifficulty[]).map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            className={`flex-1 py-2 text-xs font-semibold rounded-lg border capitalize transition-all ${
                                                difficulty === d
                                                    ? DIFF_COLOR[d] + " border-current"
                                                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100"
                                            }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Count */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Questions: <span className="text-purple-600 font-extrabold">{count}</span>
                                </label>
                                <input
                                    type="range" min={3} max={20} step={1}
                                    value={count}
                                    onChange={e => setCount(Number(e.target.value))}
                                    className="w-full accent-purple-600 mt-1"
                                />
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>3</span><span>20</span>
                                </div>
                            </div>
                        </div>

                        {/* Topics dropdown */}
                        {allTopics.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Focus Topics <span className="font-normal normal-case text-gray-400">(optional)</span>
                                </label>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsTopicOpen(p => !p)}
                                        className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 flex items-center justify-between hover:border-purple-300 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-purple-500" />
                                            {selectedTopics.length > 0
                                                ? <span className="font-medium">{selectedTopics.length} topic{selectedTopics.length > 1 ? "s" : ""} selected</span>
                                                : <span className="text-gray-400">All topics</span>}
                                        </div>
                                        {isTopicOpen
                                            ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                            : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </button>

                                    {isTopicOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 p-2 z-20 max-h-52 overflow-y-auto">
                                            {allTopics.map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => toggleTopic(t)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                                                        selectedTopics.includes(t)
                                                            ? "bg-purple-50 text-purple-700 font-medium"
                                                            : "text-gray-700 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                                        selectedTopics.includes(t)
                                                            ? "bg-purple-600 border-purple-600 text-white"
                                                            : "border-gray-300"
                                                    }`}>
                                                        {selectedTopics.includes(t) && (
                                                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Instruction */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Custom Instruction <span className="font-normal normal-case text-gray-400">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={instruction}
                                onChange={e => setInstruction(e.target.value)}
                                placeholder="e.g. Focus on application and analysis, avoid recall questions"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all placeholder:text-gray-400"
                            />
                        </div>

                        {generateError && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {generateError}
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] shadow-sm"
                        >
                            {isGenerating
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating {count} questions...</>
                                : <><Sparkles className="w-4 h-4" /> Generate {count} Questions</>}
                        </button>
                    </div>
                )}
            </div>

            {/* ── Search + Filter Bar ────────────────────────────────────── */}
            {questions.length > 0 && (
                <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by question text or topic..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {(["all", "mcq", "tf", "short"] as FilterType[]).map(f => {
                        const cnt = f === "all" ? questions.length : countByType[f as QType];
                        const label = f === "all" ? "All" : TYPE_LABEL[f as QType];
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                                    filter === f
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                                }`}
                            >
                                {label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    filter === f ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                }`}>
                                    {cnt}
                                </span>
                            </button>
                        );
                    })}
                </div>
                </div>
            )}

            {/* ── Question List ───────────────────────────────────────────── */}
            {filtered.length === 0 ? (
                <div className="py-20 text-center space-y-4 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-gray-300 border border-gray-100">
                        <HelpCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-700">
                            {questions.length === 0 ? "No questions yet" : "No questions match this filter"}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            {questions.length === 0
                                ? "Use the panel above to generate your first set of questions."
                                : search
                                ? "Try a different search term or filter."
                                : "Try selecting a different type filter above."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {(() => {
                        const grouped = filtered.reduce((acc, q) => {
                            const key = q.topic || "General";
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(q);
                            return acc;
                        }, {} as Record<string, Question[]>);
                        let globalIdx = 0;
                        return Object.entries(grouped).map(([topic, qs]) => (
                            <div key={topic} className="space-y-3">
                                {Object.keys(grouped).length > 1 && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{topic}</span>
                                        <div className="flex-1 h-px bg-gray-100" />
                                        <span className="text-xs text-gray-400 font-medium">{qs.length}</span>
                                    </div>
                                )}
                                {qs.map(q => {
                                    globalIdx++;
                                    return (
                                        <QuestionCard
                                            key={q.id}
                                            index={globalIdx}
                                            question={q}
                                            isRevealed={revealed.has(q.id)}
                                            onToggleReveal={() => toggleReveal(q.id)}
                                            onDelete={() => handleDelete(q.id)}
                                        />
                                    );
                                })}
                            </div>
                        ));
                    })()}
                </div>
            )}
        </div>
    );
}

// ── Question Card ─────────────────────────────────────────────────────────────

function QuestionCard({
    index, question, isRevealed, onToggleReveal, onDelete,
}: {
    index: number;
    question: Question;
    isRevealed: boolean;
    onToggleReveal: () => void;
    onDelete: () => void;
}) {
    const correctLetter = question.type === "mcq"
        ? normalizeLetter(String(question.answer))
        : null;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group">
            {/* Card header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-0.5 flex-shrink-0 w-7 h-7 bg-gray-100 text-gray-500 text-xs font-bold rounded-full flex items-center justify-center">
                        {index}
                    </span>
                    <div className="min-w-0 space-y-1.5">
                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLOR[question.type]}`}>
                                {TYPE_LABEL[question.type]}
                            </span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${DIFF_COLOR[question.difficulty]}`}>
                                {question.difficulty}
                            </span>
                            {question.topic && (
                                <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[160px]">
                                    {question.topic}
                                </span>
                            )}
                        </div>
                        {/* Question text */}
                        <p className="text-gray-900 font-medium text-sm leading-relaxed">{question.question}</p>
                    </div>
                </div>
                <button
                    onClick={onDelete}
                    aria-label="Delete question"
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* MCQ options */}
            {question.type === "mcq" && question.options && (
                <div className="ml-10 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {question.options.map((opt, i) => {
                        const letter = normalizeLetter(opt);
                        const isCorrect = isRevealed && letter === correctLetter;
                        return (
                            <div
                                key={i}
                                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                                    isCorrect
                                        ? "bg-green-50 border-green-300 text-green-800 font-medium"
                                        : "bg-gray-50 border-gray-100 text-gray-700"
                                }`}
                            >
                                {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                                <span>{opt}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* T/F options */}
            {question.type === "tf" && (
                <div className="ml-10 flex gap-3">
                    {[true, false].map(val => {
                        const isCorrect = isRevealed && val === question.answer;
                        const isWrong   = isRevealed && val !== question.answer;
                        return (
                            <div
                                key={String(val)}
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                                    isCorrect ? "bg-green-50 border-green-300 text-green-800" :
                                    isWrong   ? "bg-gray-50 border-gray-100 text-gray-400 line-through" :
                                    "bg-gray-50 border-gray-200 text-gray-700"
                                }`}
                            >
                                {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                {isWrong && <XCircle className="w-4 h-4 text-gray-300" />}
                                {val ? "True" : "False"}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Answer / explanation row */}
            <div className="ml-10 space-y-2">
                {/* Short answer reveal */}
                {question.type === "short" && isRevealed && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
                        <span className="font-semibold">Model Answer: </span>
                        {String(question.answer)}
                    </div>
                )}

                {/* Explanation (shown when revealed, for MCQ/TF) */}
                {isRevealed && question.explanation && question.type !== "short" && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs text-gray-600">
                        <span className="font-semibold text-gray-700">Explanation: </span>
                        {question.explanation}
                    </div>
                )}
                {isRevealed && question.explanation && question.type === "short" && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs text-gray-600">
                        <span className="font-semibold text-gray-700">Explanation: </span>
                        {question.explanation}
                    </div>
                )}

                {/* Reveal / hide button */}
                <button
                    onClick={onToggleReveal}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                >
                    {isRevealed
                        ? <><EyeOff className="w-3.5 h-3.5" /> Hide Answer</>
                        : <><Eye className="w-3.5 h-3.5" /> Show Answer</>}
                </button>
            </div>
        </div>
    );
}

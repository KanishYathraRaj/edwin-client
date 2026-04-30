"use client";

import { useState, useEffect, useRef, use } from "react";
import {
    Loader2, BookOpen, ChevronUp, Download,
    Save, MoreVertical, FilePlus, FolderOpen,
    X, FileText, Trash2, ArrowUp, Check,
} from "lucide-react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import {
    getCourseDetails,
    savePreparedContent,
    getSavedPreparedContent,
    deletePreparedContent,
    updatePreparedContentTitle,
} from "@/lib/firebase/firestore";
import { apiStream } from "@/lib/api";

interface Topic {
    unit: string;
    topics: string[];
}

interface SyllabusData {
    syllabus: Topic[];
}

function renderToHTML(md: string): string {
    const bold = (s: string) => s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return md
        .split("\n")
        .map((line) => {
            const t = line.trim();
            if (t.startsWith("## "))
                return `<h2 style="font-size:15px;font-weight:700;color:#1e40af;margin:20px 0 6px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">${bold(t.slice(3))}</h2>`;
            if (t.startsWith("# "))
                return `<h1 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 12px">${bold(t.slice(2))}</h1>`;
            if (/^\d+\.\s/.test(t))
                return `<div style="display:flex;gap:8px;margin:3px 0"><span style="color:#2563eb;font-weight:700;min-width:20px;flex-shrink:0">${t.match(/^\d+/)?.[0]}.</span><span>${bold(t.replace(/^\d+\.\s*/, ""))}</span></div>`;
            if (t.startsWith("- ") || t.startsWith("• "))
                return `<div style="display:flex;gap:8px;margin:2px 0"><span style="color:#60a5fa;flex-shrink:0">•</span><span>${bold(t.slice(2))}</span></div>`;
            if (t === "") return `<div style="height:8px"></div>`;
            return `<p style="margin:3px 0">${bold(t)}</p>`;
        })
        .join("");
}

export default function ContentPrep({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = use(params);
    const [user, setUser] = useState<User | null>(null);
    const [lessonPlan, setLessonPlan] = useState<SyllabusData | null>(null);

    const [selectedTopicNames, setSelectedTopicNames] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOpenerOpen, setIsOpenerOpen] = useState(false);
    const [savedFiles, setSavedFiles] = useState<any[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    const [currentFileId, setCurrentFileId] = useState<string | null>(null);
    const [currentTitle, setCurrentTitle] = useState<string>("");
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [generateError, setGenerateError] = useState<string>("");

    const [generatedContent, setGeneratedContent] = useState<string>("");
    const editorRef = useRef<HTMLDivElement>(null);
    const isStreamingRef = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((u) => setUser(u));
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user || !courseId) return;
        (async () => {
            try {
                const data = await getCourseDetails(user.uid, courseId);
                if (data?.lessonPlan) {
                    if (data.lessonPlan.syllabus) {
                        setLessonPlan(data.lessonPlan);
                    } else if (Array.isArray(data.lessonPlan)) {
                        setLessonPlan({ syllabus: data.lessonPlan });
                    }
                }
            } catch (e) {
                console.error("Error loading course data:", e);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [user, courseId]);

    // Sync markdown state → rendered HTML when editor is not focused and not streaming
    useEffect(() => {
        if (isStreamingRef.current) return;
        if (editorRef.current && document.activeElement !== editorRef.current) {
            editorRef.current.innerHTML = generatedContent
                ? renderToHTML(generatedContent)
                : "";
        }
    }, [generatedContent]);

    const toggleTopic = (topic: string) => {
        setSelectedTopicNames((prev) =>
            prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
        );
    };

    const downloadAsPDF = () => {
        if (!generatedContent) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const lines = generatedContent.split("\n");
        let htmlContent = "";
        const bold = (s: string) => s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        for (const line of lines) {
            const t = line.trim();
            if (t.startsWith("## ")) htmlContent += `<h2>${bold(t.slice(3))}</h2>`;
            else if (t.startsWith("# ")) htmlContent += `<h1>${bold(t.slice(2))}</h1>`;
            else if (/^\d+\.\s/.test(t))
                htmlContent += `<p class="numbered"><span class="num">${t.match(/^\d+/)?.[0]}.</span>${bold(t.replace(/^\d+\.\s*/, ""))}</p>`;
            else if (t.startsWith("- ") || t.startsWith("• "))
                htmlContent += `<p class="bullet"><span class="dot">•</span>${bold(t.slice(2))}</p>`;
            else if (t === "") htmlContent += `<div style="height:8px"></div>`;
            else htmlContent += `<p>${bold(t)}</p>`;
        }

        printWindow.document.write(`<!DOCTYPE html>
<html><head><title>${currentTitle || "Content"}</title><style>
  @page { margin: 15mm 20mm; size: A4; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 13pt; line-height: 1.7; margin: 0; }
  h1 { font-size: 20pt; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin: 0 0 16px; }
  h2 { font-size: 14pt; color: #1e40af; margin: 24px 0 8px; }
  p { margin: 4px 0 8px; }
  .numbered { display:flex; gap:8px; margin:4px 0; }
  .num { color:#2563eb; font-weight:bold; min-width:24px; flex-shrink:0; }
  .bullet { display:flex; gap:8px; margin:3px 0; }
  .dot { color:#60a5fa; min-width:16px; flex-shrink:0; }
  strong { font-weight: 600; }
</style></head><body>${htmlContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 400);
    };

    const handleGenerate = async () => {
        if (!user || selectedTopicNames.length === 0) return;

        setIsGenerating(true);
        setGenerateError("");
        setCurrentFileId(null);

        const topicTitle = selectedTopicNames.slice(0, 2).join(", ");
        setCurrentTitle(topicTitle);

        if (editorRef.current) editorRef.current.innerHTML = "";
        isStreamingRef.current = true;

        let accumulated = "";

        try {
            await apiStream(
                "/content-prep",
                { courseId, topics: selectedTopicNames, description },
                (chunk) => {
                    accumulated += chunk;
                    if (editorRef.current) {
                        editorRef.current.innerText = accumulated;
                    }
                }
            );

            if (editorRef.current) {
                editorRef.current.innerHTML = renderToHTML(accumulated);
            }
            setGeneratedContent(accumulated);
            setSelectedTopicNames([]);
            setDescription("");
        } catch (error: any) {
            setGenerateError(error.message || "Generation failed. Please try again.");
            if (editorRef.current) editorRef.current.innerHTML = "";
        } finally {
            isStreamingRef.current = false;
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        const contentToSave = editorRef.current?.innerText || generatedContent;
        if (!user || !contentToSave.trim() || !courseId) return;

        setIsSaving(true);
        const title = currentTitle.trim() || "Untitled";

        try {
            const savedId = await savePreparedContent(
                user.uid,
                courseId,
                contentToSave,
                title,
                currentFileId ?? undefined
            );
            if (savedId) {
                setCurrentFileId(savedId);
                setCurrentTitle(title);
                setGeneratedContent(contentToSave);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2000);
            }
        } catch (e) {
            console.error("Save failed:", e);
        } finally {
            setIsSaving(false);
            setIsMenuOpen(false);
        }
    };

    const handleNewFile = () => {
        setGeneratedContent("");
        setDescription("");
        setSelectedTopicNames([]);
        setCurrentFileId(null);
        setCurrentTitle("");
        setGenerateError("");
        setIsMenuOpen(false);
        if (editorRef.current) editorRef.current.innerHTML = "";
    };

    const handleOpenFileOpener = async () => {
        setIsMenuOpen(false);
        if (!user || !courseId) return;
        setIsOpenerOpen(true);
        setIsLoadingFiles(true);
        try {
            setSavedFiles(await getSavedPreparedContent(user.uid, courseId));
        } catch (e) {
            console.error("Failed to load files:", e);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const loadSpecificFile = (file: any) => {
        const content = file.content || "";
        setGeneratedContent(content);
        setCurrentFileId(file.id);
        setCurrentTitle(file.title || "Untitled");
        setGenerateError("");
        if (editorRef.current) {
            editorRef.current.innerHTML = renderToHTML(content);
        }
        setIsOpenerOpen(false);
    };

    const handleDeleteFile = async (e: React.MouseEvent, fileId: string) => {
        e.stopPropagation();
        if (!user || !courseId) return;
        if (!confirm("Delete this material? This cannot be undone.")) return;
        try {
            const success = await deletePreparedContent(user.uid, courseId, fileId);
            if (success) {
                setSavedFiles((prev) => prev.filter((f) => f.id !== fileId));
                if (currentFileId === fileId) handleNewFile();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleTitleRenameSubmit = async () => {
        setIsEditingTitle(false);
        const newTitle = currentTitle.trim() || "Untitled";
        setCurrentTitle(newTitle);
        if (!currentFileId || !user || !courseId) return;
        try {
            const success = await updatePreparedContentTitle(user.uid, courseId, currentFileId, newTitle);
            if (success) {
                setSavedFiles((prev) =>
                    prev.map((f) => (f.id === currentFileId ? { ...f, title: newTitle } : f))
                );
            }
        } catch (e) {
            console.error("Failed to update title:", e);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!lessonPlan) {
        return (
            <div className="max-w-4xl mx-auto p-10 text-center space-y-6">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto text-gray-400">
                    <BookOpen className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">No lesson plan found</h2>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        Please generate a lesson plan first in the{" "}
                        <span className="text-blue-600 font-semibold">Lesson Planner</span> before
                        preparing content.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col h-[100dvh] font-sans text-left relative overflow-hidden bg-white">
            {/* Save success toast */}
            {saveSuccess && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-full shadow-lg pointer-events-none">
                    <Check className="w-4 h-4" /> Saved
                </div>
            )}

            <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden relative">

                    {/* Top Left — File Title */}
                    <div className="absolute top-4 left-4 md:left-8 z-40 flex items-center gap-2">
                        {isEditingTitle ? (
                            <input
                                autoFocus
                                type="text"
                                value={currentTitle}
                                onChange={(e) => setCurrentTitle(e.target.value)}
                                onBlur={handleTitleRenameSubmit}
                                onKeyDown={(e) => e.key === "Enter" && handleTitleRenameSubmit()}
                                className="bg-white border hover:border-blue-400 focus:border-blue-500 rounded-lg px-3 py-1.5 text-[14px] font-bold text-gray-800 outline-none w-56 shadow-sm transition-all z-50 relative"
                            />
                        ) : (
                            <button
                                onClick={() => setIsEditingTitle(true)}
                                className="px-3 py-1.5 rounded-lg text-[14px] font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all truncate max-w-[200px] md:max-w-xs flex items-center gap-2 shadow-sm z-50 relative"
                                title="Click to rename"
                            >
                                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                {currentTitle || "Untitled"}
                            </button>
                        )}
                        {currentFileId && !saveSuccess && (
                            <span className="text-[11px] text-gray-400 font-medium">Saved</span>
                        )}
                        {!currentFileId && generatedContent && (
                            <span className="text-[11px] text-amber-500 font-medium">Unsaved</span>
                        )}
                    </div>

                    {/* Top Right — Actions Menu */}
                    <div className="absolute top-4 right-4 z-40">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="bg-white hover:bg-gray-100 text-gray-700 p-2.5 rounded-full shadow-sm border border-gray-200 transition-all flex items-center justify-center"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute top-14 right-0 w-56 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-2 flex flex-col">
                                <button
                                    onClick={handleNewFile}
                                    className="flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-blue-50 rounded-xl transition-colors text-left group"
                                >
                                    <FilePlus className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                                    New File
                                </button>
                                <button
                                    onClick={handleOpenFileOpener}
                                    className="flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-orange-50 rounded-xl transition-colors text-left group"
                                >
                                    <FolderOpen className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                                    Open File
                                </button>
                                <div className="h-px bg-gray-100 my-1 mx-2" />
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !generatedContent}
                                    className="flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-green-50 rounded-xl transition-colors text-left disabled:opacity-50 group"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
                                    )}
                                    {currentFileId ? "Save Changes" : "Save to Course"}
                                </button>
                                <button
                                    onClick={() => { downloadAsPDF(); setIsMenuOpen(false); }}
                                    disabled={!generatedContent}
                                    className="flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-purple-50 rounded-xl transition-colors text-left disabled:opacity-50 group"
                                >
                                    <Download className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                                    Download PDF
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Editor Canvas */}
                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={() => {
                            if (isStreamingRef.current || !editorRef.current) return;
                            setGeneratedContent(editorRef.current.innerText);
                        }}
                        onBlur={() => {
                            if (isStreamingRef.current || !editorRef.current) return;
                            const text = editorRef.current.innerText;
                            setGeneratedContent(text);
                            editorRef.current.innerHTML = renderToHTML(text);
                        }}
                        data-placeholder="Select topics below, add instructions, and click Generate to stream AI course content here..."
                        className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto px-6 py-8 md:px-12 md:py-16 text-[14px] md:text-[15px] text-gray-700 leading-relaxed custom-scrollbar focus:outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400 [&:empty]:before:pointer-events-none pb-32"
                        style={{ minHeight: 0 }}
                    />
                </div>

                {/* Control Bar */}
                <div className="w-full shrink-0 flex flex-col md:flex-row items-end md:items-center justify-center gap-3 relative z-20 pb-4 md:pb-6 px-4 md:px-6 pt-4 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none [&>div]:pointer-events-auto">

                    {/* Topic Dropdown */}
                    <div className="relative shrink-0 w-full md:w-auto">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full md:w-auto bg-white rounded-[24px] border border-gray-200 p-2 shadow-sm flex items-center justify-between gap-3 text-gray-700 hover:bg-gray-50 transition-colors h-[52px] md:px-4"
                        >
                            <div className="flex items-center gap-2 pl-1">
                                <BookOpen className="w-4 h-4 text-blue-600" />
                                <span className="text-[14px] font-bold">Topics</span>
                                {selectedTopicNames.length > 0 && (
                                    <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-full ml-1">
                                        {selectedTopicNames.length}
                                    </span>
                                )}
                            </div>
                            <ChevronUp
                                className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute bottom-full left-0 mb-3 w-full md:w-[320px] max-h-[350px] overflow-y-auto bg-white rounded-2xl shadow-xl shadow-blue-900/10 border border-gray-100 p-3 z-50 custom-scrollbar flex flex-col gap-3">
                                {lessonPlan.syllabus.map((unit, unitIdx) => (
                                    <div key={unitIdx} className="space-y-1.5">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
                                            Unit {unitIdx + 1}: {unit.unit}
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            {unit.topics.map((topic, topicIdx) => {
                                                const isSelected = selectedTopicNames.includes(topic);
                                                return (
                                                    <button
                                                        key={topicIdx}
                                                        type="button"
                                                        onClick={() => toggleTopic(topic)}
                                                        className={`text-left px-3 py-2 rounded-xl text-[12px] font-medium transition-all flex items-center gap-2 group ${
                                                            isSelected
                                                                ? "bg-blue-50 text-blue-700"
                                                                : "hover:bg-gray-50 text-gray-700"
                                                        }`}
                                                    >
                                                        <div
                                                            className={`mt-0.5 w-4 h-4 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${
                                                                isSelected
                                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                                    : "bg-white border-gray-300 group-hover:border-blue-400"
                                                            }`}
                                                        >
                                                            {isSelected && (
                                                                <svg
                                                                    className="w-2.5 h-2.5"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="3"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                >
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <span className="leading-snug">{topic}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Instruction Input + Generate */}
                    <div className="w-full md:w-[600px] shrink-0 flex flex-col gap-2">
                        {generateError && (
                            <div className="text-[12px] text-red-500 font-medium px-2">
                                {generateError}
                            </div>
                        )}
                        <div className="bg-[#f4f4f5] rounded-[28px] flex items-center p-1.5 shadow-sm border border-gray-200 h-[52px]">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}
                                className="flex-1 flex items-center pl-4 h-full"
                            >
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={
                                        selectedTopicNames.length === 0
                                            ? "Select topics first..."
                                            : "Add focus or instructions (optional)..."
                                    }
                                    disabled={isGenerating}
                                    className="flex-1 bg-transparent border-none px-2 py-0 text-[14px] focus:ring-0 outline-none disabled:opacity-50 text-gray-800 placeholder:text-gray-500 font-medium h-full"
                                />
                                <div className="flex items-center shrink-0 pr-1 h-full py-1">
                                    <button
                                        type="submit"
                                        disabled={isGenerating || selectedTopicNames.length === 0}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                                            selectedTopicNames.length > 0 && !isGenerating
                                                ? "bg-[#D1D5DB] text-gray-700 hover:bg-gray-300 shadow-sm"
                                                : "bg-[#e4e4e7] text-gray-400"
                                        }`}
                                        title="Generate Content"
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <ArrowUp className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Open File Modal */}
            {isOpenerOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FolderOpen className="w-5 h-5 text-orange-500" />
                                Open Prepared Material
                            </h3>
                            <button
                                onClick={() => setIsOpenerOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/30">
                            {isLoadingFiles ? (
                                <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                    <span className="text-sm font-medium">Loading files...</span>
                                </div>
                            ) : savedFiles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-3">
                                    <FileText className="w-12 h-12 text-gray-300" />
                                    <span className="text-sm font-medium">No saved materials found.</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {savedFiles.map((file) => (
                                        <button
                                            key={file.id}
                                            onClick={() => loadSpecificFile(file)}
                                            className="w-full text-left bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group flex items-start gap-4"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                <span className="font-bold text-gray-900 text-[14px] truncate">
                                                    {file.title}
                                                </span>
                                                <span className="text-[12px] font-medium text-gray-400 truncate tracking-wide">
                                                    {file.createdAt
                                                        ? new Date(file.createdAt.seconds * 1000).toLocaleDateString()
                                                        : "Just now"}{" "}
                                                    · {file.content?.length || 0} chars
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteFile(e, file.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all shrink-0"
                                                title="Delete file"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

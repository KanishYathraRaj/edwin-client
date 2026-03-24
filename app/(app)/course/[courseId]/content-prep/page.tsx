"use client";

import { useState, useEffect, useRef, use } from "react";
import { Sparkles, CheckCircle2, Loader2, BookOpen, ChevronRight, Layout, MessageSquarePlus, Download, ChevronUp, Plus, Mic, ArrowUp, Save, MoreVertical, FilePlus, FolderOpen, X, FileText, Trash2 } from "lucide-react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getCourseDetails, savePreparedContent, getSavedPreparedContent, deletePreparedContent, updatePreparedContentTitle } from "@/lib/firebase/firestore";

interface Topic {
    unit: string;
    topics: string[];
}

interface SyllabusData {
    syllabus: Topic[];
}

export default function ContentPrep({ params }: {
    params: Promise<{
        courseId: string;
    }>;
}) {
    const { courseId } = use(params);
    const [user, setUser] = useState<User | null>(null);
    const [lessonPlan, setLessonPlan] = useState<SyllabusData | null>(null);
    const [preparedMaterials, setPreparedMaterials] = useState<any[]>([]);
    
    // Selection state for preparation mode
    const [selectedTopicNames, setSelectedTopicNames] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Top Right Menu States
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOpenerOpen, setIsOpenerOpen] = useState(false);
    const [savedFiles, setSavedFiles] = useState<any[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    
    // File tracking for updates/rename
    const [currentFileId, setCurrentFileId] = useState<string | null>(null);
    const [currentTitle, setCurrentTitle] = useState<string>("");
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [generatedContent, setGeneratedContent] = useState<string>("");
    const editorRef = useRef<HTMLDivElement>(null);

    // Convert markdown string to HTML string for rendering
    const renderToHTML = (md: string): string => {
        const bold = (s: string) => s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return md.split('\n').map(line => {
            const t = line.trim();
            if (t.startsWith('## ')) return `<h2 style="font-size:15px;font-weight:700;color:#1e40af;margin:20px 0 6px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">${bold(t.slice(3))}</h2>`;
            if (t.startsWith('# ')) return `<h1 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 12px">${bold(t.slice(2))}</h1>`;
            if (/^\d+\.\s/.test(t)) return `<div style="display:flex;gap:8px;margin:3px 0"><span style="color:#2563eb;font-weight:700;min-width:20px;flex-shrink:0">${t.match(/^\d+/)?.[0]}.</span><span>${bold(t.replace(/^\d+\.\s*/, ''))}</span></div>`;
            if (t.startsWith('- ') || t.startsWith('• ')) return `<div style="display:flex;gap:8px;margin:2px 0"><span style="color:#60a5fa;flex-shrink:0">•</span><span>${bold(t.slice(2))}</span></div>`;
            if (t === '') return `<div style="height:8px"></div>`;
            return `<p style="margin:3px 0">${bold(t)}</p>`;
        }).join('');
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    const loadData = async () => {
        if (user && courseId) {
            try {
                const data = await getCourseDetails(user.uid, courseId);
                
                // Load Lesson Plan
                if (data && data.lessonPlan) {
                    if (data.lessonPlan.syllabus) {
                        setLessonPlan(data.lessonPlan);
                    } else if (Array.isArray(data.lessonPlan)) {
                        setLessonPlan({ syllabus: data.lessonPlan });
                    }
                }

                // Load Prepared Materials
                if (data && data.preparedContent) {
                    // Sort by timestamp descending
                    const sorted = [...data.preparedContent].sort((a, b) => 
                        new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
                    );
                    setPreparedMaterials(sorted);
                }
            } catch (error) {
                console.error("Error loading course data:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        loadData();
    }, [user, courseId]);

    // Sync markdown state -> rendered HTML in the editor (only when not focused)
    useEffect(() => {
        if (editorRef.current) {
            if (document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = generatedContent ? renderToHTML(generatedContent) : '';
            }
        }
    }, [generatedContent]);

    const toggleTopic = (topic: string) => {
        setSelectedTopicNames(prev => 
            prev.includes(topic) 
                ? prev.filter(t => t !== topic) 
                : [...prev, topic]
        );
    };

    const downloadAsPDF = () => {
        if (!generatedContent) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        // Convert markdown lines to HTML
        const lines = generatedContent.split('\n');
        let htmlContent = "";
        const bold = (s: string) => s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("## ")) {
                htmlContent += `<h2>${bold(trimmed.slice(3))}</h2>`;
            } else if (trimmed.startsWith("# ")) {
                htmlContent += `<h1>${bold(trimmed.slice(2))}</h1>`;
            } else if (/^\d+\.\s/.test(trimmed)) {
                htmlContent += `<p class="numbered"><span class="num">${trimmed.match(/^\d+/)?.[0]}.</span>${bold(trimmed.replace(/^\d+\.\s*/, ''))}</p>`;
            } else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
                htmlContent += `<p class="bullet"><span class="dot">•</span>${bold(trimmed.slice(2))}</p>`;
            } else if (trimmed === "") {
                htmlContent += `<div style="height:8px"></div>`;
            } else {
                htmlContent += `<p>${bold(trimmed)}</p>`;
            }
        }

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Content</title>
<style>
  @page { margin: 15mm 20mm; size: A4; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 13pt; line-height: 1.7; margin: 0; padding: 0; }
  h1 { font-size: 20pt; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-top: 0; margin-bottom: 16px; }
  h2 { font-size: 14pt; color: #1e40af; margin-top: 24px; margin-bottom: 8px; }
  p { margin: 4px 0 8px 0; }
  .numbered { display: flex; gap: 8px; margin: 4px 0; }
  .num { color: #2563eb; font-weight: bold; min-width: 24px; flex-shrink: 0; }
  .bullet { display: flex; gap: 8px; margin: 3px 0; }
  .dot { color: #60a5fa; min-width: 16px; flex-shrink: 0; }
  strong { font-weight: 600; }
</style>
</head>
<body>${htmlContent}</body>
</html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 400);
    };

    const handleGenerate = async () => {
        if (!user || selectedTopicNames.length === 0) return;

        setIsGenerating(true);
        try {
            const response = await fetch("http://localhost:3000/content-prep", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.uid,
                    courseId: courseId,
                    topics: selectedTopicNames,
                    description: description
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Server error:", errorData);
                throw new Error(errorData.error || errorData.details || "Failed to start content generation");
            }

            const data = await response.json();
            
            // Auto-show the new content
            if (data.content) {
                let formattedText = "";
                if (typeof data.content === 'string') {
                    formattedText = data.content;
                } else {
                    const c = data.content;
                    if (c.explanation) {
                        formattedText += `## Detailed Explanation\n${c.explanation}\n\n`;
                    }
                    if (c.key_points && Array.isArray(c.key_points) && c.key_points.length > 0) {
                        formattedText += `## Key Highlights\n${c.key_points.map((p: string) => `- ${p}`).join('\n')}\n\n`;
                    }
                    if (c.examples && Array.isArray(c.examples) && c.examples.length > 0) {
                        formattedText += `## Practical Examples\n${c.examples.map((e: string) => `- ${e}`).join('\n')}\n\n`;
                    }
                    if (c.questions && Array.isArray(c.questions) && c.questions.length > 0) {
                        formattedText += `## Review Questions\n${c.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}\n\n`;
                    }
                    
                    if (!formattedText.trim()) {
                        formattedText = JSON.stringify(data.content, null, 2);
                    }
                }
                setGeneratedContent(formattedText.trim());
            }

            // Refetch data to update history list
            await loadData();
            setSelectedTopicNames([]);
            setDescription("");
        } catch (error: any) {
            console.error("Error in content preparation:", error);
            alert(`Failed: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!user || !generatedContent || !courseId) return;
        setIsSaving(true);
        try {
            let title = selectedTopicNames.length > 0 ? selectedTopicNames.join(", ") : "";
            
            if (!title) {
                const existingFiles = await getSavedPreparedContent(user.uid, courseId);
                let highest = 0;
                existingFiles.forEach(f => {
                    const lowercaseTitle = (f.title || "").toLowerCase();
                    if (lowercaseTitle.startsWith("untitled")) {
                        const parts = lowercaseTitle.split("-");
                        if (parts.length > 1) {
                            const num = parseInt(parts[1], 10);
                            if (!isNaN(num) && num > highest) {
                                highest = num;
                            }
                        } else if (lowercaseTitle === "untitled" && highest === 0) {
                            highest = 0;
                        }
                    }
                });
                title = `Untitled-${highest + 1}`;
            }

            const result = await savePreparedContent(user.uid, courseId, generatedContent, title);
            if (result) {
                alert("Content saved successfully!");
                // refresh files if opener is somehow active behind the scenes
                getSavedPreparedContent(user.uid, courseId).then(setSavedFiles);
            } else {
                alert("Failed to save content. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleNewFile = () => {
        setGeneratedContent("");
        setDescription("");
        setSelectedTopicNames([]);
        setIsMenuOpen(false);
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
        }
    };

    const handleOpenFileOpener = async () => {
        setIsMenuOpen(false);
        if (!user || !courseId) return;
        setIsOpenerOpen(true);
        setIsLoadingFiles(true);
        try {
            const files = await getSavedPreparedContent(user.uid, courseId);
            setSavedFiles(files);
        } catch (error) {
            console.error("Failed to load files:", error);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const loadSpecificFile = (file: any) => {
        setGeneratedContent(file.content);
        if (editorRef.current) {
            editorRef.current.innerHTML = renderToHTML(file.content);
        }
        setIsOpenerOpen(false);
    };

    const handleDeleteFile = async (e: React.MouseEvent, fileId: string) => {
        e.stopPropagation();
        if (!user || !courseId) return;
        
        if (!confirm("Are you sure you want to delete this specific material?")) return;
        
        try {
            const success = await deletePreparedContent(user.uid, courseId, fileId);
            if (success) {
                setSavedFiles(prev => prev.filter(f => f.id !== fileId));
                if (currentFileId === fileId) {
                    handleNewFile();
                }
            } else {
                alert("Failed to delete file.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleTitleRenameSubmit = async () => {
        setIsEditingTitle(false);
        const newTitle = currentTitle.trim() || "Untitled";
        setCurrentTitle(newTitle);

        if (currentFileId && user && courseId) {
            try {
                const success = await updatePreparedContentTitle(user.uid, courseId, currentFileId, newTitle);
                if (success) {
                    setSavedFiles(prev => prev.map(f => f.id === currentFileId ? { ...f, title: newTitle } : f));
                }
            } catch (error) {
                console.error("Failed to update title in DB", error);
            }
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
                        Please generate a lesson plan first in the <span className="text-blue-600 font-semibold">Lesson Planner</span> before preparing content.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col h-[100dvh] font-sans text-left relative overflow-hidden bg-white">
            {/* Main Application Interface */}

            {/* Main Layout Area */}
            <div className="flex flex-col flex-1 overflow-hidden">
                
                {/* Editable Canvas (Top/Full Space) */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    
                    {/* Top Left File Title */}
                    <div className="absolute top-4 left-4 md:left-8 z-40 flex items-center gap-2 group">
                        {isEditingTitle ? (
                            <input
                                autoFocus
                                type="text"
                                value={currentTitle}
                                onChange={(e) => setCurrentTitle(e.target.value)}
                                onBlur={handleTitleRenameSubmit}
                                onKeyDown={(e) => e.key === 'Enter' && handleTitleRenameSubmit()}
                                className="bg-white border hover:border-blue-400 focus:border-blue-500 rounded-lg px-3 py-1.5 text-[14px] font-bold text-gray-800 outline-none w-56 shadow-sm shadow-blue-500/10 transition-all z-50 relative"
                            />
                        ) : (
                            <button
                                onClick={() => setIsEditingTitle(true)}
                                className="px-3 py-1.5 rounded-lg text-[14px] font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all truncate max-w-[200px] md:max-w-xs flex items-center gap-2 shadow-sm shadow-transparent hover:shadow-gray-200/50 z-50 relative"
                                title="Click to rename"
                            >
                                <FileText className="w-4 h-4 text-blue-500" />
                                {currentTitle || "Untitled"}
                            </button>
                        )}
                    </div>

                    {/* Top Right Actions Menu */}
                    <div className="absolute top-4 right-4 z-40">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="bg-white hover:bg-gray-100 text-gray-700 p-2.5 rounded-full shadow-sm border border-gray-200 transition-all flex items-center justify-center"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute top-14 right-0 w-56 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-2 flex flex-col">
                                <button onClick={handleNewFile} className="flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-blue-50 rounded-xl transition-colors text-left group">
                                    <FilePlus className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" /> New File
                                </button>
                                <button onClick={handleOpenFileOpener} className="flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-orange-50 rounded-xl transition-colors text-left group">
                                    <FolderOpen className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" /> Open File
                                </button>
                                <div className="h-px bg-gray-100 my-1 mx-2"></div>
                                <button onClick={() => { handleSave(); setIsMenuOpen(false); }} disabled={isSaving || !generatedContent} className="flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-green-50 rounded-xl transition-colors text-left disabled:opacity-50 group">
                                    <Save className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" /> Save to Course
                                </button>
                                <button onClick={() => { downloadAsPDF(); setIsMenuOpen(false); }} disabled={!generatedContent} className="flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-purple-50 rounded-xl transition-colors text-left disabled:opacity-50 group">
                                    <Download className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" /> Download PDF
                                </button>
                            </div>
                        )}
                    </div>

                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={() => {
                            if (editorRef.current) {
                                setGeneratedContent(editorRef.current.innerText);
                            }
                        }}
                        onBlur={() => {
                            if (editorRef.current) {
                                const text = editorRef.current.innerText;
                                setGeneratedContent(text);
                                editorRef.current.innerHTML = renderToHTML(text);
                            }
                        }}
                        data-placeholder="Select topics below, provide instructions, and click 'Generate' to see the AI course materials flowing right here..."
                        className={`flex-1 overflow-y-auto w-full max-w-5xl mx-auto px-6 py-8 md:px-12 md:py-16 text-[14px] md:text-[15px] text-gray-700 leading-relaxed custom-scrollbar focus:outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400 [&:empty]:before:pointer-events-none pb-32`}
                        style={{ minHeight: 0 }}
                    />
                </div>

                {/* Control Bar Area (Bottom) */}
                <div className="w-full shrink-0 flex flex-col md:flex-row items-end md:items-center justify-center gap-3 relative z-20 pb-4 md:pb-6 px-4 md:px-6 pt-4 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none [&>div]:pointer-events-auto">
                    
                    {/* Topic Selection Dropdown Button */}
                    <div className="relative shrink-0 w-full md:w-auto">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full md:w-auto bg-white rounded-[24px] border border-gray-200 p-2 shadow-sm flex items-center justify-between gap-3 text-gray-700 hover:bg-gray-50 transition-colors h-[52px] md:px-4"
                            title="Select Topics"
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
                            <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute bottom-full left-0 mb-3 w-full md:w-[320px] max-h-[350px] overflow-y-auto bg-white rounded-2xl shadow-xl shadow-blue-900/10 border border-gray-100 p-3 z-50 custom-scrollbar flex flex-col gap-3">
                                {lessonPlan.syllabus.map((unit, unitIdx) => (
                                    <div key={unitIdx} className="space-y-1.5">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Unit {unitIdx + 1}: {unit.unit}</div>
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
                                                        <div className={`mt-0.5 w-4 h-4 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${
                                                            isSelected ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 group-hover:border-blue-400"
                                                        }`}>
                                                            {isSelected && <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                        </div>
                                                        <span className="leading-snug">{topic}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat Input (Middle) - Minimalist Pill style restricted width */}
                    <div className="w-full md:w-[600px] bg-[#f4f4f5] rounded-[28px] flex items-center p-1.5 shadow-sm border border-gray-200 shrink-0 h-[52px]">
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}
                            className="flex-1 flex items-center pl-4 h-full"
                        >
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Type your message here..."
                                disabled={isGenerating || selectedTopicNames.length === 0}
                                className="flex-1 bg-transparent border-none px-2 py-0 text-[14px] focus:ring-0 outline-none disabled:opacity-50 text-gray-800 placeholder:text-gray-500 font-medium h-full"
                            />
                            
                            <div className="flex items-center gap-1 shrink-0 pr-1 h-full py-1">
                                <button type="button" className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-full transition-colors hidden sm:flex shrink-0" title="Voice Input (Demo)">
                                    <Mic className="w-5 h-5" />
                                </button>
                                
                                <button
                                    type="submit"
                                    disabled={isGenerating || selectedTopicNames.length === 0}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                                        description.trim().length > 0 && selectedTopicNames.length > 0 && !isGenerating
                                            ? "bg-[#D1D5DB] text-gray-700 hover:bg-gray-300 shadow-sm" 
                                            : "bg-[#e4e4e7] text-gray-400"
                                    }`}
                                    title="Prepare Content"
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

            {/* Open File Modal */}
            {isOpenerOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FolderOpen className="w-5 h-5 text-orange-500" />
                                Open Prepared Material
                            </h3>
                            <button onClick={() => setIsOpenerOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
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
                                                <span className="font-bold text-gray-900 text-[14px] truncate">{file.title}</span>
                                                <span className="text-[12px] font-medium text-gray-400 truncate tracking-wide">
                                                    {file.createdAt ? new Date(file.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'} · {file.content?.length || 0} chars
                                                </span>
                                            </div>
                                            <div 
                                                onClick={(e) => handleDeleteFile(e, file.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all shrink-0"
                                                title="Delete file"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </div>
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

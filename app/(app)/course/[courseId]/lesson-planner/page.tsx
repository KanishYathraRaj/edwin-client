"use client";

import { useState, useRef, use } from "react";
import { FileText, Upload, Plus, Trash2, FileCheck, BookOpen, AlertCircle } from "lucide-react";

export default function LessonPlanner({ params }: {
    params: Promise<{
        courseId: string;
    }>;
}) {
    const { courseId } = use(params);
    const [syllabus, setSyllabus] = useState<File | null>(null);
    const [references, setReferences] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const syllabusInputRef = useRef<HTMLInputElement>(null);
    const referenceInputRef = useRef<HTMLInputElement>(null);

    const handleSyllabusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSyllabus(e.target.files[0]);
        }
    };

    const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setReferences(prev => [...prev, ...newFiles]);
        }
    };

    const removeReference = (index: number) => {
        setReferences(prev => prev.filter((_, i) => i !== index));
    };

    const handleUploadAll = async () => {
        setIsUploading(true);
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsUploading(false);
        alert("Files processed successfully! Edwin is now analyzing your materials.");
    };

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-12">
            {/* Header Section */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                    Lesson Planner
                </h1>
                <p className="text-gray-500 max-w-2xl">
                    Upload your course materials to help Edwin understand your objectives, structure, and content.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Syllabus Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            Course Syllabus
                        </h2>
                        {syllabus && (
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100 font-medium">
                                Added
                            </span>
                        )}
                    </div>

                    <div 
                        onClick={() => syllabusInputRef.current?.click()}
                        className={`group relative overflow-hidden rounded-2xl border-2 border-dashed transition-all cursor-pointer h-48 flex flex-col items-center justify-center p-6 text-center ${
                            syllabus 
                            ? "border-green-200 bg-green-50/30" 
                            : "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30"
                        }`}
                    >
                        <input 
                            type="file" 
                            ref={syllabusInputRef}
                            onChange={handleSyllabusChange}
                            className="hidden" 
                            accept=".pdf,.doc,.docx,.txt"
                        />
                        
                        {syllabus ? (
                            <div className="space-y-3">
                                <FileCheck className="w-10 h-10 text-green-600 mx-auto" />
                                <div>
                                    <p className="text-sm font-bold text-gray-900 truncate max-w-[200px] mx-auto">
                                        {syllabus.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Click to replace syllabus
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Upload Syllabus</p>
                                    <p className="text-xs text-gray-500 mt-1">PDF, Word, or Text files</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* References Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-blue-600" />
                            Reference Materials
                        </h2>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 font-medium">
                            {references.length} {references.length === 1 ? 'File' : 'Files'}
                        </span>
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {references.map((file, index) => (
                            <div 
                                key={index}
                                className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors group"
                            >
                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {file.name}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => removeReference(index)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        <button 
                            onClick={() => referenceInputRef.current?.click()}
                            className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all text-sm font-medium"
                        >
                            <input 
                                type="file" 
                                ref={referenceInputRef}
                                onChange={handleReferenceChange}
                                className="hidden" 
                                multiple
                            />
                            <Plus className="w-4 h-4" />
                            Add Materials
                        </button>
                    </div>

                    {references.length === 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 p-2">
                            <AlertCircle className="w-3 h-3" />
                            Add textbooks, notes, or research papers for better planning.
                        </div>
                    )}
                </div>
            </div>

            {/* Action Section */}
            <div className="pt-8 border-t flex items-center justify-end">
                <button 
                    onClick={handleUploadAll}
                    disabled={!syllabus || isUploading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                    {isUploading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Analyze & Plan Course
                            <FileCheck className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
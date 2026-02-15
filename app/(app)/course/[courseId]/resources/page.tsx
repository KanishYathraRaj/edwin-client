"use client";

import { useState, useRef, use } from "react";
import { FileText, Plus, Trash2, Save, FileUp, AlertCircle, Database, Upload, CheckCircle2 } from "lucide-react";

interface ResourceFile {
    file: File;
    status: 'saved' | 'unsaved';
    id: string; // unique id for list management
}

export default function Resources({ params }: {
    params: Promise<{
        courseId: string;
    }>;
}) {
    const { courseId } = use(params);
    const [syllabus, setSyllabus] = useState<ResourceFile | null>(null);
    const [references, setReferences] = useState<ResourceFile[]>([]);
    
    // Track saving state per item ID or section
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

    const syllabusInputRef = useRef<HTMLInputElement>(null);
    const referenceInputRef = useRef<HTMLInputElement>(null);

    const handleSyllabusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSyllabus({
                file: e.target.files[0],
                status: 'unsaved',
                id: 'syllabus-' + Date.now()
            });
        }
    };

    const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                status: 'unsaved' as const,
                id: 'ref-' + Date.now() + '-' + Math.random()
            }));
            setReferences(prev => [...prev, ...newFiles]);
        }
    };

    const saveSyllabus = async () => {
        if (!syllabus) return;
        setSavingIds(prev => new Set(prev).add(syllabus.id));
        
        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSyllabus(prev => prev ? { ...prev, status: 'saved' } : null);
        setSavingIds(prev => {
            const next = new Set(prev);
            next.delete(syllabus.id);
            return next;
        });
    };

    const removeSyllabus = () => {
        // If saved, we would normally delete from server here
        setSyllabus(null);
    };

    const saveReference = async (id: string) => {
        setSavingIds(prev => new Set(prev).add(id));
        
        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setReferences(prev => prev.map(ref => 
            ref.id === id ? { ...ref, status: 'saved' } : ref
        ));
        
        setSavingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const removeReference = (id: string) => {
        // If saved, delete from server. If unsaved, just remove from list.
        setReferences(prev => prev.filter(ref => ref.id !== id));
    };

    return (
        <div className="w-full p-6 space-y-8 font-sans">
             {/* Header */}
             <div className="pb-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Database className="w-7 h-7 text-blue-600" />
                    Resources
                </h1>
                <p className="text-gray-500 mt-2">
                    Manage your course materials for <span className="font-semibold text-gray-700">{courseId}</span>. 
                    Save items individually to update Edwin's knowledge base.
                </p>
            </div>

            <div className="space-y-8">
                {/* 1. Syllabus Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            Syllabus
                        </h2>
                        {syllabus && syllabus.status === 'saved' && (
                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Saved
                            </span>
                        )}
                        {syllabus && syllabus.status === 'unsaved' && (
                             <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Not Saved
                            </span>
                        )}
                    </div>
                    
                    <div>
                        {syllabus ? (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 group hover:border-blue-200 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${syllabus.status === 'saved' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{syllabus.file.name}</p>
                                        <p className="text-xs text-gray-500">{(syllabus.file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {syllabus.status === 'unsaved' && (
                                        <button 
                                            onClick={saveSyllabus}
                                            disabled={savingIds.has(syllabus.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {savingIds.has(syllabus.id) ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Save
                                        </button>
                                    )}
                                    
                                    <button 
                                        onClick={() => syllabusInputRef.current?.click()}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Replace
                                    </button>
                                    <button 
                                        onClick={removeSyllabus}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Syllabus"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div 
                                onClick={() => syllabusInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/10 cursor-pointer transition-all bg-gray-50/50"
                            >
                                <Upload className="w-8 h-8 mb-2" />
                                <span className="font-medium">Upload Syllabus</span>
                                <span className="text-xs mt-1 opacity-70">PDF, DOCX, TXT</span>
                            </div>
                        )}
                         <input 
                            type="file" 
                            ref={syllabusInputRef}
                            onChange={handleSyllabusChange}
                            className="hidden" 
                            accept=".pdf,.doc,.docx,.txt"
                        />
                    </div>
                </div>

                {/* 2. References Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-600" />
                            Reference Materials
                        </h2>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {references.length} Items
                        </span>
                    </div>

                    <div className="space-y-2">
                        {references.length === 0 && (
                             <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                                <p className="text-sm">No reference materials added yet.</p>
                            </div>
                        )}
                        
                        {references.map((item) => (
                            <div key={item.id} className="p-4 flex items-center justify-between bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors group first:border-t-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.status === 'saved' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                        <FileUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 truncate max-w-md">{item.file.name}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-gray-500">{(item.file.size / 1024).toFixed(1)} KB</p>
                                            {item.status === 'unsaved' && (
                                                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Unsaved</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.status === 'unsaved' && (
                                         <button 
                                            onClick={() => saveReference(item.id)}
                                            disabled={savingIds.has(item.id)}
                                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {savingIds.has(item.id) ? "Saving..." : "Save"}
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => removeReference(item.id)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove File"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add Button */}
                        <div 
                            onClick={() => referenceInputRef.current?.click()}
                            className="mt-4 p-3 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer flex items-center justify-center gap-2 transition-all text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Reference Material
                        </div>
                        <input 
                            type="file" 
                            ref={referenceInputRef}
                            onChange={handleReferenceChange}
                            className="hidden" 
                            multiple
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
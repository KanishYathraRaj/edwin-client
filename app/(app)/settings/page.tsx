"use client";

import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChange, updateDisplayName, sendPasswordReset } from "@/lib/firebase/auth";
import { User, Mail, Lock, Check, Loader2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [displayName, setDisplayName] = useState("");
    const [nameLoading, setNameLoading] = useState(false);
    const [nameSuccess, setNameSuccess] = useState(false);
    const [nameError, setNameError] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetError, setResetError] = useState("");

    useEffect(() => {
        const unsub = onAuthStateChange(u => {
            setUser(u);
            setDisplayName(u?.displayName ?? "");
        });
        return () => unsub();
    }, []);

    const handleSaveName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !displayName.trim()) return;
        setNameLoading(true);
        setNameError("");
        setNameSuccess(false);
        try {
            await updateDisplayName(displayName.trim());
            setNameSuccess(true);
            setTimeout(() => setNameSuccess(false), 3000);
        } catch {
            setNameError("Failed to update display name. Please try again.");
        } finally {
            setNameLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        setResetLoading(true);
        setResetError("");
        setResetSuccess(false);
        try {
            await sendPasswordReset(user.email);
            setResetSuccess(true);
        } catch {
            setResetError("Failed to send reset email. Please try again.");
        } finally {
            setResetLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
                <p className="text-gray-500 mt-1 font-medium">Manage your account preferences.</p>
            </div>

            {/* Profile section */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <h2 className="font-semibold text-gray-800 text-sm">Profile</h2>
                </div>
                <div className="p-6 space-y-5">
                    {/* Email (read-only) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> Email
                        </label>
                        <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium select-all">
                            {user.email}
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">Email cannot be changed.</p>
                    </div>

                    {/* Display name */}
                    <form onSubmit={handleSaveName} className="space-y-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="Your name"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                        {nameError && (
                            <p className="text-xs text-red-600 flex items-center gap-1.5 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {nameError}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={nameLoading || displayName.trim() === (user.displayName ?? "")}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {nameLoading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                            ) : nameSuccess ? (
                                <><Check className="w-4 h-4" /> Saved</>
                            ) : (
                                "Save Name"
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Security section */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <h2 className="font-semibold text-gray-800 text-sm">Security</h2>
                </div>
                <div className="p-6 space-y-3">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Password</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            A reset link will be sent to <span className="font-medium text-gray-600">{user.email}</span>.
                        </p>
                    </div>
                    {resetSuccess && (
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm font-medium">
                            <Check className="w-4 h-4 flex-shrink-0" />
                            Password reset email sent. Check your inbox.
                        </div>
                    )}
                    {resetError && (
                        <p className="text-xs text-red-600 flex items-center gap-1.5 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {resetError}
                        </p>
                    )}
                    <button
                        onClick={handlePasswordReset}
                        disabled={resetLoading || resetSuccess}
                        className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {resetLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                        ) : (
                            "Send Password Reset Email"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

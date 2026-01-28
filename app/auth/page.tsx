"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmail, signUpWithEmail } from "@/lib/firebase/auth";

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const userCredential = isLogin 
                ? await signInWithEmail(email, password) 
                : await signUpWithEmail(email, password);

            console.log("Auth success:", userCredential.user);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex justify-start p-6">
                <Link 
                    href="/" 
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
                >
                    <svg 
                        className="w-5 h-5 transition-transform group-hover:-translate-x-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-medium">Back to Home</span>
                </Link>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900">Edwin AI</h2>
                        <p className="text-gray-500 text-sm mt-2">Teacher's AI Assistant</p>
                    </div>

                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                                isLogin 
                                    ? "bg-white text-blue-600 shadow-sm" 
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                                !isLogin 
                                    ? "bg-white text-blue-600 shadow-sm" 
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="name@example.com"
                                disabled={loading}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-md transition-colors"
                        >
                            {loading ? "Processing..." : (isLogin ? "Login" : "Sign Up")}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

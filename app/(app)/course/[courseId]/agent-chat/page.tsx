"use client";

import { useState, useRef, useEffect, use } from "react";
import { Send, User as UserIcon, Bot, Loader2 } from "lucide-react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getCourseChatHistory } from "@/lib/firebase/firestore";

interface Message {
    role: "user" | "agent";
    content: string;
}

export default function AgentChat({ params: paramsPromise }: {
    params: Promise<{
        courseId: string;
    }>;
}) {
    const params = use(paramsPromise);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [streamingMessage, setStreamingMessage] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const history = await getCourseChatHistory(currentUser.uid, params.courseId);
                const formattedMessages: Message[] = history.map((msg: any) => ({
                    role: msg.role === "system" ? "agent" : "user",
                    content: msg.content
                }));
                setMessages(formattedMessages);
            }
            setIsHistoryLoading(false);
        });
        return () => unsubscribe();
    }, [params.courseId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);
        setStreamingMessage("");

        try {
            const courseId = (await params).courseId;
            const response = await fetch("http://localhost:3000/agent-chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    message: userMessage,
                    userId: user?.uid,
                    courseId: courseId
                }),
            });

            if (!response.body) {
                throw new Error("No response body");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullMessage = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        try {
                            const parsed = JSON.parse(data);
                            
                            if (parsed.type === 'chunk') {
                                fullMessage += parsed.content;
                                setStreamingMessage(fullMessage);
                            } else if (parsed.type === 'done') {
                                setMessages(prev => [...prev, { role: "agent", content: fullMessage }]);
                                setStreamingMessage("");
                            } else if (parsed.type === 'error') {
                                setMessages(prev => [...prev, { 
                                    role: "agent", 
                                    content: "Sorry, I encountered an error. Please try again." 
                                }]);
                                setStreamingMessage("");
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { 
                role: "agent", 
                content: "Failed to connect to the agent. Make sure the server is running." 
            }]);
            setStreamingMessage("");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900">Agent Assistant</h1>
                        <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isHistoryLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            <p className="text-sm text-gray-500 font-medium">Loading previous chats...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.length === 0 && !streamingMessage && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                    <Bot className="w-10 h-10" />
                                </div>
                                <div className="max-w-xs">
                                    <h3 className="text-lg font-bold text-gray-900">How can I help you today?</h3>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Ask me anything about your course, lesson plans, or assessments.
                                    </p>
                                </div>
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${m.role === "user" ? "bg-indigo-600" : "bg-white border"
                                    }`}>
                                    {m.role === "user" ? (
                                        <UserIcon className="w-4 h-4 text-white" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-blue-600" />
                                    )}
                                </div>
                                <div className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm transition-all ${m.role === "user"
                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                    : "bg-white text-gray-800 border rounded-tl-none"
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}

                        {streamingMessage && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Bot className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="max-w-[75%] bg-white text-gray-800 border p-4 rounded-2xl rounded-tl-none shadow-sm text-sm leading-relaxed">
                                    {streamingMessage}
                                    <span className="inline-block w-1 h-4 bg-blue-600 ml-1 animate-pulse"></span>
                                </div>
                            </div>
                        )}

                        {isLoading && !streamingMessage && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Bot className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="bg-white border text-gray-500 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                    <span className="text-xs font-medium">Edwin is thinking...</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t p-4 px-6">
                <form 
                    onSubmit={handleSendMessage}
                    className="max-w-4xl mx-auto flex gap-3 relative"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message here..."
                        disabled={isLoading}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 font-medium"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>
                <p className="text-[10px] text-gray-400 text-center mt-3 uppercase font-bold tracking-widest leading-none">
                    Edwin AI Agent • Powered by Google Deepmind
                </p>
            </div>
        </div>
    );
}
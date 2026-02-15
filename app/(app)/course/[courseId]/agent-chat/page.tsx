"use client";

import { useState, useRef, useEffect, use } from "react";
import { Send, User as UserIcon, Bot, Loader2, Plus, Mic, ArrowUp } from "lucide-react";
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
        <div className="flex flex-col h-[calc(100vh-64px)] bg-white overflow-hidden">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-32">
                <div className="max-w-4xl mx-auto w-full space-y-6">
                    {isHistoryLoading ? (
                        <div className="h-full flex items-center justify-center min-h-[400px]">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                <p className="text-sm text-gray-500 font-medium">Loading previous chats...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.length === 0 && !streamingMessage && (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-12 min-h-[400px]">
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
                                    className={`flex ${m.role === "user" ? "flex-row-reverse" : "flex-row"} w-full`}
                                >
                                    <div className={`text-sm leading-relaxed transition-all ${m.role === "user"
                                        ? "max-w-[85%] md:max-w-[80%] p-3.5 px-5 rounded-3xl bg-[#f4f4f4] text-[#131313]"
                                        : "w-full text-gray-800 py-2"
                                        }`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}

                            {streamingMessage && (
                                <div className="flex flex-row w-full">
                                    <div className="w-full text-gray-800 text-sm leading-relaxed py-2">
                                        {streamingMessage}
                                        <span className="inline-block w-1.5 h-4 bg-blue-600 ml-1 animate-pulse align-middle"></span>
                                    </div>
                                </div>
                            )}

                            {isLoading && !streamingMessage && (
                                <div className="flex flex-row w-full py-2">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                        <span className="text-xs font-medium italic">Edwin is thinking...</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/80 backdrop-blur-sm px-4 md:px-6 pb-4">
                <div className="max-w-4xl mx-auto">
                    <form 
                        onSubmit={handleSendMessage}
                        className="relative flex items-center bg-[#f4f4f4] rounded-full px-4 py-1.5 border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500"
                    >
                        <button
                            type="button"
                            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message here..."
                            disabled={isLoading}
                            className="flex-1 bg-transparent border-none px-4 py-2 text-sm focus:ring-0 outline-none disabled:opacity-50 font-medium text-gray-800"
                        />
                        
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                            
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white p-2 rounded-full shadow-md transition-all active:scale-95 flex items-center justify-center flex-shrink-0"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <ArrowUp className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </form>
                    
                    <p className="text-[11px] text-gray-400 text-center mt-1.5 font-medium">
                        Edwin can make mistakes. Check important info.
                    </p>
                </div>
            </div>
        </div>
    );
}
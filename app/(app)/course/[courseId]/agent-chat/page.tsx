"use client";

import { useState, useRef, useEffect, use } from "react";
import { Send, User as Bot, Loader2, Mic, MicOff, ArrowUp } from "lucide-react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getCourseChatHistory } from "@/lib/firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiStream } from "@/lib/api";

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
    const [isListening, setIsListening] = useState(false);
    const [courseTitle, setCourseTitle] = useState("");
    const [failedMessage, setFailedMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const historyLoadedRef = useRef(false);
    const recognitionRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        historyLoadedRef.current = false;
    }, [params.courseId]);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (currentUser) => {
            setUser(currentUser);
            // Only load history once per courseId — prevents reload on Firebase token refresh
            if (currentUser && !historyLoadedRef.current) {
                historyLoadedRef.current = true;
                const { getCourseDetails } = await import("@/lib/firebase/firestore");
                const details = await getCourseDetails(currentUser.uid, params.courseId);
                setCourseTitle(details?.title || "");
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

    const handleVoiceInput = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) return;
        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results as any[])
                .map((r: any) => r[0].transcript)
                .join("");
            setInput(transcript);
        };
        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);
        setStreamingMessage("");

        try {
            let fullMessage = "";
            await apiStream(
                "/agent-chat",
                { message: userMessage, courseId: params.courseId },
                (chunk) => {
                    fullMessage += chunk;
                    setStreamingMessage(fullMessage);
                }
            );
            setMessages(prev => [...prev, { role: "agent", content: fullMessage }]);
            setStreamingMessage("");
        } catch (error: any) {
            console.error("Chat Error:", error);
            setFailedMessage(userMessage);
            setMessages(prev => [...prev, {
                role: "agent",
                content: "Sorry, I couldn't reach the assistant. Please try again.",
            }]);
            setStreamingMessage("");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-4">
                <div className="max-w-4xl mx-auto w-full space-y-6">
                    {isHistoryLoading ? (
                        <div className="space-y-6 animate-pulse min-h-[400px] pt-2">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                                <div className="space-y-2 max-w-sm flex-1">
                                    <div className="h-4 bg-gray-200 rounded-lg w-full" />
                                    <div className="h-4 bg-gray-200 rounded-lg w-4/5" />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <div className="h-4 bg-gray-100 rounded-lg w-40" />
                            </div>
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                                <div className="space-y-2 max-w-md flex-1">
                                    <div className="h-4 bg-gray-200 rounded-lg w-full" />
                                    <div className="h-4 bg-gray-200 rounded-lg w-2/3" />
                                    <div className="h-4 bg-gray-200 rounded-lg w-5/6" />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <div className="space-y-2 max-w-xs">
                                    <div className="h-4 bg-gray-100 rounded-lg w-32" />
                                </div>
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
                                            {courseTitle
                                                ? `Ask me anything about ${courseTitle} — lesson plans, materials, or assessments.`
                                                : "Ask me anything about your course, lesson plans, or assessments."}
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
                                        <div className="prose prose-sm max-w-none 
                                                        prose-table:border 
                                                        prose-th:border 
                                                        prose-td:border     
                                                        prose-th:bg-gray-100">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {m.content}
                                            </ReactMarkdown>
                                        </div>
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
            <div className="shrink-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 px-4 md:px-6 pb-4 pt-2">
                {failedMessage && (
                    <div className="max-w-4xl mx-auto mb-2 flex items-center gap-2 text-xs text-red-600 font-medium">
                        <span>Message failed.</span>
                        <button
                            onClick={() => { setInput(failedMessage); setFailedMessage(""); }}
                            className="underline hover:text-red-800 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}
                <div className="max-w-4xl mx-auto">
                    <form 
                        onSubmit={handleSendMessage}
                        className="relative flex items-center bg-[#f4f4f4] rounded-full px-4 py-1.5 border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message here..."
                            disabled={isLoading}
                            className="flex-1 bg-transparent border-none px-4 py-2 text-sm focus:ring-0 outline-none disabled:opacity-50 font-medium text-gray-800"
                        />
                        
                        <div className="flex items-center gap-1">
                            {isListening && (
                                <span className="text-xs text-red-500 font-semibold animate-pulse mr-1">
                                    Recording...
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleVoiceInput}
                                aria-label={isListening ? "Stop voice input" : "Start voice input"}
                                className={`p-2 rounded-full transition-all ${
                                    isListening
                                        ? "text-red-600 bg-red-50 animate-pulse"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>

                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                aria-label="Send message"
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
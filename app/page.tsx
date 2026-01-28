"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChange } from "@/lib/firebase/auth";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        router.push("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const workflows = [
    {
      title: "Lesson Planner",
      description: "Create structured, engaging lesson plans in seconds with AI assistance.",
      icon: "📚",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Content Preparation",
      description: "Generate reading materials, summaries, and handouts tailored to your students.",
      icon: "📄",
      color: "from-purple-500 to-indigo-500"
    },
    {
      title: "Quiz Generation",
      description: "Instantly create assessments and quizzes based on your course content.",
      icon: "✍️",
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Question Bank",
      description: "Build and manage a repository of questions for versatile testing.",
      icon: "🗄️",
      color: "from-green-500 to-teal-500"
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col scroll-smooth">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
        <header className="flex justify-between items-center p-6 max-w-7xl mx-auto w-full">
          <div className="text-2xl font-bold bg-blue-600 bg-clip-text text-transparent italic">Edwin AI</div>
          <Link 
            href="/auth" 
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg"
          >
            Get Started
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-5xl mx-auto">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              AI-Powered Workflow for Educators
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 tracking-tight">
              Teach More, <span className="text-blue-600">Plan Less.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Edwin AI is your agentic assistant that automates the daily chores of teaching, from lesson planning to assessment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link 
                href="/auth" 
                className="px-10 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all font-bold text-lg shadow-xl hover:scale-105 active:scale-95"
              >
                Start Using Edwin
              </Link>
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-4 bg-white text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition-all font-bold text-lg shadow-sm"
              >
                Explore Features
              </button>
            </div>
          </div>
          
          <div className="mt-20 animate-bounce">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </main>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Built for Modern Teaching</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Focus on your students while Edwin handles the repetitive tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
            {workflows.map((wf, idx) => (
              <div 
                key={idx} 
                className="group p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${wf.color} rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg transform group-hover:rotate-6 transition-transform`}>
                  {wf.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{wf.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {wf.description}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Agentic Chat Interface */}
            <div className="relative overflow-hidden rounded-3xl bg-gray-900 p-10 text-white group shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10 transform scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              <div className="relative z-10 space-y-4">
                <div className="inline-block px-3 py-1 bg-blue-500 rounded-full text-xs font-bold uppercase tracking-wider">Interface</div>
                <h3 className="text-3xl font-bold">Agentic Chat System</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Experience a conversational flow that doesn't just chat, but <strong>executes</strong>. Interact with your data, generate content, and manage your classroom through a simple chat window.
                </p>
                <div className="pt-4 flex items-center text-blue-400 font-semibold group-hover:translate-x-2 transition-transform">
                  Learn more <span className="ml-2">→</span>
                </div>
              </div>
            </div>

            {/* Google Classroom Integration */}
            <div className="relative overflow-hidden rounded-3xl bg-green-50 p-10 border border-green-100 group shadow-xl">
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative z-10 space-y-4">
                <div className="inline-block px-3 py-1 bg-green-600 text-white rounded-full text-xs font-bold uppercase tracking-wider">Integration</div>
                <h3 className="text-3xl font-bold text-gray-900">Google Classroom Sync</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Directly fetch your rosters, assignments, and course materials. Post generated content back to your classroom with a single click. No more tab-switching.
                </p>
                <div className="pt-4 flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform">
                  View integration <span className="ml-2">→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600 text-white text-center px-6">
        <h2 className="text-4xl font-bold mb-8">Ready to transform your teaching?</h2>
        <Link 
          href="/auth" 
          className="inline-block px-12 py-5 bg-white text-blue-600 rounded-full hover:bg-gray-100 transition-all font-bold text-xl shadow-2xl hover:scale-105 active:scale-95"
        >
          Get Started for Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 border-t border-gray-100 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-bold text-gray-900 italic">Edwin AI</div>
          <p className="text-gray-500 text-sm">
            © 2026 Edwin AI. Empowring educators with intelligent automation.
          </p>
          <div className="flex gap-8 text-gray-400">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

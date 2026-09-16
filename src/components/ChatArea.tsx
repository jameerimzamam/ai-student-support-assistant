import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  BookOpen,
  Wrench,
  BrainCircuit,
  RefreshCw,
  SlidersHorizontal,
  Bot,
  AlertCircle
} from 'lucide-react';
import { ChatMessage, QuestionCategory } from '../types';
import { ChatMessageItem } from './ChatMessage';

interface ChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string, useRag: boolean, useTools: boolean) => void;
  sampleCategories: QuestionCategory[];
  onSelectSampleQuestion: (question: string) => void;
  error: string | null;
  onClearError: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  onSendMessage,
  sampleCategories,
  onSelectSampleQuestion,
  error,
  onClearError,
}) => {
  const [inputText, setInputText] = useState('');
  const [useRag, setUseRag] = useState(true);
  const [useTools, setUseTools] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim(), useRag, useTools);
    setInputText('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100/50 overflow-hidden relative">
      {/* Messages Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Empty State / Welcome Screen */}
          {messages.length === 0 ? (
            <div className="py-8 sm:py-12 space-y-8">
              {/* Hero Greeting */}
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Bot className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Apex AI Student Support Assistant
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your autonomous campus academic and administrative advisor. Powered by a Python FastAPI backend,
                  Retrieval-Augmented Generation (RAG) over official college policies, deterministic Python tools, and conversation memory.
                </p>
              </div>

              {/* Core System Capabilities Bento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto">
                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs mb-1">RAG Document Retrieval</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Embeds attendance rules, exam regulations, syllabus, and procedures into a local vector store.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs mb-1">Python Agent Tools</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Decides autonomously to execute academic lookup (GPA/grading) and FAQ search functions.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs mb-1">Multi-Turn Memory</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tracks context across follow-up queries (e.g. "What about medical leave?" after asking about attendance).
                  </p>
                </div>
              </div>

              {/* Quick Starter Prompts */}
              <div className="max-w-3xl mx-auto">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
                  Select a Sample College Inquiry to Test:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {sampleCategories.flatMap((c) => c.questions.slice(0, 1)).map((question, idx) => (
                    <button
                      key={idx}
                      id={`btn-starter-prompt-${idx}`}
                      onClick={() => onSelectSampleQuestion(question)}
                      className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left text-xs text-slate-800 transition-all shadow-2xs flex items-center justify-between group"
                    >
                      <span className="font-medium pr-2">{question}</span>
                      <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Render Chat Stream
            <div className="space-y-1">
              {messages.map((msg, index) => (
                <ChatMessageItem key={msg.id || index} message={msg} index={index} />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-3.5 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-xs flex items-center gap-3 text-xs text-slate-600">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                    <span>
                      AI Agent is analyzing intent, searching vector index, and evaluating Python tools...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Error Toast if present */}
      {error && (
        <div className="px-4 py-2.5 mx-4 sm:mx-8 mb-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={onClearError}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bottom Input Form Container */}
      <div className="p-4 sm:p-5 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto space-y-2.5">
          {/* Agent Capability Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 font-medium">
                <input
                  id="toggle-rag"
                  type="checkbox"
                  checked={useRag}
                  onChange={(e) => setUseRag(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>RAG Vector Search</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 font-medium">
                <input
                  id="toggle-tools"
                  type="checkbox"
                  checked={useTools}
                  onChange={(e) => setUseTools(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                />
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                <span>Python Tools</span>
              </label>
            </div>

            <div className="text-[11px] text-slate-400">
              Model: <span className="font-mono text-slate-600 font-semibold">Gemini 3.6 Flash</span>
            </div>
          </div>

          {/* Text Input & Submit */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                id="input-student-question"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about attendance rules, exam policies, GPA calculation, library hours..."
                disabled={isLoading}
                className="w-full text-sm sm:text-base border border-slate-300 rounded-xl px-4 py-3.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <button
              id="btn-send-question"
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="h-[50px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline text-xs font-semibold">Ask Assistant</span>
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-400">
            Grounding guarantee: Answers are synthesized strictly from official college documentation and Python tools.
          </p>
        </div>
      </div>
    </div>
  );
};

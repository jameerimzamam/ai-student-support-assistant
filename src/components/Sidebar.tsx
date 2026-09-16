import React from 'react';
import {
  MessageSquarePlus,
  Layers,
  Wrench,
  BrainCircuit,
  History,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { ChatMessage, SystemHealth, QuestionCategory } from '../types';

interface SidebarProps {
  onNewConversation: () => void;
  onOpenDocuments: () => void;
  onOpenTools: () => void;
  onOpenWorkflow: () => void;
  onSelectSampleQuestion: (question: string) => void;
  health: SystemHealth | null;
  historyMessages: ChatMessage[];
  sampleCategories: QuestionCategory[];
  activeSessionId: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onNewConversation,
  onOpenDocuments,
  onOpenTools,
  onOpenWorkflow,
  onSelectSampleQuestion,
  health,
  historyMessages,
  sampleCategories,
  activeSessionId,
}) => {
  // Extract user questions from history for quick review
  const userQueries = historyMessages.filter((m) => m.role === 'user');

  return (
    <aside className="w-80 h-full flex flex-col bg-slate-50 border-r border-slate-200 shrink-0 select-none">
      {/* Top Header: Brand & New Conversation */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 text-sm tracking-tight truncate">
              Apex AI Assistant
            </h1>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Python FastAPI Backend
            </p>
          </div>
        </div>

        {/* New Conversation Button */}
        <button
          id="btn-new-conversation"
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Conversation (Clear Memory)
        </button>
      </div>

      {/* Navigation & Core Feature Drawers */}
      <div className="p-3 border-b border-slate-200/80 bg-white/70 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
          Agentic Features
        </div>

        <button
          id="btn-nav-rag"
          onClick={onOpenDocuments}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-blue-600 shrink-0" />
            <span>RAG Knowledge Base</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800">
            {health?.rag.total_documents || 6} Docs
          </span>
        </button>

        <button
          id="btn-nav-tools"
          onClick={onOpenTools}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Python Tools Explorer</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-100 text-amber-800">
            2 Tools
          </span>
        </button>

        <button
          id="btn-nav-workflow"
          onClick={onOpenWorkflow}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <BrainCircuit className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Agent Workflow Map</span>
          </div>
          <span className="text-[10px] font-medium text-purple-600">Inspect</span>
        </button>
      </div>

      {/* Middle Scrollable Section: Conversation History & Sample Inquiries */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Conversation History */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
            <span>Session History</span>
            <span className="text-[10px] text-slate-400 font-mono">{userQueries.length} turns</span>
          </div>

          {userQueries.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic">
              No questions in this session yet. Ask a question or pick a sample prompt below!
            </div>
          ) : (
            <div className="space-y-1 mt-1">
              {userQueries.slice(-5).map((q, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-lg bg-white border border-slate-200/70 text-xs text-slate-700 truncate hover:border-slate-300 transition-all flex items-center gap-2"
                  title={q.content}
                >
                  <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{q.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sample / Demo Inquiries */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Sample Questions</span>
          </div>

          <div className="space-y-3 mt-1.5">
            {sampleCategories.map((cat, cIdx) => (
              <div key={cIdx} className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-600 px-2">
                  {cat.category}
                </div>
                <div className="space-y-1">
                  {cat.questions.slice(0, 2).map((q, qIdx) => (
                    <button
                      key={qIdx}
                      id={`btn-sample-q-${cIdx}-${qIdx}`}
                      onClick={() => onSelectSampleQuestion(q)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 border border-transparent hover:border-blue-100 transition-all line-clamp-2"
                    >
                      • {q}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Status Footer */}
      <div className="p-3 border-t border-slate-200 bg-white text-xs text-slate-600">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-slate-800 text-[11px]">System Status</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Operational
          </span>
        </div>

        <div className="space-y-1 text-[11px] text-slate-500 font-mono">
          <div className="flex justify-between">
            <span>RAG Chunks:</span>
            <span className="font-semibold text-slate-700">{health?.rag.total_indexed_chunks || 29}</span>
          </div>
          <div className="flex justify-between">
            <span>Memory Active:</span>
            <span className="font-semibold text-slate-700">True</span>
          </div>
          <div className="flex justify-between">
            <span>Gemini Model:</span>
            <span className="font-semibold text-slate-700">gemini-3.6-flash</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

import React from 'react';
import {
  X,
  Cpu,
  BrainCircuit,
  Database,
  Wrench,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  History
} from 'lucide-react';
import { motion } from 'motion/react';

interface AgentWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentWorkflowModal: React.FC<AgentWorkflowModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: '1',
      title: 'Student Inquiry & Intent Ingestion',
      icon: Cpu,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      description: 'The student enters a question or follow-up in natural language. The FastAPI backend receives the request over REST.',
    },
    {
      num: '2',
      title: 'Conversational Memory Context',
      icon: History,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      description: 'The agent inspects session history in memory.py to resolve references (e.g., "What about the fee?" referring to medical condonation).',
    },
    {
      num: '3',
      title: 'Cognitive Routing & Tool Decision',
      icon: BrainCircuit,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      description: 'The agent autonomously decides between calling Python tools (tools.py) or performing semantic vector search (rag.py).',
    },
    {
      num: '4',
      title: 'RAG Vector Search & Embeddings',
      icon: Database,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      description: 'Extracts relevant document chunks from the local vector database using cosine similarity against Gemini embeddings.',
    },
    {
      num: '5',
      title: 'Deterministic Python Tool Execution',
      icon: Wrench,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      description: 'Executes college_faq_search or academic_info_lookup to retrieve verified institutional metrics, GPA formulas, and contacts.',
    },
    {
      num: '6',
      title: 'Gemini Grounded Synthesis & Citations',
      icon: Sparkles,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
      description: 'Gemini synthesizes the final response strictly grounded in the retrieved excerpts, producing citations and an anti-hallucination guarantee.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-blue-600" />
              Agentic AI System Architecture
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              End-to-end autonomous decision workflow for the student support assistant
            </p>
          </div>
          <button
            id="btn-close-workflow-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Diagram & Steps */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Visual Pipeline Bar */}
          <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs">
            <div className="text-xs font-mono text-blue-300 uppercase tracking-wider mb-2">
              Agent Execution Pipeline
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 bg-slate-800 rounded border border-slate-700">Student Query</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2.5 py-1 bg-blue-900/80 text-blue-200 rounded border border-blue-700">AI Agent Planner</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2.5 py-1 bg-emerald-900/80 text-emerald-200 rounded border border-emerald-700">RAG / Python Tools</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2.5 py-1 bg-purple-900/80 text-purple-200 rounded border border-purple-700">Gemini LLM</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2.5 py-1 bg-amber-900/80 text-amber-200 rounded border border-amber-700">Answer + Citations</span>
            </div>
          </div>

          {/* Detailed Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-start gap-3.5 shadow-2xs"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${step.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-mono font-bold text-slate-400">0{step.num}</span>
                      <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Academic Submission Guarantee */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Strict Anti-Hallucination Policy: </span>
              The agent is constrained via system prompts to answer strictly from verified local documents
              or tool registries. If an inquiry falls outside the institutional database, the model explicitly
              declares the information unavailable and points students to the relevant university office.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            id="btn-close-workflow"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
          >
            Close Architecture
          </button>
        </div>
      </motion.div>
    </div>
  );
};

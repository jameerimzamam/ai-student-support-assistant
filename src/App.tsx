import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  X,
  GraduationCap,
  Sparkles,
  Layers,
  Wrench,
  BrainCircuit,
  MessageSquarePlus
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { DocumentManagerModal } from './components/DocumentManagerModal';
import { ToolsModal } from './components/ToolsModal';
import { AgentWorkflowModal } from './components/AgentWorkflowModal';
import {
  ChatMessage,
  SystemHealth,
  DocumentItem,
  ToolDefinition,
  QuestionCategory
} from './types';

// Sample fallback categories if API is loading
const DEFAULT_SAMPLE_CATEGORIES: QuestionCategory[] = [
  {
    category: 'Attendance & Medical Policies',
    questions: [
      'What is the minimum attendance requirement to write final exams?',
      'Can attendance between 65% and 75% be condoned due to medical illness?',
      'What is the penalty if attendance is below 65%?',
    ],
  },
  {
    category: 'Examinations & Grading',
    questions: [
      'What is the 10 point grading scale and passing marks?',
      'How is SGPA and CGPA calculated?',
      'What are the criteria to make the Dean\'s Honor List?',
    ],
  },
  {
    category: 'Campus Facilities & FAQs',
    questions: [
      'What are the campus library hours on weekends?',
      'What should I do if I lose my student ID card?',
      'How do I connect my laptop to campus Wi-Fi?',
    ],
  },
  {
    category: 'Syllabus & Prerequisites',
    questions: [
      'What are the prerequisites for Machine Learning CS402?',
      'What topics are covered in Operating Systems CS302?',
      'How many total credits are required for B.Tech graduation?',
    ],
  },
];

export default function App() {
  const [sessionId, setSessionId] = useState<string>(() => {
    return 'student_' + Math.random().toString(36).substring(2, 9);
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // System & Meta state
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [totalChunks, setTotalChunks] = useState<number>(29);
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [sampleCategories, setSampleCategories] = useState<QuestionCategory[]>(DEFAULT_SAMPLE_CATEGORIES);

  // Modals state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fetch initial system info
  const fetchSystemData = useCallback(async () => {
    try {
      const [healthRes, docsRes, toolsRes, samplesRes] = await Promise.all([
        fetch('/api/health').catch(() => null),
        fetch('/api/documents').catch(() => null),
        fetch('/api/tools').catch(() => null),
        fetch('/api/sample-questions').catch(() => null),
      ]);

      if (healthRes && healthRes.ok) {
        const hData: SystemHealth = await healthRes.json();
        setHealth(hData);
        if (hData.rag) {
          setTotalChunks(hData.rag.total_indexed_chunks);
        }
      }

      if (docsRes && docsRes.ok) {
        const dData = await docsRes.json();
        setDocuments(dData.documents || []);
        if (dData.total_chunks) {
          setTotalChunks(dData.total_chunks);
        }
      }

      if (toolsRes && toolsRes.ok) {
        const tData = await toolsRes.json();
        setTools(tData.tools || []);
      }

      if (samplesRes && samplesRes.ok) {
        const sData = await samplesRes.json();
        if (sData.categories && sData.categories.length > 0) {
          setSampleCategories(sData.categories);
        }
      }
    } catch (err) {
      console.warn('System health polling warning:', err);
    }
  }, []);

  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  // Handle starting a new conversation (Requirement 5: Clear current memory)
  const handleNewConversation = async () => {
    try {
      if (sessionId) {
        await fetch(`/api/memory/${sessionId}`, { method: 'DELETE' }).catch(() => null);
      }
    } catch (err) {
      console.error(err);
    }

    const newId = 'student_' + Math.random().toString(36).substring(2, 9);
    setSessionId(newId);
    setMessages([]);
    setError(null);
    setIsMobileSidebarOpen(false);
  };

  // Handle sending message to FastAPI backend
  const handleSendMessage = async (text: string, useRag: boolean = true, useTools: boolean = true) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          use_rag: useRag,
          use_tools: useTools,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${response.status})`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: 'msg_asst_' + Date.now(),
        role: 'assistant',
        content: data.answer,
        timestamp: Date.now(),
        sources: data.sources || [],
        tools_used: data.tools_used || [],
        decision_reasoning: data.decision_reasoning || '',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg = err.message || 'Failed to communicate with AI Assistant service.';
      setError(errMsg);

      const errorMessage: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: `**Service Alert:** I encountered an issue connecting to the AI processing service. Details: ${errMsg}\n\nPlease verify that your Gemini API key is configured or retry your inquiry.`,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSampleQuestion = (question: string) => {
    setIsMobileSidebarOpen(false);
    handleSendMessage(question, true, true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-900 font-sans antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full">
        <Sidebar
          onNewConversation={handleNewConversation}
          onOpenDocuments={() => setIsDocModalOpen(true)}
          onOpenTools={() => setIsToolsModalOpen(true)}
          onOpenWorkflow={() => setIsWorkflowModalOpen(true)}
          onSelectSampleQuestion={handleSelectSampleQuestion}
          health={health}
          historyMessages={messages}
          sampleCategories={sampleCategories}
          activeSessionId={sessionId}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-80 max-w-[85vw] h-full bg-white flex flex-col shadow-2xl">
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-3 p-1 rounded-lg text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar
              onNewConversation={handleNewConversation}
              onOpenDocuments={() => {
                setIsDocModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              onOpenTools={() => {
                setIsToolsModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              onOpenWorkflow={() => {
                setIsWorkflowModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              onSelectSampleQuestion={handleSelectSampleQuestion}
              health={health}
              historyMessages={messages}
              sampleCategories={sampleCategories}
              activeSessionId={sessionId}
            />
          </div>
          <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        {/* Top App Bar */}
        <header className="h-14 px-4 sm:px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              id="btn-mobile-menu"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-1 text-slate-600 hover:text-slate-900 md:hidden rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                AU
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-none">
                  Apex University Student Support
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block leading-tight mt-0.5">
                  Autonomous Agentic AI Advisor • RAG Vector Store • Tools • Memory
                </p>
              </div>
            </div>
          </div>

          {/* Quick Header Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="btn-header-workflow"
              onClick={() => setIsWorkflowModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 transition-colors"
              title="Inspect Agent Workflow"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
              <span>Workflow</span>
            </button>

            <button
              id="btn-header-docs"
              onClick={() => setIsDocModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 transition-colors"
              title="Manage Documents & Knowledge Base"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Knowledge Base</span>
              <span className="text-[10px] font-mono px-1 rounded bg-slate-100 text-slate-600">
                {documents.length || 6}
              </span>
            </button>

            <button
              id="btn-header-tools"
              onClick={() => setIsToolsModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors"
              title="Inspect Python Tools"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              <span>Tools</span>
            </button>

            <button
              id="btn-header-new-chat"
              onClick={handleNewConversation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
              title="Start Fresh Conversation"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Chat Conversation View */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          sampleCategories={sampleCategories}
          onSelectSampleQuestion={handleSelectSampleQuestion}
          error={error}
          onClearError={() => setError(null)}
        />
      </main>

      {/* Modals */}
      <DocumentManagerModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        documents={documents}
        totalChunks={totalChunks}
        onDocumentUploaded={fetchSystemData}
      />

      <ToolsModal
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        tools={tools}
      />

      <AgentWorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
      />
    </div>
  );
}

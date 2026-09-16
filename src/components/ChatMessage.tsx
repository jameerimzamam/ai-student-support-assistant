import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Bot,
  User,
  Check,
  Copy,
  BookOpen,
  Wrench,
  Cpu,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage as ChatMessageType, SourceCitation } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({ message, index }) => {
  const [copied, setCopied] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<number | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <motion.div
        id={`chat-message-${message.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end mb-5 group"
      >
        <div className="flex items-start max-w-2xl gap-3">
          <div className="bg-slate-900 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-sm text-base leading-relaxed break-words">
            {message.content}
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1 shadow-xs">
            <User className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      id={`chat-message-${message.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index === 0 ? 0 : 0.05 }}
      className="flex justify-start mb-6 group w-full"
    >
      <div className="flex items-start max-w-3xl w-full gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
          <Bot className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm p-5 sm:p-6 shadow-xs">
          {/* Top Metadata Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm tracking-tight">
                AI Student Support Assistant
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                Verified Campus Advisor
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id={`btn-copy-${message.id}`}
                onClick={handleCopy}
                title="Copy response"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Agentic Capabilities Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3.5">
            {message.sources && message.sources.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                <BookOpen className="w-3 h-3" />
                RAG Vector Retrieved ({message.sources.length} sources)
              </span>
            )}

            {message.tools_used && message.tools_used.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <Wrench className="w-3 h-3" />
                Tool Executed: {message.tools_used.map((t) => t.tool_name).join(', ')}
              </span>
            )}

            {message.decision_reasoning && (
              <button
                id={`btn-reasoning-${message.id}`}
                onClick={() => setShowReasoning(!showReasoning)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <Cpu className="w-3 h-3 text-slate-500" />
                Agent Workflow Trace
                {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Collapsible Agent Decision Trace */}
          <AnimatePresence>
            {showReasoning && message.decision_reasoning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono space-y-1">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    Agentic Decision Pipeline:
                  </div>
                  <div className="text-slate-600 leading-relaxed">
                    {message.decision_reasoning}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Answer Content (Rendered Markdown) */}
          <div className="prose prose-slate max-w-none text-slate-800 text-base leading-relaxed">
            <Markdown>{message.content}</Markdown>
          </div>

          {/* Executed Tools Details Card (If any) */}
          {message.tools_used && message.tools_used.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                Python Tool Execution Detail
              </div>
              <div className="space-y-2">
                {message.tools_used.map((tool, tIdx) => (
                  <div
                    key={tIdx}
                    className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-slate-700"
                  >
                    <div className="font-mono font-medium text-amber-900 mb-1">
                      Function: {tool.tool_name}({JSON.stringify(tool.arguments)})
                    </div>
                    <div className="text-slate-600">
                      Result status: <span className="font-semibold text-emerald-700">{tool.output.status || 'success'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Citations & Source Document Excerpts */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-5 pt-3.5 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                Verified Sources from Knowledge Base:
              </div>

              <div className="grid grid-cols-1 gap-2">
                {message.sources.map((src: SourceCitation, sIdx: number) => {
                  const isExpanded = expandedSourceIndex === sIdx;
                  return (
                    <div
                      key={src.chunk_id || sIdx}
                      className="rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                    >
                      <button
                        id={`btn-source-${message.id}-${sIdx}`}
                        onClick={() => setExpandedSourceIndex(isExpanded ? null : sIdx)}
                        className="w-full px-3 py-2 flex items-center justify-between text-left text-xs font-medium text-slate-800"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-900 truncate">
                            {src.doc_name}
                          </span>
                          {src.page_number && (
                            <span className="text-slate-500">
                              (Page {src.page_number})
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-mono">
                            Match: {(src.score * 100).toFixed(1)}%
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-2.5 pt-1 border-t border-slate-200/60 text-xs text-slate-600 font-mono leading-relaxed bg-white/50 rounded-b-lg">
                          <div className="text-[11px] text-slate-400 mb-1">Chunk ID: {src.chunk_id}</div>
                          "{src.excerpt}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

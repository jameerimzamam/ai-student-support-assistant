/**
 * TypeScript Interfaces and Types for AI Student Support Assistant
 */

export interface SourceCitation {
  doc_name: string;
  page_number?: number | null;
  chunk_id: string;
  score: number;
  excerpt: string;
}

export interface ToolExecutionRecord {
  tool_name: string;
  arguments: Record<string, any>;
  output: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: SourceCitation[];
  tools_used?: ToolExecutionRecord[];
  decision_reasoning?: string;
  isError?: boolean;
}

export interface DocumentItem {
  doc_name: string;
  type: 'sample' | 'uploaded';
  chunk_count: number;
  size_kb: number;
  page_count: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, string>;
}

export interface SystemHealth {
  status: string;
  service: string;
  backend: string;
  gemini_api_key_configured: boolean;
  rag: {
    total_documents: number;
    total_indexed_chunks: number;
  };
  tools_registered: string[];
  active_memory_sessions: number;
}

export interface QuestionCategory {
  category: string;
  questions: string[];
}

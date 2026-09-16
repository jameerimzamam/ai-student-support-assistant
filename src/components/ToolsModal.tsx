import React, { useState } from 'react';
import {
  X,
  Wrench,
  Play,
  CheckCircle,
  HelpCircle,
  GraduationCap,
  Code2,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { ToolDefinition } from '../types';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: ToolDefinition[];
}

export const ToolsModal: React.FC<ToolsModalProps> = ({ isOpen, onClose, tools }) => {
  const [selectedTool, setSelectedTool] = useState<string>('academic_info_lookup');
  const [academicTopic, setAcademicTopic] = useState<string>('grading_scale');
  const [faqQuery, setFaqQuery] = useState<string>('library hours');
  const [faqCategory, setFaqCategory] = useState<string>('campus_facilities');
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleRunTool = async () => {
    setIsRunning(true);
    setTestResult(null);

    let args: Record<string, any> = {};
    if (selectedTool === 'academic_info_lookup') {
      args = { topic: academicTopic };
    } else {
      args = { query: faqQuery, category: faqCategory };
    }

    try {
      const res = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: selectedTool,
          arguments: args,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-600" />
              Python Agent Tools Explorer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect and test the deterministic Python functions called by the AI Agent
            </p>
          </div>
          <button
            id="btn-close-tools-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Tool Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              id="tab-tool-academic"
              onClick={() => {
                setSelectedTool('academic_info_lookup');
                setTestResult(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                selectedTool === 'academic_info_lookup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              academic_info_lookup
            </button>
            <button
              id="tab-tool-faq"
              onClick={() => {
                setSelectedTool('college_faq_search');
                setTestResult(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                selectedTool === 'college_faq_search'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              college_faq_search
            </button>
          </div>

          {/* Tool Documentation */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-blue-600" />
                backend/tools.py → def {selectedTool}()
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800">
                Callable by Gemini
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {tools.find((t) => t.name === selectedTool)?.description ||
                'Deterministic institutional query function.'}
            </p>
          </div>

          {/* Interactive Tool Runner Form */}
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Interactive Test Parameters
            </label>

            {selectedTool === 'academic_info_lookup' ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Academic Topic parameter:
                </label>
                <select
                  id="select-academic-topic"
                  value={academicTopic}
                  onChange={(e) => setAcademicTopic(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="grading_scale">grading_scale (10-Point Grade Matrix)</option>
                  <option value="gpa_calculation">gpa_calculation (SGPA / CGPA Formulas)</option>
                  <option value="deans_list">deans_list (Honors Criteria: SGPA &gt;= 9.2)</option>
                  <option value="academic_probation">academic_probation (Probation Policies)</option>
                  <option value="course_prerequisites">course_prerequisites (CS Course Flow)</option>
                  <option value="graduation_credits">graduation_credits (160 Credit Breakdown)</option>
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Query Keywords:
                  </label>
                  <input
                    id="input-faq-query"
                    type="text"
                    value={faqQuery}
                    onChange={(e) => setFaqQuery(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. library hours, lost id, wifi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Category:
                  </label>
                  <select
                    id="select-faq-category"
                    value={faqCategory}
                    onChange={(e) => setFaqCategory(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="campus_facilities">campus_facilities (Library, Hostel)</option>
                    <option value="health_and_wellness">health_and_wellness (Clinic, Counseling)</option>
                    <option value="it_services">it_services (Wi-Fi, ERP)</option>
                    <option value="administrative_services">administrative_services (ID cards, Bursar)</option>
                    <option value="all">all categories</option>
                  </select>
                </div>
              </div>
            )}

            <button
              id="btn-run-tool-test"
              onClick={handleRunTool}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Executing Tool in Python...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Execute Python Tool Directly
                </>
              )}
            </button>
          </div>

          {/* Test Execution Output */}
          {testResult && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Python Return Payload
              </label>
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            id="btn-close-tools"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
          >
            Close Explorer
          </button>
        </div>
      </motion.div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Layers,
  FileCheck,
  HardDrive
} from 'lucide-react';
import { motion } from 'motion/react';
import { DocumentItem } from '../types';

interface DocumentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  totalChunks: number;
  onDocumentUploaded: () => void;
}

export const DocumentManagerModal: React.FC<DocumentManagerModalProps> = ({
  isOpen,
  onClose,
  documents,
  totalChunks,
  onDocumentUploaded,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleUploadFile = async (file: File) => {
    const allowed = ['.txt', '.pdf', '.md'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadStatus({
        success: false,
        message: `Unsupported file type "${ext}". Please upload .txt or .pdf files.`,
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setUploadStatus({
          success: true,
          message: `Successfully ingested "${file.name}"! Created ${data.chunks_added} chunks and updated vector index.`,
        });
        onDocumentUploaded();
      } else {
        setUploadStatus({
          success: false,
          message: data.detail || 'Upload failed. Please check file format.',
        });
      }
    } catch (err: any) {
      setUploadStatus({
        success: false,
        message: err.message || 'Error connecting to backend.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleReindex = async () => {
    setIsUploading(true);
    try {
      const res = await fetch('/api/documents/reindex', { method: 'POST' });
      if (res.ok) {
        onDocumentUploaded();
        setUploadStatus({
          success: true,
          message: 'All college documents re-indexed successfully into vector store.',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
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
              <Layers className="w-5 h-5 text-blue-600" />
              RAG Knowledge Base & Documents
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Vector store contains {documents.length} institutional documents ({totalChunks} indexed chunks)
            </p>
          </div>
          <button
            id="btn-close-doc-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Upload Dropzone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Upload New Institutional Document (PDF or TXT)
            </label>

            <div
              id="doc-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/60'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/40 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.md"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadFile(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 text-sm">Click to upload</span> or drag and drop
                </div>
                <p className="text-xs text-slate-500">
                  Supported formats: PDF, TXT, Markdown. Text will be extracted, chunked, and embedded into local vector storage.
                </p>
              </div>
            </div>

            {/* Upload Feedback Status */}
            {isUploading && (
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                Processing file: Extracting text, chunking, and calculating vector embeddings...
              </div>
            )}

            {uploadStatus && !isUploading && (
              <div
                className={`mt-3 flex items-start gap-2 text-xs p-3 rounded-lg border ${
                  uploadStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {uploadStatus.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{uploadStatus.message}</span>
              </div>
            )}
          </div>

          {/* Currently Indexed Documents List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Currently Indexed Knowledge Base Documents ({documents.length})
              </label>
              <button
                id="btn-reindex-all"
                onClick={handleReindex}
                disabled={isUploading}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                Re-index All
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-semibold text-slate-800 truncate flex items-center gap-2">
                        {doc.doc_name}
                        {doc.type === 'sample' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Sample Data
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Uploaded
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                        <span>{doc.chunk_count} chunks</span>
                        <span>•</span>
                        <span>{doc.size_kb} KB</span>
                        {doc.page_count > 1 && (
                          <>
                            <span>•</span>
                            <span>{doc.page_count} pages</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <FileCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            id="btn-done-doc-modal"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

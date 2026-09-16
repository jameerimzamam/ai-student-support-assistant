"""
==============================================================================
AI Student Support Assistant - RAG (Retrieval-Augmented Generation) Module (rag.py)
==============================================================================
Role in Agentic Architecture:
1. Document Ingestion: Extracts text from TXT and PDF documents.
2. Chunking: Splits documents into semantically coherent overlapping passages.
3. Vector Store: Computes embeddings and maintains a local vector database index.
4. Similarity Retrieval: Retrieves the most relevant institutional chunks with
   provenance (source document, page number, similarity score).
==============================================================================
"""

import os
import io
import json
import math
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from pydantic import BaseModel, Field

# PDF processing library
try:
    import pypdf
except ImportError:
    pypdf = None

# Gemini GenAI SDK
try:
    from google import genai
    from google.genai import types as genai_types
except ImportError:
    genai = None
    genai_types = None


class DocumentChunk(BaseModel):
    """Represents a chunked fragment of an institutional document."""
    chunk_id: str
    doc_name: str
    page_number: Optional[int] = None
    text: str
    embedding: Optional[List[float]] = None


class RAGRetrievalResult(BaseModel):
    """Represents an item retrieved from the vector store."""
    chunk_id: str
    doc_name: str
    page_number: Optional[int]
    text: str
    score: float


class VectorKnowledgeBase:
    """
    Local persistent vector database and retrieval engine.
    Supports both Gemini API dense embeddings and fallback TF-IDF vectorization
    for zero-dependency offline resilience.
    """
    def __init__(
        self,
        storage_file: str = "data/vector_store.json",
        sample_dir: str = "data/sample_documents",
        upload_dir: str = "data/uploaded_documents",
    ):
        self.storage_file = Path(storage_file)
        self.sample_dir = Path(sample_dir)
        self.upload_dir = Path(upload_dir)
        self.chunks: List[DocumentChunk] = []
        self._gemini_client: Optional[Any] = None
        self.embedding_model = os.getenv("EMBEDDING_MODEL", "gemini-embedding-2-preview")

        # Ensure directories exist
        self.sample_dir.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.storage_file.parent.mkdir(parents=True, exist_ok=True)

        # Load persisted index or initialize from sample documents
        self._load_or_initialize()

    def _get_gemini_client(self) -> Optional[Any]:
        """Lazy initialization of Google GenAI client."""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None
        if self._gemini_client is None and genai is not None:
            try:
                self._gemini_client = genai.Client(api_key=api_key)
            except Exception as e:
                print(f"[RAG] Warning: Could not initialize Gemini client: {e}")
                return None
        return self._gemini_client

    # --------------------------------------------------------------------------
    # Document Text Extraction
    # --------------------------------------------------------------------------
    def extract_text_from_file(self, file_path: Path) -> List[Tuple[Optional[int], str]]:
        """
        Extracts text content from TXT or PDF files.
        Returns a list of (page_number, text) tuples.
        """
        suffix = file_path.suffix.lower()
        pages: List[Tuple[Optional[int], str]] = []

        if suffix in [".txt", ".md", ".text"]:
            try:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                pages.append((None, content))
            except Exception as e:
                print(f"[RAG] Error reading text file {file_path.name}: {e}")

        elif suffix == ".pdf":
            if pypdf is None:
                print(f"[RAG] Warning: pypdf not installed, cannot parse {file_path.name}")
                return pages
            try:
                reader = pypdf.PdfReader(str(file_path))
                for idx, page in enumerate(reader.pages):
                    extracted = page.extract_text() or ""
                    if extracted.strip():
                        pages.append((idx + 1, extracted))
            except Exception as e:
                print(f"[RAG] Error reading PDF file {file_path.name}: {e}")

        return pages

    # --------------------------------------------------------------------------
    # Chunking Strategy
    # --------------------------------------------------------------------------
    def chunk_text(
        self,
        text: str,
        doc_name: str,
        page_num: Optional[int] = None,
        chunk_size: int = 650,
        chunk_overlap: int = 120,
    ) -> List[DocumentChunk]:
        """
        Splits text into overlapping chunks, respecting natural sentence and paragraph breaks.
        """
        chunks: List[DocumentChunk] = []
        cleaned_text = re.sub(r"\n{3,}", "\n\n", text).strip()
        if not cleaned_text:
            return chunks

        # If text is small enough, keep as single chunk
        if len(cleaned_text) <= chunk_size:
            chunk_id = f"{doc_name}_p{page_num or 0}_c0"
            chunks.append(DocumentChunk(
                chunk_id=chunk_id,
                doc_name=doc_name,
                page_number=page_num,
                text=cleaned_text,
            ))
            return chunks

        start = 0
        chunk_idx = 0
        text_len = len(cleaned_text)

        while start < text_len:
            end = min(start + chunk_size, text_len)
            
            # Try to snap end boundary to paragraph or period boundary
            if end < text_len:
                boundary = cleaned_text.rfind("\n\n", start + chunk_size // 2, end)
                if boundary == -1:
                    boundary = cleaned_text.rfind(". ", start + chunk_size // 2, end)
                if boundary != -1:
                    end = boundary + (2 if cleaned_text[boundary:boundary+2] == "\n\n" else 1)

            chunk_content = cleaned_text[start:end].strip()
            if len(chunk_content) > 30:  # Skip tiny fragments
                chunk_id = f"{doc_name}_p{page_num or 0}_c{chunk_idx}"
                chunks.append(DocumentChunk(
                    chunk_id=chunk_id,
                    doc_name=doc_name,
                    page_number=page_num,
                    text=chunk_content,
                ))
                chunk_idx += 1

            if end >= text_len:
                break
            start = max(end - chunk_overlap, start + 1)

        return chunks

    # --------------------------------------------------------------------------
    # Vector Embedding Computation
    # --------------------------------------------------------------------------
    def _compute_gemini_embedding(self, text: str) -> Optional[List[float]]:
        """Invokes the Gemini Embedding API for dense vector representations."""
        client = self._get_gemini_client()
        if client is None:
            return None
        try:
            # Try primary embedding model, fall back if needed
            response = client.models.embed_content(
                model=self.embedding_model,
                contents=text,
            )
            if hasattr(response, "embedding") and hasattr(response.embedding, "values"):
                return list(response.embedding.values)
            elif hasattr(response, "embeddings") and response.embeddings:
                return list(response.embeddings[0].values)
        except Exception as e:
            # Fallback to text-embedding-004 if preview model name isn't recognized
            try:
                response = client.models.embed_content(
                    model="text-embedding-004",
                    contents=text,
                )
                if hasattr(response, "embedding") and hasattr(response.embedding, "values"):
                    return list(response.embedding.values)
            except Exception as e2:
                print(f"[RAG] Embedding generation error: {e2}")
        return None

    def _fallback_lexical_score(self, query: str, text: str) -> float:
        """
        TF-IDF / BM25 style lexical keyword overlap score for resilient retrieval
        when API quota or offline state prevents dense embeddings.
        """
        q_tokens = re.findall(r"\w+", query.lower())
        t_tokens = re.findall(r"\w+", text.lower())
        if not q_tokens or not t_tokens:
            return 0.0

        t_token_counts = {}
        for t in t_tokens:
            t_token_counts[t] = t_token_counts.get(t, 0) + 1

        score = 0.0
        for qt in set(q_tokens):
            if len(qt) <= 2:
                continue
            tf = t_token_counts.get(qt, 0)
            if tf > 0:
                # Term frequency weighting + exact match bonus
                score += (1 + math.log(tf)) * (1.5 if qt in text.lower() else 1.0)

        # Normalize by text length
        normalized_score = score / (1.0 + math.log(len(t_tokens) + 1))
        return min(normalized_score / 3.0, 1.0)

    # --------------------------------------------------------------------------
    # Retrieval & Semantic Search
    # --------------------------------------------------------------------------
    def search(self, query: str, top_k: int = 4) -> List[RAGRetrievalResult]:
        """
        Retrieves the top_k most relevant document chunks for the user's query.
        Uses cosine similarity if dense embeddings exist, with hybrid lexical ranking.
        """
        if not self.chunks:
            return []

        query_embedding = self._compute_gemini_embedding(query)
        scored_chunks: List[Tuple[float, DocumentChunk]] = []

        for chunk in self.chunks:
            dense_score = 0.0
            if query_embedding is not None and chunk.embedding is not None:
                # Cosine similarity between query and chunk vectors
                v1 = np.array(query_embedding, dtype=np.float32)
                v2 = np.array(chunk.embedding, dtype=np.float32)
                norm1 = np.linalg.norm(v1)
                norm2 = np.linalg.norm(v2)
                if norm1 > 0 and norm2 > 0:
                    dense_score = float(np.dot(v1, v2) / (norm1 * norm2))

            lexical_score = self._fallback_lexical_score(query, chunk.text)

            # Hybrid score: prioritize dense similarity if available, boosted by exact lexical matches
            if query_embedding is not None and chunk.embedding is not None:
                final_score = 0.75 * max(dense_score, 0.0) + 0.25 * lexical_score
            else:
                final_score = lexical_score

            scored_chunks.append((final_score, chunk))

        # Sort descending by score
        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, chunk in scored_chunks[:top_k]:
            if score > 0.05:  # Relevance cutoff filter
                results.append(RAGRetrievalResult(
                    chunk_id=chunk.chunk_id,
                    doc_name=chunk.doc_name,
                    page_number=chunk.page_number,
                    text=chunk.text,
                    score=round(float(score), 4)
                ))

        return results

    # --------------------------------------------------------------------------
    # Document Indexing & Ingestion
    # --------------------------------------------------------------------------
    def ingest_document(self, filename: str, content_bytes: bytes, is_sample: bool = False) -> int:
        """
        Ingests a new document, saves it to disk, extracts text, chunks it,
        computes embeddings, and updates the local vector store.
        """
        dest_dir = self.sample_dir if is_sample else self.upload_dir
        dest_path = dest_dir / filename

        with open(dest_path, "wb") as f:
            f.write(content_bytes)

        pages = self.extract_text_from_file(dest_path)
        new_chunks = []
        for page_num, text in pages:
            doc_chunks = self.chunk_text(text, filename, page_num)
            for c in doc_chunks:
                # Compute embedding
                c.embedding = self._compute_gemini_embedding(c.text)
                new_chunks.append(c)

        # Remove existing chunks for this document (if updating)
        self.chunks = [c for c in self.chunks if c.doc_name != filename]
        self.chunks.extend(new_chunks)

        self._persist()
        return len(new_chunks)

    def reindex_all(self) -> Dict[str, Any]:
        """Indexes all documents in sample_documents/ and uploaded_documents/."""
        all_chunks: List[DocumentChunk] = []
        indexed_files = []

        all_files = list(self.sample_dir.glob("*.*")) + list(self.upload_dir.glob("*.*"))

        for file_path in all_files:
            if file_path.suffix.lower() not in [".txt", ".pdf", ".md"]:
                continue

            pages = self.extract_text_from_file(file_path)
            file_chunks = 0
            for page_num, text in pages:
                chunks = self.chunk_text(text, file_path.name, page_num)
                for c in chunks:
                    c.embedding = self._compute_gemini_embedding(c.text)
                    all_chunks.append(c)
                    file_chunks += 1

            indexed_files.append({"filename": file_path.name, "chunks": file_chunks})

        self.chunks = all_chunks
        self._persist()
        return {
            "total_chunks": len(self.chunks),
            "files_indexed": indexed_files
        }

    # --------------------------------------------------------------------------
    # Persistence
    # --------------------------------------------------------------------------
    def _persist(self):
        """Saves current chunks and metadata to JSON file."""
        try:
            data = [c.model_dump() for c in self.chunks]
            with open(self.storage_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"[RAG] Failed to persist vector store: {e}")

    def _load_or_initialize(self):
        """Loads chunks from JSON cache or builds index from disk files."""
        if self.storage_file.exists():
            try:
                with open(self.storage_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.chunks = [DocumentChunk(**item) for item in data]
                if self.chunks:
                    print(f"[RAG] Loaded {len(self.chunks)} chunks from {self.storage_file}")
                    return
            except Exception as e:
                print(f"[RAG] Error loading cached vector store: {e}")

        # If not loaded, reindex from sample documents
        print("[RAG] Building fresh index from documents...")
        self.reindex_all()

    def list_documents(self) -> List[Dict[str, Any]]:
        """Lists all indexed documents and statistics."""
        doc_stats: Dict[str, Dict[str, Any]] = {}

        for chunk in self.chunks:
            if chunk.doc_name not in doc_stats:
                # Check whether it's sample or uploaded
                is_sample = (self.sample_dir / chunk.doc_name).exists()
                path = (self.sample_dir if is_sample else self.upload_dir) / chunk.doc_name
                size_bytes = path.stat().st_size if path.exists() else 0

                doc_stats[chunk.doc_name] = {
                    "doc_name": chunk.doc_name,
                    "type": "sample" if is_sample else "uploaded",
                    "chunk_count": 0,
                    "size_bytes": size_bytes,
                    "pages": set(),
                }
            doc_stats[chunk.doc_name]["chunk_count"] += 1
            if chunk.page_number:
                doc_stats[chunk.doc_name]["pages"].add(chunk.page_number)

        result = []
        for name, stats in doc_stats.items():
            result.append({
                "doc_name": stats["doc_name"],
                "type": stats["type"],
                "chunk_count": stats["chunk_count"],
                "size_kb": round(stats["size_bytes"] / 1024, 1),
                "page_count": len(stats["pages"]) if stats["pages"] else 1,
            })
        return result


# Global vector knowledge base instance
knowledge_base = VectorKnowledgeBase()

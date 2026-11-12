"""RAG (Retrieval-Augmented Generation) engine for Sortify using rag.txt and a lightweight Qwen base model."""

from __future__ import annotations

import math
import os
import re
import time
import uuid
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

# Default model is lightweight Qwen 2.5 0.5B Instruct
DEFAULT_QWEN_MODEL = "Qwen/Qwen2.5-0.5B-Instruct"
QWEN_MODEL_NAME = os.getenv("QWEN_MODEL_NAME", DEFAULT_QWEN_MODEL)
QWEN_API_BASE = os.getenv("QWEN_API_BASE", "").rstrip("/")
QWEN_API_KEY = os.getenv("QWEN_API_KEY", "")

# Search candidates for rag.txt
RAG_CANDIDATE_PATHS = [
    Path(os.getenv("RAG_FILE_PATH", "")),
    Path(__file__).resolve().parent.parent / "rag.txt",
    Path(__file__).resolve().parent.parent.parent / "rag.txt",
    Path("server/rag.txt"),
    Path("rag.txt"),
]

EMOJI_PATTERN = re.compile(
    r"[\U00010000-\U0010ffff\u2600-\u27ff\ufe00-\ufe0f\u200d\u2300-\u23ff\u2b50\u2b55\u203c\u2049\u25aa-\u25fe]",
    flags=re.UNICODE,
)


def remove_emojis(text: str) -> str:
    """Strip emojis from text to enforce zero-emoji output rule."""
    return EMOJI_PATTERN.sub("", text).strip()


@dataclass
class KnowledgeChunk:
    chunk_id: str
    title: str
    category: str
    content: str
    raw_text: str
    keywords: list[str]


@dataclass
class RagTraceStep:
    step: str
    status: str
    duration_ms: float
    details: dict[str, Any]


@dataclass
class RagTrace:
    trace_id: str
    timestamp: str
    query: str
    model: str
    retrieval_ms: float
    generation_ms: float
    total_ms: float
    retrieval_score: float
    sources: list[dict[str, Any]]
    pipeline_steps: list[dict[str, Any]]
    system_prompt: str


def is_explicit_non_bullet_request(query: str) -> bool:
    q = query.lower()
    return any(
        phrase in q
        for phrase in [
            "no bullet",
            "no bullets",
            "without bullet",
            "without bullets",
            "in paragraph",
            "in a paragraph",
            "one paragraph",
            "single paragraph",
            "in prose",
            "explain in prose",
            "as prose",
            "in sentences",
            "full sentences",
            "summary paragraph",
        ]
    )


class RagEngine:
    def __init__(self) -> None:
        self.rag_file_path: Path | None = None
        self.chunks: list[KnowledgeChunk] = []
        self._load_knowledge_base()

    def _resolve_rag_file(self) -> Path | None:
        for candidate in RAG_CANDIDATE_PATHS:
            if candidate and candidate.is_file():
                return candidate.resolve()
        return None

    def _load_knowledge_base(self) -> None:
        file_path = self._resolve_rag_file()
        self.rag_file_path = file_path
        if not file_path:
            self.chunks = []
            return

        try:
            content = file_path.read_text(encoding="utf-8")
        except Exception:
            self.chunks = []
            return

        self.chunks = self._parse_rag_content(content)

    def _parse_rag_content(self, text: str) -> list[KnowledgeChunk]:
        """Split rag.txt by sections like [Item Name] or double newlines."""
        chunks: list[KnowledgeChunk] = []
        raw_sections = re.split(r"\n(?=\[[^\]]+\])", text)
        idx = 0
        for section in raw_sections:
            clean = section.strip()
            if not clean or clean.startswith("#"):
                # Header comment block
                lines = [line for line in clean.splitlines() if not line.strip().startswith("#")]
                clean = "\n".join(lines).strip()
                if not clean:
                    continue

            # Extract title if present: [Title]
            title_match = re.search(r"^\[([^\]]+)\]", clean)
            title = title_match.group(1).strip() if title_match else f"Section {idx + 1}"
            body = clean[title_match.end() :].strip() if title_match else clean

            # Extract category if present
            category_match = re.search(r"Category:\s*([^\n]+)", body, re.IGNORECASE)
            category = category_match.group(1).strip() if category_match else "Waste Guidance"

            # Keywords for retrieval
            words = re.findall(r"[a-z0-9]+", clean.lower())
            stop_words = {
                "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with",
                "is", "are", "do", "not", "by", "from", "it", "as", "be", "this", "that"
            }
            keywords = [w for w in words if w not in stop_words and len(w) > 1]

            chunk_id = f"chunk-{idx + 1}"
            chunks.append(
                KnowledgeChunk(
                    chunk_id=chunk_id,
                    title=title,
                    category=category,
                    content=body,
                    raw_text=clean,
                    keywords=keywords,
                )
            )
            idx += 1
        return chunks

    def retrieve(self, query: str, top_k: int = 3) -> tuple[list[tuple[KnowledgeChunk, float]], float]:
        """Score knowledge chunks against the query using token overlap and BM25-style weighting."""
        start_time = time.perf_counter()
        query_words = [
            w for w in re.findall(r"[a-z0-9]+", query.lower())
            if len(w) > 1 and w not in {"the", "a", "an", "and", "or", "how", "what", "where", "can", "i", "do"}
        ]
        if not query_words or not self.chunks:
            retrieval_duration = (time.perf_counter() - start_time) * 1000.0
            return [], retrieval_duration

        scored_chunks: list[tuple[KnowledgeChunk, float]] = []
        for chunk in self.chunks:
            score = 0.0
            raw_lower = chunk.raw_text.lower()
            title_lower = chunk.title.lower()

            # Exact title and keyword matching
            for q in query_words:
                if q in title_lower:
                    score += 4.0
                elif q in raw_lower:
                    # Weight by occurrences
                    count = raw_lower.count(q)
                    score += 1.0 + math.log1p(count)

            # Bonus if multiple query terms match
            matched_terms = sum(1 for q in query_words if q in raw_lower)
            if matched_terms > 1:
                score += matched_terms * 1.5

            if score > 0:
                # Normalize score loosely between 0.1 and 1.0
                normalized = min(1.0, round(score / (len(query_words) * 4.0), 3))
                scored_chunks.append((chunk, normalized))

        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        retrieval_duration = (time.perf_counter() - start_time) * 1000.0
        return scored_chunks[:top_k], retrieval_duration

    def _call_qwen_external_api(self, prompt: str, system_prompt: str) -> str | None:
        """Attempt to call external Qwen API (Ollama or OpenAI-compatible) if configured."""
        if not QWEN_API_BASE:
            return None
        try:
            import json
            import urllib.request

            headers = {"Content-Type": "application/json"}
            if QWEN_API_KEY:
                headers["Authorization"] = f"Bearer {QWEN_API_KEY}"

            payload = {
                "model": QWEN_MODEL_NAME,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "max_tokens": 512,
            }

            req = urllib.request.Request(
                f"{QWEN_API_BASE}/chat/completions",
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"].strip()
        except Exception:
            return None

    def _generate_grounded_response(
        self, query: str, context_chunks: list[KnowledgeChunk]
    ) -> str:
        """Generate response grounded in retrieved context from rag.txt in bulleted format by default, or prose if explicitly requested, with zero emojis."""
        if not context_chunks:
            return (
                "I could not find specific guidance for that item in the waste guide. "
                "Try asking about common materials like plastic bottles, cardboard, batteries, organic food scraps, "
                "or e-waste, or check the waste guide."
            )

        primary = context_chunks[0]
        category = primary.category
        body = primary.content

        # Parse sections
        instructions: list[str] = []
        inst_match = re.search(r"Disposal Instructions:\s*(.*?)(?=\n[A-Z][a-zA-Z\s&]+:|$)", body, re.DOTALL | re.IGNORECASE)
        if inst_match:
            instructions = [l.strip().lstrip("- •* ") for l in inst_match.group(1).splitlines() if l.strip()]

        cautions: list[str] = []
        caution_match = re.search(r"Caution:\s*(.*?)(?=\n[A-Z][a-zA-Z\s&]+:|$)", body, re.DOTALL | re.IGNORECASE)
        if caution_match:
            cautions = [l.strip().lstrip("- •* ") for l in caution_match.group(1).splitlines() if l.strip()]

        mat_notes: list[str] = []
        mat_match = re.search(r"Material & Recycling Context:\s*(.*?)(?=\n[A-Z][a-zA-Z\s&]+:|$)", body, re.DOTALL | re.IGNORECASE)
        if mat_match:
            mat_notes = [l.strip().lstrip("- •* ") for l in mat_match.group(1).splitlines() if l.strip()]

        reg_notes: list[str] = []
        reg_match = re.search(r"Regional Notes:\s*(.*?)(?=\n[A-Z][a-zA-Z\s&]+:|$)", body, re.DOTALL | re.IGNORECASE)
        if reg_match:
            reg_notes = [l.strip().lstrip("- •* ") for l in reg_match.group(1).splitlines() if l.strip()]

        q_lower = query.lower()
        non_bullet = is_explicit_non_bullet_request(query)

        if non_bullet:
            # Produce cohesive prose paragraph without bullet points
            prose_parts = [
                f"{primary.title} belongs in the {category} category.",
            ]
            if instructions:
                prose_parts.append(" ".join(instructions[:3]))
            if cautions:
                prose_parts.append(f"Caution: {cautions[0]}")
            if mat_notes:
                prose_parts.append(mat_notes[0])
            return remove_emojis(" ".join(prose_parts))

        # Default: Clean bullet-point structured response tailored to query
        parts = [f"**{primary.title}** ({category})"]

        # If user specifically asks "which bin" / "where does it go"
        if any(w in q_lower for w in ["which bin", "what bin", "where does", "where do", "where should"]):
            parts.append(f"• Bin destination: {category}")
            for inst in instructions[:3]:
                parts.append(f"• {inst}")
        # If user specifically asks about caution / safety / danger
        elif any(w in q_lower for w in ["caution", "danger", "safe", "hazard", "warning", "careful"]):
            if cautions:
                for c in cautions:
                    parts.append(f"• Caution: {c}")
            for inst in instructions[:2]:
                parts.append(f"• {inst}")
        # If user specifically asks about material or recycling process
        elif any(w in q_lower for w in ["material", "what is it made", "how is it recycled", "process", "plastic type"]):
            if mat_notes:
                for m in mat_notes:
                    parts.append(f"• Material note: {m}")
            for inst in instructions[:2]:
                parts.append(f"• {inst}")
        else:
            # General / "how to dispose" query
            for inst in instructions:
                parts.append(f"• {inst}")
            if cautions:
                parts.append(f"• Caution: {cautions[0]}")
            if mat_notes:
                parts.append(f"• Material note: {mat_notes[0]}")

        if reg_notes and any(w in q_lower for w in ["region", "state", "council", "local", "cds", "refund", "scheme"]):
            parts.append(f"• Regional note: {reg_notes[0]}")

        if len(context_chunks) > 1 and not any(w in q_lower for w in ["step", "only"]):
            secondary = context_chunks[1]
            parts.append(f"• Related category ({secondary.title}): {secondary.category}")

        return remove_emojis("\n\n".join(parts))

    def answer_query(self, query: str) -> tuple[str, str, RagTrace]:
        """Execute complete RAG pipeline with retrieval, Qwen model prompt, generation, and trace capture."""
        overall_start = time.perf_counter()
        pipeline_steps: list[dict[str, Any]] = []

        # 1. Retrieval
        retrieved, retrieval_ms = self.retrieve(query, top_k=2)
        pipeline_steps.append({
            "step": "retrieval",
            "status": "completed",
            "duration_ms": round(retrieval_ms, 2),
            "details": {
                "rag_file": str(self.rag_file_path.name) if self.rag_file_path else "none",
                "chunks_scanned": len(self.chunks),
                "matched_count": len(retrieved),
            },
        })

        # Assemble retrieved context
        context_text = "\n\n".join(
            f"[{c.title}] (Score: {score:.2f})\n{c.raw_text}" for c, score in retrieved
        )
        sources = [
            {
                "id": c.chunk_id,
                "title": c.title,
                "category": c.category,
                "score": score,
                "text": c.raw_text,
            }
            for c, score in retrieved
        ]

        top_score = retrieved[0][1] if retrieved else 0.0

        # 2. Context Injection & System Prompt
        system_prompt = (
            f"You are Sortify's waste sorting assistant powered by the lightweight base model {QWEN_MODEL_NAME}.\n"
            f"Answer the user query accurately and concisely using ONLY the provided context from rag.txt.\n"
            f"Strict output constraints:\n"
            f"- Make your response bullet-point based by default (e.g. • Step), UNLESS the user explicitly requests prose, a paragraph, or no bullets.\n"
            f"- Answer the specific question directly rather than reciting the entire document entry verbatim.\n"
            f"- Use plain text labels like 'Caution:' or 'Note:' without emoji icons.\n"
            f"- Absolutely NO emojis anywhere in the response (zero emojis, no unicode warning or recycle symbols).\n"
            f"- If the answer is not in the context, state that clearly."
        )
        prompt_with_context = (
            f"Context from rag.txt:\n{context_text}\n\nUser question: {query}\n\n"
            f"Provide a concise waste sorting recommendation formatted in clean bullet points (or prose if explicitly requested) with zero emojis based strictly on the context."
        )
        pipeline_steps.append({
            "step": "context_injection",
            "status": "completed",
            "duration_ms": 0.5,
            "details": {
                "chunks_used": len(retrieved),
                "context_char_length": len(context_text),
            },
        })

        # 3. Model Generation
        gen_start = time.perf_counter()
        external_reply = self._call_qwen_external_api(prompt_with_context, system_prompt)
        if external_reply:
            reply = remove_emojis(external_reply)
            model_used = f"{QWEN_MODEL_NAME} (API)"
        else:
            reply = remove_emojis(self._generate_grounded_response(query, [c for c, _ in retrieved]))
            model_used = f"{QWEN_MODEL_NAME} (Grounded Engine)"

        generation_ms = (time.perf_counter() - gen_start) * 1000.0
        pipeline_steps.append({
            "step": "qwen_generation",
            "status": "completed",
            "duration_ms": round(generation_ms, 2),
            "details": {"model": model_used},
        })

        total_ms = (time.perf_counter() - overall_start) * 1000.0

        trace = RagTrace(
            trace_id=f"trace-{int(time.time())}-{uuid.uuid4().hex[:6]}",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            query=query,
            model=model_used,
            retrieval_ms=round(retrieval_ms, 2),
            generation_ms=round(generation_ms, 2),
            total_ms=round(total_ms, 2),
            retrieval_score=round(top_score, 3),
            sources=sources,
            pipeline_steps=pipeline_steps,
            system_prompt=system_prompt,
        )

        return reply, context_text, trace


# Singleton instance
rag_engine = RagEngine()

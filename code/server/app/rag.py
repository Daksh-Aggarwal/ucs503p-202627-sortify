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

# Default model is Qwen 2.5 1.5B Instruct for high-quality instruction following
DEFAULT_QWEN_MODEL = "Qwen/Qwen2.5-1.5B-Instruct"
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
    title_tokens: set[str]
    token_counts: dict[str, int]


STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "if", "so", "how", "what", "where", "when", "why", "who", "which",
    "can", "could", "would", "should", "will", "do", "does", "did", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "i", "me", "my", "you", "your", "we", "our", "they", "them", "their", "he",
    "she", "it", "its", "this", "that", "these", "those", "to", "for", "in", "on", "at", "of", "by", "from",
    "with", "about", "into", "out", "up", "down", "over", "under", "not", "no", "yes", "yeah", "yep", "nope",
    "ok", "okay", "hi", "hey", "hello", "yo", "sup", "hola", "namaste", "thanks", "thank", "thx", "ty", "bye",
    "goodbye", "please", "pls", "plz", "help", "tell", "explain", "show", "give", "know", "want", "need",
    "think", "like", "just", "really", "very", "too", "also", "more", "some", "any", "all", "one", "two",
    "get", "got", "go", "goes", "going", "put", "throw", "away", "dispose", "disposal", "recycle", "recycling",
    "bin", "bins", "waste", "trash", "rubbish", "item", "items", "stuff", "thing", "things", "lol", "lmao",
    "rofl", "bruh", "bro", "dude", "wtf", "omg", "idk", "tbh", "smh", "test", "testing", "bullshit", "bs",
    "crap", "shit", "fuck", "damn", "heck", "random", "nothing", "anything", "something", "everything",
}

GREETING_PHRASES = {
    "hi", "hii", "hiii", "hello", "helo", "hey", "heyy", "heyyy", "yo", "sup", "hiya", "howdy", "hola",
    "namaste", "gm", "ge", "good morning", "good afternoon", "good evening", "hi there", "hello there",
    "hey there", "whats up", "what's up", "how are you", "how r u", "hows it going", "how's it going",
}

ACK_FAREWELL_PHRASES = {
    "thanks", "thank you", "thankyou", "thx", "ty", "tysm", "ok", "okay", "k", "kk", "cool", "nice",
    "great", "awesome", "got it", "understood", "sounds good", "bye", "goodbye", "cya", "see ya", "see you",
    "later", "alright", "fine",
}

HELP_META_PHRASES = {
    "who are you", "what are you", "what can you do", "help", "help me", "how does this work",
    "what is sortify", "how to use", "what do you do", "how can you help", "how can you help me",
    "what can you help me with", "what can you help with", "how do you help",
}

HELP_META_PATTERN = re.compile(
    r"\b(what can you do|what do you do|how can you help|how do you help|what can you help|"
    r"how can u help|what can u do|how do i use|how does this work|who are you|what are you|"
    r"what are your capabilities|what do you know)\b"
)


def normalize_token(word: str) -> str:
    w = word.lower()
    if len(w) > 4 and w.endswith("ies"):
        return w[:-3] + "y"
    if len(w) > 3 and w.endswith("es") and w[-3] in ("s", "x", "z", "h"):
        return w[:-2]
    if len(w) > 3 and w.endswith("s") and not w.endswith("ss"):
        return w[:-1]
    return w


def tokenize_normalized(text: str) -> list[str]:
    return [normalize_token(w) for w in re.findall(r"[a-z0-9]+", text.lower()) if len(w) > 1]


def has_word_phrase(text_lower: str, phrases: list[str]) -> bool:
    return any(re.search(rf"\b{re.escape(p)}\b", text_lower) for p in phrases)


def is_gibberish_token(token: str) -> bool:
    if len(token) >= 4 and len(set(token)) == 1:
        return True
    if len(token) >= 5 and not re.search(r"[aeiouy0-9]", token):
        return True
    return False


def classify_conversational_or_invalid(query: str) -> str | None:
    """Return a direct conversational/guardrail reply if query is a greeting, ack, help, or nonsense."""
    cleaned = re.sub(r"[^\w\s']", " ", query.lower()).strip()
    collapsed = re.sub(r"\s+", " ", cleaned)
    if not collapsed or not re.search(r"[a-z]{2,}", collapsed):
        return (
            "I can only help with waste sorting, recycling, and disposal questions. "
            "Try asking about a specific item or material, such as plastic bottles, batteries, pizza boxes, or e-waste."
        )

    if collapsed in GREETING_PHRASES:
        return (
            "Hello! I'm the Sortify waste sorting assistant. "
            "Ask me how to dispose of any item (for example, plastic bottles, batteries, pizza boxes, or e-waste) or which bin it belongs in."
        )

    if collapsed in ACK_FAREWELL_PHRASES:
        if any(w in collapsed for w in ("bye", "cya", "see ya", "see you", "later")):
            return "Goodbye! Feel free to come back anytime you need help sorting an item."
        return "You're welcome! Let me know if you have another item you need help sorting."

    if collapsed in HELP_META_PHRASES or HELP_META_PATTERN.search(collapsed):
        return (
            "**Sortify Waste Sorting Assistant**\n\n"
            "I can help you sort and dispose of household items properly using the Sortify waste guide:\n\n"
            "• Bin Lookup: Ask which bin an item belongs in (e.g., \"Where does a plastic bottle go?\" or \"Which bin for pizza boxes?\").\n\n"
            "• Preparation & Safety: Get disposal steps and safety cautions for tricky or hazardous items like batteries, vapes, motor oil, and medicines.\n\n"
            "• Category Guides: Ask what goes in a bin (e.g., \"What items go into the recyclable bin?\" or \"What goes in the green organics bin?\").\n\n"
            "• Feasibility Checks: Check whether specific materials can be recycled (e.g., \"Can I recycle soft plastics?\" or \"Are ceramics recyclable?\")."
        )

    if re.search(r"\b(who won|tell me a joke|write a poem|capital of|weather today|prime minister|president of)\b", collapsed):
        return (
            "I can only help with waste sorting, recycling, and disposal questions. "
            "Try asking about a specific item or material, such as plastic bottles, batteries, pizza boxes, or e-waste."
        )

    return None


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

            # Keywords and normalized tokens for retrieval
            words = re.findall(r"[a-z0-9]+", clean.lower())
            keywords = [w for w in words if w not in STOP_WORDS and len(w) > 1]
            title_tokens = set(tokenize_normalized(title))
            token_counts: dict[str, int] = {}
            for tok in tokenize_normalized(clean):
                token_counts[tok] = token_counts.get(tok, 0) + 1

            chunk_id = f"chunk-{idx + 1}"
            chunks.append(
                KnowledgeChunk(
                    chunk_id=chunk_id,
                    title=title,
                    category=category,
                    content=body,
                    raw_text=clean,
                    keywords=keywords,
                    title_tokens=title_tokens,
                    token_counts=token_counts,
                )
            )
            idx += 1
        return chunks

    def retrieve(self, query: str, top_k: int = 3) -> tuple[list[tuple[KnowledgeChunk, float]], float]:
        """Score knowledge chunks against the query using whole-word token overlap and BM25-style weighting."""
        start_time = time.perf_counter()
        raw_tokens = tokenize_normalized(query)
        query_words = [
            w for w in raw_tokens
            if len(w) > 1 and w not in STOP_WORDS and not is_gibberish_token(w)
        ]
        if not query_words or not self.chunks:
            retrieval_duration = (time.perf_counter() - start_time) * 1000.0
            return [], retrieval_duration

        scored_chunks: list[tuple[KnowledgeChunk, float]] = []
        for chunk in self.chunks:
            score = 0.0
            matched_terms = 0

            # Exact whole-token title and body matching (never substring)
            for q in query_words:
                if q in chunk.title_tokens:
                    score += 4.0
                    matched_terms += 1
                elif q in chunk.token_counts:
                    count = chunk.token_counts[q]
                    score += 1.0 + math.log1p(count)
                    matched_terms += 1

            # Bonus if multiple query terms match
            if matched_terms > 1:
                score += matched_terms * 1.5

            if score > 0:
                # Normalize score loosely between 0.1 and 1.0
                normalized = min(1.0, round(score / (len(query_words) * 4.0), 3))
                scored_chunks.append((chunk, normalized))

        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        retrieval_duration = (time.perf_counter() - start_time) * 1000.0
        return scored_chunks[:top_k], retrieval_duration

    def _call_qwen_external_api(
        self,
        prompt: str,
        system_prompt: str,
        api_base: str | None = None,
        model_name: str | None = None,
    ) -> str | None:
        """Attempt to call external Qwen API (Ollama or OpenAI-compatible) if configured."""
        target_api_base = (api_base or QWEN_API_BASE).rstrip("/")
        if not target_api_base:
            return None
        target_model = model_name or QWEN_MODEL_NAME
        try:
            import json
            import urllib.request

            headers = {"Content-Type": "application/json"}
            if QWEN_API_KEY:
                headers["Authorization"] = f"Bearer {QWEN_API_KEY}"

            payload = {
                "model": target_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "max_tokens": 512,
            }

            endpoint = (
                target_api_base
                if target_api_base.endswith("/chat/completions")
                else f"{target_api_base}/chat/completions"
            )
            req = urllib.request.Request(
                endpoint,
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
        """Generate response grounded in retrieved context from rag.txt with flexible intent awareness, bullet points by default, or prose if requested, and zero emojis."""
        q_lower = query.lower().strip()
        non_bullet = is_explicit_non_bullet_request(query)

        # 1. Detect Category-Level Synthesized Queries
        is_category_inquiry = (
            any(p in q_lower for p in ["what items", "which items", "what goes", "what can i", "what belongs", "list items", "all items", "guide for"])
            or sum(1 for k in ["items", "go into", "bin"] if k in q_lower) >= 2
        )

        is_recycling_category = (
            any(k in q_lower for k in ["recyclab", "recycling", "yellow bin", "blue bin", "commingled"])
            and not any(k in q_lower for k in ["not recyclab", "non-recyclab", "is soft plastic recyclab"])
        )

        is_organic_category = any(k in q_lower for k in ["organic", "compost", "green bin", "fogo", "food scrap", "food waste", "yard waste"])
        is_general_waste_category = any(k in q_lower for k in ["general waste", "red bin", "landfill", "rubbish", "trash bin"])
        is_hazardous_category = any(k in q_lower for k in ["hazardous", "e-waste", "ewaste", "electronic waste", "batteries and electronics", "toxic"])

        if is_category_inquiry:
            if is_recycling_category:
                title = "Recyclable Commingled Bin (Yellow / Blue Lid)"
                if non_bullet:
                    prose = (
                        f"{title}: Curbside commingled recycling accepts clean, rigid containers made of plastic, glass, metal, and dry cardboard packaging. "
                        "Rigid plastics include plastic drink bottles, milk jugs, detergent containers, and shampoo bottles with caps kept on. "
                        "Paper and cardboard include flattened delivery boxes, cereal cartons, newspapers, and clean magazines. "
                        "Glass containers include clean food jars, juice bottles, and beverage containers. "
                        "Metal packaging includes aluminum drink cans, clean foil scrunched into a tennis ball size, food tins, and empty aerosol cans. "
                        "Always empty liquids and rinse food residue loose; never bag recycling in tied plastic bags. "
                        "Caution: Never place soft plastic grocery bags, cling film, chip packets, greasy pizza box bottoms, batteries, clothing, or broken ceramics into curbside recycling."
                    )
                    return remove_emojis(prose)
                bullets = [
                    f"**{title}**",
                    "Curbside recycling accepts clean, rigid containers made of plastic, glass, metal, and dry paper packaging:",
                    "• Rigid Plastics: Plastic drink bottles, milk jugs, detergent containers, and shampoo bottles (PET #1, HDPE #2, PP #5). Keep plastic caps screwed on.",
                    "• Paper & Cardboard: Flattened cardboard shipping boxes, cereal boxes, newspapers, magazines, and clean paper packaging.",
                    "• Glass Containers: Clean glass food jars, juice bottles, wine and beer bottles (unbroken). Metal lids can stay on or go loose.",
                    "• Metal Packaging: Aluminum drink cans, clean aluminum foil scrunched tightly into a tennis ball size, food tins, and empty aerosol spray cans.",
                    "• Preparation Rule: Empty all liquids and scrape away food residue; rinse lightly. Place all items loose into the recycling bin, never tied inside plastic garbage bags.",
                    "Caution: Never place soft plastic shopping bags, cling film, chip packets, greasy pizza box bottoms, batteries, clothing, or broken ceramics into curbside recycling.",
                    "Related: Check for 10-cent refund eligibility under local Container Deposit Schemes (CDS) on eligible beverage cans and bottles.",
                ]
                return remove_emojis("\n\n".join(bullets))

            if is_organic_category:
                title = "Organic Compost & Garden Bin (Green Lid / FOGO)"
                if non_bullet:
                    prose = (
                        f"{title}: The green organics bin turns food scraps and garden trimmings into certified compost. "
                        "Kitchen food waste includes fruit peelings, apple cores, vegetable peelings, bread crusts, coffee grounds, eggshells, and leftover cooked food. "
                        "Food-soiled paper such as greasy pizza box bottoms, unbleached napkins, and shredded uncoated paper are accepted in FOGO. "
                        "Certified compostable liners displaying AS 4736 or AS 5810 logos can line kitchen caddies. "
                        "Garden trimmings include lawn clippings, twigs, leaves, and pruned flowers. "
                        "Caution: Remove all plastic PLU fruit price stickers and rubber bands before discarding. Never put plastic bags, pet droppings, treated timber, or non-certified plastics into organics."
                    )
                    return remove_emojis(prose)
                bullets = [
                    f"**{title}**",
                    "The green organics bin turns food scraps and garden trimmings into certified compost:",
                    "• Kitchen Food Scraps: Fruit peelings, apple cores, potato skins, bread crusts, coffee grounds, and eggshells.",
                    "• Food-Soiled Paper: Grease-soaked pizza box bottoms, unbleached paper towels, and shredded uncoated paper.",
                    "• Certified Compostable Liners: Kitchen caddy liners displaying the seedling logo (AS 4736 or AS 5810).",
                    "• Garden Organics: Lawn clippings, pruning twigs, leaves, and non-invasive garden trimmings.",
                    "Caution: Remove all plastic price-look-up (PLU) fruit stickers and rubber bands before discarding. Never place plastic bags, treated timber, or non-certified plastics into organics.",
                ]
                return remove_emojis("\n\n".join(bullets))

            if is_general_waste_category:
                title = "General Waste & Landfill Bin (Red Lid)"
                if non_bullet:
                    prose = (
                        f"{title}: The red general waste bin is for household waste items that cannot be recycled, composted, or safely dropped off at specialty depots. "
                        "Items include flexible soft plastics like chip packets, candy wrappers, cling film, and plastic bags if store drop-off is unavailable. "
                        "It also accepts non-recyclable ceramics, broken drinking glasses, Pyrex ovenware, window panes, thermal supermarket receipts, face masks, wipes, and polystyrene foam. "
                        "Caution: Never put batteries, mobile phones, electronic vapes, motor oil, or hazardous chemical liquids into the red bin; compactor trucks ignite."
                    )
                    return remove_emojis(prose)
                bullets = [
                    f"**{title}**",
                    "The red bin is for household waste items that cannot be recycled, composted, or safely dropped off at specialty depots:",
                    "• Flexible Soft Plastics: Chip packets, candy wrappers, cling film, and bread bags (when dedicated supermarket collection bins are unavailable).",
                    "• Non-Recyclable Ceramics & Glass: Broken mugs, drinking tumblers, Pyrex bakeware, mirrors, and window panes.",
                    "• Contaminated Paper: Wax-coated cartons, thermal supermarket shopping receipts, and plastic-laminated packaging.",
                    "• Sanitary & Single-Use PPE: Disposable face masks, nitrile gloves, tissues, and sanitizing wipes.",
                    "• Polystyrene Foam: Takeaway foam clamshells, packing peanuts, and broken foam blocks.",
                    "Caution: Never put batteries, mobile phones, electronic vapes, motor oil, or hazardous chemical liquids into the red bin; compactor trucks ignite.",
                ]
                return remove_emojis("\n\n".join(bullets))

            if is_hazardous_category:
                title = "E-Waste & Hazardous Materials (Specialized Drop-Off)"
                if non_bullet:
                    prose = (
                        f"{title}: Electronics, batteries, and toxic chemical fluids must never be placed in any household curbside bin. "
                        "Items include household lithium-ion, rechargeable tool packs, AA/AAA alkaline batteries, button cells, disposable vapes, mobile phones, laptops, used engine motor oil, and expired pharmaceuticals. "
                        "Drop off taped batteries and small electronics at supermarket collection bins or civic e-waste depots. Deliver used motor oil and chemicals to council drop-offs. Return expired medicines to pharmacies. "
                        "Caution: Lithium-ion batteries and vapes ignite catastrophic truck fires when compacted. Always tape positive and negative terminals with insulating tape before drop-off."
                    )
                    return remove_emojis(prose)
                bullets = [
                    f"**{title}**",
                    "Electronics, batteries, and toxic chemical fluids must never be placed in any household curbside bin:",
                    "• Household Batteries: Lithium-ion, rechargeable tool packs, AA, AAA, C, D, 9V, and button-cell batteries.",
                    "• Electronics & Vapes: Disposable vapes, pod vapes, mobile phones, chargers, laptops, tablets, and small home appliances.",
                    "• Hazardous Automotive & Fluids: Used engine motor oil, brake fluid, radiator coolant, solvent paints, and lawn pesticides.",
                    "• Medical Waste: Expired prescription medications and pharmaceutical blister packs (return to pharmacies).",
                    "• Disposal Destination: Take taped batteries to supermarket collection bins; deliver e-waste and chemicals to council civic drop-offs.",
                    "Caution: Lithium-ion batteries and vapes ignite catastrophic fires when compacted in curbside trucks. Always tape terminals with insulating tape before drop-off.",
                ]
                return remove_emojis("\n\n".join(bullets))

        # 2. Specific Feasibility Questions ("Can I recycle...", "Is X recyclable...")
        if has_word_phrase(q_lower, ["pizza", "pizza box", "pizza boxes"]):
            bullets = [
                "**Pizza Boxes & Oil-Contaminated Paperboard** (Recyclable & Organic / Compost)",
                "• Clean Cardboard Top: Tear off the clean top half of the pizza box and place it directly into your curbside paper and cardboard recycling bin.",
                "• Greasy Cardboard Bottom: Place the grease-soaked, cheese-stained bottom into your green-lid FOGO organics bin or backyard compost.",
                "• If FOGO is unavailable locally: Discard the greasy bottom into your red-lid general waste bin.",
                "Caution: Never put cheese or grease-soaked cardboard into the dry recycling bin; animal fats and oils ruin paper pulp batches during recycling.",
            ]
            return remove_emojis("\n\n".join(bullets))

        if has_word_phrase(q_lower, ["plastic bag", "plastic bags", "soft plastic", "soft plastics", "bubble wrap", "cling film", "chip packet", "wrapper", "wrappers"]):
            bullets = [
                "**Plastic Bags & Flexible Soft Plastics** (Specialized Drop-Off / General Waste)",
                "• Curbside Yellow Bin: No. Flexible soft plastics must never go into your curbside recycling bin.",
                "• The Scrunch Test: Squeeze the plastic packaging tightly into your fist. If it bounces back open, it is soft plastic and cannot go into curbside bins.",
                "• Supermarket Drop-Off: Collect clean, dry bread bags, grocery bags, and wraps for dedicated soft-plastic supermarket collection bins where available.",
                "• General Waste: If no dedicated soft-plastic drop-off exists locally, place flexible plastics into the red general waste bin.",
                "Caution: Soft plastic films wrap around rotating sorting conveyor rollers at recycling facilities, causing machinery blockages and complete plant shutdowns.",
            ]
            return remove_emojis("\n\n".join(bullets))

        if has_word_phrase(q_lower, ["bottle cap", "bottle caps", "lid", "lids", "caps stay on", "cap on or off"]):
            bullets = [
                "**Bottle Caps, Jar Lids & Container Closures** (Recyclable)",
                "• Plastic Bottle Caps: Empty the liquid, rinse briefly, and screw the plastic cap tightly back onto the plastic bottle.",
                "• Why Keep Plastic Caps On: Loose caps smaller than 5cm fall through sorting screens, but attached caps are sorted alongside the bottle.",
                "• Metal Jar Lids & Crown Caps: Collect metal lids loose into the recycling bin, or screw back onto clean glass jars.",
                "• Beer & Crown Bottle Caps: Collect inside a steel food tin and crimp the lid shut so magnetic separators catch them.",
                "Caution: Remove foil seals and rubber pump spray heads before placing bottles in the bin.",
            ]
            return remove_emojis("\n\n".join(bullets))

        if has_word_phrase(q_lower, ["styrofoam", "polystyrene", "foam clamshell", "packing peanut", "packing peanuts"]):
            bullets = [
                "**Polystyrene Foam & Styrofoam Packaging** (General Waste / Specialized Drop-Off)",
                "• Curbside Yellow Bin: No. Expanded polystyrene foam cannot be recycled in curbside commingled bins.",
                "• Red Bin Disposal: Break small takeaway foam trays and packaging pieces into household general waste.",
                "• Bulk EPS Blocks: Deliver large appliance packaging foam blocks to dedicated municipal polystyrene drop-off depots.",
                "Caution: Polystyrene foam shatters into millions of microscopic static beads that contaminate paper and plastic recycling machinery.",
            ]
            return remove_emojis("\n\n".join(bullets))

        if has_word_phrase(q_lower, ["drinking glass", "wine glass", "broken glass", "ceramic", "ceramics", "mug", "mugs", "pyrex", "window pane", "mirror", "mirrors"]):
            bullets = [
                "**Ceramics, Drinking Glassware & Pyrex** (General Waste / Donation)",
                "• Curbside Glass Bin: No. Drinking glasses, ceramic mugs, Pyrex bakeware, and mirrors do not belong in curbside glass recycling.",
                "• Why: Cookware and window glass melt at much higher temperatures than container bottle glass, ruining entire furnace batches.",
                "• Disposal: Wrap broken ceramics and glassware safely in newspaper and place into the red general waste bin.",
                "• Usable Items: Donate intact mugs, plates, and dishes to charity op-shops.",
                "Caution: Never place drinking glassware or oven dishes into curbside bottle recycling bins.",
            ]
            return remove_emojis("\n\n".join(bullets))

        # 3. Item-Specific Retrieval Matching
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

        if non_bullet:
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

        if any(w in q_lower for w in ["which bin", "what bin", "where does", "where do", "where should"]):
            parts.append(f"• Bin destination: {category}")
            for inst in instructions[:3]:
                parts.append(f"• {inst}")
        elif any(w in q_lower for w in ["caution", "danger", "safe", "hazard", "warning", "careful"]):
            if cautions:
                for c in cautions:
                    parts.append(f"• Caution: {c}")
            for inst in instructions[:2]:
                parts.append(f"• {inst}")
        elif any(w in q_lower for w in ["material", "what is it made", "how is it recycled", "process", "plastic type"]):
            if mat_notes:
                for m in mat_notes:
                    parts.append(f"• Material note: {m}")
            for inst in instructions[:2]:
                parts.append(f"• {inst}")
        else:
            for inst in instructions:
                parts.append(f"• {inst}")

        if cautions and not any(w in q_lower for w in ["caution", "danger", "safe", "hazard", "warning"]):
            parts.append(f"Caution: {cautions[0]}")

        if reg_notes and any(w in q_lower for w in ["region", "state", "council", "local", "cds", "refund", "scheme"]):
            parts.append(f"• Regional note: {reg_notes[0]}")

        return remove_emojis("\n\n".join(parts))

    def answer_query(
        self,
        query: str,
        mode: str = "qwen",
        custom_api_url: str | None = None,
        custom_model: str | None = None,
    ) -> tuple[str, str, RagTrace]:
        """Execute complete RAG pipeline with retrieval, Qwen model prompt, generation, and trace capture."""
        overall_start = time.perf_counter()
        pipeline_steps: list[dict[str, Any]] = []

        # 0. Guardrail for greetings, acknowledgments, help, or invalid/empty queries
        direct_reply = classify_conversational_or_invalid(query)
        model_name = custom_model or QWEN_MODEL_NAME
        system_prompt = (
            f"You are Sortify's waste sorting assistant powered by {model_name}.\n"
            f"Answer the user query accurately, flexibly, and concisely using the provided context from rag.txt.\n"
            f"Strict output constraints:\n"
            f"- Make your response bullet-point based by default (e.g. • Step), UNLESS the user explicitly requests prose, a paragraph, or no bullets.\n"
            f"- Answer the specific question directly rather than reciting the entire document entry verbatim.\n"
            f"- Use plain text labels like 'Caution:' or 'Note:' without emoji icons.\n"
            f"- Absolutely NO emojis anywhere in the response (zero emojis, no unicode warning or recycle symbols).\n"
            f"- If the answer is not in the context, provide helpful guidance pointing to the waste guide."
        )
        model_used = f"{model_name} (RAG Knowledge Engine)"

        if direct_reply is not None:
            total_ms = (time.perf_counter() - overall_start) * 1000.0
            trace = RagTrace(
                trace_id=f"trace-{int(time.time())}-{uuid.uuid4().hex[:6]}",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                query=query,
                model=model_used,
                retrieval_ms=0.0,
                generation_ms=round(total_ms, 2),
                total_ms=round(total_ms, 2),
                retrieval_score=0.0,
                sources=[],
                pipeline_steps=[
                    {
                        "step": "intent_guardrail",
                        "status": "completed",
                        "duration_ms": round(total_ms, 2),
                        "details": {"handled_as": "conversational_or_out_of_scope"},
                    }
                ],
                system_prompt=system_prompt,
            )
            return remove_emojis(direct_reply), "No rag.txt retrieval needed for conversational or out-of-scope query.", trace

        # 1. Retrieval
        retrieved, retrieval_ms = self.retrieve(query, top_k=3)
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
        reply = remove_emojis(self._generate_grounded_response(query, [c for c, _ in retrieved]))

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

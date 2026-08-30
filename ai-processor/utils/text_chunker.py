from typing import List, Dict, Any
import re


class TextChunker:
    """Chunk text into smaller pieces for vectorization."""

    def __init__(self, chunk_size: int = 400, chunk_overlap: int = 50):
        if chunk_size <= 0:
            raise ValueError("chunk_size must be greater than 0")

        if chunk_overlap < 0:
            raise ValueError("chunk_overlap must be >= 0")

        if chunk_overlap >= chunk_size:
            raise ValueError(
                "chunk_overlap must be smaller than chunk_size"
            )

        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(
        self,
        text: str,
        metadata: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Chunk text into sentence-aware pieces with character overlap."""

        if not text or not text.strip():
            return []

        # Clean text
        text = self._clean_text(text)

        # Split into sentences / phrases
        sentences = self._split_into_sentences(text)

        chunks = []
        current_chunk = ""
        chunk_index = 0

        for sentence in sentences:

            # If a single sentence is larger than chunk_size,
            # split it separately.
            if len(sentence) > self.chunk_size:
                # Save current chunk first
                if current_chunk.strip():
                    chunks.append({
                        "text": current_chunk.strip(),
                        "chunk_index": chunk_index,
                        "metadata": metadata or {}
                    })
                    chunk_index += 1

                    # Keep overlap
                    overlap_text = self._get_overlap_text(current_chunk)
                else:
                    overlap_text = ""

                # Split oversized sentence
                sub_chunks = self._split_long_text(
                    sentence,
                    overlap_text
                )

                for sub_chunk in sub_chunks:
                    chunks.append({
                        "text": sub_chunk.strip(),
                        "chunk_index": chunk_index,
                        "metadata": metadata or {}
                    })
                    chunk_index += 1

                current_chunk = ""

                # Keep last part for overlap with next sentence
                if sub_chunks:
                    current_chunk = self._get_overlap_text(
                        sub_chunks[-1]
                    )

                continue

            # Normal sentence grouping
            candidate = (
                f"{current_chunk} {sentence}".strip()
                if current_chunk
                else sentence
            )

            if len(candidate) <= self.chunk_size:
                current_chunk = candidate

            else:
                # Save current chunk
                if current_chunk.strip():
                    chunks.append({
                        "text": current_chunk.strip(),
                        "chunk_index": chunk_index,
                        "metadata": metadata or {}
                    })
                    chunk_index += 1

                # Character-based overlap
                overlap_text = self._get_overlap_text(current_chunk)

                # Start next chunk
                current_chunk = (
                    f"{overlap_text} {sentence}".strip()
                    if overlap_text
                    else sentence
                )

                # Safety: overlap + sentence may exceed chunk_size
                if len(current_chunk) > self.chunk_size:
                    sub_chunks = self._split_long_text(
                        current_chunk
                    )

                    for sub_chunk in sub_chunks[:-1]:
                        chunks.append({
                            "text": sub_chunk.strip(),
                            "chunk_index": chunk_index,
                            "metadata": metadata or {}
                        })
                        chunk_index += 1

                    current_chunk = (
                        sub_chunks[-1]
                        if sub_chunks
                        else ""
                    )

        # Add final chunk
        if current_chunk.strip():
            chunks.append({
                "text": current_chunk.strip(),
                "chunk_index": chunk_index,
                "metadata": metadata or {}
            })

        return chunks

    def chunk_structured_content(
        self,
        content: List[Dict[str, Any]],
        source_metadata: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Chunk structured content (text, tables, images)."""

        chunks = []
        global_index = 0

        for item in content:

            content_type = item.get("type", "text")
            content_data = item.get("data", "")

            # -------------------------
            # TEXT
            # -------------------------
            if content_type == "text":

                text_chunks = self.chunk_text(
                    content_data,
                    {
                        **(source_metadata or {}),
                        "content_type": "text",
                        "source_index": item.get("index", 0)
                    }
                )

                for chunk in text_chunks:
                    chunk["chunk_index"] = global_index
                    chunks.append(chunk)
                    global_index += 1

            # -------------------------
            # TABLE
            # -------------------------
            elif content_type == "table":

                table_text = self._table_to_text(
                    content_data
                )

                table_chunks = self.chunk_text(
                    table_text,
                    {
                        **(source_metadata or {}),
                        "content_type": "table",
                        "source_index": item.get("index", 0)
                    }
                )

                for chunk in table_chunks:
                    chunk["chunk_index"] = global_index
                    chunks.append(chunk)
                    global_index += 1

            # -------------------------
            # IMAGE
            # -------------------------
            elif content_type == "image":

                image_text = (
                    item.get("description", "")
                    or item.get("ocr_text", "")
                )

                if image_text:

                    image_chunks = self.chunk_text(
                        image_text,
                        {
                            **(source_metadata or {}),
                            "content_type": "image",
                            "source_index": item.get("index", 0)
                        }
                    )

                    for chunk in image_chunks:
                        chunk["chunk_index"] = global_index
                        chunks.append(chunk)
                        global_index += 1

        return chunks

    def _clean_text(self, text: str) -> str:
        """Clean text while preserving readable spacing."""

        # Normalize newlines / tabs / multiple spaces
        text = re.sub(r"\s+", " ", text)

        return text.strip()

    def _split_into_sentences(
        self,
        text: str
    ) -> List[str]:
        """
        Split text using Myanmar and English punctuation.

        Myanmar:
            ။ = sentence ending
            ၊ = comma / phrase boundary

        English:
            . ! ?
        """

        # Split after Myanmar and English punctuation.
        #
        # Example:
        # "ဒါက စာသားဖြစ်သည်။ နောက်ထပ်စာသား။"
        #
        # becomes:
        # ["ဒါက စာသားဖြစ်သည်။", "နောက်ထပ်စာသား။"]

        sentences = re.split(
            r"(?<=[။၊.!?])\s*",
            text
        )

        return [
            sentence.strip()
            for sentence in sentences
            if sentence.strip()
        ]

    def _get_overlap_text(
        self,
        text: str
    ) -> str:
        """
        Get character-based overlap from previous chunk.

        chunk_size and chunk_overlap both use characters.
        """

        if not text:
            return ""

        if len(text) <= self.chunk_overlap:
            return text

        return text[-self.chunk_overlap:].strip()

    def _split_long_text(
        self,
        text: str,
        initial_overlap: str = ""
    ) -> List[str]:
        """
        Split text that is larger than chunk_size.

        Tries to split at Myanmar comma / whitespace first,
        then falls back to hard character splitting.
        """

        text = text.strip()
        if not text:
            return []
        chunks = []
        start = 0
        while start < len(text):
            end = min(
                start + self.chunk_size,
                len(text)
            )
            # Last chunk
            if end >= len(text):
                chunk = text[start:end].strip()

                if chunk:
                    chunks.append(chunk)

                break
            # Try to find a natural boundary
            boundary_range = text[start:end]
            # Prefer Myanmar comma / sentence boundary
            boundary_matches = list(
                re.finditer(
                    r"[၊။.!?]\s*",
                    boundary_range
                )
            )
            if boundary_matches:
                match = boundary_matches[-1]
                split_at = start + match.end()

            else:
                # Fallback to whitespace
                whitespace_match = re.search(
                    r"\s+(?!.*\s)",
                    boundary_range
                )

                if whitespace_match:
                    split_at = start + whitespace_match.start()

                else:
                    # Hard split
                    split_at = end
            chunk = text[start:split_at].strip()
            if chunk:
                chunks.append(chunk)
            # Character overlap
            next_start = max(
                split_at - self.chunk_overlap,
                start + 1
            )
            start = next_start
        return chunks

    def _table_to_text(
        self,
        table_data: Any
    ) -> str:
        """Convert table data to text representation."""

        if isinstance(table_data, list):
            text_parts = []
            for row in table_data:
                if isinstance(row, list):
                    text_parts.append(
                        " | ".join(
                            str(cell)
                            for cell in row
                        )
                    )
                else:
                    text_parts.append(str(row))
            return "\n".join(text_parts)
        
        elif isinstance(table_data, dict):
            headers = table_data.get(
                "headers",
                []
            )
            rows = table_data.get(
                "rows",
                []
            )
            text_parts = [
                " | ".join(
                    str(header)
                    for header in headers
                )
            ]
            for row in rows:
                text_parts.append(
                    " | ".join(
                        str(cell)
                        for cell in row
                    )
                )
            return "\n".join(text_parts)
        
        else:
            return str(table_data)
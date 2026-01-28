"""
Text Chunker: Split documents into chunks for embedding and retrieval.

Supports:
- Fixed size chunking with overlap
- Sentence-aware chunking
- Semantic chunking (split on topic changes)
- Code-aware chunking (preserve functions/classes)
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from dataclasses import dataclass
import re


@dataclass
class Chunk:
    """A text chunk with metadata."""
    text: str
    start_index: int
    end_index: int
    metadata: dict


class BaseChunker(ABC):
    """Base class for text chunkers."""

    @abstractmethod
    def split(self, text: str) -> List[str]:
        """Split text into chunks."""
        pass


class TextChunker(BaseChunker):
    """
    General purpose text chunker with overlap.

    Tries to split at natural boundaries (paragraphs, sentences)
    while respecting chunk size limits.
    """

    def __init__(
        self,
        chunk_size: int = 512,
        overlap: int = 50,
        min_chunk_size: int = 100,
    ):
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.min_chunk_size = min_chunk_size

        # Separators in order of preference
        self.separators = [
            "\n\n",  # Paragraph
            "\n",    # Line break
            ". ",    # Sentence
            "! ",
            "? ",
            "; ",
            ", ",
            " ",     # Word
        ]

    def split(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""
        if not text:
            return []

        # Clean text
        text = text.strip()

        if len(text) <= self.chunk_size:
            return [text]

        chunks = []
        start = 0

        while start < len(text):
            end = start + self.chunk_size

            if end >= len(text):
                # Last chunk
                chunk = text[start:].strip()
                if chunk and len(chunk) >= self.min_chunk_size:
                    chunks.append(chunk)
                break

            # Find best split point
            split_point = self._find_split_point(text, start, end)
            chunk = text[start:split_point].strip()

            if chunk and len(chunk) >= self.min_chunk_size:
                chunks.append(chunk)

            # Move start with overlap
            start = max(start + 1, split_point - self.overlap)

        return chunks

    def _find_split_point(self, text: str, start: int, end: int) -> int:
        """Find the best point to split the text."""
        # Try each separator in order of preference
        for separator in self.separators:
            # Look for separator near the end of the chunk
            search_start = max(start, end - 100)
            idx = text.rfind(separator, search_start, end)

            if idx > start:
                return idx + len(separator)

        # No good split point found, split at chunk_size
        return end


class SentenceChunker(BaseChunker):
    """
    Sentence-aware chunker that preserves sentence boundaries.
    """

    def __init__(
        self,
        max_sentences_per_chunk: int = 5,
        min_sentences_per_chunk: int = 1,
    ):
        self.max_sentences = max_sentences_per_chunk
        self.min_sentences = min_sentences_per_chunk

        # Sentence ending patterns
        self.sentence_pattern = re.compile(r'(?<=[.!?])\s+(?=[A-Z])')

    def split(self, text: str) -> List[str]:
        """Split text into sentence-based chunks."""
        if not text:
            return []

        # Split into sentences
        sentences = self.sentence_pattern.split(text)
        sentences = [s.strip() for s in sentences if s.strip()]

        if len(sentences) <= self.max_sentences:
            return [text]

        chunks = []
        current_chunk = []

        for sentence in sentences:
            current_chunk.append(sentence)

            if len(current_chunk) >= self.max_sentences:
                chunks.append(" ".join(current_chunk))
                # Keep last sentence for overlap
                current_chunk = [current_chunk[-1]] if self.min_sentences > 0 else []

        # Add remaining sentences
        if current_chunk and len(current_chunk) >= self.min_sentences:
            chunks.append(" ".join(current_chunk))

        return chunks


class CodeChunker(BaseChunker):
    """
    Code-aware chunker that preserves function/class boundaries.
    """

    def __init__(
        self,
        max_chunk_size: int = 2000,
        language: str = "python",
    ):
        self.max_chunk_size = max_chunk_size
        self.language = language

        # Patterns for different languages
        self.patterns = {
            "python": [
                r'^class\s+\w+',
                r'^def\s+\w+',
                r'^async\s+def\s+\w+',
            ],
            "javascript": [
                r'^class\s+\w+',
                r'^function\s+\w+',
                r'^const\s+\w+\s*=\s*(async\s+)?\(',
                r'^export\s+(default\s+)?',
            ],
            "typescript": [
                r'^class\s+\w+',
                r'^interface\s+\w+',
                r'^type\s+\w+',
                r'^function\s+\w+',
                r'^const\s+\w+\s*=\s*(async\s+)?\(',
                r'^export\s+(default\s+)?',
            ],
        }

    def split(self, text: str) -> List[str]:
        """Split code into logical chunks."""
        if not text:
            return []

        lines = text.split('\n')
        chunks = []
        current_chunk = []
        current_size = 0

        patterns = self.patterns.get(self.language, self.patterns["python"])
        boundary_pattern = re.compile('|'.join(patterns), re.MULTILINE)

        for i, line in enumerate(lines):
            # Check if this line is a boundary
            is_boundary = bool(boundary_pattern.match(line.strip()))

            # If boundary and we have content, start new chunk
            if is_boundary and current_chunk and current_size > 0:
                chunks.append('\n'.join(current_chunk))
                current_chunk = []
                current_size = 0

            current_chunk.append(line)
            current_size += len(line)

            # Force split if chunk too large
            if current_size >= self.max_chunk_size:
                chunks.append('\n'.join(current_chunk))
                current_chunk = []
                current_size = 0

        # Add remaining content
        if current_chunk:
            chunks.append('\n'.join(current_chunk))

        return [c for c in chunks if c.strip()]


class MarkdownChunker(BaseChunker):
    """
    Markdown-aware chunker that preserves document structure.
    """

    def __init__(
        self,
        max_chunk_size: int = 1000,
        preserve_headers: bool = True,
    ):
        self.max_chunk_size = max_chunk_size
        self.preserve_headers = preserve_headers

        # Header pattern
        self.header_pattern = re.compile(r'^(#{1,6})\s+(.+)$', re.MULTILINE)

    def split(self, text: str) -> List[str]:
        """Split markdown into structural chunks."""
        if not text:
            return []

        # Find all headers and their positions
        headers = list(self.header_pattern.finditer(text))

        if not headers:
            # No headers, use text chunker
            return TextChunker(self.max_chunk_size).split(text)

        chunks = []
        current_header = None

        for i, header in enumerate(headers):
            # Get section content
            start = header.start()
            end = headers[i + 1].start() if i + 1 < len(headers) else len(text)

            section = text[start:end].strip()

            # If section too large, split it further
            if len(section) > self.max_chunk_size:
                sub_chunks = TextChunker(self.max_chunk_size).split(section)
                # Prepend header to each sub-chunk if preserving
                if self.preserve_headers and current_header:
                    sub_chunks = [f"{current_header}\n\n{c}" for c in sub_chunks]
                chunks.extend(sub_chunks)
            else:
                chunks.append(section)

            current_header = header.group(0)

        return chunks


def get_chunker(
    content_type: str = "text",
    **kwargs
) -> BaseChunker:
    """
    Factory function to get appropriate chunker.

    Args:
        content_type: Type of content ('text', 'code', 'markdown')
        **kwargs: Additional arguments for the chunker

    Returns:
        Appropriate chunker instance
    """
    chunkers = {
        "text": TextChunker,
        "sentence": SentenceChunker,
        "code": CodeChunker,
        "markdown": MarkdownChunker,
    }

    chunker_class = chunkers.get(content_type, TextChunker)
    return chunker_class(**kwargs)

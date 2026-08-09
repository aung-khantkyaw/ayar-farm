from typing import List, Dict, Any
import re

class TextChunker:
    """Chunk text into smaller pieces for vectorization"""
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def chunk_text(self, text: str, metadata: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Chunk text into smaller pieces with overlap"""
        if not text or not text.strip():
            return []
        
        # Clean text
        text = self._clean_text(text)
        
        # Split into sentences first
        sentences = self._split_into_sentences(text)
        
        # Group sentences into chunks
        chunks = []
        current_chunk = ""
        chunk_index = 0
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) <= self.chunk_size:
                current_chunk += " " + sentence if current_chunk else sentence
            else:
                if current_chunk:
                    chunks.append({
                        'text': current_chunk.strip(),
                        'chunk_index': chunk_index,
                        'metadata': metadata or {}
                    })
                    chunk_index += 1
                
                # Start new chunk with overlap
                current_chunk = self._get_overlap_text(current_chunk) + " " + sentence
        
        # Add last chunk
        if current_chunk.strip():
            chunks.append({
                'text': current_chunk.strip(),
                'chunk_index': chunk_index,
                'metadata': metadata or {}
            })
        
        return chunks
    
    def chunk_structured_content(
        self,
        content: List[Dict[str, Any]],
        source_metadata: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Chunk structured content (text, tables, images)"""
        chunks = []
        global_index = 0
        
        for item in content:
            content_type = item.get('type', 'text')
            content_data = item.get('data', '')
            
            if content_type == 'text':
                text_chunks = self.chunk_text(content_data, {
                    **(source_metadata or {}),
                    'content_type': 'text',
                    'source_index': item.get('index', 0)
                })
                for chunk in text_chunks:
                    chunk['chunk_index'] = global_index
                    chunks.append(chunk)
                    global_index += 1
            
            elif content_type == 'table':
                # Convert table to text representation
                table_text = self._table_to_text(content_data)
                table_chunks = self.chunk_text(table_text, {
                    **(source_metadata or {}),
                    'content_type': 'table',
                    'source_index': item.get('index', 0)
                })
                for chunk in table_chunks:
                    chunk['chunk_index'] = global_index
                    chunks.append(chunk)
                    global_index += 1
            
            elif content_type == 'image':
                # For images, we'll use the description/OCR text
                image_text = item.get('description', '') or item.get('ocr_text', '')
                if image_text:
                    image_chunks = self.chunk_text(image_text, {
                        **(source_metadata or {}),
                        'content_type': 'image',
                        'source_index': item.get('index', 0)
                    })
                    for chunk in image_chunks:
                        chunk['chunk_index'] = global_index
                        chunks.append(chunk)
                        global_index += 1
        
        return chunks
    
    def _clean_text(self, text: str) -> str:
        """Clean text by removing extra whitespace"""
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        return text
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting - can be improved with NLP libraries
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _get_overlap_text(self, text: str) -> str:
        """Get overlap text from previous chunk"""
        words = text.split()
        overlap_words = words[-self.chunk_overlap:] if len(words) > self.chunk_overlap else words
        return ' '.join(overlap_words)
    
    def _table_to_text(self, table_data: Any) -> str:
        """Convert table data to text representation"""
        if isinstance(table_data, list):
            # Assume table_data is a list of rows
            text_parts = []
            for row in table_data:
                if isinstance(row, list):
                    text_parts.append(' | '.join(str(cell) for cell in row))
                else:
                    text_parts.append(str(row))
            return '\n'.join(text_parts)
        elif isinstance(table_data, dict):
            # Assume table_data has headers and rows
            headers = table_data.get('headers', [])
            rows = table_data.get('rows', [])
            text_parts = [' | '.join(str(h) for h in headers)]
            for row in rows:
                text_parts.append(' | '.join(str(cell) for cell in row))
            return '\n'.join(text_parts)
        else:
            return str(table_data)

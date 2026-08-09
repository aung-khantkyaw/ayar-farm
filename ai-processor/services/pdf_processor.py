import requests
import io
from typing import List, Dict, Any, Optional
import tempfile
import os

class PDFProcessor:
    """Process PDF files from Cloudinary URLs"""
    
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
    
    def download_pdf(self, pdf_url: str) -> Optional[bytes]:
        """Download PDF from Cloudinary URL"""
        try:
            response = requests.get(pdf_url, timeout=30)
            response.raise_for_status()
            return response.content
        except Exception as e:
            print(f"❌ Failed to download PDF from {pdf_url}: {e}")
            return None
    
    def process_pdf(self, pdf_url: str, metadata: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Process PDF and extract structured content"""
        pdf_content = self.download_pdf(pdf_url)
        if not pdf_content:
            return []
        
        # Save to temp file
        temp_path = os.path.join(self.temp_dir, f'temp_{os.urandom(8).hex()}.pdf')
        try:
            with open(temp_path, 'wb') as f:
                f.write(pdf_content)
            
            # Extract content
            content = []
            
            # Extract text
            text_content = self._extract_text(temp_path)
            if text_content:
                content.append({
                    'type': 'text',
                    'data': text_content,
                    'index': len(content)
                })
            
            # Extract tables (if camelot is available)
            try:
                tables = self._extract_tables(temp_path)
                for i, table in enumerate(tables):
                    content.append({
                        'type': 'table',
                        'data': table,
                        'index': len(content)
                    })
            except ImportError:
                print("⚠️  camelot not available, skipping table extraction")
            except Exception as e:
                print(f"⚠️  Table extraction failed: {e}")

            # Extract images (if pdf2image is available)
            # Temporarily disabled - requires poppler in PATH
            # try:
            #     images = self._extract_images(temp_path)
            #     for i, image_data in enumerate(images):
            #         content.append({
            #             'type': 'image',
            #             'data': image_data,
            #             'index': len(content)
            #         })
            # except ImportError:
            #     print("⚠️  pdf2image not available, skipping image extraction")
            # except Exception as e:
            #     print(f"⚠️  Image extraction failed: {e}")

            return content
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    def _extract_text(self, pdf_path: str) -> str:
        """Extract text from PDF using pdfplumber"""
        try:
            import pdfplumber
            text_parts = []
            
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
            
            return '\n\n'.join(text_parts)
        except ImportError:
            print("⚠️  pdfplumber not available, using basic text extraction")
            return self._extract_text_basic(pdf_path)
        except Exception as e:
            print(f"❌ Text extraction failed: {e}")
            return ""
    
    def _extract_text_basic(self, pdf_path: str) -> str:
        """Basic text extraction fallback using PyPDF2"""
        try:
            import PyPDF2
            text_parts = []
            
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    text_parts.append(page.extract_text())
            
            return '\n\n'.join(text_parts)
        except Exception as e:
            print(f"❌ Basic text extraction failed: {e}")
            return ""
    
    def _extract_tables(self, pdf_path: str) -> List[List[List[str]]]:
        """Extract tables from PDF using camelot"""
        try:
            import camelot
            tables = camelot.read_pdf(pdf_path, pages='all')
            return [table.df.values.tolist() for table in tables]
        except Exception as e:
            print(f"❌ Table extraction failed: {e}")
            return []
    
    def _extract_images(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract images from PDF using pdf2image and OCR"""
        try:
            from pdf2image import convert_from_path
            
            images = []
            pages = convert_from_path(pdf_path)
            
            for i, page_image in enumerate(pages):
                # Try OCR if tesseract is available
                try:
                    import pytesseract
                    ocr_text = pytesseract.image_to_string(page_image)
                    if ocr_text.strip():
                        images.append({
                            'page_number': i + 1,
                            'ocr_text': ocr_text,
                            'description': f'Page {i + 1} image content'
                        })
                except ImportError:
                    print("⚠️  pytesseract not available, skipping OCR")
                    images.append({
                        'page_number': i + 1,
                        'description': f'Page {i + 1} image (OCR not available)'
                    })
            
            return images
        except Exception as e:
            print(f"❌ Image extraction failed: {e}")
            return []

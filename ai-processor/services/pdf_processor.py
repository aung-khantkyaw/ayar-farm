import requests
import io
from typing import List, Dict, Any, Optional
import tempfile
import os
import pymupdf

class PDFProcessor:
    """Process PDF files from Cloudinary URLs"""
    
    def __init__(self):
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        # Create temp directory in ai-processor folder
        self.temp_dir = os.path.join(script_dir, '..', 'temp')
        # Ensure the directory exists
        os.makedirs(self.temp_dir, exist_ok=True)
    
    def cleanup_temp_files(self, max_age_hours: int = 1) -> int:
        """Clean up old temp files in the temp directory
        Returns the number of files deleted
        """
        import time
        import gc
        
        deleted_count = 0
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        try:
            for filename in os.listdir(self.temp_dir):
                if filename.startswith('temp_') or filename.startswith('temp_') and '.stale.' in filename:
                    file_path = os.path.join(self.temp_dir, filename)
                    try:
                        file_age = current_time - os.path.getmtime(file_path)
                        if file_age > max_age_seconds:
                            # Force GC before attempting deletion
                            gc.collect()
                            os.unlink(file_path)
                            deleted_count += 1
                            print(f"🗑️  Cleaned up old temp file: {filename}")
                    except PermissionError:
                        # Skip files that are still in use
                        continue
                    except Exception as e:
                        print(f"⚠️  Could not clean up {filename}: {e}")
        except Exception as e:
            print(f"❌ Error during temp cleanup: {e}")
        
        return deleted_count
    
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
        
        # Create temp file
        temp_file = None
        temp_path = None
        try:
            temp_file = tempfile.NamedTemporaryFile(
                dir=self.temp_dir,
                suffix='.pdf',
                prefix='temp_',
                delete=False
            )
            temp_path = temp_file.name
            temp_file.write(pdf_content)
            temp_file.close()
            
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
            # Clean up temp file with robust retry mechanism
            if temp_path and os.path.exists(temp_path):
                import time
                import gc
                
                # Force garbage collection to release file handles
                gc.collect()
                
                max_retries = 10
                for attempt in range(max_retries):
                    try:
                        os.unlink(temp_path)
                        break
                    except PermissionError:
                        if attempt < max_retries - 1:
                            time.sleep(0.5)  # Wait 500ms before retry
                            gc.collect()  # Force GC again on each retry
                        else:
                            # Final fallback: rename to .stale for later cleanup
                            try:
                                stale_path = temp_path.replace('.pdf', '.stale.pdf')
                                os.rename(temp_path, stale_path)
                                print(f"⚠️  Renamed locked file for later cleanup: {stale_path}")
                            except Exception as rename_error:
                                print(f"⚠️  Could not delete or rename temp file: {temp_path}, error: {e}")
                    except Exception as e:
                        print(f"⚠️  Could not delete temp file: {temp_path}, error: {e}")
                        break
    
    def _extract_text(self, pdf_path: str) -> str:
        """Extract text from PDF using PyMuPDF - cross-platform compatible"""
        try:
            doc = pymupdf.open(pdf_path)
            text_parts = []
            
            for page in doc:
                page_text = page.get_text()
                if page_text.strip():
                    text_parts.append(page_text)
            
            doc.close()
            return '\n\n'.join(text_parts)
        except ImportError:
            print("⚠️  PyMuPDF not available, using basic text extraction")
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

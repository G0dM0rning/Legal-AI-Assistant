import os
import asyncio
import sys
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import hashlib
import logging
from pathlib import Path
import re
import traceback
import warnings
import time

# Third-party imports
from langchain_community.document_loaders import PyPDFLoader, UnstructuredFileLoader, Docx2txtLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import faiss
from urllib3.exceptions import HTTPError
import requests
from requests.exceptions import RequestException
import json
import pandas as pd
from app.config import ai_provider
from fastapi.concurrency import run_in_threadpool

# Configure CPU settings for FAISS
os.environ.update({
    'OMP_NUM_THREADS': '4',
    'TOKENIZERS_PARALLELISM': 'false'
})
faiss.omp_set_num_threads(4)

# Configure logging
BASE_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = BASE_DIR / "data" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "document_processing.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(str(LOG_FILE), encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ========================
# Enhanced Text Processing Utilities
# ========================

class TextPreprocessor:
    """Enhanced text preprocessing for legal documents"""
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text content"""
        if not text or not text.strip():
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Fix common encoding issues
        text = text.replace('\uf0b7', '•').replace('\u2013', '-').replace('\u2014', '--')
        text = text.replace('\u2018', "'").replace('\u2019', "'").replace('\u201c', '"').replace('\u201d', '"')
        
        # Remove unwanted characters but keep legal symbols
        text = re.sub(r'[^\w\s\-\.\,\;\:\?\!\(\)\[\]\{\}\§\@\#\$\%\&\*\•\—\–\']', '', text)
        
        return text.strip()
    
    @staticmethod
    def is_meaningful_text(text: str, min_words: int = 5) -> bool:
        """Check if text contains meaningful content"""
        if not text or len(text.strip()) < 20:
            return False
        
        words = text.split()
        if len(words) < min_words:
            return False
        
        # Check if it's mostly special characters or numbers
        alpha_count = sum(1 for char in text if char.isalpha())
        if alpha_count < len(text) * 0.3:  # Less than 30% alphabetic characters
            return False
            
        return True
    
    @staticmethod
    def extract_document_metadata(text: str) -> Dict[str, Any]:
        """Extract comprehensive metadata from document content"""
        metadata = {}
        
        # Try to identify document type
        text_lower = text.lower()
        if re.search(r'(constitution|article|section|chapter)', text_lower):
            metadata['document_category'] = 'legal_code'
            metadata['document_type'] = 'Constitution/Legal Code'
        elif re.search(r'(act|bill|law|statute)', text_lower):
            metadata['document_category'] = 'legislation'
            metadata['document_type'] = 'Legislation/Act'
        elif re.search(r'(contract|agreement|treaty)', text_lower):
            metadata['document_category'] = 'contract'
            metadata['document_type'] = 'Contract/Agreement'
        elif re.search(r'(judgment|ruling|verdict|court)', text_lower):
            metadata['document_category'] = 'judicial'
            metadata['document_type'] = 'Judicial Decision'
        elif re.search(r'(regulation|rule|guideline)', text_lower):
            metadata['document_category'] = 'regulation'
            metadata['document_type'] = 'Regulation/Guideline'
        else:
            metadata['document_category'] = 'general'
            metadata['document_type'] = 'Legal Document'
        
        # Estimate complexity
        words = text.split()
        avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
        metadata['complexity'] = 'high' if avg_word_length > 6 else 'medium' if avg_word_length > 5 else 'low'
        
        # Extract legal references and citations
        metadata.update(TextPreprocessor._extract_legal_references(text))
        
        # Extract key topics
        metadata['topics'] = TextPreprocessor._extract_topics(text)
        
        return metadata
    
    @staticmethod
    def _extract_legal_references(text: str) -> Dict[str, Any]:
        """Extract legal references, citations, and section numbers"""
        references = {
            'has_versions': False,
            'has_sections': False,
            'has_articles': False,
            'has_clauses': False,
            'legal_citations': []
        }
        
        # Version numbers
        if re.search(r'\b\d+\.\d+\.\d+\b', text):
            references['has_versions'] = True
        
        # Section symbols
        section_matches = re.findall(r'§\s*(\d+[A-Z]*)', text)
        if section_matches:
            references['has_sections'] = True
            references['sections'] = list(set(section_matches))
        
        # Articles
        article_matches = re.findall(r'Article\s+([IVXLCDM]+|\d+)', text, re.IGNORECASE)
        if article_matches:
            references['has_articles'] = True
            references['articles'] = list(set(article_matches))
        
        # Clauses
        clause_matches = re.findall(r'clause\s+(\d+)', text, re.IGNORECASE)
        if clause_matches:
            references['has_clauses'] = True
            references['clauses'] = list(set(clause_matches))
        
        # Legal citations (flexible for US and Pakistan)
        citation_patterns = [
            r'\b\d+\s+U\.?S\.?C\.?\s+§?\s*\d+',
            r'\b\d+\s+S\.?Ct\.?\s+\d+',
            r'\b\d+\s+F\.?\d+d\s+\d+',
            # Pakistani Citations (Flexible Year & Journal positions)
            r'\b(?:PLD|SCMR|CLC|PCrLJ|YLR|PLC|PTD|CLD)\s+\d{4}\s+[A-Z][a-zA-Z\s]+\d+\b',
            r'\b\d{4}\s+(?:PLD|SCMR|CLC|PCrLJ|YLR|PLC|PTD|CLD)\s+[A-Z][a-zA-Z\s]+\d+\b',
            r'\b\d{4}\s+(?:PLD|SCMR|CLC|PCrLJ|YLR|PLC|PTD|CLD)\s+\d+\b',
            r'\b(?:PLD|SCMR|CLC|PCrLJ|YLR|PLC|PTD|CLD)\s+\d{4}\s+\d+\b',
        ]
        
        for pattern in citation_patterns:
            citations = re.findall(pattern, text)
            if citations:
                references['legal_citations'].extend(citations)
        
        return references
    
    @staticmethod
    def _extract_topics(text: str, max_topics: int = 5) -> List[str]:
        """Extract key legal topics from text"""
        text_lower = text.lower()
        legal_topics = {
            'contract_law': ['contract', 'agreement', 'breach', 'obligation', 'consideration'],
            'constitutional_law': ['constitution', 'amendment', 'rights', 'freedom', 'liberty'],
            'criminal_law': ['crime', 'criminal', 'penalty', 'offense', 'sentencing'],
            'civil_law': ['civil', 'lawsuit', 'plaintiff', 'defendant', 'damages'],
            'property_law': ['property', 'ownership', 'title', 'estate', 'lease'],
            'corporate_law': ['corporation', 'company', 'shareholder', 'director', 'board'],
            'tax_law': ['tax', 'revenue', 'deduction', 'exemption', 'irs'],
            'family_law': ['marriage', 'divorce', 'custody', 'child', 'support'],
            'intellectual_property': ['patent', 'copyright', 'trademark', 'intellectual', 'property'],
            'employment_law': ['employment', 'employee', 'employer', 'wage', 'discrimination']
        }
        
        found_topics = []
        for topic, keywords in legal_topics.items():
            if any(keyword in text_lower for keyword in keywords):
                found_topics.append(topic.replace('_', ' ').title())
        
        return found_topics[:max_topics]

    @staticmethod
    def extract_legal_metadata_with_llm(text: str) -> Dict[str, Any]:
        """Use LLM to extract professional legal metadata from document sample"""
        from app.config import ai_provider
        
        if not ai_provider.llm:
            return {}
            
        prompt = f"""
        Analyze the following legal document text and extract key metadata in JSON format.
        Focus on Pakistani legal context if applicable.
        
        Fields to extract:
        - court_name: The specific court (e.g., Supreme Court of Pakistan, High Court of Sindh)
        - case_id: The formal case number or citation index
        - parties: {{ "petitioner": "...", "respondent": "..." }}
        - decision_date: The date of the judgment/ordinance
        - legal_provisions: List of specific Articles, Sections, or Clauses referenced
        - core_subject: One line summary of the legal issue (e.g., Criminal Appeal, Constitutional Petition)
        
        Text Sample:
        {text[:4000]}
        
        Response must be ONLY valid JSON.
        """
        
        try:
            response = ai_provider.call_llm(prompt)
            content = response.content if hasattr(response, 'content') else str(response)
            
            # Extract JSON from response (handling potential markdown blocks)
            json_match = re.search(r'```json\n(.*?)\n```', content, re.DOTALL)
            if json_match:
                content = json_match.group(1)
            else:
                # Try simple brace match
                json_match = re.search(r'(\{.*\})', content, re.DOTALL)
                if json_match:
                    content = json_match.group(1)
            
            extracted = json.loads(content)
            subject = extracted.get('core_subject') or extracted.get('court_name') or 'General'
            logger.info(f"[SUCCESS] LLM Metadata Extraction successful: {subject}")
            return extracted
        except Exception as e:
            logger.warning(f"[WARN] LLM Metadata Extraction failed: {e}")
            return {}

class LegalAwareTextSplitter(RecursiveCharacterTextSplitter):
    """Enhanced text splitter optimized for legal documents"""
    
    def __init__(self, **kwargs):
        # Legal document specific separators
        legal_separators = [
            r"\nCHAPTER\s+[IVXLCDM]+\b",
            r"\nPART\s+[IVXLCDM]+\b", 
            r"\nARTICLE\s+\d+\b",
            r"\nSECTION\s+\d+",
            r"\nSUBSECTION\s+\d+",
            r"\nCLAUSE\s+\d+\b",
            r"\n§\s*\d+",  # Section symbol
            r"\n\d+\.\s",  # Numbered points
            r"\n\([a-z]\)",  # Lettered subpoints
            "\n\n",
            "\n",
            " ",
            "",
        ]
        
        # Extract known args to avoid multiple values error in super().__init__
        chunk_size = kwargs.pop('chunk_size', 1000)
        chunk_overlap = kwargs.pop('chunk_overlap', 200)
        
        super().__init__(
            separators=legal_separators,
            keep_separator=True,
            is_separator_regex=True,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            **kwargs
        )
        self.preprocessor = TextPreprocessor()

    def split_text(self, text: str) -> List[str]:
        """Split text with preprocessing"""
        cleaned_text = self.preprocessor.clean_text(text)
        if not self.preprocessor.is_meaningful_text(cleaned_text):
            return []
        return super().split_text(cleaned_text)

# ========================
# Enhanced Document Processing
# ========================

class DocumentProcessor:
    """Main document processor with comprehensive error handling"""
    
    def __init__(self):
        self.supported_formats = {
            '.pdf': self._load_pdf,
            '.docx': self._load_docx,
            '.doc': self._load_docx,
            '.txt': self._load_text,
            '.md': self._load_text,
            '.json': self._load_json,
            '.parquet': self._load_parquet,
        }
        self.preprocessor = TextPreprocessor()

    async def ingest_document_async(self, *args, **kwargs):
        """Proxy to main async ingestion pipeline"""
        return await ingest_document_async(*args, **kwargs)

    async def bulk_ingest_documents_async(self, *args, **kwargs):
        """Proxy to bulk async ingestion pipeline"""
        return await bulk_ingest_documents_async(*args, **kwargs)
    
    def _load_pdf(self, file_path: str) -> List[Document]:
        """Load PDF documents with enhanced error handling and professional OCR fallback"""
        try:
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            
            # Check if text extraction actually yielded content (detect scanned PDFs)
            total_text = "".join([doc.page_content for doc in documents]).strip()
            if len(total_text) < 100:  # Suspiciously low text for a legal PDF
                logger.warning(f"⚠️ PDF {file_path} contains very little text. Attempting OCR fallback...")
                return self._load_pdf_ocr(file_path)
                
            logger.info(f"Loaded {len(documents)} pages from PDF via standard loader")
            return documents
        except Exception as e:
            logger.error(f"Standard PDF loading failed: {e}")
            return self._load_pdf_ocr(file_path)

    def _load_pdf_ocr(self, file_path: str) -> List[Document]:
        """Professional OCR fallback for scanned legal documents with diagnostic handling"""
        try:
            # Check for core OCR dependencies
            try:
                import pytesseract
                from pdf2image import convert_from_path
                from PIL import Image
            except ImportError as ie:
                logger.error(f"[DEPENDENCY] OCR failed: {ie}. Requirements: pip install pytesseract pdf2image pillow")
                raise RuntimeError(f"OCR dependencies missing: {ie}. Please install pytesseract and pdf2image.")

            logger.info(f"🔍 Running OCR on: {file_path}")
            
            # Check if tesseract is actually in PATH, or try common Windows locations
            try:
                pytesseract.get_tesseract_version()
            except Exception:
                # Professional Troubleshooting: Try common Windows installation path
                win_tess = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
                if os.path.exists(win_tess):
                    pytesseract.pytesseract.tesseract_cmd = win_tess
                    logger.info(f"✅ Found Tesseract at: {win_tess}")
                    try:
                        pytesseract.get_tesseract_version()
                    except Exception as final_tess_err:
                        logger.error(f"[SYSTEM] Tesseract exists at {win_tess} but is unusable: {final_tess_err}")
                        raise RuntimeError(f"Tesseract binary at {win_tess} failed: {final_tess_err}")
                else:
                    logger.error("[SYSTEM] Tesseract-OCR not found in system PATH or Program Files.")
                    instructions = (
                        "Tesseract-OCR engine not found. To fix this on Windows:\n"
                        "1. Run: choco install tesseract-ocr poppler -y (requires admin)\n"
                        "2. OR Download from: https://github.com/UB-Mannheim/tesseract/wiki\n"
                        "3. Add to PATH: C:\\Program Files\\Tesseract-OCR"
                    )
                    raise RuntimeError(instructions)

            images = convert_from_path(file_path)
            documents = []
            
            for i, image in enumerate(images):
                text = pytesseract.image_to_string(image)
                documents.append(Document(
                    page_content=text,
                    metadata={"source": file_path, "page": i, "method": "ocr"}
                ))
            
            logger.info(f"✅ OCR complete. Extracted {len(documents)} pages.")
            return documents
            
        except Exception as ocr_error:
            logger.error(f"OCR Fallback failed: {ocr_error}")
            
            # Final attempt: try "unstructured" in FAST mode (bypasses heavy PDF parsing and OCR)
            try:
                logger.info(f"Final fallback: Trying Unstructured 'fast' mode for {file_path}")
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    loader = UnstructuredFileLoader(file_path, strategy="fast")
                    docs = loader.load()
                if not docs:
                    raise ValueError("No content extracted even in fast Unstructured mode.")
                return docs
            except Exception as final_e:
                # Last resort: try standard PyPDF one more time, catching the specific encoding error
                try:
                    logger.info("Last resort: Standard PyPDF parse...")
                    loader = PyPDFLoader(file_path)
                    return loader.load()
                except (LookupError, Exception) as pypdf_err:
                    error_msg = f"PDF processing failed after all fallbacks. Error: {str(ocr_error)}. Enc error: {str(pypdf_err)}"
                    logger.error(error_msg)
                    raise RuntimeError(error_msg)
    
    def _load_docx(self, file_path: str) -> List[Document]:
        """Load DOCX documents"""
        try:
            loader = Docx2txtLoader(file_path)
            documents = loader.load()
            logger.info(f"Loaded DOCX document with {len(documents)} sections")
            return documents
        except Exception as e:
            logger.error(f"DOCX loading failed: {e}")
            # Fallback to unstructured loader
            try:
                loader = UnstructuredFileLoader(file_path)
                documents = loader.load()
                logger.info(f"Fallback loader loaded DOCX document")
                return documents
            except Exception as fallback_error:
                logger.error(f"DOCX fallback loading also failed: {fallback_error}")
                raise RuntimeError(f"Failed to load DOCX: {str(e)}")
    
    def _load_text(self, file_path: str) -> List[Document]:
        """Load text documents with multiple encoding fallbacks"""
        try:
            # Try utf-8 first
            loader = TextLoader(file_path, encoding='utf-8')
            return loader.load()
        except UnicodeDecodeError:
            # Try common legal document encodings
            for encoding in ['latin-1', 'cp1252', 'iso-8859-1']:
                try:
                    loader = TextLoader(file_path, encoding=encoding)
                    return loader.load()
                except Exception:
                    continue
            logger.error(f"[ERROR] Text load failed for {file_path}: Encoding mismatch")
            raise RuntimeError(f"Could not decode text file {file_path} with supported encodings.")
        except Exception as e:
            logger.error(f"[ERROR] Text load failed for {file_path}: {str(e)}")
            raise

    def _load_json(self, file_path: str) -> List[Document]:
        """Load JSON documents and extract all text content recursively"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            extracted_texts = []
            
            def recurse_json(obj):
                if isinstance(obj, str):
                    if len(obj.strip()) > 5:
                        extracted_texts.append(obj.strip())
                elif isinstance(obj, list):
                    for item in obj:
                        recurse_json(item)
                elif isinstance(obj, dict):
                    for key, value in obj.items():
                        # Also include keys if they look like legal field names
                        if isinstance(key, str) and len(key) > 2:
                            # If the key is a meaningful legal label, keep it
                            if any(x in key.lower() for x in ['title', 'case', 'law', 'section', 'article', 'date']):
                                extracted_texts.append(f"{key.replace('_', ' ').title()}:")
                        recurse_json(value)
            
            recurse_json(data)
            
            full_text = "\n\n".join(extracted_texts)
            
            if not full_text.strip():
                logger.warning(f"[WARN] JSON file {file_path} yielded no text content.")
                return []
                
            return [Document(page_content=full_text, metadata={"source": file_path, "format": "json"})]
            
        except Exception as e:
            logger.error(f"[ERROR] JSON load failed for {file_path}: {str(e)}")
            raise

    def _load_parquet(self, file_path: str) -> List[Document]:
        """Load Parquet documents and extract all text content from rows"""
        try:
            logger.info(f"[PARQUET] Loading: {file_path}")
            df = pd.read_parquet(file_path)
            
            documents = []
            
            # Identify text columns (usually 'text', 'content', 'body', or just strings)
            text_columns = [col for col in df.columns if df[col].dtype == 'object' or str(df[col].dtype) == 'string']
            
            if not text_columns:
                logger.warning(f"[WARN] No text columns found in {file_path}. Using all columns.")
                text_columns = df.columns.tolist()
            
            for index, row in df.iterrows():
                # Combine all text columns into a single content block for this row
                content_parts = []
                for col in text_columns:
                    val = row[col]
                    # Safely check for nulls/empty values even if the cell contains a list or array
                    is_valid = False
                    try:
                        if isinstance(val, (list, pd.Series)) or hasattr(val, '__len__') and not isinstance(val, (str, bytes)):
                            is_valid = len(val) > 0
                        else:
                            is_valid = pd.notna(val) and str(val).strip() != ""
                    except Exception:
                        is_valid = False

                    if is_valid:
                        content_parts.append(f"{col}: {val}")
                
                content = "\n".join(content_parts)
                
                # Check if it has enough content to be meaningful
                if len(content.strip()) > 20:
                    metadata = {
                        "source": file_path,
                        "row_index": index,
                        "file_type": "parquet"
                    }
                    # Try to extract more metadata from the content
                    metadata.update(TextPreprocessor.extract_document_metadata(content))
                    
                    documents.append(Document(page_content=content, metadata=metadata))
            
            logger.info(f"[SUCCESS] Extracted {len(documents)} document rows from Parquet.")
            return documents
            
        except Exception as e:
            logger.error(f"[ERROR] Loading Parquet {file_path}: {e}")
            raise e
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((HTTPError, ConnectionError, TimeoutError))
    )
    def validate_file(self, file_path: str, max_size_mb: int = 100) -> Dict[str, Any]:
        """Comprehensive file validation with detailed diagnostics"""
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
            
            file_size = os.path.getsize(file_path)
            max_size = max_size_mb * 1024 * 1024
            
            # Check file extension
            file_ext = Path(file_path).suffix.lower()

            if file_size == 0:
                logger.warning(f"[WARN] File {file_path} is empty (0 bytes)")
                return {
                    "valid": False,
                    "reason": "empty",
                    "file_size": 0,
                    "extension": file_ext,
                    "filename": Path(file_path).name
                }
                
            if file_size > max_size:
                raise ValueError(f"File size {file_size/1024/1024:.2f}MB exceeds {max_size_mb}MB limit")
            
            # Check file extension
            if file_ext not in self.supported_formats:
                raise ValueError(f"Unsupported file format: {file_ext}. Supported: {list(self.supported_formats.keys())}")
            
            # Calculate checksum
            hash_sha256 = hashlib.sha256()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            checksum = hash_sha256.hexdigest()
            
            validation_result = {
                "valid": True,
                "file_size": file_size,
                "file_size_mb": file_size / 1024 / 1024,
                "checksum": checksum,
                "extension": file_ext,
                "filename": Path(file_path).name
            }
            
            logger.info(f"[SUCCESS] File validated: {file_path} (Size: {validation_result['file_size_mb']:.2f}MB, Checksum: {checksum[:16]}...)")
            return validation_result
            
        except Exception as e:
            if isinstance(e, ValueError) and "File is empty" in str(e):
                 # Handle legacy re-raises if any
                 return {"valid": False, "reason": "empty", "filename": Path(file_path).name}
            logger.error(f"[ERROR] File validation failed for {file_path}: {str(e)}")
            raise
    
    def load_document(self, file_path: str) -> List[Document]:
        """Load document with format-specific loader"""
        file_ext = Path(file_path).suffix.lower()
        
        if file_ext not in self.supported_formats:
            raise ValueError(f"Unsupported file format: {file_ext}")
        
        loader_func = self.supported_formats[file_ext]
        return loader_func(file_path)
    
    async def process_document(self, file_path: str, doc_type: str = "General Legal Document", 
                        source_name: str = "Unknown Source") -> Tuple[List[Document], Dict[str, Any]]:
        """Process document with comprehensive preprocessing and splitting"""
        start_time = datetime.utcnow()
        
        try:
            # Validate file first
            validation_info = self.validate_file(file_path)
            
            if not validation_info.get("valid", False):
                if validation_info.get("reason") == "empty":
                    logger.warning(f"[SKIP] Skipping processing for empty file: {file_path}")
                    return [], {
                        "status": "skipped",
                        "reason": "empty",
                        "message": "File is empty and contained no text.",
                        "processing_time_seconds": 0
                    }
                raise ValueError(validation_info.get("reason", "Unknown validation error"))
            
            logger.info(f"[PROCESS] Starting document processing: {file_path}")
            
            # Load document
            raw_documents = self.load_document(file_path)
            if not raw_documents:
                logger.warning(f"No content extracted from {file_path}")
                return [], {"status": "empty", "error": "No content extracted"}
            logger.info(f"[LOAD] Loaded {len(raw_documents)} raw document sections")
            
            # Choose appropriate splitter
            if any(keyword in doc_type.lower() for keyword in ['constitution', 'code', 'law', 'act']):
                splitter = LegalAwareTextSplitter(
                    chunk_size=1200,
                    chunk_overlap=250,
                    add_start_index=True
                )
                logger.debug("Using LegalAwareTextSplitter for legal document")
            else:
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000,
                    chunk_overlap=200,
                    separators=["\n\n", "\n", " ", ""],
                    keep_separator=True,
                    add_start_index=True
                )
                logger.debug("Using RecursiveCharacterTextSplitter for general document")
            
            chunks = splitter.split_documents(raw_documents)
            
            # [ASYNC OPTIMIZATION] Step 4: Parallelize LLM-heavy tasks
            # We run summary generation and metadata extraction in parallel
            full_text_sample = "".join([d.page_content for d in raw_documents[:10]])
            
            summary_task = asyncio.create_task(ai_provider.generate_doc_summary_async(full_text_sample))
            metadata_task = asyncio.create_task(self._extract_document_level_metadata_async(full_text_sample, doc_type))
            
            global_summary, document_level_metadata = await asyncio.gather(summary_task, metadata_task)
            
            logger.info(f"[CONTEXT] Generated Global Context: {global_summary[:100]}...")
            
            # Step 5: Process chunks with Parent Mapping (Optimized Metadata)
            meaningful_chunks = []
            for i, chunk in enumerate(chunks):
                if self.preprocessor.is_meaningful_text(chunk.page_content):
                    # Enhance metadata (Lightweight)
                    # Parent context is now retrieved dynamically by ID to save space
                    self._enhance_chunk_metadata(chunk, i, validation_info, document_level_metadata, file_path)
                    
                    # Contextual Retrieval: Prepend global summary to content
                    # [PRO-LEVEL RAG 2.0]
                    context_prefix = f"[Document Context: {global_summary}]\n\n"
                    chunk.page_content = context_prefix + chunk.page_content
                    
                    meaningful_chunks.append(chunk)

            processing_time = (datetime.utcnow() - start_time).total_seconds()
            logger.info(f"[SUCCESS] RAG 2.0 processing completed in {processing_time:.2f}s: {len(meaningful_chunks)} contextualized chunks")
            
            processing_info = {
                "processing_time_seconds": processing_time,
                "original_sections": len(raw_documents),
                "total_chunks_generated": len(chunks),
                "meaningful_chunks_kept": len(meaningful_chunks),
                "global_summary": global_summary,
                "status": "success"
            }
            
            return meaningful_chunks, processing_info
            
        except Exception as e:
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            logger.error(f"[ERROR] Document processing failed after {processing_time:.2f}s: {str(e)}", exc_info=True)
            raise RuntimeError(f"Document processing failed: {str(e)}")
    
    def _extract_document_level_metadata(self, raw_documents: List[Document], doc_type: str, source_name: str) -> Dict[str, Any]:
        """Extract comprehensive metadata at the document level"""
        if not raw_documents:
            return {}
        
        # Sample content from first few documents for analysis
        sample_content = " ".join([doc.page_content for doc in raw_documents[:3]])
        
        metadata = {
            "document_type": doc_type,
            "source": source_name,
            "total_pages": len(raw_documents),
            "extraction_time": datetime.utcnow().isoformat(),
        }
        
        # Add content-based metadata
        content_metadata = self.preprocessor.extract_document_metadata(sample_content)
        metadata.update(content_metadata)
        
        # Add LLM-powered metadata (Advanced RAG)
        llm_metadata = self.preprocessor.extract_legal_metadata_with_llm(sample_content)
        if llm_metadata:
            metadata.update(llm_metadata)
            # Override document_type if LLM found a better one
            if llm_metadata.get('core_subject'):
                metadata['document_type'] = f"{doc_type} ({llm_metadata['core_subject']})"
        
        return metadata
    
    async def _extract_document_level_metadata_async(self, sample_text: str, doc_type: str) -> Dict[str, Any]:
        """Extract high-level metadata (Async)"""
        # (Heuristic logic preserved)
        metadata = {
            "document_type": doc_type,
            "parties": {"petitioner": "Unknown", "respondent": "Unknown"},
            "decision_date": "Unknown",
            "court_name": "Pakistani Superior Court",
            "case_id": "Unknown"
        }
        
        # Async LLM call to extract metadata
        llm_metadata = await ai_provider.extract_metadata_async(sample_text[:3000])
        if llm_metadata:
            metadata.update(llm_metadata)
            if llm_metadata.get('core_subject'):
                metadata['document_type'] = f"{doc_type} ({llm_metadata['core_subject']})"
        
        return metadata
    
    def _enhance_chunk_metadata(self, chunk: Document, chunk_index: int, validation_info: Dict[str, Any], 
                               document_metadata: Dict[str, Any], file_path: str) -> None:
        """Enhance chunk metadata with efficient information"""
        # Base metadata (Omit redundant parent_context to save 90% memory)
        chunk_metadata = {
            "document_type": document_metadata.get("document_type", "Legal Document"),
            "title": Path(file_path).stem,
            "source": document_metadata.get("source", "Unknown Source"),
            "upload_time": datetime.utcnow().isoformat(),
            "checksum": validation_info["checksum"],
            "file_size": validation_info["file_size"],
            "file_extension": validation_info["extension"],
            
            # Chunk identification
            "chunk_id": f"{Path(file_path).stem}-{chunk_index:04d}",
            "chunk_index": chunk_index,
            "page": chunk.metadata.get("page", 1),
            
            # Content metrics
            "word_count": len(chunk.page_content.split()),
            "character_count": len(chunk.page_content),
            "content_preview": chunk.page_content[:150] + "..." if len(chunk.page_content) > 150 else chunk.page_content,
            
            # Document-level metadata
            "document_category": document_metadata.get("document_category", "general"),
            "complexity": document_metadata.get("complexity", "medium"),
            "topics": document_metadata.get("topics", []),
            
            # Professional Legal Metadata
            "court_name": document_metadata.get("court_name", "N/A"),
            "case_id": document_metadata.get("case_id", "N/A"),
            "petitioner": document_metadata.get("parties", {}).get("petitioner", "N/A"),
            "respondent": document_metadata.get("parties", {}).get("respondent", "N/A"),
            "decision_date": document_metadata.get("decision_date", "N/A"),
            "legal_provisions": document_metadata.get("legal_provisions", []),
        }
        
        # Add content-specific metadata
        content_specific_metadata = self.preprocessor.extract_document_metadata(chunk.page_content)
        chunk_metadata.update(content_specific_metadata)
        
        # Update chunk metadata
        chunk.metadata.update(chunk_metadata)

# ========================
# Vector Store Integration
# ========================

class VectorStoreManager:
    """Enhanced vector store management with robust error handling"""
    
    def __init__(self):
        self.batch_size = 50  # Balanced for Gemini rate limits and payload size

    async def add_documents_to_store_async(self, *args, **kwargs):
        """Ensure consistency in method naming"""
        return await self._add_documents_to_store_async_impl(*args, **kwargs)

    async def add_documents_to_store(self, *args, **kwargs):
        """Backward compatibility for sync-named but async-required calls"""
        return await self._add_documents_to_store_async_impl(*args, **kwargs)

    async def _add_documents_to_store_async_impl(self, documents: List[Document], document_id: Optional[str] = None, save_after: bool = True) -> Dict[str, Any]:
        """Add documents to vector store (Async version)"""
        start_time = datetime.utcnow()
        
        try:
            logger.info(f"[INDEX] Preparing to add {len(documents)} documents to vector store")
            from app.config import ai_provider, load_vector_store, save_vector_store
            
            # CPU-bound FAISS operations still run in threadpool to avoid blocking event loop
            store = await run_in_threadpool(load_vector_store)
            active_embedder = ai_provider.embedder
            provider_info = ai_provider.get_provider_info()
            
            # Process in batches
            total_batches = (len(documents) + self.batch_size - 1) // self.batch_size
            successful_batches, failed_batches, failed_batch_details = 0, 0, []
            
            for batch_idx in range(0, len(documents), self.batch_size):
                batch = documents[batch_idx:batch_idx + self.batch_size]
                batch_num = (batch_idx // self.batch_size) + 1
                
                if document_id:
                    batch_progress = 30 + int((batch_num / total_batches) * 60)
                    # Non-blocking progress update
                    await update_training_progress_async(document_id, batch_progress, f"Processing batch {batch_num}/{total_batches}...")

                try:
                    for doc in batch:
                        doc.metadata["embedder"] = ai_provider.embedder_type
                        doc.metadata["embedded_at"] = datetime.utcnow().isoformat()

                    if store is None:
                        store = await run_in_threadpool(FAISS.from_documents, batch, active_embedder)
                    else:
                        # Dimension Safety (Preserved)
                        # Dynamic Dimension Safety
                        existing_dim = ai_provider._get_existing_index_dimension()
                        
                        # Get actual dimension from current embedder
                        if hasattr(ai_provider.embedder, "target_dim"):
                            current_dim = ai_provider.embedder.target_dim
                        elif hasattr(ai_provider.embedder, "dimension"):
                            current_dim = ai_provider.embedder.dimension
                        elif hasattr(ai_provider.embedder, "native_dim"):
                            current_dim = ai_provider.embedder.native_dim
                        elif ai_provider.embedder_type == "gemini":
                            current_dim = 3072
                        else:
                            current_dim = 768 # Default for base models
                        
                        if existing_dim and existing_dim != current_dim:
                            logger.warning(f"[DIM] Index mismatch detected (Index: {existing_dim}, Current: {current_dim}). Attempting to proceed if embedder supports padding.")
                            if not hasattr(ai_provider.embedder, "_match_dimension"):
                                raise RuntimeError(f"Dimension mismatch: Index {existing_dim}, Current {current_dim}")
                        
                        await run_in_threadpool(store.add_documents, batch)
                    
                    successful_batches += 1
                    logger.info(f"[SUCCESS] Added batch {batch_num}/{total_batches} ({len(batch)} documents)")
                    
                except Exception as batch_error:
                    failed_batches += 1
                    error_details = {
                        'batch_number': batch_num,
                        'error': str(batch_error),
                        'error_type': type(batch_error).__name__,
                        'batch_size': len(batch)
                    }
                    failed_batch_details.append(error_details)
                    
                    logger.error(f"❌ Failed to add batch {batch_num}: {str(batch_error)}")
                    logger.error(f"📋 Batch error details: {error_details}")
                    
                    # Log full traceback for debugging
                    logger.error(f"🔍 Full error traceback for batch {batch_num}:")
                    logger.error(traceback.format_exc())
                    
                    # [PROFESSIONAL HYBRID FALLBACK]
                    # If Gemini pool is exhausted, switch to Local SentenceTransformers and CONTINUE
                    from app.config import ai_provider
                    if ai_provider.manager.quota_exhausted.get("gemini", False) and ai_provider.embedder_type == "gemini":
                        logger.warning(f"⚠️ [HYBRID FALLBACK] Gemini Exhausted at batch {batch_num}. Switching to Local SentenceTransformers (768-dim) to complete ingestion...")
                        
                        # Trigger provider re-initialization (skip_search=True ensures we don't clear the quota state)
                        ai_provider.initialize_providers(skip_search=True, clear_quota=False)
                        active_embedder = ai_provider.embedder
                        
                        if ai_provider.embedder_type == "gemini":
                            logger.error("🛑 FAILOVER ERROR: System tried to fallback but Gemini re-initialized despite quota. Forcing Local...")
                            from app.config import LocalSentenceTransformerEmbeddings
                            target_dim = ai_provider._get_existing_index_dimension() or 768
                            ai_provider.embedder = LocalSentenceTransformerEmbeddings(target_dim=target_dim)
                            ai_provider.embedder_type = f"local-mpnet-adaptive-{target_dim}"
                            active_embedder = ai_provider.embedder

                        # Update existing store's embedding function if it exists
                        if store:
                            store.embedding_function = active_embedder
                            logger.info(f"[SYNC] Vector store embedding function updated to: {ai_provider.embedder_type}")
                        
                        if document_id:
                            await update_training_progress_async(document_id, batch_progress, "Gemini exhausted. Switching to Local Model (mpnet) to finish...")
                        
                        # Retry this specific batch with the new local embedder
                        logger.info(f"🔄 Retrying failed batch {batch_num} with local embedder...")
                        
                        # Re-tag before retry
                        for doc in batch:
                            doc.metadata["embedder"] = ai_provider.embedder_type
                            doc.metadata["fallback_triggered"] = True
                            
                        if store is None:
                            store = FAISS.from_documents(batch, active_embedder)
                        else:
                            store.add_documents(batch)
                            
                        successful_batches += 1
                        logger.info(f"[SUCCESS] Batch {batch_num} recovered with Local Embedder.")
                        continue # Move to next batch
                    
                    # If already on local or unrelated error, we follow original fail-fast or continue
                    if ai_provider.manager.quota_exhausted.get("gemini", False):
                         logger.error(f"🛑 CRITICAL: Provider exhausted and retry failed at batch {batch_num}. Aborting.")
                         break

                    # For other errors, we continue to the next batch (best effort)
                    continue
            
            # Calculate statistics
            total_words = sum(len(doc.page_content.split()) for doc in documents)
            total_chars = sum(len(doc.page_content) for doc in documents)
            
            # Extract document types and sources for reporting
            document_types = list(set(doc.metadata.get('document_type', 'Unknown') for doc in documents))
            sources = list(set(doc.metadata.get('source', 'Unknown') for doc in documents))
            
            # Save vector store only if we have successful batches and save_after is True
            save_success = False
            save_message = "No successful batches to save or save_after=False"
            
            if successful_batches > 0:
                if save_after:
                    logger.info("[SAVE] Saving vector store...")
                    save_success, save_message = save_vector_store(store)
                    if not save_success:
                        logger.error(f"[ERROR] Vector store save failed: {save_message}")
                else:
                    logger.info("⏩ Skipping vector store save (save_after=False)")
                    save_success = True
                    save_message = "Successfully added to memory (not yet persisted)"
            else:
                logger.warning("⚠️ No successful batches - skipping vector store save")
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Determine overall status
            if successful_batches == total_batches:
                status = "success"
            elif successful_batches > 0:
                status = "partial"
            else:
                status = "failed"
            
            result = {
                "status": status,
                "documents_processed": len(documents),
                "successful_batches": successful_batches,
                "failed_batches": failed_batches,
                "total_batches": total_batches,
                "failed_batch_details": failed_batch_details,
                "embedder_type": provider_info['embeddings']['type'],
                "llm_type": provider_info['llm']['type'],
                "total_words": total_words,
                "total_characters": total_chars,
                "average_words_per_doc": total_words / len(documents) if documents else 0,
                "document_types": document_types,
                "sources": sources,
                "processing_time_seconds": processing_time,
                "vector_store_save_status": "success" if save_success else "failed",
                "vector_store_save_message": save_message,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            logger.info(f"[SUCCESS] Vector store update completed: {result}")
            return result
            
        except Exception as e:
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            logger.error(f"❌ Vector store operation failed after {processing_time:.2f}s: {str(e)}", exc_info=True)
            logger.error(f"🔍 Full error traceback: {traceback.format_exc()}")
            
            return {
                "status": "error",
                "message": str(e),
                "error_type": type(e).__name__,
                "documents_processed": 0,
                "processing_time_seconds": processing_time,
                "timestamp": datetime.utcnow().isoformat()
            }

async def update_training_progress_async(doc_id: str, progress: int, log_message: str):
    """Helper to update training progress and logs in MongoDB (Async version)"""
    if not doc_id or len(doc_id) != 24:
        return
        
    try:
        from app.database import get_training_collection
        from bson import ObjectId
        
        coll = await get_training_collection()
        timestamp = datetime.utcnow().strftime("%H:%M:%S")
        formatted_log = f"[{timestamp}] {log_message}"
        
        await coll.update_one(
            {"_id": ObjectId(doc_id)},
            {
                "$set": {"progress": progress, "last_log": log_message},
                "$push": {"logs": {"$each": [formatted_log], "$slice": -100}} # Keep last 100 logs
            }
        )
    except Exception as e:
        logger.error(f"Failed to update training progress: {e}")

def update_training_progress(doc_id: str, progress: int, log_message: str):
    """Fallback - shouldn't be used in modern async context but kept for safety"""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(update_training_progress_async(doc_id, progress, log_message))
        else:
            loop.run_until_complete(update_training_progress_async(doc_id, progress, log_message))
    except Exception:
        pass

# ========================
# Main Ingestion Pipeline
# ========================

document_processor = DocumentProcessor()
vector_store_manager = VectorStoreManager()

@retry(
    stop=stop_after_attempt(2),
    wait=wait_exponential(multiplier=1, min=10, max=30)
)
async def ingest_document_async(
    file_path: str, 
    doc_type: str = "General Legal Document", 
    source_name: str = "Unknown Source",
    document_id: Optional[str] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Asynchronous document ingestion pipeline
    """
    pipeline_start = datetime.utcnow()
    pipeline_info = {
        "pipeline_start_time": pipeline_start.isoformat(),
        "filename": Path(file_path).name,
        "document_type": doc_type,
        "source": source_name,
        "user_id": user_id,
        "status": "started"
    }
    
    try:
        logger.info(f"🚀 Starting async ingestion pipeline for: {file_path} (User: {user_id})")
        await update_training_progress_async(document_id, 5, f"Initializing pipeline for {Path(file_path).name}")
        
        # Step 1: Process document
        await update_training_progress_async(document_id, 10, "Extracting text and metadata...")
        chunks, processing_info = await document_processor.process_document(file_path, doc_type, source_name)
        
        # Inject user_id into all chunks for isolation
        for chunk in chunks:
            chunk.metadata['user_id'] = user_id
            if user_id:
                chunk.metadata['is_private'] = True
            else:
                chunk.metadata['is_private'] = False

        pipeline_info.update(processing_info)
        
        if not chunks:
            # Check if skipped (not failure)
            if processing_info.get("status") == "skipped":
                await update_training_progress_async(document_id, 100, f"Skipped: {processing_info['message']}")
                pipeline_info.update({
                    "status": "skipped",
                    "success": True,
                    "pipeline_end_time": datetime.utcnow().isoformat(),
                    "total_processing_time": (datetime.utcnow() - pipeline_start).total_seconds()
                })
                return pipeline_info

            await update_training_progress_async(document_id, 0, "Error: No meaningful content found.")
            pipeline_info.update({
                "status": "failed",
                "error": "No meaningful content extracted from document",
                "pipeline_end_time": datetime.utcnow().isoformat(),
                "total_processing_time": (datetime.utcnow() - pipeline_start).total_seconds()
            })
            return pipeline_info
        
        await update_training_progress_async(document_id, 25, f"Document split into {len(chunks)} contextualized chunks.")
        
        # Step 2: Add to vector store
        await update_training_progress_async(document_id, 30, "Starting vector indexing (Batch processing)...")
        vector_store_result = await vector_store_manager.add_documents_to_store_async(chunks, document_id=document_id)
        pipeline_info.update(vector_store_result)
        
        # Calculate total processing time
        total_time = (datetime.utcnow() - pipeline_start).total_seconds()
        pipeline_info.update({
            "pipeline_end_time": datetime.utcnow().isoformat(),
            "total_processing_time": total_time,
            "status": pipeline_info.get("status", "success"),
            "success": pipeline_info.get("status") in ["success", "partial"]
        })
        
        # Final logging
        if pipeline_info["status"] == "success":
            await update_training_progress_async(document_id, 100, f"Ingestion completed successfully ({len(chunks)} chunks in {total_time:.1f}s)")
            logger.info(f"[SUCCESS] Async ingestion completed in {total_time:.2f}s")
        elif pipeline_info["status"] == "partial":
            await update_training_progress_async(document_id, 95, f"Partial ingestion: {pipeline_info.get('successful_batches')}/{pipeline_info.get('total_batches')} batches")
        else:
            await update_training_progress_async(document_id, 0, f"Ingestion failed after {total_time:.1f}s")
        
        return pipeline_info
        
    except Exception as e:
        total_time = (datetime.utcnow() - pipeline_start).total_seconds()
        logger.error(f"[CRITICAL] Async Ingestion failed: {str(e)}", exc_info=True)
        return {
            "status": "failed",
            "error": str(e),
            "success": False,
            "total_processing_time": total_time
        }

def ingest_document(*args, **kwargs):
    """Fallback - Wrap async in sync for legacy calls"""
    return asyncio.run(ingest_document_async(*args, **kwargs))

# ========================
# Bulk Processing Functions
# ========================

async def bulk_ingest_documents_async(
    file_paths: List[str], 
    doc_type: str = "Legal Document", 
    source_name: str = "Admin Bulk Upload",
    document_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Optimized bulk ingestion pipeline (Async)
    """
    start_time = datetime.utcnow()
    logger.info(f"Starting BULK ingestion for {len(file_paths)} files")
    
    all_chunks = []
    results = {
        "total_files": len(file_paths),
        "success_count": 0,
        "failed_count": 0,
        "skipped_count": 0,
        "logs": []
    }
    
    await update_training_progress_async(document_id, 5, f"Starting bulk processing of {len(file_paths)} files...")

    for i, file_path in enumerate(file_paths):
        fname = Path(file_path).name
        try:
            if i > 0:
                await asyncio.sleep(2.0) # Respect rate limits

            progress = 5 + int((i / len(file_paths)) * 45)
            if i % 10 == 0:
                await update_training_progress_async(document_id, progress, f"Batch processing: {i}/{len(file_paths)} files ({fname})")

            # Optimized cleanup
            cleanup_res = vector_store_manager.delete_vectors_by_source(fname, save_after=False)
            
            chunks, info = await document_processor.process_document(file_path, doc_type, source_name)
            
            if info.get("status") == "skipped":
                results["skipped_count"] += 1
                results["logs"].append(f"Skipped {fname}: {info.get('message')}")
                continue
                
            all_chunks.extend(chunks)
            results["success_count"] += 1
            
        except Exception as e:
            results["failed_count"] += 1
            results["logs"].append(f"Failed {fname}: {str(e)}")
            logger.error(f"Bulk error for {fname}: {e}")
            continue

    if not all_chunks:
        return {"status": "skipped", "results": results}

    await update_training_progress_async(document_id, 55, f"Extracted {len(all_chunks)} chunks. Indexing (bulk commit)...")
    
    vector_res = await vector_store_manager.add_documents_to_store_async(
        all_chunks, 
        document_id=document_id, 
        save_after=True
    )
    
    total_time = (datetime.utcnow() - start_time).total_seconds()
    results.update({
        "status": "success",
        "total_chunks": len(all_chunks),
        "vector_store_result": vector_res,
        "total_time_seconds": total_time
    })
    
    await update_training_progress_async(document_id, 100, f"Bulk ingestion completed in {total_time:.1f}s")
    return results

def bulk_ingest_documents(*args, **kwargs):
    """Fallback - Wrap async in sync"""
    try:
        return asyncio.run(bulk_ingest_documents_async(*args, **kwargs))
    except RuntimeError:
        # If loop is already running, we can't use run()
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(bulk_ingest_documents_async(*args, **kwargs))

# ========================
# Utility Functions
# ========================

def get_supported_formats() -> List[str]:
    """Get list of supported file formats"""
    return list(document_processor.supported_formats.keys())

def get_processing_stats() -> Dict[str, Any]:
    """Get current processing statistics and system info"""
    from app.config import get_system_status
    
    system_status = get_system_status()
    
    return {
        "system_status": system_status,
        "supported_formats": get_supported_formats(),
        "max_file_size_mb": 100,
        "timestamp": datetime.utcnow().isoformat()
    }

def get_document_metadata_summary() -> Dict[str, Any]:
    """Get summary of all documents in vector store with their metadata"""
    try:
        from app.config import load_vector_store
        store = load_vector_store()
        
        # Extract metadata from all documents
        all_metadata = []
        document_types = set()
        sources = set()
        categories = set()
        
        for doc_id in store.index_to_docstore_id.values():
            try:
                doc = store.docstore.search(doc_id)
                if hasattr(doc, 'metadata'):
                    all_metadata.append(doc.metadata)
                    document_types.add(doc.metadata.get('document_type', 'Unknown'))
                    sources.add(doc.metadata.get('source', 'Unknown'))
                    categories.add(doc.metadata.get('document_category', 'general'))
            except Exception as e:
                continue
        
        return {
            "total_documents": len(all_metadata),
            "document_types": list(document_types),
            "sources": list(sources),
            "categories": list(categories),
            "sample_metadata": all_metadata[:5] if all_metadata else []  # Return first 5 as sample
        }
    except Exception as e:
        logger.error(f"Failed to get document metadata summary: {e}")
        return {"error": str(e)}

# Backward compatibility
def ingest_pdf(file_path: str, doc_type: str = "General Legal Document", source_name: str = "Unknown Source", document_id: Optional[str] = None) -> Dict[str, Any]:
    """Backward compatibility function"""
    return ingest_document(file_path, doc_type, source_name, document_id)

def process_large_document(file_path: str, doc_type: str = "General Legal Document", source_name: str = "Unknown Source") -> List[Document]:
    """Backward compatibility function"""
    chunks, _ = document_processor.process_document(file_path, doc_type, source_name)
    return chunks

def add_to_vectorstore(docs: List[Document]) -> Dict[str, Any]:
    """Backward compatibility function"""
    return vector_store_manager.add_documents_to_store(docs)

# ========================
# Module Initialization
# ========================

if __name__ == "__main__":
    logger.info("🔧 Document Handler initialized successfully")
    logger.info(f"📁 Supported formats: {get_supported_formats()}")
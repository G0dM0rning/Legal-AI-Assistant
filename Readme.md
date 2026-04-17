# ⚖️ LegalAI — The Ultimate RAG-Powered Legal Intelligence Platform

**LegalAI** is a sophisticated, full-stack ecosystem designed to bridge the gap between complex legal data and actionable intelligence. Using a custom **RAG 2.0 pipeline**, it provides high-precision legal analysis, citation tracking, and automated document management.

---

## 🌟 Executive Summary
LegalAI transforms raw legal PDFs, Statutes, and Court Judgments into a searchable, interactive knowledge base. It is built for **Scalability**, **Resilience**, and **Precision**, featuring automated AI failovers and multi-stage document ingestion.

---

## 🚀 Professional Core Features

### 🧠 1. RAG 2.0 & AI Orchestration
- **Contextual Retrieval**: Chunks are prepended with document-wide summaries to solve the "lost in the middle" problem of LLMs.
- **Smart Legal Splitting**: Specialized `LegalAwareTextSplitter` respects hierarchy (Chapter > Article > Section > Clause).
- **Gemini Failover Engine**: Automatically rotates through API keys upon `429 ResourceExhausted` errors, ensuring 100% uptime.
- **Hybrid Extraction**: 3-stage PDF fallback:
    1. **Native**: High-speed PyPDF extraction.
    2. **OCR**: Professional Tesseract-powered vision for scanned docs.
    3. **Unstructured**: "Fast mode" recovery for complex character encodings.

### 💼 2. Enterprise Administration
- **Real-time Training Center**: Monitor ingestion progress with live logs and granular progress bars.
- **Global Audit System**: Every administrative action, document upload, and deletion is recorded for compliance.
- **Vector Store Maintenance**: Optimized FAISS indexing with singleton caching for **sub-1ms retrieval**.
- **Automated Backups**: Daily snapshots of the vector index to prevent data loss.

### 🎨 3. State-of-the-Art UX
- **Glassmorphic UI**: Premium "Slate & Glow" aesthetic designed for legal professionals.
- **Streaming Intelligence**: Real-time LLM responses with clickable source citations and content previews.
- **Export Suite**: One-click generation of professional legal summaries in PDF, DOCX, and TXT formats.

---

## 🛠️ Technical Deep-Dive

### Tech Stack
| Tier | Technology | Contribution |
| :--- | :--- | :--- |
| **Frontend** | React 18, MUI 5, Framer Motion | High-performance, responsive, and animated UI. |
| **Backend** | FastAPI, Pydantic V2, Uvicorn | Asynchronous, type-safe API with high throughput. |
| **AI/ML** | Google Gemini (Flash/Pro), FAISS | LLM Reasoning, Embeddings, and Vector Search. |
| **Database** | MongoDB Atlas | Relational Metadata, Audit Logs, and Auth. |
| **Processing** | Tesseract, PyPDF, Unstructured | Multi-modal document ingestion. |

---

## 📂 System Architecture & Modules

### Backend Logic (`/backend/app`)
- `config.py`: The "Brain". Manages AI providers, failover rotation, and global system state.
- `document_handler.py`: The "Engineer". Handles the entire RAG pipeline from ingestion to indexing.
- `chat_routes.py`: The "Counsel". Manages streaming RAG conversations and history.
- `auth.py`: The "Gatekeeper". Implemented dual-role JWT security (User/Admin).
- `summarizer.py`: The "Editor". Generates global context summaries for RAG enrichment.

### Frontend Components (`/frontend/src`)
- `TryItNow.jsx`: Premium chat interface with streaming and history support.
- `Training.jsx`: Real-time administrative dashboard for document ingestion.
- `Audit.jsx`: Paginated, searchable system logs for tracking activity.
- `theme.js`: Centralized glassmorphic design system tokens.

---

## 📡 API Registry (Comprehensive)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| **PUBLIC** | | | |
| GET | `/` | Root health-check & system metadata | None |
| GET | `/system/status` | Real-time AI & DB status check | None |
| **AUTH** | | | |
| POST | `/register` | User registration | None |
| POST | `/login` | Standard user JWT issuance | None |
| POST | `/admin/signup` | Super-admin registration | Secret Key |
| POST | `/admin/signin` | Admin login & dashboard entry | None |
| **CHAT** | | | |
| POST | `/chat` | **RAG Stream**: Query the legal base | User/Admin |
| GET | `/conversations` | Retrieve user chat history | User/Admin |
| **ADMIN** | | | |
| POST | `/admin/train` | Ingest and index new legal docs | Admin |
| GET | `/admin/stats` | Dashboard executive summary | Admin |
| GET | `/admin/training/history` | Audit log of all uploads | Admin |
| DELETE | `/admin/training/document/{id}` | Purge document from DB & Vector Store | Admin |

---

## ⚙️ Environment Configuration

### Backend `.env`
```env
# Database
MONGO_URI=mongodb+srv://...
DB_NAME=legal_ai

# AI Intelligence
GEMINI_API_KEY=key1,key2,key3 # Failover Pool
ACTIVE_EMBEDDING_MODEL=models/text-embedding-004

# Security
SECRET_KEY=your_jwt_secret
ADMIN_SECRET_KEY=global_admin_creation_key

# Paths
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 🧩 Installation & Setup

### 🗄️ Prerequisites
1. **Python 3.10+**
2. **Node.js 18+**
3. **Tesseract OCR** (For Best Results):
   ```bash
   # Windows (Admin)
   choco install tesseract-ocr poppler -y
   ```

### 🏃 Setup Steps
1. **Clone & Install Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
2. **Install Frontend**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

---

## �️ Security & Performance
- **Wait-Free Vector Search**: Singleton pattern ensures the vector store is loaded once and cached for all users.
- **Thread-Safe LLM**: Synchronous RAG tasks are offloaded to `run_in_threadpool` to prevent event-loop blocking.
- **Encrypted History**: All chat logs are stored in MongoDB with user-level isolation.

---

## 👤 Author
**Muhammad Rizwan Babar** — Software Engineer  
*Expertise in AI-Native systems, RAG Architectures, and Full-Stack Development.*

---

**LegalAI**: *Bridging the gap between Law and Intelligence with every query.*
**Project Video Link**: https://drive.google.com/file/d/1vV65p3_nFMvJZ2iXXUkOcY15VNQejp1F/view?usp=sharing

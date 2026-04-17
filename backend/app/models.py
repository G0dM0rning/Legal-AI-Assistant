from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import secrets

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

class VerificationRequest(BaseModel):
    token: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=6, max_length=100)

class AdminRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    secret_key: str

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user_type: str

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    created_at: datetime
    is_active: bool
    role: UserRole

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AdminOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    created_at: datetime
    is_active: bool

# Make sure this class exists in models.py
class APIResponse(BaseModel):
    success: bool
    message: str = ""
    data: Optional[Any] = None

class TrainingDocument(BaseModel):
    documentName: str
    uploadDate: datetime
    status: str
    fileSize: int
    adminEmail: str
    adminName: str
    documentType: str
    source: str
    processingTime: str
    chunkCount: int
    adminId: str

class DashboardStats(BaseModel):
    total_users: int
    total_admins: int
    total_training_documents: int
    active_users: int
    system_status: str
    last_updated: datetime
    storage_size: str
    vector_store_documents: int

class SupportStatus(str, Enum):
    PENDING = "pending"
    READ = "read"
    REPLIED = "replied"
    CLOSED = "closed"

class SupportTicket(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    type: str = "General"
    priority: str = "Medium"
    subject: str = Field(..., min_length=2)
    message: str = Field(..., min_length=10, max_length=2000)
    status: SupportStatus = SupportStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    ticket_ref: str = Field(default_factory=lambda: secrets.token_hex(4).upper())
    replies: List[Dict[str, Any]] = []

class SupportTicketReply(BaseModel):
    message: str = Field(..., min_length=2)
    admin_name: str
    admin_email: str

class SystemSettings(BaseModel):
    # General
    site_name: str = "Legal AI"
    contact_email: EmailStr = "waqarahmadisbest@gmail.com"
    maintenance_mode: bool = False
    
    # AI Engine
    model_name: str = "gpt-3.5-turbo"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k: int = 4
    
    # SMTP
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = "your-email@gmail.com"
    smtp_pass: str = ""
    
    # Security
    jwt_secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    revoke_all_before: datetime = Field(default_factory=datetime.utcnow)
    
    updated_at: datetime = Field(default_factory=datetime.utcnow)
"""
AI-Mail Service: Intelligent email client with AI-powered features.

Features:
- IMAP/SMTP integration
- AI-powered email composition
- Thread summarization
- Smart replies
- Priority detection
- Attachment handling
- Search and filtering
"""

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid
import asyncio

app = FastAPI(
    title="AI-Mail Service",
    description="Intelligent email client with AI capabilities",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== Enums ==============

class EmailPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class EmailStatus(str, Enum):
    DRAFT = "draft"
    QUEUED = "queued"
    SENT = "sent"
    FAILED = "failed"

class FolderType(str, Enum):
    INBOX = "inbox"
    SENT = "sent"
    DRAFTS = "drafts"
    TRASH = "trash"
    SPAM = "spam"
    ARCHIVE = "archive"
    STARRED = "starred"
    CUSTOM = "custom"

class LabelColor(str, Enum):
    RED = "red"
    ORANGE = "orange"
    YELLOW = "yellow"
    GREEN = "green"
    BLUE = "blue"
    PURPLE = "purple"
    GRAY = "gray"

# ============== Models ==============

class EmailAddress(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class Attachment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    content_type: str
    size: int
    url: Optional[str] = None
    inline: bool = False
    content_id: Optional[str] = None

class EmailCreate(BaseModel):
    to: List[EmailAddress]
    cc: Optional[List[EmailAddress]] = []
    bcc: Optional[List[EmailAddress]] = []
    subject: str
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    priority: EmailPriority = EmailPriority.NORMAL
    reply_to_id: Optional[str] = None
    forward_of_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    attachments: Optional[List[str]] = []  # attachment IDs

class EmailUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_starred: Optional[bool] = None
    folder: Optional[FolderType] = None
    labels: Optional[List[str]] = None
    is_archived: Optional[bool] = None
    is_spam: Optional[bool] = None

class Email(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    message_id: str  # RFC 5322 Message-ID
    thread_id: str
    from_address: EmailAddress
    to: List[EmailAddress]
    cc: List[EmailAddress] = []
    bcc: List[EmailAddress] = []
    reply_to: Optional[EmailAddress] = None
    subject: str
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    snippet: str  # Preview text
    priority: EmailPriority = EmailPriority.NORMAL
    status: EmailStatus = EmailStatus.SENT
    folder: FolderType = FolderType.INBOX
    labels: List[str] = []
    attachments: List[Attachment] = []
    is_read: bool = False
    is_starred: bool = False
    is_archived: bool = False
    is_spam: bool = False
    has_attachments: bool = False
    in_reply_to: Optional[str] = None  # Parent message ID
    references: List[str] = []  # Thread reference IDs
    headers: Dict[str, str] = {}
    received_at: datetime = Field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # AI-generated fields
    ai_summary: Optional[str] = None
    ai_priority: Optional[EmailPriority] = None
    ai_category: Optional[str] = None
    ai_sentiment: Optional[str] = None
    ai_action_items: Optional[List[str]] = None

class Thread(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    subject: str
    participants: List[EmailAddress]
    message_count: int = 1
    unread_count: int = 0
    has_attachments: bool = False
    labels: List[str] = []
    is_starred: bool = False
    snippet: str
    last_message_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # AI fields
    ai_summary: Optional[str] = None

class Label(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    name: str
    color: LabelColor = LabelColor.GRAY
    message_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Folder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    name: str
    type: FolderType
    parent_id: Optional[str] = None
    message_count: int = 0
    unread_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EmailAccount(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    email: EmailStr
    name: str
    provider: str  # gmail, outlook, imap
    imap_host: Optional[str] = None
    imap_port: Optional[int] = 993
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    is_primary: bool = False
    is_active: bool = True
    signature: Optional[str] = None
    sync_enabled: bool = True
    last_sync_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Contact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    email: EmailStr
    name: Optional[str] = None
    company: Optional[str] = None
    avatar_url: Optional[str] = None
    is_frequent: bool = False
    email_count: int = 0
    last_contacted: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Filter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    name: str
    is_active: bool = True
    conditions: Dict[str, Any]  # from, to, subject, has_attachment, etc.
    actions: Dict[str, Any]  # move_to, add_label, mark_read, delete, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============== AI Models ==============

class AIComposeRequest(BaseModel):
    prompt: str
    tone: str = "professional"  # professional, casual, friendly, formal
    length: str = "medium"  # short, medium, long
    context: Optional[str] = None
    reply_to_content: Optional[str] = None

class AIComposeResponse(BaseModel):
    subject: str
    body_html: str
    body_text: str
    suggestions: List[str] = []

class AIRewriteRequest(BaseModel):
    content: str
    instruction: str  # make shorter, more formal, clearer, etc.

class AISummarizeRequest(BaseModel):
    email_ids: Optional[List[str]] = None
    thread_id: Optional[str] = None

class AIQuickReplyRequest(BaseModel):
    email_id: str
    intent: str  # accept, decline, acknowledge, ask_question, schedule

class AISearchRequest(BaseModel):
    query: str  # natural language query
    account_id: Optional[str] = None
    folder: Optional[FolderType] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

class AICategorizationResult(BaseModel):
    category: str
    confidence: float
    suggested_labels: List[str]
    suggested_folder: Optional[FolderType] = None
    priority: EmailPriority
    action_items: List[str]
    sentiment: str

# ============== Storage (in-memory for demo) ==============

accounts_db: Dict[str, EmailAccount] = {}
emails_db: Dict[str, Email] = {}
threads_db: Dict[str, Thread] = {}
labels_db: Dict[str, Label] = {}
folders_db: Dict[str, Folder] = {}
contacts_db: Dict[str, Contact] = {}
filters_db: Dict[str, Filter] = {}
attachments_db: Dict[str, Attachment] = {}

# ============== Helper Functions ==============

def get_account(account_id: str) -> EmailAccount:
    if account_id not in accounts_db:
        raise HTTPException(status_code=404, detail="Account not found")
    return accounts_db[account_id]

def generate_snippet(body: str, max_length: int = 150) -> str:
    """Generate email snippet from body."""
    if not body:
        return ""
    # Remove HTML tags if present
    import re
    text = re.sub(r'<[^>]+>', '', body)
    text = ' '.join(text.split())  # Normalize whitespace
    if len(text) > max_length:
        return text[:max_length] + "..."
    return text

# ============== Account Endpoints ==============

@app.post("/accounts", response_model=EmailAccount)
async def create_account(
    user_id: str,
    email: EmailStr,
    name: str,
    provider: str,
    imap_host: Optional[str] = None,
    imap_port: Optional[int] = 993,
    smtp_host: Optional[str] = None,
    smtp_port: Optional[int] = 587,
):
    """Create a new email account."""
    account = EmailAccount(
        user_id=user_id,
        email=email,
        name=name,
        provider=provider,
        imap_host=imap_host,
        imap_port=imap_port,
        smtp_host=smtp_host,
        smtp_port=smtp_port,
        is_primary=len([a for a in accounts_db.values() if a.user_id == user_id]) == 0,
    )
    accounts_db[account.id] = account

    # Create default folders
    for folder_type in [FolderType.INBOX, FolderType.SENT, FolderType.DRAFTS,
                        FolderType.TRASH, FolderType.SPAM, FolderType.ARCHIVE]:
        folder = Folder(
            account_id=account.id,
            name=folder_type.value.capitalize(),
            type=folder_type,
        )
        folders_db[folder.id] = folder

    return account

@app.get("/accounts", response_model=List[EmailAccount])
async def list_accounts(user_id: str):
    """List all email accounts for a user."""
    return [a for a in accounts_db.values() if a.user_id == user_id]

@app.get("/accounts/{account_id}", response_model=EmailAccount)
async def get_account_details(account_id: str):
    """Get account details."""
    return get_account(account_id)

@app.put("/accounts/{account_id}/signature")
async def update_signature(account_id: str, signature: str):
    """Update account email signature."""
    account = get_account(account_id)
    account.signature = signature
    return {"message": "Signature updated"}

@app.post("/accounts/{account_id}/sync")
async def sync_account(account_id: str, background_tasks: BackgroundTasks):
    """Trigger email sync for account."""
    account = get_account(account_id)
    # In real implementation, this would sync with IMAP server
    account.last_sync_at = datetime.utcnow()
    return {"message": "Sync started", "last_sync": account.last_sync_at}

# ============== Email Endpoints ==============

@app.post("/emails", response_model=Email)
async def create_email(
    account_id: str,
    email_data: EmailCreate,
    send_now: bool = False,
    background_tasks: BackgroundTasks = None,
):
    """Create and optionally send an email."""
    account = get_account(account_id)

    # Generate thread ID (new or existing if reply)
    thread_id = str(uuid.uuid4())
    in_reply_to = None
    references = []

    if email_data.reply_to_id and email_data.reply_to_id in emails_db:
        parent = emails_db[email_data.reply_to_id]
        thread_id = parent.thread_id
        in_reply_to = parent.message_id
        references = parent.references + [parent.message_id]

    email = Email(
        account_id=account_id,
        message_id=f"<{uuid.uuid4()}@{account.email.split('@')[1]}>",
        thread_id=thread_id,
        from_address=EmailAddress(email=account.email, name=account.name),
        to=email_data.to,
        cc=email_data.cc or [],
        bcc=email_data.bcc or [],
        subject=email_data.subject,
        body_text=email_data.body_text,
        body_html=email_data.body_html,
        snippet=generate_snippet(email_data.body_text or email_data.body_html or ""),
        priority=email_data.priority,
        status=EmailStatus.DRAFT if not send_now else EmailStatus.QUEUED,
        folder=FolderType.DRAFTS if not send_now else FolderType.SENT,
        in_reply_to=in_reply_to,
        references=references,
        has_attachments=len(email_data.attachments or []) > 0,
    )

    # Attach files
    if email_data.attachments:
        for att_id in email_data.attachments:
            if att_id in attachments_db:
                email.attachments.append(attachments_db[att_id])

    emails_db[email.id] = email

    # Update or create thread
    if thread_id in threads_db:
        thread = threads_db[thread_id]
        thread.message_count += 1
        thread.last_message_at = datetime.utcnow()
        thread.snippet = email.snippet
        # Add new participants
        for addr in email.to + email.cc:
            if addr not in thread.participants:
                thread.participants.append(addr)
    else:
        thread = Thread(
            id=thread_id,
            account_id=account_id,
            subject=email.subject,
            participants=email.to + email.cc + [email.from_address],
            snippet=email.snippet,
            has_attachments=email.has_attachments,
        )
        threads_db[thread_id] = thread

    if send_now:
        # In real implementation, send via SMTP
        email.status = EmailStatus.SENT
        email.sent_at = datetime.utcnow()

    return email

@app.get("/emails", response_model=List[Email])
async def list_emails(
    account_id: str,
    folder: Optional[FolderType] = None,
    label: Optional[str] = None,
    is_unread: Optional[bool] = None,
    is_starred: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    """List emails with filtering."""
    emails = [e for e in emails_db.values() if e.account_id == account_id]

    if folder:
        emails = [e for e in emails if e.folder == folder]
    if label:
        emails = [e for e in emails if label in e.labels]
    if is_unread is not None:
        emails = [e for e in emails if not e.is_read == is_unread]
    if is_starred is not None:
        emails = [e for e in emails if e.is_starred == is_starred]
    if search:
        search_lower = search.lower()
        emails = [e for e in emails if
                  search_lower in e.subject.lower() or
                  search_lower in (e.body_text or "").lower() or
                  any(search_lower in addr.email.lower() for addr in e.to)]

    # Sort by received date, newest first
    emails.sort(key=lambda x: x.received_at, reverse=True)

    # Paginate
    start = (page - 1) * page_size
    end = start + page_size

    return emails[start:end]

@app.get("/emails/{email_id}", response_model=Email)
async def get_email(email_id: str, mark_read: bool = True):
    """Get email details."""
    if email_id not in emails_db:
        raise HTTPException(status_code=404, detail="Email not found")

    email = emails_db[email_id]

    if mark_read and not email.is_read:
        email.is_read = True
        # Update thread unread count
        if email.thread_id in threads_db:
            threads_db[email.thread_id].unread_count = max(0, threads_db[email.thread_id].unread_count - 1)

    return email

@app.put("/emails/{email_id}", response_model=Email)
async def update_email(email_id: str, update: EmailUpdate):
    """Update email properties."""
    if email_id not in emails_db:
        raise HTTPException(status_code=404, detail="Email not found")

    email = emails_db[email_id]

    if update.is_read is not None:
        was_read = email.is_read
        email.is_read = update.is_read
        # Update thread unread count
        if email.thread_id in threads_db:
            if was_read and not update.is_read:
                threads_db[email.thread_id].unread_count += 1
            elif not was_read and update.is_read:
                threads_db[email.thread_id].unread_count = max(0, threads_db[email.thread_id].unread_count - 1)

    if update.is_starred is not None:
        email.is_starred = update.is_starred
    if update.folder is not None:
        email.folder = update.folder
    if update.labels is not None:
        email.labels = update.labels
    if update.is_archived is not None:
        email.is_archived = update.is_archived
        if update.is_archived:
            email.folder = FolderType.ARCHIVE
    if update.is_spam is not None:
        email.is_spam = update.is_spam
        if update.is_spam:
            email.folder = FolderType.SPAM

    return email

@app.delete("/emails/{email_id}")
async def delete_email(email_id: str, permanent: bool = False):
    """Move email to trash or delete permanently."""
    if email_id not in emails_db:
        raise HTTPException(status_code=404, detail="Email not found")

    if permanent:
        del emails_db[email_id]
        return {"message": "Email permanently deleted"}
    else:
        emails_db[email_id].folder = FolderType.TRASH
        return {"message": "Email moved to trash"}

@app.post("/emails/{email_id}/send")
async def send_email(email_id: str):
    """Send a draft email."""
    if email_id not in emails_db:
        raise HTTPException(status_code=404, detail="Email not found")

    email = emails_db[email_id]
    if email.status != EmailStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Email is not a draft")

    # In real implementation, send via SMTP
    email.status = EmailStatus.SENT
    email.folder = FolderType.SENT
    email.sent_at = datetime.utcnow()

    return {"message": "Email sent", "sent_at": email.sent_at}

@app.post("/emails/bulk-update")
async def bulk_update_emails(
    email_ids: List[str],
    update: EmailUpdate,
):
    """Bulk update multiple emails."""
    updated = 0
    for email_id in email_ids:
        if email_id in emails_db:
            email = emails_db[email_id]
            if update.is_read is not None:
                email.is_read = update.is_read
            if update.is_starred is not None:
                email.is_starred = update.is_starred
            if update.folder is not None:
                email.folder = update.folder
            if update.labels is not None:
                email.labels = update.labels
            updated += 1

    return {"updated": updated}

# ============== Thread Endpoints ==============

@app.get("/threads", response_model=List[Thread])
async def list_threads(
    account_id: str,
    folder: Optional[FolderType] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=50),
):
    """List email threads."""
    # Get threads based on emails in folder
    if folder:
        thread_ids = set(e.thread_id for e in emails_db.values()
                        if e.account_id == account_id and e.folder == folder)
        threads = [t for t in threads_db.values() if t.id in thread_ids]
    else:
        threads = [t for t in threads_db.values() if t.account_id == account_id]

    # Sort by last message date
    threads.sort(key=lambda x: x.last_message_at, reverse=True)

    # Paginate
    start = (page - 1) * page_size
    end = start + page_size

    return threads[start:end]

@app.get("/threads/{thread_id}", response_model=Dict[str, Any])
async def get_thread(thread_id: str):
    """Get thread with all messages."""
    if thread_id not in threads_db:
        raise HTTPException(status_code=404, detail="Thread not found")

    thread = threads_db[thread_id]
    messages = [e for e in emails_db.values() if e.thread_id == thread_id]
    messages.sort(key=lambda x: x.received_at)

    return {
        "thread": thread,
        "messages": messages,
    }

@app.post("/threads/{thread_id}/archive")
async def archive_thread(thread_id: str):
    """Archive all emails in thread."""
    if thread_id not in threads_db:
        raise HTTPException(status_code=404, detail="Thread not found")

    for email in emails_db.values():
        if email.thread_id == thread_id:
            email.is_archived = True
            email.folder = FolderType.ARCHIVE

    return {"message": "Thread archived"}

# ============== Label Endpoints ==============

@app.post("/labels", response_model=Label)
async def create_label(account_id: str, name: str, color: LabelColor = LabelColor.GRAY):
    """Create a new label."""
    label = Label(
        account_id=account_id,
        name=name,
        color=color,
    )
    labels_db[label.id] = label
    return label

@app.get("/labels", response_model=List[Label])
async def list_labels(account_id: str):
    """List all labels for an account."""
    return [l for l in labels_db.values() if l.account_id == account_id]

@app.delete("/labels/{label_id}")
async def delete_label(label_id: str):
    """Delete a label."""
    if label_id not in labels_db:
        raise HTTPException(status_code=404, detail="Label not found")

    label = labels_db[label_id]

    # Remove label from all emails
    for email in emails_db.values():
        if label.name in email.labels:
            email.labels.remove(label.name)

    del labels_db[label_id]
    return {"message": "Label deleted"}

# ============== Folder Endpoints ==============

@app.get("/folders", response_model=List[Folder])
async def list_folders(account_id: str):
    """List all folders for an account."""
    folders = [f for f in folders_db.values() if f.account_id == account_id]

    # Update counts
    for folder in folders:
        emails = [e for e in emails_db.values()
                  if e.account_id == account_id and e.folder == folder.type]
        folder.message_count = len(emails)
        folder.unread_count = len([e for e in emails if not e.is_read])

    return folders

@app.post("/folders", response_model=Folder)
async def create_folder(account_id: str, name: str, parent_id: Optional[str] = None):
    """Create a custom folder."""
    folder = Folder(
        account_id=account_id,
        name=name,
        type=FolderType.CUSTOM,
        parent_id=parent_id,
    )
    folders_db[folder.id] = folder
    return folder

# ============== Attachment Endpoints ==============

@app.post("/attachments")
async def upload_attachment(
    account_id: str,
    file: UploadFile = File(...),
):
    """Upload an attachment."""
    content = await file.read()

    attachment = Attachment(
        filename=file.filename,
        content_type=file.content_type,
        size=len(content),
        url=f"/attachments/{str(uuid.uuid4())}/{file.filename}",  # In real impl, upload to storage
    )
    attachments_db[attachment.id] = attachment

    return attachment

@app.get("/attachments/{attachment_id}")
async def get_attachment(attachment_id: str):
    """Get attachment metadata."""
    if attachment_id not in attachments_db:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return attachments_db[attachment_id]

# ============== Contact Endpoints ==============

@app.get("/contacts", response_model=List[Contact])
async def list_contacts(
    account_id: str,
    search: Optional[str] = None,
    frequent_only: bool = False,
):
    """List contacts."""
    contacts = [c for c in contacts_db.values() if c.account_id == account_id]

    if search:
        search_lower = search.lower()
        contacts = [c for c in contacts if
                    search_lower in c.email.lower() or
                    search_lower in (c.name or "").lower()]

    if frequent_only:
        contacts = [c for c in contacts if c.is_frequent]

    contacts.sort(key=lambda x: x.email_count, reverse=True)
    return contacts

@app.post("/contacts", response_model=Contact)
async def create_contact(
    account_id: str,
    email: EmailStr,
    name: Optional[str] = None,
    company: Optional[str] = None,
):
    """Create a new contact."""
    contact = Contact(
        account_id=account_id,
        email=email,
        name=name,
        company=company,
    )
    contacts_db[contact.id] = contact
    return contact

# ============== Filter Endpoints ==============

@app.post("/filters", response_model=Filter)
async def create_filter(
    account_id: str,
    name: str,
    conditions: Dict[str, Any],
    actions: Dict[str, Any],
):
    """Create an email filter/rule."""
    filter_obj = Filter(
        account_id=account_id,
        name=name,
        conditions=conditions,
        actions=actions,
    )
    filters_db[filter_obj.id] = filter_obj
    return filter_obj

@app.get("/filters", response_model=List[Filter])
async def list_filters(account_id: str):
    """List all filters for an account."""
    return [f for f in filters_db.values() if f.account_id == account_id]

@app.delete("/filters/{filter_id}")
async def delete_filter(filter_id: str):
    """Delete a filter."""
    if filter_id not in filters_db:
        raise HTTPException(status_code=404, detail="Filter not found")
    del filters_db[filter_id]
    return {"message": "Filter deleted"}

# ============== AI Features ==============

@app.post("/ai/compose", response_model=AIComposeResponse)
async def ai_compose_email(request: AIComposeRequest):
    """AI-powered email composition."""
    # In real implementation, call LLM

    tone_instructions = {
        "professional": "formal and business-appropriate",
        "casual": "relaxed and conversational",
        "friendly": "warm and approachable",
        "formal": "very formal and structured",
    }

    length_targets = {
        "short": "2-3 sentences",
        "medium": "1-2 paragraphs",
        "long": "multiple detailed paragraphs",
    }

    # Simulated AI response
    return AIComposeResponse(
        subject=f"Re: {request.prompt[:50]}..." if request.reply_to_content else f"Regarding: {request.prompt[:50]}...",
        body_html=f"""<p>Dear recipient,</p>
<p>Based on your request about "{request.prompt}", I have composed this email in a {tone_instructions[request.tone]} tone.</p>
<p>This is a {length_targets[request.length]} response generated by AI.</p>
<p>Best regards</p>""",
        body_text=f"""Dear recipient,

Based on your request about "{request.prompt}", I have composed this email in a {tone_instructions[request.tone]} tone.

This is a {length_targets[request.length]} response generated by AI.

Best regards""",
        suggestions=[
            "Consider adding specific details",
            "You might want to include a call-to-action",
            "Review the tone for your audience",
        ],
    )

@app.post("/ai/rewrite")
async def ai_rewrite_email(request: AIRewriteRequest):
    """AI-powered email rewriting."""
    # In real implementation, call LLM

    return {
        "original": request.content,
        "rewritten": f"[Rewritten to be {request.instruction}]\n\n{request.content}",
        "changes_made": [
            f"Applied instruction: {request.instruction}",
            "Improved clarity",
            "Adjusted tone",
        ],
    }

@app.post("/ai/summarize")
async def ai_summarize(request: AISummarizeRequest):
    """AI-powered email/thread summarization."""
    messages = []

    if request.thread_id:
        messages = [e for e in emails_db.values() if e.thread_id == request.thread_id]
    elif request.email_ids:
        messages = [emails_db[eid] for eid in request.email_ids if eid in emails_db]

    if not messages:
        raise HTTPException(status_code=404, detail="No emails found to summarize")

    # Simulated AI summary
    summary = {
        "summary": f"This conversation contains {len(messages)} messages discussing {messages[0].subject}.",
        "key_points": [
            "Main topic discussed",
            "Key decisions mentioned",
            "Follow-up actions identified",
        ],
        "participants_summary": {
            addr.email: "Contributed to the discussion"
            for msg in messages for addr in [msg.from_address]
        },
        "action_items": [
            {"task": "Review and respond", "assignee": "You", "due": "Soon"},
        ],
        "sentiment": "neutral",
        "urgency": "normal",
    }

    # Store AI summary in thread
    if request.thread_id and request.thread_id in threads_db:
        threads_db[request.thread_id].ai_summary = summary["summary"]

    return summary

@app.post("/ai/quick-reply")
async def ai_quick_reply(request: AIQuickReplyRequest):
    """Generate quick reply options."""
    if request.email_id not in emails_db:
        raise HTTPException(status_code=404, detail="Email not found")

    email = emails_db[request.email_id]

    quick_replies = {
        "accept": [
            "Thank you, I accept.",
            "Sounds good, I'm in!",
            "Yes, that works for me.",
        ],
        "decline": [
            "Thank you for the invitation, but I won't be able to make it.",
            "I appreciate the offer, but I have to decline.",
            "Unfortunately, I can't commit to this at the moment.",
        ],
        "acknowledge": [
            "Thank you for letting me know.",
            "Got it, thanks for the update.",
            "Acknowledged, thank you.",
        ],
        "ask_question": [
            "Could you please provide more details?",
            "I have a few questions about this.",
            "Can we schedule a call to discuss?",
        ],
        "schedule": [
            "Would Tuesday at 2 PM work for you?",
            "I'm available tomorrow afternoon.",
            "Let me check my calendar and get back to you.",
        ],
    }

    return {
        "email_subject": email.subject,
        "intent": request.intent,
        "suggestions": quick_replies.get(request.intent, ["Thank you for your email."]),
    }

@app.post("/ai/categorize", response_model=AICategorizationResult)
async def ai_categorize_email(email_id: str):
    """AI-powered email categorization."""
    if email_id not in emails_db:
        raise HTTPException(status_code=404, detail="Email not found")

    email = emails_db[email_id]

    # Simulated AI categorization
    result = AICategorizationResult(
        category="work",  # work, personal, newsletters, social, promotions, updates
        confidence=0.85,
        suggested_labels=["important", "follow-up"],
        suggested_folder=FolderType.INBOX,
        priority=EmailPriority.NORMAL,
        action_items=["Review attached document", "Reply with feedback"],
        sentiment="positive",
    )

    # Store AI results in email
    email.ai_category = result.category
    email.ai_priority = result.priority
    email.ai_sentiment = result.sentiment
    email.ai_action_items = result.action_items

    return result

@app.post("/ai/search")
async def ai_semantic_search(request: AISearchRequest):
    """AI-powered semantic email search."""
    # In real implementation, use embeddings and vector search

    # Simple keyword search as fallback
    results = []
    for email in emails_db.values():
        if request.account_id and email.account_id != request.account_id:
            continue
        if request.folder and email.folder != request.folder:
            continue
        if request.date_from and email.received_at < request.date_from:
            continue
        if request.date_to and email.received_at > request.date_to:
            continue

        # Check content match
        query_lower = request.query.lower()
        if (query_lower in email.subject.lower() or
            query_lower in (email.body_text or "").lower() or
            any(query_lower in addr.email.lower() for addr in email.to)):
            results.append({
                "email": email,
                "relevance_score": 0.8,
                "matched_on": "content",
            })

    return {
        "query": request.query,
        "interpreted_as": f"Searching for emails about '{request.query}'",
        "results": results[:20],
        "total_matches": len(results),
    }

@app.post("/ai/priority-inbox")
async def ai_priority_inbox(account_id: str):
    """AI-powered priority inbox sorting."""
    emails = [e for e in emails_db.values()
              if e.account_id == account_id and e.folder == FolderType.INBOX and not e.is_read]

    # Simulated AI prioritization
    prioritized = {
        "important": [],  # Needs immediate attention
        "focused": [],    # From important contacts
        "other": [],      # Everything else
    }

    for email in emails:
        # Simple heuristic (in real impl, use ML model)
        if email.priority in [EmailPriority.HIGH, EmailPriority.URGENT]:
            prioritized["important"].append(email)
        elif email.is_starred:
            prioritized["focused"].append(email)
        else:
            prioritized["other"].append(email)

    return prioritized

@app.post("/ai/unsubscribe-suggestions")
async def ai_unsubscribe_suggestions(account_id: str):
    """Suggest emails/newsletters to unsubscribe from."""
    emails = [e for e in emails_db.values() if e.account_id == account_id]

    # Group by sender and analyze engagement
    sender_stats = {}
    for email in emails:
        sender = email.from_address.email
        if sender not in sender_stats:
            sender_stats[sender] = {"total": 0, "read": 0, "name": email.from_address.name}
        sender_stats[sender]["total"] += 1
        if email.is_read:
            sender_stats[sender]["read"] += 1

    # Find low-engagement senders
    suggestions = []
    for sender, stats in sender_stats.items():
        if stats["total"] >= 5:  # At least 5 emails
            read_rate = stats["read"] / stats["total"]
            if read_rate < 0.2:  # Less than 20% read rate
                suggestions.append({
                    "sender": sender,
                    "name": stats["name"],
                    "total_emails": stats["total"],
                    "read_rate": read_rate,
                    "recommendation": "Consider unsubscribing",
                })

    return {
        "suggestions": suggestions,
        "potential_savings": f"{len(suggestions) * 5} emails/month",
    }

# ============== Statistics ==============

@app.get("/stats/{account_id}")
async def get_email_stats(account_id: str):
    """Get email statistics for an account."""
    emails = [e for e in emails_db.values() if e.account_id == account_id]

    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)

    return {
        "total_emails": len(emails),
        "unread_count": len([e for e in emails if not e.is_read]),
        "starred_count": len([e for e in emails if e.is_starred]),
        "sent_today": len([e for e in emails if e.folder == FolderType.SENT and e.sent_at and e.sent_at >= today_start]),
        "received_today": len([e for e in emails if e.received_at >= today_start]),
        "received_this_week": len([e for e in emails if e.received_at >= week_start]),
        "by_folder": {
            folder.value: len([e for e in emails if e.folder == folder])
            for folder in FolderType
        },
        "storage_used_mb": sum(
            sum(a.size for a in e.attachments)
            for e in emails
        ) / (1024 * 1024),
    }

# ============== Health Check ==============

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-mail",
        "version": "1.0.0",
        "accounts": len(accounts_db),
        "emails": len(emails_db),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)

"""
AI-Drive Service: Intelligent cloud storage with AI-powered features.

Features:
- File upload/download
- Folder management
- File versioning
- Sharing and permissions
- AI-powered file organization
- Semantic search
- Duplicate detection
- Auto-tagging
- Content extraction
"""

from fastapi import FastAPI, HTTPException, Depends, Query, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, BinaryIO
from datetime import datetime, timedelta
from enum import Enum
import uuid
import asyncio
import hashlib
import mimetypes
from io import BytesIO

app = FastAPI(
    title="AI-Drive Service",
    description="Intelligent cloud storage with AI capabilities",
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

class FileType(str, Enum):
    DOCUMENT = "document"
    SPREADSHEET = "spreadsheet"
    PRESENTATION = "presentation"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    ARCHIVE = "archive"
    CODE = "code"
    PDF = "pdf"
    OTHER = "other"

class SharePermission(str, Enum):
    VIEW = "view"
    COMMENT = "comment"
    EDIT = "edit"
    OWNER = "owner"

class ShareType(str, Enum):
    USER = "user"
    GROUP = "group"
    LINK = "link"
    PUBLIC = "public"

class SortBy(str, Enum):
    NAME = "name"
    SIZE = "size"
    MODIFIED = "modified"
    CREATED = "created"
    TYPE = "type"

# ============== Models ==============

class FileMetadata(BaseModel):
    width: Optional[int] = None  # For images/videos
    height: Optional[int] = None
    duration: Optional[float] = None  # For audio/video
    pages: Optional[int] = None  # For documents
    word_count: Optional[int] = None
    has_audio: Optional[bool] = None
    codec: Optional[str] = None
    bitrate: Optional[int] = None
    extracted_text: Optional[str] = None
    exif: Optional[Dict[str, Any]] = None

class FileVersion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_id: str
    version_number: int
    size: int
    hash: str
    storage_path: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    comment: Optional[str] = None

class FileShare(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_id: str
    shared_by: str
    share_type: ShareType
    shared_with: Optional[str] = None  # User ID, email, or None for link
    permission: SharePermission = SharePermission.VIEW
    link_token: Optional[str] = None
    password_protected: bool = False
    password_hash: Optional[str] = None
    expires_at: Optional[datetime] = None
    download_limit: Optional[int] = None
    download_count: int = 0
    allow_download: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FileItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    extension: Optional[str] = None
    file_type: FileType = FileType.OTHER
    mime_type: Optional[str] = None
    size: int = 0
    hash: str = ""  # MD5/SHA256 for duplicate detection
    parent_id: Optional[str] = None  # Folder ID
    storage_path: str = ""  # Path in object storage
    thumbnail_path: Optional[str] = None
    preview_path: Optional[str] = None
    is_folder: bool = False
    is_starred: bool = False
    is_trashed: bool = False
    trashed_at: Optional[datetime] = None
    is_shared: bool = False
    tags: List[str] = []
    color: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[FileMetadata] = None
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    accessed_at: Optional[datetime] = None
    created_by: str = ""
    # AI fields
    ai_tags: Optional[List[str]] = None
    ai_description: Optional[str] = None
    ai_category: Optional[str] = None
    ai_summary: Optional[str] = None
    embedding: Optional[List[float]] = None

class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None

class FileUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None
    is_starred: Optional[bool] = None
    tags: Optional[List[str]] = None
    color: Optional[str] = None
    description: Optional[str] = None

class StorageQuota(BaseModel):
    user_id: str
    total_bytes: int = 15 * 1024 * 1024 * 1024  # 15GB default
    used_bytes: int = 0
    file_count: int = 0
    folder_count: int = 0

# ============== AI Models ==============

class AISearchRequest(BaseModel):
    query: str
    search_type: str = "semantic"  # semantic, keyword, hybrid
    file_types: Optional[List[FileType]] = None
    folder_id: Optional[str] = None
    include_trashed: bool = False
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    size_min: Optional[int] = None
    size_max: Optional[int] = None
    limit: int = 50

class AIOrganizeRequest(BaseModel):
    file_ids: Optional[List[str]] = None
    strategy: str = "auto"  # auto, by_type, by_date, by_project, by_content

class AIDuplicateResult(BaseModel):
    original_id: str
    original_name: str
    duplicates: List[Dict[str, Any]]
    total_space_recoverable: int

# ============== Storage (in-memory for demo) ==============

files_db: Dict[str, FileItem] = {}
versions_db: Dict[str, List[FileVersion]] = {}
shares_db: Dict[str, FileShare] = {}
quotas_db: Dict[str, StorageQuota] = {}
file_content_db: Dict[str, bytes] = {}  # Simulated file storage

# ============== Helper Functions ==============

def get_file(file_id: str) -> FileItem:
    if file_id not in files_db:
        raise HTTPException(status_code=404, detail="File not found")
    return files_db[file_id]

def get_file_type(mime_type: str, extension: str) -> FileType:
    """Determine file type from MIME type and extension."""
    if mime_type:
        if mime_type.startswith("image/"):
            return FileType.IMAGE
        if mime_type.startswith("video/"):
            return FileType.VIDEO
        if mime_type.startswith("audio/"):
            return FileType.AUDIO
        if mime_type == "application/pdf":
            return FileType.PDF
        if "spreadsheet" in mime_type or "excel" in mime_type:
            return FileType.SPREADSHEET
        if "presentation" in mime_type or "powerpoint" in mime_type:
            return FileType.PRESENTATION
        if "document" in mime_type or "word" in mime_type or "text" in mime_type:
            return FileType.DOCUMENT
        if "zip" in mime_type or "rar" in mime_type or "tar" in mime_type:
            return FileType.ARCHIVE

    ext_lower = (extension or "").lower()
    type_map = {
        ".jpg": FileType.IMAGE, ".jpeg": FileType.IMAGE, ".png": FileType.IMAGE,
        ".gif": FileType.IMAGE, ".webp": FileType.IMAGE, ".svg": FileType.IMAGE,
        ".mp4": FileType.VIDEO, ".avi": FileType.VIDEO, ".mov": FileType.VIDEO,
        ".mkv": FileType.VIDEO, ".webm": FileType.VIDEO,
        ".mp3": FileType.AUDIO, ".wav": FileType.AUDIO, ".flac": FileType.AUDIO,
        ".ogg": FileType.AUDIO, ".m4a": FileType.AUDIO,
        ".pdf": FileType.PDF,
        ".doc": FileType.DOCUMENT, ".docx": FileType.DOCUMENT, ".txt": FileType.DOCUMENT,
        ".rtf": FileType.DOCUMENT, ".odt": FileType.DOCUMENT,
        ".xls": FileType.SPREADSHEET, ".xlsx": FileType.SPREADSHEET, ".csv": FileType.SPREADSHEET,
        ".ppt": FileType.PRESENTATION, ".pptx": FileType.PRESENTATION,
        ".zip": FileType.ARCHIVE, ".rar": FileType.ARCHIVE, ".7z": FileType.ARCHIVE,
        ".py": FileType.CODE, ".js": FileType.CODE, ".ts": FileType.CODE,
        ".java": FileType.CODE, ".cpp": FileType.CODE, ".c": FileType.CODE,
        ".html": FileType.CODE, ".css": FileType.CODE, ".json": FileType.CODE,
    }
    return type_map.get(ext_lower, FileType.OTHER)

def calculate_hash(content: bytes) -> str:
    """Calculate file hash for duplicate detection."""
    return hashlib.sha256(content).hexdigest()

def get_folder_path(file: FileItem) -> str:
    """Get full path of a file/folder."""
    path_parts = [file.name]
    current = file

    while current.parent_id:
        parent = files_db.get(current.parent_id)
        if not parent:
            break
        path_parts.insert(0, parent.name)
        current = parent

    return "/" + "/".join(path_parts)

def update_quota(user_id: str, size_delta: int, file_delta: int = 0, folder_delta: int = 0):
    """Update user storage quota."""
    if user_id not in quotas_db:
        quotas_db[user_id] = StorageQuota(user_id=user_id)

    quota = quotas_db[user_id]
    quota.used_bytes += size_delta
    quota.file_count += file_delta
    quota.folder_count += folder_delta

def check_quota(user_id: str, required_bytes: int):
    """Check if user has enough storage quota."""
    if user_id not in quotas_db:
        quotas_db[user_id] = StorageQuota(user_id=user_id)

    quota = quotas_db[user_id]
    if quota.used_bytes + required_bytes > quota.total_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Storage quota exceeded. Used: {quota.used_bytes}, Required: {required_bytes}, Total: {quota.total_bytes}"
        )

# ============== Folder Endpoints ==============

@app.post("/folders", response_model=FileItem)
async def create_folder(user_id: str, folder_data: FolderCreate):
    """Create a new folder."""
    # Check if parent exists
    if folder_data.parent_id:
        parent = get_file(folder_data.parent_id)
        if not parent.is_folder:
            raise HTTPException(status_code=400, detail="Parent is not a folder")

    # Check for duplicate name in same location
    existing = [f for f in files_db.values()
                if f.user_id == user_id
                and f.parent_id == folder_data.parent_id
                and f.name == folder_data.name
                and not f.is_trashed]
    if existing:
        raise HTTPException(status_code=409, detail="Folder with this name already exists")

    folder = FileItem(
        user_id=user_id,
        name=folder_data.name,
        parent_id=folder_data.parent_id,
        is_folder=True,
        color=folder_data.color,
        description=folder_data.description,
        created_by=user_id,
    )

    files_db[folder.id] = folder
    update_quota(user_id, 0, folder_delta=1)

    return folder

@app.get("/folders/{folder_id}/contents", response_model=Dict[str, Any])
async def list_folder_contents(
    folder_id: Optional[str] = None,
    user_id: str = Query(...),
    include_trashed: bool = False,
    sort_by: SortBy = SortBy.NAME,
    sort_order: str = "asc",
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """List contents of a folder."""
    items = [f for f in files_db.values()
             if f.user_id == user_id
             and f.parent_id == folder_id]

    if not include_trashed:
        items = [f for f in items if not f.is_trashed]

    # Sort
    reverse = sort_order == "desc"
    if sort_by == SortBy.NAME:
        items.sort(key=lambda x: x.name.lower(), reverse=reverse)
    elif sort_by == SortBy.SIZE:
        items.sort(key=lambda x: x.size, reverse=reverse)
    elif sort_by == SortBy.MODIFIED:
        items.sort(key=lambda x: x.updated_at, reverse=reverse)
    elif sort_by == SortBy.CREATED:
        items.sort(key=lambda x: x.created_at, reverse=reverse)
    elif sort_by == SortBy.TYPE:
        items.sort(key=lambda x: (not x.is_folder, x.file_type.value), reverse=reverse)

    # Folders first
    folders = [f for f in items if f.is_folder]
    files = [f for f in items if not f.is_folder]
    items = folders + files

    # Paginate
    start = (page - 1) * page_size
    end = start + page_size
    paginated = items[start:end]

    # Get breadcrumb path
    breadcrumb = []
    if folder_id:
        current = files_db.get(folder_id)
        while current:
            breadcrumb.insert(0, {"id": current.id, "name": current.name})
            current = files_db.get(current.parent_id) if current.parent_id else None

    return {
        "items": paginated,
        "total": len(items),
        "page": page,
        "page_size": page_size,
        "breadcrumb": breadcrumb,
        "folder_id": folder_id,
    }

# ============== File Endpoints ==============

@app.post("/files/upload", response_model=FileItem)
async def upload_file(
    user_id: str,
    file: UploadFile = File(...),
    parent_id: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
):
    """Upload a file."""
    content = await file.read()
    file_size = len(content)

    # Check quota
    check_quota(user_id, file_size)

    # Get file info
    filename = file.filename or "unnamed"
    extension = ""
    if "." in filename:
        extension = "." + filename.rsplit(".", 1)[1]

    mime_type = file.content_type or mimetypes.guess_type(filename)[0]
    file_type = get_file_type(mime_type, extension)
    file_hash = calculate_hash(content)

    # Check for duplicates
    duplicate = None
    for f in files_db.values():
        if f.user_id == user_id and f.hash == file_hash and not f.is_trashed:
            duplicate = f
            break

    # Create file record
    file_item = FileItem(
        user_id=user_id,
        name=filename,
        extension=extension,
        file_type=file_type,
        mime_type=mime_type,
        size=file_size,
        hash=file_hash,
        parent_id=parent_id,
        storage_path=f"/{user_id}/{str(uuid.uuid4())}{extension}",
        created_by=user_id,
    )

    # Store content (in real impl, upload to MinIO/S3)
    file_content_db[file_item.id] = content

    # Create initial version
    version = FileVersion(
        file_id=file_item.id,
        version_number=1,
        size=file_size,
        hash=file_hash,
        storage_path=file_item.storage_path,
        created_by=user_id,
    )
    versions_db[file_item.id] = [version]

    files_db[file_item.id] = file_item
    update_quota(user_id, file_size, file_delta=1)

    # Background: extract metadata, generate thumbnail, AI processing
    if background_tasks:
        background_tasks.add_task(process_file_async, file_item.id)

    response_data = file_item.model_dump()
    if duplicate:
        response_data["duplicate_warning"] = {
            "existing_file_id": duplicate.id,
            "existing_file_name": duplicate.name,
            "existing_path": get_folder_path(duplicate),
        }

    return file_item

@app.post("/files/upload-multiple")
async def upload_multiple_files(
    user_id: str,
    files: List[UploadFile] = File(...),
    parent_id: Optional[str] = None,
):
    """Upload multiple files."""
    results = []
    for file in files:
        try:
            result = await upload_file(user_id, file, parent_id)
            results.append({"status": "success", "file": result})
        except HTTPException as e:
            results.append({"status": "error", "filename": file.filename, "error": e.detail})

    return {
        "uploaded": len([r for r in results if r["status"] == "success"]),
        "failed": len([r for r in results if r["status"] == "error"]),
        "results": results,
    }

@app.get("/files/{file_id}")
async def get_file_info(file_id: str):
    """Get file information."""
    file = get_file(file_id)
    file.accessed_at = datetime.utcnow()
    return file

@app.get("/files/{file_id}/download")
async def download_file(file_id: str):
    """Download a file."""
    file = get_file(file_id)

    if file.is_folder:
        raise HTTPException(status_code=400, detail="Cannot download a folder directly")

    content = file_content_db.get(file_id)
    if not content:
        raise HTTPException(status_code=404, detail="File content not found")

    file.accessed_at = datetime.utcnow()

    return StreamingResponse(
        BytesIO(content),
        media_type=file.mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{file.name}"',
            "Content-Length": str(len(content)),
        }
    )

@app.put("/files/{file_id}", response_model=FileItem)
async def update_file(file_id: str, update: FileUpdate):
    """Update file metadata."""
    file = get_file(file_id)

    if update.name is not None:
        file.name = update.name
    if update.parent_id is not None:
        # Prevent circular reference
        if update.parent_id == file_id:
            raise HTTPException(status_code=400, detail="Cannot move file into itself")
        file.parent_id = update.parent_id
    if update.is_starred is not None:
        file.is_starred = update.is_starred
    if update.tags is not None:
        file.tags = update.tags
    if update.color is not None:
        file.color = update.color
    if update.description is not None:
        file.description = update.description

    file.updated_at = datetime.utcnow()
    return file

@app.delete("/files/{file_id}")
async def delete_file(file_id: str, permanent: bool = False):
    """Move file to trash or delete permanently."""
    file = get_file(file_id)

    if permanent:
        # Delete file content
        if file_id in file_content_db:
            del file_content_db[file_id]

        # Delete versions
        if file_id in versions_db:
            del versions_db[file_id]

        # Delete shares
        shares_to_delete = [s.id for s in shares_db.values() if s.file_id == file_id]
        for share_id in shares_to_delete:
            del shares_db[share_id]

        # Update quota
        update_quota(
            file.user_id,
            -file.size,
            file_delta=-1 if not file.is_folder else 0,
            folder_delta=-1 if file.is_folder else 0
        )

        # If folder, recursively delete contents
        if file.is_folder:
            children = [f.id for f in files_db.values() if f.parent_id == file_id]
            for child_id in children:
                await delete_file(child_id, permanent=True)

        del files_db[file_id]
        return {"message": "File permanently deleted"}
    else:
        file.is_trashed = True
        file.trashed_at = datetime.utcnow()
        return {"message": "File moved to trash"}

@app.post("/files/{file_id}/restore")
async def restore_file(file_id: str):
    """Restore file from trash."""
    file = get_file(file_id)
    file.is_trashed = False
    file.trashed_at = None
    file.updated_at = datetime.utcnow()
    return {"message": "File restored"}

@app.post("/files/{file_id}/copy", response_model=FileItem)
async def copy_file(file_id: str, destination_folder_id: Optional[str] = None):
    """Copy a file."""
    original = get_file(file_id)

    if original.is_folder:
        raise HTTPException(status_code=400, detail="Use copy-folder for folders")

    # Check quota
    check_quota(original.user_id, original.size)

    new_file = original.model_copy()
    new_file.id = str(uuid.uuid4())
    new_file.name = f"{original.name} (Copy)"
    new_file.parent_id = destination_folder_id
    new_file.created_at = datetime.utcnow()
    new_file.updated_at = datetime.utcnow()
    new_file.is_shared = False

    # Copy content
    if file_id in file_content_db:
        file_content_db[new_file.id] = file_content_db[file_id]

    files_db[new_file.id] = new_file
    update_quota(original.user_id, original.size, file_delta=1)

    return new_file

@app.post("/files/{file_id}/move", response_model=FileItem)
async def move_file(file_id: str, destination_folder_id: Optional[str] = None):
    """Move a file to another folder."""
    file = get_file(file_id)

    if destination_folder_id:
        dest = get_file(destination_folder_id)
        if not dest.is_folder:
            raise HTTPException(status_code=400, detail="Destination is not a folder")

        # Prevent moving folder into itself or its children
        if file.is_folder:
            current = dest
            while current:
                if current.id == file_id:
                    raise HTTPException(status_code=400, detail="Cannot move folder into itself")
                current = files_db.get(current.parent_id) if current.parent_id else None

    file.parent_id = destination_folder_id
    file.updated_at = datetime.utcnow()

    return file

# ============== Version Endpoints ==============

@app.get("/files/{file_id}/versions", response_model=List[FileVersion])
async def list_file_versions(file_id: str):
    """List all versions of a file."""
    get_file(file_id)  # Verify file exists
    return versions_db.get(file_id, [])

@app.post("/files/{file_id}/versions")
async def upload_new_version(
    file_id: str,
    file: UploadFile = File(...),
    comment: Optional[str] = None,
):
    """Upload a new version of a file."""
    existing = get_file(file_id)
    content = await file.read()
    file_size = len(content)

    # Check quota (difference between old and new)
    size_diff = file_size - existing.size
    if size_diff > 0:
        check_quota(existing.user_id, size_diff)

    file_hash = calculate_hash(content)

    # Update file
    old_size = existing.size
    existing.size = file_size
    existing.hash = file_hash
    existing.version += 1
    existing.updated_at = datetime.utcnow()

    # Store content
    file_content_db[file_id] = content

    # Create version record
    version = FileVersion(
        file_id=file_id,
        version_number=existing.version,
        size=file_size,
        hash=file_hash,
        storage_path=existing.storage_path,
        created_by=existing.user_id,
        comment=comment,
    )

    if file_id not in versions_db:
        versions_db[file_id] = []
    versions_db[file_id].append(version)

    # Update quota
    update_quota(existing.user_id, size_diff)

    return {
        "message": "New version uploaded",
        "version": existing.version,
        "version_id": version.id,
    }

@app.post("/files/{file_id}/versions/{version_id}/restore")
async def restore_file_version(file_id: str, version_id: str):
    """Restore a previous version of a file."""
    file = get_file(file_id)
    versions = versions_db.get(file_id, [])

    version = None
    for v in versions:
        if v.id == version_id:
            version = v
            break

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # In real implementation, restore content from version's storage path
    file.version += 1
    file.size = version.size
    file.hash = version.hash
    file.updated_at = datetime.utcnow()

    return {"message": f"Restored to version {version.version_number}"}

# ============== Share Endpoints ==============

@app.post("/files/{file_id}/share", response_model=FileShare)
async def share_file(
    file_id: str,
    user_id: str,
    share_type: ShareType = ShareType.LINK,
    shared_with: Optional[str] = None,
    permission: SharePermission = SharePermission.VIEW,
    expires_in_days: Optional[int] = None,
    password: Optional[str] = None,
    allow_download: bool = True,
):
    """Share a file or folder."""
    file = get_file(file_id)

    share = FileShare(
        file_id=file_id,
        shared_by=user_id,
        share_type=share_type,
        shared_with=shared_with,
        permission=permission,
        allow_download=allow_download,
    )

    if share_type == ShareType.LINK:
        share.link_token = str(uuid.uuid4())[:12]

    if expires_in_days:
        share.expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

    if password:
        share.password_protected = True
        share.password_hash = hashlib.sha256(password.encode()).hexdigest()

    shares_db[share.id] = share
    file.is_shared = True

    return share

@app.get("/files/{file_id}/shares", response_model=List[FileShare])
async def list_file_shares(file_id: str):
    """List all shares for a file."""
    get_file(file_id)
    return [s for s in shares_db.values() if s.file_id == file_id]

@app.delete("/shares/{share_id}")
async def remove_share(share_id: str):
    """Remove a share."""
    if share_id not in shares_db:
        raise HTTPException(status_code=404, detail="Share not found")

    share = shares_db[share_id]
    file_id = share.file_id

    del shares_db[share_id]

    # Update file is_shared status
    remaining_shares = [s for s in shares_db.values() if s.file_id == file_id]
    if not remaining_shares and file_id in files_db:
        files_db[file_id].is_shared = False

    return {"message": "Share removed"}

@app.get("/shared/link/{link_token}")
async def access_shared_link(link_token: str, password: Optional[str] = None):
    """Access a file via shared link."""
    share = None
    for s in shares_db.values():
        if s.link_token == link_token:
            share = s
            break

    if not share:
        raise HTTPException(status_code=404, detail="Invalid link")

    # Check expiration
    if share.expires_at and datetime.utcnow() > share.expires_at:
        raise HTTPException(status_code=410, detail="Link has expired")

    # Check download limit
    if share.download_limit and share.download_count >= share.download_limit:
        raise HTTPException(status_code=410, detail="Download limit reached")

    # Check password
    if share.password_protected:
        if not password:
            raise HTTPException(status_code=401, detail="Password required")
        if hashlib.sha256(password.encode()).hexdigest() != share.password_hash:
            raise HTTPException(status_code=401, detail="Invalid password")

    file = get_file(share.file_id)

    return {
        "file": file,
        "permission": share.permission,
        "allow_download": share.allow_download,
    }

# ============== Starred & Recent ==============

@app.get("/starred", response_model=List[FileItem])
async def list_starred(user_id: str):
    """List starred files."""
    return [f for f in files_db.values()
            if f.user_id == user_id and f.is_starred and not f.is_trashed]

@app.get("/recent", response_model=List[FileItem])
async def list_recent(
    user_id: str,
    limit: int = Query(20, ge=1, le=100),
):
    """List recently accessed files."""
    files = [f for f in files_db.values()
             if f.user_id == user_id and not f.is_trashed and f.accessed_at]
    files.sort(key=lambda x: x.accessed_at or datetime.min, reverse=True)
    return files[:limit]

@app.get("/trash", response_model=List[FileItem])
async def list_trash(user_id: str):
    """List files in trash."""
    return [f for f in files_db.values()
            if f.user_id == user_id and f.is_trashed]

@app.post("/trash/empty")
async def empty_trash(user_id: str):
    """Empty the trash."""
    trashed = [f.id for f in files_db.values()
               if f.user_id == user_id and f.is_trashed]

    for file_id in trashed:
        await delete_file(file_id, permanent=True)

    return {"message": f"Deleted {len(trashed)} items from trash"}

# ============== Quota ==============

@app.get("/quota/{user_id}", response_model=StorageQuota)
async def get_quota(user_id: str):
    """Get storage quota for a user."""
    if user_id not in quotas_db:
        quotas_db[user_id] = StorageQuota(user_id=user_id)
    return quotas_db[user_id]

# ============== AI Features ==============

async def process_file_async(file_id: str):
    """Background task to process file with AI."""
    # In real implementation:
    # - Extract text from documents
    # - Generate thumbnails
    # - Calculate embeddings
    # - Auto-tag
    await asyncio.sleep(0.1)  # Simulate processing

    if file_id in files_db:
        file = files_db[file_id]
        file.ai_tags = ["auto-tagged"]
        file.ai_category = file.file_type.value

@app.post("/ai/search")
async def ai_semantic_search(user_id: str, request: AISearchRequest):
    """AI-powered semantic search across files."""
    files = [f for f in files_db.values()
             if f.user_id == user_id]

    if not request.include_trashed:
        files = [f for f in files if not f.is_trashed]

    if request.file_types:
        files = [f for f in files if f.file_type in request.file_types]

    if request.folder_id:
        files = [f for f in files if f.parent_id == request.folder_id]

    if request.date_from:
        files = [f for f in files if f.created_at >= request.date_from]

    if request.date_to:
        files = [f for f in files if f.created_at <= request.date_to]

    if request.size_min:
        files = [f for f in files if f.size >= request.size_min]

    if request.size_max:
        files = [f for f in files if f.size <= request.size_max]

    # Simple keyword search (real impl would use embeddings)
    query_lower = request.query.lower()
    results = []
    for file in files:
        score = 0
        if query_lower in file.name.lower():
            score += 0.5
        if any(query_lower in tag.lower() for tag in file.tags):
            score += 0.3
        if file.description and query_lower in file.description.lower():
            score += 0.2
        if file.metadata and file.metadata.extracted_text:
            if query_lower in file.metadata.extracted_text.lower():
                score += 0.4

        if score > 0:
            results.append({
                "file": file,
                "score": score,
                "matched_on": "content",
            })

    results.sort(key=lambda x: x["score"], reverse=True)

    return {
        "query": request.query,
        "results": results[:request.limit],
        "total": len(results),
    }

@app.post("/ai/organize")
async def ai_organize_files(user_id: str, request: AIOrganizeRequest):
    """AI-powered file organization suggestions."""
    files = []
    if request.file_ids:
        files = [files_db[fid] for fid in request.file_ids if fid in files_db]
    else:
        files = [f for f in files_db.values()
                 if f.user_id == user_id and not f.is_folder and not f.is_trashed]

    suggestions = []

    if request.strategy == "by_type" or request.strategy == "auto":
        # Group by file type
        by_type = {}
        for f in files:
            file_type = f.file_type.value
            if file_type not in by_type:
                by_type[file_type] = []
            by_type[file_type].append(f.id)

        for file_type, file_ids in by_type.items():
            if len(file_ids) > 1:
                suggestions.append({
                    "action": "create_folder",
                    "folder_name": file_type.capitalize() + "s",
                    "move_files": file_ids,
                    "reason": f"Group {len(file_ids)} {file_type} files",
                })

    if request.strategy == "by_date" or request.strategy == "auto":
        # Group by month
        by_month = {}
        for f in files:
            month_key = f.created_at.strftime("%Y-%m")
            if month_key not in by_month:
                by_month[month_key] = []
            by_month[month_key].append(f.id)

        for month, file_ids in by_month.items():
            if len(file_ids) > 3:
                suggestions.append({
                    "action": "create_folder",
                    "folder_name": month,
                    "move_files": file_ids,
                    "reason": f"Group {len(file_ids)} files from {month}",
                })

    return {
        "analyzed_files": len(files),
        "suggestions": suggestions[:10],
        "strategy": request.strategy,
    }

@app.post("/ai/find-duplicates", response_model=List[AIDuplicateResult])
async def ai_find_duplicates(user_id: str):
    """Find duplicate files."""
    files = [f for f in files_db.values()
             if f.user_id == user_id and not f.is_folder and not f.is_trashed]

    # Group by hash
    by_hash = {}
    for f in files:
        if f.hash:
            if f.hash not in by_hash:
                by_hash[f.hash] = []
            by_hash[f.hash].append(f)

    results = []
    for file_hash, duplicates in by_hash.items():
        if len(duplicates) > 1:
            # Oldest file is the "original"
            duplicates.sort(key=lambda x: x.created_at)
            original = duplicates[0]
            dupes = duplicates[1:]

            results.append(AIDuplicateResult(
                original_id=original.id,
                original_name=original.name,
                duplicates=[{
                    "id": d.id,
                    "name": d.name,
                    "path": get_folder_path(d),
                    "created_at": d.created_at.isoformat(),
                } for d in dupes],
                total_space_recoverable=sum(d.size for d in dupes),
            ))

    return results

@app.post("/ai/auto-tag")
async def ai_auto_tag(file_id: str):
    """Auto-generate tags for a file using AI."""
    file = get_file(file_id)

    # In real implementation, use AI to analyze content
    suggested_tags = []

    # Based on file type
    suggested_tags.append(file.file_type.value)

    # Based on name
    name_parts = file.name.lower().replace("_", " ").replace("-", " ").split()
    suggested_tags.extend([p for p in name_parts if len(p) > 3][:3])

    # Based on date
    suggested_tags.append(file.created_at.strftime("%Y"))

    file.ai_tags = list(set(suggested_tags))

    return {
        "file_id": file_id,
        "suggested_tags": file.ai_tags,
    }

@app.post("/ai/summarize-folder")
async def ai_summarize_folder(folder_id: str):
    """AI-powered folder content summary."""
    folder = get_file(folder_id)
    if not folder.is_folder:
        raise HTTPException(status_code=400, detail="Not a folder")

    contents = [f for f in files_db.values() if f.parent_id == folder_id]
    folders = [f for f in contents if f.is_folder]
    files = [f for f in contents if not f.is_folder]

    total_size = sum(f.size for f in files)
    by_type = {}
    for f in files:
        if f.file_type.value not in by_type:
            by_type[f.file_type.value] = {"count": 0, "size": 0}
        by_type[f.file_type.value]["count"] += 1
        by_type[f.file_type.value]["size"] += f.size

    return {
        "folder_name": folder.name,
        "summary": {
            "total_items": len(contents),
            "files": len(files),
            "folders": len(folders),
            "total_size_bytes": total_size,
            "total_size_readable": f"{total_size / (1024*1024):.2f} MB",
        },
        "by_type": by_type,
        "recent_files": sorted(files, key=lambda x: x.updated_at, reverse=True)[:5],
        "largest_files": sorted(files, key=lambda x: x.size, reverse=True)[:5],
    }

@app.post("/ai/extract-text")
async def ai_extract_text(file_id: str):
    """Extract text content from files (OCR, PDF, etc.)."""
    file = get_file(file_id)

    # In real implementation, use appropriate extraction method
    extracted_text = f"[Extracted text from {file.name} would appear here]"

    if not file.metadata:
        file.metadata = FileMetadata()
    file.metadata.extracted_text = extracted_text

    return {
        "file_id": file_id,
        "extracted_text": extracted_text,
        "confidence": 0.95,
    }

# ============== Statistics ==============

@app.get("/stats/{user_id}")
async def get_storage_stats(user_id: str):
    """Get storage statistics for a user."""
    files = [f for f in files_db.values() if f.user_id == user_id]
    active_files = [f for f in files if not f.is_trashed and not f.is_folder]

    quota = quotas_db.get(user_id, StorageQuota(user_id=user_id))

    by_type = {}
    for f in active_files:
        if f.file_type.value not in by_type:
            by_type[f.file_type.value] = {"count": 0, "size": 0}
        by_type[f.file_type.value]["count"] += 1
        by_type[f.file_type.value]["size"] += f.size

    return {
        "quota": {
            "total_bytes": quota.total_bytes,
            "used_bytes": quota.used_bytes,
            "available_bytes": quota.total_bytes - quota.used_bytes,
            "usage_percentage": (quota.used_bytes / quota.total_bytes * 100) if quota.total_bytes > 0 else 0,
        },
        "counts": {
            "total_files": len(active_files),
            "total_folders": len([f for f in files if f.is_folder and not f.is_trashed]),
            "trashed_items": len([f for f in files if f.is_trashed]),
            "shared_files": len([f for f in active_files if f.is_shared]),
            "starred_files": len([f for f in active_files if f.is_starred]),
        },
        "by_type": by_type,
        "recent_uploads": sorted(active_files, key=lambda x: x.created_at, reverse=True)[:10],
    }

# ============== Health Check ==============

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-drive",
        "version": "1.0.0",
        "files": len(files_db),
        "total_storage": sum(f.size for f in files_db.values() if not f.is_folder),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)

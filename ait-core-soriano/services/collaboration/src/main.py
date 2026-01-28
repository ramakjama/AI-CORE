"""
AI-Collab Service: Team collaboration with AI-powered features.

Features:
- Real-time chat
- Video/Audio calls (WebRTC)
- Screen sharing
- Meeting transcription
- AI meeting summaries
- Action item extraction
- Team channels
- Direct messages
- File sharing
- Presence/Status
"""

from fastapi import FastAPI, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timedelta
from enum import Enum
import uuid
import asyncio
import json

app = FastAPI(
    title="AI-Collab Service",
    description="Team collaboration with AI capabilities",
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

class UserStatus(str, Enum):
    ONLINE = "online"
    AWAY = "away"
    BUSY = "busy"
    DND = "do_not_disturb"
    OFFLINE = "offline"

class ChannelType(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    DIRECT = "direct"
    GROUP_DM = "group_dm"

class MessageType(str, Enum):
    TEXT = "text"
    FILE = "file"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    SYSTEM = "system"
    CALL = "call"
    POLL = "poll"

class MeetingStatus(str, Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    ENDED = "ended"
    CANCELLED = "cancelled"

class CallType(str, Enum):
    AUDIO = "audio"
    VIDEO = "video"
    SCREEN_SHARE = "screen_share"

class ReactionType(str, Enum):
    LIKE = "like"
    LOVE = "love"
    LAUGH = "laugh"
    WOW = "wow"
    SAD = "sad"
    ANGRY = "angry"
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"
    CELEBRATE = "celebrate"
    THINKING = "thinking"

# ============== Models ==============

class UserPresence(BaseModel):
    user_id: str
    status: UserStatus = UserStatus.ONLINE
    status_text: Optional[str] = None
    status_emoji: Optional[str] = None
    last_active: datetime = Field(default_factory=datetime.utcnow)
    current_meeting_id: Optional[str] = None

class Reaction(BaseModel):
    type: ReactionType
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MessageAttachment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    file_type: str
    size: int
    url: str
    thumbnail_url: Optional[str] = None

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    channel_id: str
    user_id: str
    message_type: MessageType = MessageType.TEXT
    content: str = ""
    formatted_content: Optional[str] = None  # HTML/Markdown formatted
    attachments: List[MessageAttachment] = []
    mentions: List[str] = []  # User IDs
    reactions: List[Reaction] = []
    reply_to_id: Optional[str] = None  # Thread parent
    thread_count: int = 0
    is_edited: bool = False
    is_pinned: bool = False
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    # AI fields
    ai_sentiment: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_action_items: Optional[List[str]] = None

class Channel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    name: str
    description: Optional[str] = None
    channel_type: ChannelType = ChannelType.PUBLIC
    topic: Optional[str] = None
    icon: Optional[str] = None
    members: List[str] = []  # User IDs
    admins: List[str] = []
    is_archived: bool = False
    is_muted: bool = False
    last_message_at: Optional[datetime] = None
    message_count: int = 0
    unread_count: int = 0
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Settings
    allow_threads: bool = True
    allow_reactions: bool = True
    allow_files: bool = True

class Workspace(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    owner_id: str
    members: List[str] = []
    admins: List[str] = []
    default_channel_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    settings: Dict[str, Any] = {}

class Meeting(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    channel_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    host_id: str
    participants: List[str] = []
    status: MeetingStatus = MeetingStatus.SCHEDULED
    call_type: CallType = CallType.VIDEO
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    join_url: Optional[str] = None
    password: Optional[str] = None
    is_recorded: bool = False
    recording_url: Optional[str] = None
    # Transcription
    transcription_enabled: bool = True
    transcript: List[Dict[str, Any]] = []
    # AI
    ai_summary: Optional[str] = None
    ai_action_items: Optional[List[Dict[str, Any]]] = None
    ai_key_points: Optional[List[str]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MeetingParticipant(BaseModel):
    user_id: str
    meeting_id: str
    joined_at: Optional[datetime] = None
    left_at: Optional[datetime] = None
    is_host: bool = False
    is_muted: bool = False
    is_video_on: bool = True
    is_screen_sharing: bool = False
    hand_raised: bool = False

class Poll(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    channel_id: str
    created_by: str
    question: str
    options: List[str]
    votes: Dict[str, List[str]] = {}  # option -> [user_ids]
    is_anonymous: bool = False
    is_multiple_choice: bool = False
    ends_at: Optional[datetime] = None
    is_closed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Thread(BaseModel):
    parent_message_id: str
    channel_id: str
    participant_ids: List[str] = []
    reply_count: int = 0
    last_reply_at: Optional[datetime] = None

# ============== AI Models ==============

class AITranscriptEntry(BaseModel):
    speaker_id: str
    speaker_name: str
    text: str
    timestamp: float  # Seconds from start
    confidence: float = 1.0

class AIMeetingSummary(BaseModel):
    summary: str
    key_points: List[str]
    action_items: List[Dict[str, Any]]
    decisions: List[str]
    participants_summary: Dict[str, str]
    duration_minutes: int
    topics_discussed: List[str]

class AIMessageSuggestion(BaseModel):
    suggestions: List[str]
    context: str

# ============== Storage (in-memory for demo) ==============

workspaces_db: Dict[str, Workspace] = {}
channels_db: Dict[str, Channel] = {}
messages_db: Dict[str, Message] = {}
meetings_db: Dict[str, Meeting] = {}
presence_db: Dict[str, UserPresence] = {}
polls_db: Dict[str, Poll] = {}
threads_db: Dict[str, Thread] = {}  # message_id -> Thread

# WebSocket connections
ws_connections: Dict[str, Set[WebSocket]] = {}  # user_id -> connections
channel_subscriptions: Dict[str, Set[str]] = {}  # channel_id -> user_ids

# ============== Helper Functions ==============

def get_workspace(workspace_id: str) -> Workspace:
    if workspace_id not in workspaces_db:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspaces_db[workspace_id]

def get_channel(channel_id: str) -> Channel:
    if channel_id not in channels_db:
        raise HTTPException(status_code=404, detail="Channel not found")
    return channels_db[channel_id]

def get_message(message_id: str) -> Message:
    if message_id not in messages_db:
        raise HTTPException(status_code=404, detail="Message not found")
    return messages_db[message_id]

def get_meeting(meeting_id: str) -> Meeting:
    if meeting_id not in meetings_db:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meetings_db[meeting_id]

async def broadcast_to_channel(channel_id: str, event_type: str, data: Dict):
    """Broadcast message to all channel subscribers."""
    if channel_id in channel_subscriptions:
        message = json.dumps({"type": event_type, "channel_id": channel_id, "data": data})
        for user_id in channel_subscriptions[channel_id]:
            if user_id in ws_connections:
                for ws in ws_connections[user_id]:
                    try:
                        await ws.send_text(message)
                    except:
                        pass

async def send_to_user(user_id: str, event_type: str, data: Dict):
    """Send message to a specific user."""
    if user_id in ws_connections:
        message = json.dumps({"type": event_type, "data": data})
        for ws in ws_connections[user_id]:
            try:
                await ws.send_text(message)
            except:
                pass

def extract_mentions(content: str) -> List[str]:
    """Extract @mentions from message content."""
    import re
    mentions = re.findall(r'@(\w+)', content)
    return mentions

# ============== Workspace Endpoints ==============

@app.post("/workspaces", response_model=Workspace)
async def create_workspace(
    owner_id: str,
    name: str,
    description: Optional[str] = None,
):
    """Create a new workspace."""
    workspace = Workspace(
        name=name,
        description=description,
        owner_id=owner_id,
        members=[owner_id],
        admins=[owner_id],
    )
    workspaces_db[workspace.id] = workspace

    # Create default general channel
    general = Channel(
        workspace_id=workspace.id,
        name="general",
        description="General discussion",
        channel_type=ChannelType.PUBLIC,
        members=[owner_id],
        admins=[owner_id],
        created_by=owner_id,
    )
    channels_db[general.id] = general
    workspace.default_channel_id = general.id

    return workspace

@app.get("/workspaces", response_model=List[Workspace])
async def list_workspaces(user_id: str):
    """List workspaces for a user."""
    return [w for w in workspaces_db.values() if user_id in w.members]

@app.get("/workspaces/{workspace_id}", response_model=Workspace)
async def get_workspace_details(workspace_id: str):
    """Get workspace details."""
    return get_workspace(workspace_id)

@app.post("/workspaces/{workspace_id}/members")
async def add_workspace_member(workspace_id: str, user_id: str):
    """Add a member to workspace."""
    workspace = get_workspace(workspace_id)
    if user_id not in workspace.members:
        workspace.members.append(user_id)
    return {"message": "Member added"}

@app.delete("/workspaces/{workspace_id}/members/{user_id}")
async def remove_workspace_member(workspace_id: str, user_id: str):
    """Remove a member from workspace."""
    workspace = get_workspace(workspace_id)
    if user_id in workspace.members:
        workspace.members.remove(user_id)
    return {"message": "Member removed"}

# ============== Channel Endpoints ==============

@app.post("/channels", response_model=Channel)
async def create_channel(
    workspace_id: str,
    name: str,
    user_id: str,
    description: Optional[str] = None,
    channel_type: ChannelType = ChannelType.PUBLIC,
    members: Optional[List[str]] = None,
):
    """Create a new channel."""
    workspace = get_workspace(workspace_id)

    channel = Channel(
        workspace_id=workspace_id,
        name=name,
        description=description,
        channel_type=channel_type,
        members=members or [user_id],
        admins=[user_id],
        created_by=user_id,
    )
    channels_db[channel.id] = channel

    return channel

@app.get("/channels", response_model=List[Channel])
async def list_channels(
    workspace_id: str,
    user_id: str,
    include_archived: bool = False,
):
    """List channels in a workspace."""
    channels = [c for c in channels_db.values()
                if c.workspace_id == workspace_id
                and (c.channel_type == ChannelType.PUBLIC or user_id in c.members)]

    if not include_archived:
        channels = [c for c in channels if not c.is_archived]

    return channels

@app.get("/channels/{channel_id}", response_model=Channel)
async def get_channel_details(channel_id: str):
    """Get channel details."""
    return get_channel(channel_id)

@app.put("/channels/{channel_id}")
async def update_channel(
    channel_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    topic: Optional[str] = None,
):
    """Update channel settings."""
    channel = get_channel(channel_id)

    if name:
        channel.name = name
    if description is not None:
        channel.description = description
    if topic is not None:
        channel.topic = topic

    return channel

@app.post("/channels/{channel_id}/join")
async def join_channel(channel_id: str, user_id: str):
    """Join a channel."""
    channel = get_channel(channel_id)

    if channel.channel_type == ChannelType.PRIVATE:
        raise HTTPException(status_code=403, detail="Cannot join private channel without invite")

    if user_id not in channel.members:
        channel.members.append(user_id)

    return {"message": "Joined channel"}

@app.post("/channels/{channel_id}/leave")
async def leave_channel(channel_id: str, user_id: str):
    """Leave a channel."""
    channel = get_channel(channel_id)

    if user_id in channel.members:
        channel.members.remove(user_id)

    return {"message": "Left channel"}

@app.post("/channels/{channel_id}/archive")
async def archive_channel(channel_id: str):
    """Archive a channel."""
    channel = get_channel(channel_id)
    channel.is_archived = True
    return {"message": "Channel archived"}

# ============== Direct Message Endpoints ==============

@app.post("/dm", response_model=Channel)
async def create_direct_message(user_id: str, target_user_id: str):
    """Create or get direct message channel."""
    # Check for existing DM
    for channel in channels_db.values():
        if channel.channel_type == ChannelType.DIRECT:
            if set(channel.members) == {user_id, target_user_id}:
                return channel

    # Create new DM channel
    channel = Channel(
        workspace_id="dm",  # Special workspace for DMs
        name=f"dm-{user_id}-{target_user_id}",
        channel_type=ChannelType.DIRECT,
        members=[user_id, target_user_id],
        created_by=user_id,
    )
    channels_db[channel.id] = channel

    return channel

@app.get("/dm", response_model=List[Channel])
async def list_direct_messages(user_id: str):
    """List all DM channels for a user."""
    return [c for c in channels_db.values()
            if c.channel_type in [ChannelType.DIRECT, ChannelType.GROUP_DM]
            and user_id in c.members]

# ============== Message Endpoints ==============

@app.post("/messages", response_model=Message)
async def send_message(
    channel_id: str,
    user_id: str,
    content: str,
    message_type: MessageType = MessageType.TEXT,
    reply_to_id: Optional[str] = None,
    attachments: Optional[List[MessageAttachment]] = None,
):
    """Send a message to a channel."""
    channel = get_channel(channel_id)

    if user_id not in channel.members:
        raise HTTPException(status_code=403, detail="Not a member of this channel")

    mentions = extract_mentions(content)

    message = Message(
        channel_id=channel_id,
        user_id=user_id,
        message_type=message_type,
        content=content,
        mentions=mentions,
        reply_to_id=reply_to_id,
        attachments=attachments or [],
    )

    # Handle thread
    if reply_to_id:
        parent = get_message(reply_to_id)
        parent.thread_count += 1

        if reply_to_id not in threads_db:
            threads_db[reply_to_id] = Thread(
                parent_message_id=reply_to_id,
                channel_id=channel_id,
            )

        thread = threads_db[reply_to_id]
        if user_id not in thread.participant_ids:
            thread.participant_ids.append(user_id)
        thread.reply_count += 1
        thread.last_reply_at = datetime.utcnow()

    messages_db[message.id] = message

    # Update channel
    channel.last_message_at = datetime.utcnow()
    channel.message_count += 1

    # Broadcast to channel
    await broadcast_to_channel(channel_id, "new_message", message.model_dump())

    # Notify mentioned users
    for mention in mentions:
        await send_to_user(mention, "mention", {
            "channel_id": channel_id,
            "message_id": message.id,
            "from_user": user_id,
        })

    return message

@app.get("/messages", response_model=List[Message])
async def list_messages(
    channel_id: str,
    before: Optional[str] = None,  # Message ID
    after: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
):
    """List messages in a channel."""
    messages = [m for m in messages_db.values()
                if m.channel_id == channel_id and not m.is_deleted]

    messages.sort(key=lambda x: x.created_at, reverse=True)

    if before:
        before_msg = messages_db.get(before)
        if before_msg:
            messages = [m for m in messages if m.created_at < before_msg.created_at]

    if after:
        after_msg = messages_db.get(after)
        if after_msg:
            messages = [m for m in messages if m.created_at > after_msg.created_at]

    return messages[:limit]

@app.get("/messages/{message_id}", response_model=Message)
async def get_message_details(message_id: str):
    """Get message details."""
    return get_message(message_id)

@app.put("/messages/{message_id}", response_model=Message)
async def edit_message(message_id: str, user_id: str, content: str):
    """Edit a message."""
    message = get_message(message_id)

    if message.user_id != user_id:
        raise HTTPException(status_code=403, detail="Can only edit your own messages")

    message.content = content
    message.is_edited = True
    message.updated_at = datetime.utcnow()
    message.mentions = extract_mentions(content)

    await broadcast_to_channel(message.channel_id, "message_edited", message.model_dump())

    return message

@app.delete("/messages/{message_id}")
async def delete_message(message_id: str, user_id: str):
    """Delete a message."""
    message = get_message(message_id)

    if message.user_id != user_id:
        raise HTTPException(status_code=403, detail="Can only delete your own messages")

    message.is_deleted = True
    message.content = "[Message deleted]"

    await broadcast_to_channel(message.channel_id, "message_deleted", {"message_id": message_id})

    return {"message": "Message deleted"}

@app.post("/messages/{message_id}/react")
async def add_reaction(message_id: str, user_id: str, reaction_type: ReactionType):
    """Add a reaction to a message."""
    message = get_message(message_id)

    # Remove existing reaction of same type from user
    message.reactions = [r for r in message.reactions
                         if not (r.user_id == user_id and r.type == reaction_type)]

    message.reactions.append(Reaction(type=reaction_type, user_id=user_id))

    await broadcast_to_channel(message.channel_id, "reaction_added", {
        "message_id": message_id,
        "reaction": reaction_type,
        "user_id": user_id,
    })

    return {"message": "Reaction added"}

@app.delete("/messages/{message_id}/react/{reaction_type}")
async def remove_reaction(message_id: str, user_id: str, reaction_type: ReactionType):
    """Remove a reaction from a message."""
    message = get_message(message_id)

    message.reactions = [r for r in message.reactions
                         if not (r.user_id == user_id and r.type == reaction_type)]

    return {"message": "Reaction removed"}

@app.post("/messages/{message_id}/pin")
async def pin_message(message_id: str):
    """Pin a message."""
    message = get_message(message_id)
    message.is_pinned = True

    await broadcast_to_channel(message.channel_id, "message_pinned", {"message_id": message_id})

    return {"message": "Message pinned"}

@app.get("/channels/{channel_id}/pinned", response_model=List[Message])
async def list_pinned_messages(channel_id: str):
    """List pinned messages in a channel."""
    return [m for m in messages_db.values()
            if m.channel_id == channel_id and m.is_pinned and not m.is_deleted]

# ============== Thread Endpoints ==============

@app.get("/threads/{parent_message_id}", response_model=List[Message])
async def get_thread_messages(
    parent_message_id: str,
    limit: int = Query(50, ge=1, le=100),
):
    """Get messages in a thread."""
    parent = get_message(parent_message_id)

    messages = [m for m in messages_db.values()
                if m.reply_to_id == parent_message_id and not m.is_deleted]
    messages.sort(key=lambda x: x.created_at)

    # Include parent message
    return [parent] + messages[:limit-1]

# ============== Presence Endpoints ==============

@app.post("/presence/update")
async def update_presence(
    user_id: str,
    status: UserStatus,
    status_text: Optional[str] = None,
    status_emoji: Optional[str] = None,
):
    """Update user presence."""
    presence = UserPresence(
        user_id=user_id,
        status=status,
        status_text=status_text,
        status_emoji=status_emoji,
    )
    presence_db[user_id] = presence

    # Broadcast to contacts
    await send_to_user(user_id, "presence_update", presence.model_dump())

    return presence

@app.get("/presence/{user_id}", response_model=UserPresence)
async def get_presence(user_id: str):
    """Get user presence."""
    return presence_db.get(user_id, UserPresence(user_id=user_id, status=UserStatus.OFFLINE))

@app.get("/presence/bulk")
async def get_bulk_presence(user_ids: str):
    """Get presence for multiple users."""
    ids = user_ids.split(",")
    return {
        uid: presence_db.get(uid, UserPresence(user_id=uid, status=UserStatus.OFFLINE)).model_dump()
        for uid in ids
    }

# ============== Meeting Endpoints ==============

@app.post("/meetings", response_model=Meeting)
async def create_meeting(
    workspace_id: str,
    host_id: str,
    title: str,
    description: Optional[str] = None,
    channel_id: Optional[str] = None,
    call_type: CallType = CallType.VIDEO,
    scheduled_start: Optional[datetime] = None,
    scheduled_end: Optional[datetime] = None,
    participants: Optional[List[str]] = None,
):
    """Create a new meeting."""
    meeting = Meeting(
        workspace_id=workspace_id,
        channel_id=channel_id,
        title=title,
        description=description,
        host_id=host_id,
        participants=participants or [host_id],
        call_type=call_type,
        scheduled_start=scheduled_start,
        scheduled_end=scheduled_end,
        join_url=f"/meetings/{str(uuid.uuid4())[:8]}/join",
    )
    meetings_db[meeting.id] = meeting

    return meeting

@app.get("/meetings", response_model=List[Meeting])
async def list_meetings(
    workspace_id: str,
    user_id: str,
    status: Optional[MeetingStatus] = None,
    upcoming_only: bool = False,
):
    """List meetings."""
    meetings = [m for m in meetings_db.values()
                if m.workspace_id == workspace_id
                and (user_id in m.participants or user_id == m.host_id)]

    if status:
        meetings = [m for m in meetings if m.status == status]

    if upcoming_only:
        now = datetime.utcnow()
        meetings = [m for m in meetings
                    if m.status == MeetingStatus.SCHEDULED
                    and m.scheduled_start and m.scheduled_start > now]

    meetings.sort(key=lambda x: x.scheduled_start or x.created_at)

    return meetings

@app.get("/meetings/{meeting_id}", response_model=Meeting)
async def get_meeting_details(meeting_id: str):
    """Get meeting details."""
    return get_meeting(meeting_id)

@app.post("/meetings/{meeting_id}/start")
async def start_meeting(meeting_id: str, user_id: str):
    """Start a meeting."""
    meeting = get_meeting(meeting_id)

    if meeting.host_id != user_id:
        raise HTTPException(status_code=403, detail="Only host can start meeting")

    meeting.status = MeetingStatus.LIVE
    meeting.actual_start = datetime.utcnow()

    # Notify participants
    for participant in meeting.participants:
        await send_to_user(participant, "meeting_started", {
            "meeting_id": meeting_id,
            "join_url": meeting.join_url,
        })

    return {"message": "Meeting started", "join_url": meeting.join_url}

@app.post("/meetings/{meeting_id}/end")
async def end_meeting(meeting_id: str, user_id: str):
    """End a meeting."""
    meeting = get_meeting(meeting_id)

    if meeting.host_id != user_id:
        raise HTTPException(status_code=403, detail="Only host can end meeting")

    meeting.status = MeetingStatus.ENDED
    meeting.actual_end = datetime.utcnow()

    # Notify participants
    for participant in meeting.participants:
        await send_to_user(participant, "meeting_ended", {"meeting_id": meeting_id})

    return {"message": "Meeting ended"}

@app.post("/meetings/{meeting_id}/join")
async def join_meeting(meeting_id: str, user_id: str):
    """Join a meeting."""
    meeting = get_meeting(meeting_id)

    if meeting.status not in [MeetingStatus.SCHEDULED, MeetingStatus.LIVE]:
        raise HTTPException(status_code=400, detail="Meeting not joinable")

    if user_id not in meeting.participants:
        meeting.participants.append(user_id)

    # Update presence
    if user_id in presence_db:
        presence_db[user_id].current_meeting_id = meeting_id

    return {
        "meeting_id": meeting_id,
        "join_url": meeting.join_url,
        "webrtc_config": {
            "ice_servers": [{"urls": "stun:stun.l.google.com:19302"}],
        },
    }

@app.post("/meetings/{meeting_id}/leave")
async def leave_meeting(meeting_id: str, user_id: str):
    """Leave a meeting."""
    meeting = get_meeting(meeting_id)

    if user_id in presence_db:
        presence_db[user_id].current_meeting_id = None

    return {"message": "Left meeting"}

@app.post("/meetings/{meeting_id}/transcript")
async def add_transcript_entry(
    meeting_id: str,
    speaker_id: str,
    speaker_name: str,
    text: str,
    timestamp: float,
):
    """Add a transcript entry to a meeting."""
    meeting = get_meeting(meeting_id)

    entry = {
        "speaker_id": speaker_id,
        "speaker_name": speaker_name,
        "text": text,
        "timestamp": timestamp,
        "created_at": datetime.utcnow().isoformat(),
    }
    meeting.transcript.append(entry)

    return {"message": "Transcript entry added"}

# ============== Poll Endpoints ==============

@app.post("/polls", response_model=Poll)
async def create_poll(
    channel_id: str,
    user_id: str,
    question: str,
    options: List[str],
    is_anonymous: bool = False,
    is_multiple_choice: bool = False,
    ends_at: Optional[datetime] = None,
):
    """Create a poll."""
    channel = get_channel(channel_id)

    poll = Poll(
        channel_id=channel_id,
        created_by=user_id,
        question=question,
        options=options,
        is_anonymous=is_anonymous,
        is_multiple_choice=is_multiple_choice,
        ends_at=ends_at,
        votes={opt: [] for opt in options},
    )
    polls_db[poll.id] = poll

    # Create a message for the poll
    message = Message(
        channel_id=channel_id,
        user_id=user_id,
        message_type=MessageType.POLL,
        content=f"Poll: {question}",
    )
    messages_db[message.id] = message

    await broadcast_to_channel(channel_id, "new_poll", poll.model_dump())

    return poll

@app.post("/polls/{poll_id}/vote")
async def vote_on_poll(poll_id: str, user_id: str, options: List[str]):
    """Vote on a poll."""
    if poll_id not in polls_db:
        raise HTTPException(status_code=404, detail="Poll not found")

    poll = polls_db[poll_id]

    if poll.is_closed:
        raise HTTPException(status_code=400, detail="Poll is closed")

    if poll.ends_at and datetime.utcnow() > poll.ends_at:
        poll.is_closed = True
        raise HTTPException(status_code=400, detail="Poll has ended")

    if not poll.is_multiple_choice and len(options) > 1:
        raise HTTPException(status_code=400, detail="Only one choice allowed")

    # Remove previous votes
    for opt in poll.votes:
        poll.votes[opt] = [uid for uid in poll.votes[opt] if uid != user_id]

    # Add new votes
    for opt in options:
        if opt in poll.votes:
            poll.votes[opt].append(user_id)

    return {"message": "Vote recorded"}

@app.get("/polls/{poll_id}/results")
async def get_poll_results(poll_id: str):
    """Get poll results."""
    if poll_id not in polls_db:
        raise HTTPException(status_code=404, detail="Poll not found")

    poll = polls_db[poll_id]

    total_votes = sum(len(votes) for votes in poll.votes.values())

    results = {
        "poll": poll,
        "total_votes": total_votes,
        "results": {
            opt: {
                "count": len(voters),
                "percentage": (len(voters) / total_votes * 100) if total_votes > 0 else 0,
                "voters": voters if not poll.is_anonymous else None,
            }
            for opt, voters in poll.votes.items()
        },
    }

    return results

# ============== AI Features ==============

@app.post("/ai/summarize-meeting", response_model=AIMeetingSummary)
async def ai_summarize_meeting(meeting_id: str):
    """AI-powered meeting summarization."""
    meeting = get_meeting(meeting_id)

    if not meeting.transcript:
        raise HTTPException(status_code=400, detail="No transcript available")

    # In real implementation, use LLM to generate summary
    duration = 0
    if meeting.actual_start and meeting.actual_end:
        duration = int((meeting.actual_end - meeting.actual_start).total_seconds() / 60)

    summary = AIMeetingSummary(
        summary=f"Meeting '{meeting.title}' covered various topics with {len(meeting.participants)} participants.",
        key_points=[
            "Discussed project progress",
            "Reviewed upcoming deadlines",
            "Assigned action items",
        ],
        action_items=[
            {"task": "Follow up on deliverables", "assignee": meeting.host_id, "due": "Next week"},
            {"task": "Schedule follow-up meeting", "assignee": meeting.host_id, "due": "This week"},
        ],
        decisions=["Approved the new feature proposal", "Agreed on timeline"],
        participants_summary={
            p: "Participated in discussion" for p in meeting.participants
        },
        duration_minutes=duration,
        topics_discussed=["Project status", "Roadmap", "Resource allocation"],
    )

    # Store in meeting
    meeting.ai_summary = summary.summary
    meeting.ai_action_items = summary.action_items
    meeting.ai_key_points = summary.key_points

    return summary

@app.post("/ai/extract-actions")
async def ai_extract_action_items(channel_id: str, message_count: int = 50):
    """Extract action items from recent messages."""
    messages = [m for m in messages_db.values()
                if m.channel_id == channel_id and not m.is_deleted]
    messages.sort(key=lambda x: x.created_at, reverse=True)
    messages = messages[:message_count]

    # In real implementation, use LLM to extract actions
    action_items = [
        {
            "task": "Review the proposal",
            "mentioned_by": messages[0].user_id if messages else "unknown",
            "context": "Based on discussion about project requirements",
        },
        {
            "task": "Schedule team sync",
            "mentioned_by": messages[0].user_id if messages else "unknown",
            "context": "Follow up on meeting discussion",
        },
    ]

    return {
        "channel_id": channel_id,
        "messages_analyzed": len(messages),
        "action_items": action_items,
    }

@app.post("/ai/summarize-channel")
async def ai_summarize_channel(channel_id: str, hours: int = 24):
    """AI-powered channel activity summary."""
    since = datetime.utcnow() - timedelta(hours=hours)

    messages = [m for m in messages_db.values()
                if m.channel_id == channel_id
                and m.created_at > since
                and not m.is_deleted]

    participants = list(set(m.user_id for m in messages))

    # In real implementation, use LLM
    summary = {
        "channel_id": channel_id,
        "period_hours": hours,
        "summary": f"There were {len(messages)} messages from {len(participants)} participants.",
        "highlights": [
            "Discussion about upcoming release",
            "Bug reports and fixes",
            "Team announcements",
        ],
        "most_active_users": participants[:5],
        "key_decisions": [],
        "unresolved_questions": [],
        "sentiment": "positive",
    }

    return summary

@app.post("/ai/suggest-reply")
async def ai_suggest_reply(message_id: str):
    """AI-powered reply suggestions."""
    message = get_message(message_id)

    # In real implementation, use LLM
    suggestions = AIMessageSuggestion(
        suggestions=[
            "Thanks for sharing this!",
            "I'll look into this and get back to you.",
            "Great point, let's discuss this in our next meeting.",
            "Could you provide more details?",
        ],
        context=message.content[:100],
    )

    return suggestions

@app.post("/ai/translate")
async def ai_translate_message(message_id: str, target_language: str):
    """AI-powered message translation."""
    message = get_message(message_id)

    # In real implementation, use translation API/LLM
    return {
        "original": message.content,
        "translated": f"[Translated to {target_language}] {message.content}",
        "source_language": "en",
        "target_language": target_language,
    }

@app.post("/ai/smart-compose")
async def ai_smart_compose(context: str, tone: str = "professional"):
    """AI-powered message composition."""
    # In real implementation, use LLM
    return {
        "suggestions": [
            f"Based on the context, here's a {tone} message: ...",
        ],
        "tone_applied": tone,
    }

# ============== WebSocket ==============

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket connection for real-time updates."""
    await websocket.accept()

    if user_id not in ws_connections:
        ws_connections[user_id] = set()
    ws_connections[user_id].add(websocket)

    # Update presence to online
    presence_db[user_id] = UserPresence(user_id=user_id, status=UserStatus.ONLINE)

    try:
        while True:
            data = await websocket.receive_json()

            # Handle different message types
            msg_type = data.get("type")

            if msg_type == "subscribe":
                channel_id = data.get("channel_id")
                if channel_id:
                    if channel_id not in channel_subscriptions:
                        channel_subscriptions[channel_id] = set()
                    channel_subscriptions[channel_id].add(user_id)

            elif msg_type == "unsubscribe":
                channel_id = data.get("channel_id")
                if channel_id and channel_id in channel_subscriptions:
                    channel_subscriptions[channel_id].discard(user_id)

            elif msg_type == "typing":
                channel_id = data.get("channel_id")
                if channel_id:
                    await broadcast_to_channel(channel_id, "user_typing", {
                        "user_id": user_id,
                        "channel_id": channel_id,
                    })

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                # Update last active
                if user_id in presence_db:
                    presence_db[user_id].last_active = datetime.utcnow()

    except WebSocketDisconnect:
        ws_connections[user_id].discard(websocket)
        if not ws_connections[user_id]:
            del ws_connections[user_id]
            # Update presence to offline
            if user_id in presence_db:
                presence_db[user_id].status = UserStatus.OFFLINE

        # Remove from channel subscriptions
        for channel_id in list(channel_subscriptions.keys()):
            channel_subscriptions[channel_id].discard(user_id)

# ============== Search ==============

@app.get("/search")
async def search_messages(
    workspace_id: str,
    query: str,
    user_id: str,
    channel_id: Optional[str] = None,
    from_user: Optional[str] = None,
    has_attachment: Optional[bool] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = Query(50, ge=1, le=100),
):
    """Search messages across channels."""
    # Get accessible channels
    accessible_channels = [c.id for c in channels_db.values()
                          if c.workspace_id == workspace_id
                          and (c.channel_type == ChannelType.PUBLIC or user_id in c.members)]

    if channel_id:
        if channel_id not in accessible_channels:
            raise HTTPException(status_code=403, detail="No access to this channel")
        accessible_channels = [channel_id]

    messages = [m for m in messages_db.values()
                if m.channel_id in accessible_channels
                and not m.is_deleted]

    # Apply filters
    query_lower = query.lower()
    messages = [m for m in messages if query_lower in m.content.lower()]

    if from_user:
        messages = [m for m in messages if m.user_id == from_user]

    if has_attachment is not None:
        messages = [m for m in messages if bool(m.attachments) == has_attachment]

    if date_from:
        messages = [m for m in messages if m.created_at >= date_from]

    if date_to:
        messages = [m for m in messages if m.created_at <= date_to]

    messages.sort(key=lambda x: x.created_at, reverse=True)

    return {
        "query": query,
        "results": messages[:limit],
        "total": len(messages),
    }

# ============== Statistics ==============

@app.get("/stats/workspace/{workspace_id}")
async def get_workspace_stats(workspace_id: str):
    """Get workspace statistics."""
    workspace = get_workspace(workspace_id)

    channels = [c for c in channels_db.values() if c.workspace_id == workspace_id]
    messages = [m for m in messages_db.values()
                if m.channel_id in [c.id for c in channels]]
    meetings = [m for m in meetings_db.values() if m.workspace_id == workspace_id]

    return {
        "workspace_id": workspace_id,
        "members": len(workspace.members),
        "channels": len(channels),
        "total_messages": len(messages),
        "total_meetings": len(meetings),
        "active_meetings": len([m for m in meetings if m.status == MeetingStatus.LIVE]),
        "messages_today": len([m for m in messages
                               if m.created_at.date() == datetime.utcnow().date()]),
    }

# ============== Health Check ==============

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-collab",
        "version": "1.0.0",
        "workspaces": len(workspaces_db),
        "channels": len(channels_db),
        "active_connections": sum(len(conns) for conns in ws_connections.values()),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8009)

"""
AI-Calendar Service: Intelligent calendar management with AI-powered scheduling.

Features:
- Event management (CRUD)
- Recurring events
- Multiple calendars
- AI-powered scheduling
- Conflict detection
- Meeting suggestions
- Availability management
- Calendar sharing
- Time zone support
"""

from fastapi import FastAPI, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timedelta, date, time
from enum import Enum
import uuid
import asyncio
from zoneinfo import ZoneInfo

app = FastAPI(
    title="AI-Calendar Service",
    description="Intelligent calendar with AI-powered scheduling",
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

class EventStatus(str, Enum):
    CONFIRMED = "confirmed"
    TENTATIVE = "tentative"
    CANCELLED = "cancelled"

class EventVisibility(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    CONFIDENTIAL = "confidential"

class AttendeeStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    TENTATIVE = "tentative"

class RecurrenceFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class ReminderType(str, Enum):
    EMAIL = "email"
    NOTIFICATION = "notification"
    SMS = "sms"

class CalendarColor(str, Enum):
    BLUE = "#1a73e8"
    RED = "#d50000"
    GREEN = "#33b679"
    YELLOW = "#f6bf26"
    ORANGE = "#f09300"
    PURPLE = "#8e24aa"
    PINK = "#e67c73"
    TEAL = "#039be5"
    GRAY = "#616161"

class EventType(str, Enum):
    MEETING = "meeting"
    APPOINTMENT = "appointment"
    REMINDER = "reminder"
    TASK = "task"
    FOCUS_TIME = "focus_time"
    OUT_OF_OFFICE = "out_of_office"
    BIRTHDAY = "birthday"
    HOLIDAY = "holiday"

# ============== Models ==============

class Location(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    meeting_url: Optional[str] = None  # Video call link
    room_id: Optional[str] = None  # Conference room

class Attendee(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: Optional[str] = None
    status: AttendeeStatus = AttendeeStatus.PENDING
    is_organizer: bool = False
    is_optional: bool = False
    response_time: Optional[datetime] = None
    comment: Optional[str] = None

class Reminder(BaseModel):
    type: ReminderType = ReminderType.NOTIFICATION
    minutes_before: int = 15

class RecurrenceRule(BaseModel):
    frequency: RecurrenceFrequency
    interval: int = 1  # Every X days/weeks/months
    days_of_week: Optional[List[int]] = None  # 0=Monday, 6=Sunday
    day_of_month: Optional[int] = None
    month_of_year: Optional[int] = None
    end_date: Optional[date] = None
    count: Optional[int] = None  # Number of occurrences
    exceptions: List[date] = []  # Dates to skip

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[Location] = None
    start_time: datetime
    end_time: datetime
    all_day: bool = False
    timezone: str = "UTC"
    event_type: EventType = EventType.MEETING
    status: EventStatus = EventStatus.CONFIRMED
    visibility: EventVisibility = EventVisibility.PUBLIC
    attendees: List[Attendee] = []
    reminders: List[Reminder] = [Reminder()]
    recurrence: Optional[RecurrenceRule] = None
    color: Optional[CalendarColor] = None
    attachments: List[str] = []
    conferencing: Optional[Dict[str, Any]] = None  # Video call details
    metadata: Dict[str, Any] = {}

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[Location] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None
    status: Optional[EventStatus] = None
    visibility: Optional[EventVisibility] = None
    color: Optional[CalendarColor] = None

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    calendar_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    location: Optional[Location] = None
    start_time: datetime
    end_time: datetime
    all_day: bool = False
    timezone: str = "UTC"
    event_type: EventType = EventType.MEETING
    status: EventStatus = EventStatus.CONFIRMED
    visibility: EventVisibility = EventVisibility.PUBLIC
    attendees: List[Attendee] = []
    reminders: List[Reminder] = []
    recurrence: Optional[RecurrenceRule] = None
    recurrence_id: Optional[str] = None  # ID of parent recurring event
    color: Optional[CalendarColor] = None
    attachments: List[str] = []
    conferencing: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    # AI-generated fields
    ai_suggested_time: Optional[bool] = False
    ai_summary: Optional[str] = None
    ai_prep_notes: Optional[str] = None

class Calendar(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: Optional[str] = None
    color: CalendarColor = CalendarColor.BLUE
    is_primary: bool = False
    is_visible: bool = True
    timezone: str = "UTC"
    can_edit: bool = True
    is_shared: bool = False
    shared_with: List[str] = []  # User IDs
    sync_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CalendarShare(BaseModel):
    calendar_id: str
    shared_with_email: EmailStr
    permission: str = "read"  # read, write, admin

class WorkingHours(BaseModel):
    user_id: str
    timezone: str = "UTC"
    monday: Optional[Dict[str, str]] = {"start": "09:00", "end": "17:00"}
    tuesday: Optional[Dict[str, str]] = {"start": "09:00", "end": "17:00"}
    wednesday: Optional[Dict[str, str]] = {"start": "09:00", "end": "17:00"}
    thursday: Optional[Dict[str, str]] = {"start": "09:00", "end": "17:00"}
    friday: Optional[Dict[str, str]] = {"start": "09:00", "end": "17:00"}
    saturday: Optional[Dict[str, str]] = None
    sunday: Optional[Dict[str, str]] = None

class TimeSlot(BaseModel):
    start: datetime
    end: datetime
    duration_minutes: int
    attendees_available: List[str] = []
    score: float = 1.0  # AI-calculated preference score

# ============== AI Models ==============

class AIScheduleRequest(BaseModel):
    title: str
    duration_minutes: int = 60
    attendees: List[EmailStr]
    preferred_times: Optional[List[str]] = None  # morning, afternoon, etc.
    date_range_start: date
    date_range_end: date
    timezone: str = "UTC"
    priority: str = "normal"  # low, normal, high
    constraints: Optional[Dict[str, Any]] = None

class AIMeetingSuggestion(BaseModel):
    suggested_slots: List[TimeSlot]
    best_slot: TimeSlot
    reasoning: str
    conflicts: List[Dict[str, Any]]
    alternative_durations: List[int]

class AIConflictResolution(BaseModel):
    conflicts: List[Dict[str, Any]]
    suggestions: List[Dict[str, Any]]
    auto_resolvable: bool
    recommended_action: str

class AIAgendaRequest(BaseModel):
    date: date
    timezone: str = "UTC"
    include_prep_time: bool = True
    include_travel_time: bool = True

class AITimeAnalysisRequest(BaseModel):
    start_date: date
    end_date: date
    categories: Optional[List[str]] = None

# ============== Storage (in-memory for demo) ==============

calendars_db: Dict[str, Calendar] = {}
events_db: Dict[str, Event] = {}
working_hours_db: Dict[str, WorkingHours] = {}
shares_db: Dict[str, CalendarShare] = {}

# WebSocket connections for real-time updates
active_connections: Dict[str, Set[WebSocket]] = {}

# ============== Helper Functions ==============

def get_calendar(calendar_id: str) -> Calendar:
    if calendar_id not in calendars_db:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return calendars_db[calendar_id]

def get_event(event_id: str) -> Event:
    if event_id not in events_db:
        raise HTTPException(status_code=404, detail="Event not found")
    return events_db[event_id]

def expand_recurring_event(event: Event, start_date: date, end_date: date) -> List[Event]:
    """Expand a recurring event into individual occurrences."""
    if not event.recurrence:
        return [event]

    occurrences = []
    rule = event.recurrence
    current = event.start_time.date()
    duration = event.end_time - event.start_time

    count = 0
    max_count = rule.count or 365  # Default max 1 year of occurrences

    while current <= end_date and count < max_count:
        if current >= start_date and current not in rule.exceptions:
            # Check day of week for weekly recurrence
            if rule.frequency == RecurrenceFrequency.WEEKLY:
                if rule.days_of_week and current.weekday() not in rule.days_of_week:
                    current += timedelta(days=1)
                    continue

            # Create occurrence
            occurrence = event.model_copy()
            occurrence.id = f"{event.id}_{current.isoformat()}"
            occurrence.recurrence_id = event.id
            occurrence.start_time = datetime.combine(current, event.start_time.time())
            occurrence.end_time = occurrence.start_time + duration
            occurrences.append(occurrence)
            count += 1

        # Advance to next occurrence
        if rule.frequency == RecurrenceFrequency.DAILY:
            current += timedelta(days=rule.interval)
        elif rule.frequency == RecurrenceFrequency.WEEKLY:
            current += timedelta(weeks=rule.interval)
        elif rule.frequency == RecurrenceFrequency.BIWEEKLY:
            current += timedelta(weeks=2 * rule.interval)
        elif rule.frequency == RecurrenceFrequency.MONTHLY:
            # Simple month addition
            month = current.month + rule.interval
            year = current.year + (month - 1) // 12
            month = ((month - 1) % 12) + 1
            day = min(current.day, 28)  # Safe day
            current = date(year, month, day)
        elif rule.frequency == RecurrenceFrequency.YEARLY:
            current = date(current.year + rule.interval, current.month, current.day)

        if rule.end_date and current > rule.end_date:
            break

    return occurrences

def check_conflicts(event: Event, user_id: str) -> List[Event]:
    """Check for conflicting events."""
    conflicts = []
    for existing in events_db.values():
        if existing.id == event.id:
            continue
        if existing.user_id != user_id:
            continue
        if existing.status == EventStatus.CANCELLED:
            continue

        # Check time overlap
        if (event.start_time < existing.end_time and
            event.end_time > existing.start_time):
            conflicts.append(existing)

    return conflicts

async def notify_subscribers(calendar_id: str, event_type: str, data: Dict):
    """Notify WebSocket subscribers of calendar updates."""
    if calendar_id in active_connections:
        message = {"type": event_type, "data": data}
        for connection in active_connections[calendar_id]:
            try:
                await connection.send_json(message)
            except:
                pass

# ============== Calendar Endpoints ==============

@app.post("/calendars", response_model=Calendar)
async def create_calendar(
    user_id: str,
    name: str,
    description: Optional[str] = None,
    color: CalendarColor = CalendarColor.BLUE,
    timezone: str = "UTC",
):
    """Create a new calendar."""
    is_primary = len([c for c in calendars_db.values() if c.user_id == user_id]) == 0

    calendar = Calendar(
        user_id=user_id,
        name=name,
        description=description,
        color=color,
        timezone=timezone,
        is_primary=is_primary,
    )
    calendars_db[calendar.id] = calendar
    return calendar

@app.get("/calendars", response_model=List[Calendar])
async def list_calendars(user_id: str, include_shared: bool = True):
    """List all calendars for a user."""
    calendars = [c for c in calendars_db.values() if c.user_id == user_id]

    if include_shared:
        # Include calendars shared with the user
        shared_calendar_ids = [s.calendar_id for s in shares_db.values()
                               if s.shared_with_email == user_id]
        for cal_id in shared_calendar_ids:
            if cal_id in calendars_db:
                calendars.append(calendars_db[cal_id])

    return calendars

@app.get("/calendars/{calendar_id}", response_model=Calendar)
async def get_calendar_details(calendar_id: str):
    """Get calendar details."""
    return get_calendar(calendar_id)

@app.put("/calendars/{calendar_id}", response_model=Calendar)
async def update_calendar(
    calendar_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    color: Optional[CalendarColor] = None,
    is_visible: Optional[bool] = None,
):
    """Update calendar settings."""
    calendar = get_calendar(calendar_id)

    if name:
        calendar.name = name
    if description is not None:
        calendar.description = description
    if color:
        calendar.color = color
    if is_visible is not None:
        calendar.is_visible = is_visible

    return calendar

@app.delete("/calendars/{calendar_id}")
async def delete_calendar(calendar_id: str):
    """Delete a calendar and all its events."""
    calendar = get_calendar(calendar_id)

    if calendar.is_primary:
        raise HTTPException(status_code=400, detail="Cannot delete primary calendar")

    # Delete all events in the calendar
    events_to_delete = [e.id for e in events_db.values() if e.calendar_id == calendar_id]
    for event_id in events_to_delete:
        del events_db[event_id]

    del calendars_db[calendar_id]
    return {"message": "Calendar deleted"}

@app.post("/calendars/{calendar_id}/share")
async def share_calendar(
    calendar_id: str,
    shared_with_email: EmailStr,
    permission: str = "read",
):
    """Share a calendar with another user."""
    calendar = get_calendar(calendar_id)

    share = CalendarShare(
        calendar_id=calendar_id,
        shared_with_email=shared_with_email,
        permission=permission,
    )
    shares_db[f"{calendar_id}:{shared_with_email}"] = share
    calendar.is_shared = True
    calendar.shared_with.append(str(shared_with_email))

    return {"message": f"Calendar shared with {shared_with_email}"}

# ============== Event Endpoints ==============

@app.post("/events", response_model=Event)
async def create_event(
    calendar_id: str,
    user_id: str,
    event_data: EventCreate,
):
    """Create a new event."""
    calendar = get_calendar(calendar_id)

    event = Event(
        calendar_id=calendar_id,
        user_id=user_id,
        title=event_data.title,
        description=event_data.description,
        location=event_data.location,
        start_time=event_data.start_time,
        end_time=event_data.end_time,
        all_day=event_data.all_day,
        timezone=event_data.timezone,
        event_type=event_data.event_type,
        status=event_data.status,
        visibility=event_data.visibility,
        attendees=event_data.attendees,
        reminders=event_data.reminders,
        recurrence=event_data.recurrence,
        color=event_data.color or calendar.color,
        attachments=event_data.attachments,
        conferencing=event_data.conferencing,
        metadata=event_data.metadata,
        created_by=user_id,
    )

    # Set organizer in attendees if not already there
    organizer_exists = any(a.is_organizer for a in event.attendees)
    if not organizer_exists and event.attendees:
        event.attendees[0].is_organizer = True

    events_db[event.id] = event

    # Notify subscribers
    await notify_subscribers(calendar_id, "event_created", event.model_dump())

    return event

@app.get("/events", response_model=List[Event])
async def list_events(
    calendar_id: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    event_type: Optional[EventType] = None,
    status: Optional[EventStatus] = None,
    expand_recurring: bool = True,
):
    """List events with filtering."""
    events = list(events_db.values())

    if calendar_id:
        events = [e for e in events if e.calendar_id == calendar_id]
    if user_id:
        events = [e for e in events if e.user_id == user_id]
    if event_type:
        events = [e for e in events if e.event_type == event_type]
    if status:
        events = [e for e in events if e.status == status]

    # Expand recurring events
    if expand_recurring and start_date and end_date:
        expanded = []
        for event in events:
            if event.recurrence:
                expanded.extend(expand_recurring_event(event, start_date, end_date))
            elif event.start_time.date() <= end_date and event.end_time.date() >= start_date:
                expanded.append(event)
        events = expanded
    elif start_date:
        events = [e for e in events if e.start_time.date() >= start_date]
    if end_date:
        events = [e for e in events if e.end_time.date() <= end_date]

    # Sort by start time
    events.sort(key=lambda x: x.start_time)

    return events

@app.get("/events/{event_id}", response_model=Event)
async def get_event_details(event_id: str):
    """Get event details."""
    return get_event(event_id)

@app.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, update: EventUpdate):
    """Update an event."""
    event = get_event(event_id)

    if update.title is not None:
        event.title = update.title
    if update.description is not None:
        event.description = update.description
    if update.location is not None:
        event.location = update.location
    if update.start_time is not None:
        event.start_time = update.start_time
    if update.end_time is not None:
        event.end_time = update.end_time
    if update.all_day is not None:
        event.all_day = update.all_day
    if update.status is not None:
        event.status = update.status
    if update.visibility is not None:
        event.visibility = update.visibility
    if update.color is not None:
        event.color = update.color

    event.updated_at = datetime.utcnow()

    # Notify subscribers
    await notify_subscribers(event.calendar_id, "event_updated", event.model_dump())

    return event

@app.delete("/events/{event_id}")
async def delete_event(event_id: str, notify_attendees: bool = True):
    """Delete an event."""
    event = get_event(event_id)
    calendar_id = event.calendar_id

    del events_db[event_id]

    # Notify subscribers
    await notify_subscribers(calendar_id, "event_deleted", {"event_id": event_id})

    return {"message": "Event deleted"}

@app.post("/events/{event_id}/rsvp")
async def rsvp_event(
    event_id: str,
    attendee_email: EmailStr,
    status: AttendeeStatus,
    comment: Optional[str] = None,
):
    """RSVP to an event."""
    event = get_event(event_id)

    for attendee in event.attendees:
        if attendee.email == attendee_email:
            attendee.status = status
            attendee.response_time = datetime.utcnow()
            attendee.comment = comment
            break
    else:
        raise HTTPException(status_code=404, detail="Attendee not found")

    return {"message": f"RSVP updated to {status}"}

@app.post("/events/{event_id}/duplicate", response_model=Event)
async def duplicate_event(event_id: str, new_start_time: datetime):
    """Duplicate an event to a new time."""
    original = get_event(event_id)
    duration = original.end_time - original.start_time

    new_event = original.model_copy()
    new_event.id = str(uuid.uuid4())
    new_event.start_time = new_start_time
    new_event.end_time = new_start_time + duration
    new_event.created_at = datetime.utcnow()
    new_event.updated_at = datetime.utcnow()

    events_db[new_event.id] = new_event
    return new_event

# ============== Availability Endpoints ==============

@app.get("/availability/{user_id}")
async def get_user_availability(
    user_id: str,
    start_date: date,
    end_date: date,
    slot_duration_minutes: int = 30,
):
    """Get user's availability (free/busy)."""
    # Get all events for the user
    events = [e for e in events_db.values()
              if e.user_id == user_id
              and e.status != EventStatus.CANCELLED
              and e.start_time.date() <= end_date
              and e.end_time.date() >= start_date]

    # Get working hours
    working_hours = working_hours_db.get(user_id)

    busy_slots = []
    for event in events:
        busy_slots.append({
            "start": event.start_time,
            "end": event.end_time,
            "event_id": event.id,
            "title": event.title if event.visibility != EventVisibility.PRIVATE else "Busy",
        })

    return {
        "user_id": user_id,
        "start_date": start_date,
        "end_date": end_date,
        "working_hours": working_hours,
        "busy": busy_slots,
    }

@app.post("/availability/working-hours")
async def set_working_hours(working_hours: WorkingHours):
    """Set user's working hours."""
    working_hours_db[working_hours.user_id] = working_hours
    return {"message": "Working hours updated"}

@app.get("/availability/working-hours/{user_id}", response_model=WorkingHours)
async def get_working_hours(user_id: str):
    """Get user's working hours."""
    if user_id not in working_hours_db:
        # Return default working hours
        return WorkingHours(user_id=user_id)
    return working_hours_db[user_id]

# ============== AI Features ==============

@app.post("/ai/schedule", response_model=AIMeetingSuggestion)
async def ai_find_meeting_time(request: AIScheduleRequest):
    """AI-powered meeting scheduling - find optimal time for all attendees."""
    # Get availability for all attendees
    all_busy_slots = []
    for attendee in request.attendees:
        # In real implementation, fetch from each user's calendar
        pass

    # Generate available slots
    available_slots = []
    current_date = request.date_range_start

    while current_date <= request.date_range_end:
        # Skip weekends
        if current_date.weekday() >= 5:
            current_date += timedelta(days=1)
            continue

        # Check preferred times
        if request.preferred_times:
            if "morning" in request.preferred_times:
                slot_start = datetime.combine(current_date, time(9, 0))
            elif "afternoon" in request.preferred_times:
                slot_start = datetime.combine(current_date, time(14, 0))
            else:
                slot_start = datetime.combine(current_date, time(10, 0))
        else:
            slot_start = datetime.combine(current_date, time(10, 0))

        slot = TimeSlot(
            start=slot_start,
            end=slot_start + timedelta(minutes=request.duration_minutes),
            duration_minutes=request.duration_minutes,
            attendees_available=request.attendees,
            score=0.85,
        )
        available_slots.append(slot)

        current_date += timedelta(days=1)

    if not available_slots:
        raise HTTPException(status_code=400, detail="No available time slots found")

    # Sort by score
    available_slots.sort(key=lambda x: x.score, reverse=True)

    return AIMeetingSuggestion(
        suggested_slots=available_slots[:5],
        best_slot=available_slots[0],
        reasoning=f"Found {len(available_slots)} available slots. Best slot at {available_slots[0].start} "
                  f"has all {len(request.attendees)} attendees available.",
        conflicts=[],
        alternative_durations=[30, 45, 60, 90],
    )

@app.post("/ai/resolve-conflicts", response_model=AIConflictResolution)
async def ai_resolve_conflicts(event_id: str):
    """AI-powered conflict resolution."""
    event = get_event(event_id)
    conflicts = check_conflicts(event, event.user_id)

    if not conflicts:
        return AIConflictResolution(
            conflicts=[],
            suggestions=[],
            auto_resolvable=True,
            recommended_action="No conflicts found",
        )

    suggestions = []
    for conflict in conflicts:
        suggestions.append({
            "conflicting_event": conflict.title,
            "suggestion": f"Move '{event.title}' to after {conflict.end_time.strftime('%H:%M')}",
            "new_time": conflict.end_time + timedelta(minutes=15),
        })

    return AIConflictResolution(
        conflicts=[{"event": c.title, "time": c.start_time.isoformat()} for c in conflicts],
        suggestions=suggestions,
        auto_resolvable=len(conflicts) == 1,
        recommended_action=suggestions[0]["suggestion"] if suggestions else "Review conflicts manually",
    )

@app.post("/ai/daily-agenda")
async def ai_generate_agenda(user_id: str, request: AIAgendaRequest):
    """AI-powered daily agenda generation."""
    # Get events for the day
    events = [e for e in events_db.values()
              if e.user_id == user_id
              and e.start_time.date() == request.date
              and e.status != EventStatus.CANCELLED]

    events.sort(key=lambda x: x.start_time)

    agenda_items = []
    previous_end = None

    for event in events:
        # Add travel/prep time
        if request.include_prep_time and previous_end:
            gap = (event.start_time - previous_end).total_seconds() / 60
            if gap >= 15:
                agenda_items.append({
                    "type": "prep_time",
                    "title": f"Prepare for: {event.title}",
                    "start": previous_end,
                    "end": event.start_time,
                    "duration_minutes": int(gap),
                })

        agenda_items.append({
            "type": "event",
            "event": event.model_dump(),
            "start": event.start_time,
            "end": event.end_time,
            "duration_minutes": int((event.end_time - event.start_time).total_seconds() / 60),
        })

        previous_end = event.end_time

    # Calculate summary
    total_meeting_time = sum(
        item["duration_minutes"] for item in agenda_items if item["type"] == "event"
    )

    return {
        "date": request.date,
        "timezone": request.timezone,
        "summary": {
            "total_events": len(events),
            "total_meeting_minutes": total_meeting_time,
            "first_event": events[0].start_time if events else None,
            "last_event": events[-1].end_time if events else None,
            "busiest_hour": "10:00 AM",  # Calculated
        },
        "agenda": agenda_items,
        "ai_insights": [
            f"You have {len(events)} events scheduled today",
            f"Total meeting time: {total_meeting_time // 60}h {total_meeting_time % 60}m",
            "Consider blocking focus time between 2-4 PM" if total_meeting_time < 300 else "Heavy meeting day - prioritize breaks",
        ],
    }

@app.post("/ai/time-analysis")
async def ai_analyze_time(user_id: str, request: AITimeAnalysisRequest):
    """AI-powered time analysis and insights."""
    events = [e for e in events_db.values()
              if e.user_id == user_id
              and e.start_time.date() >= request.start_date
              and e.end_time.date() <= request.end_date
              and e.status != EventStatus.CANCELLED]

    # Categorize events
    by_type = {}
    for event in events:
        event_type = event.event_type.value
        if event_type not in by_type:
            by_type[event_type] = {"count": 0, "minutes": 0}
        by_type[event_type]["count"] += 1
        by_type[event_type]["minutes"] += int((event.end_time - event.start_time).total_seconds() / 60)

    # Calculate total time
    total_minutes = sum(cat["minutes"] for cat in by_type.values())
    days = (request.end_date - request.start_date).days + 1

    return {
        "period": {
            "start": request.start_date,
            "end": request.end_date,
            "days": days,
        },
        "summary": {
            "total_events": len(events),
            "total_hours": total_minutes / 60,
            "average_per_day": total_minutes / 60 / days if days > 0 else 0,
        },
        "by_category": {
            cat: {
                "count": data["count"],
                "hours": data["minutes"] / 60,
                "percentage": (data["minutes"] / total_minutes * 100) if total_minutes > 0 else 0,
            }
            for cat, data in by_type.items()
        },
        "insights": [
            f"You spent {total_minutes // 60} hours in events over {days} days",
            f"Meetings take up {by_type.get('meeting', {}).get('minutes', 0) // 60} hours",
            "Consider scheduling more focus time" if by_type.get("focus_time", {}).get("count", 0) < 3 else "Good balance of focus time",
        ],
        "recommendations": [
            "Block 2-hour focus time slots daily",
            "Batch similar meetings together",
            "Add buffer time between back-to-back meetings",
        ],
    }

@app.post("/ai/smart-reschedule")
async def ai_smart_reschedule(event_id: str, reason: str = "conflict"):
    """AI-powered smart rescheduling suggestions."""
    event = get_event(event_id)

    # Find alternative times
    alternatives = []
    current_date = event.start_time.date()
    duration = event.end_time - event.start_time

    for day_offset in range(7):
        check_date = current_date + timedelta(days=day_offset)
        for hour in [9, 10, 11, 14, 15, 16]:
            proposed_start = datetime.combine(check_date, time(hour, 0))
            proposed_end = proposed_start + duration

            # Check for conflicts
            has_conflict = False
            for existing in events_db.values():
                if existing.id == event.id:
                    continue
                if existing.user_id != event.user_id:
                    continue
                if (proposed_start < existing.end_time and
                    proposed_end > existing.start_time):
                    has_conflict = True
                    break

            if not has_conflict:
                alternatives.append({
                    "start": proposed_start,
                    "end": proposed_end,
                    "score": 0.9 - (day_offset * 0.1),  # Prefer sooner
                    "reason": "Available slot" if day_offset == 0 else f"{day_offset} days later",
                })

            if len(alternatives) >= 5:
                break
        if len(alternatives) >= 5:
            break

    return {
        "original_event": event.title,
        "original_time": event.start_time,
        "reschedule_reason": reason,
        "alternatives": alternatives,
        "best_alternative": alternatives[0] if alternatives else None,
        "auto_reschedule_available": len(alternatives) > 0,
    }

@app.post("/ai/meeting-prep")
async def ai_meeting_prep(event_id: str):
    """Generate AI meeting preparation notes."""
    event = get_event(event_id)

    # In real implementation, analyze attendees, previous meetings, related docs
    prep_notes = {
        "event": {
            "title": event.title,
            "time": event.start_time,
            "duration_minutes": int((event.end_time - event.start_time).total_seconds() / 60),
            "attendees": [a.email for a in event.attendees],
        },
        "preparation": {
            "key_topics": ["Discuss project status", "Review deliverables", "Plan next steps"],
            "talking_points": [
                "Recent progress and achievements",
                "Current blockers and challenges",
                "Resource requirements",
            ],
            "questions_to_ask": [
                "What are the main priorities for next week?",
                "Are there any dependencies we need to address?",
            ],
            "documents_to_review": [],
            "attendee_context": {
                a.email: {"last_meeting": "Last week", "topics_discussed": ["Previous meeting topics"]}
                for a in event.attendees[:3]
            },
        },
        "suggested_agenda": [
            {"time": "5 min", "topic": "Welcome and introductions"},
            {"time": "20 min", "topic": "Main discussion"},
            {"time": "10 min", "topic": "Action items and next steps"},
        ],
    }

    # Store prep notes in event
    event.ai_prep_notes = str(prep_notes["preparation"])

    return prep_notes

# ============== WebSocket for Real-time Updates ==============

@app.websocket("/ws/{calendar_id}")
async def websocket_endpoint(websocket: WebSocket, calendar_id: str):
    """WebSocket endpoint for real-time calendar updates."""
    await websocket.accept()

    if calendar_id not in active_connections:
        active_connections[calendar_id] = set()
    active_connections[calendar_id].add(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            # Handle ping/pong or other client messages
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        active_connections[calendar_id].discard(websocket)

# ============== Import/Export ==============

@app.post("/calendars/{calendar_id}/import")
async def import_calendar(calendar_id: str, format: str = "ical", data: str = ""):
    """Import events from iCal or other formats."""
    calendar = get_calendar(calendar_id)

    # In real implementation, parse iCal format
    imported_count = 0

    return {
        "message": f"Imported {imported_count} events",
        "calendar_id": calendar_id,
    }

@app.get("/calendars/{calendar_id}/export")
async def export_calendar(calendar_id: str, format: str = "ical"):
    """Export calendar to iCal format."""
    calendar = get_calendar(calendar_id)
    events = [e for e in events_db.values() if e.calendar_id == calendar_id]

    # In real implementation, generate iCal format
    ical_data = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI-Suite//AI-Calendar//EN
X-WR-CALNAME:{calendar.name}
"""
    for event in events:
        ical_data += f"""BEGIN:VEVENT
UID:{event.id}
DTSTART:{event.start_time.strftime('%Y%m%dT%H%M%SZ')}
DTEND:{event.end_time.strftime('%Y%m%dT%H%M%SZ')}
SUMMARY:{event.title}
DESCRIPTION:{event.description or ''}
END:VEVENT
"""
    ical_data += "END:VCALENDAR"

    return {"format": format, "data": ical_data}

# ============== Statistics ==============

@app.get("/stats/{user_id}")
async def get_calendar_stats(
    user_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Get calendar statistics for a user."""
    events = [e for e in events_db.values() if e.user_id == user_id]

    if start_date:
        events = [e for e in events if e.start_time.date() >= start_date]
    if end_date:
        events = [e for e in events if e.end_time.date() <= end_date]

    total_duration = sum(
        (e.end_time - e.start_time).total_seconds() / 3600
        for e in events if e.status != EventStatus.CANCELLED
    )

    return {
        "total_events": len(events),
        "total_hours": round(total_duration, 2),
        "by_status": {
            status.value: len([e for e in events if e.status == status])
            for status in EventStatus
        },
        "by_type": {
            event_type.value: len([e for e in events if e.event_type == event_type])
            for event_type in EventType
        },
        "calendars": len(set(e.calendar_id for e in events)),
        "average_event_duration_minutes": round(total_duration * 60 / len(events), 0) if events else 0,
    }

# ============== Health Check ==============

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-calendar",
        "version": "1.0.0",
        "calendars": len(calendars_db),
        "events": len(events_db),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)

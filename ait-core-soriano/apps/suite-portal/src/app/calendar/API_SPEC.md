# Calendar API Specification

## Overview
This document specifies the API endpoints required for the Calendar module to function properly. Backend developers should implement these endpoints to support all calendar features.

## Base URL
```
{API_BASE_URL}/calendar
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer {access_token}
```

## Endpoints

### 1. List Events

**Endpoint:** `GET /events`

**Description:** Retrieve events within a date range

**Query Parameters:**
```typescript
{
  start?: string;    // ISO 8601 date (e.g., "2024-01-01T00:00:00Z")
  end?: string;      // ISO 8601 date
  calendar_id?: string;  // Filter by calendar ID
  page?: number;     // Pagination (default: 1)
  limit?: number;    // Items per page (default: 100)
}
```

**Response:** `200 OK`
```typescript
{
  events: CalendarEvent[];
  total: number;
  page: number;
  limit: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;  // ISO 8601
  end: string;    // ISO 8601
  allDay: boolean;
  location?: string;
  attendees?: string[];  // Email addresses
  reminders?: EventReminder[];
  recurrence?: RecurrenceRule;
  calendarId: string;
  color?: string;  // Hex color (e.g., "#3b82f6")
  createdAt: string;
  updatedAt: string;
  userId: string;  // Event owner
}

interface EventReminder {
  type: 'email' | 'notification' | 'popup';
  minutesBefore: number;
}

interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  count?: number;
  until?: string;  // ISO 8601 date
  byDay?: string[];  // e.g., ["MO", "WE", "FR"]
  byMonthDay?: number[];  // e.g., [1, 15]
}
```

**Example Request:**
```bash
GET /calendar/events?start=2024-01-01T00:00:00Z&end=2024-01-31T23:59:59Z
```

**Example Response:**
```json
{
  "events": [
    {
      "id": "evt_123",
      "title": "Team Meeting",
      "description": "Weekly sync",
      "start": "2024-01-15T10:00:00Z",
      "end": "2024-01-15T11:00:00Z",
      "allDay": false,
      "location": "Conference Room A",
      "attendees": ["john@example.com", "jane@example.com"],
      "reminders": [
        {
          "type": "notification",
          "minutesBefore": 15
        }
      ],
      "recurrence": {
        "frequency": "weekly",
        "interval": 1,
        "byDay": ["MO"]
      },
      "calendarId": "cal_work",
      "color": "#ef4444",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "userId": "user_123"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 100
}
```

**Error Responses:**
- `400 Bad Request`: Invalid date format
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error

---

### 2. Get Event

**Endpoint:** `GET /events/:id`

**Description:** Retrieve a single event by ID

**Path Parameters:**
```typescript
{
  id: string;  // Event ID
}
```

**Response:** `200 OK`
```typescript
CalendarEvent
```

**Example Request:**
```bash
GET /calendar/events/evt_123
```

**Error Responses:**
- `404 Not Found`: Event not found
- `401 Unauthorized`: Not authorized to view event
- `500 Internal Server Error`: Server error

---

### 3. Create Event

**Endpoint:** `POST /events`

**Description:** Create a new calendar event

**Request Body:**
```typescript
{
  title: string;           // Required
  description?: string;
  start: string;           // Required, ISO 8601
  end: string;             // Required, ISO 8601
  allDay?: boolean;        // Default: false
  location?: string;
  attendees?: string[];
  reminders?: EventReminder[];
  recurrence?: RecurrenceRule;
  calendarId: string;      // Required
  color?: string;
}
```

**Response:** `201 Created`
```typescript
{
  event: CalendarEvent;
  message: string;
}
```

**Example Request:**
```json
{
  "title": "Project Review",
  "description": "Q1 project review meeting",
  "start": "2024-01-20T14:00:00Z",
  "end": "2024-01-20T15:30:00Z",
  "allDay": false,
  "location": "Zoom",
  "attendees": ["team@example.com"],
  "reminders": [
    {
      "type": "email",
      "minutesBefore": 60
    }
  ],
  "calendarId": "cal_work"
}
```

**Validation Rules:**
- `title`: Required, max 255 characters
- `start`: Required, valid ISO 8601 date
- `end`: Required, must be after start
- `calendarId`: Required, must exist
- `attendees`: Valid email format
- `color`: Valid hex color format

**Error Responses:**
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not authorized
- `422 Unprocessable Entity`: Invalid data
- `500 Internal Server Error`: Server error

---

### 4. Update Event

**Endpoint:** `PATCH /events/:id`

**Description:** Update an existing event

**Path Parameters:**
```typescript
{
  id: string;  // Event ID
}
```

**Request Body:** (All fields optional)
```typescript
{
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  location?: string;
  attendees?: string[];
  reminders?: EventReminder[];
  recurrence?: RecurrenceRule;
  calendarId?: string;
  color?: string;
}
```

**Response:** `200 OK`
```typescript
{
  event: CalendarEvent;
  message: string;
}
```

**Example Request:**
```json
{
  "title": "Project Review (Updated)",
  "start": "2024-01-20T15:00:00Z",
  "end": "2024-01-20T16:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation error
- `404 Not Found`: Event not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### 5. Delete Event

**Endpoint:** `DELETE /events/:id`

**Description:** Delete an event

**Path Parameters:**
```typescript
{
  id: string;  // Event ID
}
```

**Query Parameters:** (For recurring events - future)
```typescript
{
  deleteType?: 'single' | 'following' | 'all';  // Default: 'single'
}
```

**Response:** `200 OK`
```typescript
{
  message: string;
  deletedId: string;
}
```

**Example Response:**
```json
{
  "message": "Event deleted successfully",
  "deletedId": "evt_123"
}
```

**Error Responses:**
- `404 Not Found`: Event not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### 6. List Calendars

**Endpoint:** `GET /calendars`

**Description:** Get all calendars for the authenticated user

**Response:** `200 OK`
```typescript
{
  calendars: Calendar[];
}

interface Calendar {
  id: string;
  name: string;
  color: string;  // Hex color
  visible: boolean;
  isDefault: boolean;
  description?: string;
  syncEnabled: boolean;
  googleCalendarId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Example Response:**
```json
{
  "calendars": [
    {
      "id": "cal_personal",
      "name": "Personal",
      "color": "#3b82f6",
      "visible": true,
      "isDefault": true,
      "syncEnabled": false,
      "userId": "user_123",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 7. Create Calendar

**Endpoint:** `POST /calendars`

**Description:** Create a new calendar

**Request Body:**
```typescript
{
  name: string;           // Required
  color?: string;         // Default: random color
  description?: string;
  isDefault?: boolean;    // Default: false
}
```

**Response:** `201 Created`
```typescript
{
  calendar: Calendar;
  message: string;
}
```

---

### 8. Update Calendar

**Endpoint:** `PATCH /calendars/:id`

**Description:** Update calendar properties

**Request Body:**
```typescript
{
  name?: string;
  color?: string;
  visible?: boolean;
  isDefault?: boolean;
  description?: string;
}
```

**Response:** `200 OK`
```typescript
{
  calendar: Calendar;
  message: string;
}
```

---

### 9. Delete Calendar

**Endpoint:** `DELETE /calendars/:id`

**Description:** Delete a calendar and optionally its events

**Query Parameters:**
```typescript
{
  deleteEvents?: boolean;  // Default: false (move to default calendar)
}
```

**Response:** `200 OK`
```typescript
{
  message: string;
  deletedId: string;
}
```

---

## Optional Endpoints (Future Features)

### 10. Search Events

**Endpoint:** `GET /events/search`

**Query Parameters:**
```typescript
{
  q: string;           // Search query
  calendar_id?: string;
  start_date?: string;
  end_date?: string;
}
```

---

### 11. Google Calendar Sync

**Endpoint:** `POST /integrations/google/connect`

**Description:** Connect Google Calendar

**Request Body:**
```typescript
{
  authCode: string;  // OAuth authorization code
}
```

**Response:**
```typescript
{
  success: boolean;
  calendarId: string;
  syncEnabled: boolean;
}
```

---

### 12. Get Event Conflicts

**Endpoint:** `POST /events/check-conflicts`

**Description:** Check for scheduling conflicts

**Request Body:**
```typescript
{
  start: string;
  end: string;
  attendees?: string[];
}
```

**Response:**
```typescript
{
  hasConflicts: boolean;
  conflicts: CalendarEvent[];
}
```

---

## Data Models

### Database Schema Recommendations

#### events table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  location VARCHAR(255),
  color VARCHAR(7),
  recurrence_rule JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT end_after_start CHECK (end_datetime > start_datetime),
  INDEX idx_events_user_id (user_id),
  INDEX idx_events_calendar_id (calendar_id),
  INDEX idx_events_start_datetime (start_datetime),
  INDEX idx_events_end_datetime (end_datetime)
);
```

#### calendars table
```sql
CREATE TABLE calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  visible BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  description TEXT,
  sync_enabled BOOLEAN DEFAULT FALSE,
  google_calendar_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, name),
  INDEX idx_calendars_user_id (user_id)
);
```

#### event_attendees table
```sql
CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',

  UNIQUE(event_id, email),
  INDEX idx_event_attendees_event_id (event_id)
);
```

#### event_reminders table
```sql
CREATE TABLE event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  minutes_before INTEGER NOT NULL,
  sent BOOLEAN DEFAULT FALSE,

  INDEX idx_event_reminders_event_id (event_id)
);
```

---

## Business Logic Requirements

### Recurring Events
1. **Expansion**: Server should expand recurring events into individual instances for the requested date range
2. **Updates**: Provide options to update single instance, this and following, or all instances
3. **Exceptions**: Handle individual instance modifications
4. **RRULE**: Consider implementing RFC 5545 (iCalendar) RRULE format

### Permissions
1. **Owner**: Full CRUD access to their events
2. **Shared Calendars**: Read-only or edit access based on sharing settings
3. **Public Events**: Anyone can view, only owner can edit

### Notifications
1. **Reminders**: Background job to send reminders based on event_reminders table
2. **Email**: Send email notifications for reminders
3. **Push**: Send push notifications to mobile devices
4. **In-app**: Create in-app notifications

### Data Validation
1. **Date Validation**: End must be after start
2. **Email Validation**: Validate attendee emails
3. **Color Validation**: Valid hex color format
4. **Timezone**: All dates stored in UTC, converted on client

### Performance
1. **Indexing**: Index on user_id, start_datetime, end_datetime
2. **Caching**: Cache frequent queries (calendars list, etc.)
3. **Pagination**: Paginate large result sets
4. **Query Optimization**: Use date range queries efficiently

---

## Error Handling

### Standard Error Response
```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

### Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `CONFLICT`: Resource conflict (e.g., calendar name exists)
- `INTERNAL_ERROR`: Server error

---

## Rate Limiting

Recommended rate limits:
- **Read Operations**: 1000 requests per hour
- **Write Operations**: 500 requests per hour
- **Search**: 100 requests per hour

---

## Webhooks (Future)

### Event Types
- `event.created`
- `event.updated`
- `event.deleted`
- `calendar.created`
- `calendar.updated`
- `calendar.deleted`

### Webhook Payload
```typescript
{
  type: string;
  timestamp: string;
  data: any;
  userId: string;
}
```

---

## Testing Recommendations

### Unit Tests
- Event CRUD operations
- Date validation logic
- Recurrence rule expansion
- Permission checks

### Integration Tests
- API endpoint responses
- Database transactions
- Error handling
- Rate limiting

### Load Tests
- Concurrent user access
- Large date range queries
- Many events per user
- Search performance

---

## Security Considerations

1. **SQL Injection**: Use parameterized queries
2. **XSS**: Sanitize user input (titles, descriptions)
3. **CSRF**: Implement CSRF tokens
4. **Rate Limiting**: Prevent abuse
5. **Input Validation**: Validate all inputs server-side
6. **Access Control**: Verify user permissions on every request

---

## Deployment Notes

### Environment Variables
```env
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASSWORD=...
```

### Migrations
Run database migrations before deployment:
```bash
npm run migrate
```

### Background Jobs
Set up cron jobs for:
- Reminder notifications (every minute)
- Calendar sync (every 5 minutes)
- Data cleanup (daily)

---

## Support & Maintenance

### Monitoring
- API response times
- Error rates
- Database query performance
- Background job execution

### Logs
- Request/response logs
- Error logs
- Audit logs (event creation/modification/deletion)

### Backups
- Daily database backups
- Backup retention: 30 days
- Test restore procedures monthly

---

## Contact

For API questions or issues:
- Backend Team: backend@example.com
- Documentation: https://docs.example.com/calendar-api
- Support: support@example.com

---

**Last Updated:** 2024-01-28
**Version:** 1.0.0

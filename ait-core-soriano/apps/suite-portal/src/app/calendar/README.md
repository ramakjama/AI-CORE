# Calendar Module

A comprehensive calendar application built with FullCalendar, React, and TypeScript.

## Features

### Core Features
- **Multiple Views**: Month, Week, Day, and Agenda views
- **Drag & Drop**: Move events between dates
- **Resize Events**: Adjust event duration by dragging
- **Click to Create**: Click on any date/time to create an event
- **Event Details Modal**: Full-featured modal for creating and editing events
- **Dark Mode Support**: Fully styled for both light and dark themes

### Event Management
- **Event Creation**: Create events with rich details
- **Event Editing**: Edit existing events with all properties
- **Event Deletion**: Delete events with confirmation
- **All-Day Events**: Support for all-day events
- **Recurring Events**: Create events that repeat (daily, weekly, monthly, yearly)
- **Event Colors**: Different colors per calendar

### Advanced Features
- **Multiple Calendars**: Organize events into different calendars with color coding
- **Reminders**: Set multiple reminders for events (5min, 10min, 30min, 1hr, 1day, etc.)
- **Attendees**: Add email addresses of event attendees
- **Location**: Add location information to events
- **Search**: Search events by title, description, or location
- **Mini Calendar**: Navigate dates with a mini calendar in the sidebar
- **Upcoming Events**: Quick view of upcoming events
- **Google Calendar Integration**: Prepared for Google Calendar sync (coming soon)

## File Structure

```
calendar/
├── page.tsx                           # Main calendar page
├── calendar.css                       # Custom FullCalendar styles
├── README.md                          # This file
└── components/
    ├── CalendarToolbar.tsx           # Top toolbar with navigation and view selector
    ├── CalendarSidebar.tsx           # Left sidebar with mini calendar and event list
    └── EventModal.tsx                # Event creation/editing modal
```

## Components

### CalendarPage (page.tsx)
Main calendar component that orchestrates all sub-components.

**State Management:**
- `view`: Current calendar view (month/week/day/agenda)
- `currentDate`: Currently displayed date
- `selectedEvent`: Event being viewed/edited
- `isEventModalOpen`: Modal visibility state
- `searchQuery`: Search filter text
- `calendars`: List of available calendars

**Key Functions:**
- `handleDateClick`: Opens modal to create event on clicked date
- `handleEventClick`: Opens modal to view/edit clicked event
- `handleEventDrop`: Updates event when dragged to new date
- `handleEventResize`: Updates event when resized
- `handleSaveEvent`: Saves (creates or updates) event
- `handleDeleteEvent`: Deletes event with confirmation

### CalendarToolbar
Top navigation bar with:
- Create Event button
- Date navigation (Prev/Today/Next)
- Current date/period display
- View selector dropdown
- Export and settings buttons

### CalendarSidebar
Left sidebar with:
- Search events input
- Mini calendar for date navigation
- My Calendars list with color-coded checkboxes
- Upcoming events list
- Google Calendar sync button (prepared)

**Features:**
- Toggle individual calendars on/off
- Click dates in mini calendar to navigate
- Visual indicators for days with events
- Collapsible for more screen space

### EventModal
Full-featured modal for creating and editing events.

**Fields:**
- Title (required)
- Description
- Start date/time
- End date/time
- All-day toggle
- Calendar selector
- Location
- Attendees (email list)
- Reminders (multiple)
- Recurrence rules

**Recurrence Options:**
- Frequency: Daily, Weekly, Monthly, Yearly
- Interval: Every N days/weeks/months/years
- End date: Optional end date for recurrence

## Types

### CalendarEvent
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
  attendees?: string[];
  reminders?: EventReminder[];
  recurrence?: RecurrenceRule;
  calendarId: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### Calendar
```typescript
interface Calendar {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  isDefault?: boolean;
  description?: string;
  syncEnabled?: boolean;
  googleCalendarId?: string;
}
```

### EventReminder
```typescript
interface EventReminder {
  type: 'email' | 'notification' | 'popup';
  minutesBefore: number;
}
```

### RecurrenceRule
```typescript
interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  count?: number;
  until?: string;
  byDay?: string[]; // For weekly: ['MO', 'WE', 'FR']
  byMonthDay?: number[]; // For monthly: [1, 15]
}
```

## API Integration

The calendar uses the `calendarApi` from `@/lib/api` for all backend operations.

### Endpoints Used

**GET /calendar/events**
- Params: `start` (ISO date), `end` (ISO date)
- Returns: `{ events: CalendarEvent[] }`

**POST /calendar/events**
- Body: `EventFormData`
- Returns: Created event

**PATCH /calendar/events/:id**
- Body: Partial `EventFormData`
- Returns: Updated event

**DELETE /calendar/events/:id**
- Returns: Success message

## State Management

Uses TanStack Query (React Query) for:
- Fetching events with automatic caching
- Optimistic updates for better UX
- Automatic refetching on mutations
- Error handling and retry logic

**Query Keys:**
- `['calendar-events', currentDate]`: Events for the current period

**Mutations:**
- `createEventMutation`: Create new event
- `updateEventMutation`: Update existing event
- `deleteEventMutation`: Delete event

## Styling

### Custom Styles (calendar.css)
- Dark mode support with CSS variables
- Smooth transitions and animations
- Hover effects for better UX
- Custom scrollbars
- Responsive design for mobile

### Theme Integration
Uses Tailwind CSS and shadcn/ui design tokens:
- `hsl(var(--primary))` for primary colors
- `hsl(var(--background))` for backgrounds
- `hsl(var(--border))` for borders
- `hsl(var(--foreground))` for text

## Usage

### Basic Navigation
1. Use the view selector to switch between Month/Week/Day/Agenda views
2. Click Prev/Today/Next buttons to navigate dates
3. Click on the mini calendar to jump to specific dates

### Creating Events
1. Click the "Crear evento" button in the toolbar, OR
2. Click on any date/time in the calendar
3. Fill in event details in the modal
4. Click "Guardar" to save

### Editing Events
1. Click on any event in the calendar
2. Modify details in the modal
3. Click "Guardar" to update

### Dragging Events
- Click and drag an event to move it to a new date/time
- Changes are saved automatically

### Resizing Events
- Hover over event bottom edge
- Click and drag to adjust end time
- Changes are saved automatically

### Managing Calendars
- Toggle calendars on/off using checkboxes in the sidebar
- Events from hidden calendars won't be displayed
- Each calendar has a unique color

### Search
- Type in the search box in the sidebar
- Events are filtered by title, description, and location
- Search works across all visible calendars

## Localization

The calendar is configured for Spanish (es) locale:
- Dates formatted as "d 'de' MMMM 'de' yyyy"
- Week starts on Monday
- 24-hour time format
- Spanish month and day names

## Keyboard Shortcuts

FullCalendar supports various keyboard shortcuts:
- Arrow keys: Navigate between dates (when date selected)
- Enter: Open event details (when event focused)
- Escape: Close modals

## Performance

### Optimizations
- React.useMemo for filtered events computation
- Lazy rendering with FullCalendar's virtual scrolling
- Debounced search filtering
- Efficient re-renders with proper key usage

### Query Optimization
- Events fetched only for visible date range
- Cached results with React Query
- Automatic cache invalidation on mutations

## Future Enhancements

### Planned Features
- Google Calendar sync (API prepared)
- Microsoft Outlook sync
- iCal import/export
- Event templates
- Drag and drop attendees
- Event categories/tags
- Color picker for events
- Print view
- Email notifications
- Mobile app view
- Keyboard shortcuts panel
- Undo/Redo functionality

### Backend Requirements
To fully utilize all features, the backend should support:
- Event CRUD operations
- Recurring event expansion
- Reminder scheduling
- Calendar sharing
- Google Calendar OAuth integration
- Webhook notifications

## Troubleshooting

### Events Not Showing
- Check that the calendar is visible in the sidebar
- Verify the date range includes your events
- Check browser console for API errors

### Drag & Drop Not Working
- Ensure `editable={true}` in FullCalendar component
- Check that events have valid start/end dates
- Verify API endpoint for updates is working

### Styling Issues
- Ensure all FullCalendar CSS files are imported
- Check that calendar.css is loaded after FullCalendar CSS
- Verify Tailwind CSS variables are defined

### Dark Mode Not Working
- Check that `next-themes` is properly configured
- Verify CSS variables are defined for dark mode
- Ensure `.dark` class is applied to root element

## Dependencies

```json
{
  "@fullcalendar/react": "^6.1.11",
  "@fullcalendar/daygrid": "^6.1.11",
  "@fullcalendar/timegrid": "^6.1.11",
  "@fullcalendar/interaction": "^6.1.11",
  "@fullcalendar/list": "^6.1.11",
  "@tanstack/react-query": "^5.32.0",
  "date-fns": "^3.6.0",
  "lucide-react": "^0.376.0",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-switch": "^1.0.3",
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-scroll-area": "^1.0.5"
}
```

All dependencies are already installed in the project.

## Contributing

When adding new features:
1. Follow the existing code structure
2. Add TypeScript types for new data structures
3. Update this README with new features
4. Ensure dark mode compatibility
5. Add proper error handling
6. Test drag & drop functionality
7. Verify mobile responsiveness

## License

Part of the AIT-CORE Suite Portal project.

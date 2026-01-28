// Calendar event types
export interface CalendarEvent {
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

export interface EventReminder {
  type: 'email' | 'notification' | 'popup';
  minutesBefore: number;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  count?: number;
  until?: string;
  byDay?: string[]; // For weekly: ['MO', 'WE', 'FR']
  byMonthDay?: number[]; // For monthly: [1, 15]
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  isDefault?: boolean;
  description?: string;
  syncEnabled?: boolean;
  googleCalendarId?: string;
}

export interface EventFormData {
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  attendees: string[];
  reminders: EventReminder[];
  recurrence?: RecurrenceRule;
  calendarId: string;
}

// API Response types
export interface CalendarEventsResponse {
  events: CalendarEvent[];
  total: number;
}

export interface CalendarsResponse {
  calendars: Calendar[];
}

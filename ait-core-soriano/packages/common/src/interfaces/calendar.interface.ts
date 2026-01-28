import { z } from 'zod';

// Event Status
export const EventStatus = {
  CONFIRMED: 'confirmed',
  TENTATIVE: 'tentative',
  CANCELLED: 'cancelled',
} as const;

export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

// Event Recurrence
export const RecurrenceFrequency = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type RecurrenceFrequency = (typeof RecurrenceFrequency)[keyof typeof RecurrenceFrequency];

// Attendee Status
export const AttendeeStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  MAYBE: 'maybe',
} as const;

export type AttendeeStatus = (typeof AttendeeStatus)[keyof typeof AttendeeStatus];

// Calendar Event Schema
export const CalendarEventSchema = z.object({
  id: z.string().uuid(),
  calendarId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  allDay: z.boolean().default(false),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).default('confirmed'),
  visibility: z.enum(['public', 'private', 'confidential']).default('private'),
  organizerId: z.string().uuid(),
  attendees: z.array(z.object({
    userId: z.string().uuid().optional(),
    email: z.string().email(),
    name: z.string().optional(),
    status: z.enum(['pending', 'accepted', 'declined', 'maybe']),
    optional: z.boolean().default(false),
  })).default([]),
  recurrence: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().int().positive().default(1),
    endDate: z.string().datetime().optional(),
    count: z.number().int().positive().optional(),
    byDay: z.array(z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])).optional(),
  }).optional(),
  reminders: z.array(z.object({
    type: z.enum(['email', 'push', 'sms']),
    minutes: z.number().int().nonnegative(),
  })).default([]),
  color: z.string().optional(),
  meetingUrl: z.string().url().optional(),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
    mimeType: z.string(),
  })).default([]),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

// Create Event DTO
export const CreateEventSchema = CalendarEventSchema.pick({
  title: true,
  description: true,
  location: true,
  startTime: true,
  endTime: true,
  allDay: true,
  attendees: true,
  recurrence: true,
  reminders: true,
  color: true,
  meetingUrl: true,
}).partial({
  description: true,
  location: true,
  attendees: true,
  recurrence: true,
  reminders: true,
  color: true,
  meetingUrl: true,
});

export type CreateEventDto = z.infer<typeof CreateEventSchema>;

// Calendar
export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color: string;
  ownerId: string;
  isDefault: boolean;
  isShared: boolean;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

// Free/Busy
export interface FreeBusySlot {
  start: string;
  end: string;
  status: 'busy' | 'free' | 'tentative';
}

export interface FreeBusyResponse {
  calendars: Record<string, FreeBusySlot[]>;
  timeMin: string;
  timeMax: string;
}

// AI Scheduling
export interface AISchedulingSuggestion {
  proposedTime: string;
  duration: number;
  confidence: number;
  reason: string;
  conflicts: string[];
}

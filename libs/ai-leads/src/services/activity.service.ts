/**
 * Activity Service
 * Handles logging and tracking of all sales activities: calls, emails, meetings, tasks, events
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Activity,
  ActivityType,
  Task,
  Event,
  Call,
  EmailActivity,
  TaskPriority,
  TaskStatus,
  CallDisposition,
  EventAttendee,
  EmailAttachment
} from '../types';

/**
 * Base activity data
 */
interface BaseActivityData {
  relatedToType: 'lead' | 'contact' | 'account' | 'opportunity';
  relatedToId: string;
  relatedToName?: string;
  subject: string;
  description?: string;
  ownerId: string;
  ownerName?: string;
  dueDate?: Date;
  notes?: string;
}

/**
 * Call logging data
 */
export interface LogCallData extends BaseActivityData {
  direction: 'inbound' | 'outbound';
  phoneNumber?: string;
  callDuration?: number;
  disposition?: CallDisposition;
  recordingUrl?: string;
  transcription?: string;
  callbackDateTime?: Date;
}

/**
 * Email logging data
 */
export interface LogEmailData extends BaseActivityData {
  direction: 'sent' | 'received';
  fromAddress: string;
  toAddresses: string[];
  ccAddresses?: string[];
  bccAddresses?: string[];
  htmlBody?: string;
  textBody?: string;
  attachments?: EmailAttachment[];
  threadId?: string;
  messageId?: string;
  inReplyTo?: string;
}

/**
 * Meeting logging data
 */
export interface LogMeetingData extends BaseActivityData {
  startDateTime: Date;
  endDateTime: Date;
  location?: string;
  isVirtual?: boolean;
  meetingLink?: string;
  attendees?: EventAttendee[];
  calendarEventId?: string;
  allDay?: boolean;
  outcome?: string;
}

/**
 * Task scheduling data
 */
export interface ScheduleTaskData extends BaseActivityData {
  priority?: TaskPriority;
  reminderDateTime?: Date;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

/**
 * Event scheduling data
 */
export interface ScheduleEventData extends BaseActivityData {
  startDateTime: Date;
  endDateTime: Date;
  location?: string;
  isVirtual?: boolean;
  meetingLink?: string;
  attendees?: EventAttendee[];
  allDay?: boolean;
  showAs?: 'free' | 'tentative' | 'busy' | 'out_of_office';
}

export class ActivityService {
  private activities: Map<string, Activity> = new Map();
  private tasks: Map<string, Task> = new Map();
  private events: Map<string, Event> = new Map();
  private calls: Map<string, Call> = new Map();
  private emails: Map<string, EmailActivity> = new Map();

  /**
   * Log a phone call
   */
  async logCall(relatedId: string, callData: LogCallData): Promise<Call> {
    const now = new Date();

    const call: Call = {
      id: uuidv4(),
      type: ActivityType.CALL,
      relatedToType: callData.relatedToType,
      relatedToId: relatedId,
      relatedToName: callData.relatedToName,
      subject: callData.subject,
      description: callData.description,
      ownerId: callData.ownerId,
      ownerName: callData.ownerName,
      status: 'completed',
      dueDate: callData.dueDate,
      startDateTime: now,
      endDateTime: callData.callDuration
        ? new Date(now.getTime() + callData.callDuration * 1000)
        : now,
      duration: callData.callDuration ? Math.ceil(callData.callDuration / 60) : undefined,
      notes: callData.notes,
      direction: callData.direction,
      phoneNumber: callData.phoneNumber,
      callDuration: callData.callDuration,
      disposition: callData.disposition,
      recordingUrl: callData.recordingUrl,
      transcription: callData.transcription,
      callbackDateTime: callData.callbackDateTime,
      createdAt: now,
      updatedAt: now,
      completedAt: now
    };

    this.calls.set(call.id, call);
    this.activities.set(call.id, call);

    // If callback requested, create a follow-up task
    if (callData.callbackDateTime) {
      await this.scheduleTask(relatedId, {
        relatedToType: callData.relatedToType,
        relatedToId: relatedId,
        relatedToName: callData.relatedToName,
        subject: `Callback: ${callData.subject}`,
        description: `Follow-up call requested`,
        ownerId: callData.ownerId,
        ownerName: callData.ownerName,
        dueDate: callData.callbackDateTime,
        priority: TaskPriority.HIGH
      });
    }

    return call;
  }

  /**
   * Log an email activity
   */
  async logEmail(relatedId: string, emailData: LogEmailData): Promise<EmailActivity> {
    const now = new Date();

    const email: EmailActivity = {
      id: uuidv4(),
      type: ActivityType.EMAIL,
      relatedToType: emailData.relatedToType,
      relatedToId: relatedId,
      relatedToName: emailData.relatedToName,
      subject: emailData.subject,
      description: emailData.description,
      ownerId: emailData.ownerId,
      ownerName: emailData.ownerName,
      status: 'completed',
      dueDate: emailData.dueDate,
      startDateTime: now,
      notes: emailData.notes,
      direction: emailData.direction,
      fromAddress: emailData.fromAddress,
      toAddresses: emailData.toAddresses,
      ccAddresses: emailData.ccAddresses,
      bccAddresses: emailData.bccAddresses,
      htmlBody: emailData.htmlBody,
      textBody: emailData.textBody,
      hasAttachments: (emailData.attachments && emailData.attachments.length > 0) || false,
      attachments: emailData.attachments,
      threadId: emailData.threadId,
      messageId: emailData.messageId,
      inReplyTo: emailData.inReplyTo,
      opened: false,
      clicked: false,
      replied: false,
      createdAt: now,
      updatedAt: now,
      completedAt: now
    };

    this.emails.set(email.id, email);
    this.activities.set(email.id, email);

    return email;
  }

  /**
   * Log a meeting
   */
  async logMeeting(relatedId: string, meetingData: LogMeetingData): Promise<Event> {
    const now = new Date();

    const durationMinutes = Math.ceil(
      (meetingData.endDateTime.getTime() - meetingData.startDateTime.getTime()) / (1000 * 60)
    );

    const meeting: Event = {
      id: uuidv4(),
      type: ActivityType.MEETING,
      relatedToType: meetingData.relatedToType,
      relatedToId: relatedId,
      relatedToName: meetingData.relatedToName,
      subject: meetingData.subject,
      description: meetingData.description,
      ownerId: meetingData.ownerId,
      ownerName: meetingData.ownerName,
      status: meetingData.startDateTime > now ? 'planned' : 'completed',
      dueDate: meetingData.startDateTime,
      startDateTime: meetingData.startDateTime,
      endDateTime: meetingData.endDateTime,
      duration: durationMinutes,
      outcome: meetingData.outcome,
      notes: meetingData.notes,
      location: meetingData.location,
      isVirtual: meetingData.isVirtual,
      meetingLink: meetingData.meetingLink,
      attendees: meetingData.attendees,
      calendarEventId: meetingData.calendarEventId,
      allDay: meetingData.allDay,
      createdAt: now,
      updatedAt: now,
      completedAt: meetingData.startDateTime <= now ? now : undefined
    };

    this.events.set(meeting.id, meeting);
    this.activities.set(meeting.id, meeting);

    return meeting;
  }

  /**
   * Schedule a task
   */
  async scheduleTask(relatedId: string, taskData: ScheduleTaskData): Promise<Task> {
    const now = new Date();

    const task: Task = {
      id: uuidv4(),
      type: ActivityType.TASK,
      relatedToType: taskData.relatedToType,
      relatedToId: relatedId,
      relatedToName: taskData.relatedToName,
      subject: taskData.subject,
      description: taskData.description,
      ownerId: taskData.ownerId,
      ownerName: taskData.ownerName,
      status: 'planned',
      dueDate: taskData.dueDate,
      notes: taskData.notes,
      priority: taskData.priority || TaskPriority.NORMAL,
      taskStatus: TaskStatus.NOT_STARTED,
      isRecurring: taskData.isRecurring,
      recurrencePattern: taskData.recurrencePattern,
      reminderDateTime: taskData.reminderDateTime,
      reminderSent: false,
      createdAt: now,
      updatedAt: now
    };

    this.tasks.set(task.id, task);
    this.activities.set(task.id, task);

    return task;
  }

  /**
   * Schedule an event
   */
  async scheduleEvent(relatedId: string, eventData: ScheduleEventData): Promise<Event> {
    const now = new Date();

    const durationMinutes = Math.ceil(
      (eventData.endDateTime.getTime() - eventData.startDateTime.getTime()) / (1000 * 60)
    );

    const event: Event = {
      id: uuidv4(),
      type: ActivityType.EVENT,
      relatedToType: eventData.relatedToType,
      relatedToId: relatedId,
      relatedToName: eventData.relatedToName,
      subject: eventData.subject,
      description: eventData.description,
      ownerId: eventData.ownerId,
      ownerName: eventData.ownerName,
      status: 'planned',
      dueDate: eventData.startDateTime,
      startDateTime: eventData.startDateTime,
      endDateTime: eventData.endDateTime,
      duration: durationMinutes,
      notes: eventData.notes,
      location: eventData.location,
      isVirtual: eventData.isVirtual,
      meetingLink: eventData.meetingLink,
      attendees: eventData.attendees,
      allDay: eventData.allDay,
      showAs: eventData.showAs,
      createdAt: now,
      updatedAt: now
    };

    this.events.set(event.id, event);
    this.activities.set(event.id, event);

    return event;
  }

  /**
   * Get all activities for a lead
   */
  async getActivitiesByLead(leadId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.relatedToType === 'lead' && activity.relatedToId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get all activities for a user
   */
  async getActivitiesByUser(userId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.ownerId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get upcoming activities for a user
   */
  async getUpcomingActivities(userId: string, days: number = 7): Promise<Activity[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return Array.from(this.activities.values())
      .filter((activity) => {
        if (activity.ownerId !== userId) return false;
        if (activity.status === 'completed' || activity.status === 'cancelled') return false;

        const activityDate = activity.dueDate || activity.startDateTime;
        if (!activityDate) return false;

        return new Date(activityDate) >= now && new Date(activityDate) <= futureDate;
      })
      .sort((a, b) => {
        const dateA = a.dueDate || a.startDateTime;
        const dateB = b.dueDate || b.startDateTime;
        if (!dateA || !dateB) return 0;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
  }

  /**
   * Get overdue activities for a user
   */
  async getOverdueActivities(userId: string): Promise<Activity[]> {
    const now = new Date();

    return Array.from(this.activities.values())
      .filter((activity) => {
        if (activity.ownerId !== userId) return false;
        if (activity.status === 'completed' || activity.status === 'cancelled') return false;

        const activityDate = activity.dueDate || activity.startDateTime;
        if (!activityDate) return false;

        return new Date(activityDate) < now;
      })
      .sort((a, b) => {
        const dateA = a.dueDate || a.startDateTime;
        const dateB = b.dueDate || b.startDateTime;
        if (!dateA || !dateB) return 0;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
  }

  /**
   * Get activities by type
   */
  async getActivitiesByType(type: ActivityType): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Update activity status
   */
  async updateActivityStatus(
    activityId: string,
    status: Activity['status']
  ): Promise<Activity> {
    const activity = this.activities.get(activityId);
    if (!activity) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    const updatedActivity: Activity = {
      ...activity,
      status,
      updatedAt: new Date(),
      completedAt: status === 'completed' ? new Date() : activity.completedAt
    };

    this.activities.set(activityId, updatedActivity);

    // Update in specific collection
    switch (activity.type) {
      case ActivityType.TASK:
        this.tasks.set(activityId, updatedActivity as Task);
        break;
      case ActivityType.MEETING:
      case ActivityType.EVENT:
        this.events.set(activityId, updatedActivity as Event);
        break;
      case ActivityType.CALL:
        this.calls.set(activityId, updatedActivity as Call);
        break;
      case ActivityType.EMAIL:
        this.emails.set(activityId, updatedActivity as EmailActivity);
        break;
    }

    return updatedActivity;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, taskStatus: TaskStatus): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const activityStatus: Activity['status'] =
      taskStatus === TaskStatus.COMPLETED
        ? 'completed'
        : taskStatus === TaskStatus.IN_PROGRESS
        ? 'in_progress'
        : 'planned';

    const updatedTask: Task = {
      ...task,
      taskStatus,
      status: activityStatus,
      updatedAt: new Date(),
      completedAt: taskStatus === TaskStatus.COMPLETED ? new Date() : task.completedAt
    };

    this.tasks.set(taskId, updatedTask);
    this.activities.set(taskId, updatedTask);

    return updatedTask;
  }

  /**
   * Update email tracking (open/click)
   */
  async updateEmailTracking(
    emailId: string,
    tracking: { opened?: boolean; clicked?: boolean; replied?: boolean }
  ): Promise<EmailActivity> {
    const email = this.emails.get(emailId);
    if (!email) {
      throw new Error(`Email not found: ${emailId}`);
    }

    const now = new Date();
    const updatedEmail: EmailActivity = {
      ...email,
      updatedAt: now
    };

    if (tracking.opened && !email.opened) {
      updatedEmail.opened = true;
      updatedEmail.openedAt = now;
    }

    if (tracking.clicked && !email.clicked) {
      updatedEmail.clicked = true;
      updatedEmail.clickedAt = now;
    }

    if (tracking.replied && !email.replied) {
      updatedEmail.replied = true;
      updatedEmail.repliedAt = now;
    }

    this.emails.set(emailId, updatedEmail);
    this.activities.set(emailId, updatedEmail);

    return updatedEmail;
  }

  /**
   * Get activity by ID
   */
  async getActivity(id: string): Promise<Activity | null> {
    return this.activities.get(id) || null;
  }

  /**
   * Get task by ID
   */
  async getTask(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  /**
   * Get event by ID
   */
  async getEvent(id: string): Promise<Event | null> {
    return this.events.get(id) || null;
  }

  /**
   * Get call by ID
   */
  async getCall(id: string): Promise<Call | null> {
    return this.calls.get(id) || null;
  }

  /**
   * Get email by ID
   */
  async getEmail(id: string): Promise<EmailActivity | null> {
    return this.emails.get(id) || null;
  }

  /**
   * Delete an activity
   */
  async deleteActivity(id: string): Promise<boolean> {
    const activity = this.activities.get(id);
    if (!activity) return false;

    this.activities.delete(id);

    switch (activity.type) {
      case ActivityType.TASK:
        this.tasks.delete(id);
        break;
      case ActivityType.MEETING:
      case ActivityType.EVENT:
        this.events.delete(id);
        break;
      case ActivityType.CALL:
        this.calls.delete(id);
        break;
      case ActivityType.EMAIL:
        this.emails.delete(id);
        break;
    }

    return true;
  }

  /**
   * Get activity count by related entity
   */
  async getActivityCount(
    relatedToType: 'lead' | 'contact' | 'account' | 'opportunity',
    relatedToId: string
  ): Promise<number> {
    return Array.from(this.activities.values()).filter(
      (activity) =>
        activity.relatedToType === relatedToType && activity.relatedToId === relatedToId
    ).length;
  }

  /**
   * Get last activity date for an entity
   */
  async getLastActivityDate(
    relatedToType: 'lead' | 'contact' | 'account' | 'opportunity',
    relatedToId: string
  ): Promise<Date | null> {
    const activities = Array.from(this.activities.values())
      .filter(
        (activity) =>
          activity.relatedToType === relatedToType && activity.relatedToId === relatedToId
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return activities.length > 0 ? new Date(activities[0]!.createdAt) : null;
  }

  /**
   * Get activity summary for an entity
   */
  async getActivitySummary(
    relatedToType: 'lead' | 'contact' | 'account' | 'opportunity',
    relatedToId: string
  ): Promise<{
    total: number;
    byType: Record<string, number>;
    lastActivity: Date | null;
    upcoming: number;
    overdue: number;
  }> {
    const activities = Array.from(this.activities.values()).filter(
      (activity) =>
        activity.relatedToType === relatedToType && activity.relatedToId === relatedToId
    );

    const now = new Date();
    const byType: Record<string, number> = {};

    let upcoming = 0;
    let overdue = 0;

    for (const activity of activities) {
      byType[activity.type] = (byType[activity.type] || 0) + 1;

      if (activity.status !== 'completed' && activity.status !== 'cancelled') {
        const activityDate = activity.dueDate || activity.startDateTime;
        if (activityDate) {
          if (new Date(activityDate) < now) {
            overdue++;
          } else {
            upcoming++;
          }
        }
      }
    }

    const sortedActivities = [...activities].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      total: activities.length,
      byType,
      lastActivity: sortedActivities.length > 0 ? new Date(sortedActivities[0]!.createdAt) : null,
      upcoming,
      overdue
    };
  }

  /**
   * Get all activities
   */
  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  /**
   * Get all events
   */
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
}

export const activityService = new ActivityService();

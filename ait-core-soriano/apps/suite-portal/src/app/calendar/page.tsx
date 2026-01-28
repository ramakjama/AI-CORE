'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { format, startOfMonth, endOfMonth, addDays, startOfWeek, endOfWeek } from 'date-fns';

// FullCalendar styles
import '@fullcalendar/common/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import '@fullcalendar/list/main.css';
import './calendar.css';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Settings,
  Download,
  Upload,
  X
} from 'lucide-react';

import { calendarApi } from '@/lib/api';
import { CalendarEvent, Calendar as CalendarType, EventFormData } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Import sub-components
import { EventModal } from './components/EventModal';
import { CalendarSidebar } from './components/CalendarSidebar';
import { CalendarToolbar } from './components/CalendarToolbar';

// Default calendars
const DEFAULT_CALENDARS: CalendarType[] = [
  { id: 'personal', name: 'Personal', color: '#3b82f6', visible: true, isDefault: true },
  { id: 'work', name: 'Work', color: '#ef4444', visible: true },
  { id: 'family', name: 'Family', color: '#10b981', visible: true },
  { id: 'others', name: 'Others', color: '#8b5cf6', visible: true },
];

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const calendarRef = useRef<any>(null);

  // State
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [calendars, setCalendars] = useState<CalendarType[]>(DEFAULT_CALENDARS);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Fetch events
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['calendar-events', currentDate],
    queryFn: async () => {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return calendarApi.get<{ events: CalendarEvent[] }>('/events', {
        params: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (data: EventFormData) => calendarApi.post('/events', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventFormData> }) =>
      calendarApi.patch(`/events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => calendarApi.delete(`/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    },
  });

  // Filter events by visible calendars
  const visibleEvents = React.useMemo(() => {
    if (!eventsData?.events) return [];

    const visibleCalendarIds = calendars
      .filter(cal => cal.visible)
      .map(cal => cal.id);

    return eventsData.events
      .filter(event => visibleCalendarIds.includes(event.calendarId))
      .map(event => {
        const calendar = calendars.find(cal => cal.id === event.calendarId);
        return {
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          backgroundColor: event.color || calendar?.color || '#3b82f6',
          borderColor: event.color || calendar?.color || '#3b82f6',
          extendedProps: event,
        };
      });
  }, [eventsData, calendars]);

  // Filtered events for search
  const filteredEvents = React.useMemo(() => {
    if (!searchQuery) return visibleEvents;

    const query = searchQuery.toLowerCase();
    return visibleEvents.filter(event =>
      event.title.toLowerCase().includes(query) ||
      event.extendedProps?.description?.toLowerCase().includes(query) ||
      event.extendedProps?.location?.toLowerCase().includes(query)
    );
  }, [visibleEvents, searchQuery]);

  // Handlers
  const handleDateClick = (arg: any) => {
    setSelectedEvent({
      id: '',
      title: '',
      start: arg.dateStr,
      end: arg.dateStr,
      allDay: arg.allDay,
      calendarId: calendars.find(cal => cal.isDefault)?.id || calendars[0].id,
    } as CalendarEvent);
    setIsEventModalOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event.extendedProps as CalendarEvent);
    setIsEventModalOpen(true);
  };

  const handleEventDrop = (dropInfo: any) => {
    const event = dropInfo.event.extendedProps as CalendarEvent;
    updateEventMutation.mutate({
      id: event.id,
      data: {
        start: dropInfo.event.start.toISOString(),
        end: dropInfo.event.end?.toISOString() || dropInfo.event.start.toISOString(),
      } as any,
    });
  };

  const handleEventResize = (resizeInfo: any) => {
    const event = resizeInfo.event.extendedProps as CalendarEvent;
    updateEventMutation.mutate({
      id: event.id,
      data: {
        start: resizeInfo.event.start.toISOString(),
        end: resizeInfo.event.end?.toISOString() || resizeInfo.event.start.toISOString(),
      } as any,
    });
  };

  const handleSaveEvent = (data: EventFormData) => {
    if (selectedEvent?.id) {
      updateEventMutation.mutate({ id: selectedEvent.id, data });
    } else {
      createEventMutation.mutate(data);
    }
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEventMutation.mutate(id);
    }
  };

  const handleViewChange = (newView: typeof view) => {
    setView(newView);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(newView);
    }
  };

  const handleToday = () => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.today();
      setCurrentDate(new Date());
    }
  };

  const handlePrev = () => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.prev();
      setCurrentDate(api.getDate());
    }
  };

  const handleNext = () => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.next();
      setCurrentDate(api.getDate());
    }
  };

  const handleCalendarToggle = (calendarId: string) => {
    setCalendars(prev =>
      prev.map(cal =>
        cal.id === calendarId ? { ...cal, visible: !cal.visible } : cal
      )
    );
  };

  const handleDateSelect = (date: Date) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.gotoDate(date);
      setCurrentDate(date);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <CalendarSidebar
        calendars={calendars}
        currentDate={currentDate}
        events={eventsData?.events || []}
        searchQuery={searchQuery}
        isCollapsed={isSidebarCollapsed}
        onSearchChange={setSearchQuery}
        onCalendarToggle={handleCalendarToggle}
        onDateSelect={handleDateSelect}
        onCreateEvent={() => {
          setSelectedEvent({
            id: '',
            title: '',
            start: new Date().toISOString(),
            end: new Date().toISOString(),
            calendarId: calendars.find(cal => cal.isDefault)?.id || calendars[0].id,
          } as CalendarEvent);
          setIsEventModalOpen(true);
        }}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <CalendarToolbar
          view={view}
          currentDate={currentDate}
          onViewChange={handleViewChange}
          onToday={handleToday}
          onPrev={handlePrev}
          onNext={handleNext}
          onCreateEvent={() => {
            setSelectedEvent({
              id: '',
              title: '',
              start: new Date().toISOString(),
              end: new Date().toISOString(),
              calendarId: calendars.find(cal => cal.isDefault)?.id || calendars[0].id,
            } as CalendarEvent);
            setIsEventModalOpen(true);
          }}
        />

        {/* Calendar */}
        <div className="flex-1 overflow-auto p-6">
          <div className="h-full bg-card rounded-lg border shadow-sm">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={view}
              headerToolbar={false}
              events={filteredEvents}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              height="100%"
              nowIndicator={true}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              expandRows={true}
              handleWindowResize={true}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
              }}
              firstDay={1} // Monday
              locale="es"
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
                list: 'Agenda',
              }}
              allDayText="Todo el día"
              noEventsText="No hay eventos para mostrar"
              moreLinkText="más"
            />
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        event={selectedEvent}
        calendars={calendars}
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        isLoading={createEventMutation.isPending || updateEventMutation.isPending}
      />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { format, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CalendarEvent, Calendar } from '@/types/calendar';

interface CalendarSidebarProps {
  calendars: Calendar[];
  currentDate: Date;
  events: CalendarEvent[];
  searchQuery: string;
  isCollapsed: boolean;
  onSearchChange: (query: string) => void;
  onCalendarToggle: (calendarId: string) => void;
  onDateSelect: (date: Date) => void;
  onCreateEvent: () => void;
  onToggleCollapse: () => void;
}

export function CalendarSidebar({
  calendars,
  currentDate,
  events,
  searchQuery,
  isCollapsed,
  onSearchChange,
  onCalendarToggle,
  onDateSelect,
  onCreateEvent,
  onToggleCollapse,
}: CalendarSidebarProps) {
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(miniCalendarDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(miniCalendarDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return events
      .filter(event => new Date(event.start) >= today)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  };

  const hasEventsOnDay = (day: Date) => {
    return events.some(event => isSameDay(new Date(event.start), day));
  };

  if (isCollapsed) {
    return (
      <div className="w-16 border-r bg-card flex flex-col items-center py-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCreateEvent}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Mini Calendar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">
                {format(miniCalendarDate, 'MMMM yyyy', { locale: es })}
              </h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setMiniCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setMiniCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                <div key={i} className="text-muted-foreground font-medium py-1">
                  {day}
                </div>
              ))}
              {getDaysInMonth().map((day, i) => {
                const isCurrentMonth = day.getMonth() === miniCalendarDate.getMonth();
                const isSelected = isSameDay(day, currentDate);
                const isTodayDate = isToday(day);
                const hasEvents = hasEventsOnDay(day);

                return (
                  <button
                    key={i}
                    onClick={() => onDateSelect(day)}
                    className={cn(
                      'aspect-square rounded-md text-xs font-medium transition-colors relative',
                      !isCurrentMonth && 'text-muted-foreground/50',
                      isCurrentMonth && 'hover:bg-accent',
                      isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                      isTodayDate && !isSelected && 'bg-accent font-bold'
                    )}
                  >
                    {format(day, 'd')}
                    {hasEvents && !isSelected && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* My Calendars */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Mis calendarios</h3>
            <div className="space-y-1">
              {calendars.map((calendar) => (
                <label
                  key={calendar.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer group"
                >
                  <Checkbox
                    checked={calendar.visible}
                    onCheckedChange={() => onCalendarToggle(calendar.id)}
                  />
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: calendar.color }}
                  />
                  <span className="text-sm flex-1">{calendar.name}</span>
                  {calendar.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      Por defecto
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Próximos eventos</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateEvent}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Nuevo
              </Button>
            </div>
            <div className="space-y-2">
              {getUpcomingEvents().length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay eventos próximos
                </p>
              ) : (
                getUpcomingEvents().map((event) => {
                  const calendar = calendars.find(cal => cal.id === event.calendarId);
                  return (
                    <div
                      key={event.id}
                      className="p-2 rounded-md border bg-background hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="w-1 h-full rounded-full mt-1"
                          style={{ backgroundColor: event.color || calendar?.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.start), 'PPp', { locale: es })}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Google Calendar Sync */}
          <div className="space-y-2 pt-2 border-t">
            <h3 className="font-medium text-sm">Integración</h3>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              disabled
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"
                />
              </svg>
              Sincronizar con Google Calendar
            </Button>
            <p className="text-xs text-muted-foreground">
              Próximamente: sincronización automática con Google Calendar
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

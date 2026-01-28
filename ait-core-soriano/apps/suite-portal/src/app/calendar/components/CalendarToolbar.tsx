'use client';

import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Download,
  Settings,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CalendarToolbarProps {
  view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
  currentDate: Date;
  onViewChange: (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek') => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCreateEvent: () => void;
}

export function CalendarToolbar({
  view,
  currentDate,
  onViewChange,
  onToday,
  onPrev,
  onNext,
  onCreateEvent,
}: CalendarToolbarProps) {
  const getViewLabel = (view: string) => {
    switch (view) {
      case 'dayGridMonth':
        return 'Mes';
      case 'timeGridWeek':
        return 'Semana';
      case 'timeGridDay':
        return 'Día';
      case 'listWeek':
        return 'Agenda';
      default:
        return 'Mes';
    }
  };

  const getDateLabel = () => {
    switch (view) {
      case 'dayGridMonth':
        return format(currentDate, 'MMMM yyyy', { locale: es });
      case 'timeGridWeek':
        return format(currentDate, "'Semana del' d 'de' MMMM yyyy", { locale: es });
      case 'timeGridDay':
        return format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es });
      case 'listWeek':
        return format(currentDate, "'Agenda de la semana del' d 'de' MMMM", { locale: es });
      default:
        return format(currentDate, 'MMMM yyyy', { locale: es });
    }
  };

  return (
    <div className="border-b bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onCreateEvent}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear evento
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={onToday}>
              Hoy
            </Button>
            <Button variant="outline" size="icon" onClick={onNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-xl font-semibold capitalize ml-4">
            {getDateLabel()}
          </h2>
        </div>

        {/* Right: View Selector and Actions */}
        <div className="flex items-center gap-2">
          <Select
            value={view}
            onValueChange={(value: any) => onViewChange(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dayGridMonth">Mes</SelectItem>
              <SelectItem value="timeGridWeek">Semana</SelectItem>
              <SelectItem value="timeGridDay">Día</SelectItem>
              <SelectItem value="listWeek">Agenda</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

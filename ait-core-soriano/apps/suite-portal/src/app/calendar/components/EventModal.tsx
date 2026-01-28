'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Bell,
  Repeat,
  AlignLeft,
  Trash2,
  Save,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CalendarEvent, Calendar, EventFormData, EventReminder, RecurrenceRule } from '@/types/calendar';

interface EventModalProps {
  event: CalendarEvent | null;
  calendars: Calendar[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EventFormData) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function EventModal({
  event,
  calendars,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isLoading = false,
}: EventModalProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    start: '',
    end: '',
    allDay: false,
    location: '',
    attendees: [],
    reminders: [],
    calendarId: calendars[0]?.id || '',
  });

  const [newAttendee, setNewAttendee] = useState('');
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({
    frequency: 'weekly',
    interval: 1,
  });

  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        start: event.start || new Date().toISOString(),
        end: event.end || new Date().toISOString(),
        allDay: event.allDay || false,
        location: event.location || '',
        attendees: event.attendees || [],
        reminders: event.reminders || [],
        recurrence: event.recurrence,
        calendarId: event.calendarId || calendars[0]?.id || '',
      });
      setShowRecurrence(!!event.recurrence);
      if (event.recurrence) {
        setRecurrence(event.recurrence);
      }
    }
  }, [event, isOpen, calendars]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = {
      ...formData,
      recurrence: showRecurrence ? recurrence : undefined,
    };

    onSave(dataToSave);
  };

  const handleAddAttendee = () => {
    if (newAttendee && newAttendee.includes('@')) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, newAttendee],
      }));
      setNewAttendee('');
    }
  };

  const handleRemoveAttendee = (email: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== email),
    }));
  };

  const handleAddReminder = (minutesBefore: number) => {
    const newReminder: EventReminder = {
      type: 'notification',
      minutesBefore,
    };
    setFormData(prev => ({
      ...prev,
      reminders: [...prev.reminders, newReminder],
    }));
  };

  const handleRemoveReminder = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index),
    }));
  };

  const getReminderLabel = (minutes: number) => {
    if (minutes === 0) return 'En el momento';
    if (minutes < 60) return `${minutes} minutos antes`;
    if (minutes === 60) return '1 hora antes';
    if (minutes < 1440) return `${Math.floor(minutes / 60)} horas antes`;
    return `${Math.floor(minutes / 1440)} días antes`;
  };

  const selectedCalendar = calendars.find(cal => cal.id === formData.calendarId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {event?.id ? 'Editar evento' : 'Crear evento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Agregar título"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Inicio *</Label>
                  <Input
                    id="start"
                    type={formData.allDay ? 'date' : 'datetime-local'}
                    value={
                      formData.allDay
                        ? formData.start.split('T')[0]
                        : format(new Date(formData.start), "yyyy-MM-dd'T'HH:mm")
                    }
                    onChange={(e) => {
                      const value = formData.allDay
                        ? `${e.target.value}T00:00:00`
                        : e.target.value;
                      setFormData({ ...formData, start: new Date(value).toISOString() });
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">Fin *</Label>
                  <Input
                    id="end"
                    type={formData.allDay ? 'date' : 'datetime-local'}
                    value={
                      formData.allDay
                        ? formData.end.split('T')[0]
                        : format(new Date(formData.end), "yyyy-MM-dd'T'HH:mm")
                    }
                    onChange={(e) => {
                      const value = formData.allDay
                        ? `${e.target.value}T23:59:59`
                        : e.target.value;
                      setFormData({ ...formData, end: new Date(value).toISOString() });
                    }}
                    required
                  />
                </div>
              </div>

              {/* All Day */}
              <div className="flex items-center gap-2">
                <Switch
                  id="allDay"
                  checked={formData.allDay}
                  onCheckedChange={(checked) => setFormData({ ...formData, allDay: checked })}
                />
                <Label htmlFor="allDay" className="cursor-pointer">
                  Todo el día
                </Label>
              </div>

              {/* Calendar Selector */}
              <div className="space-y-2">
                <Label htmlFor="calendar">Calendario *</Label>
                <Select
                  value={formData.calendarId}
                  onValueChange={(value) => setFormData({ ...formData, calendarId: value })}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      {selectedCalendar && (
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: selectedCalendar.color }}
                        />
                      )}
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map((calendar) => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: calendar.color }}
                          />
                          {calendar.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  <AlignLeft className="h-4 w-4 inline mr-1" />
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  placeholder="Agregar descripción"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Ubicación
                </Label>
                <Input
                  id="location"
                  placeholder="Agregar ubicación"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              {/* Attendees */}
              <div className="space-y-2">
                <Label>
                  <Users className="h-4 w-4 inline mr-1" />
                  Invitados
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar email"
                    value={newAttendee}
                    onChange={(e) => setNewAttendee(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAttendee();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddAttendee}>
                    Agregar
                  </Button>
                </div>
                {formData.attendees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.attendees.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveAttendee(email)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Reminders */}
              <div className="space-y-2">
                <Label>
                  <Bell className="h-4 w-4 inline mr-1" />
                  Recordatorios
                </Label>
                <Select onValueChange={(value) => handleAddReminder(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Agregar recordatorio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">En el momento</SelectItem>
                    <SelectItem value="5">5 minutos antes</SelectItem>
                    <SelectItem value="10">10 minutos antes</SelectItem>
                    <SelectItem value="15">15 minutos antes</SelectItem>
                    <SelectItem value="30">30 minutos antes</SelectItem>
                    <SelectItem value="60">1 hora antes</SelectItem>
                    <SelectItem value="120">2 horas antes</SelectItem>
                    <SelectItem value="1440">1 día antes</SelectItem>
                  </SelectContent>
                </Select>
                {formData.reminders.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {formData.reminders.map((reminder, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-md bg-muted"
                      >
                        <span className="text-sm">
                          {getReminderLabel(reminder.minutesBefore)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveReminder(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recurrence */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="recurrence"
                    checked={showRecurrence}
                    onCheckedChange={setShowRecurrence}
                  />
                  <Label htmlFor="recurrence" className="cursor-pointer">
                    <Repeat className="h-4 w-4 inline mr-1" />
                    Repetir evento
                  </Label>
                </div>

                {showRecurrence && (
                  <div className="pl-6 space-y-3 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Frecuencia</Label>
                        <Select
                          value={recurrence.frequency}
                          onValueChange={(value: any) =>
                            setRecurrence({ ...recurrence, frequency: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diariamente</SelectItem>
                            <SelectItem value="weekly">Semanalmente</SelectItem>
                            <SelectItem value="monthly">Mensualmente</SelectItem>
                            <SelectItem value="yearly">Anualmente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cada</Label>
                        <Input
                          type="number"
                          min="1"
                          value={recurrence.interval}
                          onChange={(e) =>
                            setRecurrence({
                              ...recurrence,
                              interval: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Finaliza (opcional)</Label>
                      <Input
                        type="date"
                        value={recurrence.until?.split('T')[0] || ''}
                        onChange={(e) =>
                          setRecurrence({
                            ...recurrence,
                            until: e.target.value ? `${e.target.value}T00:00:00` : undefined,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <div className="flex items-center justify-between w-full">
              <div>
                {event?.id && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(event.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || !formData.title}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

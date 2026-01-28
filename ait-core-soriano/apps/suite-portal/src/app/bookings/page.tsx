"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { EventClickArg, DateSelectArg } from "@fullcalendar/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  Trash2,
  X,
  DoorOpen,
  Laptop,
  Projector,
  Coffee,
  Users,
  Check,
  AlertCircle,
} from "lucide-react";
import { nanoid } from "nanoid";
import { format, addHours, isBefore, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

// Types
interface Resource {
  id: string;
  name: string;
  type: "room" | "equipment";
  capacity?: number;
  description?: string;
  available: boolean;
}

interface Booking {
  id: string;
  resourceId: string;
  title: string;
  start: Date;
  end: Date;
  notes?: string;
  userId: string;
  userName: string;
}

// Validation schema
const bookingSchema = z.object({
  resourceId: z.string().min(1, "Please select a resource"),
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  duration: z.string().min(1, "Duration is required"),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // Validate that start time is in the future
    const start = new Date(`${data.date}T${data.startTime}`);
    return isAfter(start, new Date());
  },
  {
    message: "Booking must be in the future",
    path: ["startTime"],
  }
);

type BookingInput = z.infer<typeof bookingSchema>;

// Mock data
const mockResources: Resource[] = [
  {
    id: "1",
    name: "Conference Room A",
    type: "room",
    capacity: 12,
    description: "Large conference room with projector and whiteboard",
    available: true,
  },
  {
    id: "2",
    name: "Meeting Room B",
    type: "room",
    capacity: 6,
    description: "Small meeting room for team discussions",
    available: true,
  },
  {
    id: "3",
    name: "Projector #1",
    type: "equipment",
    description: "4K projector with HDMI and wireless connectivity",
    available: true,
  },
  {
    id: "4",
    name: "Laptop - Dell XPS",
    type: "equipment",
    description: "High-performance laptop for presentations",
    available: true,
  },
  {
    id: "5",
    name: "Training Room",
    type: "room",
    capacity: 20,
    description: "Large training room with presentation equipment",
    available: true,
  },
];

const mockBookings: Booking[] = [
  {
    id: "1",
    resourceId: "1",
    title: "Team Standup",
    start: new Date(2026, 0, 28, 9, 0),
    end: new Date(2026, 0, 28, 10, 0),
    notes: "Daily team meeting",
    userId: "1",
    userName: "John Doe",
  },
  {
    id: "2",
    resourceId: "1",
    title: "Client Presentation",
    start: new Date(2026, 0, 28, 14, 0),
    end: new Date(2026, 0, 28, 16, 0),
    notes: "Q4 results presentation",
    userId: "1",
    userName: "John Doe",
  },
  {
    id: "3",
    resourceId: "2",
    title: "Design Review",
    start: new Date(2026, 0, 29, 10, 0),
    end: new Date(2026, 0, 29, 11, 0),
    userId: "2",
    userName: "Jane Smith",
  },
];

// Resource icon component
function ResourceIcon({ type }: { type: Resource["type"] }) {
  if (type === "room") return <DoorOpen className="h-4 w-4" />;
  return <Laptop className="h-4 w-4" />;
}

// Resource card component
function ResourceCard({
  resource,
  onBook,
}: {
  resource: Resource;
  onBook: (resourceId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ResourceIcon type={resource.type} />
              {resource.name}
            </CardTitle>
            <CardDescription>{resource.description}</CardDescription>
          </div>
          <Badge variant={resource.available ? "default" : "secondary"}>
            {resource.available ? "Available" : "Unavailable"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {resource.capacity && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Capacity: {resource.capacity} people
          </div>
        )}
        <Button
          className="w-full"
          onClick={() => onBook(resource.id)}
          disabled={!resource.available}
        >
          Book Resource
        </Button>
      </CardContent>
    </Card>
  );
}

export default function BookingsPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<DateSelectArg | null>(null);
  const [filterType, setFilterType] = useState<"all" | "room" | "equipment">("all");

  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      resourceId: "",
      title: "",
      date: "",
      startTime: "",
      duration: "1",
      notes: "",
    },
  });

  // Get calendar events from bookings
  const calendarEvents = bookings.map((booking) => {
    const resource = resources.find((r) => r.id === booking.resourceId);
    return {
      id: booking.id,
      title: `${booking.title} - ${resource?.name || "Unknown"}`,
      start: booking.start,
      end: booking.end,
      backgroundColor: resource?.type === "room" ? "#3b82f6" : "#10b981",
      borderColor: resource?.type === "room" ? "#2563eb" : "#059669",
    };
  });

  // Get user's bookings
  const myBookings = bookings.filter((b) => b.userId === "1"); // Current user ID

  // Handlers
  const openBookingDialog = (resourceId?: string) => {
    const now = new Date();
    const defaultDate = format(now, "yyyy-MM-dd");
    const defaultTime = format(addHours(now, 1), "HH:00");

    form.reset({
      resourceId: resourceId || "",
      title: "",
      date: defaultDate,
      startTime: defaultTime,
      duration: "1",
      notes: "",
    });

    setSelectedBooking(null);
    setShowBookingDialog(true);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo);
    form.reset({
      resourceId: "",
      title: "",
      date: format(selectInfo.start, "yyyy-MM-dd"),
      startTime: format(selectInfo.start, "HH:mm"),
      duration: "1",
      notes: "",
    });
    setShowBookingDialog(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const booking = bookings.find((b) => b.id === clickInfo.event.id);
    if (booking) {
      setSelectedBooking(booking);
    }
  };

  const saveBooking = (data: BookingInput) => {
    const resource = resources.find((r) => r.id === data.resourceId);
    if (!resource) return;

    const start = new Date(`${data.date}T${data.startTime}`);
    const end = addHours(start, parseInt(data.duration));

    // Check for conflicts
    const hasConflict = bookings.some(
      (b) =>
        b.resourceId === data.resourceId &&
        ((start >= b.start && start < b.end) || (end > b.start && end <= b.end))
    );

    if (hasConflict) {
      form.setError("startTime", {
        message: "This resource is already booked for the selected time",
      });
      return;
    }

    const newBooking: Booking = {
      id: nanoid(),
      resourceId: data.resourceId,
      title: data.title,
      start,
      end,
      notes: data.notes,
      userId: "1",
      userName: "John Doe",
    };

    setBookings([...bookings, newBooking]);
    setShowBookingDialog(false);
    form.reset();
  };

  const cancelBooking = (id: string) => {
    setBookings(bookings.filter((b) => b.id !== id));
    setSelectedBooking(null);
  };

  const filteredResources = resources.filter((r) => {
    if (filterType === "all") return true;
    return r.type === filterType;
  });

  // Check if resource is available at given time
  const isResourceAvailable = (resourceId: string, start: Date, end: Date) => {
    return !bookings.some(
      (b) =>
        b.resourceId === resourceId &&
        ((start >= b.start && start < b.end) || (end > b.start && end <= b.end))
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-7xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resource Booking</h1>
            <p className="text-muted-foreground">
              Book meeting rooms and equipment for your team
            </p>
          </div>
          <Button onClick={() => openBookingDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Resources & My Bookings */}
          <div className="space-y-6">
            {/* Resources */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Available Resources</CardTitle>
                  <Select
                    value={filterType}
                    onValueChange={(v) => setFilterType(v as any)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="room">Rooms</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {filteredResources.map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        onBook={openBookingDialog}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* My Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>{myBookings.length} upcoming bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {myBookings.map((booking) => {
                      const resource = resources.find((r) => r.id === booking.resourceId);
                      return (
                        <Card key={booking.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">{booking.title}</CardTitle>
                            <CardDescription className="text-xs">
                              {resource?.name}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CalendarIcon className="h-3 w-3" />
                              {format(booking.start, "MMM d, yyyy")}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(booking.start, "h:mm a")} - {format(booking.end, "h:mm a")}
                            </div>
                            {booking.notes && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {booking.notes}
                              </p>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full"
                              onClick={() => cancelBooking(booking.id)}
                            >
                              <X className="mr-1 h-3 w-3" />
                              Cancel Booking
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {myBookings.length === 0 && (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        No bookings yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right: Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>Click on a date to create a booking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="calendar-wrapper">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                    }}
                    events={calendarEvents}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    height="auto"
                    slotMinTime="08:00:00"
                    slotMaxTime="20:00:00"
                    allDaySlot={false}
                    nowIndicator={true}
                    eventTimeFormat={{
                      hour: "2-digit",
                      minute: "2-digit",
                      meridiem: "short",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Booking</DialogTitle>
            <DialogDescription>Book a resource for your team</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(saveBooking)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resourceId">Resource *</Label>
              <Controller
                name="resourceId"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="resourceId">
                      <SelectValue placeholder="Select a resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {resources.map((resource) => (
                        <SelectItem key={resource.id} value={resource.id}>
                          <div className="flex items-center gap-2">
                            <ResourceIcon type={resource.type} />
                            {resource.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.resourceId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.resourceId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="e.g., Team Meeting"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" {...form.register("date")} />
                {form.formState.errors.date && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.date.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input id="startTime" type="time" {...form.register("startTime")} />
                {form.formState.errors.startTime && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.startTime.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours) *</Label>
              <Controller
                name="duration"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">30 minutes</SelectItem>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="1.5">1.5 hours</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Add any additional details..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBookingDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Booking</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <p className="text-sm mt-1">{selectedBooking.title}</p>
              </div>
              <div>
                <Label>Resource</Label>
                <p className="text-sm mt-1">
                  {resources.find((r) => r.id === selectedBooking.resourceId)?.name}
                </p>
              </div>
              <div>
                <Label>Date & Time</Label>
                <p className="text-sm mt-1">
                  {format(selectedBooking.start, "MMMM d, yyyy")}
                  <br />
                  {format(selectedBooking.start, "h:mm a")} -{" "}
                  {format(selectedBooking.end, "h:mm a")}
                </p>
              </div>
              <div>
                <Label>Booked by</Label>
                <p className="text-sm mt-1">{selectedBooking.userName}</p>
              </div>
              {selectedBooking.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm mt-1">{selectedBooking.notes}</p>
                </div>
              )}
              {selectedBooking.userId === "1" && (
                <>
                  <Separator />
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      cancelBooking(selectedBooking.id);
                      setSelectedBooking(null);
                    }}
                  >
                    Cancel Booking
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .calendar-wrapper {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(var(--primary));
          --fc-button-border-color: hsl(var(--primary));
          --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
          --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
          --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
          --fc-button-active-border-color: hsl(var(--primary) / 0.8);
          --fc-today-bg-color: hsl(var(--accent));
        }

        .calendar-wrapper .fc {
          font-family: inherit;
        }

        .calendar-wrapper .fc-theme-standard td,
        .calendar-wrapper .fc-theme-standard th {
          border-color: hsl(var(--border));
        }

        .calendar-wrapper .fc .fc-button {
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          text-transform: capitalize;
        }

        .calendar-wrapper .fc-col-header-cell {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
          font-weight: 600;
        }

        .calendar-wrapper .fc-daygrid-day-number,
        .calendar-wrapper .fc-timegrid-slot-label {
          color: hsl(var(--foreground));
        }

        .calendar-wrapper .fc-event {
          border-radius: 4px;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

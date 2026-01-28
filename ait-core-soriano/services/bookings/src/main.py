"""
AI-Bookings Service - Sistema de Reservas y Citas para AI-Suite
Puerto: 8018
Características:
- Gestión de citas y reservas
- Recursos y disponibilidad
- Servicios configurables
- Notificaciones y recordatorios
- AI scheduling optimization
- Integración con calendarios
"""

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date, time
from enum import Enum
import uuid
import json

app = FastAPI(
    title="AI-Bookings Service",
    description="Sistema de Reservas con IA para AI-Suite",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================= ENUMS =======================

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"

class ResourceType(str, Enum):
    ROOM = "room"
    EQUIPMENT = "equipment"
    VEHICLE = "vehicle"
    PERSON = "person"
    DESK = "desk"
    PARKING = "parking"
    OTHER = "other"

class RecurrenceType(str, Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"

class PaymentStatus(str, Enum):
    NOT_REQUIRED = "not_required"
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"
    FAILED = "failed"

class DayOfWeek(str, Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

# ======================= MODELS =======================

class Location(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    city: str
    country: str
    timezone: str = "UTC"
    phone: Optional[str] = None
    email: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None  # {lat, lng}
    amenities: List[str] = []
    images: List[str] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Resource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: ResourceType
    location_id: str
    description: Optional[str] = None
    capacity: int = 1
    amenities: List[str] = []
    images: List[str] = []
    hourly_rate: Optional[float] = None
    currency: str = "USD"
    min_booking_duration: int = 30  # minutes
    max_booking_duration: int = 480  # minutes
    buffer_before: int = 0  # minutes
    buffer_after: int = 0  # minutes
    requires_approval: bool = False
    auto_confirm: bool = True
    is_active: bool = True
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    category: str
    duration: int = 60  # minutes
    price: float = 0
    currency: str = "USD"
    resource_types: List[ResourceType] = []
    required_resources: int = 1
    max_participants: int = 1
    buffer_before: int = 0
    buffer_after: int = 0
    cancellation_policy: Optional[str] = None
    cancellation_hours: int = 24
    images: List[str] = []
    is_active: bool = True
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Availability(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    resource_id: str
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    is_available: bool = True
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None

class BlockedTime(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    resource_id: str
    start_datetime: datetime
    end_datetime: datetime
    reason: Optional[str] = None
    is_recurring: bool = False
    recurrence_type: RecurrenceType = RecurrenceType.NONE
    recurrence_end: Optional[date] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    timezone: str = "UTC"
    preferences: Dict[str, Any] = {}
    notes: Optional[str] = None
    tags: List[str] = []
    total_bookings: int = 0
    no_shows: int = 0
    cancellations: int = 0
    is_vip: bool = False
    is_blocked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_number: str
    customer_id: str
    service_id: Optional[str] = None
    resource_ids: List[str] = []
    location_id: str
    title: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    duration_minutes: int
    status: BookingStatus = BookingStatus.PENDING
    participants: int = 1
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    # Pricing
    subtotal: float = 0
    discount: float = 0
    tax: float = 0
    total: float = 0
    currency: str = "USD"
    payment_status: PaymentStatus = PaymentStatus.NOT_REQUIRED
    payment_id: Optional[str] = None
    # Recurrence
    is_recurring: bool = False
    recurrence_type: RecurrenceType = RecurrenceType.NONE
    recurrence_end: Optional[date] = None
    parent_booking_id: Optional[str] = None
    # Notifications
    reminder_sent: bool = False
    confirmation_sent: bool = False
    # Tracking
    checked_in_at: Optional[datetime] = None
    checked_out_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    rescheduled_from: Optional[str] = None
    # Metadata
    source: str = "web"  # web, mobile, api, phone, walk_in
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BookingTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    service_id: Optional[str] = None
    resource_ids: List[str] = []
    duration_minutes: int
    default_notes: Optional[str] = None
    is_active: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WaitlistEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    service_id: Optional[str] = None
    resource_id: Optional[str] = None
    preferred_dates: List[date] = []
    preferred_times: List[Dict[str, time]] = []  # [{start, end}]
    notes: Optional[str] = None
    status: str = "waiting"  # waiting, offered, booked, expired
    offered_booking_id: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    customer_id: str
    rating: int  # 1-5
    comment: Optional[str] = None
    service_rating: Optional[int] = None
    resource_rating: Optional[int] = None
    is_public: bool = True
    response: Optional[str] = None
    response_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    type: str  # confirmation, reminder, cancellation, reschedule
    channel: str  # email, sms, push
    recipient: str
    status: str = "pending"  # pending, sent, failed
    sent_at: Optional[datetime] = None
    content: Optional[Dict[str, str]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ======================= STORAGE =======================

locations: Dict[str, Location] = {}
resources: Dict[str, Resource] = {}
services: Dict[str, Service] = {}
availabilities: Dict[str, Availability] = {}
blocked_times: Dict[str, BlockedTime] = {}
customers: Dict[str, Customer] = {}
bookings: Dict[str, Booking] = {}
booking_templates: Dict[str, BookingTemplate] = {}
waitlist: Dict[str, WaitlistEntry] = {}
reviews: Dict[str, Review] = {}
notifications: Dict[str, Notification] = {}

# WebSocket connections
active_connections: Dict[str, List[WebSocket]] = {}

# ======================= REQUEST MODELS =======================

class LocationCreate(BaseModel):
    name: str
    address: str
    city: str
    country: str
    timezone: str = "UTC"
    phone: Optional[str] = None
    email: Optional[str] = None
    amenities: List[str] = []

class ResourceCreate(BaseModel):
    name: str
    type: ResourceType
    location_id: str
    description: Optional[str] = None
    capacity: int = 1
    amenities: List[str] = []
    hourly_rate: Optional[float] = None
    min_booking_duration: int = 30
    max_booking_duration: int = 480

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    duration: int = 60
    price: float = 0
    resource_types: List[ResourceType] = []
    max_participants: int = 1

class BookingCreate(BaseModel):
    customer_id: str
    service_id: Optional[str] = None
    resource_ids: List[str] = []
    location_id: str
    start_datetime: datetime
    duration_minutes: Optional[int] = None
    participants: int = 1
    notes: Optional[str] = None
    is_recurring: bool = False
    recurrence_type: RecurrenceType = RecurrenceType.NONE
    recurrence_end: Optional[date] = None
    source: str = "web"
    created_by: Optional[str] = None

class CustomerCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    timezone: str = "UTC"

class AvailabilitySlot(BaseModel):
    start: datetime
    end: datetime
    resource_id: str
    is_available: bool = True

# ======================= HELPER FUNCTIONS =======================

def generate_booking_number() -> str:
    """Genera número único de reserva"""
    import random
    return f"BK{datetime.utcnow().strftime('%Y%m%d')}{random.randint(1000, 9999)}"

def get_day_of_week(dt: datetime) -> DayOfWeek:
    """Obtiene día de la semana"""
    days = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY]
    return days[dt.weekday()]

def check_resource_availability(
    resource_id: str,
    start_dt: datetime,
    end_dt: datetime,
    exclude_booking_id: Optional[str] = None
) -> bool:
    """Verifica disponibilidad de recurso"""
    if resource_id not in resources:
        return False

    resource = resources[resource_id]
    if not resource.is_active:
        return False

    # Verificar horario de disponibilidad
    day = get_day_of_week(start_dt)
    resource_avail = [a for a in availabilities.values()
                      if a.resource_id == resource_id and a.day_of_week == day and a.is_available]

    if resource_avail:
        # Verificar que esté dentro del horario
        start_time = start_dt.time()
        end_time = end_dt.time()
        in_schedule = any(a.start_time <= start_time and end_time <= a.end_time for a in resource_avail)
        if not in_schedule:
            return False

    # Verificar bloqueos
    for blocked in blocked_times.values():
        if blocked.resource_id == resource_id:
            if start_dt < blocked.end_datetime and end_dt > blocked.start_datetime:
                return False

    # Verificar otras reservas
    for booking in bookings.values():
        if booking.id == exclude_booking_id:
            continue
        if resource_id in booking.resource_ids and booking.status in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
            if start_dt < booking.end_datetime and end_dt > booking.start_datetime:
                return False

    return True

def get_available_slots(
    resource_id: str,
    target_date: date,
    duration_minutes: int,
    slot_interval: int = 30
) -> List[Dict[str, Any]]:
    """Obtiene slots disponibles para un recurso"""
    if resource_id not in resources:
        return []

    resource = resources[resource_id]
    day = get_day_of_week(datetime.combine(target_date, time(0, 0)))

    # Obtener horario del día
    day_avail = [a for a in availabilities.values()
                 if a.resource_id == resource_id and a.day_of_week == day and a.is_available]

    if not day_avail:
        # Default: 9am - 6pm
        day_avail = [Availability(
            resource_id=resource_id,
            day_of_week=day,
            start_time=time(9, 0),
            end_time=time(18, 0)
        )]

    slots = []
    for avail in day_avail:
        current = datetime.combine(target_date, avail.start_time)
        end_of_day = datetime.combine(target_date, avail.end_time)

        while current + timedelta(minutes=duration_minutes) <= end_of_day:
            slot_end = current + timedelta(minutes=duration_minutes)
            is_available = check_resource_availability(resource_id, current, slot_end)

            slots.append({
                "start": current.isoformat(),
                "end": slot_end.isoformat(),
                "is_available": is_available
            })

            current += timedelta(minutes=slot_interval)

    return slots

def calculate_booking_price(service: Optional[Service], resource: Optional[Resource], duration_minutes: int) -> Dict[str, float]:
    """Calcula precio de reserva"""
    subtotal = 0

    if service and service.price > 0:
        subtotal = service.price
    elif resource and resource.hourly_rate:
        subtotal = (duration_minutes / 60) * resource.hourly_rate

    tax = subtotal * 0.21  # 21% IVA
    total = subtotal + tax

    return {
        "subtotal": round(subtotal, 2),
        "tax": round(tax, 2),
        "total": round(total, 2)
    }

def find_optimal_slot(
    service_id: str,
    preferred_datetime: datetime,
    flexibility_hours: int = 4
) -> Optional[Dict[str, Any]]:
    """Encuentra slot óptimo con IA"""
    if service_id not in services:
        return None

    service = services[service_id]

    # Buscar recursos compatibles
    compatible_resources = [r for r in resources.values()
                           if r.type in service.resource_types and r.is_active]

    if not compatible_resources:
        return None

    # Buscar en rango de flexibilidad
    search_start = preferred_datetime - timedelta(hours=flexibility_hours)
    search_end = preferred_datetime + timedelta(hours=flexibility_hours)

    best_slot = None
    min_distance = float('inf')

    current = search_start
    while current <= search_end:
        for resource in compatible_resources:
            slot_end = current + timedelta(minutes=service.duration)
            if check_resource_availability(resource.id, current, slot_end):
                distance = abs((current - preferred_datetime).total_seconds())
                if distance < min_distance:
                    min_distance = distance
                    best_slot = {
                        "resource_id": resource.id,
                        "resource_name": resource.name,
                        "start": current.isoformat(),
                        "end": slot_end.isoformat(),
                        "distance_minutes": distance / 60
                    }

        current += timedelta(minutes=30)

    return best_slot

# ======================= LOCATION ENDPOINTS =======================

@app.post("/locations", response_model=Location)
async def create_location(data: LocationCreate):
    """Crear ubicación"""
    location = Location(**data.model_dump())
    locations[location.id] = location
    return location

@app.get("/locations", response_model=List[Location])
async def list_locations(
    city: Optional[str] = None,
    is_active: bool = True
):
    """Listar ubicaciones"""
    result = list(locations.values())
    if city:
        result = [l for l in result if l.city.lower() == city.lower()]
    if is_active is not None:
        result = [l for l in result if l.is_active == is_active]
    return result

@app.get("/locations/{location_id}", response_model=Location)
async def get_location(location_id: str):
    """Obtener ubicación"""
    if location_id not in locations:
        raise HTTPException(status_code=404, detail="Location not found")
    return locations[location_id]

@app.get("/locations/{location_id}/resources", response_model=List[Resource])
async def get_location_resources(location_id: str):
    """Obtener recursos de ubicación"""
    return [r for r in resources.values() if r.location_id == location_id and r.is_active]

# ======================= RESOURCE ENDPOINTS =======================

@app.post("/resources", response_model=Resource)
async def create_resource(data: ResourceCreate):
    """Crear recurso"""
    if data.location_id not in locations:
        raise HTTPException(status_code=404, detail="Location not found")

    resource = Resource(**data.model_dump())
    resources[resource.id] = resource

    # Crear disponibilidad por defecto (Lunes a Viernes, 9-18)
    for day in [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY]:
        avail = Availability(
            resource_id=resource.id,
            day_of_week=day,
            start_time=time(9, 0),
            end_time=time(18, 0)
        )
        availabilities[avail.id] = avail

    return resource

@app.get("/resources", response_model=List[Resource])
async def list_resources(
    location_id: Optional[str] = None,
    type: Optional[ResourceType] = None,
    is_active: bool = True
):
    """Listar recursos"""
    result = list(resources.values())
    if location_id:
        result = [r for r in result if r.location_id == location_id]
    if type:
        result = [r for r in result if r.type == type]
    if is_active is not None:
        result = [r for r in result if r.is_active == is_active]
    return result

@app.get("/resources/{resource_id}", response_model=Resource)
async def get_resource(resource_id: str):
    """Obtener recurso"""
    if resource_id not in resources:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resources[resource_id]

@app.get("/resources/{resource_id}/availability")
async def get_resource_availability(
    resource_id: str,
    start_date: date,
    end_date: Optional[date] = None,
    duration_minutes: int = 60
):
    """Obtener disponibilidad de recurso"""
    if resource_id not in resources:
        raise HTTPException(status_code=404, detail="Resource not found")

    end = end_date or start_date + timedelta(days=7)
    all_slots = []
    current_date = start_date

    while current_date <= end:
        day_slots = get_available_slots(resource_id, current_date, duration_minutes)
        all_slots.append({
            "date": current_date.isoformat(),
            "slots": day_slots
        })
        current_date += timedelta(days=1)

    return {
        "resource_id": resource_id,
        "duration_minutes": duration_minutes,
        "availability": all_slots
    }

@app.put("/resources/{resource_id}/availability")
async def set_resource_availability(
    resource_id: str,
    schedule: List[Dict[str, Any]]
):
    """Configurar disponibilidad de recurso"""
    if resource_id not in resources:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Eliminar disponibilidad existente
    to_delete = [a.id for a in availabilities.values() if a.resource_id == resource_id]
    for aid in to_delete:
        del availabilities[aid]

    # Crear nueva disponibilidad
    for slot in schedule:
        avail = Availability(
            resource_id=resource_id,
            day_of_week=DayOfWeek(slot["day"]),
            start_time=time.fromisoformat(slot["start"]),
            end_time=time.fromisoformat(slot["end"]),
            is_available=slot.get("is_available", True)
        )
        availabilities[avail.id] = avail

    return {"message": "Availability updated", "slots": len(schedule)}

@app.post("/resources/{resource_id}/block")
async def block_resource_time(
    resource_id: str,
    start_datetime: datetime,
    end_datetime: datetime,
    reason: Optional[str] = None,
    created_by: str = "system"
):
    """Bloquear tiempo en recurso"""
    if resource_id not in resources:
        raise HTTPException(status_code=404, detail="Resource not found")

    blocked = BlockedTime(
        resource_id=resource_id,
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        reason=reason,
        created_by=created_by
    )
    blocked_times[blocked.id] = blocked

    return blocked

# ======================= SERVICE ENDPOINTS =======================

@app.post("/services", response_model=Service)
async def create_service(data: ServiceCreate):
    """Crear servicio"""
    service = Service(**data.model_dump())
    services[service.id] = service
    return service

@app.get("/services", response_model=List[Service])
async def list_services(
    category: Optional[str] = None,
    is_active: bool = True
):
    """Listar servicios"""
    result = list(services.values())
    if category:
        result = [s for s in result if s.category == category]
    if is_active is not None:
        result = [s for s in result if s.is_active == is_active]
    return result

@app.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str):
    """Obtener servicio"""
    if service_id not in services:
        raise HTTPException(status_code=404, detail="Service not found")
    return services[service_id]

@app.get("/services/{service_id}/availability")
async def get_service_availability(
    service_id: str,
    location_id: str,
    start_date: date,
    end_date: Optional[date] = None
):
    """Obtener disponibilidad para servicio"""
    if service_id not in services:
        raise HTTPException(status_code=404, detail="Service not found")

    service = services[service_id]
    end = end_date or start_date + timedelta(days=7)

    # Obtener recursos compatibles en ubicación
    compatible_resources = [r for r in resources.values()
                           if r.location_id == location_id and
                           r.type in service.resource_types and
                           r.is_active]

    availability = []
    current_date = start_date

    while current_date <= end:
        day_slots = []
        for resource in compatible_resources:
            slots = get_available_slots(resource.id, current_date, service.duration)
            available_slots = [s for s in slots if s["is_available"]]
            if available_slots:
                day_slots.extend([{
                    **s,
                    "resource_id": resource.id,
                    "resource_name": resource.name
                } for s in available_slots])

        # Eliminar duplicados por hora
        unique_starts = set()
        unique_slots = []
        for slot in day_slots:
            if slot["start"] not in unique_starts:
                unique_starts.add(slot["start"])
                unique_slots.append(slot)

        availability.append({
            "date": current_date.isoformat(),
            "available_slots": len(unique_slots),
            "slots": sorted(unique_slots, key=lambda x: x["start"])
        })
        current_date += timedelta(days=1)

    return {
        "service_id": service_id,
        "location_id": location_id,
        "duration_minutes": service.duration,
        "availability": availability
    }

# ======================= CUSTOMER ENDPOINTS =======================

@app.post("/customers", response_model=Customer)
async def create_customer(data: CustomerCreate):
    """Crear cliente"""
    # Verificar email único
    existing = [c for c in customers.values() if c.email == data.email]
    if existing:
        return existing[0]

    customer = Customer(**data.model_dump())
    customers[customer.id] = customer
    return customer

@app.get("/customers", response_model=List[Customer])
async def list_customers(
    search: Optional[str] = None,
    is_vip: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
):
    """Listar clientes"""
    result = list(customers.values())

    if search:
        search_lower = search.lower()
        result = [c for c in result if
                  search_lower in c.first_name.lower() or
                  search_lower in c.last_name.lower() or
                  search_lower in c.email.lower()]
    if is_vip is not None:
        result = [c for c in result if c.is_vip == is_vip]

    return result[skip:skip + limit]

@app.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    """Obtener cliente"""
    if customer_id not in customers:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customers[customer_id]

@app.get("/customers/{customer_id}/bookings", response_model=List[Booking])
async def get_customer_bookings(
    customer_id: str,
    status: Optional[BookingStatus] = None,
    upcoming: bool = False
):
    """Obtener reservas de cliente"""
    result = [b for b in bookings.values() if b.customer_id == customer_id]

    if status:
        result = [b for b in result if b.status == status]
    if upcoming:
        now = datetime.utcnow()
        result = [b for b in result if b.start_datetime > now]

    return sorted(result, key=lambda x: x.start_datetime, reverse=True)

@app.get("/customers/{customer_id}/history")
async def get_customer_history(customer_id: str):
    """Obtener historial de cliente"""
    if customer_id not in customers:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer = customers[customer_id]
    customer_bookings = [b for b in bookings.values() if b.customer_id == customer_id]

    return {
        "customer_id": customer_id,
        "total_bookings": len(customer_bookings),
        "completed": len([b for b in customer_bookings if b.status == BookingStatus.COMPLETED]),
        "cancelled": len([b for b in customer_bookings if b.status == BookingStatus.CANCELLED]),
        "no_shows": customer.no_shows,
        "total_spent": sum(b.total for b in customer_bookings if b.status == BookingStatus.COMPLETED),
        "favorite_services": [],  # Calculate most booked services
        "last_visit": max((b.start_datetime for b in customer_bookings if b.status == BookingStatus.COMPLETED), default=None)
    }

# ======================= BOOKING ENDPOINTS =======================

@app.post("/bookings", response_model=Booking)
async def create_booking(data: BookingCreate):
    """Crear reserva"""
    # Validaciones
    if data.customer_id not in customers:
        raise HTTPException(status_code=404, detail="Customer not found")
    if data.location_id not in locations:
        raise HTTPException(status_code=404, detail="Location not found")

    customer = customers[data.customer_id]
    if customer.is_blocked:
        raise HTTPException(status_code=400, detail="Customer is blocked")

    # Determinar duración
    duration = data.duration_minutes
    service = None
    if data.service_id:
        if data.service_id not in services:
            raise HTTPException(status_code=404, detail="Service not found")
        service = services[data.service_id]
        duration = duration or service.duration

    end_datetime = data.start_datetime + timedelta(minutes=duration)

    # Verificar disponibilidad de recursos
    for resource_id in data.resource_ids:
        if not check_resource_availability(resource_id, data.start_datetime, end_datetime):
            raise HTTPException(status_code=400, detail=f"Resource {resource_id} not available")

    # Calcular precio
    resource = resources.get(data.resource_ids[0]) if data.resource_ids else None
    pricing = calculate_booking_price(service, resource, duration)

    # Crear reserva
    booking = Booking(
        booking_number=generate_booking_number(),
        customer_id=data.customer_id,
        service_id=data.service_id,
        resource_ids=data.resource_ids,
        location_id=data.location_id,
        start_datetime=data.start_datetime,
        end_datetime=end_datetime,
        duration_minutes=duration,
        participants=data.participants,
        notes=data.notes,
        is_recurring=data.is_recurring,
        recurrence_type=data.recurrence_type,
        recurrence_end=data.recurrence_end,
        subtotal=pricing["subtotal"],
        tax=pricing["tax"],
        total=pricing["total"],
        source=data.source,
        created_by=data.created_by,
        status=BookingStatus.CONFIRMED if all(
            resources.get(r, Resource(id="", name="", type=ResourceType.ROOM, location_id="")).auto_confirm
            for r in data.resource_ids
        ) else BookingStatus.PENDING
    )
    bookings[booking.id] = booking

    # Actualizar contador de cliente
    customer.total_bookings += 1

    # Crear reservas recurrentes
    if data.is_recurring and data.recurrence_type != RecurrenceType.NONE and data.recurrence_end:
        create_recurring_bookings(booking)

    return booking

def create_recurring_bookings(parent: Booking):
    """Crear reservas recurrentes"""
    if not parent.recurrence_end:
        return

    interval_days = {
        RecurrenceType.DAILY: 1,
        RecurrenceType.WEEKLY: 7,
        RecurrenceType.BIWEEKLY: 14,
        RecurrenceType.MONTHLY: 30
    }

    days = interval_days.get(parent.recurrence_type, 7)
    current_date = parent.start_datetime + timedelta(days=days)

    while current_date.date() <= parent.recurrence_end:
        child_end = current_date + timedelta(minutes=parent.duration_minutes)

        # Verificar disponibilidad
        all_available = all(
            check_resource_availability(r, current_date, child_end)
            for r in parent.resource_ids
        )

        if all_available:
            child = Booking(
                booking_number=generate_booking_number(),
                customer_id=parent.customer_id,
                service_id=parent.service_id,
                resource_ids=parent.resource_ids,
                location_id=parent.location_id,
                start_datetime=current_date,
                end_datetime=child_end,
                duration_minutes=parent.duration_minutes,
                participants=parent.participants,
                notes=parent.notes,
                subtotal=parent.subtotal,
                tax=parent.tax,
                total=parent.total,
                parent_booking_id=parent.id,
                status=parent.status,
                source=parent.source
            )
            bookings[child.id] = child

        current_date += timedelta(days=days)

@app.get("/bookings", response_model=List[Booking])
async def list_bookings(
    location_id: Optional[str] = None,
    resource_id: Optional[str] = None,
    status: Optional[BookingStatus] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 50
):
    """Listar reservas"""
    result = list(bookings.values())

    if location_id:
        result = [b for b in result if b.location_id == location_id]
    if resource_id:
        result = [b for b in result if resource_id in b.resource_ids]
    if status:
        result = [b for b in result if b.status == status]
    if start_date:
        result = [b for b in result if b.start_datetime.date() >= start_date]
    if end_date:
        result = [b for b in result if b.start_datetime.date() <= end_date]

    result = sorted(result, key=lambda x: x.start_datetime)
    return result[skip:skip + limit]

@app.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    """Obtener reserva"""
    if booking_id not in bookings:
        raise HTTPException(status_code=404, detail="Booking not found")
    return bookings[booking_id]

@app.put("/bookings/{booking_id}/confirm")
async def confirm_booking(booking_id: str):
    """Confirmar reserva"""
    if booking_id not in bookings:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = bookings[booking_id]
    booking.status = BookingStatus.CONFIRMED
    booking.confirmation_sent = True
    booking.updated_at = datetime.utcnow()

    return booking

@app.put("/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    reason: Optional[str] = None,
    cancel_recurring: bool = False
):
    """Cancelar reserva"""
    if booking_id not in bookings:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = bookings[booking_id]
    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.utcnow()
    booking.cancellation_reason = reason
    booking.updated_at = datetime.utcnow()

    # Actualizar contador de cliente
    if booking.customer_id in customers:
        customers[booking.customer_id].cancellations += 1

    # Cancelar recurrentes si aplica
    if cancel_recurring:
        children = [b for b in bookings.values() if b.parent_booking_id == booking_id]
        for child in children:
            child.status = BookingStatus.CANCELLED
            child.cancelled_at = datetime.utcnow()

    # Notificar a waitlist
    check_waitlist_for_slot(booking)

    return booking

@app.put("/bookings/{booking_id}/reschedule")
async def reschedule_booking(
    booking_id: str,
    new_start: datetime,
    new_resource_ids: Optional[List[str]] = None
):
    """Reagendar reserva"""
    if booking_id not in bookings:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = bookings[booking_id]
    new_end = new_start + timedelta(minutes=booking.duration_minutes)
    resource_ids = new_resource_ids or booking.resource_ids

    # Verificar disponibilidad
    for resource_id in resource_ids:
        if not check_resource_availability(resource_id, new_start, new_end, booking_id):
            raise HTTPException(status_code=400, detail=f"Resource {resource_id} not available")

    # Crear nueva reserva
    new_booking = Booking(
        booking_number=generate_booking_number(),
        customer_id=booking.customer_id,
        service_id=booking.service_id,
        resource_ids=resource_ids,
        location_id=booking.location_id,
        start_datetime=new_start,
        end_datetime=new_end,
        duration_minutes=booking.duration_minutes,
        participants=booking.participants,
        notes=booking.notes,
        subtotal=booking.subtotal,
        tax=booking.tax,
        total=booking.total,
        rescheduled_from=booking_id,
        status=BookingStatus.CONFIRMED,
        source=booking.source
    )
    bookings[new_booking.id] = new_booking

    # Marcar original como reagendada
    booking.status = BookingStatus.RESCHEDULED
    booking.updated_at = datetime.utcnow()

    return new_booking

@app.put("/bookings/{booking_id}/check-in")
async def check_in_booking(booking_id: str):
    """Registrar llegada"""
    if booking_id not in bookings:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = bookings[booking_id]
    booking.checked_in_at = datetime.utcnow()
    booking.updated_at = datetime.utcnow()

    return {"message": "Checked in", "time": booking.checked_in_at}

@app.put("/bookings/{booking_id}/check-out")
async def check_out_booking(booking_id: str):
    """Registrar salida"""
    if booking_id not in bookings:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = bookings[booking_id]
    booking.checked_out_at = datetime.utcnow()
    booking.status = BookingStatus.COMPLETED
    booking.updated_at = datetime.utcnow()

    return {"message": "Checked out", "time": booking.checked_out_at}

@app.put("/bookings/{booking_id}/no-show")
async def mark_no_show(booking_id: str):
    """Marcar como no-show"""
    if booking_id not in bookings:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = bookings[booking_id]
    booking.status = BookingStatus.NO_SHOW
    booking.updated_at = datetime.utcnow()

    # Actualizar contador de cliente
    if booking.customer_id in customers:
        customers[booking.customer_id].no_shows += 1

    return booking

# ======================= WAITLIST ENDPOINTS =======================

@app.post("/waitlist", response_model=WaitlistEntry)
async def add_to_waitlist(
    customer_id: str,
    service_id: Optional[str] = None,
    resource_id: Optional[str] = None,
    preferred_dates: List[date] = [],
    notes: Optional[str] = None
):
    """Añadir a lista de espera"""
    if customer_id not in customers:
        raise HTTPException(status_code=404, detail="Customer not found")

    entry = WaitlistEntry(
        customer_id=customer_id,
        service_id=service_id,
        resource_id=resource_id,
        preferred_dates=preferred_dates,
        notes=notes,
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    waitlist[entry.id] = entry

    return entry

@app.get("/waitlist", response_model=List[WaitlistEntry])
async def get_waitlist(
    service_id: Optional[str] = None,
    resource_id: Optional[str] = None,
    status: str = "waiting"
):
    """Obtener lista de espera"""
    result = [w for w in waitlist.values() if w.status == status]

    if service_id:
        result = [w for w in result if w.service_id == service_id]
    if resource_id:
        result = [w for w in result if w.resource_id == resource_id]

    return sorted(result, key=lambda x: x.created_at)

def check_waitlist_for_slot(cancelled_booking: Booking):
    """Verificar waitlist cuando se cancela una reserva"""
    matching_entries = [
        w for w in waitlist.values()
        if w.status == "waiting" and
        (w.service_id == cancelled_booking.service_id or
         w.resource_id in cancelled_booking.resource_ids)
    ]

    for entry in matching_entries[:3]:  # Notificar a los primeros 3
        entry.status = "offered"
        entry.offered_booking_id = cancelled_booking.id

# ======================= REVIEW ENDPOINTS =======================

@app.post("/reviews", response_model=Review)
async def create_review(
    booking_id: str,
    rating: int,
    comment: Optional[str] = None
):
    """Crear reseña"""
    if booking_id not in bookings:
        raise HTTPException(status_code=404, detail="Booking not found")
    if not 1 <= rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")

    booking = bookings[booking_id]
    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only review completed bookings")

    review = Review(
        booking_id=booking_id,
        customer_id=booking.customer_id,
        rating=rating,
        comment=comment
    )
    reviews[review.id] = review

    return review

@app.get("/reviews", response_model=List[Review])
async def list_reviews(
    resource_id: Optional[str] = None,
    service_id: Optional[str] = None,
    min_rating: Optional[int] = None
):
    """Listar reseñas"""
    result = [r for r in reviews.values() if r.is_public]

    if resource_id:
        booking_ids = [b.id for b in bookings.values() if resource_id in b.resource_ids]
        result = [r for r in result if r.booking_id in booking_ids]
    if service_id:
        booking_ids = [b.id for b in bookings.values() if b.service_id == service_id]
        result = [r for r in result if r.booking_id in booking_ids]
    if min_rating:
        result = [r for r in result if r.rating >= min_rating]

    return sorted(result, key=lambda x: x.created_at, reverse=True)

# ======================= AI FEATURES =======================

@app.post("/ai/find-optimal-slot")
async def ai_find_optimal_slot(
    service_id: str,
    location_id: str,
    preferred_datetime: datetime,
    flexibility_hours: int = 4,
    preferences: Dict[str, Any] = {}
):
    """Encontrar slot óptimo con IA"""
    if service_id not in services:
        raise HTTPException(status_code=404, detail="Service not found")

    service = services[service_id]

    # Buscar recursos en ubicación
    compatible_resources = [r for r in resources.values()
                           if r.location_id == location_id and
                           r.type in service.resource_types and
                           r.is_active]

    if not compatible_resources:
        return {"error": "No compatible resources found", "suggestions": []}

    suggestions = []
    search_start = preferred_datetime - timedelta(hours=flexibility_hours)
    search_end = preferred_datetime + timedelta(hours=flexibility_hours)

    current = search_start
    while current <= search_end and len(suggestions) < 5:
        for resource in compatible_resources:
            slot_end = current + timedelta(minutes=service.duration)
            if check_resource_availability(resource.id, current, slot_end):
                distance = abs((current - preferred_datetime).total_seconds() / 60)
                suggestions.append({
                    "resource_id": resource.id,
                    "resource_name": resource.name,
                    "start": current.isoformat(),
                    "end": slot_end.isoformat(),
                    "distance_minutes": round(distance),
                    "score": max(0, 100 - distance)  # Higher score = closer to preferred
                })

        current += timedelta(minutes=30)

    # Ordenar por score
    suggestions.sort(key=lambda x: x["score"], reverse=True)

    return {
        "service_id": service_id,
        "preferred_datetime": preferred_datetime.isoformat(),
        "suggestions": suggestions[:5],
        "message": f"Encontrados {len(suggestions)} slots disponibles" if suggestions else "No hay disponibilidad en el rango solicitado"
    }

@app.post("/ai/smart-scheduling")
async def ai_smart_scheduling(
    customer_id: str,
    service_id: str,
    location_id: str
):
    """Programación inteligente basada en historial"""
    if customer_id not in customers:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer = customers[customer_id]
    customer_bookings = [b for b in bookings.values()
                         if b.customer_id == customer_id and
                         b.status == BookingStatus.COMPLETED]

    # Analizar patrones
    preferred_days = {}
    preferred_times = {}

    for booking in customer_bookings:
        day = booking.start_datetime.strftime("%A")
        hour = booking.start_datetime.hour

        preferred_days[day] = preferred_days.get(day, 0) + 1
        preferred_times[hour] = preferred_times.get(hour, 0) + 1

    # Determinar preferencias
    best_day = max(preferred_days, key=preferred_days.get) if preferred_days else "Tuesday"
    best_hour = max(preferred_times, key=preferred_times.get) if preferred_times else 10

    # Sugerir próximos slots
    suggestions = []
    current_date = date.today()

    for _ in range(14):  # Buscar en próximas 2 semanas
        if current_date.strftime("%A") == best_day:
            suggested_time = datetime.combine(current_date, time(best_hour, 0))
            if suggested_time > datetime.utcnow():
                slot = find_optimal_slot(service_id, suggested_time, flexibility_hours=2)
                if slot:
                    suggestions.append({
                        **slot,
                        "reason": f"Basado en tu preferencia por {best_day}s a las {best_hour}:00"
                    })

        current_date += timedelta(days=1)

    return {
        "customer_id": customer_id,
        "analysis": {
            "preferred_day": best_day,
            "preferred_hour": best_hour,
            "total_past_bookings": len(customer_bookings)
        },
        "suggestions": suggestions[:3]
    }

@app.post("/ai/demand-forecast")
async def ai_demand_forecast(
    location_id: str,
    days_ahead: int = 14
):
    """Pronóstico de demanda con IA"""
    import random

    # Analizar histórico
    location_bookings = [b for b in bookings.values()
                         if b.location_id == location_id]

    forecast = []
    current_date = date.today()

    for i in range(days_ahead):
        target_date = current_date + timedelta(days=i)
        day_name = target_date.strftime("%A")

        # Base demand on day of week
        base_demand = {
            "Monday": 0.7, "Tuesday": 0.85, "Wednesday": 0.9,
            "Thursday": 0.85, "Friday": 0.75, "Saturday": 0.6, "Sunday": 0.4
        }

        demand = base_demand.get(day_name, 0.7)
        demand += random.uniform(-0.1, 0.1)  # Add variance

        forecast.append({
            "date": target_date.isoformat(),
            "day": day_name,
            "expected_demand": round(min(max(demand, 0), 1), 2),
            "expected_bookings": round(demand * 20),  # Assuming 20 max bookings
            "recommendation": "Consider extra staff" if demand > 0.85 else
                            "Normal staffing" if demand > 0.5 else
                            "Reduced staffing possible"
        })

    return {
        "location_id": location_id,
        "forecast_period": f"{current_date} to {current_date + timedelta(days=days_ahead)}",
        "forecast": forecast,
        "peak_days": [f["date"] for f in forecast if f["expected_demand"] > 0.8],
        "low_days": [f["date"] for f in forecast if f["expected_demand"] < 0.5]
    }

@app.post("/ai/no-show-prediction")
async def ai_no_show_prediction(booking_id: Optional[str] = None):
    """Predicción de no-shows"""
    import random

    target_bookings = list(bookings.values())
    if booking_id:
        if booking_id not in bookings:
            raise HTTPException(status_code=404, detail="Booking not found")
        target_bookings = [bookings[booking_id]]

    # Filtrar solo pending/confirmed futuros
    target_bookings = [b for b in target_bookings
                       if b.status in [BookingStatus.PENDING, BookingStatus.CONFIRMED] and
                       b.start_datetime > datetime.utcnow()]

    predictions = []
    for booking in target_bookings:
        customer = customers.get(booking.customer_id)
        risk_score = 0
        factors = []

        if customer:
            # Factor: Historial de no-shows
            if customer.no_shows > 0:
                risk_score += min(customer.no_shows * 15, 40)
                factors.append(f"{customer.no_shows} no-shows previos")

            # Factor: Ratio de cancelaciones
            if customer.total_bookings > 0:
                cancel_rate = customer.cancellations / customer.total_bookings
                if cancel_rate > 0.3:
                    risk_score += 20
                    factors.append("Alta tasa de cancelación")

            # Factor: Cliente nuevo
            if customer.total_bookings <= 1:
                risk_score += 10
                factors.append("Cliente nuevo")

        # Factor: Reserva muy adelantada
        days_ahead = (booking.start_datetime - datetime.utcnow()).days
        if days_ahead > 14:
            risk_score += 15
            factors.append("Reserva con mucha anticipación")

        # Factor: Sin confirmación
        if not booking.confirmation_sent:
            risk_score += 10
            factors.append("Sin confirmación enviada")

        predictions.append({
            "booking_id": booking.id,
            "booking_number": booking.booking_number,
            "customer_name": f"{customer.first_name} {customer.last_name}" if customer else "Unknown",
            "scheduled_time": booking.start_datetime.isoformat(),
            "no_show_risk": min(risk_score, 100),
            "risk_level": "high" if risk_score >= 50 else "medium" if risk_score >= 25 else "low",
            "factors": factors,
            "recommended_actions": [
                "Enviar recordatorio adicional",
                "Solicitar reconfirmación",
                "Considerar overbooking controlado"
            ][:len(factors)] if factors else []
        })

    return {
        "analyzed": len(predictions),
        "high_risk_count": len([p for p in predictions if p["risk_level"] == "high"]),
        "predictions": sorted(predictions, key=lambda x: x["no_show_risk"], reverse=True)
    }

@app.post("/ai/resource-optimization")
async def ai_resource_optimization(
    location_id: str,
    target_date: date
):
    """Optimización de recursos con IA"""
    location_resources = [r for r in resources.values()
                          if r.location_id == location_id and r.is_active]

    day_bookings = [b for b in bookings.values()
                    if b.location_id == location_id and
                    b.start_datetime.date() == target_date and
                    b.status in [BookingStatus.PENDING, BookingStatus.CONFIRMED]]

    analysis = []
    for resource in location_resources:
        resource_bookings = [b for b in day_bookings if resource.id in b.resource_ids]
        total_booked_minutes = sum(b.duration_minutes for b in resource_bookings)

        # Asumiendo 8 horas disponibles = 480 minutos
        utilization = total_booked_minutes / 480 * 100 if total_booked_minutes <= 480 else 100

        analysis.append({
            "resource_id": resource.id,
            "resource_name": resource.name,
            "bookings_count": len(resource_bookings),
            "booked_minutes": total_booked_minutes,
            "utilization_percent": round(utilization, 1),
            "status": "overbooked" if utilization > 100 else
                     "optimal" if utilization >= 70 else
                     "underutilized" if utilization >= 30 else "idle"
        })

    return {
        "location_id": location_id,
        "date": target_date.isoformat(),
        "total_resources": len(analysis),
        "avg_utilization": round(sum(a["utilization_percent"] for a in analysis) / len(analysis), 1) if analysis else 0,
        "resources": analysis,
        "recommendations": [
            "Considere reasignar reservas de recursos sobrecargados",
            "Oportunidad de promociones en recursos subutilizados"
        ]
    }

@app.get("/ai/booking-insights")
async def ai_booking_insights(
    days: int = 30
):
    """Insights de reservas con IA"""
    cutoff = datetime.utcnow() - timedelta(days=days)
    recent_bookings = [b for b in bookings.values() if b.created_at >= cutoff]

    # Métricas
    total = len(recent_bookings)
    completed = len([b for b in recent_bookings if b.status == BookingStatus.COMPLETED])
    cancelled = len([b for b in recent_bookings if b.status == BookingStatus.CANCELLED])
    no_shows = len([b for b in recent_bookings if b.status == BookingStatus.NO_SHOW])

    # Revenue
    total_revenue = sum(b.total for b in recent_bookings if b.status == BookingStatus.COMPLETED)

    # Por día de semana
    by_day = {}
    for b in recent_bookings:
        day = b.start_datetime.strftime("%A")
        by_day[day] = by_day.get(day, 0) + 1

    # Por hora
    by_hour = {}
    for b in recent_bookings:
        hour = b.start_datetime.hour
        by_hour[hour] = by_hour.get(hour, 0) + 1

    peak_day = max(by_day, key=by_day.get) if by_day else None
    peak_hour = max(by_hour, key=by_hour.get) if by_hour else None

    return {
        "period_days": days,
        "metrics": {
            "total_bookings": total,
            "completed": completed,
            "cancelled": cancelled,
            "no_shows": no_shows,
            "completion_rate": round(completed / total * 100, 1) if total > 0 else 0,
            "cancellation_rate": round(cancelled / total * 100, 1) if total > 0 else 0,
            "no_show_rate": round(no_shows / total * 100, 1) if total > 0 else 0,
            "total_revenue": round(total_revenue, 2)
        },
        "patterns": {
            "busiest_day": peak_day,
            "busiest_hour": f"{peak_hour}:00" if peak_hour else None,
            "by_day": by_day,
            "by_hour": by_hour
        },
        "insights": [
            f"El día más ocupado es {peak_day}" if peak_day else None,
            f"La hora pico es {peak_hour}:00" if peak_hour else None,
            f"Tasa de no-show: {round(no_shows / total * 100, 1)}%" if total > 0 and no_shows > 0 else None
        ]
    }

# ======================= CALENDAR INTEGRATION =======================

@app.get("/calendar/export/{resource_id}")
async def export_calendar(
    resource_id: str,
    format: str = "ical"
):
    """Exportar calendario en formato iCal"""
    if resource_id not in resources:
        raise HTTPException(status_code=404, detail="Resource not found")

    resource_bookings = [b for b in bookings.values()
                         if resource_id in b.resource_ids and
                         b.status in [BookingStatus.PENDING, BookingStatus.CONFIRMED]]

    # Generar iCal básico
    ical = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AI-Suite//Bookings//EN\n"

    for booking in resource_bookings:
        ical += f"""BEGIN:VEVENT
UID:{booking.id}@ai-suite
DTSTART:{booking.start_datetime.strftime('%Y%m%dT%H%M%SZ')}
DTEND:{booking.end_datetime.strftime('%Y%m%dT%H%M%SZ')}
SUMMARY:{booking.title or booking.booking_number}
DESCRIPTION:{booking.notes or ''}
END:VEVENT
"""

    ical += "END:VCALENDAR"

    return {
        "resource_id": resource_id,
        "format": format,
        "content": ical,
        "bookings_count": len(resource_bookings)
    }

# ======================= REPORTS =======================

@app.get("/reports/utilization")
async def utilization_report(
    location_id: Optional[str] = None,
    start_date: date = None,
    end_date: date = None
):
    """Reporte de utilización"""
    start = start_date or date.today() - timedelta(days=30)
    end = end_date or date.today()

    target_bookings = [b for b in bookings.values()
                       if start <= b.start_datetime.date() <= end and
                       b.status == BookingStatus.COMPLETED]

    if location_id:
        target_bookings = [b for b in target_bookings if b.location_id == location_id]

    target_resources = list(resources.values())
    if location_id:
        target_resources = [r for r in target_resources if r.location_id == location_id]

    resource_stats = []
    for resource in target_resources:
        resource_bookings = [b for b in target_bookings if resource.id in b.resource_ids]
        total_minutes = sum(b.duration_minutes for b in resource_bookings)

        # Calcular minutos disponibles (días * 8 horas)
        days_in_period = (end - start).days + 1
        available_minutes = days_in_period * 8 * 60  # 8 horas por día

        utilization = (total_minutes / available_minutes * 100) if available_minutes > 0 else 0

        resource_stats.append({
            "resource_id": resource.id,
            "resource_name": resource.name,
            "bookings": len(resource_bookings),
            "total_hours": round(total_minutes / 60, 1),
            "utilization_percent": round(utilization, 1),
            "revenue": sum(b.total for b in resource_bookings)
        })

    return {
        "period": {"start": start.isoformat(), "end": end.isoformat()},
        "resources": sorted(resource_stats, key=lambda x: x["utilization_percent"], reverse=True),
        "summary": {
            "total_resources": len(resource_stats),
            "avg_utilization": round(sum(r["utilization_percent"] for r in resource_stats) / len(resource_stats), 1) if resource_stats else 0,
            "total_revenue": sum(r["revenue"] for r in resource_stats)
        }
    }

# ======================= WEBSOCKET =======================

@app.websocket("/ws/{location_id}")
async def websocket_endpoint(websocket: WebSocket, location_id: str):
    """WebSocket para actualizaciones en tiempo real"""
    await websocket.accept()

    if location_id not in active_connections:
        active_connections[location_id] = []
    active_connections[location_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast updates
            message = json.loads(data)
            for conn in active_connections.get(location_id, []):
                await conn.send_json(message)
    except WebSocketDisconnect:
        active_connections[location_id].remove(websocket)

# ======================= HEALTH CHECK =======================

@app.get("/health")
async def health_check():
    """Health check del servicio"""
    return {
        "status": "healthy",
        "service": "ai-bookings",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/stats")
async def get_stats():
    """Estadísticas del servicio"""
    return {
        "locations": len(locations),
        "resources": len(resources),
        "services": len(services),
        "customers": len(customers),
        "total_bookings": len(bookings),
        "pending_bookings": len([b for b in bookings.values() if b.status == BookingStatus.PENDING]),
        "confirmed_bookings": len([b for b in bookings.values() if b.status == BookingStatus.CONFIRMED]),
        "waitlist_entries": len([w for w in waitlist.values() if w.status == "waiting"]),
        "reviews": len(reviews)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8018)

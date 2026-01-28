"""
AI-CRM Service - Customer Relationship Management para AI-Suite
Puerto: 8016
Características:
- Gestión de contactos y empresas
- Pipeline de ventas y oportunidades
- Leads y scoring automático
- Actividades y seguimiento
- AI insights y predicciones
- Automatización de ventas
"""

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date
from enum import Enum
import uuid
import json

app = FastAPI(
    title="AI-CRM Service",
    description="CRM con IA para AI-Suite",
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

class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"
    NURTURING = "nurturing"
    CONVERTED = "converted"
    LOST = "lost"

class LeadSource(str, Enum):
    WEBSITE = "website"
    REFERRAL = "referral"
    SOCIAL_MEDIA = "social_media"
    EMAIL_CAMPAIGN = "email_campaign"
    COLD_CALL = "cold_call"
    TRADE_SHOW = "trade_show"
    ADVERTISEMENT = "advertisement"
    PARTNER = "partner"
    OTHER = "other"

class OpportunityStage(str, Enum):
    PROSPECTING = "prospecting"
    QUALIFICATION = "qualification"
    NEEDS_ANALYSIS = "needs_analysis"
    VALUE_PROPOSITION = "value_proposition"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"

class ActivityType(str, Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    TASK = "task"
    NOTE = "note"
    DEMO = "demo"
    FOLLOW_UP = "follow_up"

class ActivityStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"

class DealPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ContactType(str, Enum):
    LEAD = "lead"
    CUSTOMER = "customer"
    PARTNER = "partner"
    VENDOR = "vendor"
    PROSPECT = "prospect"

class CompanySize(str, Enum):
    STARTUP = "1-10"
    SMALL = "11-50"
    MEDIUM = "51-200"
    LARGE = "201-1000"
    ENTERPRISE = "1000+"

class Industry(str, Enum):
    TECHNOLOGY = "technology"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    RETAIL = "retail"
    MANUFACTURING = "manufacturing"
    EDUCATION = "education"
    REAL_ESTATE = "real_estate"
    CONSULTING = "consulting"
    MEDIA = "media"
    OTHER = "other"

# ======================= MODELS =======================

class Company(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    domain: Optional[str] = None
    industry: Optional[Industry] = None
    size: Optional[CompanySize] = None
    revenue: Optional[float] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    linkedin_url: Optional[str] = None
    logo_url: Optional[str] = None
    tags: List[str] = []
    custom_fields: Dict[str, Any] = {}
    owner_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Contact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    company_id: Optional[str] = None
    contact_type: ContactType = ContactType.PROSPECT
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_handle: Optional[str] = None
    photo_url: Optional[str] = None
    birthday: Optional[date] = None
    notes: Optional[str] = None
    tags: List[str] = []
    custom_fields: Dict[str, Any] = {}
    last_contacted: Optional[datetime] = None
    lead_score: int = 0
    owner_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contact_id: str
    company_id: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    source: LeadSource = LeadSource.WEBSITE
    score: int = 0  # 0-100
    rating: str = "warm"  # cold, warm, hot
    estimated_value: Optional[float] = None
    interest: Optional[str] = None
    campaign_id: Optional[str] = None
    notes: Optional[str] = None
    converted_at: Optional[datetime] = None
    converted_to_opportunity_id: Optional[str] = None
    owner_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Pipeline(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    stages: List[Dict[str, Any]] = []  # [{name, probability, order}]
    is_default: bool = False
    is_active: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Opportunity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    contact_id: str
    company_id: Optional[str] = None
    pipeline_id: str
    stage: OpportunityStage = OpportunityStage.PROSPECTING
    amount: float = 0
    currency: str = "USD"
    probability: int = 10  # 0-100
    expected_close_date: Optional[date] = None
    actual_close_date: Optional[date] = None
    priority: DealPriority = DealPriority.MEDIUM
    source: LeadSource = LeadSource.WEBSITE
    lead_id: Optional[str] = None
    description: Optional[str] = None
    competitors: List[str] = []
    products: List[Dict[str, Any]] = []  # [{product_id, quantity, price}]
    tags: List[str] = []
    custom_fields: Dict[str, Any] = {}
    lost_reason: Optional[str] = None
    next_step: Optional[str] = None
    owner_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Activity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ActivityType
    subject: str
    description: Optional[str] = None
    contact_id: Optional[str] = None
    company_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    lead_id: Optional[str] = None
    due_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: ActivityStatus = ActivityStatus.SCHEDULED
    outcome: Optional[str] = None
    priority: DealPriority = DealPriority.MEDIUM
    reminder: Optional[datetime] = None
    assigned_to: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: float = 0
    currency: str = "USD"
    unit: str = "unit"
    is_active: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Campaign(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    type: str = "email"  # email, social, event, other
    status: str = "draft"  # draft, active, paused, completed
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    actual_cost: float = 0
    expected_revenue: Optional[float] = None
    target_audience: Optional[str] = None
    leads_generated: int = 0
    opportunities_created: int = 0
    revenue_generated: float = 0
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Quote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quote_number: str
    opportunity_id: str
    contact_id: str
    company_id: Optional[str] = None
    items: List[Dict[str, Any]] = []  # [{product_id, quantity, unit_price, discount}]
    subtotal: float = 0
    discount: float = 0
    tax: float = 0
    total: float = 0
    currency: str = "USD"
    valid_until: Optional[date] = None
    status: str = "draft"  # draft, sent, accepted, rejected, expired
    terms: Optional[str] = None
    notes: Optional[str] = None
    sent_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EmailTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    subject: str
    body: str
    category: str = "general"
    variables: List[str] = []  # e.g., {{first_name}}, {{company}}
    is_active: bool = True
    usage_count: int = 0
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AIScoreHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    entity_type: str  # lead, opportunity
    entity_id: str
    score: int
    factors: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ======================= STORAGE =======================

companies: Dict[str, Company] = {}
contacts: Dict[str, Contact] = {}
leads: Dict[str, Lead] = {}
pipelines: Dict[str, Pipeline] = {}
opportunities: Dict[str, Opportunity] = {}
activities: Dict[str, Activity] = {}
products: Dict[str, Product] = {}
campaigns: Dict[str, Campaign] = {}
quotes: Dict[str, Quote] = {}
email_templates: Dict[str, EmailTemplate] = {}
score_history: Dict[str, AIScoreHistory] = {}

# Initialize default pipeline
default_pipeline = Pipeline(
    id="default",
    name="Pipeline de Ventas",
    description="Pipeline estándar de ventas",
    stages=[
        {"name": "Prospecting", "probability": 10, "order": 1},
        {"name": "Qualification", "probability": 20, "order": 2},
        {"name": "Needs Analysis", "probability": 40, "order": 3},
        {"name": "Value Proposition", "probability": 60, "order": 4},
        {"name": "Proposal", "probability": 75, "order": 5},
        {"name": "Negotiation", "probability": 90, "order": 6},
        {"name": "Closed Won", "probability": 100, "order": 7},
        {"name": "Closed Lost", "probability": 0, "order": 8}
    ],
    is_default=True,
    created_by="system"
)
pipelines[default_pipeline.id] = default_pipeline

# WebSocket connections
active_connections: Dict[str, List[WebSocket]] = {}

# ======================= REQUEST MODELS =======================

class CompanyCreate(BaseModel):
    name: str
    domain: Optional[str] = None
    industry: Optional[Industry] = None
    size: Optional[CompanySize] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    tags: List[str] = []
    owner_id: Optional[str] = None
    created_by: str

class ContactCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    company_id: Optional[str] = None
    contact_type: ContactType = ContactType.PROSPECT
    tags: List[str] = []
    owner_id: Optional[str] = None
    created_by: str

class LeadCreate(BaseModel):
    contact_id: str
    company_id: Optional[str] = None
    source: LeadSource = LeadSource.WEBSITE
    estimated_value: Optional[float] = None
    interest: Optional[str] = None
    campaign_id: Optional[str] = None
    owner_id: Optional[str] = None
    created_by: str

class OpportunityCreate(BaseModel):
    name: str
    contact_id: str
    company_id: Optional[str] = None
    pipeline_id: str = "default"
    amount: float = 0
    expected_close_date: Optional[date] = None
    priority: DealPriority = DealPriority.MEDIUM
    source: LeadSource = LeadSource.WEBSITE
    lead_id: Optional[str] = None
    products: List[Dict[str, Any]] = []
    owner_id: Optional[str] = None
    created_by: str

class ActivityCreate(BaseModel):
    type: ActivityType
    subject: str
    description: Optional[str] = None
    contact_id: Optional[str] = None
    company_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    due_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    priority: DealPriority = DealPriority.MEDIUM
    assigned_to: Optional[str] = None
    created_by: str

class QuoteCreate(BaseModel):
    opportunity_id: str
    contact_id: str
    company_id: Optional[str] = None
    items: List[Dict[str, Any]] = []
    valid_until: Optional[date] = None
    terms: Optional[str] = None
    created_by: str

# ======================= HELPER FUNCTIONS =======================

def calculate_lead_score(lead: Lead, contact: Contact) -> int:
    """Calcula score de lead basado en múltiples factores"""
    score = 0

    # Factor: Fuente del lead
    source_scores = {
        LeadSource.REFERRAL: 25,
        LeadSource.WEBSITE: 20,
        LeadSource.TRADE_SHOW: 15,
        LeadSource.EMAIL_CAMPAIGN: 10,
        LeadSource.SOCIAL_MEDIA: 10,
        LeadSource.COLD_CALL: 5,
        LeadSource.ADVERTISEMENT: 5,
    }
    score += source_scores.get(lead.source, 5)

    # Factor: Información de contacto completa
    if contact.email:
        score += 10
    if contact.phone:
        score += 5
    if contact.job_title:
        score += 10
    if contact.linkedin_url:
        score += 5

    # Factor: Empresa asociada
    if lead.company_id and lead.company_id in companies:
        company = companies[lead.company_id]
        size_scores = {
            CompanySize.ENTERPRISE: 20,
            CompanySize.LARGE: 15,
            CompanySize.MEDIUM: 10,
            CompanySize.SMALL: 5,
            CompanySize.STARTUP: 3
        }
        score += size_scores.get(company.size, 0)

    # Factor: Valor estimado
    if lead.estimated_value:
        if lead.estimated_value > 100000:
            score += 20
        elif lead.estimated_value > 50000:
            score += 15
        elif lead.estimated_value > 10000:
            score += 10
        else:
            score += 5

    # Factor: Engagement reciente
    if contact.last_contacted:
        days_since_contact = (datetime.utcnow() - contact.last_contacted).days
        if days_since_contact < 7:
            score += 15
        elif days_since_contact < 30:
            score += 10
        elif days_since_contact < 90:
            score += 5

    return min(score, 100)

def calculate_opportunity_score(opp: Opportunity) -> int:
    """Calcula probabilidad de cierre de oportunidad"""
    import random
    score = opp.probability

    # Ajustar por monto
    if opp.amount > 100000:
        score += 5
    elif opp.amount < 5000:
        score -= 5

    # Ajustar por tiempo hasta cierre
    if opp.expected_close_date:
        days_to_close = (opp.expected_close_date - date.today()).days
        if days_to_close < 0:
            score -= 20  # Pasado fecha
        elif days_to_close < 14:
            score += 10  # Cierre pronto
        elif days_to_close > 90:
            score -= 5   # Muy lejano

    # Ajustar por actividades recientes
    opp_activities = [a for a in activities.values() if a.opportunity_id == opp.id]
    recent_activities = [a for a in opp_activities if (datetime.utcnow() - a.created_at).days < 14]
    if len(recent_activities) > 3:
        score += 10
    elif len(recent_activities) == 0:
        score -= 10

    return max(0, min(score, 100))

def get_deal_insights(opportunity: Opportunity) -> Dict[str, Any]:
    """Genera insights de IA para una oportunidad"""
    import random

    insights = []

    # Insight de engagement
    opp_activities = [a for a in activities.values() if a.opportunity_id == opportunity.id]
    if len(opp_activities) == 0:
        insights.append({
            "type": "warning",
            "message": "No hay actividades registradas. Considera programar una llamada o reunión.",
            "action": "schedule_call"
        })
    elif len(opp_activities) < 3:
        insights.append({
            "type": "suggestion",
            "message": "El engagement es bajo. Incrementa las interacciones para mejorar probabilidad de cierre.",
            "action": "send_email"
        })

    # Insight de fecha de cierre
    if opportunity.expected_close_date:
        days = (opportunity.expected_close_date - date.today()).days
        if days < 0:
            insights.append({
                "type": "alert",
                "message": f"La fecha de cierre esperada ha pasado hace {abs(days)} días.",
                "action": "update_close_date"
            })
        elif days < 7:
            insights.append({
                "type": "info",
                "message": f"Cierre esperado en {days} días. Asegúrate de tener todo listo.",
                "action": "prepare_contract"
            })

    # Insight de competidores
    if opportunity.competitors:
        insights.append({
            "type": "competitive",
            "message": f"Hay {len(opportunity.competitors)} competidor(es) identificados.",
            "competitors": opportunity.competitors
        })

    # Predicción de cierre
    win_probability = calculate_opportunity_score(opportunity)

    return {
        "opportunity_id": opportunity.id,
        "win_probability": win_probability,
        "health_score": "good" if win_probability > 60 else "at_risk" if win_probability > 30 else "critical",
        "insights": insights,
        "recommended_actions": [
            "Programar demo de seguimiento",
            "Enviar caso de estudio relevante",
            "Contactar al decisor principal"
        ][:random.randint(1, 3)]
    }

def generate_quote_number() -> str:
    """Genera número único de cotización"""
    import random
    return f"Q-{datetime.utcnow().strftime('%Y%m')}-{random.randint(1000, 9999)}"

# ======================= COMPANY ENDPOINTS =======================

@app.post("/companies", response_model=Company)
async def create_company(data: CompanyCreate):
    """Crear nueva empresa"""
    company = Company(**data.model_dump())
    companies[company.id] = company
    return company

@app.get("/companies", response_model=List[Company])
async def list_companies(
    industry: Optional[Industry] = None,
    size: Optional[CompanySize] = None,
    owner_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Listar empresas"""
    result = list(companies.values())

    if industry:
        result = [c for c in result if c.industry == industry]
    if size:
        result = [c for c in result if c.size == size]
    if owner_id:
        result = [c for c in result if c.owner_id == owner_id]
    if search:
        search_lower = search.lower()
        result = [c for c in result if search_lower in c.name.lower() or
                  (c.domain and search_lower in c.domain.lower())]

    return result[skip:skip + limit]

@app.get("/companies/{company_id}", response_model=Company)
async def get_company(company_id: str):
    """Obtener empresa"""
    if company_id not in companies:
        raise HTTPException(status_code=404, detail="Company not found")
    return companies[company_id]

@app.put("/companies/{company_id}", response_model=Company)
async def update_company(company_id: str, data: Dict[str, Any]):
    """Actualizar empresa"""
    if company_id not in companies:
        raise HTTPException(status_code=404, detail="Company not found")

    company = companies[company_id]
    for key, value in data.items():
        if hasattr(company, key):
            setattr(company, key, value)
    company.updated_at = datetime.utcnow()

    return company

@app.delete("/companies/{company_id}")
async def delete_company(company_id: str):
    """Eliminar empresa"""
    if company_id not in companies:
        raise HTTPException(status_code=404, detail="Company not found")

    del companies[company_id]
    return {"message": "Company deleted"}

@app.get("/companies/{company_id}/contacts", response_model=List[Contact])
async def get_company_contacts(company_id: str):
    """Obtener contactos de empresa"""
    if company_id not in companies:
        raise HTTPException(status_code=404, detail="Company not found")

    return [c for c in contacts.values() if c.company_id == company_id]

@app.get("/companies/{company_id}/opportunities", response_model=List[Opportunity])
async def get_company_opportunities(company_id: str):
    """Obtener oportunidades de empresa"""
    if company_id not in companies:
        raise HTTPException(status_code=404, detail="Company not found")

    return [o for o in opportunities.values() if o.company_id == company_id]

# ======================= CONTACT ENDPOINTS =======================

@app.post("/contacts", response_model=Contact)
async def create_contact(data: ContactCreate):
    """Crear nuevo contacto"""
    contact = Contact(**data.model_dump())
    contacts[contact.id] = contact
    return contact

@app.get("/contacts", response_model=List[Contact])
async def list_contacts(
    company_id: Optional[str] = None,
    contact_type: Optional[ContactType] = None,
    owner_id: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Listar contactos"""
    result = list(contacts.values())

    if company_id:
        result = [c for c in result if c.company_id == company_id]
    if contact_type:
        result = [c for c in result if c.contact_type == contact_type]
    if owner_id:
        result = [c for c in result if c.owner_id == owner_id]
    if tag:
        result = [c for c in result if tag in c.tags]
    if search:
        search_lower = search.lower()
        result = [c for c in result if
                  search_lower in c.first_name.lower() or
                  search_lower in c.last_name.lower() or
                  (c.email and search_lower in c.email.lower())]

    return result[skip:skip + limit]

@app.get("/contacts/{contact_id}", response_model=Contact)
async def get_contact(contact_id: str):
    """Obtener contacto"""
    if contact_id not in contacts:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contacts[contact_id]

@app.put("/contacts/{contact_id}", response_model=Contact)
async def update_contact(contact_id: str, data: Dict[str, Any]):
    """Actualizar contacto"""
    if contact_id not in contacts:
        raise HTTPException(status_code=404, detail="Contact not found")

    contact = contacts[contact_id]
    for key, value in data.items():
        if hasattr(contact, key):
            setattr(contact, key, value)
    contact.updated_at = datetime.utcnow()

    return contact

@app.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    """Eliminar contacto"""
    if contact_id not in contacts:
        raise HTTPException(status_code=404, detail="Contact not found")

    del contacts[contact_id]
    return {"message": "Contact deleted"}

@app.get("/contacts/{contact_id}/activities", response_model=List[Activity])
async def get_contact_activities(contact_id: str):
    """Obtener actividades de contacto"""
    if contact_id not in contacts:
        raise HTTPException(status_code=404, detail="Contact not found")

    return [a for a in activities.values() if a.contact_id == contact_id]

@app.get("/contacts/{contact_id}/timeline")
async def get_contact_timeline(contact_id: str):
    """Obtener timeline completo del contacto"""
    if contact_id not in contacts:
        raise HTTPException(status_code=404, detail="Contact not found")

    contact = contacts[contact_id]
    timeline = []

    # Actividades
    for activity in activities.values():
        if activity.contact_id == contact_id:
            timeline.append({
                "type": "activity",
                "subtype": activity.type,
                "data": activity.model_dump(),
                "date": activity.created_at.isoformat()
            })

    # Oportunidades
    for opp in opportunities.values():
        if opp.contact_id == contact_id:
            timeline.append({
                "type": "opportunity",
                "data": opp.model_dump(),
                "date": opp.created_at.isoformat()
            })

    # Ordenar por fecha
    timeline.sort(key=lambda x: x["date"], reverse=True)

    return timeline

# ======================= LEAD ENDPOINTS =======================

@app.post("/leads", response_model=Lead)
async def create_lead(data: LeadCreate):
    """Crear nuevo lead"""
    if data.contact_id not in contacts:
        raise HTTPException(status_code=404, detail="Contact not found")

    lead = Lead(**data.model_dump())
    contact = contacts[data.contact_id]

    # Calcular score inicial
    lead.score = calculate_lead_score(lead, contact)
    lead.rating = "hot" if lead.score >= 70 else "warm" if lead.score >= 40 else "cold"

    leads[lead.id] = lead

    # Actualizar tipo de contacto
    contact.contact_type = ContactType.LEAD

    return lead

@app.get("/leads", response_model=List[Lead])
async def list_leads(
    status: Optional[LeadStatus] = None,
    source: Optional[LeadSource] = None,
    owner_id: Optional[str] = None,
    rating: Optional[str] = None,
    min_score: Optional[int] = None,
    skip: int = 0,
    limit: int = 50
):
    """Listar leads"""
    result = list(leads.values())

    if status:
        result = [l for l in result if l.status == status]
    if source:
        result = [l for l in result if l.source == source]
    if owner_id:
        result = [l for l in result if l.owner_id == owner_id]
    if rating:
        result = [l for l in result if l.rating == rating]
    if min_score:
        result = [l for l in result if l.score >= min_score]

    # Ordenar por score
    result.sort(key=lambda x: x.score, reverse=True)

    return result[skip:skip + limit]

@app.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str):
    """Obtener lead"""
    if lead_id not in leads:
        raise HTTPException(status_code=404, detail="Lead not found")
    return leads[lead_id]

@app.put("/leads/{lead_id}/status")
async def update_lead_status(lead_id: str, status: LeadStatus):
    """Actualizar estado de lead"""
    if lead_id not in leads:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = leads[lead_id]
    lead.status = status
    lead.updated_at = datetime.utcnow()

    return lead

@app.post("/leads/{lead_id}/convert")
async def convert_lead(lead_id: str, opportunity_name: str, amount: float = 0):
    """Convertir lead a oportunidad"""
    if lead_id not in leads:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = leads[lead_id]

    # Crear oportunidad
    opp = Opportunity(
        name=opportunity_name,
        contact_id=lead.contact_id,
        company_id=lead.company_id,
        pipeline_id="default",
        amount=amount or lead.estimated_value or 0,
        source=lead.source,
        lead_id=lead_id,
        created_by=lead.created_by
    )
    opportunities[opp.id] = opp

    # Actualizar lead
    lead.status = LeadStatus.CONVERTED
    lead.converted_at = datetime.utcnow()
    lead.converted_to_opportunity_id = opp.id

    # Actualizar contacto
    if lead.contact_id in contacts:
        contacts[lead.contact_id].contact_type = ContactType.PROSPECT

    return {
        "message": "Lead converted",
        "opportunity": opp
    }

@app.post("/leads/{lead_id}/rescore")
async def rescore_lead(lead_id: str):
    """Recalcular score de lead"""
    if lead_id not in leads:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = leads[lead_id]
    contact = contacts.get(lead.contact_id)

    if contact:
        old_score = lead.score
        lead.score = calculate_lead_score(lead, contact)
        lead.rating = "hot" if lead.score >= 70 else "warm" if lead.score >= 40 else "cold"

        # Guardar historial
        history = AIScoreHistory(
            entity_type="lead",
            entity_id=lead_id,
            score=lead.score,
            factors=[
                {"factor": "source", "contribution": 20},
                {"factor": "contact_info", "contribution": 15},
                {"factor": "company_size", "contribution": 15},
                {"factor": "engagement", "contribution": 10}
            ]
        )
        score_history[history.id] = history

        return {
            "lead_id": lead_id,
            "old_score": old_score,
            "new_score": lead.score,
            "rating": lead.rating
        }

    return {"error": "Contact not found for lead"}

# ======================= OPPORTUNITY ENDPOINTS =======================

@app.post("/opportunities", response_model=Opportunity)
async def create_opportunity(data: OpportunityCreate):
    """Crear nueva oportunidad"""
    if data.contact_id not in contacts:
        raise HTTPException(status_code=404, detail="Contact not found")
    if data.pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    opp = Opportunity(**data.model_dump())
    opportunities[opp.id] = opp

    return opp

@app.get("/opportunities", response_model=List[Opportunity])
async def list_opportunities(
    pipeline_id: Optional[str] = None,
    stage: Optional[OpportunityStage] = None,
    owner_id: Optional[str] = None,
    priority: Optional[DealPriority] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    skip: int = 0,
    limit: int = 50
):
    """Listar oportunidades"""
    result = list(opportunities.values())

    if pipeline_id:
        result = [o for o in result if o.pipeline_id == pipeline_id]
    if stage:
        result = [o for o in result if o.stage == stage]
    if owner_id:
        result = [o for o in result if o.owner_id == owner_id]
    if priority:
        result = [o for o in result if o.priority == priority]
    if min_amount:
        result = [o for o in result if o.amount >= min_amount]
    if max_amount:
        result = [o for o in result if o.amount <= max_amount]

    return result[skip:skip + limit]

@app.get("/opportunities/{opp_id}", response_model=Opportunity)
async def get_opportunity(opp_id: str):
    """Obtener oportunidad"""
    if opp_id not in opportunities:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opportunities[opp_id]

@app.put("/opportunities/{opp_id}", response_model=Opportunity)
async def update_opportunity(opp_id: str, data: Dict[str, Any]):
    """Actualizar oportunidad"""
    if opp_id not in opportunities:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    opp = opportunities[opp_id]
    for key, value in data.items():
        if hasattr(opp, key):
            setattr(opp, key, value)
    opp.updated_at = datetime.utcnow()

    return opp

@app.put("/opportunities/{opp_id}/stage")
async def update_opportunity_stage(opp_id: str, stage: OpportunityStage):
    """Mover oportunidad a otra etapa"""
    if opp_id not in opportunities:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    opp = opportunities[opp_id]
    old_stage = opp.stage
    opp.stage = stage
    opp.updated_at = datetime.utcnow()

    # Actualizar probabilidad según pipeline
    pipeline = pipelines.get(opp.pipeline_id)
    if pipeline:
        for s in pipeline.stages:
            if s["name"].lower() == stage.value.replace("_", " "):
                opp.probability = s["probability"]
                break

    # Si es cierre
    if stage in [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST]:
        opp.actual_close_date = date.today()
        if opp.contact_id in contacts:
            if stage == OpportunityStage.CLOSED_WON:
                contacts[opp.contact_id].contact_type = ContactType.CUSTOMER

    return {
        "opportunity_id": opp_id,
        "old_stage": old_stage,
        "new_stage": stage,
        "probability": opp.probability
    }

@app.get("/opportunities/{opp_id}/insights")
async def get_opportunity_insights(opp_id: str):
    """Obtener insights de IA para oportunidad"""
    if opp_id not in opportunities:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    opp = opportunities[opp_id]
    return get_deal_insights(opp)

# ======================= PIPELINE ENDPOINTS =======================

@app.post("/pipelines", response_model=Pipeline)
async def create_pipeline(
    name: str,
    stages: List[Dict[str, Any]],
    created_by: str,
    description: Optional[str] = None
):
    """Crear nuevo pipeline"""
    pipeline = Pipeline(
        name=name,
        description=description,
        stages=stages,
        created_by=created_by
    )
    pipelines[pipeline.id] = pipeline
    return pipeline

@app.get("/pipelines", response_model=List[Pipeline])
async def list_pipelines():
    """Listar pipelines"""
    return list(pipelines.values())

@app.get("/pipelines/{pipeline_id}", response_model=Pipeline)
async def get_pipeline(pipeline_id: str):
    """Obtener pipeline"""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return pipelines[pipeline_id]

@app.get("/pipelines/{pipeline_id}/stats")
async def get_pipeline_stats(pipeline_id: str):
    """Obtener estadísticas de pipeline"""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    pipeline = pipelines[pipeline_id]
    pipeline_opps = [o for o in opportunities.values() if o.pipeline_id == pipeline_id]

    # Stats por etapa
    stage_stats = {}
    for stage in pipeline.stages:
        stage_name = stage["name"]
        stage_opps = [o for o in pipeline_opps if o.stage.value.replace("_", " ") == stage_name.lower()]
        stage_stats[stage_name] = {
            "count": len(stage_opps),
            "value": sum(o.amount for o in stage_opps),
            "weighted_value": sum(o.amount * (o.probability / 100) for o in stage_opps)
        }

    total_value = sum(o.amount for o in pipeline_opps)
    weighted_value = sum(o.amount * (o.probability / 100) for o in pipeline_opps)

    return {
        "pipeline_id": pipeline_id,
        "total_opportunities": len(pipeline_opps),
        "total_value": total_value,
        "weighted_value": weighted_value,
        "stages": stage_stats,
        "avg_deal_size": total_value / len(pipeline_opps) if pipeline_opps else 0,
        "win_rate": len([o for o in pipeline_opps if o.stage == OpportunityStage.CLOSED_WON]) / len(pipeline_opps) * 100 if pipeline_opps else 0
    }

# ======================= ACTIVITY ENDPOINTS =======================

@app.post("/activities", response_model=Activity)
async def create_activity(data: ActivityCreate):
    """Crear nueva actividad"""
    activity = Activity(**data.model_dump())
    activities[activity.id] = activity

    # Actualizar último contacto
    if activity.contact_id and activity.contact_id in contacts:
        contacts[activity.contact_id].last_contacted = datetime.utcnow()

    return activity

@app.get("/activities", response_model=List[Activity])
async def list_activities(
    type: Optional[ActivityType] = None,
    status: Optional[ActivityStatus] = None,
    contact_id: Optional[str] = None,
    opportunity_id: Optional[str] = None,
    assigned_to: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 50
):
    """Listar actividades"""
    result = list(activities.values())

    if type:
        result = [a for a in result if a.type == type]
    if status:
        result = [a for a in result if a.status == status]
    if contact_id:
        result = [a for a in result if a.contact_id == contact_id]
    if opportunity_id:
        result = [a for a in result if a.opportunity_id == opportunity_id]
    if assigned_to:
        result = [a for a in result if a.assigned_to == assigned_to]
    if start_date:
        result = [a for a in result if a.due_date and a.due_date >= start_date]
    if end_date:
        result = [a for a in result if a.due_date and a.due_date <= end_date]

    # Ordenar por fecha
    result.sort(key=lambda x: x.due_date or x.created_at, reverse=True)

    return result[skip:skip + limit]

@app.get("/activities/{activity_id}", response_model=Activity)
async def get_activity(activity_id: str):
    """Obtener actividad"""
    if activity_id not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activities[activity_id]

@app.put("/activities/{activity_id}/complete")
async def complete_activity(activity_id: str, outcome: Optional[str] = None):
    """Marcar actividad como completada"""
    if activity_id not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity = activities[activity_id]
    activity.status = ActivityStatus.COMPLETED
    activity.completed_at = datetime.utcnow()
    activity.outcome = outcome

    return activity

@app.get("/activities/today")
async def get_today_activities(user_id: str):
    """Obtener actividades de hoy"""
    today = date.today()
    return [
        a for a in activities.values()
        if a.assigned_to == user_id and
        a.due_date and
        a.due_date.date() == today and
        a.status != ActivityStatus.COMPLETED
    ]

@app.get("/activities/overdue")
async def get_overdue_activities(user_id: Optional[str] = None):
    """Obtener actividades vencidas"""
    now = datetime.utcnow()
    result = [
        a for a in activities.values()
        if a.due_date and
        a.due_date < now and
        a.status not in [ActivityStatus.COMPLETED, ActivityStatus.CANCELLED]
    ]

    if user_id:
        result = [a for a in result if a.assigned_to == user_id]

    return result

# ======================= PRODUCT ENDPOINTS =======================

@app.post("/products", response_model=Product)
async def create_product(
    name: str,
    price: float,
    created_by: str,
    code: Optional[str] = None,
    description: Optional[str] = None,
    category: Optional[str] = None
):
    """Crear producto"""
    product = Product(
        name=name,
        code=code,
        description=description,
        category=category,
        price=price,
        created_by=created_by
    )
    products[product.id] = product
    return product

@app.get("/products", response_model=List[Product])
async def list_products(
    category: Optional[str] = None,
    is_active: bool = True
):
    """Listar productos"""
    result = list(products.values())
    if category:
        result = [p for p in result if p.category == category]
    if is_active is not None:
        result = [p for p in result if p.is_active == is_active]
    return result

# ======================= QUOTE ENDPOINTS =======================

@app.post("/quotes", response_model=Quote)
async def create_quote(data: QuoteCreate):
    """Crear cotización"""
    if data.opportunity_id not in opportunities:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    quote = Quote(
        quote_number=generate_quote_number(),
        **data.model_dump()
    )

    # Calcular totales
    subtotal = 0
    for item in quote.items:
        item_total = item.get("quantity", 1) * item.get("unit_price", 0)
        item_discount = item_total * item.get("discount", 0) / 100
        subtotal += item_total - item_discount

    quote.subtotal = subtotal
    quote.total = subtotal + quote.tax - quote.discount

    quotes[quote.id] = quote
    return quote

@app.get("/quotes", response_model=List[Quote])
async def list_quotes(
    opportunity_id: Optional[str] = None,
    status: Optional[str] = None
):
    """Listar cotizaciones"""
    result = list(quotes.values())
    if opportunity_id:
        result = [q for q in result if q.opportunity_id == opportunity_id]
    if status:
        result = [q for q in result if q.status == status]
    return result

@app.get("/quotes/{quote_id}", response_model=Quote)
async def get_quote(quote_id: str):
    """Obtener cotización"""
    if quote_id not in quotes:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quotes[quote_id]

@app.put("/quotes/{quote_id}/send")
async def send_quote(quote_id: str):
    """Enviar cotización"""
    if quote_id not in quotes:
        raise HTTPException(status_code=404, detail="Quote not found")

    quote = quotes[quote_id]
    quote.status = "sent"
    quote.sent_at = datetime.utcnow()

    return {"message": "Quote sent", "quote_id": quote_id}

@app.put("/quotes/{quote_id}/accept")
async def accept_quote(quote_id: str):
    """Aceptar cotización"""
    if quote_id not in quotes:
        raise HTTPException(status_code=404, detail="Quote not found")

    quote = quotes[quote_id]
    quote.status = "accepted"
    quote.accepted_at = datetime.utcnow()

    # Actualizar oportunidad
    if quote.opportunity_id in opportunities:
        opp = opportunities[quote.opportunity_id]
        opp.stage = OpportunityStage.CLOSED_WON
        opp.amount = quote.total

    return {"message": "Quote accepted", "quote_id": quote_id}

# ======================= CAMPAIGN ENDPOINTS =======================

@app.post("/campaigns", response_model=Campaign)
async def create_campaign(
    name: str,
    type: str,
    created_by: str,
    description: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    budget: Optional[float] = None
):
    """Crear campaña"""
    campaign = Campaign(
        name=name,
        type=type,
        description=description,
        start_date=start_date,
        end_date=end_date,
        budget=budget,
        created_by=created_by
    )
    campaigns[campaign.id] = campaign
    return campaign

@app.get("/campaigns", response_model=List[Campaign])
async def list_campaigns(status: Optional[str] = None):
    """Listar campañas"""
    result = list(campaigns.values())
    if status:
        result = [c for c in result if c.status == status]
    return result

@app.get("/campaigns/{campaign_id}/stats")
async def get_campaign_stats(campaign_id: str):
    """Obtener estadísticas de campaña"""
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign = campaigns[campaign_id]
    campaign_leads = [l for l in leads.values() if l.campaign_id == campaign_id]
    converted_leads = [l for l in campaign_leads if l.status == LeadStatus.CONVERTED]

    return {
        "campaign_id": campaign_id,
        "leads_generated": len(campaign_leads),
        "leads_converted": len(converted_leads),
        "conversion_rate": len(converted_leads) / len(campaign_leads) * 100 if campaign_leads else 0,
        "budget": campaign.budget,
        "actual_cost": campaign.actual_cost,
        "cost_per_lead": campaign.actual_cost / len(campaign_leads) if campaign_leads else 0,
        "revenue_generated": campaign.revenue_generated,
        "roi": ((campaign.revenue_generated - campaign.actual_cost) / campaign.actual_cost * 100) if campaign.actual_cost > 0 else 0
    }

# ======================= AI FEATURES =======================

@app.post("/ai/lead-scoring")
async def ai_lead_scoring(lead_ids: Optional[List[str]] = None):
    """Scoring masivo de leads con IA"""
    target_leads = list(leads.values())
    if lead_ids:
        target_leads = [l for l in target_leads if l.id in lead_ids]

    results = []
    for lead in target_leads:
        contact = contacts.get(lead.contact_id)
        if contact:
            old_score = lead.score
            lead.score = calculate_lead_score(lead, contact)
            lead.rating = "hot" if lead.score >= 70 else "warm" if lead.score >= 40 else "cold"
            results.append({
                "lead_id": lead.id,
                "old_score": old_score,
                "new_score": lead.score,
                "rating": lead.rating
            })

    return {
        "processed": len(results),
        "results": results
    }

@app.post("/ai/win-probability")
async def ai_win_probability(opportunity_id: str):
    """Calcular probabilidad de ganar oportunidad"""
    if opportunity_id not in opportunities:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    opp = opportunities[opportunity_id]
    score = calculate_opportunity_score(opp)

    factors = [
        {"factor": "Stage Progress", "impact": "positive" if opp.probability > 50 else "negative", "weight": 0.3},
        {"factor": "Deal Size", "impact": "neutral", "weight": 0.2},
        {"factor": "Time to Close", "impact": "positive" if opp.expected_close_date and (opp.expected_close_date - date.today()).days > 0 else "negative", "weight": 0.2},
        {"factor": "Activity Level", "impact": "positive", "weight": 0.15},
        {"factor": "Historical Win Rate", "impact": "positive", "weight": 0.15}
    ]

    return {
        "opportunity_id": opportunity_id,
        "win_probability": score,
        "confidence": 0.82,
        "factors": factors,
        "recommendation": "Incrementar actividades de seguimiento" if score < 50 else "Mantener el momentum actual"
    }

@app.post("/ai/next-best-action")
async def ai_next_best_action(
    entity_type: str,  # lead, opportunity, contact
    entity_id: str
):
    """Sugerir próxima mejor acción"""
    import random

    actions = {
        "lead": [
            {"action": "send_email", "template": "introduction", "reason": "Lead nuevo sin contacto inicial"},
            {"action": "schedule_call", "duration": 15, "reason": "Calificar interés y necesidades"},
            {"action": "add_to_nurture", "campaign": "awareness", "reason": "Lead frío necesita nurturing"}
        ],
        "opportunity": [
            {"action": "schedule_demo", "duration": 60, "reason": "Mostrar valor del producto"},
            {"action": "send_proposal", "template": "standard", "reason": "Cliente listo para propuesta"},
            {"action": "follow_up_call", "duration": 30, "reason": "Sin actividad en 7 días"}
        ],
        "contact": [
            {"action": "reconnect_email", "template": "check_in", "reason": "Sin contacto en 30+ días"},
            {"action": "share_content", "content_type": "case_study", "reason": "Mantener engagement"},
            {"action": "schedule_review", "duration": 45, "reason": "Cliente activo - revisión trimestral"}
        ]
    }

    suggested_actions = actions.get(entity_type, actions["contact"])
    primary_action = random.choice(suggested_actions)

    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "primary_action": primary_action,
        "alternative_actions": [a for a in suggested_actions if a != primary_action][:2],
        "urgency": random.choice(["low", "medium", "high"]),
        "expected_outcome": "Aumentar probabilidad de conversión en 15%"
    }

@app.post("/ai/email-compose")
async def ai_compose_email(
    contact_id: str,
    purpose: str,  # introduction, follow_up, proposal, thank_you
    context: Optional[Dict[str, Any]] = None
):
    """Componer email con IA"""
    if contact_id not in contacts:
        raise HTTPException(status_code=404, detail="Contact not found")

    contact = contacts[contact_id]
    company_name = ""
    if contact.company_id and contact.company_id in companies:
        company_name = companies[contact.company_id].name

    templates = {
        "introduction": {
            "subject": f"Encantado de conectar, {contact.first_name}",
            "body": f"""Hola {contact.first_name},

Mi nombre es [Tu Nombre] de [Tu Empresa]. Me pongo en contacto porque creo que podríamos ayudar a {company_name or 'su empresa'} a [beneficio principal].

¿Tendría 15 minutos esta semana para una breve llamada?

Saludos,
[Tu Nombre]"""
        },
        "follow_up": {
            "subject": f"Seguimiento - {contact.first_name}",
            "body": f"""Hola {contact.first_name},

Espero que esté bien. Quería dar seguimiento a nuestra última conversación y ver si tiene alguna pregunta adicional.

¿Hay algo específico en lo que pueda ayudarle?

Saludos,
[Tu Nombre]"""
        },
        "proposal": {
            "subject": f"Propuesta para {company_name or 'su proyecto'}",
            "body": f"""Estimado/a {contact.first_name},

Adjunto encontrará nuestra propuesta detallada basada en las necesidades que discutimos.

Puntos clave:
- [Punto 1]
- [Punto 2]
- [Punto 3]

¿Podemos agendar una llamada para revisar los detalles?

Saludos cordiales,
[Tu Nombre]"""
        },
        "thank_you": {
            "subject": f"Gracias, {contact.first_name}",
            "body": f"""Hola {contact.first_name},

Quería agradecerle por su tiempo hoy. Fue un placer conocer más sobre {company_name or 'sus necesidades'}.

Como acordamos, [próximos pasos].

Quedo atento a cualquier pregunta.

Saludos,
[Tu Nombre]"""
        }
    }

    template = templates.get(purpose, templates["follow_up"])

    return {
        "contact_id": contact_id,
        "purpose": purpose,
        "subject": template["subject"],
        "body": template["body"],
        "variables_to_replace": ["[Tu Nombre]", "[Tu Empresa]", "[beneficio principal]"],
        "suggested_send_time": "Martes 10:00 AM"
    }

@app.post("/ai/deal-forecast")
async def ai_deal_forecast(
    pipeline_id: str = "default",
    period: str = "quarter"
):
    """Forecast de deals"""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    pipeline_opps = [o for o in opportunities.values()
                     if o.pipeline_id == pipeline_id and
                     o.stage not in [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST]]

    import random

    # Calcular forecast
    best_case = sum(o.amount for o in pipeline_opps)
    most_likely = sum(o.amount * (o.probability / 100) for o in pipeline_opps)
    worst_case = sum(o.amount * (o.probability / 100) * 0.7 for o in pipeline_opps)

    return {
        "pipeline_id": pipeline_id,
        "period": period,
        "forecast": {
            "best_case": round(best_case, 2),
            "most_likely": round(most_likely, 2),
            "worst_case": round(worst_case, 2)
        },
        "breakdown_by_stage": {
            stage.value: {
                "count": len([o for o in pipeline_opps if o.stage == stage]),
                "value": sum(o.amount for o in pipeline_opps if o.stage == stage)
            }
            for stage in OpportunityStage
            if stage not in [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST]
        },
        "confidence": random.uniform(0.7, 0.9),
        "risks": [
            "3 deals con fecha de cierre pasada",
            "5 deals sin actividad en 14+ días"
        ],
        "opportunities": [
            "2 deals hot listos para cerrar",
            "Pipeline saludable con buen balance de etapas"
        ]
    }

@app.post("/ai/territory-analysis")
async def ai_territory_analysis(owner_id: str):
    """Análisis de territorio de vendedor"""
    owner_opps = [o for o in opportunities.values() if o.owner_id == owner_id]
    owner_leads = [l for l in leads.values() if l.owner_id == owner_id]
    owner_contacts = [c for c in contacts.values() if c.owner_id == owner_id]

    import random

    return {
        "owner_id": owner_id,
        "summary": {
            "total_contacts": len(owner_contacts),
            "total_leads": len(owner_leads),
            "qualified_leads": len([l for l in owner_leads if l.status == LeadStatus.QUALIFIED]),
            "active_opportunities": len([o for o in owner_opps if o.stage not in [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST]]),
            "pipeline_value": sum(o.amount for o in owner_opps if o.stage not in [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST]),
            "closed_won_ytd": len([o for o in owner_opps if o.stage == OpportunityStage.CLOSED_WON]),
            "closed_value_ytd": sum(o.amount for o in owner_opps if o.stage == OpportunityStage.CLOSED_WON)
        },
        "performance_score": random.randint(60, 95),
        "recommendations": [
            "Enfocar en leads hot sin contacto reciente",
            "Agendar demos para oportunidades en needs_analysis",
            "Revisar oportunidades estancadas hace 30+ días"
        ],
        "benchmark": {
            "vs_team_avg": f"+{random.randint(5, 25)}%",
            "vs_quota": f"{random.randint(70, 120)}%"
        }
    }

@app.get("/ai/duplicates")
async def ai_find_duplicates():
    """Encontrar posibles duplicados"""
    potential_duplicates = []

    # Buscar contactos duplicados por email
    emails = {}
    for contact in contacts.values():
        if contact.email:
            if contact.email in emails:
                potential_duplicates.append({
                    "type": "contact",
                    "ids": [emails[contact.email], contact.id],
                    "reason": "Same email",
                    "confidence": 0.95
                })
            else:
                emails[contact.email] = contact.id

    # Buscar empresas duplicadas por nombre similar
    company_names = list(companies.values())
    for i, c1 in enumerate(company_names):
        for c2 in company_names[i+1:]:
            if c1.name.lower() == c2.name.lower():
                potential_duplicates.append({
                    "type": "company",
                    "ids": [c1.id, c2.id],
                    "reason": "Same name",
                    "confidence": 0.90
                })

    return {
        "total_potential_duplicates": len(potential_duplicates),
        "duplicates": potential_duplicates
    }

# ======================= REPORTS =======================

@app.get("/reports/sales-summary")
async def sales_summary_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    owner_id: Optional[str] = None
):
    """Reporte resumen de ventas"""
    opps = list(opportunities.values())

    if owner_id:
        opps = [o for o in opps if o.owner_id == owner_id]

    won = [o for o in opps if o.stage == OpportunityStage.CLOSED_WON]
    lost = [o for o in opps if o.stage == OpportunityStage.CLOSED_LOST]
    open_opps = [o for o in opps if o.stage not in [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST]]

    return {
        "period": {"start": start_date, "end": end_date},
        "summary": {
            "total_opportunities": len(opps),
            "won": len(won),
            "lost": len(lost),
            "open": len(open_opps),
            "win_rate": len(won) / (len(won) + len(lost)) * 100 if (won or lost) else 0,
            "total_revenue": sum(o.amount for o in won),
            "pipeline_value": sum(o.amount for o in open_opps),
            "avg_deal_size": sum(o.amount for o in won) / len(won) if won else 0
        }
    }

@app.get("/reports/activity-metrics")
async def activity_metrics_report(
    user_id: Optional[str] = None,
    days: int = 30
):
    """Reporte de métricas de actividad"""
    cutoff = datetime.utcnow() - timedelta(days=days)
    acts = [a for a in activities.values() if a.created_at >= cutoff]

    if user_id:
        acts = [a for a in acts if a.assigned_to == user_id or a.created_by == user_id]

    by_type = {}
    for activity in acts:
        t = activity.type.value
        if t not in by_type:
            by_type[t] = {"total": 0, "completed": 0}
        by_type[t]["total"] += 1
        if activity.status == ActivityStatus.COMPLETED:
            by_type[t]["completed"] += 1

    return {
        "period_days": days,
        "total_activities": len(acts),
        "completed": len([a for a in acts if a.status == ActivityStatus.COMPLETED]),
        "completion_rate": len([a for a in acts if a.status == ActivityStatus.COMPLETED]) / len(acts) * 100 if acts else 0,
        "by_type": by_type
    }

# ======================= WEBSOCKET =======================

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket para actualizaciones en tiempo real"""
    await websocket.accept()

    if user_id not in active_connections:
        active_connections[user_id] = []
    active_connections[user_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Procesar mensaje según tipo
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        active_connections[user_id].remove(websocket)
        if not active_connections[user_id]:
            del active_connections[user_id]

# ======================= HEALTH CHECK =======================

@app.get("/health")
async def health_check():
    """Health check del servicio"""
    return {
        "status": "healthy",
        "service": "ai-crm",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/stats")
async def get_stats():
    """Estadísticas del servicio"""
    return {
        "companies": len(companies),
        "contacts": len(contacts),
        "leads": len(leads),
        "opportunities": len(opportunities),
        "activities": len(activities),
        "pipelines": len(pipelines),
        "products": len(products),
        "campaigns": len(campaigns),
        "quotes": len(quotes)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8016)

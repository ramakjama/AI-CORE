"""
AI-HR Service - Human Resources Management para AI-Suite
Puerto: 8017
Características:
- Gestión de empleados y organización
- Reclutamiento y candidatos
- Time tracking y ausencias
- Performance reviews
- Payroll y beneficios
- AI matching y analytics
"""

from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date, time
from enum import Enum
import uuid

app = FastAPI(
    title="AI-HR Service",
    description="Human Resources con IA para AI-Suite",
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

class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"
    FREELANCE = "freelance"

class EmploymentStatus(str, Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"
    RESIGNED = "resigned"
    RETIRED = "retired"

class JobStatus(str, Enum):
    DRAFT = "draft"
    OPEN = "open"
    ON_HOLD = "on_hold"
    CLOSED = "closed"
    FILLED = "filled"

class CandidateStatus(str, Enum):
    NEW = "new"
    SCREENING = "screening"
    INTERVIEW = "interview"
    ASSESSMENT = "assessment"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class LeaveType(str, Enum):
    VACATION = "vacation"
    SICK = "sick"
    PERSONAL = "personal"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    BEREAVEMENT = "bereavement"
    UNPAID = "unpaid"
    REMOTE = "remote"

class LeaveStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class ReviewCycle(str, Enum):
    QUARTERLY = "quarterly"
    SEMI_ANNUAL = "semi_annual"
    ANNUAL = "annual"
    PROBATION = "probation"

class ReviewStatus(str, Enum):
    DRAFT = "draft"
    SELF_REVIEW = "self_review"
    MANAGER_REVIEW = "manager_review"
    CALIBRATION = "calibration"
    COMPLETED = "completed"

class GoalStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ExpenseStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REIMBURSED = "reimbursed"

# ======================= MODELS =======================

class Department(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    head_id: Optional[str] = None  # Employee ID of department head
    cost_center: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Location(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    city: str
    country: str
    timezone: str = "UTC"
    is_headquarters: bool = False
    is_active: bool = True

class JobTitle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    level: int = 1  # 1-10 seniority level
    department_id: Optional[str] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    description: Optional[str] = None
    skills_required: List[str] = []

class Employee(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_number: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    personal_email: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    # Employment
    job_title_id: Optional[str] = None
    department_id: Optional[str] = None
    location_id: Optional[str] = None
    manager_id: Optional[str] = None
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE
    hire_date: date
    probation_end_date: Optional[date] = None
    termination_date: Optional[date] = None
    termination_reason: Optional[str] = None
    # Compensation
    salary: Optional[float] = None
    currency: str = "USD"
    pay_frequency: str = "monthly"  # weekly, bi-weekly, monthly
    bank_account: Optional[str] = None
    # Skills & Education
    skills: List[str] = []
    certifications: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    languages: List[Dict[str, str]] = []  # [{language, level}]
    # Documents
    documents: List[Dict[str, str]] = []
    photo_url: Optional[str] = None
    # Metadata
    custom_fields: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class JobPosting(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    department_id: str
    location_id: Optional[str] = None
    job_title_id: Optional[str] = None
    description: str
    requirements: List[str] = []
    responsibilities: List[str] = []
    benefits: List[str] = []
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    experience_years: Optional[int] = None
    education_level: Optional[str] = None
    skills_required: List[str] = []
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: str = "USD"
    is_remote: bool = False
    status: JobStatus = JobStatus.DRAFT
    published_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    hiring_manager_id: Optional[str] = None
    recruiter_id: Optional[str] = None
    positions_available: int = 1
    positions_filled: int = 0
    views: int = 0
    applications: int = 0
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Candidate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    resume_url: Optional[str] = None
    cover_letter: Optional[str] = None
    current_company: Optional[str] = None
    current_title: Optional[str] = None
    experience_years: Optional[int] = None
    skills: List[str] = []
    education: List[Dict[str, Any]] = []
    expected_salary: Optional[float] = None
    notice_period: Optional[str] = None
    status: CandidateStatus = CandidateStatus.NEW
    source: str = "website"  # website, linkedin, referral, agency
    referred_by: Optional[str] = None
    rating: Optional[int] = None  # 1-5
    ai_score: Optional[int] = None  # 0-100
    notes: Optional[str] = None
    tags: List[str] = []
    custom_fields: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Interview(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    job_id: str
    interviewer_ids: List[str] = []
    interview_type: str = "screening"  # screening, technical, behavioral, final
    scheduled_at: datetime
    duration_minutes: int = 60
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    status: str = "scheduled"  # scheduled, completed, cancelled, no_show
    feedback: Optional[Dict[str, Any]] = None
    overall_rating: Optional[int] = None
    recommendation: Optional[str] = None  # proceed, reject, hold
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LeaveRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    days_requested: float
    reason: Optional[str] = None
    status: LeaveStatus = LeaveStatus.PENDING
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    documents: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LeaveBalance(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    year: int
    leave_type: LeaveType
    entitled_days: float
    used_days: float = 0
    pending_days: float = 0
    carried_forward: float = 0

class TimeEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    date: date
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    break_minutes: int = 0
    total_hours: float = 0
    overtime_hours: float = 0
    project_id: Optional[str] = None
    task_description: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PerformanceReview(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    reviewer_id: str
    cycle: ReviewCycle
    period_start: date
    period_end: date
    status: ReviewStatus = ReviewStatus.DRAFT
    self_assessment: Optional[Dict[str, Any]] = None
    manager_assessment: Optional[Dict[str, Any]] = None
    goals_review: List[Dict[str, Any]] = []
    competencies: List[Dict[str, Any]] = []
    overall_rating: Optional[int] = None  # 1-5
    strengths: List[str] = []
    areas_for_improvement: List[str] = []
    development_plan: Optional[str] = None
    employee_comments: Optional[str] = None
    manager_comments: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Goal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    title: str
    description: Optional[str] = None
    category: str = "performance"  # performance, development, project
    key_results: List[Dict[str, Any]] = []
    weight: float = 1.0  # For weighted scoring
    due_date: Optional[date] = None
    status: GoalStatus = GoalStatus.NOT_STARTED
    progress: int = 0  # 0-100
    manager_approved: bool = False
    review_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Training(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    category: str
    provider: Optional[str] = None
    instructor: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_hours: Optional[float] = None
    location: Optional[str] = None
    is_online: bool = False
    max_participants: Optional[int] = None
    cost_per_person: Optional[float] = None
    is_mandatory: bool = False
    skills_developed: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TrainingEnrollment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    training_id: str
    employee_id: str
    status: str = "enrolled"  # enrolled, in_progress, completed, cancelled
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    score: Optional[float] = None
    certificate_url: Optional[str] = None
    feedback: Optional[str] = None

class Expense(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    category: str  # travel, meals, supplies, equipment, other
    description: str
    amount: float
    currency: str = "USD"
    date: date
    receipt_url: Optional[str] = None
    status: ExpenseStatus = ExpenseStatus.PENDING
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    reimbursement_date: Optional[date] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Announcement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    category: str = "general"  # general, policy, event, urgent
    priority: str = "normal"  # low, normal, high, urgent
    target_departments: List[str] = []  # Empty = all
    target_locations: List[str] = []  # Empty = all
    published_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_pinned: bool = False
    author_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Payroll(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    period_start: date
    period_end: date
    base_salary: float
    overtime_pay: float = 0
    bonuses: float = 0
    deductions: Dict[str, float] = {}  # taxes, insurance, etc.
    net_pay: float
    currency: str = "USD"
    status: str = "pending"  # pending, processed, paid
    paid_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ======================= STORAGE =======================

departments: Dict[str, Department] = {}
locations: Dict[str, Location] = {}
job_titles: Dict[str, JobTitle] = {}
employees: Dict[str, Employee] = {}
job_postings: Dict[str, JobPosting] = {}
candidates: Dict[str, Candidate] = {}
interviews: Dict[str, Interview] = {}
leave_requests: Dict[str, LeaveRequest] = {}
leave_balances: Dict[str, LeaveBalance] = {}
time_entries: Dict[str, TimeEntry] = {}
performance_reviews: Dict[str, PerformanceReview] = {}
goals: Dict[str, Goal] = {}
trainings: Dict[str, Training] = {}
training_enrollments: Dict[str, TrainingEnrollment] = {}
expenses: Dict[str, Expense] = {}
announcements: Dict[str, Announcement] = {}
payrolls: Dict[str, Payroll] = {}

# ======================= REQUEST MODELS =======================

class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    department_id: Optional[str] = None
    job_title_id: Optional[str] = None
    location_id: Optional[str] = None
    manager_id: Optional[str] = None
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    hire_date: date
    salary: Optional[float] = None

class JobPostingCreate(BaseModel):
    title: str
    department_id: str
    description: str
    requirements: List[str] = []
    responsibilities: List[str] = []
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    skills_required: List[str] = []
    experience_years: Optional[int] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    is_remote: bool = False
    created_by: str

class CandidateCreate(BaseModel):
    job_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    skills: List[str] = []
    experience_years: Optional[int] = None
    expected_salary: Optional[float] = None
    source: str = "website"

class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Optional[str] = None

class GoalCreate(BaseModel):
    employee_id: str
    title: str
    description: Optional[str] = None
    category: str = "performance"
    key_results: List[Dict[str, Any]] = []
    due_date: Optional[date] = None

# ======================= HELPER FUNCTIONS =======================

def generate_employee_number() -> str:
    """Genera número de empleado único"""
    import random
    return f"EMP{datetime.utcnow().strftime('%Y')}{random.randint(1000, 9999)}"

def calculate_business_days(start_date: date, end_date: date) -> float:
    """Calcula días laborables entre dos fechas"""
    days = 0
    current = start_date
    while current <= end_date:
        if current.weekday() < 5:  # Monday to Friday
            days += 1
        current += timedelta(days=1)
    return days

def calculate_ai_candidate_score(candidate: Candidate, job: JobPosting) -> int:
    """Calcula score de candidato con IA"""
    score = 0

    # Match de skills (40%)
    if job.skills_required and candidate.skills:
        matching_skills = set(s.lower() for s in candidate.skills) & set(s.lower() for s in job.skills_required)
        skill_score = len(matching_skills) / len(job.skills_required) * 40
        score += skill_score

    # Experiencia (30%)
    if job.experience_years and candidate.experience_years:
        if candidate.experience_years >= job.experience_years:
            score += 30
        else:
            score += (candidate.experience_years / job.experience_years) * 30

    # Salario (15%)
    if job.salary_max and candidate.expected_salary:
        if candidate.expected_salary <= job.salary_max:
            score += 15
        else:
            diff = (candidate.expected_salary - job.salary_max) / job.salary_max
            score += max(0, 15 - diff * 15)

    # Completitud del perfil (15%)
    profile_completeness = 0
    if candidate.linkedin_url:
        profile_completeness += 3
    if candidate.resume_url:
        profile_completeness += 5
    if candidate.education:
        profile_completeness += 4
    if candidate.skills:
        profile_completeness += 3
    score += profile_completeness

    return min(int(score), 100)

def get_org_chart(employee_id: Optional[str] = None) -> Dict[str, Any]:
    """Genera organigrama"""
    def build_tree(manager_id: Optional[str]) -> List[Dict[str, Any]]:
        direct_reports = [e for e in employees.values() if e.manager_id == manager_id]
        return [
            {
                "id": emp.id,
                "name": f"{emp.first_name} {emp.last_name}",
                "title": job_titles.get(emp.job_title_id, {}).title if emp.job_title_id else None,
                "department": departments.get(emp.department_id, {}).name if emp.department_id else None,
                "photo_url": emp.photo_url,
                "reports": build_tree(emp.id)
            }
            for emp in direct_reports
        ]

    if employee_id:
        emp = employees.get(employee_id)
        if emp:
            return {
                "id": emp.id,
                "name": f"{emp.first_name} {emp.last_name}",
                "reports": build_tree(emp.id)
            }

    # Build from top (no manager)
    top_level = [e for e in employees.values() if not e.manager_id]
    return {"organization": [build_tree(None)]}

# ======================= DEPARTMENT ENDPOINTS =======================

@app.post("/departments", response_model=Department)
async def create_department(
    name: str,
    code: str,
    description: Optional[str] = None,
    parent_id: Optional[str] = None,
    head_id: Optional[str] = None
):
    """Crear departamento"""
    dept = Department(
        name=name,
        code=code,
        description=description,
        parent_id=parent_id,
        head_id=head_id
    )
    departments[dept.id] = dept
    return dept

@app.get("/departments", response_model=List[Department])
async def list_departments(is_active: bool = True):
    """Listar departamentos"""
    result = list(departments.values())
    if is_active is not None:
        result = [d for d in result if d.is_active == is_active]
    return result

@app.get("/departments/{dept_id}", response_model=Department)
async def get_department(dept_id: str):
    """Obtener departamento"""
    if dept_id not in departments:
        raise HTTPException(status_code=404, detail="Department not found")
    return departments[dept_id]

@app.get("/departments/{dept_id}/employees", response_model=List[Employee])
async def get_department_employees(dept_id: str):
    """Obtener empleados de departamento"""
    return [e for e in employees.values() if e.department_id == dept_id]

# ======================= EMPLOYEE ENDPOINTS =======================

@app.post("/employees", response_model=Employee)
async def create_employee(data: EmployeeCreate):
    """Crear empleado"""
    emp = Employee(
        employee_number=generate_employee_number(),
        **data.model_dump()
    )
    employees[emp.id] = emp

    # Crear balances de vacaciones
    current_year = datetime.utcnow().year
    for leave_type in [LeaveType.VACATION, LeaveType.SICK, LeaveType.PERSONAL]:
        balance = LeaveBalance(
            employee_id=emp.id,
            year=current_year,
            leave_type=leave_type,
            entitled_days=22 if leave_type == LeaveType.VACATION else 10 if leave_type == LeaveType.SICK else 5
        )
        leave_balances[balance.id] = balance

    return emp

@app.get("/employees", response_model=List[Employee])
async def list_employees(
    department_id: Optional[str] = None,
    location_id: Optional[str] = None,
    manager_id: Optional[str] = None,
    status: Optional[EmploymentStatus] = None,
    employment_type: Optional[EmploymentType] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Listar empleados"""
    result = list(employees.values())

    if department_id:
        result = [e for e in result if e.department_id == department_id]
    if location_id:
        result = [e for e in result if e.location_id == location_id]
    if manager_id:
        result = [e for e in result if e.manager_id == manager_id]
    if status:
        result = [e for e in result if e.employment_status == status]
    if employment_type:
        result = [e for e in result if e.employment_type == employment_type]
    if search:
        search_lower = search.lower()
        result = [e for e in result if
                  search_lower in e.first_name.lower() or
                  search_lower in e.last_name.lower() or
                  search_lower in e.email.lower() or
                  search_lower in e.employee_number.lower()]

    return result[skip:skip + limit]

@app.get("/employees/{emp_id}", response_model=Employee)
async def get_employee(emp_id: str):
    """Obtener empleado"""
    if emp_id not in employees:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employees[emp_id]

@app.put("/employees/{emp_id}", response_model=Employee)
async def update_employee(emp_id: str, data: Dict[str, Any]):
    """Actualizar empleado"""
    if emp_id not in employees:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp = employees[emp_id]
    for key, value in data.items():
        if hasattr(emp, key):
            setattr(emp, key, value)
    emp.updated_at = datetime.utcnow()

    return emp

@app.get("/employees/{emp_id}/direct-reports", response_model=List[Employee])
async def get_direct_reports(emp_id: str):
    """Obtener reportes directos"""
    return [e for e in employees.values() if e.manager_id == emp_id]

@app.get("/employees/{emp_id}/manager-chain")
async def get_manager_chain(emp_id: str):
    """Obtener cadena de managers"""
    if emp_id not in employees:
        raise HTTPException(status_code=404, detail="Employee not found")

    chain = []
    current = employees[emp_id]
    while current.manager_id and current.manager_id in employees:
        manager = employees[current.manager_id]
        chain.append({
            "id": manager.id,
            "name": f"{manager.first_name} {manager.last_name}",
            "title": job_titles.get(manager.job_title_id, {}).title if manager.job_title_id else None
        })
        current = manager

    return chain

@app.get("/employees/{emp_id}/profile-completeness")
async def get_profile_completeness(emp_id: str):
    """Calcular completitud del perfil"""
    if emp_id not in employees:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp = employees[emp_id]
    fields = {
        "basic_info": ["first_name", "last_name", "email", "phone", "date_of_birth"],
        "employment": ["job_title_id", "department_id", "manager_id", "hire_date"],
        "contact": ["address", "city", "country", "personal_email"],
        "skills": ["skills", "certifications", "education"],
        "documents": ["photo_url", "documents"]
    }

    completeness = {}
    for section, section_fields in fields.items():
        filled = sum(1 for f in section_fields if getattr(emp, f, None))
        completeness[section] = {
            "filled": filled,
            "total": len(section_fields),
            "percentage": round(filled / len(section_fields) * 100)
        }

    total_filled = sum(c["filled"] for c in completeness.values())
    total_fields = sum(c["total"] for c in completeness.values())

    return {
        "employee_id": emp_id,
        "overall_percentage": round(total_filled / total_fields * 100),
        "sections": completeness,
        "missing_fields": [
            f for section_fields in fields.values()
            for f in section_fields
            if not getattr(emp, f, None)
        ]
    }

# ======================= JOB POSTING ENDPOINTS =======================

@app.post("/jobs", response_model=JobPosting)
async def create_job_posting(data: JobPostingCreate):
    """Crear oferta de trabajo"""
    job = JobPosting(**data.model_dump())
    job_postings[job.id] = job
    return job

@app.get("/jobs", response_model=List[JobPosting])
async def list_job_postings(
    department_id: Optional[str] = None,
    status: Optional[JobStatus] = None,
    is_remote: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
):
    """Listar ofertas de trabajo"""
    result = list(job_postings.values())

    if department_id:
        result = [j for j in result if j.department_id == department_id]
    if status:
        result = [j for j in result if j.status == status]
    if is_remote is not None:
        result = [j for j in result if j.is_remote == is_remote]

    return result[skip:skip + limit]

@app.get("/jobs/{job_id}", response_model=JobPosting)
async def get_job_posting(job_id: str):
    """Obtener oferta de trabajo"""
    if job_id not in job_postings:
        raise HTTPException(status_code=404, detail="Job posting not found")

    job = job_postings[job_id]
    job.views += 1
    return job

@app.put("/jobs/{job_id}/publish")
async def publish_job(job_id: str):
    """Publicar oferta"""
    if job_id not in job_postings:
        raise HTTPException(status_code=404, detail="Job posting not found")

    job = job_postings[job_id]
    job.status = JobStatus.OPEN
    job.published_at = datetime.utcnow()

    return {"message": "Job published", "job_id": job_id}

@app.put("/jobs/{job_id}/close")
async def close_job(job_id: str):
    """Cerrar oferta"""
    if job_id not in job_postings:
        raise HTTPException(status_code=404, detail="Job posting not found")

    job = job_postings[job_id]
    job.status = JobStatus.CLOSED

    return {"message": "Job closed", "job_id": job_id}

@app.get("/jobs/{job_id}/candidates", response_model=List[Candidate])
async def get_job_candidates(
    job_id: str,
    status: Optional[CandidateStatus] = None
):
    """Obtener candidatos de oferta"""
    result = [c for c in candidates.values() if c.job_id == job_id]
    if status:
        result = [c for c in result if c.status == status]
    return result

@app.get("/jobs/{job_id}/pipeline")
async def get_job_pipeline(job_id: str):
    """Obtener pipeline de candidatos"""
    if job_id not in job_postings:
        raise HTTPException(status_code=404, detail="Job posting not found")

    job_candidates = [c for c in candidates.values() if c.job_id == job_id]

    pipeline = {}
    for status in CandidateStatus:
        status_candidates = [c for c in job_candidates if c.status == status]
        pipeline[status.value] = {
            "count": len(status_candidates),
            "candidates": [
                {
                    "id": c.id,
                    "name": f"{c.first_name} {c.last_name}",
                    "ai_score": c.ai_score,
                    "rating": c.rating
                }
                for c in status_candidates
            ]
        }

    return pipeline

# ======================= CANDIDATE ENDPOINTS =======================

@app.post("/candidates", response_model=Candidate)
async def create_candidate(data: CandidateCreate):
    """Crear candidato (aplicar a oferta)"""
    if data.job_id not in job_postings:
        raise HTTPException(status_code=404, detail="Job posting not found")

    candidate = Candidate(**data.model_dump())

    # Calcular AI score
    job = job_postings[data.job_id]
    candidate.ai_score = calculate_ai_candidate_score(candidate, job)

    candidates[candidate.id] = candidate

    # Incrementar contador de aplicaciones
    job.applications += 1

    return candidate

@app.get("/candidates/{candidate_id}", response_model=Candidate)
async def get_candidate(candidate_id: str):
    """Obtener candidato"""
    if candidate_id not in candidates:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidates[candidate_id]

@app.put("/candidates/{candidate_id}/status")
async def update_candidate_status(
    candidate_id: str,
    status: CandidateStatus,
    notes: Optional[str] = None
):
    """Actualizar estado de candidato"""
    if candidate_id not in candidates:
        raise HTTPException(status_code=404, detail="Candidate not found")

    candidate = candidates[candidate_id]
    candidate.status = status
    if notes:
        candidate.notes = (candidate.notes or "") + f"\n[{datetime.utcnow().isoformat()}] {notes}"
    candidate.updated_at = datetime.utcnow()

    return candidate

@app.post("/candidates/{candidate_id}/hire")
async def hire_candidate(
    candidate_id: str,
    hire_date: date,
    salary: float,
    department_id: str,
    job_title_id: Optional[str] = None,
    manager_id: Optional[str] = None
):
    """Contratar candidato"""
    if candidate_id not in candidates:
        raise HTTPException(status_code=404, detail="Candidate not found")

    candidate = candidates[candidate_id]

    # Crear empleado
    emp = Employee(
        employee_number=generate_employee_number(),
        first_name=candidate.first_name,
        last_name=candidate.last_name,
        email=candidate.email,
        phone=candidate.phone,
        department_id=department_id,
        job_title_id=job_title_id,
        manager_id=manager_id,
        hire_date=hire_date,
        salary=salary,
        skills=candidate.skills,
        education=candidate.education
    )
    employees[emp.id] = emp

    # Actualizar candidato
    candidate.status = CandidateStatus.HIRED
    candidate.updated_at = datetime.utcnow()

    # Actualizar job
    if candidate.job_id in job_postings:
        job = job_postings[candidate.job_id]
        job.positions_filled += 1
        if job.positions_filled >= job.positions_available:
            job.status = JobStatus.FILLED

    return {
        "message": "Candidate hired",
        "employee": emp
    }

# ======================= INTERVIEW ENDPOINTS =======================

@app.post("/interviews", response_model=Interview)
async def schedule_interview(
    candidate_id: str,
    job_id: str,
    interviewer_ids: List[str],
    scheduled_at: datetime,
    interview_type: str = "screening",
    duration_minutes: int = 60,
    meeting_link: Optional[str] = None
):
    """Programar entrevista"""
    if candidate_id not in candidates:
        raise HTTPException(status_code=404, detail="Candidate not found")

    interview = Interview(
        candidate_id=candidate_id,
        job_id=job_id,
        interviewer_ids=interviewer_ids,
        scheduled_at=scheduled_at,
        interview_type=interview_type,
        duration_minutes=duration_minutes,
        meeting_link=meeting_link
    )
    interviews[interview.id] = interview

    return interview

@app.get("/interviews", response_model=List[Interview])
async def list_interviews(
    candidate_id: Optional[str] = None,
    interviewer_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Listar entrevistas"""
    result = list(interviews.values())

    if candidate_id:
        result = [i for i in result if i.candidate_id == candidate_id]
    if interviewer_id:
        result = [i for i in result if interviewer_id in i.interviewer_ids]
    if status:
        result = [i for i in result if i.status == status]
    if start_date:
        result = [i for i in result if i.scheduled_at.date() >= start_date]
    if end_date:
        result = [i for i in result if i.scheduled_at.date() <= end_date]

    return sorted(result, key=lambda x: x.scheduled_at)

@app.put("/interviews/{interview_id}/feedback")
async def submit_interview_feedback(
    interview_id: str,
    overall_rating: int,
    recommendation: str,
    feedback: Dict[str, Any],
    notes: Optional[str] = None
):
    """Enviar feedback de entrevista"""
    if interview_id not in interviews:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview = interviews[interview_id]
    interview.status = "completed"
    interview.overall_rating = overall_rating
    interview.recommendation = recommendation
    interview.feedback = feedback
    interview.notes = notes

    return interview

# ======================= LEAVE ENDPOINTS =======================

@app.post("/leave-requests", response_model=LeaveRequest)
async def create_leave_request(data: LeaveRequestCreate):
    """Crear solicitud de ausencia"""
    if data.employee_id not in employees:
        raise HTTPException(status_code=404, detail="Employee not found")

    days = calculate_business_days(data.start_date, data.end_date)

    leave = LeaveRequest(
        **data.model_dump(),
        days_requested=days
    )
    leave_requests[leave.id] = leave

    # Actualizar balance pendiente
    for balance in leave_balances.values():
        if (balance.employee_id == data.employee_id and
            balance.leave_type == data.leave_type and
            balance.year == datetime.utcnow().year):
            balance.pending_days += days
            break

    return leave

@app.get("/leave-requests", response_model=List[LeaveRequest])
async def list_leave_requests(
    employee_id: Optional[str] = None,
    status: Optional[LeaveStatus] = None,
    leave_type: Optional[LeaveType] = None,
    manager_id: Optional[str] = None
):
    """Listar solicitudes de ausencia"""
    result = list(leave_requests.values())

    if employee_id:
        result = [l for l in result if l.employee_id == employee_id]
    if status:
        result = [l for l in result if l.status == status]
    if leave_type:
        result = [l for l in result if l.leave_type == leave_type]
    if manager_id:
        # Filtrar por reportes del manager
        direct_reports = [e.id for e in employees.values() if e.manager_id == manager_id]
        result = [l for l in result if l.employee_id in direct_reports]

    return result

@app.put("/leave-requests/{request_id}/approve")
async def approve_leave_request(request_id: str, approved_by: str):
    """Aprobar solicitud de ausencia"""
    if request_id not in leave_requests:
        raise HTTPException(status_code=404, detail="Leave request not found")

    leave = leave_requests[request_id]
    leave.status = LeaveStatus.APPROVED
    leave.approved_by = approved_by
    leave.approved_at = datetime.utcnow()

    # Actualizar balance
    for balance in leave_balances.values():
        if (balance.employee_id == leave.employee_id and
            balance.leave_type == leave.leave_type and
            balance.year == datetime.utcnow().year):
            balance.pending_days -= leave.days_requested
            balance.used_days += leave.days_requested
            break

    return leave

@app.put("/leave-requests/{request_id}/reject")
async def reject_leave_request(
    request_id: str,
    rejected_by: str,
    reason: str
):
    """Rechazar solicitud de ausencia"""
    if request_id not in leave_requests:
        raise HTTPException(status_code=404, detail="Leave request not found")

    leave = leave_requests[request_id]
    leave.status = LeaveStatus.REJECTED
    leave.approved_by = rejected_by
    leave.rejection_reason = reason

    # Restaurar balance pendiente
    for balance in leave_balances.values():
        if (balance.employee_id == leave.employee_id and
            balance.leave_type == leave.leave_type and
            balance.year == datetime.utcnow().year):
            balance.pending_days -= leave.days_requested
            break

    return leave

@app.get("/employees/{emp_id}/leave-balance")
async def get_employee_leave_balance(emp_id: str, year: Optional[int] = None):
    """Obtener balance de ausencias de empleado"""
    if emp_id not in employees:
        raise HTTPException(status_code=404, detail="Employee not found")

    target_year = year or datetime.utcnow().year
    balances = [b for b in leave_balances.values()
                if b.employee_id == emp_id and b.year == target_year]

    return {
        "employee_id": emp_id,
        "year": target_year,
        "balances": [
            {
                "type": b.leave_type,
                "entitled": b.entitled_days,
                "used": b.used_days,
                "pending": b.pending_days,
                "available": b.entitled_days + b.carried_forward - b.used_days - b.pending_days
            }
            for b in balances
        ]
    }

# ======================= TIME TRACKING ENDPOINTS =======================

@app.post("/time-entries/clock-in")
async def clock_in(employee_id: str):
    """Registrar entrada"""
    if employee_id not in employees:
        raise HTTPException(status_code=404, detail="Employee not found")

    now = datetime.utcnow()
    entry = TimeEntry(
        employee_id=employee_id,
        date=now.date(),
        clock_in=now
    )
    time_entries[entry.id] = entry

    return entry

@app.post("/time-entries/{entry_id}/clock-out")
async def clock_out(entry_id: str):
    """Registrar salida"""
    if entry_id not in time_entries:
        raise HTTPException(status_code=404, detail="Time entry not found")

    entry = time_entries[entry_id]
    entry.clock_out = datetime.utcnow()

    # Calcular horas
    if entry.clock_in and entry.clock_out:
        delta = entry.clock_out - entry.clock_in
        total_minutes = delta.total_seconds() / 60 - entry.break_minutes
        entry.total_hours = round(total_minutes / 60, 2)

        # Calcular horas extra (asumiendo 8h normales)
        if entry.total_hours > 8:
            entry.overtime_hours = round(entry.total_hours - 8, 2)

    return entry

@app.get("/time-entries", response_model=List[TimeEntry])
async def list_time_entries(
    employee_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None
):
    """Listar registros de tiempo"""
    result = list(time_entries.values())

    if employee_id:
        result = [t for t in result if t.employee_id == employee_id]
    if start_date:
        result = [t for t in result if t.date >= start_date]
    if end_date:
        result = [t for t in result if t.date <= end_date]
    if status:
        result = [t for t in result if t.status == status]

    return sorted(result, key=lambda x: x.date, reverse=True)

@app.get("/employees/{emp_id}/timesheet")
async def get_employee_timesheet(
    emp_id: str,
    start_date: date,
    end_date: date
):
    """Obtener timesheet de empleado"""
    if emp_id not in employees:
        raise HTTPException(status_code=404, detail="Employee not found")

    entries = [t for t in time_entries.values()
               if t.employee_id == emp_id and start_date <= t.date <= end_date]

    return {
        "employee_id": emp_id,
        "period": {"start": start_date, "end": end_date},
        "entries": entries,
        "summary": {
            "total_days": len(entries),
            "total_hours": sum(e.total_hours for e in entries),
            "overtime_hours": sum(e.overtime_hours for e in entries),
            "avg_hours_per_day": sum(e.total_hours for e in entries) / len(entries) if entries else 0
        }
    }

# ======================= PERFORMANCE REVIEW ENDPOINTS =======================

@app.post("/performance-reviews", response_model=PerformanceReview)
async def create_performance_review(
    employee_id: str,
    reviewer_id: str,
    cycle: ReviewCycle,
    period_start: date,
    period_end: date
):
    """Crear evaluación de desempeño"""
    if employee_id not in employees:
        raise HTTPException(status_code=404, detail="Employee not found")

    review = PerformanceReview(
        employee_id=employee_id,
        reviewer_id=reviewer_id,
        cycle=cycle,
        period_start=period_start,
        period_end=period_end
    )
    performance_reviews[review.id] = review

    return review

@app.get("/performance-reviews", response_model=List[PerformanceReview])
async def list_performance_reviews(
    employee_id: Optional[str] = None,
    reviewer_id: Optional[str] = None,
    status: Optional[ReviewStatus] = None,
    cycle: Optional[ReviewCycle] = None
):
    """Listar evaluaciones"""
    result = list(performance_reviews.values())

    if employee_id:
        result = [r for r in result if r.employee_id == employee_id]
    if reviewer_id:
        result = [r for r in result if r.reviewer_id == reviewer_id]
    if status:
        result = [r for r in result if r.status == status]
    if cycle:
        result = [r for r in result if r.cycle == cycle]

    return result

@app.put("/performance-reviews/{review_id}/self-assessment")
async def submit_self_assessment(
    review_id: str,
    assessment: Dict[str, Any]
):
    """Enviar auto-evaluación"""
    if review_id not in performance_reviews:
        raise HTTPException(status_code=404, detail="Review not found")

    review = performance_reviews[review_id]
    review.self_assessment = assessment
    review.status = ReviewStatus.MANAGER_REVIEW

    return review

@app.put("/performance-reviews/{review_id}/manager-assessment")
async def submit_manager_assessment(
    review_id: str,
    assessment: Dict[str, Any],
    overall_rating: int,
    strengths: List[str],
    areas_for_improvement: List[str],
    manager_comments: Optional[str] = None
):
    """Enviar evaluación del manager"""
    if review_id not in performance_reviews:
        raise HTTPException(status_code=404, detail="Review not found")

    review = performance_reviews[review_id]
    review.manager_assessment = assessment
    review.overall_rating = overall_rating
    review.strengths = strengths
    review.areas_for_improvement = areas_for_improvement
    review.manager_comments = manager_comments
    review.status = ReviewStatus.COMPLETED
    review.completed_at = datetime.utcnow()

    return review

# ======================= GOAL ENDPOINTS =======================

@app.post("/goals", response_model=Goal)
async def create_goal(data: GoalCreate):
    """Crear objetivo"""
    if data.employee_id not in employees:
        raise HTTPException(status_code=404, detail="Employee not found")

    goal = Goal(**data.model_dump())
    goals[goal.id] = goal
    return goal

@app.get("/goals", response_model=List[Goal])
async def list_goals(
    employee_id: Optional[str] = None,
    status: Optional[GoalStatus] = None,
    category: Optional[str] = None
):
    """Listar objetivos"""
    result = list(goals.values())

    if employee_id:
        result = [g for g in result if g.employee_id == employee_id]
    if status:
        result = [g for g in result if g.status == status]
    if category:
        result = [g for g in result if g.category == category]

    return result

@app.put("/goals/{goal_id}/progress")
async def update_goal_progress(goal_id: str, progress: int):
    """Actualizar progreso de objetivo"""
    if goal_id not in goals:
        raise HTTPException(status_code=404, detail="Goal not found")

    goal = goals[goal_id]
    goal.progress = min(max(progress, 0), 100)
    goal.updated_at = datetime.utcnow()

    if goal.progress == 100:
        goal.status = GoalStatus.COMPLETED

    return goal

# ======================= TRAINING ENDPOINTS =======================

@app.post("/trainings", response_model=Training)
async def create_training(
    title: str,
    category: str,
    description: Optional[str] = None,
    provider: Optional[str] = None,
    start_date: Optional[date] = None,
    duration_hours: Optional[float] = None,
    is_online: bool = False,
    is_mandatory: bool = False,
    skills_developed: List[str] = []
):
    """Crear capacitación"""
    training = Training(
        title=title,
        category=category,
        description=description,
        provider=provider,
        start_date=start_date,
        duration_hours=duration_hours,
        is_online=is_online,
        is_mandatory=is_mandatory,
        skills_developed=skills_developed
    )
    trainings[training.id] = training
    return training

@app.get("/trainings", response_model=List[Training])
async def list_trainings(
    category: Optional[str] = None,
    is_mandatory: Optional[bool] = None
):
    """Listar capacitaciones"""
    result = list(trainings.values())

    if category:
        result = [t for t in result if t.category == category]
    if is_mandatory is not None:
        result = [t for t in result if t.is_mandatory == is_mandatory]

    return result

@app.post("/trainings/{training_id}/enroll")
async def enroll_in_training(training_id: str, employee_id: str):
    """Inscribir empleado en capacitación"""
    if training_id not in trainings:
        raise HTTPException(status_code=404, detail="Training not found")
    if employee_id not in employees:
        raise HTTPException(status_code=404, detail="Employee not found")

    enrollment = TrainingEnrollment(
        training_id=training_id,
        employee_id=employee_id
    )
    training_enrollments[enrollment.id] = enrollment

    return enrollment

@app.put("/training-enrollments/{enrollment_id}/complete")
async def complete_training(
    enrollment_id: str,
    score: Optional[float] = None,
    certificate_url: Optional[str] = None
):
    """Completar capacitación"""
    if enrollment_id not in training_enrollments:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    enrollment = training_enrollments[enrollment_id]
    enrollment.status = "completed"
    enrollment.completed_at = datetime.utcnow()
    enrollment.score = score
    enrollment.certificate_url = certificate_url

    # Actualizar skills del empleado
    if enrollment.employee_id in employees:
        emp = employees[enrollment.employee_id]
        training = trainings.get(enrollment.training_id)
        if training and training.skills_developed:
            emp.skills = list(set(emp.skills + training.skills_developed))

    return enrollment

# ======================= AI FEATURES =======================

@app.post("/ai/candidate-match")
async def ai_candidate_match(job_id: str):
    """Match de candidatos con IA"""
    if job_id not in job_postings:
        raise HTTPException(status_code=404, detail="Job posting not found")

    job = job_postings[job_id]
    job_candidates = [c for c in candidates.values() if c.job_id == job_id]

    # Recalcular scores
    for candidate in job_candidates:
        candidate.ai_score = calculate_ai_candidate_score(candidate, job)

    # Ordenar por score
    ranked = sorted(job_candidates, key=lambda c: c.ai_score or 0, reverse=True)

    return {
        "job_id": job_id,
        "total_candidates": len(ranked),
        "rankings": [
            {
                "rank": i + 1,
                "candidate_id": c.id,
                "name": f"{c.first_name} {c.last_name}",
                "ai_score": c.ai_score,
                "matching_skills": list(set(s.lower() for s in c.skills) & set(s.lower() for s in job.skills_required)),
                "experience_match": c.experience_years >= (job.experience_years or 0)
            }
            for i, c in enumerate(ranked[:10])
        ]
    }

@app.post("/ai/salary-benchmark")
async def ai_salary_benchmark(
    job_title: str,
    location: str,
    experience_years: int
):
    """Benchmark salarial con IA"""
    import random

    # Simular datos de mercado
    base_salary = 50000 + (experience_years * 5000)
    location_multiplier = {"new york": 1.3, "san francisco": 1.4, "remote": 1.0, "madrid": 0.8}
    multiplier = location_multiplier.get(location.lower(), 1.0)

    market_salary = base_salary * multiplier

    return {
        "job_title": job_title,
        "location": location,
        "experience_years": experience_years,
        "benchmark": {
            "percentile_25": round(market_salary * 0.85),
            "percentile_50": round(market_salary),
            "percentile_75": round(market_salary * 1.15),
            "percentile_90": round(market_salary * 1.3)
        },
        "recommendation": f"Para {job_title} con {experience_years} años de experiencia en {location}, "
                         f"el rango recomendado es ${round(market_salary * 0.9):,} - ${round(market_salary * 1.1):,}",
        "data_sources": ["Glassdoor", "LinkedIn Salary", "PayScale"]
    }

@app.post("/ai/flight-risk")
async def ai_flight_risk_analysis(employee_id: Optional[str] = None):
    """Análisis de riesgo de fuga"""
    import random

    target_employees = list(employees.values())
    if employee_id:
        if employee_id not in employees:
            raise HTTPException(status_code=404, detail="Employee not found")
        target_employees = [employees[employee_id]]

    risk_analysis = []
    for emp in target_employees:
        # Factores de riesgo
        tenure_months = (datetime.utcnow().date() - emp.hire_date).days / 30
        risk_score = 0
        factors = []

        # Tenure corto
        if tenure_months < 12:
            risk_score += 15
            factors.append("Tenure menor a 1 año")
        elif tenure_months > 36:
            risk_score += 10
            factors.append("Posible estancamiento (3+ años)")

        # Sin promoción reciente (simulado)
        if random.random() > 0.7:
            risk_score += 20
            factors.append("Sin promoción en 2+ años")

        # Salario bajo mercado (simulado)
        if random.random() > 0.6:
            risk_score += 25
            factors.append("Salario por debajo del mercado")

        # Baja satisfacción (simulado)
        if random.random() > 0.8:
            risk_score += 30
            factors.append("Indicadores de baja satisfacción")

        risk_level = "high" if risk_score >= 50 else "medium" if risk_score >= 25 else "low"

        risk_analysis.append({
            "employee_id": emp.id,
            "name": f"{emp.first_name} {emp.last_name}",
            "risk_score": min(risk_score, 100),
            "risk_level": risk_level,
            "factors": factors,
            "recommendations": [
                "Programar 1:1 con manager",
                "Revisar compensación",
                "Discutir plan de carrera"
            ][:len(factors)] if factors else []
        })

    return {
        "analysis_date": datetime.utcnow().isoformat(),
        "employees_analyzed": len(risk_analysis),
        "high_risk_count": len([r for r in risk_analysis if r["risk_level"] == "high"]),
        "results": sorted(risk_analysis, key=lambda x: x["risk_score"], reverse=True)
    }

@app.post("/ai/succession-planning")
async def ai_succession_planning(position_id: Optional[str] = None):
    """Planificación de sucesión"""
    import random

    # Simular análisis de sucesión
    key_positions = []
    if position_id and position_id in job_titles:
        key_positions = [job_titles[position_id]]
    else:
        # Obtener posiciones de liderazgo
        key_positions = [jt for jt in job_titles.values() if jt.level >= 7][:5]

    succession_plans = []
    for position in key_positions:
        # Encontrar empleados en departamento
        dept_employees = [e for e in employees.values()
                         if e.department_id == position.department_id and
                         e.job_title_id != position.id]

        potential_successors = []
        for emp in dept_employees[:3]:
            readiness = random.choice(["ready_now", "ready_1_year", "ready_2_years", "development_needed"])
            potential_successors.append({
                "employee_id": emp.id,
                "name": f"{emp.first_name} {emp.last_name}",
                "current_role": job_titles.get(emp.job_title_id, {}).title if emp.job_title_id else "Unknown",
                "readiness": readiness,
                "strengths": ["Leadership", "Technical Skills", "Communication"][:random.randint(1, 3)],
                "development_areas": ["Strategic Thinking", "Executive Presence"][:random.randint(0, 2)],
                "match_score": random.randint(60, 95)
            })

        succession_plans.append({
            "position": position.title,
            "position_id": position.id,
            "department": departments.get(position.department_id, {}).name if position.department_id else None,
            "risk_level": "high" if len(potential_successors) < 2 else "medium" if len(potential_successors) < 3 else "low",
            "potential_successors": sorted(potential_successors, key=lambda x: x["match_score"], reverse=True)
        })

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "positions_analyzed": len(succession_plans),
        "succession_plans": succession_plans
    }

@app.post("/ai/job-description-generator")
async def ai_generate_job_description(
    title: str,
    department: str,
    level: str,  # junior, mid, senior, lead
    key_skills: List[str] = []
):
    """Generar descripción de puesto con IA"""

    templates = {
        "junior": {
            "experience": "0-2 años",
            "education": "Título universitario en campo relacionado",
            "prefix": "Buscamos un/a profesional motivado/a"
        },
        "mid": {
            "experience": "3-5 años",
            "education": "Título universitario, preferiblemente máster",
            "prefix": "Buscamos un/a profesional con experiencia sólida"
        },
        "senior": {
            "experience": "5-8 años",
            "education": "Título universitario, máster valorable",
            "prefix": "Buscamos un/a profesional senior con amplia experiencia"
        },
        "lead": {
            "experience": "8+ años",
            "education": "Título universitario, MBA o máster en gestión valorable",
            "prefix": "Buscamos un/a líder experimentado/a"
        }
    }

    template = templates.get(level, templates["mid"])

    description = f"""
# {title}

## Sobre el rol
{template['prefix']} para unirse a nuestro equipo de {department}. En este rol, serás responsable de [principales responsabilidades].

## Responsabilidades
- Desarrollar y mantener [área principal]
- Colaborar con equipos multifuncionales
- Participar en la mejora continua de procesos
- Mentorizar a miembros junior del equipo (si aplica)
- Contribuir a la cultura de innovación

## Requisitos
- {template['experience']} de experiencia en roles similares
- {template['education']}
- Experiencia con: {', '.join(key_skills) if key_skills else '[tecnologías relevantes]'}
- Excelentes habilidades de comunicación
- Capacidad para trabajar en equipo

## Deseable
- Experiencia en entornos ágiles
- Conocimiento de [herramientas adicionales]
- Certificaciones relevantes

## Ofrecemos
- Salario competitivo
- Trabajo remoto/híbrido
- Plan de desarrollo profesional
- Ambiente de trabajo colaborativo
- Beneficios adicionales
"""

    return {
        "title": title,
        "department": department,
        "level": level,
        "generated_description": description,
        "suggested_skills": key_skills + ["comunicación", "trabajo en equipo", "resolución de problemas"],
        "salary_range_suggestion": {
            "min": 30000 + ({"junior": 0, "mid": 15000, "senior": 30000, "lead": 50000}.get(level, 0)),
            "max": 50000 + ({"junior": 0, "mid": 20000, "senior": 40000, "lead": 70000}.get(level, 0))
        }
    }

@app.post("/ai/interview-questions")
async def ai_generate_interview_questions(
    job_id: str,
    interview_type: str = "behavioral"  # behavioral, technical, cultural
):
    """Generar preguntas de entrevista"""
    if job_id not in job_postings:
        raise HTTPException(status_code=404, detail="Job posting not found")

    job = job_postings[job_id]

    questions_db = {
        "behavioral": [
            {"question": "Cuéntame sobre un proyecto desafiante que hayas liderado.", "competency": "Liderazgo"},
            {"question": "¿Cómo manejas los conflictos en el equipo?", "competency": "Resolución de conflictos"},
            {"question": "Describe una situación donde tuviste que aprender algo nuevo rápidamente.", "competency": "Adaptabilidad"},
            {"question": "¿Cómo priorizas tu trabajo cuando tienes múltiples deadlines?", "competency": "Gestión del tiempo"},
            {"question": "Cuéntame sobre un fracaso y qué aprendiste de él.", "competency": "Resiliencia"}
        ],
        "technical": [
            {"question": f"¿Cuál es tu experiencia con {job.skills_required[0] if job.skills_required else 'las tecnologías requeridas'}?", "competency": "Habilidades técnicas"},
            {"question": "Describe la arquitectura de un sistema que hayas diseñado.", "competency": "Diseño de sistemas"},
            {"question": "¿Cómo abordas el debugging de un problema complejo?", "competency": "Problem solving"},
            {"question": "¿Cuáles son las mejores prácticas que sigues en tu trabajo?", "competency": "Calidad"},
            {"question": "¿Cómo te mantienes actualizado en tu campo?", "competency": "Aprendizaje continuo"}
        ],
        "cultural": [
            {"question": "¿Qué tipo de ambiente de trabajo te permite dar lo mejor de ti?", "competency": "Fit cultural"},
            {"question": "¿Cómo defines el éxito en tu rol?", "competency": "Valores"},
            {"question": "¿Qué te motiva a venir a trabajar cada día?", "competency": "Motivación"},
            {"question": "¿Cómo contribuyes a crear un ambiente positivo de trabajo?", "competency": "Colaboración"},
            {"question": "¿Qué esperas de tu manager ideal?", "competency": "Expectativas"}
        ]
    }

    questions = questions_db.get(interview_type, questions_db["behavioral"])

    return {
        "job_id": job_id,
        "job_title": job.title,
        "interview_type": interview_type,
        "questions": questions,
        "tips": [
            "Usa el método STAR para evaluar respuestas (Situación, Tarea, Acción, Resultado)",
            "Permite tiempo al candidato para pensar",
            "Haz preguntas de seguimiento para profundizar",
            "Toma notas durante la entrevista"
        ]
    }

@app.get("/ai/workforce-analytics")
async def ai_workforce_analytics():
    """Analytics de workforce"""
    total_employees = len([e for e in employees.values() if e.employment_status == EmploymentStatus.ACTIVE])

    # Por departamento
    by_department = {}
    for emp in employees.values():
        if emp.employment_status == EmploymentStatus.ACTIVE and emp.department_id:
            dept = departments.get(emp.department_id)
            dept_name = dept.name if dept else "Unknown"
            by_department[dept_name] = by_department.get(dept_name, 0) + 1

    # Por tipo de empleo
    by_type = {}
    for emp in employees.values():
        if emp.employment_status == EmploymentStatus.ACTIVE:
            by_type[emp.employment_type.value] = by_type.get(emp.employment_type.value, 0) + 1

    # Tenure promedio
    active_employees = [e for e in employees.values() if e.employment_status == EmploymentStatus.ACTIVE]
    avg_tenure = sum((datetime.utcnow().date() - e.hire_date).days for e in active_employees) / len(active_employees) if active_employees else 0

    return {
        "snapshot_date": datetime.utcnow().isoformat(),
        "headcount": {
            "total": total_employees,
            "by_department": by_department,
            "by_employment_type": by_type
        },
        "tenure": {
            "average_days": round(avg_tenure),
            "average_years": round(avg_tenure / 365, 1)
        },
        "diversity": {
            "gender_ratio": "Coming soon",
            "age_distribution": "Coming soon"
        },
        "trends": {
            "hiring_this_month": len([e for e in employees.values() if e.hire_date.month == datetime.utcnow().month]),
            "departures_this_month": len([e for e in employees.values() if e.termination_date and e.termination_date.month == datetime.utcnow().month])
        }
    }

# ======================= REPORTS =======================

@app.get("/reports/headcount")
async def headcount_report(
    as_of_date: Optional[date] = None,
    department_id: Optional[str] = None
):
    """Reporte de headcount"""
    target_date = as_of_date or date.today()

    active = [e for e in employees.values()
              if e.employment_status == EmploymentStatus.ACTIVE and
              e.hire_date <= target_date]

    if department_id:
        active = [e for e in active if e.department_id == department_id]

    return {
        "as_of_date": target_date.isoformat(),
        "total_headcount": len(active),
        "by_department": {
            departments.get(dept_id, Department(id=dept_id, name="Unknown", code="UNK")).name:
            len([e for e in active if e.department_id == dept_id])
            for dept_id in set(e.department_id for e in active if e.department_id)
        },
        "by_location": {
            locations.get(loc_id, Location(id=loc_id, name="Unknown", address="", city="", country="")).name:
            len([e for e in active if e.location_id == loc_id])
            for loc_id in set(e.location_id for e in active if e.location_id)
        }
    }

@app.get("/reports/turnover")
async def turnover_report(year: int, month: Optional[int] = None):
    """Reporte de rotación"""
    departures = [e for e in employees.values()
                  if e.termination_date and e.termination_date.year == year]
    if month:
        departures = [e for e in departures if e.termination_date.month == month]

    active_start = len([e for e in employees.values()
                        if e.hire_date <= date(year, month or 1, 1)])

    turnover_rate = len(departures) / active_start * 100 if active_start > 0 else 0

    return {
        "period": {"year": year, "month": month},
        "departures": len(departures),
        "turnover_rate": round(turnover_rate, 2),
        "by_reason": {
            reason: len([e for e in departures if e.termination_reason == reason])
            for reason in set(e.termination_reason for e in departures if e.termination_reason)
        }
    }

# ======================= ORG CHART =======================

@app.get("/org-chart")
async def get_org_chart(root_id: Optional[str] = None):
    """Obtener organigrama"""
    return get_org_chart(root_id)

# ======================= HEALTH CHECK =======================

@app.get("/health")
async def health_check():
    """Health check del servicio"""
    return {
        "status": "healthy",
        "service": "ai-hr",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/stats")
async def get_stats():
    """Estadísticas del servicio"""
    return {
        "departments": len(departments),
        "locations": len(locations),
        "employees": len(employees),
        "active_employees": len([e for e in employees.values() if e.employment_status == EmploymentStatus.ACTIVE]),
        "job_postings": len(job_postings),
        "open_positions": len([j for j in job_postings.values() if j.status == JobStatus.OPEN]),
        "candidates": len(candidates),
        "interviews": len(interviews),
        "pending_leave_requests": len([l for l in leave_requests.values() if l.status == LeaveStatus.PENDING]),
        "trainings": len(trainings),
        "goals": len(goals)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8017)

"""
AI-Forms Service: Intelligent form builder with AI-powered features.

Features:
- Drag-and-drop form builder
- Multiple question types
- Conditional logic
- Form templates
- Response collection
- Analytics and reports
- AI form generation
- Smart validation
- Response analysis
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timedelta
from enum import Enum
import uuid

app = FastAPI(
    title="AI-Forms Service",
    description="Intelligent form builder with AI capabilities",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== Enums ==============

class QuestionType(str, Enum):
    SHORT_TEXT = "short_text"
    LONG_TEXT = "long_text"
    EMAIL = "email"
    NUMBER = "number"
    PHONE = "phone"
    URL = "url"
    DATE = "date"
    TIME = "time"
    DATETIME = "datetime"
    SINGLE_CHOICE = "single_choice"  # Radio buttons
    MULTIPLE_CHOICE = "multiple_choice"  # Checkboxes
    DROPDOWN = "dropdown"
    LINEAR_SCALE = "linear_scale"
    RATING = "rating"
    MATRIX = "matrix"
    FILE_UPLOAD = "file_upload"
    SIGNATURE = "signature"
    SECTION = "section"  # Section divider
    DESCRIPTION = "description"  # Text block

class FormStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"
    ARCHIVED = "archived"

class LogicOperator(str, Enum):
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    CONTAINS = "contains"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    IS_EMPTY = "is_empty"
    IS_NOT_EMPTY = "is_not_empty"

class LogicAction(str, Enum):
    SHOW = "show"
    HIDE = "hide"
    SKIP_TO = "skip_to"
    END_FORM = "end_form"

class ValidationRule(str, Enum):
    REQUIRED = "required"
    MIN_LENGTH = "min_length"
    MAX_LENGTH = "max_length"
    MIN_VALUE = "min_value"
    MAX_VALUE = "max_value"
    PATTERN = "pattern"
    MIN_SELECTIONS = "min_selections"
    MAX_SELECTIONS = "max_selections"
    MAX_FILE_SIZE = "max_file_size"
    ALLOWED_FILE_TYPES = "allowed_file_types"

# ============== Models ==============

class Choice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    value: Optional[str] = None
    image_url: Optional[str] = None
    is_other: bool = False  # "Other" option with text input

class MatrixRow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str

class MatrixColumn(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str

class Validation(BaseModel):
    rule: ValidationRule
    value: Optional[Any] = None
    message: Optional[str] = None

class ConditionalLogic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_question_id: str
    operator: LogicOperator
    value: Any
    action: LogicAction
    target_question_id: Optional[str] = None  # For show/hide/skip_to

class QuestionSettings(BaseModel):
    placeholder: Optional[str] = None
    default_value: Optional[Any] = None
    description: Optional[str] = None
    # Choice settings
    randomize_choices: bool = False
    include_other: bool = False
    # Scale settings
    scale_min: int = 1
    scale_max: int = 5
    scale_min_label: Optional[str] = None
    scale_max_label: Optional[str] = None
    # File settings
    allowed_file_types: Optional[List[str]] = None
    max_file_size_mb: int = 10
    max_files: int = 1
    # Display settings
    show_question_number: bool = True
    image_url: Optional[str] = None
    video_url: Optional[str] = None

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    form_id: str
    type: QuestionType
    title: str
    description: Optional[str] = None
    is_required: bool = False
    choices: Optional[List[Choice]] = None
    matrix_rows: Optional[List[MatrixRow]] = None
    matrix_columns: Optional[List[MatrixColumn]] = None
    validations: List[Validation] = []
    logic: List[ConditionalLogic] = []
    settings: QuestionSettings = QuestionSettings()
    order: int = 0
    section_id: Optional[str] = None

class FormSection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    form_id: str
    title: str
    description: Optional[str] = None
    order: int = 0

class FormSettings(BaseModel):
    # Access
    require_login: bool = False
    collect_email: bool = False
    limit_responses: Optional[int] = None
    one_response_per_user: bool = False
    # Display
    show_progress_bar: bool = True
    shuffle_questions: bool = False
    show_question_numbers: bool = True
    # After submission
    confirmation_message: str = "Thank you for your response!"
    redirect_url: Optional[str] = None
    allow_response_editing: bool = False
    # Notification
    notify_on_response: bool = False
    notification_emails: List[str] = []
    # Scheduling
    open_date: Optional[datetime] = None
    close_date: Optional[datetime] = None
    # Branding
    logo_url: Optional[str] = None
    header_image_url: Optional[str] = None
    theme_color: str = "#1a73e8"
    background_color: str = "#ffffff"
    font_family: str = "default"

class FormCreate(BaseModel):
    title: str
    description: Optional[str] = None
    settings: Optional[FormSettings] = None
    is_template: bool = False
    template_id: Optional[str] = None  # Create from template

class Form(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    owner_id: str
    title: str
    description: Optional[str] = None
    status: FormStatus = FormStatus.DRAFT
    settings: FormSettings = FormSettings()
    is_template: bool = False
    response_count: int = 0
    view_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None
    share_url: Optional[str] = None
    # AI fields
    ai_generated: bool = False
    ai_suggested_improvements: Optional[List[str]] = None

class Answer(BaseModel):
    question_id: str
    value: Any  # Can be string, number, list, dict depending on question type

class ResponseCreate(BaseModel):
    answers: List[Answer]
    respondent_email: Optional[EmailStr] = None

class FormResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    form_id: str
    respondent_id: Optional[str] = None
    respondent_email: Optional[EmailStr] = None
    answers: Dict[str, Any] = {}  # question_id -> answer
    is_complete: bool = True
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    duration_seconds: Optional[int] = None

# ============== AI Models ==============

class AIFormGenerateRequest(BaseModel):
    description: str
    purpose: str  # survey, feedback, registration, quiz, etc.
    target_audience: Optional[str] = None
    question_count: int = 10
    include_sections: bool = True

class AIQuestionSuggestion(BaseModel):
    question: Question
    reasoning: str
    alternative_phrasings: List[str]

class AIAnalysisResult(BaseModel):
    summary: str
    key_insights: List[str]
    sentiment_analysis: Dict[str, float]
    trends: List[Dict[str, Any]]
    recommendations: List[str]

# ============== Storage (in-memory for demo) ==============

forms_db: Dict[str, Form] = {}
questions_db: Dict[str, Question] = {}
sections_db: Dict[str, FormSection] = {}
responses_db: Dict[str, FormResponse] = {}
templates_db: Dict[str, Form] = {}

# ============== Helper Functions ==============

def get_form(form_id: str) -> Form:
    if form_id not in forms_db:
        raise HTTPException(status_code=404, detail="Form not found")
    return forms_db[form_id]

def get_question(question_id: str) -> Question:
    if question_id not in questions_db:
        raise HTTPException(status_code=404, detail="Question not found")
    return questions_db[question_id]

def validate_answer(question: Question, answer: Any) -> List[str]:
    """Validate an answer against question validations."""
    errors = []

    # Required check
    if question.is_required:
        if answer is None or answer == "" or answer == []:
            errors.append(f"'{question.title}' is required")
            return errors

    if answer is None:
        return errors

    # Type-specific validations
    for validation in question.validations:
        if validation.rule == ValidationRule.MIN_LENGTH:
            if isinstance(answer, str) and len(answer) < validation.value:
                errors.append(validation.message or f"Minimum {validation.value} characters required")

        elif validation.rule == ValidationRule.MAX_LENGTH:
            if isinstance(answer, str) and len(answer) > validation.value:
                errors.append(validation.message or f"Maximum {validation.value} characters allowed")

        elif validation.rule == ValidationRule.MIN_VALUE:
            if isinstance(answer, (int, float)) and answer < validation.value:
                errors.append(validation.message or f"Minimum value is {validation.value}")

        elif validation.rule == ValidationRule.MAX_VALUE:
            if isinstance(answer, (int, float)) and answer > validation.value:
                errors.append(validation.message or f"Maximum value is {validation.value}")

        elif validation.rule == ValidationRule.MIN_SELECTIONS:
            if isinstance(answer, list) and len(answer) < validation.value:
                errors.append(validation.message or f"Select at least {validation.value} options")

        elif validation.rule == ValidationRule.MAX_SELECTIONS:
            if isinstance(answer, list) and len(answer) > validation.value:
                errors.append(validation.message or f"Select at most {validation.value} options")

    return errors

def calculate_response_stats(form_id: str) -> Dict[str, Any]:
    """Calculate response statistics for a form."""
    responses = [r for r in responses_db.values() if r.form_id == form_id]
    questions = [q for q in questions_db.values() if q.form_id == form_id]

    stats = {
        "total_responses": len(responses),
        "completion_rate": 100.0,
        "average_duration_seconds": 0,
        "question_stats": {},
    }

    if not responses:
        return stats

    # Average duration
    durations = [r.duration_seconds for r in responses if r.duration_seconds]
    if durations:
        stats["average_duration_seconds"] = sum(durations) / len(durations)

    # Per-question stats
    for question in questions:
        q_stats = {
            "question_id": question.id,
            "title": question.title,
            "type": question.type,
            "response_count": 0,
            "skip_count": 0,
        }

        answers = [r.answers.get(question.id) for r in responses]
        answers = [a for a in answers if a is not None]
        q_stats["response_count"] = len(answers)
        q_stats["skip_count"] = len(responses) - len(answers)

        if question.type in [QuestionType.SINGLE_CHOICE, QuestionType.DROPDOWN]:
            # Count each choice
            choice_counts = {}
            for a in answers:
                choice_counts[a] = choice_counts.get(a, 0) + 1
            q_stats["choice_distribution"] = choice_counts

        elif question.type == QuestionType.MULTIPLE_CHOICE:
            choice_counts = {}
            for a in answers:
                if isinstance(a, list):
                    for choice in a:
                        choice_counts[choice] = choice_counts.get(choice, 0) + 1
            q_stats["choice_distribution"] = choice_counts

        elif question.type in [QuestionType.LINEAR_SCALE, QuestionType.RATING, QuestionType.NUMBER]:
            numeric_answers = [a for a in answers if isinstance(a, (int, float))]
            if numeric_answers:
                q_stats["average"] = sum(numeric_answers) / len(numeric_answers)
                q_stats["min"] = min(numeric_answers)
                q_stats["max"] = max(numeric_answers)

        elif question.type in [QuestionType.SHORT_TEXT, QuestionType.LONG_TEXT]:
            text_answers = [a for a in answers if isinstance(a, str)]
            if text_answers:
                q_stats["average_length"] = sum(len(a) for a in text_answers) / len(text_answers)

        stats["question_stats"][question.id] = q_stats

    return stats

# ============== Form Endpoints ==============

@app.post("/forms", response_model=Form)
async def create_form(workspace_id: str, user_id: str, form_data: FormCreate):
    """Create a new form."""
    form = Form(
        workspace_id=workspace_id,
        owner_id=user_id,
        title=form_data.title,
        description=form_data.description,
        settings=form_data.settings or FormSettings(),
        is_template=form_data.is_template,
    )

    # If creating from template
    if form_data.template_id and form_data.template_id in templates_db:
        template = templates_db[form_data.template_id]
        template_questions = [q for q in questions_db.values() if q.form_id == template.id]

        for q in template_questions:
            new_q = q.model_copy()
            new_q.id = str(uuid.uuid4())
            new_q.form_id = form.id
            questions_db[new_q.id] = new_q

    forms_db[form.id] = form

    if form.is_template:
        templates_db[form.id] = form

    return form

@app.get("/forms", response_model=List[Form])
async def list_forms(
    workspace_id: str,
    user_id: str,
    status: Optional[FormStatus] = None,
    include_templates: bool = False,
):
    """List forms in a workspace."""
    forms = [f for f in forms_db.values()
             if f.workspace_id == workspace_id
             and f.owner_id == user_id]

    if status:
        forms = [f for f in forms if f.status == status]

    if not include_templates:
        forms = [f for f in forms if not f.is_template]

    return forms

@app.get("/forms/{form_id}", response_model=Form)
async def get_form_details(form_id: str):
    """Get form details."""
    return get_form(form_id)

@app.put("/forms/{form_id}", response_model=Form)
async def update_form(
    form_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    settings: Optional[FormSettings] = None,
):
    """Update a form."""
    form = get_form(form_id)

    if title:
        form.title = title
    if description is not None:
        form.description = description
    if settings:
        form.settings = settings

    form.updated_at = datetime.utcnow()
    return form

@app.post("/forms/{form_id}/publish")
async def publish_form(form_id: str):
    """Publish a form to accept responses."""
    form = get_form(form_id)

    questions = [q for q in questions_db.values() if q.form_id == form_id]
    if not questions:
        raise HTTPException(status_code=400, detail="Form must have at least one question")

    form.status = FormStatus.PUBLISHED
    form.published_at = datetime.utcnow()
    form.share_url = f"/forms/{form_id}/respond"

    return {"message": "Form published", "share_url": form.share_url}

@app.post("/forms/{form_id}/close")
async def close_form(form_id: str):
    """Close form to stop accepting responses."""
    form = get_form(form_id)
    form.status = FormStatus.CLOSED
    return {"message": "Form closed"}

@app.post("/forms/{form_id}/duplicate", response_model=Form)
async def duplicate_form(form_id: str, user_id: str):
    """Duplicate a form."""
    original = get_form(form_id)

    new_form = original.model_copy()
    new_form.id = str(uuid.uuid4())
    new_form.title = f"{original.title} (Copy)"
    new_form.status = FormStatus.DRAFT
    new_form.response_count = 0
    new_form.view_count = 0
    new_form.created_at = datetime.utcnow()
    new_form.updated_at = datetime.utcnow()
    new_form.published_at = None
    new_form.share_url = None
    new_form.owner_id = user_id

    forms_db[new_form.id] = new_form

    # Duplicate questions
    original_questions = [q for q in questions_db.values() if q.form_id == form_id]
    for q in original_questions:
        new_q = q.model_copy()
        new_q.id = str(uuid.uuid4())
        new_q.form_id = new_form.id
        questions_db[new_q.id] = new_q

    return new_form

@app.delete("/forms/{form_id}")
async def delete_form(form_id: str):
    """Delete a form."""
    form = get_form(form_id)

    # Delete questions
    questions_to_delete = [q.id for q in questions_db.values() if q.form_id == form_id]
    for q_id in questions_to_delete:
        del questions_db[q_id]

    # Delete responses
    responses_to_delete = [r.id for r in responses_db.values() if r.form_id == form_id]
    for r_id in responses_to_delete:
        del responses_db[r_id]

    del forms_db[form_id]

    if form_id in templates_db:
        del templates_db[form_id]

    return {"message": "Form deleted"}

# ============== Question Endpoints ==============

@app.post("/questions", response_model=Question)
async def create_question(
    form_id: str,
    type: QuestionType,
    title: str,
    description: Optional[str] = None,
    is_required: bool = False,
    choices: Optional[List[Choice]] = None,
    settings: Optional[QuestionSettings] = None,
):
    """Create a new question."""
    form = get_form(form_id)

    existing_questions = [q for q in questions_db.values() if q.form_id == form_id]
    order = len(existing_questions)

    question = Question(
        form_id=form_id,
        type=type,
        title=title,
        description=description,
        is_required=is_required,
        choices=choices,
        settings=settings or QuestionSettings(),
        order=order,
    )
    questions_db[question.id] = question

    form.updated_at = datetime.utcnow()

    return question

@app.get("/forms/{form_id}/questions", response_model=List[Question])
async def list_questions(form_id: str):
    """List questions in a form."""
    questions = [q for q in questions_db.values() if q.form_id == form_id]
    questions.sort(key=lambda x: x.order)
    return questions

@app.put("/questions/{question_id}", response_model=Question)
async def update_question(
    question_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    is_required: Optional[bool] = None,
    choices: Optional[List[Choice]] = None,
    validations: Optional[List[Validation]] = None,
    settings: Optional[QuestionSettings] = None,
    order: Optional[int] = None,
):
    """Update a question."""
    question = get_question(question_id)

    if title:
        question.title = title
    if description is not None:
        question.description = description
    if is_required is not None:
        question.is_required = is_required
    if choices is not None:
        question.choices = choices
    if validations is not None:
        question.validations = validations
    if settings:
        question.settings = settings
    if order is not None:
        question.order = order

    form = forms_db.get(question.form_id)
    if form:
        form.updated_at = datetime.utcnow()

    return question

@app.delete("/questions/{question_id}")
async def delete_question(question_id: str):
    """Delete a question."""
    question = get_question(question_id)

    form = forms_db.get(question.form_id)
    if form:
        form.updated_at = datetime.utcnow()

    del questions_db[question_id]
    return {"message": "Question deleted"}

@app.post("/questions/{question_id}/logic")
async def add_conditional_logic(
    question_id: str,
    source_question_id: str,
    operator: LogicOperator,
    value: Any,
    action: LogicAction,
    target_question_id: Optional[str] = None,
):
    """Add conditional logic to a question."""
    question = get_question(question_id)

    logic = ConditionalLogic(
        source_question_id=source_question_id,
        operator=operator,
        value=value,
        action=action,
        target_question_id=target_question_id,
    )
    question.logic.append(logic)

    return {"message": "Logic added"}

@app.post("/questions/reorder")
async def reorder_questions(form_id: str, question_orders: Dict[str, int]):
    """Reorder questions in a form."""
    for q_id, order in question_orders.items():
        if q_id in questions_db:
            questions_db[q_id].order = order

    return {"message": "Questions reordered"}

# ============== Response Endpoints ==============

@app.post("/forms/{form_id}/respond", response_model=FormResponse)
async def submit_response(
    form_id: str,
    response_data: ResponseCreate,
    respondent_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """Submit a form response."""
    form = get_form(form_id)

    if form.status != FormStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Form is not accepting responses")

    # Check open/close dates
    now = datetime.utcnow()
    if form.settings.open_date and now < form.settings.open_date:
        raise HTTPException(status_code=400, detail="Form is not open yet")
    if form.settings.close_date and now > form.settings.close_date:
        raise HTTPException(status_code=400, detail="Form is closed")

    # Check response limit
    if form.settings.limit_responses:
        if form.response_count >= form.settings.limit_responses:
            raise HTTPException(status_code=400, detail="Response limit reached")

    # Check one response per user
    if form.settings.one_response_per_user and respondent_id:
        existing = [r for r in responses_db.values()
                    if r.form_id == form_id and r.respondent_id == respondent_id]
        if existing:
            raise HTTPException(status_code=400, detail="You have already responded")

    # Validate answers
    questions = {q.id: q for q in questions_db.values() if q.form_id == form_id}
    answers_dict = {}
    all_errors = []

    for answer in response_data.answers:
        question = questions.get(answer.question_id)
        if not question:
            continue

        errors = validate_answer(question, answer.value)
        if errors:
            all_errors.extend(errors)

        answers_dict[answer.question_id] = answer.value

    # Check required questions
    for q_id, question in questions.items():
        if question.is_required and q_id not in answers_dict:
            all_errors.append(f"'{question.title}' is required")

    if all_errors:
        raise HTTPException(status_code=400, detail={"errors": all_errors})

    # Create response
    response = FormResponse(
        form_id=form_id,
        respondent_id=respondent_id,
        respondent_email=response_data.respondent_email,
        answers=answers_dict,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    responses_db[response.id] = response

    # Update form stats
    form.response_count += 1

    return response

@app.get("/forms/{form_id}/responses", response_model=List[FormResponse])
async def list_responses(
    form_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    after: Optional[datetime] = None,
    before: Optional[datetime] = None,
):
    """List responses for a form."""
    get_form(form_id)

    responses = [r for r in responses_db.values() if r.form_id == form_id]

    if after:
        responses = [r for r in responses if r.submitted_at > after]
    if before:
        responses = [r for r in responses if r.submitted_at < before]

    responses.sort(key=lambda x: x.submitted_at, reverse=True)

    start = (page - 1) * page_size
    end = start + page_size

    return responses[start:end]

@app.get("/responses/{response_id}", response_model=FormResponse)
async def get_response_details(response_id: str):
    """Get response details."""
    if response_id not in responses_db:
        raise HTTPException(status_code=404, detail="Response not found")
    return responses_db[response_id]

@app.delete("/responses/{response_id}")
async def delete_response(response_id: str):
    """Delete a response."""
    if response_id not in responses_db:
        raise HTTPException(status_code=404, detail="Response not found")

    response = responses_db[response_id]
    form = forms_db.get(response.form_id)
    if form:
        form.response_count = max(0, form.response_count - 1)

    del responses_db[response_id]
    return {"message": "Response deleted"}

# ============== Analytics Endpoints ==============

@app.get("/forms/{form_id}/stats")
async def get_form_stats(form_id: str):
    """Get form statistics."""
    get_form(form_id)
    return calculate_response_stats(form_id)

@app.get("/forms/{form_id}/export")
async def export_responses(form_id: str, format: str = "json"):
    """Export form responses."""
    form = get_form(form_id)
    responses = [r for r in responses_db.values() if r.form_id == form_id]
    questions = [q for q in questions_db.values() if q.form_id == form_id]
    questions.sort(key=lambda x: x.order)

    if format == "json":
        return {
            "form": form.model_dump(),
            "questions": [q.model_dump() for q in questions],
            "responses": [r.model_dump() for r in responses],
        }
    elif format == "csv":
        # Generate CSV format
        headers = ["Response ID", "Submitted At"]
        headers.extend([q.title for q in questions])

        rows = []
        for r in responses:
            row = [r.id, r.submitted_at.isoformat()]
            for q in questions:
                answer = r.answers.get(q.id, "")
                if isinstance(answer, list):
                    answer = "; ".join(str(a) for a in answer)
                row.append(str(answer))
            rows.append(row)

        return {
            "headers": headers,
            "rows": rows,
        }

    raise HTTPException(status_code=400, detail="Invalid format")

# ============== Template Endpoints ==============

@app.get("/templates", response_model=List[Form])
async def list_templates(category: Optional[str] = None):
    """List available form templates."""
    templates = list(templates_db.values())
    return templates

@app.post("/forms/{form_id}/save-as-template", response_model=Form)
async def save_as_template(form_id: str, name: str, description: Optional[str] = None):
    """Save a form as a template."""
    original = get_form(form_id)

    template = original.model_copy()
    template.id = str(uuid.uuid4())
    template.title = name
    template.description = description
    template.is_template = True
    template.status = FormStatus.DRAFT
    template.response_count = 0
    template.created_at = datetime.utcnow()

    templates_db[template.id] = template
    forms_db[template.id] = template

    # Copy questions
    original_questions = [q for q in questions_db.values() if q.form_id == form_id]
    for q in original_questions:
        new_q = q.model_copy()
        new_q.id = str(uuid.uuid4())
        new_q.form_id = template.id
        questions_db[new_q.id] = new_q

    return template

# ============== AI Features ==============

@app.post("/ai/generate-form", response_model=Form)
async def ai_generate_form(workspace_id: str, user_id: str, request: AIFormGenerateRequest):
    """AI-powered form generation."""
    # In real implementation, use LLM to generate form structure

    form = Form(
        workspace_id=workspace_id,
        owner_id=user_id,
        title=f"Form: {request.description[:50]}",
        description=request.description,
        ai_generated=True,
    )
    forms_db[form.id] = form

    # Generate sample questions based on purpose
    question_templates = {
        "survey": [
            (QuestionType.LINEAR_SCALE, "How satisfied are you with our service?", True),
            (QuestionType.LONG_TEXT, "What could we improve?", False),
            (QuestionType.SINGLE_CHOICE, "Would you recommend us?", True),
        ],
        "feedback": [
            (QuestionType.RATING, "Overall Rating", True),
            (QuestionType.LONG_TEXT, "What did you like most?", False),
            (QuestionType.LONG_TEXT, "What could be improved?", False),
        ],
        "registration": [
            (QuestionType.SHORT_TEXT, "Full Name", True),
            (QuestionType.EMAIL, "Email Address", True),
            (QuestionType.PHONE, "Phone Number", False),
        ],
        "quiz": [
            (QuestionType.SINGLE_CHOICE, "Question 1", True),
            (QuestionType.MULTIPLE_CHOICE, "Question 2 (Select all that apply)", True),
            (QuestionType.SHORT_TEXT, "Question 3 (Short answer)", True),
        ],
    }

    templates = question_templates.get(request.purpose, question_templates["survey"])

    for i, (q_type, title, required) in enumerate(templates[:request.question_count]):
        choices = None
        if q_type in [QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE]:
            choices = [
                Choice(label="Option 1"),
                Choice(label="Option 2"),
                Choice(label="Option 3"),
            ]

        question = Question(
            form_id=form.id,
            type=q_type,
            title=title,
            is_required=required,
            choices=choices,
            order=i,
        )
        questions_db[question.id] = question

    return form

@app.post("/ai/suggest-questions", response_model=List[AIQuestionSuggestion])
async def ai_suggest_questions(
    form_id: str,
    context: Optional[str] = None,
    count: int = 5,
):
    """AI-powered question suggestions."""
    form = get_form(form_id)
    existing_questions = [q for q in questions_db.values() if q.form_id == form_id]

    # In real implementation, use LLM
    suggestions = []

    sample_questions = [
        ("How did you hear about us?", QuestionType.SINGLE_CHOICE),
        ("Rate your experience from 1-10", QuestionType.LINEAR_SCALE),
        ("Any additional comments?", QuestionType.LONG_TEXT),
        ("Would you use our service again?", QuestionType.SINGLE_CHOICE),
        ("What features would you like to see?", QuestionType.MULTIPLE_CHOICE),
    ]

    for title, q_type in sample_questions[:count]:
        choices = None
        if q_type == QuestionType.SINGLE_CHOICE:
            choices = [
                Choice(label="Yes"),
                Choice(label="No"),
                Choice(label="Maybe"),
            ]

        question = Question(
            form_id=form_id,
            type=q_type,
            title=title,
            choices=choices,
            order=len(existing_questions),
        )

        suggestions.append(AIQuestionSuggestion(
            question=question,
            reasoning="Suggested based on form context and common patterns",
            alternative_phrasings=[
                f"Alternative 1: {title}",
                f"Alternative 2: {title}",
            ],
        ))

    return suggestions

@app.post("/ai/analyze-responses", response_model=AIAnalysisResult)
async def ai_analyze_responses(form_id: str):
    """AI-powered response analysis."""
    form = get_form(form_id)
    responses = [r for r in responses_db.values() if r.form_id == form_id]

    if not responses:
        raise HTTPException(status_code=400, detail="No responses to analyze")

    # In real implementation, use LLM for analysis
    return AIAnalysisResult(
        summary=f"Analysis of {len(responses)} responses to '{form.title}'",
        key_insights=[
            "Most respondents are satisfied with the service",
            "There's strong interest in feature X",
            "Response time peaks on weekdays",
        ],
        sentiment_analysis={
            "positive": 0.65,
            "neutral": 0.25,
            "negative": 0.10,
        },
        trends=[
            {"trend": "Increasing satisfaction", "confidence": 0.8},
            {"trend": "Growing interest in mobile features", "confidence": 0.7},
        ],
        recommendations=[
            "Focus on improving the mobile experience",
            "Consider adding a feedback loop for negative responses",
            "Schedule surveys for mid-week for better response rates",
        ],
    )

@app.post("/ai/improve-questions")
async def ai_improve_questions(form_id: str):
    """AI-powered question improvement suggestions."""
    form = get_form(form_id)
    questions = [q for q in questions_db.values() if q.form_id == form_id]

    improvements = []
    for q in questions:
        # In real implementation, use LLM
        improvements.append({
            "question_id": q.id,
            "original_title": q.title,
            "suggestions": [
                "Consider making the question more specific",
                "Add a 'Not applicable' option" if q.choices else "Consider limiting response length",
            ],
            "improved_title": f"[Improved] {q.title}",
        })

    form.ai_suggested_improvements = [imp["improved_title"] for imp in improvements]

    return {
        "form_id": form_id,
        "improvements": improvements,
    }

@app.post("/ai/predict-completion")
async def ai_predict_completion_rate(form_id: str):
    """Predict form completion rate."""
    form = get_form(form_id)
    questions = [q for q in questions_db.values() if q.form_id == form_id]

    # Factors affecting completion
    question_count = len(questions)
    required_count = len([q for q in questions if q.is_required])
    has_long_text = any(q.type == QuestionType.LONG_TEXT for q in questions)

    # Simple prediction model
    base_rate = 0.9
    base_rate -= question_count * 0.02  # Each question reduces rate
    base_rate -= required_count * 0.01
    if has_long_text:
        base_rate -= 0.1

    predicted_rate = max(0.3, min(1.0, base_rate))

    return {
        "form_id": form_id,
        "predicted_completion_rate": predicted_rate,
        "factors": {
            "question_count": question_count,
            "required_questions": required_count,
            "has_long_text_questions": has_long_text,
        },
        "recommendations": [
            "Reduce the number of required questions" if required_count > 5 else None,
            "Consider making long text questions optional" if has_long_text else None,
            "Add progress indicator to improve completion" if question_count > 10 else None,
        ],
    }

# ============== Statistics ==============

@app.get("/stats/workspace/{workspace_id}")
async def get_workspace_form_stats(workspace_id: str):
    """Get form statistics for a workspace."""
    forms = [f for f in forms_db.values() if f.workspace_id == workspace_id]
    responses = [r for r in responses_db.values()
                 if r.form_id in [f.id for f in forms]]

    return {
        "total_forms": len(forms),
        "published_forms": len([f for f in forms if f.status == FormStatus.PUBLISHED]),
        "total_responses": len(responses),
        "responses_today": len([r for r in responses
                                if r.submitted_at.date() == datetime.utcnow().date()]),
        "forms_by_status": {
            status.value: len([f for f in forms if f.status == status])
            for status in FormStatus
        },
    }

# ============== Health Check ==============

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-forms",
        "version": "1.0.0",
        "forms": len(forms_db),
        "responses": len(responses_db),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8011)

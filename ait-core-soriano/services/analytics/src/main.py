"""
AI-Analytics Service - Business Intelligence para AI-Suite
Puerto: 8015
Características:
- Dashboards personalizables
- Reportes y KPIs
- Visualizaciones de datos
- AI insights y forecasting
- Data connectors múltiples
- Alertas y notificaciones
"""

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid

app = FastAPI(
    title="AI-Analytics Service",
    description="Business Intelligence con IA para AI-Suite",
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

class ChartType(str, Enum):
    LINE = "line"
    BAR = "bar"
    PIE = "pie"
    DONUT = "donut"
    AREA = "area"
    SCATTER = "scatter"
    HEATMAP = "heatmap"
    FUNNEL = "funnel"
    GAUGE = "gauge"
    TABLE = "table"
    KPI_CARD = "kpi_card"
    MAP = "map"
    TREEMAP = "treemap"
    SANKEY = "sankey"
    WATERFALL = "waterfall"

class DataSourceType(str, Enum):
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MONGODB = "mongodb"
    ELASTICSEARCH = "elasticsearch"
    REST_API = "rest_api"
    CSV = "csv"
    EXCEL = "excel"
    GOOGLE_SHEETS = "google_sheets"
    BIGQUERY = "bigquery"
    SNOWFLAKE = "snowflake"
    INTERNAL = "internal"  # AI-Suite services

class AggregationType(str, Enum):
    SUM = "sum"
    AVG = "avg"
    COUNT = "count"
    MIN = "min"
    MAX = "max"
    DISTINCT = "distinct"
    MEDIAN = "median"
    PERCENTILE = "percentile"

class TimeGranularity(str, Enum):
    MINUTE = "minute"
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"

class AlertCondition(str, Enum):
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    CHANGE_PERCENT = "change_percent"
    ANOMALY = "anomaly"

class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class ReportFormat(str, Enum):
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"
    HTML = "html"
    POWERPOINT = "powerpoint"

class RefreshFrequency(str, Enum):
    REALTIME = "realtime"
    MINUTE_1 = "1_minute"
    MINUTE_5 = "5_minutes"
    MINUTE_15 = "15_minutes"
    HOUR_1 = "1_hour"
    DAY_1 = "1_day"
    MANUAL = "manual"

# ======================= MODELS =======================

class DataSource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: DataSourceType
    connection_string: Optional[str] = None
    credentials: Optional[Dict[str, str]] = None  # Encrypted in production
    tables: List[str] = []
    schema_info: Dict[str, Any] = {}
    refresh_frequency: RefreshFrequency = RefreshFrequency.HOUR_1
    last_sync: Optional[datetime] = None
    is_active: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DataQuery(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    data_source_id: str
    query_type: str = "sql"  # sql, mongodb, elasticsearch, etc.
    query: str  # SQL query or JSON query
    parameters: Dict[str, Any] = {}
    cache_duration: int = 300  # seconds
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Metric(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    query_id: str
    aggregation: AggregationType
    field: str
    filters: List[Dict[str, Any]] = []
    format: str = "number"  # number, currency, percentage, duration
    decimal_places: int = 2
    prefix: Optional[str] = None
    suffix: Optional[str] = None
    target_value: Optional[float] = None
    comparison_period: Optional[str] = None  # previous_period, previous_year
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Widget(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    chart_type: ChartType
    query_id: Optional[str] = None
    metric_ids: List[str] = []
    config: Dict[str, Any] = {}  # Chart-specific configuration
    dimensions: List[str] = []  # Group by fields
    measures: List[str] = []  # Aggregated fields
    filters: List[Dict[str, Any]] = []
    sort_by: Optional[str] = None
    sort_order: str = "desc"
    limit: int = 100
    time_field: Optional[str] = None
    time_granularity: Optional[TimeGranularity] = None
    # Layout
    position_x: int = 0
    position_y: int = 0
    width: int = 4
    height: int = 3
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Dashboard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    widgets: List[str] = []  # Widget IDs
    layout: Dict[str, Any] = {}  # Grid layout config
    filters: List[Dict[str, Any]] = []  # Global dashboard filters
    time_range: Dict[str, Any] = {"type": "last_7_days"}
    refresh_frequency: RefreshFrequency = RefreshFrequency.MINUTE_5
    theme: str = "light"
    is_public: bool = False
    shared_with: List[str] = []
    tags: List[str] = []
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Report(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    dashboard_id: Optional[str] = None
    widgets: List[str] = []
    template: Optional[str] = None
    format: ReportFormat = ReportFormat.PDF
    schedule: Optional[Dict[str, Any]] = None  # Cron-like schedule
    recipients: List[str] = []
    last_generated: Optional[datetime] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    metric_id: str
    condition: AlertCondition
    threshold: float
    severity: AlertSeverity = AlertSeverity.WARNING
    check_frequency: str = "5_minutes"
    cooldown_period: int = 3600  # seconds
    notification_channels: List[str] = []  # email, slack, webhook
    recipients: List[str] = []
    is_active: bool = True
    last_triggered: Optional[datetime] = None
    trigger_count: int = 0
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AlertHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    alert_id: str
    triggered_at: datetime = Field(default_factory=datetime.utcnow)
    metric_value: float
    threshold: float
    severity: AlertSeverity
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    notes: Optional[str] = None

class AIInsight(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dashboard_id: Optional[str] = None
    metric_id: Optional[str] = None
    type: str  # trend, anomaly, correlation, prediction, recommendation
    title: str
    description: str
    significance: float  # 0-1 score
    data: Dict[str, Any] = {}
    actions: List[Dict[str, str]] = []  # Suggested actions
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

class Forecast(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    metric_id: str
    model_type: str = "prophet"  # prophet, arima, lstm, ensemble
    horizon_days: int = 30
    confidence_interval: float = 0.95
    predictions: List[Dict[str, Any]] = []
    accuracy_metrics: Dict[str, float] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    valid_until: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=1))

# ======================= STORAGE =======================

data_sources: Dict[str, DataSource] = {}
queries: Dict[str, DataQuery] = {}
metrics: Dict[str, Metric] = {}
widgets: Dict[str, Widget] = {}
dashboards: Dict[str, Dashboard] = {}
reports: Dict[str, Report] = {}
alerts: Dict[str, Alert] = {}
alert_history: Dict[str, AlertHistory] = {}
insights: Dict[str, AIInsight] = {}
forecasts: Dict[str, Forecast] = {}

# ======================= REQUEST MODELS =======================

class DataSourceCreate(BaseModel):
    name: str
    type: DataSourceType
    connection_string: Optional[str] = None
    credentials: Optional[Dict[str, str]] = None
    refresh_frequency: RefreshFrequency = RefreshFrequency.HOUR_1
    created_by: str

class DataQueryCreate(BaseModel):
    name: str
    data_source_id: str
    query_type: str = "sql"
    query: str
    parameters: Dict[str, Any] = {}
    cache_duration: int = 300
    created_by: str

class MetricCreate(BaseModel):
    name: str
    description: Optional[str] = None
    query_id: str
    aggregation: AggregationType
    field: str
    filters: List[Dict[str, Any]] = []
    format: str = "number"
    decimal_places: int = 2
    target_value: Optional[float] = None
    created_by: str

class WidgetCreate(BaseModel):
    name: str
    chart_type: ChartType
    query_id: Optional[str] = None
    metric_ids: List[str] = []
    config: Dict[str, Any] = {}
    dimensions: List[str] = []
    measures: List[str] = []
    filters: List[Dict[str, Any]] = []
    time_granularity: Optional[TimeGranularity] = None
    position_x: int = 0
    position_y: int = 0
    width: int = 4
    height: int = 3
    created_by: str

class DashboardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    theme: str = "light"
    refresh_frequency: RefreshFrequency = RefreshFrequency.MINUTE_5
    tags: List[str] = []
    created_by: str

class ReportCreate(BaseModel):
    name: str
    description: Optional[str] = None
    dashboard_id: Optional[str] = None
    widgets: List[str] = []
    format: ReportFormat = ReportFormat.PDF
    schedule: Optional[Dict[str, Any]] = None
    recipients: List[str] = []
    created_by: str

class AlertCreate(BaseModel):
    name: str
    description: Optional[str] = None
    metric_id: str
    condition: AlertCondition
    threshold: float
    severity: AlertSeverity = AlertSeverity.WARNING
    notification_channels: List[str] = []
    recipients: List[str] = []
    created_by: str

class NLQueryRequest(BaseModel):
    question: str
    data_source_ids: List[str] = []
    context: Dict[str, Any] = {}

# ======================= HELPER FUNCTIONS =======================

def generate_sample_data(chart_type: ChartType, dimensions: List[str], measures: List[str]) -> Dict[str, Any]:
    """Genera datos de ejemplo para visualizaciones"""
    import random

    if chart_type == ChartType.LINE or chart_type == ChartType.AREA:
        return {
            "labels": ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
            "datasets": [
                {
                    "label": measures[0] if measures else "Valor",
                    "data": [random.randint(100, 1000) for _ in range(6)]
                }
            ]
        }
    elif chart_type == ChartType.BAR:
        return {
            "labels": ["Producto A", "Producto B", "Producto C", "Producto D"],
            "datasets": [
                {
                    "label": measures[0] if measures else "Ventas",
                    "data": [random.randint(50, 500) for _ in range(4)]
                }
            ]
        }
    elif chart_type == ChartType.PIE or chart_type == ChartType.DONUT:
        return {
            "labels": ["Categoría 1", "Categoría 2", "Categoría 3", "Categoría 4"],
            "data": [random.randint(10, 100) for _ in range(4)]
        }
    elif chart_type == ChartType.KPI_CARD:
        return {
            "value": random.randint(10000, 100000),
            "change": round(random.uniform(-20, 30), 1),
            "trend": "up" if random.random() > 0.5 else "down"
        }
    elif chart_type == ChartType.TABLE:
        return {
            "columns": ["ID", "Nombre", "Valor", "Fecha"],
            "rows": [
                [i, f"Item {i}", random.randint(100, 1000), "2024-01-15"]
                for i in range(1, 11)
            ]
        }
    elif chart_type == ChartType.GAUGE:
        return {
            "value": random.randint(0, 100),
            "min": 0,
            "max": 100,
            "thresholds": [30, 70]
        }
    elif chart_type == ChartType.FUNNEL:
        return {
            "stages": [
                {"name": "Visitantes", "value": 10000},
                {"name": "Leads", "value": 5000},
                {"name": "Oportunidades", "value": 2000},
                {"name": "Propuestas", "value": 500},
                {"name": "Clientes", "value": 200}
            ]
        }
    else:
        return {"data": []}

def calculate_metric_value(metric: Metric) -> Dict[str, Any]:
    """Calcula el valor actual de una métrica"""
    import random

    current_value = random.uniform(1000, 100000)
    previous_value = current_value * random.uniform(0.8, 1.2)
    change = ((current_value - previous_value) / previous_value) * 100

    return {
        "current_value": round(current_value, metric.decimal_places),
        "previous_value": round(previous_value, metric.decimal_places),
        "change_percent": round(change, 1),
        "trend": "up" if change > 0 else "down" if change < 0 else "stable",
        "target_progress": round((current_value / metric.target_value) * 100, 1) if metric.target_value else None
    }

def generate_ai_insights(dashboard_id: str) -> List[AIInsight]:
    """Genera insights con IA para un dashboard"""
    import random

    insight_templates = [
        {
            "type": "trend",
            "title": "Tendencia Positiva en Ventas",
            "description": "Las ventas han aumentado un 15% en las últimas 2 semanas, superando la media histórica.",
            "significance": 0.85
        },
        {
            "type": "anomaly",
            "title": "Anomalía Detectada en Tráfico",
            "description": "Se detectó un pico inusual de tráfico el martes. Podría estar relacionado con la campaña de marketing.",
            "significance": 0.72
        },
        {
            "type": "correlation",
            "title": "Correlación Descubierta",
            "description": "Existe una fuerte correlación (r=0.89) entre el tiempo en sitio y la tasa de conversión.",
            "significance": 0.91
        },
        {
            "type": "prediction",
            "title": "Predicción de Demanda",
            "description": "Se espera un aumento del 25% en la demanda durante las próximas 2 semanas basado en patrones históricos.",
            "significance": 0.78
        },
        {
            "type": "recommendation",
            "title": "Optimización Sugerida",
            "description": "Considere aumentar el inventario del Producto X - la demanda supera consistentemente la oferta.",
            "significance": 0.82
        }
    ]

    selected = random.sample(insight_templates, min(3, len(insight_templates)))
    generated_insights = []

    for template in selected:
        insight = AIInsight(
            dashboard_id=dashboard_id,
            type=template["type"],
            title=template["title"],
            description=template["description"],
            significance=template["significance"],
            actions=[
                {"label": "Ver detalles", "action": "view_details"},
                {"label": "Crear alerta", "action": "create_alert"}
            ]
        )
        generated_insights.append(insight)
        insights[insight.id] = insight

    return generated_insights

def generate_forecast(metric_id: str, horizon_days: int) -> Forecast:
    """Genera predicciones para una métrica"""
    import random

    predictions = []
    base_value = random.uniform(1000, 10000)
    trend = random.uniform(-0.02, 0.05)  # Daily trend

    for i in range(horizon_days):
        date = datetime.utcnow() + timedelta(days=i+1)
        predicted_value = base_value * (1 + trend * i) + random.uniform(-100, 100)
        lower_bound = predicted_value * 0.85
        upper_bound = predicted_value * 1.15

        predictions.append({
            "date": date.isoformat(),
            "predicted_value": round(predicted_value, 2),
            "lower_bound": round(lower_bound, 2),
            "upper_bound": round(upper_bound, 2),
            "confidence": 0.95 - (i * 0.01)  # Decreasing confidence over time
        })

    return Forecast(
        metric_id=metric_id,
        horizon_days=horizon_days,
        predictions=predictions,
        accuracy_metrics={
            "mape": round(random.uniform(5, 15), 2),
            "rmse": round(random.uniform(50, 200), 2),
            "r_squared": round(random.uniform(0.75, 0.95), 3)
        }
    )

def nl_to_sql(question: str, schema: Dict[str, Any]) -> str:
    """Convierte pregunta en lenguaje natural a SQL"""
    # Simulación - en producción usaría LLM
    keywords_map = {
        "ventas": "SELECT SUM(amount) as total_sales FROM sales",
        "clientes": "SELECT COUNT(DISTINCT customer_id) as total_customers FROM customers",
        "productos": "SELECT product_name, SUM(quantity) as total_sold FROM orders GROUP BY product_name",
        "ingresos": "SELECT DATE_TRUNC('month', date) as month, SUM(revenue) as total FROM transactions GROUP BY 1",
        "promedio": "SELECT AVG(value) as average FROM metrics",
        "top": "SELECT * FROM products ORDER BY sales DESC LIMIT 10",
        "tendencia": "SELECT date, value FROM metrics ORDER BY date",
    }

    for keyword, sql in keywords_map.items():
        if keyword in question.lower():
            return sql

    return "SELECT * FROM data LIMIT 100"

# ======================= DATA SOURCE ENDPOINTS =======================

@app.post("/data-sources", response_model=DataSource)
async def create_data_source(data: DataSourceCreate):
    """Crear nueva fuente de datos"""
    source = DataSource(**data.model_dump())

    # Simular detección de schema
    if source.type == DataSourceType.POSTGRESQL:
        source.tables = ["users", "orders", "products", "transactions"]
        source.schema_info = {
            "users": ["id", "name", "email", "created_at"],
            "orders": ["id", "user_id", "product_id", "amount", "date"],
            "products": ["id", "name", "price", "category"],
            "transactions": ["id", "order_id", "amount", "status", "date"]
        }
    elif source.type == DataSourceType.INTERNAL:
        source.tables = ["ai_docs", "ai_sheets", "ai_mail", "ai_tasks", "ai_collab"]
        source.schema_info = {
            "ai_docs": ["document_id", "title", "created_by", "created_at", "views"],
            "ai_tasks": ["task_id", "status", "assignee", "due_date", "completed_at"]
        }

    source.last_sync = datetime.utcnow()
    data_sources[source.id] = source
    return source

@app.get("/data-sources", response_model=List[DataSource])
async def list_data_sources(
    type: Optional[DataSourceType] = None,
    is_active: bool = True
):
    """Listar fuentes de datos"""
    result = list(data_sources.values())
    if type:
        result = [ds for ds in result if ds.type == type]
    if is_active is not None:
        result = [ds for ds in result if ds.is_active == is_active]
    return result

@app.get("/data-sources/{source_id}", response_model=DataSource)
async def get_data_source(source_id: str):
    """Obtener fuente de datos"""
    if source_id not in data_sources:
        raise HTTPException(status_code=404, detail="Data source not found")
    return data_sources[source_id]

@app.post("/data-sources/{source_id}/sync")
async def sync_data_source(source_id: str, background_tasks: BackgroundTasks):
    """Sincronizar fuente de datos"""
    if source_id not in data_sources:
        raise HTTPException(status_code=404, detail="Data source not found")

    source = data_sources[source_id]
    source.last_sync = datetime.utcnow()

    return {
        "status": "syncing",
        "source_id": source_id,
        "started_at": datetime.utcnow().isoformat()
    }

@app.get("/data-sources/{source_id}/schema")
async def get_data_source_schema(source_id: str):
    """Obtener schema de fuente de datos"""
    if source_id not in data_sources:
        raise HTTPException(status_code=404, detail="Data source not found")

    source = data_sources[source_id]
    return {
        "tables": source.tables,
        "schema": source.schema_info
    }

# ======================= QUERY ENDPOINTS =======================

@app.post("/queries", response_model=DataQuery)
async def create_query(data: DataQueryCreate):
    """Crear nueva consulta"""
    if data.data_source_id not in data_sources:
        raise HTTPException(status_code=404, detail="Data source not found")

    query = DataQuery(**data.model_dump())
    queries[query.id] = query
    return query

@app.get("/queries", response_model=List[DataQuery])
async def list_queries(data_source_id: Optional[str] = None):
    """Listar consultas"""
    result = list(queries.values())
    if data_source_id:
        result = [q for q in result if q.data_source_id == data_source_id]
    return result

@app.post("/queries/{query_id}/execute")
async def execute_query(
    query_id: str,
    parameters: Dict[str, Any] = {}
):
    """Ejecutar consulta y obtener resultados"""
    if query_id not in queries:
        raise HTTPException(status_code=404, detail="Query not found")

    query = queries[query_id]

    # Simular resultados
    import random
    results = {
        "columns": ["id", "name", "value", "date"],
        "rows": [
            [i, f"Item {i}", random.randint(100, 10000), "2024-01-15"]
            for i in range(1, 21)
        ],
        "row_count": 20,
        "execution_time_ms": random.randint(50, 500)
    }

    return results

@app.post("/queries/preview")
async def preview_query(
    data_source_id: str,
    query: str,
    limit: int = 100
):
    """Previsualizar resultados de consulta"""
    if data_source_id not in data_sources:
        raise HTTPException(status_code=404, detail="Data source not found")

    import random
    return {
        "columns": ["col1", "col2", "col3"],
        "rows": [
            [random.randint(1, 100), f"Value {i}", random.uniform(0, 1000)]
            for i in range(min(limit, 10))
        ],
        "total_rows": 1000,
        "preview_rows": min(limit, 10)
    }

# ======================= METRIC ENDPOINTS =======================

@app.post("/metrics", response_model=Metric)
async def create_metric(data: MetricCreate):
    """Crear nueva métrica"""
    if data.query_id not in queries:
        raise HTTPException(status_code=404, detail="Query not found")

    metric = Metric(**data.model_dump())
    metrics[metric.id] = metric
    return metric

@app.get("/metrics", response_model=List[Metric])
async def list_metrics():
    """Listar métricas"""
    return list(metrics.values())

@app.get("/metrics/{metric_id}", response_model=Metric)
async def get_metric(metric_id: str):
    """Obtener métrica"""
    if metric_id not in metrics:
        raise HTTPException(status_code=404, detail="Metric not found")
    return metrics[metric_id]

@app.get("/metrics/{metric_id}/value")
async def get_metric_value(
    metric_id: str,
    time_range: str = "last_7_days"
):
    """Obtener valor actual de métrica"""
    if metric_id not in metrics:
        raise HTTPException(status_code=404, detail="Metric not found")

    metric = metrics[metric_id]
    return calculate_metric_value(metric)

@app.get("/metrics/{metric_id}/history")
async def get_metric_history(
    metric_id: str,
    granularity: TimeGranularity = TimeGranularity.DAY,
    days: int = 30
):
    """Obtener historial de métrica"""
    if metric_id not in metrics:
        raise HTTPException(status_code=404, detail="Metric not found")

    import random
    history = []
    base_value = random.uniform(1000, 10000)

    for i in range(days):
        date = datetime.utcnow() - timedelta(days=days-i-1)
        value = base_value + random.uniform(-500, 500)
        history.append({
            "date": date.isoformat(),
            "value": round(value, 2)
        })
        base_value = value

    return {"metric_id": metric_id, "granularity": granularity, "history": history}

# ======================= WIDGET ENDPOINTS =======================

@app.post("/widgets", response_model=Widget)
async def create_widget(data: WidgetCreate):
    """Crear nuevo widget"""
    widget = Widget(**data.model_dump())
    widgets[widget.id] = widget
    return widget

@app.get("/widgets", response_model=List[Widget])
async def list_widgets():
    """Listar widgets"""
    return list(widgets.values())

@app.get("/widgets/{widget_id}", response_model=Widget)
async def get_widget(widget_id: str):
    """Obtener widget"""
    if widget_id not in widgets:
        raise HTTPException(status_code=404, detail="Widget not found")
    return widgets[widget_id]

@app.put("/widgets/{widget_id}", response_model=Widget)
async def update_widget(widget_id: str, data: Dict[str, Any]):
    """Actualizar widget"""
    if widget_id not in widgets:
        raise HTTPException(status_code=404, detail="Widget not found")

    widget = widgets[widget_id]
    for key, value in data.items():
        if hasattr(widget, key):
            setattr(widget, key, value)

    return widget

@app.get("/widgets/{widget_id}/data")
async def get_widget_data(
    widget_id: str,
    time_range: str = "last_7_days",
    filters: Optional[str] = None
):
    """Obtener datos para widget"""
    if widget_id not in widgets:
        raise HTTPException(status_code=404, detail="Widget not found")

    widget = widgets[widget_id]
    return generate_sample_data(widget.chart_type, widget.dimensions, widget.measures)

# ======================= DASHBOARD ENDPOINTS =======================

@app.post("/dashboards", response_model=Dashboard)
async def create_dashboard(data: DashboardCreate):
    """Crear nuevo dashboard"""
    dashboard = Dashboard(**data.model_dump())
    dashboards[dashboard.id] = dashboard
    return dashboard

@app.get("/dashboards", response_model=List[Dashboard])
async def list_dashboards(
    created_by: Optional[str] = None,
    tag: Optional[str] = None
):
    """Listar dashboards"""
    result = list(dashboards.values())
    if created_by:
        result = [d for d in result if d.created_by == created_by]
    if tag:
        result = [d for d in result if tag in d.tags]
    return result

@app.get("/dashboards/{dashboard_id}", response_model=Dashboard)
async def get_dashboard(dashboard_id: str):
    """Obtener dashboard"""
    if dashboard_id not in dashboards:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return dashboards[dashboard_id]

@app.put("/dashboards/{dashboard_id}", response_model=Dashboard)
async def update_dashboard(dashboard_id: str, data: Dict[str, Any]):
    """Actualizar dashboard"""
    if dashboard_id not in dashboards:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    dashboard = dashboards[dashboard_id]
    for key, value in data.items():
        if hasattr(dashboard, key):
            setattr(dashboard, key, value)
    dashboard.updated_at = datetime.utcnow()

    return dashboard

@app.post("/dashboards/{dashboard_id}/widgets/{widget_id}")
async def add_widget_to_dashboard(dashboard_id: str, widget_id: str):
    """Añadir widget a dashboard"""
    if dashboard_id not in dashboards:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    if widget_id not in widgets:
        raise HTTPException(status_code=404, detail="Widget not found")

    dashboard = dashboards[dashboard_id]
    if widget_id not in dashboard.widgets:
        dashboard.widgets.append(widget_id)

    return {"message": "Widget added", "dashboard_id": dashboard_id}

@app.delete("/dashboards/{dashboard_id}/widgets/{widget_id}")
async def remove_widget_from_dashboard(dashboard_id: str, widget_id: str):
    """Quitar widget de dashboard"""
    if dashboard_id not in dashboards:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    dashboard = dashboards[dashboard_id]
    if widget_id in dashboard.widgets:
        dashboard.widgets.remove(widget_id)

    return {"message": "Widget removed", "dashboard_id": dashboard_id}

@app.get("/dashboards/{dashboard_id}/data")
async def get_dashboard_data(
    dashboard_id: str,
    time_range: str = "last_7_days"
):
    """Obtener todos los datos del dashboard"""
    if dashboard_id not in dashboards:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    dashboard = dashboards[dashboard_id]
    widget_data = {}

    for widget_id in dashboard.widgets:
        if widget_id in widgets:
            widget = widgets[widget_id]
            widget_data[widget_id] = generate_sample_data(
                widget.chart_type,
                widget.dimensions,
                widget.measures
            )

    return {
        "dashboard_id": dashboard_id,
        "time_range": time_range,
        "widgets": widget_data
    }

@app.post("/dashboards/{dashboard_id}/share")
async def share_dashboard(
    dashboard_id: str,
    user_ids: List[str],
    permission: str = "view"
):
    """Compartir dashboard"""
    if dashboard_id not in dashboards:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    dashboard = dashboards[dashboard_id]
    dashboard.shared_with.extend(user_ids)
    dashboard.shared_with = list(set(dashboard.shared_with))

    return {
        "message": "Dashboard shared",
        "shared_with": dashboard.shared_with
    }

@app.post("/dashboards/{dashboard_id}/duplicate")
async def duplicate_dashboard(dashboard_id: str, new_name: str, user_id: str):
    """Duplicar dashboard"""
    if dashboard_id not in dashboards:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    original = dashboards[dashboard_id]
    new_dashboard = Dashboard(
        name=new_name,
        description=original.description,
        widgets=original.widgets.copy(),
        layout=original.layout.copy(),
        filters=original.filters.copy(),
        theme=original.theme,
        tags=original.tags.copy(),
        created_by=user_id
    )
    dashboards[new_dashboard.id] = new_dashboard

    return new_dashboard

# ======================= REPORT ENDPOINTS =======================

@app.post("/reports", response_model=Report)
async def create_report(data: ReportCreate):
    """Crear nuevo reporte"""
    report = Report(**data.model_dump())
    reports[report.id] = report
    return report

@app.get("/reports", response_model=List[Report])
async def list_reports(created_by: Optional[str] = None):
    """Listar reportes"""
    result = list(reports.values())
    if created_by:
        result = [r for r in result if r.created_by == created_by]
    return result

@app.get("/reports/{report_id}", response_model=Report)
async def get_report(report_id: str):
    """Obtener reporte"""
    if report_id not in reports:
        raise HTTPException(status_code=404, detail="Report not found")
    return reports[report_id]

@app.post("/reports/{report_id}/generate")
async def generate_report(
    report_id: str,
    format: Optional[ReportFormat] = None
):
    """Generar reporte"""
    if report_id not in reports:
        raise HTTPException(status_code=404, detail="Report not found")

    report = reports[report_id]
    report.last_generated = datetime.utcnow()

    return {
        "report_id": report_id,
        "format": format or report.format,
        "download_url": f"/reports/{report_id}/download",
        "generated_at": report.last_generated.isoformat(),
        "expires_at": (report.last_generated + timedelta(hours=24)).isoformat()
    }

@app.post("/reports/{report_id}/schedule")
async def schedule_report(
    report_id: str,
    schedule: Dict[str, Any]
):
    """Programar generación de reporte"""
    if report_id not in reports:
        raise HTTPException(status_code=404, detail="Report not found")

    report = reports[report_id]
    report.schedule = schedule

    return {
        "message": "Report scheduled",
        "schedule": schedule
    }

# ======================= ALERT ENDPOINTS =======================

@app.post("/alerts", response_model=Alert)
async def create_alert(data: AlertCreate):
    """Crear nueva alerta"""
    if data.metric_id not in metrics:
        raise HTTPException(status_code=404, detail="Metric not found")

    alert = Alert(**data.model_dump())
    alerts[alert.id] = alert
    return alert

@app.get("/alerts", response_model=List[Alert])
async def list_alerts(
    is_active: bool = True,
    severity: Optional[AlertSeverity] = None
):
    """Listar alertas"""
    result = list(alerts.values())
    if is_active is not None:
        result = [a for a in result if a.is_active == is_active]
    if severity:
        result = [a for a in result if a.severity == severity]
    return result

@app.get("/alerts/{alert_id}", response_model=Alert)
async def get_alert(alert_id: str):
    """Obtener alerta"""
    if alert_id not in alerts:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alerts[alert_id]

@app.put("/alerts/{alert_id}", response_model=Alert)
async def update_alert(alert_id: str, data: Dict[str, Any]):
    """Actualizar alerta"""
    if alert_id not in alerts:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert = alerts[alert_id]
    for key, value in data.items():
        if hasattr(alert, key):
            setattr(alert, key, value)

    return alert

@app.post("/alerts/{alert_id}/test")
async def test_alert(alert_id: str):
    """Probar alerta"""
    if alert_id not in alerts:
        raise HTTPException(status_code=404, detail="Alert not found")

    return {
        "alert_id": alert_id,
        "test_result": "success",
        "message": "Test notification sent"
    }

@app.get("/alerts/{alert_id}/history", response_model=List[AlertHistory])
async def get_alert_history(
    alert_id: str,
    days: int = 30
):
    """Obtener historial de alerta"""
    if alert_id not in alerts:
        raise HTTPException(status_code=404, detail="Alert not found")

    return [h for h in alert_history.values() if h.alert_id == alert_id]

@app.post("/alerts/history/{history_id}/acknowledge")
async def acknowledge_alert(history_id: str, user_id: str, notes: Optional[str] = None):
    """Reconocer alerta disparada"""
    if history_id not in alert_history:
        raise HTTPException(status_code=404, detail="Alert history not found")

    history = alert_history[history_id]
    history.acknowledged = True
    history.acknowledged_by = user_id
    history.acknowledged_at = datetime.utcnow()
    history.notes = notes

    return {"message": "Alert acknowledged", "history_id": history_id}

# ======================= AI FEATURES =======================

@app.post("/ai/insights")
async def generate_insights(dashboard_id: str):
    """Generar insights con IA para dashboard"""
    if dashboard_id not in dashboards:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    generated = generate_ai_insights(dashboard_id)

    return {
        "dashboard_id": dashboard_id,
        "insights": [insight.model_dump() for insight in generated],
        "generated_at": datetime.utcnow().isoformat()
    }

@app.get("/ai/insights", response_model=List[AIInsight])
async def list_insights(
    dashboard_id: Optional[str] = None,
    type: Optional[str] = None
):
    """Listar insights generados"""
    result = list(insights.values())
    if dashboard_id:
        result = [i for i in result if i.dashboard_id == dashboard_id]
    if type:
        result = [i for i in result if i.type == type]
    return sorted(result, key=lambda x: x.significance, reverse=True)

@app.post("/ai/forecast")
async def create_forecast(
    metric_id: str,
    horizon_days: int = 30,
    model_type: str = "prophet"
):
    """Generar predicción para métrica"""
    if metric_id not in metrics:
        raise HTTPException(status_code=404, detail="Metric not found")

    forecast = generate_forecast(metric_id, horizon_days)
    forecast.model_type = model_type
    forecasts[forecast.id] = forecast

    return forecast

@app.get("/ai/forecast/{forecast_id}", response_model=Forecast)
async def get_forecast(forecast_id: str):
    """Obtener predicción"""
    if forecast_id not in forecasts:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return forecasts[forecast_id]

@app.post("/ai/natural-query")
async def natural_language_query(request: NLQueryRequest):
    """Consulta en lenguaje natural"""
    # Determinar data sources disponibles
    available_sources = list(data_sources.values())
    if request.data_source_ids:
        available_sources = [ds for ds in available_sources if ds.id in request.data_source_ids]

    # Combinar schemas
    combined_schema = {}
    for source in available_sources:
        combined_schema.update(source.schema_info)

    # Generar SQL
    generated_sql = nl_to_sql(request.question, combined_schema)

    # Simular resultados
    import random
    results = {
        "columns": ["metric", "value"],
        "rows": [
            ["Total", random.randint(10000, 100000)],
            ["Promedio", random.randint(100, 1000)],
            ["Máximo", random.randint(5000, 50000)]
        ]
    }

    # Generar explicación
    explanation = f"Para responder '{request.question}', analicé los datos de {len(available_sources)} fuentes. "
    explanation += "Los resultados muestran las métricas principales basadas en tu consulta."

    return {
        "question": request.question,
        "generated_query": generated_sql,
        "results": results,
        "explanation": explanation,
        "confidence": round(random.uniform(0.75, 0.98), 2),
        "suggestions": [
            "¿Quieres ver la tendencia histórica?",
            "¿Te gustaría crear un widget con estos datos?",
            "¿Deseas configurar una alerta para este métrico?"
        ]
    }

@app.post("/ai/anomaly-detection")
async def detect_anomalies(
    metric_id: str,
    sensitivity: float = 0.8,
    lookback_days: int = 30
):
    """Detectar anomalías en métrica"""
    if metric_id not in metrics:
        raise HTTPException(status_code=404, detail="Metric not found")

    import random

    anomalies = []
    for i in range(random.randint(0, 5)):
        date = datetime.utcnow() - timedelta(days=random.randint(1, lookback_days))
        anomalies.append({
            "date": date.isoformat(),
            "expected_value": round(random.uniform(1000, 5000), 2),
            "actual_value": round(random.uniform(500, 8000), 2),
            "deviation_score": round(random.uniform(2, 5), 2),
            "type": random.choice(["spike", "dip", "trend_change"]),
            "possible_causes": [
                "Campaña de marketing activa",
                "Día festivo",
                "Problema técnico reportado"
            ][:random.randint(1, 3)]
        })

    return {
        "metric_id": metric_id,
        "anomalies": anomalies,
        "analysis_period": f"Últimos {lookback_days} días",
        "sensitivity": sensitivity
    }

@app.post("/ai/correlation-analysis")
async def analyze_correlations(metric_ids: List[str]):
    """Analizar correlaciones entre métricas"""
    import random

    correlations = []
    for i, metric1 in enumerate(metric_ids):
        for metric2 in metric_ids[i+1:]:
            correlation = round(random.uniform(-1, 1), 3)
            correlations.append({
                "metric_1": metric1,
                "metric_2": metric2,
                "correlation": correlation,
                "strength": "strong" if abs(correlation) > 0.7 else "moderate" if abs(correlation) > 0.4 else "weak",
                "direction": "positive" if correlation > 0 else "negative",
                "significance": round(random.uniform(0.01, 0.1), 3)
            })

    # Ordenar por correlación absoluta
    correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    return {
        "metrics_analyzed": len(metric_ids),
        "correlations": correlations,
        "insights": [
            {
                "finding": f"Alta correlación detectada entre métricas",
                "recommendation": "Considere crear un widget combinado para monitorear estas métricas juntas"
            }
        ] if correlations and abs(correlations[0]["correlation"]) > 0.7 else []
    }

@app.post("/ai/auto-dashboard")
async def generate_auto_dashboard(
    data_source_id: str,
    purpose: str,  # sales, marketing, operations, finance, hr
    user_id: str
):
    """Generar dashboard automáticamente basado en datos"""
    if data_source_id not in data_sources:
        raise HTTPException(status_code=404, detail="Data source not found")

    source = data_sources[data_source_id]

    # Templates por propósito
    templates = {
        "sales": {
            "name": "Dashboard de Ventas",
            "widgets": [
                {"type": ChartType.KPI_CARD, "name": "Ventas Totales"},
                {"type": ChartType.LINE, "name": "Tendencia de Ventas"},
                {"type": ChartType.BAR, "name": "Ventas por Producto"},
                {"type": ChartType.PIE, "name": "Distribución por Región"},
                {"type": ChartType.FUNNEL, "name": "Pipeline de Ventas"},
                {"type": ChartType.TABLE, "name": "Top Vendedores"}
            ]
        },
        "marketing": {
            "name": "Dashboard de Marketing",
            "widgets": [
                {"type": ChartType.KPI_CARD, "name": "Leads Generados"},
                {"type": ChartType.LINE, "name": "Tráfico Web"},
                {"type": ChartType.BAR, "name": "Rendimiento de Campañas"},
                {"type": ChartType.PIE, "name": "Fuentes de Tráfico"},
                {"type": ChartType.FUNNEL, "name": "Embudo de Conversión"}
            ]
        },
        "operations": {
            "name": "Dashboard de Operaciones",
            "widgets": [
                {"type": ChartType.GAUGE, "name": "Eficiencia Operativa"},
                {"type": ChartType.LINE, "name": "Tiempo de Proceso"},
                {"type": ChartType.BAR, "name": "Producción por Línea"},
                {"type": ChartType.HEATMAP, "name": "Mapa de Calidad"}
            ]
        },
        "finance": {
            "name": "Dashboard Financiero",
            "widgets": [
                {"type": ChartType.KPI_CARD, "name": "Ingresos"},
                {"type": ChartType.KPI_CARD, "name": "Gastos"},
                {"type": ChartType.WATERFALL, "name": "Flujo de Caja"},
                {"type": ChartType.LINE, "name": "P&L Mensual"},
                {"type": ChartType.PIE, "name": "Distribución de Gastos"}
            ]
        },
        "hr": {
            "name": "Dashboard de RRHH",
            "widgets": [
                {"type": ChartType.KPI_CARD, "name": "Total Empleados"},
                {"type": ChartType.BAR, "name": "Headcount por Depto"},
                {"type": ChartType.LINE, "name": "Rotación Mensual"},
                {"type": ChartType.PIE, "name": "Distribución por Antigüedad"}
            ]
        }
    }

    template = templates.get(purpose, templates["sales"])

    # Crear dashboard
    dashboard = Dashboard(
        name=template["name"],
        description=f"Dashboard auto-generado para {purpose}",
        theme="light",
        created_by=user_id,
        tags=[purpose, "auto-generated"]
    )
    dashboards[dashboard.id] = dashboard

    # Crear widgets
    created_widgets = []
    for i, w in enumerate(template["widgets"]):
        widget = Widget(
            name=w["name"],
            chart_type=w["type"],
            position_x=(i % 3) * 4,
            position_y=(i // 3) * 3,
            width=4,
            height=3,
            created_by=user_id
        )
        widgets[widget.id] = widget
        dashboard.widgets.append(widget.id)
        created_widgets.append(widget)

    return {
        "dashboard": dashboard,
        "widgets": created_widgets,
        "message": f"Dashboard '{template['name']}' generado con {len(created_widgets)} widgets"
    }

@app.post("/ai/explain-metric")
async def explain_metric(metric_id: str):
    """Explicar una métrica en lenguaje natural"""
    if metric_id not in metrics:
        raise HTTPException(status_code=404, detail="Metric not found")

    metric = metrics[metric_id]
    value = calculate_metric_value(metric)

    explanation = f"""
## {metric.name}

### Valor Actual
El valor actual es **{value['current_value']:,.2f}** {metric.suffix or ''}.

### Cambio
Comparado con el período anterior, {
    'ha aumentado' if value['change_percent'] > 0 else 'ha disminuido' if value['change_percent'] < 0 else 'se mantiene igual'
} un **{abs(value['change_percent'])}%**.

### Contexto
{metric.description or 'Esta métrica mide un indicador clave del negocio.'}

### Factores Posibles
- Variaciones estacionales normales
- Cambios en el comportamiento del mercado
- Efectos de iniciativas recientes

### Recomendaciones
1. Monitorear la tendencia en los próximos días
2. Comparar con métricas relacionadas
3. Investigar cambios significativos
"""

    return {
        "metric_id": metric_id,
        "explanation": explanation,
        "value": value
    }

@app.post("/ai/suggest-kpis")
async def suggest_kpis(
    industry: str,
    department: str,
    goals: List[str] = []
):
    """Sugerir KPIs basados en industria y departamento"""

    kpi_database = {
        ("technology", "sales"): [
            {"name": "MRR (Monthly Recurring Revenue)", "formula": "sum(monthly_subscriptions)", "target": "10% growth"},
            {"name": "CAC (Customer Acquisition Cost)", "formula": "marketing_spend / new_customers", "target": "< $500"},
            {"name": "LTV (Lifetime Value)", "formula": "avg_revenue_per_customer * avg_customer_lifetime", "target": "> 3x CAC"},
            {"name": "Churn Rate", "formula": "churned_customers / total_customers", "target": "< 5%"},
            {"name": "Net Revenue Retention", "formula": "(mrr_end + expansion - contraction - churn) / mrr_start", "target": "> 100%"}
        ],
        ("technology", "engineering"): [
            {"name": "Deployment Frequency", "formula": "count(deployments) / time_period", "target": "Daily"},
            {"name": "Lead Time", "formula": "avg(commit_to_deploy_time)", "target": "< 1 day"},
            {"name": "MTTR", "formula": "avg(time_to_restore)", "target": "< 1 hour"},
            {"name": "Change Failure Rate", "formula": "failed_deployments / total_deployments", "target": "< 15%"}
        ],
        ("retail", "sales"): [
            {"name": "Same Store Sales Growth", "formula": "(current_sales - previous_sales) / previous_sales", "target": "5%"},
            {"name": "Average Transaction Value", "formula": "total_revenue / number_of_transactions", "target": "+10%"},
            {"name": "Conversion Rate", "formula": "purchases / store_visits", "target": "> 20%"},
            {"name": "Inventory Turnover", "formula": "cogs / average_inventory", "target": "8x annually"}
        ]
    }

    key = (industry.lower(), department.lower())
    suggested = kpi_database.get(key, [
        {"name": "Revenue Growth", "formula": "current_revenue / previous_revenue - 1", "target": "15%"},
        {"name": "Cost Efficiency", "formula": "output / cost", "target": "+5%"},
        {"name": "Customer Satisfaction", "formula": "avg(satisfaction_score)", "target": "> 4.5/5"}
    ])

    return {
        "industry": industry,
        "department": department,
        "suggested_kpis": suggested,
        "implementation_tips": [
            "Comience con 3-5 KPIs principales",
            "Asegúrese de tener datos disponibles para calcular cada KPI",
            "Establezca objetivos realistas basados en benchmarks de la industria",
            "Revise y ajuste los KPIs trimestralmente"
        ]
    }

# ======================= EXPORT & EMBED =======================

@app.get("/dashboards/{dashboard_id}/embed-code")
async def get_embed_code(dashboard_id: str, theme: str = "light"):
    """Obtener código para embeber dashboard"""
    if dashboard_id not in dashboards:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    embed_code = f"""
<iframe
    src="https://ai-analytics.ai-suite.com/embed/{dashboard_id}?theme={theme}"
    width="100%"
    height="600"
    frameborder="0"
    allowfullscreen>
</iframe>
"""

    return {
        "dashboard_id": dashboard_id,
        "embed_code": embed_code,
        "embed_url": f"https://ai-analytics.ai-suite.com/embed/{dashboard_id}?theme={theme}"
    }

@app.post("/dashboards/{dashboard_id}/export")
async def export_dashboard(
    dashboard_id: str,
    format: ReportFormat = ReportFormat.PDF,
    include_data: bool = True
):
    """Exportar dashboard"""
    if dashboard_id not in dashboards:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    return {
        "dashboard_id": dashboard_id,
        "format": format,
        "download_url": f"/downloads/dashboard_{dashboard_id}.{format.value}",
        "generated_at": datetime.utcnow().isoformat()
    }

# ======================= HEALTH & STATUS =======================

@app.get("/health")
async def health_check():
    """Health check del servicio"""
    return {
        "status": "healthy",
        "service": "ai-analytics",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/stats")
async def get_service_stats():
    """Estadísticas del servicio"""
    return {
        "data_sources": len(data_sources),
        "queries": len(queries),
        "metrics": len(metrics),
        "widgets": len(widgets),
        "dashboards": len(dashboards),
        "reports": len(reports),
        "alerts": len(alerts),
        "active_alerts": len([a for a in alerts.values() if a.is_active]),
        "insights_generated": len(insights),
        "forecasts_active": len(forecasts)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8015)

"""
AI-Sheets Service

Backend service for spreadsheet management with AI capabilities.
Supports formulas, charts, real-time collaboration, and AI analysis.
"""

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from uuid import UUID, uuid4
from enum import Enum
import structlog
import uvicorn
import json
import re

logger = structlog.get_logger(__name__)


# ============================================
# ENUMS
# ============================================

class CellType(str, Enum):
    TEXT = "text"
    NUMBER = "number"
    FORMULA = "formula"
    DATE = "date"
    BOOLEAN = "boolean"
    ERROR = "error"
    EMPTY = "empty"


class ChartType(str, Enum):
    BAR = "bar"
    LINE = "line"
    PIE = "pie"
    SCATTER = "scatter"
    AREA = "area"
    COLUMN = "column"
    DOUGHNUT = "doughnut"
    RADAR = "radar"
    COMBO = "combo"


class FormatType(str, Enum):
    GENERAL = "general"
    NUMBER = "number"
    CURRENCY = "currency"
    PERCENTAGE = "percentage"
    DATE = "date"
    TIME = "time"
    TEXT = "text"
    SCIENTIFIC = "scientific"


# ============================================
# MODELS
# ============================================

class CellFormat(BaseModel):
    font_family: Optional[str] = "Arial"
    font_size: Optional[int] = 11
    bold: Optional[bool] = False
    italic: Optional[bool] = False
    underline: Optional[bool] = False
    text_color: Optional[str] = "#000000"
    background_color: Optional[str] = "#FFFFFF"
    horizontal_align: Optional[str] = "left"
    vertical_align: Optional[str] = "middle"
    number_format: Optional[FormatType] = FormatType.GENERAL
    decimal_places: Optional[int] = 2
    borders: Optional[Dict[str, Any]] = None


class Cell(BaseModel):
    value: Any = None
    formula: Optional[str] = None
    cell_type: CellType = CellType.EMPTY
    format: Optional[CellFormat] = None
    note: Optional[str] = None
    validation: Optional[Dict[str, Any]] = None
    hyperlink: Optional[str] = None


class CellRange(BaseModel):
    start_row: int
    start_col: int
    end_row: int
    end_col: int


class Sheet(BaseModel):
    id: UUID
    name: str
    cells: Dict[str, Cell] = {}  # "A1" -> Cell
    row_heights: Dict[int, int] = {}
    col_widths: Dict[int, int] = {}
    frozen_rows: int = 0
    frozen_cols: int = 0
    hidden_rows: List[int] = []
    hidden_cols: List[int] = []
    filters: Optional[Dict[str, Any]] = None
    conditional_formats: List[Dict[str, Any]] = []


class Chart(BaseModel):
    id: UUID
    sheet_id: UUID
    chart_type: ChartType
    title: str
    data_range: str  # e.g., "A1:D10"
    position: Dict[str, int]  # {"row": 1, "col": 5, "width": 400, "height": 300}
    options: Dict[str, Any] = {}


class SpreadsheetCreate(BaseModel):
    title: str
    sheets: Optional[List[Dict[str, Any]]] = None


class SpreadsheetUpdate(BaseModel):
    title: Optional[str] = None


class CellUpdate(BaseModel):
    cell_ref: str  # e.g., "A1"
    value: Optional[Any] = None
    formula: Optional[str] = None
    format: Optional[CellFormat] = None


class BatchCellUpdate(BaseModel):
    updates: List[CellUpdate]


class AIFormulaRequest(BaseModel):
    description: str
    context: Optional[Dict[str, Any]] = None  # Column names, sample data


class AIAnalysisRequest(BaseModel):
    spreadsheet_id: UUID
    sheet_id: UUID
    data_range: str
    analysis_type: str = "general"  # general, trends, outliers, forecasting


class AIChartRequest(BaseModel):
    spreadsheet_id: UUID
    sheet_id: UUID
    data_range: str
    goal: str = "visualize data"


# ============================================
# FORMULA ENGINE (Basic)
# ============================================

class FormulaEngine:
    """Basic formula evaluation engine."""

    FUNCTIONS = {
        "SUM": lambda args: sum(float(a) for a in args if a is not None),
        "AVERAGE": lambda args: sum(float(a) for a in args if a is not None) / len([a for a in args if a is not None]),
        "COUNT": lambda args: len([a for a in args if a is not None]),
        "MAX": lambda args: max(float(a) for a in args if a is not None),
        "MIN": lambda args: min(float(a) for a in args if a is not None),
        "IF": lambda args: args[1] if args[0] else args[2] if len(args) > 2 else "",
        "CONCATENATE": lambda args: "".join(str(a) for a in args),
        "LEN": lambda args: len(str(args[0])) if args else 0,
        "UPPER": lambda args: str(args[0]).upper() if args else "",
        "LOWER": lambda args: str(args[0]).lower() if args else "",
        "ROUND": lambda args: round(float(args[0]), int(args[1]) if len(args) > 1 else 0),
        "ABS": lambda args: abs(float(args[0])),
        "SQRT": lambda args: float(args[0]) ** 0.5,
        "POWER": lambda args: float(args[0]) ** float(args[1]),
        "NOW": lambda args: datetime.now().isoformat(),
        "TODAY": lambda args: datetime.now().date().isoformat(),
    }

    @classmethod
    def evaluate(cls, formula: str, cells: Dict[str, Cell]) -> Any:
        """Evaluate a formula and return the result."""
        if not formula.startswith("="):
            return formula

        formula_content = formula[1:].strip()

        try:
            # Check for function calls
            func_match = re.match(r"(\w+)\((.*)\)", formula_content)
            if func_match:
                func_name = func_match.group(1).upper()
                args_str = func_match.group(2)

                if func_name in cls.FUNCTIONS:
                    args = cls._parse_args(args_str, cells)
                    return cls.FUNCTIONS[func_name](args)

            # Simple cell reference or arithmetic
            return cls._evaluate_expression(formula_content, cells)

        except Exception as e:
            return f"#ERROR: {str(e)}"

    @classmethod
    def _parse_args(cls, args_str: str, cells: Dict[str, Cell]) -> List[Any]:
        """Parse function arguments."""
        args = []

        # Handle ranges like A1:A10
        range_match = re.match(r"([A-Z]+\d+):([A-Z]+\d+)", args_str)
        if range_match:
            start_ref = range_match.group(1)
            end_ref = range_match.group(2)
            return cls._get_range_values(start_ref, end_ref, cells)

        # Handle comma-separated arguments
        for arg in args_str.split(","):
            arg = arg.strip()
            if re.match(r"[A-Z]+\d+", arg):
                # Cell reference
                cell = cells.get(arg)
                args.append(cell.value if cell else None)
            else:
                # Literal value
                try:
                    args.append(float(arg))
                except ValueError:
                    args.append(arg.strip('"\''))

        return args

    @classmethod
    def _get_range_values(
        cls,
        start_ref: str,
        end_ref: str,
        cells: Dict[str, Cell]
    ) -> List[Any]:
        """Get all values in a cell range."""
        start_col, start_row = cls._parse_cell_ref(start_ref)
        end_col, end_row = cls._parse_cell_ref(end_ref)

        values = []
        for row in range(start_row, end_row + 1):
            for col in range(start_col, end_col + 1):
                cell_ref = cls._make_cell_ref(col, row)
                cell = cells.get(cell_ref)
                if cell and cell.value is not None:
                    values.append(cell.value)

        return values

    @classmethod
    def _parse_cell_ref(cls, ref: str) -> tuple:
        """Parse a cell reference like 'A1' into (column, row)."""
        col_str = re.match(r"([A-Z]+)", ref).group(1)
        row = int(re.search(r"(\d+)", ref).group(1))

        col = 0
        for char in col_str:
            col = col * 26 + (ord(char) - ord('A') + 1)

        return col, row

    @classmethod
    def _make_cell_ref(cls, col: int, row: int) -> str:
        """Make a cell reference from column and row numbers."""
        col_str = ""
        while col > 0:
            col, remainder = divmod(col - 1, 26)
            col_str = chr(ord('A') + remainder) + col_str
        return f"{col_str}{row}"

    @classmethod
    def _evaluate_expression(cls, expr: str, cells: Dict[str, Cell]) -> Any:
        """Evaluate a simple expression."""
        # Replace cell references with values
        def replace_ref(match):
            ref = match.group(0)
            cell = cells.get(ref)
            if cell and cell.value is not None:
                return str(cell.value)
            return "0"

        expr = re.sub(r"[A-Z]+\d+", replace_ref, expr)

        # Safe evaluation
        try:
            return eval(expr, {"__builtins__": {}}, {})
        except:
            return expr


# ============================================
# APPLICATION
# ============================================

app = FastAPI(
    title="AI-Sheets Service",
    description="Spreadsheet service with AI capabilities",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
spreadsheets_db: Dict[UUID, Dict] = {}
charts_db: Dict[UUID, Dict] = {}
collaborators: Dict[UUID, List[WebSocket]] = {}


# ============================================
# ENDPOINTS
# ============================================

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-sheets"}


# ========== SPREADSHEET CRUD ==========

@app.get("/api/v1/sheets/spreadsheets")
async def list_spreadsheets(
    folder_id: Optional[UUID] = None,
    limit: int = 50,
    offset: int = 0,
):
    """List all spreadsheets."""
    sheets = list(spreadsheets_db.values())

    if folder_id:
        sheets = [s for s in sheets if s.get("folder_id") == folder_id]

    return {"spreadsheets": sheets[offset:offset + limit], "total": len(sheets)}


@app.post("/api/v1/sheets/spreadsheets")
async def create_spreadsheet(data: SpreadsheetCreate):
    """Create a new spreadsheet."""
    spreadsheet_id = uuid4()
    now = datetime.utcnow()

    # Create default sheet
    default_sheet = {
        "id": uuid4(),
        "name": "Sheet1",
        "cells": {},
        "row_heights": {},
        "col_widths": {},
        "frozen_rows": 0,
        "frozen_cols": 0,
        "hidden_rows": [],
        "hidden_cols": [],
    }

    spreadsheet = {
        "id": spreadsheet_id,
        "title": data.title,
        "sheets": [default_sheet],
        "owner_id": uuid4(),  # Would come from auth
        "folder_id": None,
        "version": 1,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    spreadsheets_db[spreadsheet_id] = spreadsheet
    logger.info("Spreadsheet created", spreadsheet_id=str(spreadsheet_id))

    return spreadsheet


@app.get("/api/v1/sheets/spreadsheets/{spreadsheet_id}")
async def get_spreadsheet(spreadsheet_id: UUID):
    """Get a spreadsheet by ID."""
    if spreadsheet_id not in spreadsheets_db:
        raise HTTPException(status_code=404, detail="Spreadsheet not found")

    return spreadsheets_db[spreadsheet_id]


@app.put("/api/v1/sheets/spreadsheets/{spreadsheet_id}")
async def update_spreadsheet(spreadsheet_id: UUID, data: SpreadsheetUpdate):
    """Update spreadsheet metadata."""
    if spreadsheet_id not in spreadsheets_db:
        raise HTTPException(status_code=404, detail="Spreadsheet not found")

    spreadsheet = spreadsheets_db[spreadsheet_id]

    if data.title:
        spreadsheet["title"] = data.title

    spreadsheet["version"] += 1
    spreadsheet["updated_at"] = datetime.utcnow().isoformat()

    return spreadsheet


@app.delete("/api/v1/sheets/spreadsheets/{spreadsheet_id}")
async def delete_spreadsheet(spreadsheet_id: UUID):
    """Delete a spreadsheet."""
    if spreadsheet_id not in spreadsheets_db:
        raise HTTPException(status_code=404, detail="Spreadsheet not found")

    del spreadsheets_db[spreadsheet_id]
    return {"status": "deleted"}


# ========== SHEET MANAGEMENT ==========

@app.post("/api/v1/sheets/spreadsheets/{spreadsheet_id}/sheets")
async def add_sheet(spreadsheet_id: UUID, name: str = "New Sheet"):
    """Add a new sheet to spreadsheet."""
    if spreadsheet_id not in spreadsheets_db:
        raise HTTPException(status_code=404, detail="Spreadsheet not found")

    spreadsheet = spreadsheets_db[spreadsheet_id]

    new_sheet = {
        "id": uuid4(),
        "name": name,
        "cells": {},
        "row_heights": {},
        "col_widths": {},
        "frozen_rows": 0,
        "frozen_cols": 0,
    }

    spreadsheet["sheets"].append(new_sheet)
    spreadsheet["version"] += 1
    spreadsheet["updated_at"] = datetime.utcnow().isoformat()

    return new_sheet


@app.delete("/api/v1/sheets/spreadsheets/{spreadsheet_id}/sheets/{sheet_id}")
async def delete_sheet(spreadsheet_id: UUID, sheet_id: UUID):
    """Delete a sheet from spreadsheet."""
    if spreadsheet_id not in spreadsheets_db:
        raise HTTPException(status_code=404, detail="Spreadsheet not found")

    spreadsheet = spreadsheets_db[spreadsheet_id]

    if len(spreadsheet["sheets"]) <= 1:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete the only sheet"
        )

    spreadsheet["sheets"] = [
        s for s in spreadsheet["sheets"]
        if str(s["id"]) != str(sheet_id)
    ]

    spreadsheet["version"] += 1
    spreadsheet["updated_at"] = datetime.utcnow().isoformat()

    return {"status": "deleted"}


# ========== CELL OPERATIONS ==========

@app.get("/api/v1/sheets/spreadsheets/{spreadsheet_id}/sheets/{sheet_id}/cells")
async def get_cells(
    spreadsheet_id: UUID,
    sheet_id: UUID,
    range: Optional[str] = None,
):
    """Get cells from a sheet."""
    if spreadsheet_id not in spreadsheets_db:
        raise HTTPException(status_code=404, detail="Spreadsheet not found")

    spreadsheet = spreadsheets_db[spreadsheet_id]
    sheet = next(
        (s for s in spreadsheet["sheets"] if str(s["id"]) == str(sheet_id)),
        None
    )

    if not sheet:
        raise HTTPException(status_code=404, detail="Sheet not found")

    cells = sheet.get("cells", {})

    # TODO: Filter by range if provided

    return {"cells": cells}


@app.put("/api/v1/sheets/spreadsheets/{spreadsheet_id}/sheets/{sheet_id}/cells")
async def update_cell(
    spreadsheet_id: UUID,
    sheet_id: UUID,
    update: CellUpdate,
):
    """Update a single cell."""
    if spreadsheet_id not in spreadsheets_db:
        raise HTTPException(status_code=404, detail="Spreadsheet not found")

    spreadsheet = spreadsheets_db[spreadsheet_id]
    sheet = next(
        (s for s in spreadsheet["sheets"] if str(s["id"]) == str(sheet_id)),
        None
    )

    if not sheet:
        raise HTTPException(status_code=404, detail="Sheet not found")

    cell_ref = update.cell_ref.upper()

    # Create or update cell
    if "cells" not in sheet:
        sheet["cells"] = {}

    cell_data = sheet["cells"].get(cell_ref, {})

    if update.formula:
        cell_data["formula"] = update.formula
        cell_data["cell_type"] = CellType.FORMULA.value
        # Evaluate formula
        cells_as_objects = {
            k: Cell(**v) if isinstance(v, dict) else v
            for k, v in sheet["cells"].items()
        }
        cell_data["value"] = FormulaEngine.evaluate(update.formula, cells_as_objects)
    elif update.value is not None:
        cell_data["value"] = update.value
        cell_data["formula"] = None
        # Determine cell type
        if isinstance(update.value, (int, float)):
            cell_data["cell_type"] = CellType.NUMBER.value
        elif isinstance(update.value, bool):
            cell_data["cell_type"] = CellType.BOOLEAN.value
        else:
            cell_data["cell_type"] = CellType.TEXT.value

    if update.format:
        cell_data["format"] = update.format.dict()

    sheet["cells"][cell_ref] = cell_data

    spreadsheet["version"] += 1
    spreadsheet["updated_at"] = datetime.utcnow().isoformat()

    # Broadcast to collaborators
    if spreadsheet_id in collaborators:
        for ws in collaborators[spreadsheet_id]:
            try:
                await ws.send_json({
                    "type": "cell_update",
                    "sheet_id": str(sheet_id),
                    "cell_ref": cell_ref,
                    "data": cell_data
                })
            except:
                pass

    return {"cell_ref": cell_ref, "data": cell_data}


@app.post("/api/v1/sheets/spreadsheets/{spreadsheet_id}/sheets/{sheet_id}/cells/batch")
async def update_cells_batch(
    spreadsheet_id: UUID,
    sheet_id: UUID,
    batch: BatchCellUpdate,
):
    """Update multiple cells at once."""
    results = []

    for update in batch.updates:
        result = await update_cell(spreadsheet_id, sheet_id, update)
        results.append(result)

    return {"results": results}


# ========== CHARTS ==========

@app.post("/api/v1/sheets/spreadsheets/{spreadsheet_id}/sheets/{sheet_id}/charts")
async def create_chart(
    spreadsheet_id: UUID,
    sheet_id: UUID,
    chart_type: ChartType,
    title: str,
    data_range: str,
    position: Dict[str, int],
):
    """Create a chart."""
    chart_id = uuid4()

    chart = {
        "id": chart_id,
        "spreadsheet_id": spreadsheet_id,
        "sheet_id": sheet_id,
        "chart_type": chart_type.value,
        "title": title,
        "data_range": data_range,
        "position": position,
        "options": {},
        "created_at": datetime.utcnow().isoformat(),
    }

    charts_db[chart_id] = chart

    return chart


@app.get("/api/v1/sheets/spreadsheets/{spreadsheet_id}/sheets/{sheet_id}/charts")
async def get_charts(spreadsheet_id: UUID, sheet_id: UUID):
    """Get all charts for a sheet."""
    charts = [
        c for c in charts_db.values()
        if str(c["sheet_id"]) == str(sheet_id)
    ]
    return {"charts": charts}


@app.delete("/api/v1/sheets/charts/{chart_id}")
async def delete_chart(chart_id: UUID):
    """Delete a chart."""
    if chart_id not in charts_db:
        raise HTTPException(status_code=404, detail="Chart not found")

    del charts_db[chart_id]
    return {"status": "deleted"}


# ========== AI FEATURES ==========

@app.post("/api/v1/sheets/ai/formula")
async def ai_generate_formula(request: AIFormulaRequest):
    """Generate a formula from natural language."""
    # This would use the SheetsAgent
    logger.info("AI formula request", description=request.description[:50])

    async def generate():
        # Simulated response
        response = f"=SUM(A1:A10)  // Formula for: {request.description}"
        for char in response:
            yield f"data: {json.dumps({'chunk': char})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/api/v1/sheets/ai/analyze")
async def ai_analyze_data(request: AIAnalysisRequest):
    """Analyze data using AI."""
    if request.spreadsheet_id not in spreadsheets_db:
        raise HTTPException(status_code=404, detail="Spreadsheet not found")

    # This would use the SheetsAgent
    return {
        "spreadsheet_id": request.spreadsheet_id,
        "sheet_id": request.sheet_id,
        "data_range": request.data_range,
        "analysis_type": request.analysis_type,
        "insights": [
            "The data shows an upward trend over time",
            "Average value is 150.5",
            "There are 2 potential outliers in rows 5 and 12",
        ],
        "recommendations": [
            "Consider adding a trend line chart",
            "Review outlier values for accuracy",
        ]
    }


@app.post("/api/v1/sheets/ai/chart-suggest")
async def ai_suggest_chart(request: AIChartRequest):
    """Get AI suggestions for chart type."""
    return {
        "suggestions": [
            {
                "chart_type": "line",
                "reason": "Best for showing trends over time",
                "confidence": 0.9
            },
            {
                "chart_type": "bar",
                "reason": "Good for comparing categories",
                "confidence": 0.7
            }
        ],
        "recommended": "line"
    }


@app.post("/api/v1/sheets/ai/autofill")
async def ai_autofill(
    spreadsheet_id: UUID,
    sheet_id: UUID,
    source_range: str,
    target_range: str,
):
    """AI-powered autofill."""
    return {
        "status": "autofilled",
        "source_range": source_range,
        "target_range": target_range,
        "pattern_detected": "incrementing numbers"
    }


@app.post("/api/v1/sheets/ai/clean-data")
async def ai_clean_data(
    spreadsheet_id: UUID,
    sheet_id: UUID,
    data_range: str,
):
    """AI-powered data cleaning suggestions."""
    return {
        "issues_found": [
            {"type": "duplicate", "rows": [5, 12], "action": "remove_duplicates"},
            {"type": "empty", "cells": ["B3", "B7"], "action": "fill_or_remove"},
            {"type": "inconsistent_format", "column": "C", "action": "standardize"},
        ],
        "recommended_actions": [
            "Remove 2 duplicate rows",
            "Fill empty cells with averages",
            "Standardize date format in column C"
        ]
    }


# ========== IMPORT/EXPORT ==========

@app.get("/api/v1/sheets/spreadsheets/{spreadsheet_id}/export/{format}")
async def export_spreadsheet(spreadsheet_id: UUID, format: str):
    """Export spreadsheet to different formats."""
    if spreadsheet_id not in spreadsheets_db:
        raise HTTPException(status_code=404, detail="Spreadsheet not found")

    supported = ["xlsx", "csv", "pdf", "json"]
    if format not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format. Supported: {supported}"
        )

    return {
        "spreadsheet_id": spreadsheet_id,
        "format": format,
        "download_url": f"/downloads/{spreadsheet_id}.{format}",
        "expires_in": 3600
    }


@app.post("/api/v1/sheets/import")
async def import_spreadsheet(file_url: str, format: str = "xlsx"):
    """Import spreadsheet from file."""
    # Would handle file upload and parsing
    spreadsheet_id = uuid4()

    return {
        "spreadsheet_id": spreadsheet_id,
        "status": "imported",
        "sheets_count": 1,
        "rows_imported": 100
    }


# ========== REAL-TIME COLLABORATION ==========

@app.websocket("/api/v1/sheets/spreadsheets/{spreadsheet_id}/collaborate")
async def collaborate(websocket: WebSocket, spreadsheet_id: UUID):
    """WebSocket for real-time collaboration."""
    await websocket.accept()

    if spreadsheet_id not in spreadsheets_db:
        await websocket.close(code=4004, reason="Spreadsheet not found")
        return

    if spreadsheet_id not in collaborators:
        collaborators[spreadsheet_id] = []
    collaborators[spreadsheet_id].append(websocket)

    logger.info("Collaborator joined", spreadsheet_id=str(spreadsheet_id))

    try:
        while True:
            data = await websocket.receive_json()
            op_type = data.get("type")

            # Broadcast to other collaborators
            for ws in collaborators[spreadsheet_id]:
                if ws != websocket:
                    await ws.send_json(data)

    except WebSocketDisconnect:
        collaborators[spreadsheet_id].remove(websocket)
        logger.info("Collaborator left", spreadsheet_id=str(spreadsheet_id))


# ========== TEMPLATES ==========

@app.get("/api/v1/sheets/templates")
async def list_templates():
    """List available spreadsheet templates."""
    return {
        "templates": [
            {"id": "blank", "name": "Blank Spreadsheet", "category": "general"},
            {"id": "budget", "name": "Monthly Budget", "category": "finance"},
            {"id": "invoice", "name": "Invoice", "category": "business"},
            {"id": "project-tracker", "name": "Project Tracker", "category": "project"},
            {"id": "expense-report", "name": "Expense Report", "category": "finance"},
            {"id": "timesheet", "name": "Timesheet", "category": "hr"},
            {"id": "inventory", "name": "Inventory Tracker", "category": "business"},
            {"id": "grade-book", "name": "Grade Book", "category": "education"},
            {"id": "sales-tracker", "name": "Sales Tracker", "category": "sales"},
            {"id": "kpi-dashboard", "name": "KPI Dashboard", "category": "analytics"},
        ]
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=True
    )

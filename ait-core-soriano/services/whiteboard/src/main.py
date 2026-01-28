"""
AI-Whiteboard Service - Pizarra Colaborativa para AI-Suite
Puerto: 8019
Características:
- Canvas infinito
- Dibujo vectorial y formas
- Sticky notes y texto
- Diagramas y conectores
- Colaboración en tiempo real
- AI: Generación de diagramas, reconocimiento de formas
"""

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timedelta
from enum import Enum
import uuid
import json

app = FastAPI(
    title="AI-Whiteboard Service",
    description="Pizarra Colaborativa con IA para AI-Suite",
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

class ElementType(str, Enum):
    RECTANGLE = "rectangle"
    ELLIPSE = "ellipse"
    TRIANGLE = "triangle"
    DIAMOND = "diamond"
    LINE = "line"
    ARROW = "arrow"
    FREEHAND = "freehand"
    TEXT = "text"
    STICKY_NOTE = "sticky_note"
    IMAGE = "image"
    ICON = "icon"
    CONNECTOR = "connector"
    FRAME = "frame"
    GROUP = "group"
    # Diagram elements
    FLOWCHART_PROCESS = "flowchart_process"
    FLOWCHART_DECISION = "flowchart_decision"
    FLOWCHART_TERMINAL = "flowchart_terminal"
    FLOWCHART_DATA = "flowchart_data"
    UML_CLASS = "uml_class"
    UML_ACTOR = "uml_actor"
    UML_USECASE = "uml_usecase"
    MINDMAP_NODE = "mindmap_node"
    ER_ENTITY = "er_entity"
    WIREFRAME_BUTTON = "wireframe_button"
    WIREFRAME_INPUT = "wireframe_input"
    WIREFRAME_TEXT = "wireframe_text"

class ConnectorType(str, Enum):
    STRAIGHT = "straight"
    ELBOW = "elbow"
    CURVED = "curved"

class LineStyle(str, Enum):
    SOLID = "solid"
    DASHED = "dashed"
    DOTTED = "dotted"

class ArrowHead(str, Enum):
    NONE = "none"
    ARROW = "arrow"
    TRIANGLE = "triangle"
    DIAMOND = "diamond"
    CIRCLE = "circle"

class BoardAccess(str, Enum):
    PRIVATE = "private"
    VIEW = "view"
    COMMENT = "comment"
    EDIT = "edit"

class ExportFormat(str, Enum):
    PNG = "png"
    SVG = "svg"
    PDF = "pdf"
    JSON = "json"

# ======================= MODELS =======================

class Point(BaseModel):
    x: float
    y: float

class Size(BaseModel):
    width: float
    height: float

class Style(BaseModel):
    fill_color: Optional[str] = "#ffffff"
    stroke_color: Optional[str] = "#000000"
    stroke_width: float = 2
    stroke_style: LineStyle = LineStyle.SOLID
    opacity: float = 1.0
    font_family: Optional[str] = "Inter"
    font_size: Optional[int] = 16
    font_weight: Optional[str] = "normal"
    font_style: Optional[str] = "normal"
    text_align: Optional[str] = "center"
    border_radius: Optional[float] = 0
    shadow: Optional[Dict[str, Any]] = None

class Element(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ElementType
    position: Point
    size: Optional[Size] = None
    rotation: float = 0
    style: Style = Style()
    # Content
    text: Optional[str] = None
    points: Optional[List[Point]] = None  # For freehand/lines
    image_url: Optional[str] = None
    icon_name: Optional[str] = None
    # Connector specific
    start_element_id: Optional[str] = None
    end_element_id: Optional[str] = None
    start_anchor: Optional[str] = None  # top, bottom, left, right, center
    end_anchor: Optional[str] = None
    connector_type: Optional[ConnectorType] = None
    start_arrow: Optional[ArrowHead] = None
    end_arrow: Optional[ArrowHead] = None
    # Group specific
    children: List[str] = []
    # Frame specific
    frame_label: Optional[str] = None
    # UML/Diagram specific
    properties: Dict[str, Any] = {}
    # Metadata
    locked: bool = False
    visible: bool = True
    z_index: int = 0
    created_by: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Layer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    visible: bool = True
    locked: bool = False
    opacity: float = 1.0
    elements: List[str] = []
    order: int = 0

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    board_id: str
    element_id: Optional[str] = None
    position: Point
    text: str
    author_id: str
    author_name: str
    resolved: bool = False
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    replies: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Board(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    # Canvas
    canvas_width: int = 10000
    canvas_height: int = 10000
    background_color: str = "#ffffff"
    grid_enabled: bool = True
    grid_size: int = 20
    snap_to_grid: bool = False
    # Content
    elements: Dict[str, Element] = {}
    layers: List[Layer] = []
    # Collaboration
    owner_id: str
    collaborators: Dict[str, BoardAccess] = {}
    is_public: bool = False
    public_access: BoardAccess = BoardAccess.VIEW
    # Metadata
    folder_id: Optional[str] = None
    tags: List[str] = []
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BoardVersion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    board_id: str
    version: int
    snapshot: Dict[str, Any]
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None

class Template(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    category: str
    thumbnail_url: Optional[str] = None
    elements: Dict[str, Dict[str, Any]] = {}
    canvas_settings: Dict[str, Any] = {}
    is_public: bool = True
    usage_count: int = 0
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Folder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    parent_id: Optional[str] = None
    owner_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Cursor(BaseModel):
    user_id: str
    user_name: str
    position: Point
    color: str
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class Selection(BaseModel):
    user_id: str
    element_ids: List[str]

# ======================= STORAGE =======================

boards: Dict[str, Board] = {}
board_versions: Dict[str, BoardVersion] = {}
templates: Dict[str, Template] = {}
folders: Dict[str, Folder] = {}
comments: Dict[str, Comment] = {}

# Real-time state
active_cursors: Dict[str, Dict[str, Cursor]] = {}  # board_id -> user_id -> cursor
active_selections: Dict[str, Dict[str, Selection]] = {}  # board_id -> user_id -> selection
connected_users: Dict[str, List[WebSocket]] = {}  # board_id -> websockets

# ======================= REQUEST MODELS =======================

class BoardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    owner_id: str
    folder_id: Optional[str] = None
    template_id: Optional[str] = None

class ElementCreate(BaseModel):
    type: ElementType
    position: Point
    size: Optional[Size] = None
    style: Optional[Style] = None
    text: Optional[str] = None
    points: Optional[List[Point]] = None
    created_by: str

class ConnectorCreate(BaseModel):
    start_element_id: str
    end_element_id: str
    connector_type: ConnectorType = ConnectorType.STRAIGHT
    start_arrow: ArrowHead = ArrowHead.NONE
    end_arrow: ArrowHead = ArrowHead.ARROW
    style: Optional[Style] = None
    created_by: str

class CommentCreate(BaseModel):
    element_id: Optional[str] = None
    position: Point
    text: str
    author_id: str
    author_name: str

# ======================= HELPER FUNCTIONS =======================

def calculate_connector_path(
    start_element: Element,
    end_element: Element,
    connector_type: ConnectorType,
    start_anchor: str = "right",
    end_anchor: str = "left"
) -> List[Point]:
    """Calcula los puntos del path del conector"""
    # Get anchor positions
    def get_anchor_pos(element: Element, anchor: str) -> Point:
        if not element.size:
            return element.position

        cx = element.position.x + element.size.width / 2
        cy = element.position.y + element.size.height / 2

        anchors = {
            "top": Point(x=cx, y=element.position.y),
            "bottom": Point(x=cx, y=element.position.y + element.size.height),
            "left": Point(x=element.position.x, y=cy),
            "right": Point(x=element.position.x + element.size.width, y=cy),
            "center": Point(x=cx, y=cy)
        }
        return anchors.get(anchor, anchors["center"])

    start_pos = get_anchor_pos(start_element, start_anchor)
    end_pos = get_anchor_pos(end_element, end_anchor)

    if connector_type == ConnectorType.STRAIGHT:
        return [start_pos, end_pos]
    elif connector_type == ConnectorType.ELBOW:
        mid_x = (start_pos.x + end_pos.x) / 2
        return [
            start_pos,
            Point(x=mid_x, y=start_pos.y),
            Point(x=mid_x, y=end_pos.y),
            end_pos
        ]
    else:  # Curved
        ctrl_x = (start_pos.x + end_pos.x) / 2
        return [
            start_pos,
            Point(x=ctrl_x, y=start_pos.y),
            Point(x=ctrl_x, y=end_pos.y),
            end_pos
        ]

def generate_element_from_shape_recognition(points: List[Point]) -> Optional[Dict[str, Any]]:
    """Reconoce forma dibujada a mano y genera elemento"""
    if len(points) < 3:
        return None

    # Calculate bounding box
    xs = [p.x for p in points]
    ys = [p.y for p in points]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    width = max_x - min_x
    height = max_y - min_y

    # Check if closed shape
    first, last = points[0], points[-1]
    is_closed = abs(first.x - last.x) < 20 and abs(first.y - last.y) < 20

    if not is_closed:
        # Line or arrow
        return {
            "type": ElementType.LINE,
            "points": points
        }

    # Check aspect ratio
    aspect_ratio = width / height if height > 0 else 1

    # Check if roughly circular
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    avg_radius = (width + height) / 4

    distances = [((p.x - center_x)**2 + (p.y - center_y)**2)**0.5 for p in points]
    avg_dist = sum(distances) / len(distances)
    variance = sum((d - avg_dist)**2 for d in distances) / len(distances)

    if variance < (avg_radius * 0.3)**2:  # Low variance = circle
        return {
            "type": ElementType.ELLIPSE,
            "position": Point(x=min_x, y=min_y),
            "size": Size(width=width, height=height)
        }

    # Check corners for rectangle/diamond
    if 0.8 <= aspect_ratio <= 1.2:
        # Could be square or diamond
        return {
            "type": ElementType.RECTANGLE,
            "position": Point(x=min_x, y=min_y),
            "size": Size(width=width, height=height)
        }
    else:
        return {
            "type": ElementType.RECTANGLE,
            "position": Point(x=min_x, y=min_y),
            "size": Size(width=width, height=height)
        }

async def broadcast_to_board(board_id: str, message: Dict[str, Any], exclude_user: Optional[str] = None):
    """Envía mensaje a todos los usuarios conectados a un board"""
    if board_id in connected_users:
        for ws in connected_users[board_id]:
            try:
                if exclude_user is None or ws.user_id != exclude_user:
                    await ws.send_json(message)
            except:
                pass

# ======================= BOARD ENDPOINTS =======================

@app.post("/boards", response_model=Board)
async def create_board(data: BoardCreate):
    """Crear nuevo board"""
    board = Board(
        name=data.name,
        description=data.description,
        owner_id=data.owner_id,
        folder_id=data.folder_id
    )

    # Create default layer
    default_layer = Layer(name="Layer 1", order=0)
    board.layers.append(default_layer)

    # Apply template if specified
    if data.template_id and data.template_id in templates:
        template = templates[data.template_id]
        for elem_id, elem_data in template.elements.items():
            elem = Element(**elem_data)
            elem.id = str(uuid.uuid4())
            board.elements[elem.id] = elem
            default_layer.elements.append(elem.id)
        template.usage_count += 1

    boards[board.id] = board
    return board

@app.get("/boards", response_model=List[Board])
async def list_boards(
    owner_id: Optional[str] = None,
    folder_id: Optional[str] = None,
    is_public: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Listar boards"""
    result = list(boards.values())

    if owner_id:
        result = [b for b in result if b.owner_id == owner_id or owner_id in b.collaborators]
    if folder_id:
        result = [b for b in result if b.folder_id == folder_id]
    if is_public is not None:
        result = [b for b in result if b.is_public == is_public]
    if search:
        search_lower = search.lower()
        result = [b for b in result if
                  search_lower in b.name.lower() or
                  (b.description and search_lower in b.description.lower())]

    result = sorted(result, key=lambda x: x.updated_at, reverse=True)
    return result[skip:skip + limit]

@app.get("/boards/{board_id}", response_model=Board)
async def get_board(board_id: str):
    """Obtener board"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")
    return boards[board_id]

@app.put("/boards/{board_id}", response_model=Board)
async def update_board(board_id: str, data: Dict[str, Any]):
    """Actualizar board"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]

    # Update allowed fields
    allowed_fields = ["name", "description", "background_color", "grid_enabled",
                      "grid_size", "snap_to_grid", "is_public", "public_access", "tags"]

    for key, value in data.items():
        if key in allowed_fields:
            setattr(board, key, value)

    board.updated_at = datetime.utcnow()
    board.version += 1

    return board

@app.delete("/boards/{board_id}")
async def delete_board(board_id: str):
    """Eliminar board"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    del boards[board_id]

    # Clean up related data
    comments_to_delete = [c.id for c in comments.values() if c.board_id == board_id]
    for cid in comments_to_delete:
        del comments[cid]

    return {"message": "Board deleted"}

@app.post("/boards/{board_id}/duplicate")
async def duplicate_board(board_id: str, new_name: str, owner_id: str):
    """Duplicar board"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    original = boards[board_id]

    new_board = Board(
        name=new_name,
        description=original.description,
        owner_id=owner_id,
        background_color=original.background_color,
        grid_enabled=original.grid_enabled,
        grid_size=original.grid_size,
        snap_to_grid=original.snap_to_grid
    )

    # Copy elements with new IDs
    id_mapping = {}
    for old_id, elem in original.elements.items():
        new_elem = elem.model_copy()
        new_elem.id = str(uuid.uuid4())
        new_elem.created_at = datetime.utcnow()
        id_mapping[old_id] = new_elem.id
        new_board.elements[new_elem.id] = new_elem

    # Update references (connectors, groups)
    for elem in new_board.elements.values():
        if elem.start_element_id:
            elem.start_element_id = id_mapping.get(elem.start_element_id, elem.start_element_id)
        if elem.end_element_id:
            elem.end_element_id = id_mapping.get(elem.end_element_id, elem.end_element_id)
        if elem.children:
            elem.children = [id_mapping.get(c, c) for c in elem.children]

    # Copy layers
    for layer in original.layers:
        new_layer = layer.model_copy()
        new_layer.id = str(uuid.uuid4())
        new_layer.elements = [id_mapping.get(e, e) for e in layer.elements]
        new_board.layers.append(new_layer)

    boards[new_board.id] = new_board
    return new_board

@app.post("/boards/{board_id}/share")
async def share_board(
    board_id: str,
    user_id: str,
    access: BoardAccess
):
    """Compartir board"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]
    board.collaborators[user_id] = access
    board.updated_at = datetime.utcnow()

    return {"message": "Board shared", "collaborators": board.collaborators}

@app.post("/boards/{board_id}/version")
async def create_version(board_id: str, user_id: str, description: Optional[str] = None):
    """Crear versión del board"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]

    version = BoardVersion(
        board_id=board_id,
        version=board.version,
        snapshot={
            "elements": {k: v.model_dump() for k, v in board.elements.items()},
            "layers": [l.model_dump() for l in board.layers]
        },
        created_by=user_id,
        description=description
    )
    board_versions[version.id] = version

    return version

@app.get("/boards/{board_id}/versions", response_model=List[BoardVersion])
async def list_versions(board_id: str):
    """Listar versiones de board"""
    return sorted(
        [v for v in board_versions.values() if v.board_id == board_id],
        key=lambda x: x.version,
        reverse=True
    )

@app.post("/boards/{board_id}/restore/{version_id}")
async def restore_version(board_id: str, version_id: str):
    """Restaurar versión"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")
    if version_id not in board_versions:
        raise HTTPException(status_code=404, detail="Version not found")

    board = boards[board_id]
    version = board_versions[version_id]

    # Restore elements
    board.elements = {
        k: Element(**v) for k, v in version.snapshot["elements"].items()
    }

    # Restore layers
    board.layers = [Layer(**l) for l in version.snapshot["layers"]]

    board.version += 1
    board.updated_at = datetime.utcnow()

    return board

# ======================= ELEMENT ENDPOINTS =======================

@app.post("/boards/{board_id}/elements", response_model=Element)
async def create_element(board_id: str, data: ElementCreate):
    """Crear elemento"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]

    element = Element(
        type=data.type,
        position=data.position,
        size=data.size,
        style=data.style or Style(),
        text=data.text,
        points=data.points,
        created_by=data.created_by,
        z_index=len(board.elements)
    )

    board.elements[element.id] = element

    # Add to first layer if exists
    if board.layers:
        board.layers[0].elements.append(element.id)

    board.updated_at = datetime.utcnow()

    return element

@app.get("/boards/{board_id}/elements", response_model=List[Element])
async def list_elements(board_id: str):
    """Listar elementos"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    return list(boards[board_id].elements.values())

@app.get("/boards/{board_id}/elements/{element_id}", response_model=Element)
async def get_element(board_id: str, element_id: str):
    """Obtener elemento"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")
    if element_id not in boards[board_id].elements:
        raise HTTPException(status_code=404, detail="Element not found")

    return boards[board_id].elements[element_id]

@app.put("/boards/{board_id}/elements/{element_id}", response_model=Element)
async def update_element(board_id: str, element_id: str, data: Dict[str, Any]):
    """Actualizar elemento"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")
    if element_id not in boards[board_id].elements:
        raise HTTPException(status_code=404, detail="Element not found")

    board = boards[board_id]
    element = board.elements[element_id]

    if element.locked:
        raise HTTPException(status_code=400, detail="Element is locked")

    for key, value in data.items():
        if hasattr(element, key):
            if key == "position" and isinstance(value, dict):
                element.position = Point(**value)
            elif key == "size" and isinstance(value, dict):
                element.size = Size(**value)
            elif key == "style" and isinstance(value, dict):
                for style_key, style_value in value.items():
                    if hasattr(element.style, style_key):
                        setattr(element.style, style_key, style_value)
            else:
                setattr(element, key, value)

    element.updated_at = datetime.utcnow()
    board.updated_at = datetime.utcnow()

    return element

@app.delete("/boards/{board_id}/elements/{element_id}")
async def delete_element(board_id: str, element_id: str):
    """Eliminar elemento"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")
    if element_id not in boards[board_id].elements:
        raise HTTPException(status_code=404, detail="Element not found")

    board = boards[board_id]
    del board.elements[element_id]

    # Remove from layers
    for layer in board.layers:
        if element_id in layer.elements:
            layer.elements.remove(element_id)

    # Remove connectors attached to this element
    connectors_to_delete = [
        e.id for e in board.elements.values()
        if e.type == ElementType.CONNECTOR and
        (e.start_element_id == element_id or e.end_element_id == element_id)
    ]
    for cid in connectors_to_delete:
        del board.elements[cid]

    board.updated_at = datetime.utcnow()

    return {"message": "Element deleted"}

@app.post("/boards/{board_id}/elements/batch")
async def batch_create_elements(board_id: str, elements: List[ElementCreate]):
    """Crear múltiples elementos"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]
    created = []

    for data in elements:
        element = Element(
            type=data.type,
            position=data.position,
            size=data.size,
            style=data.style or Style(),
            text=data.text,
            points=data.points,
            created_by=data.created_by,
            z_index=len(board.elements) + len(created)
        )
        board.elements[element.id] = element
        if board.layers:
            board.layers[0].elements.append(element.id)
        created.append(element)

    board.updated_at = datetime.utcnow()

    return {"created": len(created), "elements": created}

@app.put("/boards/{board_id}/elements/batch")
async def batch_update_elements(board_id: str, updates: List[Dict[str, Any]]):
    """Actualizar múltiples elementos"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]
    updated = []

    for update in updates:
        element_id = update.pop("id", None)
        if element_id and element_id in board.elements:
            element = board.elements[element_id]
            if not element.locked:
                for key, value in update.items():
                    if hasattr(element, key):
                        if key == "position" and isinstance(value, dict):
                            element.position = Point(**value)
                        elif key == "size" and isinstance(value, dict):
                            element.size = Size(**value)
                        else:
                            setattr(element, key, value)
                element.updated_at = datetime.utcnow()
                updated.append(element_id)

    board.updated_at = datetime.utcnow()

    return {"updated": len(updated)}

@app.delete("/boards/{board_id}/elements/batch")
async def batch_delete_elements(board_id: str, element_ids: List[str]):
    """Eliminar múltiples elementos"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]
    deleted = 0

    for element_id in element_ids:
        if element_id in board.elements:
            del board.elements[element_id]
            for layer in board.layers:
                if element_id in layer.elements:
                    layer.elements.remove(element_id)
            deleted += 1

    board.updated_at = datetime.utcnow()

    return {"deleted": deleted}

# ======================= CONNECTOR ENDPOINTS =======================

@app.post("/boards/{board_id}/connectors", response_model=Element)
async def create_connector(board_id: str, data: ConnectorCreate):
    """Crear conector entre elementos"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]

    if data.start_element_id not in board.elements:
        raise HTTPException(status_code=404, detail="Start element not found")
    if data.end_element_id not in board.elements:
        raise HTTPException(status_code=404, detail="End element not found")

    start_elem = board.elements[data.start_element_id]
    end_elem = board.elements[data.end_element_id]

    # Calculate path
    points = calculate_connector_path(start_elem, end_elem, data.connector_type)

    connector = Element(
        type=ElementType.CONNECTOR,
        position=points[0],
        points=points,
        start_element_id=data.start_element_id,
        end_element_id=data.end_element_id,
        start_anchor="right",
        end_anchor="left",
        connector_type=data.connector_type,
        start_arrow=data.start_arrow,
        end_arrow=data.end_arrow,
        style=data.style or Style(),
        created_by=data.created_by,
        z_index=len(board.elements)
    )

    board.elements[connector.id] = connector
    if board.layers:
        board.layers[0].elements.append(connector.id)

    board.updated_at = datetime.utcnow()

    return connector

# ======================= GROUP ENDPOINTS =======================

@app.post("/boards/{board_id}/group")
async def group_elements(board_id: str, element_ids: List[str], created_by: str):
    """Agrupar elementos"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]

    # Verify all elements exist
    for eid in element_ids:
        if eid not in board.elements:
            raise HTTPException(status_code=404, detail=f"Element {eid} not found")

    # Calculate bounding box
    elements = [board.elements[eid] for eid in element_ids]
    min_x = min(e.position.x for e in elements)
    min_y = min(e.position.y for e in elements)
    max_x = max(e.position.x + (e.size.width if e.size else 0) for e in elements)
    max_y = max(e.position.y + (e.size.height if e.size else 0) for e in elements)

    group = Element(
        type=ElementType.GROUP,
        position=Point(x=min_x, y=min_y),
        size=Size(width=max_x - min_x, height=max_y - min_y),
        children=element_ids,
        created_by=created_by,
        z_index=len(board.elements)
    )

    board.elements[group.id] = group
    board.updated_at = datetime.utcnow()

    return group

@app.post("/boards/{board_id}/ungroup/{group_id}")
async def ungroup_elements(board_id: str, group_id: str):
    """Desagrupar elementos"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]

    if group_id not in board.elements:
        raise HTTPException(status_code=404, detail="Group not found")

    group = board.elements[group_id]
    if group.type != ElementType.GROUP:
        raise HTTPException(status_code=400, detail="Element is not a group")

    children = group.children
    del board.elements[group_id]

    board.updated_at = datetime.utcnow()

    return {"ungrouped": children}

# ======================= LAYER ENDPOINTS =======================

@app.post("/boards/{board_id}/layers", response_model=Layer)
async def create_layer(board_id: str, name: str):
    """Crear capa"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]

    layer = Layer(
        name=name,
        order=len(board.layers)
    )
    board.layers.append(layer)
    board.updated_at = datetime.utcnow()

    return layer

@app.put("/boards/{board_id}/layers/{layer_id}")
async def update_layer(board_id: str, layer_id: str, data: Dict[str, Any]):
    """Actualizar capa"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]
    layer = next((l for l in board.layers if l.id == layer_id), None)

    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")

    for key, value in data.items():
        if hasattr(layer, key):
            setattr(layer, key, value)

    board.updated_at = datetime.utcnow()

    return layer

@app.put("/boards/{board_id}/layers/reorder")
async def reorder_layers(board_id: str, layer_ids: List[str]):
    """Reordenar capas"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]

    # Reorder
    layer_dict = {l.id: l for l in board.layers}
    board.layers = []

    for i, lid in enumerate(layer_ids):
        if lid in layer_dict:
            layer_dict[lid].order = i
            board.layers.append(layer_dict[lid])

    board.updated_at = datetime.utcnow()

    return {"layers": [l.id for l in board.layers]}

# ======================= COMMENT ENDPOINTS =======================

@app.post("/boards/{board_id}/comments", response_model=Comment)
async def create_comment(board_id: str, data: CommentCreate):
    """Crear comentario"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    comment = Comment(
        board_id=board_id,
        element_id=data.element_id,
        position=data.position,
        text=data.text,
        author_id=data.author_id,
        author_name=data.author_name
    )
    comments[comment.id] = comment

    return comment

@app.get("/boards/{board_id}/comments", response_model=List[Comment])
async def list_comments(board_id: str, resolved: Optional[bool] = None):
    """Listar comentarios"""
    result = [c for c in comments.values() if c.board_id == board_id]
    if resolved is not None:
        result = [c for c in result if c.resolved == resolved]
    return result

@app.post("/boards/{board_id}/comments/{comment_id}/reply")
async def reply_to_comment(
    board_id: str,
    comment_id: str,
    text: str,
    author_id: str,
    author_name: str
):
    """Responder a comentario"""
    if comment_id not in comments:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment = comments[comment_id]
    comment.replies.append({
        "id": str(uuid.uuid4()),
        "text": text,
        "author_id": author_id,
        "author_name": author_name,
        "created_at": datetime.utcnow().isoformat()
    })

    return comment

@app.put("/boards/{board_id}/comments/{comment_id}/resolve")
async def resolve_comment(board_id: str, comment_id: str, user_id: str):
    """Resolver comentario"""
    if comment_id not in comments:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment = comments[comment_id]
    comment.resolved = True
    comment.resolved_by = user_id
    comment.resolved_at = datetime.utcnow()

    return comment

# ======================= TEMPLATE ENDPOINTS =======================

@app.post("/templates", response_model=Template)
async def create_template(
    name: str,
    category: str,
    board_id: str,
    created_by: str,
    description: Optional[str] = None
):
    """Crear template desde board"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]

    template = Template(
        name=name,
        description=description,
        category=category,
        elements={k: v.model_dump() for k, v in board.elements.items()},
        canvas_settings={
            "background_color": board.background_color,
            "grid_enabled": board.grid_enabled,
            "grid_size": board.grid_size
        },
        created_by=created_by
    )
    templates[template.id] = template

    return template

@app.get("/templates", response_model=List[Template])
async def list_templates(
    category: Optional[str] = None,
    is_public: bool = True
):
    """Listar templates"""
    result = list(templates.values())
    if category:
        result = [t for t in result if t.category == category]
    if is_public is not None:
        result = [t for t in result if t.is_public == is_public]
    return sorted(result, key=lambda x: x.usage_count, reverse=True)

@app.get("/templates/categories")
async def get_template_categories():
    """Obtener categorías de templates"""
    categories = set(t.category for t in templates.values())
    return list(categories)

# ======================= EXPORT ENDPOINTS =======================

@app.post("/boards/{board_id}/export")
async def export_board(
    board_id: str,
    format: ExportFormat = ExportFormat.PNG,
    selection: Optional[List[str]] = None
):
    """Exportar board"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]

    # In production, this would render the board to the requested format
    return {
        "board_id": board_id,
        "format": format,
        "download_url": f"/downloads/{board_id}.{format.value}",
        "elements_count": len(selection) if selection else len(board.elements)
    }

@app.get("/boards/{board_id}/export/json")
async def export_board_json(board_id: str):
    """Exportar board como JSON"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]

    return {
        "name": board.name,
        "canvas": {
            "width": board.canvas_width,
            "height": board.canvas_height,
            "background": board.background_color
        },
        "elements": [e.model_dump() for e in board.elements.values()],
        "layers": [l.model_dump() for l in board.layers],
        "exported_at": datetime.utcnow().isoformat()
    }

# ======================= AI FEATURES =======================

@app.post("/ai/recognize-shape")
async def ai_recognize_shape(points: List[Point]):
    """Reconocer forma dibujada a mano"""
    result = generate_element_from_shape_recognition(points)

    if result:
        return {
            "recognized": True,
            "suggested_element": result,
            "confidence": 0.85
        }
    else:
        return {
            "recognized": False,
            "message": "Could not recognize shape"
        }

@app.post("/ai/generate-diagram")
async def ai_generate_diagram(
    type: str,  # flowchart, mindmap, org_chart, uml, er, wireframe
    description: str,
    style: Optional[str] = "modern"
):
    """Generar diagrama con IA"""

    diagram_templates = {
        "flowchart": {
            "elements": [
                {"type": ElementType.FLOWCHART_TERMINAL, "text": "Inicio", "position": {"x": 300, "y": 50}},
                {"type": ElementType.FLOWCHART_PROCESS, "text": "Proceso 1", "position": {"x": 300, "y": 150}},
                {"type": ElementType.FLOWCHART_DECISION, "text": "Decisión", "position": {"x": 300, "y": 250}},
                {"type": ElementType.FLOWCHART_PROCESS, "text": "Proceso 2", "position": {"x": 200, "y": 350}},
                {"type": ElementType.FLOWCHART_PROCESS, "text": "Proceso 3", "position": {"x": 400, "y": 350}},
                {"type": ElementType.FLOWCHART_TERMINAL, "text": "Fin", "position": {"x": 300, "y": 450}}
            ],
            "connectors": [
                {"from": 0, "to": 1},
                {"from": 1, "to": 2},
                {"from": 2, "to": 3, "label": "Sí"},
                {"from": 2, "to": 4, "label": "No"},
                {"from": 3, "to": 5},
                {"from": 4, "to": 5}
            ]
        },
        "mindmap": {
            "elements": [
                {"type": ElementType.MINDMAP_NODE, "text": "Idea Central", "position": {"x": 400, "y": 300}, "style": {"fill_color": "#4CAF50"}},
                {"type": ElementType.MINDMAP_NODE, "text": "Rama 1", "position": {"x": 200, "y": 150}},
                {"type": ElementType.MINDMAP_NODE, "text": "Rama 2", "position": {"x": 600, "y": 150}},
                {"type": ElementType.MINDMAP_NODE, "text": "Rama 3", "position": {"x": 200, "y": 450}},
                {"type": ElementType.MINDMAP_NODE, "text": "Rama 4", "position": {"x": 600, "y": 450}},
                {"type": ElementType.MINDMAP_NODE, "text": "Sub-rama 1.1", "position": {"x": 50, "y": 100}},
                {"type": ElementType.MINDMAP_NODE, "text": "Sub-rama 1.2", "position": {"x": 50, "y": 200}}
            ],
            "connectors": [
                {"from": 0, "to": 1},
                {"from": 0, "to": 2},
                {"from": 0, "to": 3},
                {"from": 0, "to": 4},
                {"from": 1, "to": 5},
                {"from": 1, "to": 6}
            ]
        },
        "org_chart": {
            "elements": [
                {"type": ElementType.RECTANGLE, "text": "CEO", "position": {"x": 350, "y": 50}, "size": {"width": 100, "height": 50}},
                {"type": ElementType.RECTANGLE, "text": "CTO", "position": {"x": 150, "y": 150}, "size": {"width": 100, "height": 50}},
                {"type": ElementType.RECTANGLE, "text": "CFO", "position": {"x": 350, "y": 150}, "size": {"width": 100, "height": 50}},
                {"type": ElementType.RECTANGLE, "text": "COO", "position": {"x": 550, "y": 150}, "size": {"width": 100, "height": 50}},
                {"type": ElementType.RECTANGLE, "text": "Dev Lead", "position": {"x": 100, "y": 250}, "size": {"width": 80, "height": 40}},
                {"type": ElementType.RECTANGLE, "text": "DevOps", "position": {"x": 200, "y": 250}, "size": {"width": 80, "height": 40}}
            ],
            "connectors": [
                {"from": 0, "to": 1},
                {"from": 0, "to": 2},
                {"from": 0, "to": 3},
                {"from": 1, "to": 4},
                {"from": 1, "to": 5}
            ]
        },
        "uml": {
            "elements": [
                {"type": ElementType.UML_CLASS, "text": "User", "position": {"x": 100, "y": 100}, "properties": {"attributes": ["id: int", "name: string", "email: string"], "methods": ["login()", "logout()"]}},
                {"type": ElementType.UML_CLASS, "text": "Order", "position": {"x": 350, "y": 100}, "properties": {"attributes": ["id: int", "total: float", "status: string"], "methods": ["create()", "cancel()"]}},
                {"type": ElementType.UML_CLASS, "text": "Product", "position": {"x": 350, "y": 300}, "properties": {"attributes": ["id: int", "name: string", "price: float"], "methods": ["getStock()"]}}
            ],
            "connectors": [
                {"from": 0, "to": 1, "label": "places"},
                {"from": 1, "to": 2, "label": "contains"}
            ]
        },
        "wireframe": {
            "elements": [
                {"type": ElementType.FRAME, "text": "Header", "position": {"x": 50, "y": 50}, "size": {"width": 400, "height": 60}},
                {"type": ElementType.WIREFRAME_INPUT, "text": "Search...", "position": {"x": 250, "y": 65}, "size": {"width": 150, "height": 30}},
                {"type": ElementType.WIREFRAME_BUTTON, "text": "Login", "position": {"x": 350, "y": 65}, "size": {"width": 80, "height": 30}},
                {"type": ElementType.FRAME, "text": "Content", "position": {"x": 50, "y": 130}, "size": {"width": 400, "height": 300}},
                {"type": ElementType.WIREFRAME_TEXT, "text": "Welcome to our app", "position": {"x": 150, "y": 200}},
                {"type": ElementType.WIREFRAME_BUTTON, "text": "Get Started", "position": {"x": 175, "y": 280}, "size": {"width": 150, "height": 40}}
            ],
            "connectors": []
        }
    }

    template = diagram_templates.get(type, diagram_templates["flowchart"])

    return {
        "type": type,
        "description": description,
        "generated_elements": template["elements"],
        "connectors": template["connectors"],
        "style": style,
        "message": f"Generated {type} diagram with {len(template['elements'])} elements"
    }

@app.post("/ai/beautify")
async def ai_beautify_layout(board_id: str):
    """Reorganizar elementos para mejor diseño"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]
    elements = list(board.elements.values())

    # Simple grid layout
    grid_size = 150
    padding = 50
    cols = 4
    row = 0
    col = 0

    for elem in elements:
        if elem.type not in [ElementType.CONNECTOR, ElementType.LINE]:
            elem.position = Point(
                x=padding + col * grid_size,
                y=padding + row * grid_size
            )
            col += 1
            if col >= cols:
                col = 0
                row += 1
            elem.updated_at = datetime.utcnow()

    board.updated_at = datetime.utcnow()

    return {
        "board_id": board_id,
        "elements_repositioned": len([e for e in elements if e.type not in [ElementType.CONNECTOR, ElementType.LINE]]),
        "message": "Layout beautified"
    }

@app.post("/ai/suggest-colors")
async def ai_suggest_colors(theme: str = "professional"):
    """Sugerir paleta de colores"""
    palettes = {
        "professional": {
            "name": "Professional",
            "colors": ["#2C3E50", "#3498DB", "#1ABC9C", "#9B59B6", "#F39C12"],
            "background": "#FFFFFF",
            "text": "#2C3E50"
        },
        "vibrant": {
            "name": "Vibrant",
            "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
            "background": "#FFFFFF",
            "text": "#2C3E50"
        },
        "pastel": {
            "name": "Pastel",
            "colors": ["#FFB3BA", "#BAFFC9", "#BAE1FF", "#FFFFBA", "#E8DAEF"],
            "background": "#FAFAFA",
            "text": "#555555"
        },
        "dark": {
            "name": "Dark Mode",
            "colors": ["#6C5CE7", "#00CEC9", "#FD79A8", "#FDCB6E", "#00B894"],
            "background": "#1E1E2E",
            "text": "#FFFFFF"
        },
        "corporate": {
            "name": "Corporate",
            "colors": ["#003366", "#336699", "#6699CC", "#99CCFF", "#CCE5FF"],
            "background": "#FFFFFF",
            "text": "#003366"
        }
    }

    palette = palettes.get(theme, palettes["professional"])

    return {
        "theme": theme,
        "palette": palette,
        "usage_tips": [
            f"Use {palette['colors'][0]} for primary elements",
            f"Use {palette['colors'][1]} for secondary elements",
            f"Use {palette['colors'][2]} for accents",
            f"Background: {palette['background']}",
            f"Text: {palette['text']}"
        ]
    }

@app.post("/ai/text-to-diagram")
async def ai_text_to_diagram(text: str, diagram_type: str = "auto"):
    """Convertir texto en diagrama"""

    # Analyze text for diagram type
    text_lower = text.lower()

    if diagram_type == "auto":
        if any(word in text_lower for word in ["if", "then", "else", "process", "start", "end"]):
            diagram_type = "flowchart"
        elif any(word in text_lower for word in ["class", "method", "attribute", "inherit"]):
            diagram_type = "uml"
        elif any(word in text_lower for word in ["idea", "branch", "topic", "subtopic"]):
            diagram_type = "mindmap"
        elif any(word in text_lower for word in ["manager", "team", "department", "reports to"]):
            diagram_type = "org_chart"
        else:
            diagram_type = "flowchart"

    # Parse text into nodes (simplified)
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    nodes = []
    for i, line in enumerate(lines[:8]):  # Limit to 8 nodes
        nodes.append({
            "id": i,
            "text": line[:30],  # Truncate
            "position": {"x": 200 + (i % 3) * 200, "y": 100 + (i // 3) * 150}
        })

    return {
        "detected_type": diagram_type,
        "nodes": nodes,
        "connectors": [{"from": i, "to": i+1} for i in range(len(nodes)-1)],
        "message": f"Generated {len(nodes)} nodes from text"
    }

@app.post("/ai/smart-connect")
async def ai_smart_connect(board_id: str):
    """Conectar elementos automáticamente basado en proximidad y tipo"""
    if board_id not in boards:
        raise HTTPException(status_code=404, detail="Board not found")

    board = boards[board_id]
    elements = [e for e in board.elements.values()
                if e.type not in [ElementType.CONNECTOR, ElementType.LINE, ElementType.FREEHAND]]

    connections_created = 0

    # Simple proximity-based connection
    for i, elem1 in enumerate(elements):
        for elem2 in elements[i+1:]:
            # Check if already connected
            already_connected = any(
                c for c in board.elements.values()
                if c.type == ElementType.CONNECTOR and
                ((c.start_element_id == elem1.id and c.end_element_id == elem2.id) or
                 (c.start_element_id == elem2.id and c.end_element_id == elem1.id))
            )

            if already_connected:
                continue

            # Calculate distance
            if elem1.size and elem2.size:
                center1_x = elem1.position.x + elem1.size.width / 2
                center1_y = elem1.position.y + elem1.size.height / 2
                center2_x = elem2.position.x + elem2.size.width / 2
                center2_y = elem2.position.y + elem2.size.height / 2

                distance = ((center2_x - center1_x)**2 + (center2_y - center1_y)**2)**0.5

                # Connect if close enough
                if distance < 300:
                    connector = Element(
                        type=ElementType.CONNECTOR,
                        position=elem1.position,
                        start_element_id=elem1.id,
                        end_element_id=elem2.id,
                        connector_type=ConnectorType.ELBOW,
                        end_arrow=ArrowHead.ARROW
                    )
                    board.elements[connector.id] = connector
                    connections_created += 1

    board.updated_at = datetime.utcnow()

    return {
        "board_id": board_id,
        "connections_created": connections_created
    }

# ======================= WEBSOCKET =======================

@app.websocket("/ws/{board_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, board_id: str, user_id: str):
    """WebSocket para colaboración en tiempo real"""
    await websocket.accept()

    # Store websocket with user info
    websocket.user_id = user_id

    if board_id not in connected_users:
        connected_users[board_id] = []
    connected_users[board_id].append(websocket)

    # Initialize cursor tracking
    if board_id not in active_cursors:
        active_cursors[board_id] = {}

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["type"] == "cursor_move":
                # Update cursor position
                active_cursors[board_id][user_id] = Cursor(
                    user_id=user_id,
                    user_name=message.get("user_name", "Unknown"),
                    position=Point(**message["position"]),
                    color=message.get("color", "#FF0000")
                )
                # Broadcast to others
                await broadcast_to_board(board_id, {
                    "type": "cursor_update",
                    "cursors": {k: v.model_dump() for k, v in active_cursors[board_id].items()}
                }, exclude_user=user_id)

            elif message["type"] == "element_update":
                # Broadcast element changes
                await broadcast_to_board(board_id, message, exclude_user=user_id)

            elif message["type"] == "selection_change":
                if board_id not in active_selections:
                    active_selections[board_id] = {}
                active_selections[board_id][user_id] = Selection(
                    user_id=user_id,
                    element_ids=message.get("element_ids", [])
                )
                await broadcast_to_board(board_id, {
                    "type": "selection_update",
                    "selections": {k: v.model_dump() for k, v in active_selections[board_id].items()}
                }, exclude_user=user_id)

    except WebSocketDisconnect:
        connected_users[board_id].remove(websocket)
        if user_id in active_cursors.get(board_id, {}):
            del active_cursors[board_id][user_id]
        if user_id in active_selections.get(board_id, {}):
            del active_selections[board_id][user_id]

        # Broadcast user left
        await broadcast_to_board(board_id, {
            "type": "user_left",
            "user_id": user_id
        })

# ======================= HEALTH CHECK =======================

@app.get("/health")
async def health_check():
    """Health check del servicio"""
    return {
        "status": "healthy",
        "service": "ai-whiteboard",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/stats")
async def get_stats():
    """Estadísticas del servicio"""
    total_elements = sum(len(b.elements) for b in boards.values())
    return {
        "boards": len(boards),
        "total_elements": total_elements,
        "templates": len(templates),
        "folders": len(folders),
        "comments": len(comments),
        "active_sessions": sum(len(users) for users in connected_users.values())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8019)

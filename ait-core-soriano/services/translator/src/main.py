"""
AI-Translator Service - Traducción Multilingüe para AI-Suite
Puerto: 8020
Características:
- Traducción de texto
- Traducción de documentos
- Detección de idioma
- Traducción en tiempo real
- Glosarios personalizados
- Memoria de traducción
- AI: Traducción contextual y adaptativa
"""

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta
from enum import Enum
import uuid
import json
import hashlib

app = FastAPI(
    title="AI-Translator Service",
    description="Traducción con IA para AI-Suite",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================= SUPPORTED LANGUAGES =======================

SUPPORTED_LANGUAGES = {
    "en": {"name": "English", "native": "English", "rtl": False},
    "es": {"name": "Spanish", "native": "Español", "rtl": False},
    "fr": {"name": "French", "native": "Français", "rtl": False},
    "de": {"name": "German", "native": "Deutsch", "rtl": False},
    "it": {"name": "Italian", "native": "Italiano", "rtl": False},
    "pt": {"name": "Portuguese", "native": "Português", "rtl": False},
    "nl": {"name": "Dutch", "native": "Nederlands", "rtl": False},
    "ru": {"name": "Russian", "native": "Русский", "rtl": False},
    "zh": {"name": "Chinese (Simplified)", "native": "简体中文", "rtl": False},
    "zh-TW": {"name": "Chinese (Traditional)", "native": "繁體中文", "rtl": False},
    "ja": {"name": "Japanese", "native": "日本語", "rtl": False},
    "ko": {"name": "Korean", "native": "한국어", "rtl": False},
    "ar": {"name": "Arabic", "native": "العربية", "rtl": True},
    "he": {"name": "Hebrew", "native": "עברית", "rtl": True},
    "hi": {"name": "Hindi", "native": "हिन्दी", "rtl": False},
    "th": {"name": "Thai", "native": "ไทย", "rtl": False},
    "vi": {"name": "Vietnamese", "native": "Tiếng Việt", "rtl": False},
    "pl": {"name": "Polish", "native": "Polski", "rtl": False},
    "tr": {"name": "Turkish", "native": "Türkçe", "rtl": False},
    "uk": {"name": "Ukrainian", "native": "Українська", "rtl": False},
    "cs": {"name": "Czech", "native": "Čeština", "rtl": False},
    "sv": {"name": "Swedish", "native": "Svenska", "rtl": False},
    "da": {"name": "Danish", "native": "Dansk", "rtl": False},
    "fi": {"name": "Finnish", "native": "Suomi", "rtl": False},
    "no": {"name": "Norwegian", "native": "Norsk", "rtl": False},
    "el": {"name": "Greek", "native": "Ελληνικά", "rtl": False},
    "hu": {"name": "Hungarian", "native": "Magyar", "rtl": False},
    "ro": {"name": "Romanian", "native": "Română", "rtl": False},
    "id": {"name": "Indonesian", "native": "Bahasa Indonesia", "rtl": False},
    "ms": {"name": "Malay", "native": "Bahasa Melayu", "rtl": False},
    "ca": {"name": "Catalan", "native": "Català", "rtl": False},
    "eu": {"name": "Basque", "native": "Euskara", "rtl": False},
    "gl": {"name": "Galician", "native": "Galego", "rtl": False}
}

# ======================= ENUMS =======================

class TranslationQuality(str, Enum):
    DRAFT = "draft"
    STANDARD = "standard"
    PREMIUM = "premium"
    HUMAN_REVIEWED = "human_reviewed"

class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class GlossaryType(str, Enum):
    GENERAL = "general"
    TECHNICAL = "technical"
    LEGAL = "legal"
    MEDICAL = "medical"
    FINANCIAL = "financial"
    MARKETING = "marketing"
    CUSTOM = "custom"

class ToneStyle(str, Enum):
    FORMAL = "formal"
    INFORMAL = "informal"
    NEUTRAL = "neutral"
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    ACADEMIC = "academic"

# ======================= MODELS =======================

class Translation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_text: str
    source_language: str
    target_language: str
    translated_text: str
    quality: TranslationQuality = TranslationQuality.STANDARD
    confidence: float = 0.95
    alternatives: List[str] = []
    glossary_id: Optional[str] = None
    tone: ToneStyle = ToneStyle.NEUTRAL
    context: Optional[str] = None
    word_count: int = 0
    character_count: int = 0
    processing_time_ms: int = 0
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TranslationMemoryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_text: str
    source_language: str
    target_language: str
    translated_text: str
    source_hash: str
    usage_count: int = 1
    quality_score: float = 1.0
    verified: bool = False
    verified_by: Optional[str] = None
    project_id: Optional[str] = None
    domain: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class GlossaryTerm(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_term: str
    translations: Dict[str, str] = {}  # language_code -> translation
    description: Optional[str] = None
    part_of_speech: Optional[str] = None  # noun, verb, adjective, etc.
    domain: Optional[str] = None
    do_not_translate: bool = False
    case_sensitive: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Glossary(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    type: GlossaryType = GlossaryType.GENERAL
    source_language: str
    target_languages: List[str] = []
    terms: Dict[str, GlossaryTerm] = {}
    is_public: bool = False
    owner_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    original_filename: str
    file_type: str  # pdf, docx, txt, html, json, xlsx
    file_size: int
    source_language: str
    target_languages: List[str]
    status: DocumentStatus = DocumentStatus.PENDING
    progress: int = 0  # 0-100
    segments_total: int = 0
    segments_translated: int = 0
    glossary_id: Optional[str] = None
    tone: ToneStyle = ToneStyle.NEUTRAL
    preserve_formatting: bool = True
    original_url: Optional[str] = None
    translated_urls: Dict[str, str] = {}  # language -> url
    error_message: Optional[str] = None
    owner_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    source_language: str
    target_languages: List[str]
    glossary_ids: List[str] = []
    default_tone: ToneStyle = ToneStyle.NEUTRAL
    documents: List[str] = []  # Document IDs
    translation_memory_enabled: bool = True
    owner_id: str
    collaborators: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LanguageDetectionResult(BaseModel):
    detected_language: str
    confidence: float
    alternatives: List[Dict[str, Any]] = []

class BatchTranslationJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_language: str
    target_languages: List[str]
    items: List[Dict[str, str]] = []  # [{key, text}]
    results: Dict[str, Dict[str, str]] = {}  # language -> {key: translated}
    status: str = "pending"  # pending, processing, completed, failed
    progress: int = 0
    total_items: int = 0
    completed_items: int = 0
    owner_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

# ======================= STORAGE =======================

translations: Dict[str, Translation] = {}
translation_memory: Dict[str, TranslationMemoryEntry] = {}
glossaries: Dict[str, Glossary] = {}
documents: Dict[str, Document] = {}
projects: Dict[str, Project] = {}
batch_jobs: Dict[str, BatchTranslationJob] = {}

# Cache for fast lookups
tm_index: Dict[str, str] = {}  # hash -> tm_entry_id

# WebSocket connections for real-time translation
active_connections: Dict[str, WebSocket] = {}

# ======================= MOCK TRANSLATION DATA =======================

# Simplified translation dictionary for demo
MOCK_TRANSLATIONS = {
    "en-es": {
        "hello": "hola",
        "world": "mundo",
        "good morning": "buenos días",
        "thank you": "gracias",
        "how are you": "cómo estás",
        "welcome": "bienvenido",
        "goodbye": "adiós"
    },
    "en-fr": {
        "hello": "bonjour",
        "world": "monde",
        "good morning": "bonjour",
        "thank you": "merci",
        "how are you": "comment allez-vous",
        "welcome": "bienvenue",
        "goodbye": "au revoir"
    },
    "en-de": {
        "hello": "hallo",
        "world": "welt",
        "good morning": "guten morgen",
        "thank you": "danke",
        "how are you": "wie geht es dir",
        "welcome": "willkommen",
        "goodbye": "auf wiedersehen"
    },
    "es-en": {
        "hola": "hello",
        "mundo": "world",
        "buenos días": "good morning",
        "gracias": "thank you",
        "cómo estás": "how are you",
        "bienvenido": "welcome",
        "adiós": "goodbye"
    }
}

# ======================= REQUEST MODELS =======================

class TranslateRequest(BaseModel):
    text: str
    source_language: Optional[str] = None  # Auto-detect if not provided
    target_language: str
    glossary_id: Optional[str] = None
    tone: ToneStyle = ToneStyle.NEUTRAL
    context: Optional[str] = None
    use_translation_memory: bool = True

class BatchTranslateRequest(BaseModel):
    texts: List[str]
    source_language: Optional[str] = None
    target_language: str
    glossary_id: Optional[str] = None

class GlossaryTermCreate(BaseModel):
    source_term: str
    translations: Dict[str, str]
    description: Optional[str] = None
    part_of_speech: Optional[str] = None
    do_not_translate: bool = False

class DocumentTranslateRequest(BaseModel):
    source_language: str
    target_languages: List[str]
    glossary_id: Optional[str] = None
    tone: ToneStyle = ToneStyle.NEUTRAL
    preserve_formatting: bool = True

# ======================= HELPER FUNCTIONS =======================

def generate_text_hash(text: str, source_lang: str, target_lang: str) -> str:
    """Genera hash único para texto y par de idiomas"""
    content = f"{text.lower().strip()}|{source_lang}|{target_lang}"
    return hashlib.md5(content.encode()).hexdigest()

def detect_language(text: str) -> LanguageDetectionResult:
    """Detecta el idioma del texto"""
    # Simplified detection based on character patterns
    text_lower = text.lower()

    # Check for specific characters/patterns
    if any(ord(c) > 0x4E00 and ord(c) < 0x9FFF for c in text):
        return LanguageDetectionResult(detected_language="zh", confidence=0.95, alternatives=[])

    if any(ord(c) > 0x3040 and ord(c) < 0x30FF for c in text):
        return LanguageDetectionResult(detected_language="ja", confidence=0.95, alternatives=[])

    if any(ord(c) > 0xAC00 and ord(c) < 0xD7AF for c in text):
        return LanguageDetectionResult(detected_language="ko", confidence=0.95, alternatives=[])

    if any(ord(c) > 0x0600 and ord(c) < 0x06FF for c in text):
        return LanguageDetectionResult(detected_language="ar", confidence=0.95, alternatives=[])

    if any(ord(c) > 0x0400 and ord(c) < 0x04FF for c in text):
        return LanguageDetectionResult(detected_language="ru", confidence=0.90, alternatives=[{"language": "uk", "confidence": 0.10}])

    # Spanish indicators
    spanish_words = ["hola", "gracias", "buenos", "cómo", "qué", "está", "es", "un", "una", "el", "la", "los", "las"]
    if any(word in text_lower for word in spanish_words):
        return LanguageDetectionResult(detected_language="es", confidence=0.85, alternatives=[{"language": "pt", "confidence": 0.10}])

    # French indicators
    french_words = ["bonjour", "merci", "comment", "je", "vous", "le", "la", "les", "un", "une", "est", "sont"]
    if any(word in text_lower for word in french_words):
        return LanguageDetectionResult(detected_language="fr", confidence=0.85, alternatives=[])

    # German indicators
    german_words = ["guten", "danke", "wie", "ich", "sie", "der", "die", "das", "und", "ist", "nicht"]
    if any(word in text_lower for word in german_words):
        return LanguageDetectionResult(detected_language="de", confidence=0.85, alternatives=[])

    # Default to English
    return LanguageDetectionResult(detected_language="en", confidence=0.80, alternatives=[])

def translate_text(
    text: str,
    source_lang: str,
    target_lang: str,
    glossary: Optional[Glossary] = None,
    tone: ToneStyle = ToneStyle.NEUTRAL
) -> Tuple[str, float, List[str]]:
    """Traduce texto usando diccionario mock y transformaciones"""
    import random

    if source_lang == target_lang:
        return text, 1.0, []

    # Check glossary first
    if glossary:
        for term in glossary.terms.values():
            if term.do_not_translate and term.source_term.lower() in text.lower():
                # Keep term as-is
                pass
            elif target_lang in term.translations:
                text = text.replace(term.source_term, term.translations[target_lang])

    # Try mock translations
    lang_pair = f"{source_lang}-{target_lang}"
    reverse_pair = f"{target_lang}-{source_lang}"

    translated = text
    confidence = 0.90

    if lang_pair in MOCK_TRANSLATIONS:
        for source_word, target_word in MOCK_TRANSLATIONS[lang_pair].items():
            translated = translated.lower().replace(source_word, target_word)
        confidence = 0.95
    else:
        # Simulated translation - just add language marker for demo
        translated = f"[{target_lang}] {text}"
        confidence = 0.75

    # Apply tone adjustments (simplified)
    if tone == ToneStyle.FORMAL:
        translated = translated.replace("you", "you (formal)")
    elif tone == ToneStyle.INFORMAL:
        translated = translated.replace("you (formal)", "you")

    # Generate alternatives
    alternatives = []
    if random.random() > 0.5:
        alternatives.append(f"{translated} (alternative)")

    return translated, confidence, alternatives

def check_translation_memory(text: str, source_lang: str, target_lang: str) -> Optional[TranslationMemoryEntry]:
    """Busca en memoria de traducción"""
    text_hash = generate_text_hash(text, source_lang, target_lang)
    if text_hash in tm_index:
        entry_id = tm_index[text_hash]
        if entry_id in translation_memory:
            entry = translation_memory[entry_id]
            entry.usage_count += 1
            return entry
    return None

def add_to_translation_memory(
    source_text: str,
    source_lang: str,
    target_lang: str,
    translated_text: str,
    user_id: str,
    project_id: Optional[str] = None
) -> TranslationMemoryEntry:
    """Añade traducción a memoria"""
    text_hash = generate_text_hash(source_text, source_lang, target_lang)

    entry = TranslationMemoryEntry(
        source_text=source_text,
        source_language=source_lang,
        target_language=target_lang,
        translated_text=translated_text,
        source_hash=text_hash,
        project_id=project_id,
        created_by=user_id
    )

    translation_memory[entry.id] = entry
    tm_index[text_hash] = entry.id

    return entry

# ======================= TRANSLATION ENDPOINTS =======================

@app.post("/translate", response_model=Translation)
async def translate(request: TranslateRequest, user_id: Optional[str] = None):
    """Traducir texto"""
    import time
    start_time = time.time()

    # Validate target language
    if request.target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported target language: {request.target_language}")

    # Detect source language if not provided
    source_lang = request.source_language
    if not source_lang:
        detection = detect_language(request.text)
        source_lang = detection.detected_language

    if source_lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported source language: {source_lang}")

    # Check translation memory first
    if request.use_translation_memory:
        tm_entry = check_translation_memory(request.text, source_lang, request.target_language)
        if tm_entry:
            processing_time = int((time.time() - start_time) * 1000)
            translation = Translation(
                source_text=request.text,
                source_language=source_lang,
                target_language=request.target_language,
                translated_text=tm_entry.translated_text,
                quality=TranslationQuality.PREMIUM if tm_entry.verified else TranslationQuality.STANDARD,
                confidence=tm_entry.quality_score,
                glossary_id=request.glossary_id,
                tone=request.tone,
                context=request.context,
                word_count=len(request.text.split()),
                character_count=len(request.text),
                processing_time_ms=processing_time,
                user_id=user_id
            )
            translations[translation.id] = translation
            return translation

    # Get glossary if specified
    glossary = glossaries.get(request.glossary_id) if request.glossary_id else None

    # Perform translation
    translated_text, confidence, alternatives = translate_text(
        request.text,
        source_lang,
        request.target_language,
        glossary,
        request.tone
    )

    processing_time = int((time.time() - start_time) * 1000)

    translation = Translation(
        source_text=request.text,
        source_language=source_lang,
        target_language=request.target_language,
        translated_text=translated_text,
        confidence=confidence,
        alternatives=alternatives,
        glossary_id=request.glossary_id,
        tone=request.tone,
        context=request.context,
        word_count=len(request.text.split()),
        character_count=len(request.text),
        processing_time_ms=processing_time,
        user_id=user_id
    )

    translations[translation.id] = translation

    # Add to translation memory
    if user_id and request.use_translation_memory:
        add_to_translation_memory(
            request.text, source_lang, request.target_language,
            translated_text, user_id
        )

    return translation

@app.post("/translate/batch")
async def batch_translate(request: BatchTranslateRequest, user_id: Optional[str] = None):
    """Traducir múltiples textos"""
    results = []

    for text in request.texts:
        trans_request = TranslateRequest(
            text=text,
            source_language=request.source_language,
            target_language=request.target_language,
            glossary_id=request.glossary_id
        )
        result = await translate(trans_request, user_id)
        results.append({
            "source": text,
            "translated": result.translated_text,
            "confidence": result.confidence
        })

    return {
        "count": len(results),
        "source_language": request.source_language or "auto",
        "target_language": request.target_language,
        "translations": results
    }

@app.post("/translate/detect")
async def detect_language_endpoint(text: str):
    """Detectar idioma"""
    result = detect_language(text)
    return {
        "text": text[:100] + "..." if len(text) > 100 else text,
        "detected_language": result.detected_language,
        "language_name": SUPPORTED_LANGUAGES[result.detected_language]["name"],
        "confidence": result.confidence,
        "alternatives": result.alternatives
    }

@app.get("/translate/history", response_model=List[Translation])
async def get_translation_history(
    user_id: Optional[str] = None,
    source_language: Optional[str] = None,
    target_language: Optional[str] = None,
    limit: int = 50
):
    """Obtener historial de traducciones"""
    result = list(translations.values())

    if user_id:
        result = [t for t in result if t.user_id == user_id]
    if source_language:
        result = [t for t in result if t.source_language == source_language]
    if target_language:
        result = [t for t in result if t.target_language == target_language]

    result = sorted(result, key=lambda x: x.created_at, reverse=True)
    return result[:limit]

# ======================= LANGUAGE ENDPOINTS =======================

@app.get("/languages")
async def list_languages():
    """Listar idiomas soportados"""
    return {
        "count": len(SUPPORTED_LANGUAGES),
        "languages": [
            {
                "code": code,
                "name": info["name"],
                "native_name": info["native"],
                "rtl": info["rtl"]
            }
            for code, info in SUPPORTED_LANGUAGES.items()
        ]
    }

@app.get("/languages/{language_code}")
async def get_language(language_code: str):
    """Obtener información de idioma"""
    if language_code not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=404, detail="Language not found")

    info = SUPPORTED_LANGUAGES[language_code]
    return {
        "code": language_code,
        "name": info["name"],
        "native_name": info["native"],
        "rtl": info["rtl"]
    }

@app.get("/languages/pairs")
async def get_language_pairs():
    """Obtener pares de idiomas soportados"""
    pairs = []
    for source in SUPPORTED_LANGUAGES:
        for target in SUPPORTED_LANGUAGES:
            if source != target:
                pairs.append({
                    "source": source,
                    "target": target
                })
    return {"count": len(pairs), "pairs": pairs[:100]}  # Limit for response size

# ======================= GLOSSARY ENDPOINTS =======================

@app.post("/glossaries", response_model=Glossary)
async def create_glossary(
    name: str,
    source_language: str,
    target_languages: List[str],
    owner_id: str,
    type: GlossaryType = GlossaryType.GENERAL,
    description: Optional[str] = None
):
    """Crear glosario"""
    glossary = Glossary(
        name=name,
        description=description,
        type=type,
        source_language=source_language,
        target_languages=target_languages,
        owner_id=owner_id
    )
    glossaries[glossary.id] = glossary
    return glossary

@app.get("/glossaries", response_model=List[Glossary])
async def list_glossaries(
    owner_id: Optional[str] = None,
    type: Optional[GlossaryType] = None,
    is_public: Optional[bool] = None
):
    """Listar glosarios"""
    result = list(glossaries.values())

    if owner_id:
        result = [g for g in result if g.owner_id == owner_id]
    if type:
        result = [g for g in result if g.type == type]
    if is_public is not None:
        result = [g for g in result if g.is_public == is_public]

    return result

@app.get("/glossaries/{glossary_id}", response_model=Glossary)
async def get_glossary(glossary_id: str):
    """Obtener glosario"""
    if glossary_id not in glossaries:
        raise HTTPException(status_code=404, detail="Glossary not found")
    return glossaries[glossary_id]

@app.post("/glossaries/{glossary_id}/terms", response_model=GlossaryTerm)
async def add_glossary_term(glossary_id: str, data: GlossaryTermCreate):
    """Añadir término a glosario"""
    if glossary_id not in glossaries:
        raise HTTPException(status_code=404, detail="Glossary not found")

    glossary = glossaries[glossary_id]

    term = GlossaryTerm(
        source_term=data.source_term,
        translations=data.translations,
        description=data.description,
        part_of_speech=data.part_of_speech,
        do_not_translate=data.do_not_translate
    )

    glossary.terms[term.id] = term
    glossary.updated_at = datetime.utcnow()

    return term

@app.get("/glossaries/{glossary_id}/terms", response_model=List[GlossaryTerm])
async def list_glossary_terms(glossary_id: str, search: Optional[str] = None):
    """Listar términos de glosario"""
    if glossary_id not in glossaries:
        raise HTTPException(status_code=404, detail="Glossary not found")

    glossary = glossaries[glossary_id]
    terms = list(glossary.terms.values())

    if search:
        search_lower = search.lower()
        terms = [t for t in terms if search_lower in t.source_term.lower()]

    return terms

@app.delete("/glossaries/{glossary_id}/terms/{term_id}")
async def delete_glossary_term(glossary_id: str, term_id: str):
    """Eliminar término de glosario"""
    if glossary_id not in glossaries:
        raise HTTPException(status_code=404, detail="Glossary not found")

    glossary = glossaries[glossary_id]
    if term_id not in glossary.terms:
        raise HTTPException(status_code=404, detail="Term not found")

    del glossary.terms[term_id]
    return {"message": "Term deleted"}

@app.post("/glossaries/{glossary_id}/import")
async def import_glossary_terms(
    glossary_id: str,
    terms: List[Dict[str, Any]]
):
    """Importar términos masivamente"""
    if glossary_id not in glossaries:
        raise HTTPException(status_code=404, detail="Glossary not found")

    glossary = glossaries[glossary_id]
    imported = 0

    for term_data in terms:
        term = GlossaryTerm(
            source_term=term_data.get("source_term", ""),
            translations=term_data.get("translations", {}),
            description=term_data.get("description"),
            do_not_translate=term_data.get("do_not_translate", False)
        )
        glossary.terms[term.id] = term
        imported += 1

    glossary.updated_at = datetime.utcnow()

    return {"imported": imported, "total_terms": len(glossary.terms)}

@app.get("/glossaries/{glossary_id}/export")
async def export_glossary(glossary_id: str, format: str = "json"):
    """Exportar glosario"""
    if glossary_id not in glossaries:
        raise HTTPException(status_code=404, detail="Glossary not found")

    glossary = glossaries[glossary_id]

    if format == "json":
        return {
            "name": glossary.name,
            "source_language": glossary.source_language,
            "target_languages": glossary.target_languages,
            "terms": [t.model_dump() for t in glossary.terms.values()]
        }
    elif format == "csv":
        # Return CSV-ready data
        rows = []
        for term in glossary.terms.values():
            row = {"source": term.source_term}
            row.update(term.translations)
            rows.append(row)
        return {"format": "csv", "data": rows}

    return {"error": "Unsupported format"}

# ======================= TRANSLATION MEMORY ENDPOINTS =======================

@app.get("/translation-memory", response_model=List[TranslationMemoryEntry])
async def list_translation_memory(
    source_language: Optional[str] = None,
    target_language: Optional[str] = None,
    verified: Optional[bool] = None,
    limit: int = 100
):
    """Listar entradas de memoria de traducción"""
    result = list(translation_memory.values())

    if source_language:
        result = [e for e in result if e.source_language == source_language]
    if target_language:
        result = [e for e in result if e.target_language == target_language]
    if verified is not None:
        result = [e for e in result if e.verified == verified]

    result = sorted(result, key=lambda x: x.usage_count, reverse=True)
    return result[:limit]

@app.post("/translation-memory/{entry_id}/verify")
async def verify_translation_memory(entry_id: str, user_id: str):
    """Verificar entrada de memoria"""
    if entry_id not in translation_memory:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry = translation_memory[entry_id]
    entry.verified = True
    entry.verified_by = user_id
    entry.quality_score = 1.0
    entry.updated_at = datetime.utcnow()

    return entry

@app.put("/translation-memory/{entry_id}")
async def update_translation_memory(
    entry_id: str,
    translated_text: str,
    user_id: str
):
    """Actualizar traducción en memoria"""
    if entry_id not in translation_memory:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry = translation_memory[entry_id]
    entry.translated_text = translated_text
    entry.verified = False
    entry.updated_at = datetime.utcnow()

    return entry

@app.delete("/translation-memory/{entry_id}")
async def delete_translation_memory(entry_id: str):
    """Eliminar entrada de memoria"""
    if entry_id not in translation_memory:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry = translation_memory[entry_id]
    del tm_index[entry.source_hash]
    del translation_memory[entry_id]

    return {"message": "Entry deleted"}

@app.get("/translation-memory/stats")
async def get_translation_memory_stats():
    """Estadísticas de memoria de traducción"""
    entries = list(translation_memory.values())

    by_pair = {}
    for entry in entries:
        pair = f"{entry.source_language}-{entry.target_language}"
        if pair not in by_pair:
            by_pair[pair] = {"count": 0, "verified": 0}
        by_pair[pair]["count"] += 1
        if entry.verified:
            by_pair[pair]["verified"] += 1

    return {
        "total_entries": len(entries),
        "verified_entries": len([e for e in entries if e.verified]),
        "total_usage": sum(e.usage_count for e in entries),
        "by_language_pair": by_pair
    }

# ======================= DOCUMENT TRANSLATION ENDPOINTS =======================

@app.post("/documents/translate", response_model=Document)
async def translate_document(
    name: str,
    original_filename: str,
    file_type: str,
    file_size: int,
    request: DocumentTranslateRequest,
    owner_id: str
):
    """Iniciar traducción de documento"""
    doc = Document(
        name=name,
        original_filename=original_filename,
        file_type=file_type,
        file_size=file_size,
        source_language=request.source_language,
        target_languages=request.target_languages,
        glossary_id=request.glossary_id,
        tone=request.tone,
        preserve_formatting=request.preserve_formatting,
        owner_id=owner_id,
        status=DocumentStatus.PROCESSING
    )
    documents[doc.id] = doc

    # In production, this would queue the document for async processing
    # Simulate some processing
    doc.segments_total = file_size // 100  # Rough estimate
    doc.progress = 10

    return doc

@app.get("/documents", response_model=List[Document])
async def list_documents(
    owner_id: Optional[str] = None,
    status: Optional[DocumentStatus] = None
):
    """Listar documentos"""
    result = list(documents.values())

    if owner_id:
        result = [d for d in result if d.owner_id == owner_id]
    if status:
        result = [d for d in result if d.status == status]

    return sorted(result, key=lambda x: x.created_at, reverse=True)

@app.get("/documents/{document_id}", response_model=Document)
async def get_document(document_id: str):
    """Obtener documento"""
    if document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    return documents[document_id]

@app.get("/documents/{document_id}/status")
async def get_document_status(document_id: str):
    """Obtener estado de traducción de documento"""
    if document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = documents[document_id]
    return {
        "document_id": document_id,
        "status": doc.status,
        "progress": doc.progress,
        "segments_total": doc.segments_total,
        "segments_translated": doc.segments_translated,
        "translated_urls": doc.translated_urls if doc.status == DocumentStatus.COMPLETED else {}
    }

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Eliminar documento"""
    if document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")

    del documents[document_id]
    return {"message": "Document deleted"}

# ======================= PROJECT ENDPOINTS =======================

@app.post("/projects", response_model=Project)
async def create_project(
    name: str,
    source_language: str,
    target_languages: List[str],
    owner_id: str,
    description: Optional[str] = None,
    glossary_ids: List[str] = [],
    default_tone: ToneStyle = ToneStyle.NEUTRAL
):
    """Crear proyecto de traducción"""
    project = Project(
        name=name,
        description=description,
        source_language=source_language,
        target_languages=target_languages,
        glossary_ids=glossary_ids,
        default_tone=default_tone,
        owner_id=owner_id
    )
    projects[project.id] = project
    return project

@app.get("/projects", response_model=List[Project])
async def list_projects(owner_id: Optional[str] = None):
    """Listar proyectos"""
    result = list(projects.values())
    if owner_id:
        result = [p for p in result if p.owner_id == owner_id or owner_id in p.collaborators]
    return result

@app.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Obtener proyecto"""
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="Project not found")
    return projects[project_id]

@app.post("/projects/{project_id}/documents/{document_id}")
async def add_document_to_project(project_id: str, document_id: str):
    """Añadir documento a proyecto"""
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="Project not found")
    if document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")

    project = projects[project_id]
    if document_id not in project.documents:
        project.documents.append(document_id)
        project.updated_at = datetime.utcnow()

    return {"message": "Document added to project"}

@app.get("/projects/{project_id}/stats")
async def get_project_stats(project_id: str):
    """Estadísticas de proyecto"""
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="Project not found")

    project = projects[project_id]
    project_docs = [documents[d] for d in project.documents if d in documents]

    return {
        "project_id": project_id,
        "documents_count": len(project_docs),
        "completed_documents": len([d for d in project_docs if d.status == DocumentStatus.COMPLETED]),
        "total_segments": sum(d.segments_total for d in project_docs),
        "translated_segments": sum(d.segments_translated for d in project_docs),
        "target_languages": project.target_languages
    }

# ======================= BATCH JOB ENDPOINTS =======================

@app.post("/batch-jobs", response_model=BatchTranslationJob)
async def create_batch_job(
    source_language: str,
    target_languages: List[str],
    items: List[Dict[str, str]],
    owner_id: str
):
    """Crear trabajo de traducción por lotes"""
    job = BatchTranslationJob(
        source_language=source_language,
        target_languages=target_languages,
        items=items,
        total_items=len(items) * len(target_languages),
        owner_id=owner_id,
        status="processing"
    )

    # Process translations
    for target_lang in target_languages:
        job.results[target_lang] = {}
        for item in items:
            key = item.get("key", str(uuid.uuid4()))
            text = item.get("text", "")
            translated, _, _ = translate_text(text, source_language, target_lang)
            job.results[target_lang][key] = translated
            job.completed_items += 1

    job.status = "completed"
    job.progress = 100
    job.completed_at = datetime.utcnow()

    batch_jobs[job.id] = job
    return job

@app.get("/batch-jobs/{job_id}", response_model=BatchTranslationJob)
async def get_batch_job(job_id: str):
    """Obtener trabajo por lotes"""
    if job_id not in batch_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return batch_jobs[job_id]

@app.get("/batch-jobs/{job_id}/results")
async def get_batch_job_results(job_id: str, target_language: Optional[str] = None):
    """Obtener resultados de trabajo por lotes"""
    if job_id not in batch_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = batch_jobs[job_id]

    if target_language:
        if target_language not in job.results:
            raise HTTPException(status_code=404, detail="Target language not found in results")
        return {target_language: job.results[target_language]}

    return job.results

# ======================= AI FEATURES =======================

@app.post("/ai/improve-translation")
async def ai_improve_translation(
    original_text: str,
    current_translation: str,
    source_language: str,
    target_language: str,
    context: Optional[str] = None,
    feedback: Optional[str] = None
):
    """Mejorar traducción con IA"""
    suggestions = []

    # Simulated improvements
    suggestions.append({
        "type": "grammar",
        "suggestion": f"{current_translation} (grammar improved)",
        "explanation": "Improved grammatical structure"
    })

    suggestions.append({
        "type": "fluency",
        "suggestion": f"{current_translation} (more natural)",
        "explanation": "Made the translation sound more natural"
    })

    if context:
        suggestions.append({
            "type": "contextual",
            "suggestion": f"{current_translation} (context-aware)",
            "explanation": f"Adjusted based on context: {context[:50]}"
        })

    return {
        "original": original_text,
        "current_translation": current_translation,
        "suggestions": suggestions,
        "recommended": suggestions[0]["suggestion"] if suggestions else current_translation
    }

@app.post("/ai/explain-translation")
async def ai_explain_translation(
    source_text: str,
    translated_text: str,
    source_language: str,
    target_language: str
):
    """Explicar diferencias de traducción"""
    explanations = []

    # Simulated explanations
    source_words = source_text.split()
    translated_words = translated_text.split()

    if len(source_words) != len(translated_words):
        explanations.append({
            "type": "structure",
            "explanation": f"Word count differs: {len(source_words)} → {len(translated_words)}. "
                          f"This is normal due to different grammatical structures between languages."
        })

    explanations.append({
        "type": "cultural",
        "explanation": "The translation maintains the original meaning while adapting to the cultural context of the target language."
    })

    explanations.append({
        "type": "grammar",
        "explanation": f"Grammar adapted from {SUPPORTED_LANGUAGES[source_language]['name']} to {SUPPORTED_LANGUAGES[target_language]['name']} conventions."
    })

    return {
        "source_text": source_text,
        "translated_text": translated_text,
        "language_pair": f"{source_language} → {target_language}",
        "explanations": explanations
    }

@app.post("/ai/suggest-glossary-terms")
async def ai_suggest_glossary_terms(
    text: str,
    source_language: str,
    domain: Optional[str] = None
):
    """Sugerir términos para glosario"""
    import re

    # Extract potential terms (capitalized words, technical terms)
    words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
    words += re.findall(r'\b[A-Z]{2,}\b', text)  # Acronyms

    suggestions = []
    for word in set(words):
        suggestions.append({
            "term": word,
            "frequency": text.lower().count(word.lower()),
            "type": "proper_noun" if word[0].isupper() and len(word) > 1 else "acronym",
            "recommendation": "do_not_translate" if word.isupper() else "translate"
        })

    # Sort by frequency
    suggestions.sort(key=lambda x: x["frequency"], reverse=True)

    return {
        "text_analyzed": len(text),
        "suggested_terms": suggestions[:20],
        "domain": domain
    }

@app.post("/ai/quality-assessment")
async def ai_quality_assessment(
    source_text: str,
    translated_text: str,
    source_language: str,
    target_language: str
):
    """Evaluar calidad de traducción"""
    import random

    # Simulated quality metrics
    fluency = random.uniform(0.7, 1.0)
    accuracy = random.uniform(0.75, 1.0)
    terminology = random.uniform(0.8, 1.0)
    style = random.uniform(0.7, 1.0)

    overall = (fluency + accuracy + terminology + style) / 4

    issues = []
    if fluency < 0.8:
        issues.append({"type": "fluency", "description": "Some phrases could be more natural"})
    if accuracy < 0.85:
        issues.append({"type": "accuracy", "description": "Minor accuracy concerns detected"})
    if terminology < 0.85:
        issues.append({"type": "terminology", "description": "Consider using domain-specific terms"})

    return {
        "overall_score": round(overall, 2),
        "scores": {
            "fluency": round(fluency, 2),
            "accuracy": round(accuracy, 2),
            "terminology": round(terminology, 2),
            "style": round(style, 2)
        },
        "quality_level": "excellent" if overall >= 0.9 else "good" if overall >= 0.8 else "acceptable" if overall >= 0.7 else "needs_review",
        "issues": issues,
        "recommendation": "Approved for use" if overall >= 0.8 else "Consider human review"
    }

@app.post("/ai/localize")
async def ai_localize(
    text: str,
    source_language: str,
    target_language: str,
    target_region: Optional[str] = None  # e.g., es-MX, pt-BR
):
    """Localizar texto (traducción + adaptación regional)"""
    # First translate
    translated, confidence, _ = translate_text(text, source_language, target_language)

    # Then apply regional adaptations (simplified)
    regional_notes = []

    if target_language == "es" and target_region:
        if target_region == "es-MX":
            regional_notes.append("Adapted for Mexican Spanish")
            translated = translated.replace("coche", "carro")
            translated = translated.replace("ordenador", "computadora")
        elif target_region == "es-AR":
            regional_notes.append("Adapted for Argentine Spanish")
            translated = translated.replace("tú", "vos")

    if target_language == "pt" and target_region == "pt-BR":
        regional_notes.append("Adapted for Brazilian Portuguese")

    return {
        "source_text": text,
        "localized_text": translated,
        "source_language": source_language,
        "target_language": target_language,
        "target_region": target_region,
        "regional_adaptations": regional_notes,
        "confidence": confidence
    }

# ======================= REAL-TIME TRANSLATION WEBSOCKET =======================

@app.websocket("/ws/translate/{user_id}")
async def websocket_realtime_translate(websocket: WebSocket, user_id: str):
    """WebSocket para traducción en tiempo real"""
    await websocket.accept()
    active_connections[user_id] = websocket

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "translate":
                text = message.get("text", "")
                source_lang = message.get("source_language")
                target_lang = message.get("target_language", "en")

                if not source_lang:
                    detection = detect_language(text)
                    source_lang = detection.detected_language

                translated, confidence, _ = translate_text(text, source_lang, target_lang)

                await websocket.send_json({
                    "type": "translation",
                    "source_text": text,
                    "translated_text": translated,
                    "source_language": source_lang,
                    "target_language": target_lang,
                    "confidence": confidence
                })

    except WebSocketDisconnect:
        if user_id in active_connections:
            del active_connections[user_id]

# ======================= REPORTS =======================

@app.get("/reports/usage")
async def usage_report(
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """Reporte de uso"""
    user_translations = list(translations.values())

    if user_id:
        user_translations = [t for t in user_translations if t.user_id == user_id]
    if start_date:
        user_translations = [t for t in user_translations if t.created_at >= start_date]
    if end_date:
        user_translations = [t for t in user_translations if t.created_at <= end_date]

    by_language_pair = {}
    for t in user_translations:
        pair = f"{t.source_language}-{t.target_language}"
        if pair not in by_language_pair:
            by_language_pair[pair] = {"count": 0, "characters": 0, "words": 0}
        by_language_pair[pair]["count"] += 1
        by_language_pair[pair]["characters"] += t.character_count
        by_language_pair[pair]["words"] += t.word_count

    return {
        "total_translations": len(user_translations),
        "total_characters": sum(t.character_count for t in user_translations),
        "total_words": sum(t.word_count for t in user_translations),
        "by_language_pair": by_language_pair,
        "avg_confidence": sum(t.confidence for t in user_translations) / len(user_translations) if user_translations else 0
    }

# ======================= HEALTH CHECK =======================

@app.get("/health")
async def health_check():
    """Health check del servicio"""
    return {
        "status": "healthy",
        "service": "ai-translator",
        "version": "1.0.0",
        "supported_languages": len(SUPPORTED_LANGUAGES),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/stats")
async def get_stats():
    """Estadísticas del servicio"""
    return {
        "translations": len(translations),
        "translation_memory_entries": len(translation_memory),
        "glossaries": len(glossaries),
        "total_glossary_terms": sum(len(g.terms) for g in glossaries.values()),
        "documents": len(documents),
        "projects": len(projects),
        "batch_jobs": len(batch_jobs),
        "supported_languages": len(SUPPORTED_LANGUAGES)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8020)

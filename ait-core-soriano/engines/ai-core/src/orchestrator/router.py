"""
LLM Orchestrator: Multi-model routing with intelligent fallback.

Supports:
- Local models via Ollama (LLaMA, Mistral, Phi-3)
- Cloud models (OpenAI GPT-4, Anthropic Claude)
- Custom fine-tuned models
- Automatic fallback on failure
- Quality monitoring and metrics
"""

import asyncio
from typing import AsyncGenerator, Optional, Dict, Any, List
from enum import Enum
from dataclasses import dataclass
import structlog
from prometheus_client import Counter, Histogram, Gauge

from .model_registry import ModelRegistry, ModelConfig
from .fallback_handler import FallbackHandler

logger = structlog.get_logger(__name__)

# Prometheus metrics
REQUEST_COUNTER = Counter(
    "llm_requests_total",
    "Total LLM requests",
    ["model", "task_type", "status"]
)
LATENCY_HISTOGRAM = Histogram(
    "llm_latency_seconds",
    "LLM response latency",
    ["model", "task_type"]
)
TOKENS_COUNTER = Counter(
    "llm_tokens_total",
    "Total tokens processed",
    ["model", "direction"]  # direction: input/output
)
FALLBACK_COUNTER = Counter(
    "llm_fallback_total",
    "Fallback events",
    ["from_model", "to_model", "reason"]
)


class TaskType(str, Enum):
    """Task types for intelligent routing."""
    SIMPLE_COMPLETION = "simple_completion"
    DOCUMENT_WRITING = "document_writing"
    DATA_ANALYSIS = "data_analysis"
    EMAIL_COMPOSE = "email_compose"
    CODE_GENERATION = "code_generation"
    COMPLEX_REASONING = "complex_reasoning"
    MEETING_SUMMARY = "meeting_summary"
    CHAT = "chat"
    TRANSLATION = "translation"
    SUMMARIZATION = "summarization"
    FORM_GENERATION = "form_generation"
    WORKFLOW_DESIGN = "workflow_design"
    IMAGE_ANALYSIS = "image_analysis"
    OCR = "ocr"


@dataclass
class RoutingConfig:
    """Configuration for task-based model routing."""
    primary: str
    fallback: str
    cloud_fallback: str
    max_tokens: int = 2000
    temperature: float = 0.7
    timeout_seconds: float = 30.0


# Default routing configuration
DEFAULT_ROUTING: Dict[TaskType, RoutingConfig] = {
    TaskType.SIMPLE_COMPLETION: RoutingConfig(
        primary="phi-3-medium",
        fallback="llama-3.2-8b",
        cloud_fallback="gpt-3.5-turbo",
        max_tokens=500,
        temperature=0.5
    ),
    TaskType.DOCUMENT_WRITING: RoutingConfig(
        primary="docs-writer-lora",
        fallback="mistral-7b-instruct",
        cloud_fallback="gpt-4-turbo",
        max_tokens=4000,
        temperature=0.7
    ),
    TaskType.DATA_ANALYSIS: RoutingConfig(
        primary="sheets-analyst-lora",
        fallback="llama-3.2-8b",
        cloud_fallback="gpt-4-turbo",
        max_tokens=2000,
        temperature=0.3
    ),
    TaskType.EMAIL_COMPOSE: RoutingConfig(
        primary="mail-composer-lora",
        fallback="mistral-7b-instruct",
        cloud_fallback="gpt-4",
        max_tokens=1500,
        temperature=0.6
    ),
    TaskType.CODE_GENERATION: RoutingConfig(
        primary="codellama-7b",
        fallback="deepseek-coder-7b",
        cloud_fallback="gpt-4",
        max_tokens=3000,
        temperature=0.2
    ),
    TaskType.COMPLEX_REASONING: RoutingConfig(
        primary="llama-3.2-70b",
        fallback="mistral-large",
        cloud_fallback="claude-3-opus",
        max_tokens=4000,
        temperature=0.5
    ),
    TaskType.MEETING_SUMMARY: RoutingConfig(
        primary="meeting-summarizer-lora",
        fallback="llama-3.2-8b",
        cloud_fallback="gpt-4-turbo",
        max_tokens=2000,
        temperature=0.4
    ),
    TaskType.CHAT: RoutingConfig(
        primary="llama-3.2-8b",
        fallback="mistral-7b-instruct",
        cloud_fallback="gpt-4-turbo",
        max_tokens=1000,
        temperature=0.8
    ),
    TaskType.TRANSLATION: RoutingConfig(
        primary="llama-3.2-8b",
        fallback="mistral-7b-instruct",
        cloud_fallback="gpt-4",
        max_tokens=2000,
        temperature=0.3
    ),
    TaskType.SUMMARIZATION: RoutingConfig(
        primary="llama-3.2-8b",
        fallback="phi-3-medium",
        cloud_fallback="gpt-4-turbo",
        max_tokens=1000,
        temperature=0.4
    ),
    TaskType.FORM_GENERATION: RoutingConfig(
        primary="llama-3.2-8b",
        fallback="mistral-7b-instruct",
        cloud_fallback="gpt-4",
        max_tokens=2000,
        temperature=0.5
    ),
    TaskType.WORKFLOW_DESIGN: RoutingConfig(
        primary="llama-3.2-8b",
        fallback="codellama-7b",
        cloud_fallback="gpt-4",
        max_tokens=3000,
        temperature=0.4
    ),
    TaskType.IMAGE_ANALYSIS: RoutingConfig(
        primary="llava-7b",
        fallback="llava-13b",
        cloud_fallback="gpt-4-vision",
        max_tokens=1500,
        temperature=0.5
    ),
    TaskType.OCR: RoutingConfig(
        primary="llava-7b",
        fallback="phi-3-vision",
        cloud_fallback="gpt-4-vision",
        max_tokens=2000,
        temperature=0.2
    ),
}


class LLMOrchestrator:
    """
    Central orchestrator for all LLM operations in AI-Suite.

    Features:
    - Intelligent task-based routing
    - Automatic fallback on failure
    - Streaming support
    - Quality monitoring
    - Cost optimization (prefer local models)
    """

    def __init__(
        self,
        model_registry: ModelRegistry,
        routing_config: Optional[Dict[TaskType, RoutingConfig]] = None,
        enable_metrics: bool = True,
    ):
        self.registry = model_registry
        self.routing = routing_config or DEFAULT_ROUTING
        self.fallback_handler = FallbackHandler()
        self.enable_metrics = enable_metrics

    async def generate(
        self,
        prompt: str,
        task_type: TaskType = TaskType.SIMPLE_COMPLETION,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Generate a response using the appropriate model.

        Args:
            prompt: User prompt
            task_type: Type of task for routing
            context: Additional context (e.g., document content)
            system_prompt: Optional system prompt override
            **kwargs: Additional parameters for the model

        Returns:
            Generated text response
        """
        config = self.routing.get(task_type, self.routing[TaskType.SIMPLE_COMPLETION])

        # Build full prompt with context if provided
        full_prompt = self._build_prompt(prompt, context, system_prompt)

        # Try models in order: primary -> fallback -> cloud
        models_to_try = [config.primary, config.fallback, config.cloud_fallback]

        for i, model_name in enumerate(models_to_try):
            try:
                with LATENCY_HISTOGRAM.labels(
                    model=model_name, task_type=task_type.value
                ).time():
                    response = await self._call_model(
                        model_name=model_name,
                        prompt=full_prompt,
                        max_tokens=kwargs.get("max_tokens", config.max_tokens),
                        temperature=kwargs.get("temperature", config.temperature),
                        timeout=config.timeout_seconds
                    )

                REQUEST_COUNTER.labels(
                    model=model_name, task_type=task_type.value, status="success"
                ).inc()

                logger.info(
                    "llm_generation_success",
                    model=model_name,
                    task_type=task_type.value,
                    is_fallback=i > 0
                )

                return response

            except Exception as e:
                logger.warning(
                    "llm_generation_failed",
                    model=model_name,
                    task_type=task_type.value,
                    error=str(e),
                    will_fallback=i < len(models_to_try) - 1
                )

                REQUEST_COUNTER.labels(
                    model=model_name, task_type=task_type.value, status="error"
                ).inc()

                if i < len(models_to_try) - 1:
                    FALLBACK_COUNTER.labels(
                        from_model=model_name,
                        to_model=models_to_try[i + 1],
                        reason=type(e).__name__
                    ).inc()
                    continue

                raise RuntimeError(f"All models failed for task {task_type.value}: {e}")

    async def stream(
        self,
        prompt: str,
        task_type: TaskType = TaskType.SIMPLE_COMPLETION,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        Stream a response using the appropriate model.

        Yields chunks of the response as they are generated.
        """
        config = self.routing.get(task_type, self.routing[TaskType.SIMPLE_COMPLETION])
        full_prompt = self._build_prompt(prompt, context, system_prompt)

        model_name = config.primary

        try:
            async for chunk in self._stream_model(
                model_name=model_name,
                prompt=full_prompt,
                max_tokens=kwargs.get("max_tokens", config.max_tokens),
                temperature=kwargs.get("temperature", config.temperature),
            ):
                yield chunk

        except Exception as e:
            logger.warning(f"Primary model {model_name} failed, trying fallback")

            # Fallback to cloud for streaming
            async for chunk in self._stream_model(
                model_name=config.cloud_fallback,
                prompt=full_prompt,
                max_tokens=kwargs.get("max_tokens", config.max_tokens),
                temperature=kwargs.get("temperature", config.temperature),
            ):
                yield chunk

    async def _call_model(
        self,
        model_name: str,
        prompt: str,
        max_tokens: int,
        temperature: float,
        timeout: float
    ) -> str:
        """Call a specific model through the registry."""
        model = await self.registry.get_model(model_name)

        response = await asyncio.wait_for(
            model.generate(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature
            ),
            timeout=timeout
        )

        return response

    async def _stream_model(
        self,
        model_name: str,
        prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        """Stream from a specific model through the registry."""
        model = await self.registry.get_model(model_name)

        async for chunk in model.stream(
            prompt=prompt,
            max_tokens=max_tokens,
            temperature=temperature
        ):
            yield chunk

    def _build_prompt(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]],
        system_prompt: Optional[str]
    ) -> str:
        """Build the full prompt with context and system instructions."""
        parts = []

        if system_prompt:
            parts.append(f"<system>\n{system_prompt}\n</system>\n")

        if context:
            context_str = "\n".join([
                f"<{key}>\n{value}\n</{key}>"
                for key, value in context.items()
            ])
            parts.append(f"<context>\n{context_str}\n</context>\n")

        parts.append(f"<user>\n{prompt}\n</user>")

        return "\n".join(parts)

    async def health_check(self) -> Dict[str, Any]:
        """Check health of all registered models."""
        results = {}

        for model_name in self.registry.list_models():
            try:
                model = await self.registry.get_model(model_name)
                is_healthy = await model.health_check()
                results[model_name] = {"status": "healthy" if is_healthy else "unhealthy"}
            except Exception as e:
                results[model_name] = {"status": "error", "error": str(e)}

        return results


# Singleton instance
_orchestrator: Optional[LLMOrchestrator] = None


async def get_orchestrator() -> LLMOrchestrator:
    """Get or create the global orchestrator instance."""
    global _orchestrator

    if _orchestrator is None:
        registry = await ModelRegistry.create()
        _orchestrator = LLMOrchestrator(registry)

    return _orchestrator

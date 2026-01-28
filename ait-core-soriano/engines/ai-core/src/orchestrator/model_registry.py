"""
Model Registry: Manages all available LLM models (local and cloud).

Supports:
- Ollama local models
- OpenAI API
- Anthropic API
- Custom fine-tuned models (LoRA)
- vLLM inference server
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Optional, Any, List
from dataclasses import dataclass, field
from enum import Enum
import structlog
import httpx
import ollama
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

logger = structlog.get_logger(__name__)


class ModelProvider(str, Enum):
    """Supported model providers."""
    OLLAMA = "ollama"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    VLLM = "vllm"
    CUSTOM = "custom"


@dataclass
class ModelConfig:
    """Configuration for a model."""
    name: str
    provider: ModelProvider
    model_id: str  # The actual model identifier (e.g., "llama3.2:8b")
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    max_context_length: int = 8192
    supports_streaming: bool = True
    supports_vision: bool = False
    is_local: bool = True
    quantization: Optional[str] = None  # e.g., "q4_0", "q8_0"
    lora_adapter: Optional[str] = None  # Path to LoRA adapter
    metadata: Dict[str, Any] = field(default_factory=dict)


class BaseModelAdapter(ABC):
    """Base class for model adapters."""

    def __init__(self, config: ModelConfig):
        self.config = config

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        """Generate a response."""
        pass

    @abstractmethod
    async def stream(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream a response."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the model is available."""
        pass


class OllamaAdapter(BaseModelAdapter):
    """Adapter for Ollama local models."""

    def __init__(self, config: ModelConfig):
        super().__init__(config)
        self.client = ollama.AsyncClient(
            host=config.base_url or "http://localhost:11434"
        )

    async def generate(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        response = await self.client.generate(
            model=self.config.model_id,
            prompt=prompt,
            options={
                "num_predict": max_tokens,
                "temperature": temperature,
            }
        )
        return response["response"]

    async def stream(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        async for chunk in await self.client.generate(
            model=self.config.model_id,
            prompt=prompt,
            stream=True,
            options={
                "num_predict": max_tokens,
                "temperature": temperature,
            }
        ):
            yield chunk["response"]

    async def health_check(self) -> bool:
        try:
            models = await self.client.list()
            return any(m["name"] == self.config.model_id for m in models.get("models", []))
        except Exception:
            return False


class OpenAIAdapter(BaseModelAdapter):
    """Adapter for OpenAI API models."""

    def __init__(self, config: ModelConfig):
        super().__init__(config)
        self.client = AsyncOpenAI(
            api_key=config.api_key,
            base_url=config.base_url
        )

    async def generate(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        response = await self.client.chat.completions.create(
            model=self.config.model_id,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content or ""

    async def stream(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        stream = await self.client.chat.completions.create(
            model=self.config.model_id,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True,
        )
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def health_check(self) -> bool:
        try:
            await self.client.models.retrieve(self.config.model_id)
            return True
        except Exception:
            return False


class AnthropicAdapter(BaseModelAdapter):
    """Adapter for Anthropic API models."""

    def __init__(self, config: ModelConfig):
        super().__init__(config)
        self.client = AsyncAnthropic(api_key=config.api_key)

    async def generate(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        response = await self.client.messages.create(
            model=self.config.model_id,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
        )
        return response.content[0].text

    async def stream(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        async with self.client.messages.stream(
            model=self.config.model_id,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
        ) as stream:
            async for text in stream.text_stream:
                yield text

    async def health_check(self) -> bool:
        try:
            # Simple check - try to create a minimal message
            await self.client.messages.create(
                model=self.config.model_id,
                max_tokens=1,
                messages=[{"role": "user", "content": "ping"}],
            )
            return True
        except Exception:
            return False


class ModelRegistry:
    """
    Registry for all available models.

    Manages model configurations and provides adapters on demand.
    """

    def __init__(self):
        self._configs: Dict[str, ModelConfig] = {}
        self._adapters: Dict[str, BaseModelAdapter] = {}

    @classmethod
    async def create(cls) -> "ModelRegistry":
        """Factory method to create and initialize a registry."""
        registry = cls()
        await registry._register_default_models()
        return registry

    async def _register_default_models(self):
        """Register default model configurations."""

        # ============== LOCAL MODELS (Ollama) ==============

        # LLaMA 3.2 8B - General purpose
        self.register(ModelConfig(
            name="llama-3.2-8b",
            provider=ModelProvider.OLLAMA,
            model_id="llama3.2:8b",
            max_context_length=8192,
            is_local=True,
        ))

        # LLaMA 3.2 70B - Complex reasoning
        self.register(ModelConfig(
            name="llama-3.2-70b",
            provider=ModelProvider.OLLAMA,
            model_id="llama3.2:70b",
            max_context_length=8192,
            is_local=True,
        ))

        # Mistral 7B Instruct - Writing and conversations
        self.register(ModelConfig(
            name="mistral-7b-instruct",
            provider=ModelProvider.OLLAMA,
            model_id="mistral:7b-instruct",
            max_context_length=32768,
            is_local=True,
        ))

        # Mistral Large - High quality
        self.register(ModelConfig(
            name="mistral-large",
            provider=ModelProvider.OLLAMA,
            model_id="mistral-large:latest",
            max_context_length=32768,
            is_local=True,
        ))

        # Phi-3 Medium - Fast responses
        self.register(ModelConfig(
            name="phi-3-medium",
            provider=ModelProvider.OLLAMA,
            model_id="phi3:medium",
            max_context_length=4096,
            is_local=True,
        ))

        # CodeLlama 7B - Code generation
        self.register(ModelConfig(
            name="codellama-7b",
            provider=ModelProvider.OLLAMA,
            model_id="codellama:7b",
            max_context_length=16384,
            is_local=True,
        ))

        # DeepSeek Coder - Alternative code model
        self.register(ModelConfig(
            name="deepseek-coder-7b",
            provider=ModelProvider.OLLAMA,
            model_id="deepseek-coder:7b",
            max_context_length=16384,
            is_local=True,
        ))

        # LLaVA 7B - Vision model
        self.register(ModelConfig(
            name="llava-7b",
            provider=ModelProvider.OLLAMA,
            model_id="llava:7b",
            max_context_length=4096,
            supports_vision=True,
            is_local=True,
        ))

        # LLaVA 13B - Larger vision model
        self.register(ModelConfig(
            name="llava-13b",
            provider=ModelProvider.OLLAMA,
            model_id="llava:13b",
            max_context_length=4096,
            supports_vision=True,
            is_local=True,
        ))

        # Phi-3 Vision
        self.register(ModelConfig(
            name="phi-3-vision",
            provider=ModelProvider.OLLAMA,
            model_id="phi3:vision",
            max_context_length=4096,
            supports_vision=True,
            is_local=True,
        ))

        # ============== FINE-TUNED MODELS (Custom LoRA) ==============

        self.register(ModelConfig(
            name="docs-writer-lora",
            provider=ModelProvider.OLLAMA,
            model_id="docs-writer:latest",  # Custom model in Ollama
            max_context_length=8192,
            is_local=True,
            lora_adapter="models/docs-writer-lora",
            metadata={"fine_tuned_for": "document_writing"}
        ))

        self.register(ModelConfig(
            name="sheets-analyst-lora",
            provider=ModelProvider.OLLAMA,
            model_id="sheets-analyst:latest",
            max_context_length=8192,
            is_local=True,
            lora_adapter="models/sheets-analyst-lora",
            metadata={"fine_tuned_for": "data_analysis"}
        ))

        self.register(ModelConfig(
            name="mail-composer-lora",
            provider=ModelProvider.OLLAMA,
            model_id="mail-composer:latest",
            max_context_length=8192,
            is_local=True,
            lora_adapter="models/mail-composer-lora",
            metadata={"fine_tuned_for": "email_composition"}
        ))

        self.register(ModelConfig(
            name="meeting-summarizer-lora",
            provider=ModelProvider.OLLAMA,
            model_id="meeting-summarizer:latest",
            max_context_length=16384,
            is_local=True,
            lora_adapter="models/meeting-summarizer-lora",
            metadata={"fine_tuned_for": "meeting_summaries"}
        ))

        # ============== CLOUD MODELS (Fallback) ==============

        # OpenAI GPT-3.5 Turbo - Fast cloud fallback
        self.register(ModelConfig(
            name="gpt-3.5-turbo",
            provider=ModelProvider.OPENAI,
            model_id="gpt-3.5-turbo",
            max_context_length=16384,
            is_local=False,
        ))

        # OpenAI GPT-4 Turbo - High quality cloud
        self.register(ModelConfig(
            name="gpt-4-turbo",
            provider=ModelProvider.OPENAI,
            model_id="gpt-4-turbo-preview",
            max_context_length=128000,
            is_local=False,
        ))

        # OpenAI GPT-4 - Stable high quality
        self.register(ModelConfig(
            name="gpt-4",
            provider=ModelProvider.OPENAI,
            model_id="gpt-4",
            max_context_length=8192,
            is_local=False,
        ))

        # OpenAI GPT-4 Vision
        self.register(ModelConfig(
            name="gpt-4-vision",
            provider=ModelProvider.OPENAI,
            model_id="gpt-4-vision-preview",
            max_context_length=128000,
            supports_vision=True,
            is_local=False,
        ))

        # Anthropic Claude 3 Opus - Best quality
        self.register(ModelConfig(
            name="claude-3-opus",
            provider=ModelProvider.ANTHROPIC,
            model_id="claude-3-opus-20240229",
            max_context_length=200000,
            is_local=False,
        ))

        # Anthropic Claude 3.5 Sonnet - Fast and capable
        self.register(ModelConfig(
            name="claude-3.5-sonnet",
            provider=ModelProvider.ANTHROPIC,
            model_id="claude-3-5-sonnet-20241022",
            max_context_length=200000,
            is_local=False,
        ))

    def register(self, config: ModelConfig):
        """Register a model configuration."""
        self._configs[config.name] = config
        logger.info("model_registered", name=config.name, provider=config.provider.value)

    def unregister(self, name: str):
        """Unregister a model."""
        if name in self._configs:
            del self._configs[name]
            if name in self._adapters:
                del self._adapters[name]
            logger.info("model_unregistered", name=name)

    async def get_model(self, name: str) -> BaseModelAdapter:
        """Get or create an adapter for a model."""
        if name in self._adapters:
            return self._adapters[name]

        if name not in self._configs:
            raise ValueError(f"Model '{name}' not found in registry")

        config = self._configs[name]
        adapter = self._create_adapter(config)
        self._adapters[name] = adapter

        return adapter

    def _create_adapter(self, config: ModelConfig) -> BaseModelAdapter:
        """Create an adapter for a model configuration."""
        if config.provider == ModelProvider.OLLAMA:
            return OllamaAdapter(config)
        elif config.provider == ModelProvider.OPENAI:
            return OpenAIAdapter(config)
        elif config.provider == ModelProvider.ANTHROPIC:
            return AnthropicAdapter(config)
        else:
            raise ValueError(f"Unsupported provider: {config.provider}")

    def list_models(self) -> List[str]:
        """List all registered model names."""
        return list(self._configs.keys())

    def get_config(self, name: str) -> Optional[ModelConfig]:
        """Get configuration for a model."""
        return self._configs.get(name)

    def list_local_models(self) -> List[str]:
        """List only local models."""
        return [name for name, config in self._configs.items() if config.is_local]

    def list_cloud_models(self) -> List[str]:
        """List only cloud models."""
        return [name for name, config in self._configs.items() if not config.is_local]

    def list_vision_models(self) -> List[str]:
        """List models that support vision."""
        return [name for name, config in self._configs.items() if config.supports_vision]

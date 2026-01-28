# AIT-CORE Engines

Motor de IA y ML para el ecosistema AIT-CORE.

## Engines Disponibles

### ai-core (Python)
**Origen:** AI-Suite
**Descripción:** LLM Orchestrator con soporte multi-modelo
**Stack:** Python 3.11+, LangChain, LiteLLM

**Características:**
- Multi-modelo (OpenAI, Anthropic, Ollama, etc.)
- Vector stores (Pinecone, Qdrant)
- RAG (Retrieval-Augmented Generation)
- Fine-tuning con PEFT
- Embeddings con Sentence Transformers

**Uso:**
```bash
cd engines/ai-core
pip install -e .
python -c "from ai_suite_core import LLMOrchestrator; print('OK')"
```

### ait-engines (Python)
**Origen:** AIT-CORE-SORIANO
**Descripción:** Motores especializados para seguros
**Stack:** Python 3.11+, FastAPI, scikit-learn

**Motores:**
- Actuarial Engine (cálculo de primas)
- Pricing Engine (optimización de precios)
- Churn Prediction (predicción de cancelaciones)
- Fraud Detection (detección de fraude)
- Risk Assessment (evaluación de riesgo)
- Claims Prediction (predicción de siniestros)
- ... (17 motores más)


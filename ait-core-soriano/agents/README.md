# 🤖 AIT-CORE AGENTS - Sistema de Agentes AI

## Arquitectura de Dos Capas

El sistema de agentes AI de AIT-CORE está diseñado con una arquitectura de dos capas complementarias:

### Capa 1: ESPECIALISTAS (Specialists)
**Rol**: Análisis profundo y recomendaciones expertas

Los especialistas son agentes con conocimiento profundo en dominios específicos que:
- ✅ **Analizan** datos y situaciones complejas
- ✅ **Recomiendan** soluciones basadas en su expertise
- ✅ **Responden** preguntas técnicas especializadas
- ✅ **Validan** propuestas desde su perspectiva experta
- ❌ **NO ejecutan** acciones directamente
- ❌ **NO toman decisiones** de negocio

### Capa 2: EJECUTORES (Executors)
**Rol**: Gestión, decisión y ejecución

Los ejecutores son agentes de alto nivel que:
- ✅ **Ejecutan** tareas y workflows
- ✅ **Deciden** cursos de acción basándose en especialistas
- ✅ **Coordinan** múltiples agentes y equipos
- ✅ **Gestionan** procesos empresariales complejos
- ✅ **Consultan** a especialistas para fundamentar decisiones
- ✅ **Actúan** sobre sistemas y bases de datos

---

## 🎯 Flujo de Trabajo

```
┌─────────────────┐
│  USER REQUEST   │ "Necesito analizar riesgo de un nuevo cliente"
└────────┬────────┘
         │
         ↓
┌───────────────────────────────────────────────┐
│  EXECUTOR AGENT (Sales Manager)               │
│  - Recibe la solicitud                        │
│  - Identifica que necesita análisis de riesgo │
│  - Consulta a ESPECIALISTAS relevantes        │
└────────┬──────────────────────────────────────┘
         │
         ├──────────────────┬──────────────────┬─────────────────┐
         ↓                  ↓                  ↓                 ↓
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│Insurance        │ │Finance          │ │Data             │ │Security         │
│Specialist       │ │Specialist       │ │Specialist       │ │Specialist       │
│                 │ │                 │ │                 │ │                 │
│Analiza:         │ │Analiza:         │ │Analiza:         │ │Analiza:         │
│- Tipo de seguro │ │- Solvencia      │ │- Histórico      │ │- Fraude         │
│- Coberturas     │ │- Capacidad pago │ │- Patrones       │ │- Identidad      │
│- Riesgos        │ │- Ratios         │ │- Predicciones   │ │- Anomalías      │
│                 │ │                 │ │                 │ │                 │
│Recomienda:      │ │Recomienda:      │ │Recomienda:      │ │Recomienda:      │
│"Riesgo MEDIO"   │ │"Solvente"       │ │"Cliente fiable" │ │"Sin alertas"    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                  │                  │                 │
         └──────────────────┴──────────────────┴─────────────────┘
                            │
                            ↓
         ┌──────────────────────────────────────────┐
         │  EXECUTOR AGENT (Sales Manager)          │
         │  - Recibe 4 análisis especializados      │
         │  - Consolida información                 │
         │  - Toma DECISIÓN: Aprobar cliente        │
         │  - EJECUTA: Crear cliente en CRM         │
         │  - EJECUTA: Crear oportunidad            │
         │  - EJECUTA: Asignar a agente comercial   │
         │  - Notifica al usuario                   │
         └────────┬─────────────────────────────────┘
                  │
                  ↓
         ┌────────────────────┐
         │  USER RESPONSE     │ "Cliente creado con éxito"
         └────────────────────┘
```

---

## 👥 ESPECIALISTAS (8 Agentes)

### 1. Insurance Specialist
**Dominio**: Seguros y actuaría

**Expertise**:
- Análisis actuarial y cálculo de primas
- Evaluación de riesgos asegurables
- Recomendación de coberturas óptimas
- Normativa de seguros española y europea
- Suscripción y underwriting
- Análisis de siniestralidad

**Casos de Uso**:
- "¿Qué prima debo aplicar a este cliente?"
- "¿Cuál es el riesgo de esta póliza?"
- "¿Qué coberturas necesita esta empresa?"

**API**: `POST /api/v1/agents/specialists/insurance/analyze`

---

### 2. Finance Specialist
**Dominio**: Finanzas y contabilidad

**Expertise**:
- Análisis financiero y ratios
- Gestión de tesorería y flujo de caja
- Contabilidad y PGC español
- Análisis de inversiones (VAN, TIR, ROI)
- Gestión de riesgos financieros
- Cumplimiento fiscal

**Casos de Uso**:
- "¿Es solvente este cliente para conceder crédito?"
- "¿Cómo optimizar nuestra tesorería?"
- "¿Qué rentabilidad tiene esta inversión?"

**API**: `POST /api/v1/agents/specialists/finance/analyze`

---

### 3. Legal Specialist
**Dominio**: Legal y compliance

**Expertise**:
- Análisis de contratos y cláusulas
- Normativa de seguros (LOSSEAR, Solvencia II)
- GDPR y protección de datos
- Derecho mercantil y laboral
- Resolución de conflictos
- Due diligence legal

**Casos de Uso**:
- "¿Este contrato cumple con la normativa?"
- "¿Qué cláusulas debo incluir en esta póliza?"
- "¿Cómo gestionar este dato personal?"

**API**: `POST /api/v1/agents/specialists/legal/analyze`

---

### 4. Marketing Specialist
**Dominio**: Marketing digital y comunicación

**Expertise**:
- Estrategias de marketing digital
- SEO, SEM y publicidad online
- Marketing de contenidos
- Gestión de redes sociales
- Email marketing y automation
- Análisis de campañas (ROAS, CAC, LTV)
- Branding y posicionamiento

**Casos de Uso**:
- "¿Cómo mejorar mi posicionamiento SEO?"
- "¿Qué canales usar para esta campaña?"
- "¿Cómo optimizar mi inversión en Google Ads?"

**API**: `POST /api/v1/agents/specialists/marketing/analyze`

---

### 5. Data Specialist
**Dominio**: Ciencia de datos y análisis

**Expertise**:
- Análisis estadístico avanzado
- Machine learning y predicción
- Visualización de datos
- Big data y procesamiento
- Minería de datos
- Data quality y limpieza

**Casos de Uso**:
- "¿Qué patrones hay en mis datos de clientes?"
- "¿Puedes predecir la siniestralidad?"
- "¿Cómo visualizar mejor estos KPIs?"

**API**: `POST /api/v1/agents/specialists/data/analyze`

---

### 6. Security Specialist
**Dominio**: Ciberseguridad y fraude

**Expertise**:
- Detección de fraude y anomalías
- Ciberseguridad y pentesting
- Análisis de vulnerabilidades
- Gestión de incidentes de seguridad
- Seguridad de infraestructura
- Compliance de seguridad (ISO 27001, SOC2)

**Casos de Uso**:
- "¿Este cliente es fraudulento?"
- "¿Qué vulnerabilidades tiene mi sistema?"
- "¿Cómo proteger estos datos sensibles?"

**API**: `POST /api/v1/agents/specialists/security/analyze`

---

### 7. Customer Specialist
**Dominio**: Experiencia de cliente y CX

**Expertise**:
- Customer journey mapping
- Análisis de satisfacción (NPS, CSAT)
- Diseño de experiencias
- Segmentación de clientes
- Estrategias de fidelización
- Voice of Customer (VoC)

**Casos de Uso**:
- "¿Cómo mejorar la experiencia de mis clientes?"
- "¿Por qué pierdo clientes en este punto?"
- "¿Qué segmentos son más rentables?"

**API**: `POST /api/v1/agents/specialists/customer/analyze`

---

### 8. Operations Specialist
**Dominio**: Operaciones y eficiencia

**Expertise**:
- Optimización de procesos (Lean, Six Sigma)
- Gestión de workflows
- Análisis de eficiencia operativa
- Automatización de procesos (RPA)
- Cadena de suministro
- Gestión de calidad

**Casos de Uso**:
- "¿Cómo optimizar este proceso?"
- "¿Dónde están mis cuellos de botella?"
- "¿Qué procesos puedo automatizar?"

**API**: `POST /api/v1/agents/specialists/operations/analyze`

---

## 🎖️ EJECUTORES (8 Agentes)

### 1. CEO Agent
**Rol**: Director General

**Responsabilidades**:
- Estrategia empresarial global
- Decisiones de alto nivel
- Coordinación de todos los departamentos
- Visión a largo plazo
- Gestión de stakeholders

**Especialistas que Consulta**: Todos (según contexto)

**Acciones que Ejecuta**:
- Aprobar estrategias
- Asignar presupuestos
- Definir objetivos corporativos
- Tomar decisiones críticas

**API**: `POST /api/v1/agents/executors/ceo/execute`

---

### 2. CFO Agent
**Rol**: Director Financiero

**Responsabilidades**:
- Gestión financiera completa
- Contabilidad y reportes financieros
- Tesorería y liquidez
- Inversiones y financiación
- Control presupuestario

**Especialistas que Consulta**: Finance, Data, Legal

**Acciones que Ejecuta**:
- Aprobar pagos
- Gestionar tesorería
- Crear reportes financieros
- Gestionar inversiones
- Aprobar créditos

**API**: `POST /api/v1/agents/executors/cfo/execute`

---

### 3. CTO Agent
**Rol**: Director de Tecnología

**Responsabilidades**:
- Estrategia tecnológica
- Infraestructura IT
- Desarrollo de software
- Ciberseguridad
- Innovación tecnológica

**Especialistas que Consulta**: Security, Data, Operations

**Acciones que Ejecuta**:
- Desplegar servicios
- Gestionar infraestructura
- Implementar seguridad
- Aprobar desarrollos
- Gestionar incidentes técnicos

**API**: `POST /api/v1/agents/executors/cto/execute`

---

### 4. CMO Agent
**Rol**: Director de Marketing

**Responsabilidades**:
- Estrategia de marketing
- Gestión de campañas
- Branding y comunicación
- Marketing digital
- Generación de leads

**Especialistas que Consulta**: Marketing, Customer, Data

**Acciones que Ejecuta**:
- Lanzar campañas
- Gestionar presupuesto de marketing
- Crear contenido
- Optimizar canales
- Gestionar redes sociales

**API**: `POST /api/v1/agents/executors/cmo/execute`

---

### 5. Sales Manager Agent
**Rol**: Director de Ventas

**Responsabilidades**:
- Gestión del equipo comercial
- Pipeline de ventas
- Conversión de oportunidades
- Pricing y descuentos
- Relación con clientes clave

**Especialistas que Consulta**: Insurance, Finance, Customer

**Acciones que Ejecuta**:
- Crear oportunidades
- Aprobar descuentos
- Asignar leads a comerciales
- Cerrar ventas
- Gestionar clientes

**API**: `POST /api/v1/agents/executors/sales-manager/execute`

---

### 6. Operations Manager Agent
**Rol**: Director de Operaciones

**Responsabilidades**:
- Gestión de operaciones diarias
- Optimización de procesos
- Gestión de recursos
- Control de calidad
- Eficiencia operativa

**Especialistas que Consulta**: Operations, Data, Finance

**Acciones que Ejecuta**:
- Optimizar procesos
- Asignar recursos
- Gestionar workflows
- Implementar automatizaciones
- Monitorear KPIs operacionales

**API**: `POST /api/v1/agents/executors/operations-manager/execute`

---

### 7. HR Manager Agent
**Rol**: Director de Recursos Humanos

**Responsabilidades**:
- Gestión del talento
- Contratación y onboarding
- Formación y desarrollo
- Gestión del desempeño
- Cultura organizacional

**Especialistas que Consulta**: Legal, Data, Operations

**Acciones que Ejecuta**:
- Publicar ofertas de empleo
- Gestionar contrataciones
- Asignar formaciones
- Evaluar desempeño
- Gestionar nóminas

**API**: `POST /api/v1/agents/executors/hr-manager/execute`

---

### 8. Compliance Officer Agent
**Rol**: Responsable de Cumplimiento

**Responsabilidades**:
- Cumplimiento normativo
- Auditorías y controles
- Gestión de riesgos legales
- Protección de datos (GDPR)
- Certificaciones (ISO, SOC2)

**Especialistas que Consulta**: Legal, Security, Finance

**Acciones que Ejecuta**:
- Ejecutar auditorías
- Generar reportes de compliance
- Gestionar incidencias GDPR
- Implementar controles
- Gestionar certificaciones

**API**: `POST /api/v1/agents/executors/compliance-officer/execute`

---

## 🔧 Uso de Agentes

### Consultar un Especialista

```typescript
// Ejemplo: Consultar Insurance Specialist
const response = await fetch('/api/v1/agents/specialists/insurance/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: "¿Qué prima debo aplicar a un seguro de hogar en Madrid de 150m²?",
    context: {
      propertyType: "apartment",
      location: "Madrid",
      squareMeters: 150,
      constructionYear: 2010,
      hasAlarm: true
    }
  })
});

const result = await response.json();
console.log(result.analysis);
console.log(result.recommendation);
```

### Ejecutar una Tarea con un Ejecutor

```typescript
// Ejemplo: Sales Manager crea oportunidad
const response = await fetch('/api/v1/agents/executors/sales-manager/execute', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    task: "create_opportunity",
    params: {
      clientId: 12345,
      productType: "seguros-hogar",
      estimatedValue: 1200,
      probability: 0.75
    }
  })
});

const result = await response.json();
console.log(result.opportunityId);
console.log(result.assignedTo);
```

---

## 📊 Monitoreo de Agentes

### Dashboard de Agentes

Acceso: `http://localhost:3002/admin/agents`

**Métricas disponibles**:
- Número de consultas/ejecuciones por agente
- Tiempo promedio de respuesta
- Tasa de éxito
- Agentes más utilizados
- Errores y excepciones

### Health Check

```bash
GET /api/v1/agents/health

Response:
{
  "specialists": {
    "insurance": "healthy",
    "finance": "healthy",
    "legal": "healthy",
    ...
  },
  "executors": {
    "ceo": "healthy",
    "cfo": "healthy",
    ...
  },
  "totalAgents": 16,
  "healthyAgents": 16
}
```

---

## 🚀 Implementación

Cada agente tiene su propia carpeta con:

```
agents/
├── specialists/
│   ├── insurance-specialist/
│   │   ├── package.json
│   │   ├── agent.config.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── analyzer.ts
│   │   │   ├── recommender.ts
│   │   │   └── knowledge-base/
│   │   ├── tests/
│   │   └── README.md
│   └── ...
│
└── executors/
    ├── ceo-agent/
    │   ├── package.json
    │   ├── agent.config.json
    │   ├── src/
    │   │   ├── index.ts
    │   │   ├── executor.ts
    │   │   ├── coordinator.ts
    │   │   └── decision-engine.ts
    │   ├── tests/
    │   └── README.md
    └── ...
```

---

## 🎯 Mejores Prácticas

1. **Siempre consulta especialistas antes de ejecutar**
   - Los ejecutores deben fundamentar sus decisiones

2. **Usa el agente apropiado para cada tarea**
   - No sobrecargues un agente con responsabilidades fuera de su dominio

3. **Monitorea el uso de tokens de Claude**
   - Los agentes consumen API calls, optimiza las consultas

4. **Implementa caché de respuestas**
   - Preguntas frecuentes pueden cachearse

5. **Logging completo**
   - Registra todas las interacciones para auditoría

---

## 📄 Licencia

Sistema propietario de **AIN TECH** para **Soriano Mediadores**.

---

**🤖 Powered by Claude Sonnet 4.5**

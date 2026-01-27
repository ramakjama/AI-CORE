// Training Agent - Handles employee training and development

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const TRAINING_AGENT_DEFINITION: AgentDefinition = {
  id: 'training-agent-v1',
  type: 'TRAINING_AGENT',
  name: 'Agente de Formacion SORI',
  description: 'Agente especializado en cursos, certificaciones, planes de formacion, evaluaciones y onboarding',
  systemPrompt: `Eres SORI, el asistente de Formacion de Soriano Mediadores.

Tu objetivo es ayudar con todas las necesidades formativas:
- Gestion de cursos y formaciones
- Certificaciones profesionales
- Planes de desarrollo individuales
- Evaluaciones de conocimientos
- Onboarding de nuevos empleados

CATALOGO FORMATIVO:

1. FORMACIONES OBLIGATORIAS:
   | Curso | Duracion | Renovacion | Colectivo |
   |-------|----------|------------|-----------|
   | PRL - Prevencion Riesgos | 8h | Anual | Todos |
   | LOPD/GDPR | 4h | Anual | Todos |
   | IDD - Distribucion Seguros | 25h | 3 anos | Mediadores |
   | PBC - Blanqueo Capitales | 4h | Anual | Todos |
   | Codigo Etico | 2h | Anual | Todos |
   | Seguridad Informatica | 4h | Anual | Todos |

2. FORMACIONES TECNICAS:
   **Productos:**
   - Auto: Basico (4h), Avanzado (8h), Flotas (8h)
   - Hogar: Basico (4h), Avanzado (8h)
   - Vida: Basico (4h), Ahorro/Inversion (8h)
   - Salud: Productos (4h), Colectivos (8h)
   - Empresas: RC (8h), Multirriesgo (8h), D&O (4h)

   **Sistemas:**
   - CRM Dynamics: Basico (8h), Avanzado (16h)
   - Gestor de polizas: Basico (8h)
   - Portal cliente: Uso y soporte (4h)

3. HABILIDADES:
   - Atencion al cliente (8h)
   - Negociacion y ventas (16h)
   - Comunicacion efectiva (8h)
   - Gestion del tiempo (4h)
   - Liderazgo (16h)

4. CERTIFICACIONES EXTERNAS:
   - Mediador de seguros (DGSFP)
   - EFPA (European Financial Planning)
   - PMP (Project Management)
   - ITIL (IT Service Management)

MODALIDADES:
- Presencial: Aula formacion
- Virtual sincrono: Teams/Zoom
- E-learning: Plataforma LMS
- Mixto: Combinacion modalidades

PLANES DE FORMACION:

| Perfil | Horas/ano | Formacion tipo |
|--------|-----------|----------------|
| Comercial | 40h | Productos, ventas, IDD |
| Tramitador | 30h | Sistemas, procesos |
| Atencion cliente | 30h | Productos, comunicacion |
| Tecnico | 40h | Especialización, certificaciones |
| Manager | 50h | Liderazgo, gestion |

EVALUACIONES:
- Test de conocimientos post-formacion
- Minimo 70% para aprobar
- 3 intentos maximos
- Certificado automatico al aprobar

REGLAS:
1. Las formaciones obligatorias tienen prioridad
2. Verificar plazas disponibles antes de inscribir
3. Notificar cancelaciones con 48h minimo
4. Registrar asistencia y evaluaciones
5. Escalar incidencias al Departamento de Formacion

TONO: Motivador, orientado al desarrollo profesional.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.5,
  tools: ['get_course', 'enroll_employee', 'get_training_plan', 'get_certifications', 'get_employee', 'send_email', 'start_workflow', 'generate_document'],
  maxTurns: 25,
  timeout: 300000,
  databases: ['sm_global', 'sm_training', 'sm_hr', 'sm_documents', 'sm_communications', 'sm_workflows'],
  permissions: ['read:course', 'write:enrollment', 'read:training_plan', 'write:training_plan', 'read:certification', 'read:employee', 'send:notification'],
  isActive: true,
};

export class TrainingAgent extends BaseAgent {
  constructor() {
    super(TRAINING_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    let response: string;

    if (userContent.toLowerCase().includes('curso') || userContent.toLowerCase().includes('formacion') || userContent.toLowerCase().includes('inscrib')) {
      response = `Te ayudo con cursos y formaciones.

**Cursos disponibles:**

**Proximas convocatorias:**
Para ver las proximas formaciones, consultare el sistema.

**Buscar formacion por area:**

| Area | Cursos disponibles |
|------|-------------------|
| Obligatorias | PRL, LOPD, IDD, PBC, Codigo Etico |
| Productos | Auto, Hogar, Vida, Salud, Empresas |
| Sistemas | CRM, Gestor polizas, Portal cliente |
| Habilidades | Ventas, Comunicacion, Liderazgo |

**Para inscribirte necesito:**
1. Tu numero de empleado
2. Codigo o nombre del curso
3. Fecha/convocatoria preferida

**Modalidades:**
- **Presencial**: En aula de formacion
- **Virtual**: Sesiones en directo online
- **E-learning**: A tu ritmo en plataforma LMS
- **Mixto**: Parte online, parte presencial

**Proceso de inscripcion:**
1. Verificar plazas disponibles
2. Comprobar requisitos previos
3. Confirmar inscripcion
4. Enviar convocatoria por email
5. Recordatorio 24h antes

¿En que curso te gustaria inscribirte?`;
    } else if (userContent.toLowerCase().includes('plan') || userContent.toLowerCase().includes('desarrollo') || userContent.toLowerCase().includes('itinerario')) {
      response = `Te informo sobre planes de formacion.

**Tu plan de formacion:**
Para ver tu plan personalizado, necesito tu numero de empleado.

**Estructura del plan anual:**

**Formaciones obligatorias (priorizadas):**
| Formacion | Estado | Fecha limite |
|-----------|--------|--------------|
| (Pendiente consulta) | | |

**Formaciones tecnicas recomendadas:**
Basadas en tu rol y objetivos de desarrollo.

**Habilidades a desarrollar:**
Segun tu evaluacion de desempeno.

**Crear/Modificar plan:**

Un plan de formacion incluye:
1. **Objetivos de desarrollo**: Que competencias mejorar
2. **Formaciones asignadas**: Cursos y fechas
3. **Horas objetivo**: Segun perfil (30-50h/ano)
4. **Seguimiento**: Hitos y revisiones

**Itinerarios formativos por rol:**

| Rol | Itinerario |
|-----|------------|
| Comercial Junior | Productos basicos + Ventas + IDD |
| Comercial Senior | Productos avanzados + Negociacion |
| Tramitador | Sistemas + Procesos + Atencion cliente |
| Manager | Liderazgo + Gestion equipos + Estrategia |

¿Quieres consultar tu plan o crear uno nuevo?`;
    } else if (userContent.toLowerCase().includes('certificacion') || userContent.toLowerCase().includes('certificado') || userContent.toLowerCase().includes('titulo')) {
      response = `Te informo sobre certificaciones.

**Tus certificaciones:**
Para ver tus certificaciones, necesito tu numero de empleado.

**Certificaciones internas:**
Al completar cursos con aprovechamiento se genera certificado automatico.

**Certificaciones externas reconocidas:**

| Certificacion | Entidad | Requisitos | Validez |
|---------------|---------|------------|---------|
| Mediador Seguros | DGSFP | Examen oficial | Indefinida |
| EFPA EIP | EFPA | Examen + experiencia | 2 anos |
| EFPA EFA | EFPA | Examen + experiencia | 2 anos |
| EFPA EFP | EFPA | Examen + experiencia | 2 anos |
| PMP | PMI | Examen + horas proyecto | 3 anos |
| ITIL | Axelos | Examen | 3 anos |

**Ayudas a la certificacion:**
- Soriano bonifica el 100% del coste de examenes
- Dias de permiso para preparacion (segun convenio)
- Material de estudio proporcionado
- Incremento salarial al obtener certificacion

**Proceso:**
1. Solicitar ayuda a certificacion
2. Aprobacion por RRHH
3. Inscripcion al examen
4. Preparacion (curso + autoestudio)
5. Examen oficial
6. Registro en expediente

**Renovaciones pendientes:**
Para ver certificaciones proximas a caducar.

¿Sobre que certificacion necesitas informacion?`;
    } else if (userContent.toLowerCase().includes('evalua') || userContent.toLowerCase().includes('test') || userContent.toLowerCase().includes('examen')) {
      response = `Te ayudo con las evaluaciones.

**Evaluaciones pendientes:**
Para ver tus evaluaciones, necesito tu numero de empleado.

**Tipos de evaluacion:**

| Tipo | Cuando | Requisitos |
|------|--------|------------|
| Post-formacion | Al finalizar curso | Minimo 70% |
| Certificacion interna | Solicitud | Segun curso |
| Evaluacion conocimientos | Periodica | Minimo 60% |
| Assessment competencias | Anual | Completar 100% |

**Normas de evaluacion:**
- **Intentos**: Maximo 3 por evaluacion
- **Tiempo**: Variable segun test (30-120 min)
- **Formato**: Test online en plataforma LMS
- **Resultados**: Inmediatos al finalizar
- **Certificado**: Automatico si apruebas

**Preparacion para examenes:**
- Revisar material del curso
- Realizar ejercicios practicos
- Consultar dudas al formador
- Usar recursos adicionales en LMS

**Resultados de evaluaciones:**
| Test | Fecha | Puntuacion | Estado |
|------|-------|------------|--------|
| (Pendiente consulta) | | | |

**Si suspendes:**
1. Esperar 48h minimo entre intentos
2. Revisar feedback y areas a mejorar
3. Consultar material adicional
4. Solicitar tutoria si es necesario

¿Quieres realizar una evaluacion o consultar resultados?`;
    } else if (userContent.toLowerCase().includes('onboarding') || userContent.toLowerCase().includes('incorporacion') || userContent.toLowerCase().includes('nuevo empleado')) {
      response = `Te ayudo con el proceso de onboarding.

**Programa de Onboarding:**

**Semana 1: Bienvenida e integracion**
| Dia | Actividad | Duracion |
|-----|-----------|----------|
| 1 | Bienvenida RRHH + Presentacion empresa | 4h |
| 1 | Configuracion puesto + Accesos | 2h |
| 2 | Formacion LOPD + Codigo Etico | 4h |
| 3 | Formacion PRL | 4h |
| 4-5 | Conocer equipo + Sistemas basicos | 8h |

**Semana 2-4: Formacion tecnica**
Segun el rol:

*Comercial*:
- Productos basicos (auto, hogar, vida)
- CRM y herramientas de venta
- Proceso comercial
- Shadowing con comercial senior

*Tramitador*:
- Gestor de polizas
- Procesos de emision
- Atencion telefonica
- Practica supervisada

*Atencion cliente*:
- Productos y coberturas
- Herramientas de consulta
- Protocolos de atencion
- Escucha de llamadas

**Evaluacion del onboarding:**
- Test de conocimientos: Semana 4
- Evaluacion del responsable: Mes 1
- Feedback del nuevo empleado: Mes 1
- Seguimiento: Meses 3 y 6

**Buddy asignado:**
Cada nuevo empleado tiene un companero-mentor que le guia durante los primeros meses.

¿En que parte del onboarding necesitas ayuda?`;
    } else {
      response = `Hola! Soy SORI, tu asistente de Formacion en Soriano Mediadores.

Puedo ayudarte con:
- **Cursos**: Catalogo, inscripciones, convocatorias
- **Plan de formacion**: Tu itinerario personalizado
- **Certificaciones**: Internas y externas
- **Evaluaciones**: Tests y examenes
- **Onboarding**: Nuevas incorporaciones

**Formaciones obligatorias:**
- PRL, LOPD, IDD, PBC, Codigo Etico, Seguridad IT

**Plataforma LMS:**
Accede a lms.sorianoseguros.com para:
- Ver cursos disponibles
- Realizar formaciones e-learning
- Consultar tu historial
- Descargar certificados

**Contacto Formacion:**
formacion@sorianoseguros.com

¿En que puedo ayudarte?`;
    }

    const assistantMessage: AgentMessage = {
      id: this.generateId(),
      instanceId: this.instance!.id,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    this.messages.push(assistantMessage);
    return assistantMessage;
  }

  async getCourse(courseId: string): Promise<unknown> {
    const courseTool = this.tools.get('get_course');
    if (!courseTool) throw new Error('Course tool not available');

    return courseTool.handler(
      { courseId },
      this.instance?.context ?? {}
    );
  }

  async enrollEmployee(employeeId: string, courseId: string, sessionId?: string): Promise<unknown> {
    // 1. Get employee info
    const employeeTool = this.tools.get('get_employee');
    const employee = await employeeTool?.handler({ employeeId }, this.instance?.context ?? {});

    // 2. Check course availability
    const course = await this.getCourse(courseId);

    // 3. Enroll employee
    const enrollTool = this.tools.get('enroll_employee');
    const enrollment = await enrollTool?.handler(
      {
        employeeId,
        courseId,
        sessionId,
        enrollmentDate: new Date()
      },
      this.instance?.context ?? {}
    );

    // 4. Send confirmation email
    const emailTool = this.tools.get('send_email');
    await emailTool?.handler(
      {
        to: (employee as { email?: string })?.email,
        templateCode: 'COURSE_ENROLLMENT',
        templateData: { employee, course, enrollment }
      },
      this.instance?.context ?? {}
    );

    return enrollment;
  }

  async getTrainingPlan(employeeId: string): Promise<unknown> {
    const planTool = this.tools.get('get_training_plan');
    if (!planTool) throw new Error('Training plan tool not available');

    return planTool.handler(
      { employeeId },
      this.instance?.context ?? {}
    );
  }

  async getCertifications(employeeId: string): Promise<unknown> {
    const certTool = this.tools.get('get_certifications');
    if (!certTool) throw new Error('Certifications tool not available');

    return certTool.handler(
      { employeeId },
      this.instance?.context ?? {}
    );
  }

  async createOnboardingPlan(employeeId: string, role: string, startDate: Date): Promise<unknown> {
    // 1. Get employee info
    const employeeTool = this.tools.get('get_employee');
    const employee = await employeeTool?.handler({ employeeId }, this.instance?.context ?? {});

    // 2. Create training plan based on role
    const planTool = this.tools.get('get_training_plan');
    const plan = await planTool?.handler(
      {
        employeeId,
        type: 'ONBOARDING',
        role,
        startDate
      },
      this.instance?.context ?? {}
    );

    // 3. Start onboarding workflow
    const workflowTool = this.tools.get('start_workflow');
    await workflowTool?.handler(
      {
        workflowCode: 'EMPLOYEE_ONBOARDING',
        title: `Onboarding ${(employee as { name?: string })?.name}`,
        entityType: 'employee',
        entityId: employeeId,
        variables: { role, startDate, plan }
      },
      this.instance?.context ?? {}
    );

    // 4. Generate onboarding checklist
    const docTool = this.tools.get('generate_document');
    const checklist = await docTool?.handler(
      {
        templateCode: 'ONBOARDING_CHECKLIST',
        data: { employee, role, startDate, plan },
        format: 'PDF'
      },
      this.instance?.context ?? {}
    );

    // 5. Send welcome email
    const emailTool = this.tools.get('send_email');
    await emailTool?.handler(
      {
        to: (employee as { email?: string })?.email,
        templateCode: 'WELCOME_ONBOARDING',
        templateData: { employee, role, startDate, plan },
        attachments: [checklist]
      },
      this.instance?.context ?? {}
    );

    return {
      employeeId,
      plan,
      checklist,
      status: 'CREATED',
      message: 'Plan de onboarding creado correctamente'
    };
  }

  async checkMandatoryTraining(employeeId: string): Promise<{
    compliant: boolean;
    pending: Array<{ course: string; deadline: Date }>;
    expiringSoon: Array<{ course: string; expiryDate: Date }>;
  }> {
    // Get employee certifications and training history
    const certs = await this.getCertifications(employeeId);
    const certList = (certs as { certifications?: Array<{ code: string; expiryDate: Date }> })?.certifications ?? [];

    const mandatoryCourses = ['PRL', 'LOPD', 'PBC', 'CODIGO_ETICO', 'SEGURIDAD_IT'];
    const pending: Array<{ course: string; deadline: Date }> = [];
    const expiringSoon: Array<{ course: string; expiryDate: Date }> = [];

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    mandatoryCourses.forEach(course => {
      const cert = certList.find(c => c.code === course);
      if (!cert) {
        pending.push({ course, deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) });
      } else if (new Date(cert.expiryDate) < thirtyDaysFromNow) {
        expiringSoon.push({ course, expiryDate: new Date(cert.expiryDate) });
      }
    });

    return {
      compliant: pending.length === 0,
      pending,
      expiringSoon
    };
  }
}

export const trainingAgent = new TrainingAgent();

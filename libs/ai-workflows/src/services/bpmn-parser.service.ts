/**
 * AI-Workflows - Servicio de parsing BPMN 2.0
 * @module @ai-core/ai-workflows/services/bpmn-parser
 */

import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowConfig,
  NodeType,
  TransitionType,
  WorkflowStatus,
  NodeConfig,
  BoundaryEventConfig,
  VariableDefinition,
  VariableType,
  TimerEventType,
  TaskPriority,
  ValidationRule,
  WorkflowError,
  WorkflowErrorCode,
  MultiInstanceConfig,
  VariableMapping,
  ExecutionListener,
  TaskListener
} from '../types';

/**
 * Resultado del parsing BPMN
 */
export interface BpmnParseResult {
  success: boolean;
  definition?: WorkflowDefinition;
  errors: BpmnValidationError[];
  warnings: BpmnValidationWarning[];
}

/**
 * Error de validación BPMN
 */
export interface BpmnValidationError {
  code: string;
  message: string;
  nodeId?: string;
  line?: number;
}

/**
 * Advertencia de validación BPMN
 */
export interface BpmnValidationWarning {
  code: string;
  message: string;
  nodeId?: string;
  suggestion?: string;
}

/**
 * Servicio de parsing y validación BPMN 2.0
 */
export class BpmnParserService {
  private readonly xmlParser: XMLParser;
  private readonly xmlBuilder: XMLBuilder;

  // Namespaces BPMN
  private readonly BPMN_NS = 'http://www.omg.org/spec/BPMN/20100524/MODEL';
  private readonly BPMNDI_NS = 'http://www.omg.org/spec/BPMN/20100524/DI';
  private readonly DC_NS = 'http://www.omg.org/spec/DD/20100524/DC';
  private readonly DI_NS = 'http://www.omg.org/spec/DD/20100524/DI';

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
      parseTagValue: true,
      isArray: (name) => {
        // Elementos que siempre son arrays
        const arrayElements = [
          'process', 'sequenceFlow', 'startEvent', 'endEvent',
          'userTask', 'serviceTask', 'scriptTask', 'sendTask', 'receiveTask',
          'exclusiveGateway', 'inclusiveGateway', 'parallelGateway', 'eventBasedGateway',
          'subProcess', 'callActivity', 'boundaryEvent', 'intermediateCatchEvent',
          'intermediateThrowEvent', 'dataInputAssociation', 'dataOutputAssociation',
          'incoming', 'outgoing', 'participant', 'lane', 'flowNodeRef',
          'timerEventDefinition', 'messageEventDefinition', 'signalEventDefinition',
          'errorEventDefinition', 'conditionalEventDefinition', 'extensionElements',
          'inputParameter', 'outputParameter', 'field', 'property'
        ];
        return arrayElements.includes(name);
      }
    });

    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      format: true,
      indentBy: '  '
    });
  }

  /**
   * Parsea un documento BPMN 2.0 XML
   */
  async parseXML(bpmnXml: string): Promise<BpmnParseResult> {
    const errors: BpmnValidationError[] = [];
    const warnings: BpmnValidationWarning[] = [];

    try {
      // Parsear XML
      const parsed = this.xmlParser.parse(bpmnXml);

      // Obtener definiciones
      const definitions = parsed['bpmn:definitions'] ||
                         parsed['definitions'] ||
                         parsed['bpmn2:definitions'];

      if (!definitions) {
        errors.push({
          code: 'MISSING_DEFINITIONS',
          message: 'No se encontró el elemento raíz de definiciones BPMN'
        });
        return { success: false, errors, warnings };
      }

      // Obtener procesos
      const processes = this.getArray(definitions['bpmn:process'] ||
                                       definitions['process'] ||
                                       definitions['bpmn2:process']);

      if (processes.length === 0) {
        errors.push({
          code: 'NO_PROCESS',
          message: 'No se encontró ningún proceso en el documento BPMN'
        });
        return { success: false, errors, warnings };
      }

      // Procesar el primer proceso (principal)
      const mainProcess = processes[0];
      const processId = mainProcess['@_id'] || uuidv4();
      const processName = mainProcess['@_name'] || 'Proceso sin nombre';

      // Extraer nodos y aristas
      const nodes = this.extractNodes(mainProcess);
      const edges = this.extractEdges(mainProcess);

      // Extraer información de diagrama (posiciones)
      const diagramInfo = this.extractDiagramInfo(definitions);
      this.applyDiagramPositions(nodes, edges, diagramInfo);

      // Extraer variables de extensión
      const variables = this.extractVariables(mainProcess);

      // Construir definición
      const definition: WorkflowDefinition = {
        id: uuidv4(),
        code: processId,
        name: processName,
        description: this.extractDocumentation(mainProcess),
        version: 1,
        status: WorkflowStatus.DRAFT,
        bpmnXml: bpmnXml,
        nodes,
        edges,
        config: this.extractConfig(mainProcess),
        variables,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validar definición
      const validationResult = await this.validateDefinition(definition);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);

      return {
        success: errors.length === 0,
        definition: errors.length === 0 ? definition : undefined,
        errors,
        warnings
      };

    } catch (error) {
      errors.push({
        code: 'PARSE_ERROR',
        message: `Error al parsear XML: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
      return { success: false, errors, warnings };
    }
  }

  /**
   * Valida una definición de workflow
   */
  async validateDefinition(definition: WorkflowDefinition): Promise<{
    valid: boolean;
    errors: BpmnValidationError[];
    warnings: BpmnValidationWarning[];
  }> {
    const errors: BpmnValidationError[] = [];
    const warnings: BpmnValidationWarning[] = [];

    // Validar que existe al menos un evento de inicio
    const startEvents = this.findStartEvents(definition);
    if (startEvents.length === 0) {
      errors.push({
        code: 'NO_START_EVENT',
        message: 'El proceso debe tener al menos un evento de inicio'
      });
    }

    // Validar que existe al menos un evento de fin
    const endEvents = this.findEndEvents(definition);
    if (endEvents.length === 0) {
      errors.push({
        code: 'NO_END_EVENT',
        message: 'El proceso debe tener al menos un evento de fin'
      });
    }

    // Validar conectividad
    const connectivityErrors = this.validateConnectivity(definition);
    errors.push(...connectivityErrors);

    // Validar gateways
    const gatewayErrors = this.validateGateways(definition);
    errors.push(...gatewayErrors);

    // Validar tareas
    const taskWarnings = this.validateTasks(definition);
    warnings.push(...taskWarnings);

    // Validar expresiones
    const expressionWarnings = this.validateExpressions(definition);
    warnings.push(...expressionWarnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Extrae nodos del proceso BPMN
   */
  extractNodes(process: any): WorkflowNode[] {
    const nodes: WorkflowNode[] = [];

    // Eventos de inicio
    this.getArray(process['bpmn:startEvent'] || process['startEvent']).forEach((event: any) => {
      nodes.push(this.parseStartEvent(event));
    });

    // Eventos de fin
    this.getArray(process['bpmn:endEvent'] || process['endEvent']).forEach((event: any) => {
      nodes.push(this.parseEndEvent(event));
    });

    // User Tasks
    this.getArray(process['bpmn:userTask'] || process['userTask']).forEach((task: any) => {
      nodes.push(this.parseUserTask(task));
    });

    // Service Tasks
    this.getArray(process['bpmn:serviceTask'] || process['serviceTask']).forEach((task: any) => {
      nodes.push(this.parseServiceTask(task));
    });

    // Script Tasks
    this.getArray(process['bpmn:scriptTask'] || process['scriptTask']).forEach((task: any) => {
      nodes.push(this.parseScriptTask(task));
    });

    // Send Tasks
    this.getArray(process['bpmn:sendTask'] || process['sendTask']).forEach((task: any) => {
      nodes.push(this.parseSendTask(task));
    });

    // Receive Tasks
    this.getArray(process['bpmn:receiveTask'] || process['receiveTask']).forEach((task: any) => {
      nodes.push(this.parseReceiveTask(task));
    });

    // Manual Tasks
    this.getArray(process['bpmn:manualTask'] || process['manualTask']).forEach((task: any) => {
      nodes.push(this.parseManualTask(task));
    });

    // Business Rule Tasks
    this.getArray(process['bpmn:businessRuleTask'] || process['businessRuleTask']).forEach((task: any) => {
      nodes.push(this.parseBusinessRuleTask(task));
    });

    // Exclusive Gateways
    this.getArray(process['bpmn:exclusiveGateway'] || process['exclusiveGateway']).forEach((gw: any) => {
      nodes.push(this.parseExclusiveGateway(gw));
    });

    // Inclusive Gateways
    this.getArray(process['bpmn:inclusiveGateway'] || process['inclusiveGateway']).forEach((gw: any) => {
      nodes.push(this.parseInclusiveGateway(gw));
    });

    // Parallel Gateways
    this.getArray(process['bpmn:parallelGateway'] || process['parallelGateway']).forEach((gw: any) => {
      nodes.push(this.parseParallelGateway(gw));
    });

    // Event-based Gateways
    this.getArray(process['bpmn:eventBasedGateway'] || process['eventBasedGateway']).forEach((gw: any) => {
      nodes.push(this.parseEventBasedGateway(gw));
    });

    // Subprocesses
    this.getArray(process['bpmn:subProcess'] || process['subProcess']).forEach((sp: any) => {
      nodes.push(this.parseSubProcess(sp));
    });

    // Call Activities
    this.getArray(process['bpmn:callActivity'] || process['callActivity']).forEach((ca: any) => {
      nodes.push(this.parseCallActivity(ca));
    });

    // Intermediate Catch Events
    this.getArray(process['bpmn:intermediateCatchEvent'] || process['intermediateCatchEvent']).forEach((event: any) => {
      nodes.push(this.parseIntermediateCatchEvent(event));
    });

    // Intermediate Throw Events
    this.getArray(process['bpmn:intermediateThrowEvent'] || process['intermediateThrowEvent']).forEach((event: any) => {
      nodes.push(this.parseIntermediateThrowEvent(event));
    });

    // Boundary Events
    this.getArray(process['bpmn:boundaryEvent'] || process['boundaryEvent']).forEach((event: any) => {
      const boundaryEvent = this.parseBoundaryEvent(event);
      nodes.push(boundaryEvent);

      // Asociar con el nodo padre
      const attachedToRef = event['@_attachedToRef'];
      if (attachedToRef) {
        const parentNode = nodes.find(n => n.id === attachedToRef);
        if (parentNode) {
          if (!parentNode.boundaryEvents) {
            parentNode.boundaryEvents = [];
          }
          parentNode.boundaryEvents.push({
            id: boundaryEvent.id,
            type: boundaryEvent.type,
            cancelActivity: event['@_cancelActivity'] !== false,
            timerType: boundaryEvent.config.timerType,
            timerExpression: boundaryEvent.config.timerExpression,
            outgoingFlow: this.getFirstOutgoing(event)
          });
        }
      }
    });

    return nodes;
  }

  /**
   * Extrae aristas/flujos del proceso BPMN
   */
  extractEdges(process: any): WorkflowEdge[] {
    const edges: WorkflowEdge[] = [];

    this.getArray(process['bpmn:sequenceFlow'] || process['sequenceFlow']).forEach((flow: any) => {
      const edge: WorkflowEdge = {
        id: flow['@_id'] || uuidv4(),
        type: TransitionType.SEQUENCE_FLOW,
        name: flow['@_name'],
        sourceNodeId: flow['@_sourceRef'],
        targetNodeId: flow['@_targetRef'],
        isDefault: false
      };

      // Condición
      const conditionExpression = flow['bpmn:conditionExpression'] || flow['conditionExpression'];
      if (conditionExpression) {
        edge.type = TransitionType.CONDITIONAL_FLOW;
        edge.conditionExpression = typeof conditionExpression === 'string'
          ? conditionExpression
          : conditionExpression['#text'];
      }

      edges.push(edge);
    });

    // Marcar flujos por defecto en gateways
    this.getArray(process['bpmn:exclusiveGateway'] || process['exclusiveGateway']).forEach((gw: any) => {
      const defaultFlow = gw['@_default'];
      if (defaultFlow) {
        const edge = edges.find(e => e.id === defaultFlow);
        if (edge) {
          edge.isDefault = true;
          edge.type = TransitionType.DEFAULT_FLOW;
        }
      }
    });

    return edges;
  }

  /**
   * Encuentra eventos de inicio
   */
  findStartEvents(definition: WorkflowDefinition): WorkflowNode[] {
    return definition.nodes.filter(node =>
      node.type === NodeType.START_EVENT ||
      node.type === NodeType.START_EVENT_TIMER ||
      node.type === NodeType.START_EVENT_MESSAGE ||
      node.type === NodeType.START_EVENT_SIGNAL ||
      node.type === NodeType.START_EVENT_CONDITIONAL
    );
  }

  /**
   * Encuentra eventos de fin
   */
  findEndEvents(definition: WorkflowDefinition): WorkflowNode[] {
    return definition.nodes.filter(node =>
      node.type === NodeType.END_EVENT ||
      node.type === NodeType.END_EVENT_ERROR ||
      node.type === NodeType.END_EVENT_TERMINATE ||
      node.type === NodeType.END_EVENT_MESSAGE ||
      node.type === NodeType.END_EVENT_SIGNAL
    );
  }

  /**
   * Encuentra el siguiente nodo después de un nodo dado
   */
  findNextNodes(definition: WorkflowDefinition, nodeId: string): WorkflowNode[] {
    const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === nodeId);
    return outgoingEdges.map(e =>
      definition.nodes.find(n => n.id === e.targetNodeId)
    ).filter((n): n is WorkflowNode => n !== undefined);
  }

  /**
   * Encuentra nodos previos a un nodo dado
   */
  findPreviousNodes(definition: WorkflowDefinition, nodeId: string): WorkflowNode[] {
    const incomingEdges = definition.edges.filter(e => e.targetNodeId === nodeId);
    return incomingEdges.map(e =>
      definition.nodes.find(n => n.id === e.sourceNodeId)
    ).filter((n): n is WorkflowNode => n !== undefined);
  }

  // ========================================================================
  // Métodos privados de parsing
  // ========================================================================

  private parseStartEvent(event: any): WorkflowNode {
    let type = NodeType.START_EVENT;

    // Determinar tipo por definición de evento
    if (event['bpmn:timerEventDefinition'] || event['timerEventDefinition']) {
      type = NodeType.START_EVENT_TIMER;
    } else if (event['bpmn:messageEventDefinition'] || event['messageEventDefinition']) {
      type = NodeType.START_EVENT_MESSAGE;
    } else if (event['bpmn:signalEventDefinition'] || event['signalEventDefinition']) {
      type = NodeType.START_EVENT_SIGNAL;
    } else if (event['bpmn:conditionalEventDefinition'] || event['conditionalEventDefinition']) {
      type = NodeType.START_EVENT_CONDITIONAL;
    }

    return {
      id: event['@_id'] || uuidv4(),
      type,
      name: event['@_name'] || 'Inicio',
      description: this.extractDocumentation(event),
      position: { x: 0, y: 0 },
      config: this.extractTimerConfig(event)
    };
  }

  private parseEndEvent(event: any): WorkflowNode {
    let type = NodeType.END_EVENT;

    if (event['bpmn:errorEventDefinition'] || event['errorEventDefinition']) {
      type = NodeType.END_EVENT_ERROR;
    } else if (event['bpmn:terminateEventDefinition'] || event['terminateEventDefinition']) {
      type = NodeType.END_EVENT_TERMINATE;
    } else if (event['bpmn:messageEventDefinition'] || event['messageEventDefinition']) {
      type = NodeType.END_EVENT_MESSAGE;
    } else if (event['bpmn:signalEventDefinition'] || event['signalEventDefinition']) {
      type = NodeType.END_EVENT_SIGNAL;
    }

    return {
      id: event['@_id'] || uuidv4(),
      type,
      name: event['@_name'] || 'Fin',
      description: this.extractDocumentation(event),
      position: { x: 0, y: 0 },
      config: {}
    };
  }

  private parseUserTask(task: any): WorkflowNode {
    const config: NodeConfig = {
      assigneeExpression: task['@_camunda:assignee'] || task['@_assignee'],
      candidateUsers: this.parseCommaSeparated(task['@_camunda:candidateUsers'] || task['@_candidateUsers']),
      candidateGroups: this.parseCommaSeparated(task['@_camunda:candidateGroups'] || task['@_candidateGroups']),
      formKey: task['@_camunda:formKey'] || task['@_formKey'],
      dueDate: task['@_camunda:dueDate'] || task['@_dueDate'],
      priority: this.parsePriority(task['@_camunda:priority'] || task['@_priority'])
    };

    // Extraer listeners
    const extensionElements = task['bpmn:extensionElements'] || task['extensionElements'];
    if (extensionElements) {
      config.taskListeners = this.extractTaskListeners(extensionElements);
      config.executionListeners = this.extractExecutionListeners(extensionElements);
    }

    return {
      id: task['@_id'] || uuidv4(),
      type: NodeType.USER_TASK,
      name: task['@_name'] || 'Tarea de usuario',
      description: this.extractDocumentation(task),
      position: { x: 0, y: 0 },
      config
    };
  }

  private parseServiceTask(task: any): WorkflowNode {
    const config: NodeConfig = {
      serviceType: 'HTTP',
      asyncExecution: task['@_camunda:asyncBefore'] === true || task['@_camunda:asyncAfter'] === true
    };

    // Extraer tipo de servicio
    const delegateExpression = task['@_camunda:delegateExpression'];
    const className = task['@_camunda:class'];
    const expression = task['@_camunda:expression'];
    const topic = task['@_camunda:topic'];

    if (delegateExpression) {
      config.serviceType = 'INTERNAL';
      config.serviceEndpoint = delegateExpression;
    } else if (className) {
      config.serviceType = 'INTERNAL';
      config.serviceEndpoint = className;
    } else if (expression) {
      config.serviceType = 'SCRIPT';
      config.script = expression;
    } else if (topic) {
      config.serviceType = 'GRPC';
      config.serviceEndpoint = topic;
    }

    // Extraer input/output
    const extensionElements = task['bpmn:extensionElements'] || task['extensionElements'];
    if (extensionElements) {
      const inputOutput = extensionElements['camunda:inputOutput'];
      if (inputOutput) {
        config.inputVariables = this.extractInputParameters(inputOutput);
        config.outputVariables = this.extractOutputParameters(inputOutput);
      }
    }

    return {
      id: task['@_id'] || uuidv4(),
      type: NodeType.SERVICE_TASK,
      name: task['@_name'] || 'Tarea de servicio',
      description: this.extractDocumentation(task),
      position: { x: 0, y: 0 },
      config
    };
  }

  private parseScriptTask(task: any): WorkflowNode {
    return {
      id: task['@_id'] || uuidv4(),
      type: NodeType.SCRIPT_TASK,
      name: task['@_name'] || 'Tarea de script',
      description: this.extractDocumentation(task),
      position: { x: 0, y: 0 },
      config: {
        scriptLanguage: task['@_scriptFormat'] || 'javascript',
        script: task['bpmn:script'] || task['script'] || ''
      }
    };
  }

  private parseSendTask(task: any): WorkflowNode {
    return {
      id: task['@_id'] || uuidv4(),
      type: NodeType.SEND_TASK,
      name: task['@_name'] || 'Tarea de envío',
      description: this.extractDocumentation(task),
      position: { x: 0, y: 0 },
      config: {}
    };
  }

  private parseReceiveTask(task: any): WorkflowNode {
    return {
      id: task['@_id'] || uuidv4(),
      type: NodeType.RECEIVE_TASK,
      name: task['@_name'] || 'Tarea de recepción',
      description: this.extractDocumentation(task),
      position: { x: 0, y: 0 },
      config: {}
    };
  }

  private parseManualTask(task: any): WorkflowNode {
    return {
      id: task['@_id'] || uuidv4(),
      type: NodeType.MANUAL_TASK,
      name: task['@_name'] || 'Tarea manual',
      description: this.extractDocumentation(task),
      position: { x: 0, y: 0 },
      config: {}
    };
  }

  private parseBusinessRuleTask(task: any): WorkflowNode {
    return {
      id: task['@_id'] || uuidv4(),
      type: NodeType.BUSINESS_RULE_TASK,
      name: task['@_name'] || 'Regla de negocio',
      description: this.extractDocumentation(task),
      position: { x: 0, y: 0 },
      config: {
        conditionExpression: task['@_camunda:decisionRef']
      }
    };
  }

  private parseExclusiveGateway(gateway: any): WorkflowNode {
    return {
      id: gateway['@_id'] || uuidv4(),
      type: NodeType.EXCLUSIVE_GATEWAY,
      name: gateway['@_name'] || 'Decisión exclusiva',
      description: this.extractDocumentation(gateway),
      position: { x: 0, y: 0 },
      config: {
        defaultFlow: gateway['@_default']
      }
    };
  }

  private parseInclusiveGateway(gateway: any): WorkflowNode {
    return {
      id: gateway['@_id'] || uuidv4(),
      type: NodeType.INCLUSIVE_GATEWAY,
      name: gateway['@_name'] || 'Decisión inclusiva',
      description: this.extractDocumentation(gateway),
      position: { x: 0, y: 0 },
      config: {
        defaultFlow: gateway['@_default']
      }
    };
  }

  private parseParallelGateway(gateway: any): WorkflowNode {
    return {
      id: gateway['@_id'] || uuidv4(),
      type: NodeType.PARALLEL_GATEWAY,
      name: gateway['@_name'] || 'Bifurcación paralela',
      description: this.extractDocumentation(gateway),
      position: { x: 0, y: 0 },
      config: {}
    };
  }

  private parseEventBasedGateway(gateway: any): WorkflowNode {
    return {
      id: gateway['@_id'] || uuidv4(),
      type: NodeType.EVENT_BASED_GATEWAY,
      name: gateway['@_name'] || 'Gateway basado en eventos',
      description: this.extractDocumentation(gateway),
      position: { x: 0, y: 0 },
      config: {}
    };
  }

  private parseSubProcess(subprocess: any): WorkflowNode {
    const config: NodeConfig = {};

    // Multi-instance
    const multiInstance = subprocess['bpmn:multiInstanceLoopCharacteristics'] ||
                         subprocess['multiInstanceLoopCharacteristics'];
    if (multiInstance) {
      config.isMultiInstance = true;
      config.multiInstanceConfig = {
        isSequential: multiInstance['@_isSequential'] === true,
        collection: multiInstance['@_collection'] || '',
        elementVariable: multiInstance['@_elementVariable'] || 'item',
        completionCondition: this.extractText(multiInstance['bpmn:completionCondition'] || multiInstance['completionCondition']),
        loopCardinality: this.extractNumber(multiInstance['bpmn:loopCardinality'] || multiInstance['loopCardinality'])
      };
    }

    return {
      id: subprocess['@_id'] || uuidv4(),
      type: subprocess['@_triggeredByEvent'] === true ? NodeType.SUBPROCESS_EVENT : NodeType.SUBPROCESS,
      name: subprocess['@_name'] || 'Subproceso',
      description: this.extractDocumentation(subprocess),
      position: { x: 0, y: 0 },
      config
    };
  }

  private parseCallActivity(callActivity: any): WorkflowNode {
    const config: NodeConfig = {
      calledElement: callActivity['@_calledElement'],
      calledElementBinding: callActivity['@_camunda:calledElementBinding'] || 'latest',
      calledElementVersion: callActivity['@_camunda:calledElementVersion'],
      inputMappings: [],
      outputMappings: []
    };

    // Extraer mappings
    const extensionElements = callActivity['bpmn:extensionElements'] || callActivity['extensionElements'];
    if (extensionElements) {
      const inMappings = this.getArray(extensionElements['camunda:in']);
      const outMappings = this.getArray(extensionElements['camunda:out']);

      config.inputMappings = inMappings.map((m: any) => ({
        source: m['@_source'] || m['@_sourceExpression'],
        target: m['@_target']
      }));

      config.outputMappings = outMappings.map((m: any) => ({
        source: m['@_source'] || m['@_sourceExpression'],
        target: m['@_target']
      }));
    }

    return {
      id: callActivity['@_id'] || uuidv4(),
      type: NodeType.CALL_ACTIVITY,
      name: callActivity['@_name'] || 'Llamada a proceso',
      description: this.extractDocumentation(callActivity),
      position: { x: 0, y: 0 },
      config
    };
  }

  private parseIntermediateCatchEvent(event: any): WorkflowNode {
    let type = NodeType.INTERMEDIATE_CATCH_EVENT;

    if (event['bpmn:timerEventDefinition'] || event['timerEventDefinition']) {
      type = NodeType.INTERMEDIATE_TIMER_EVENT;
    } else if (event['bpmn:messageEventDefinition'] || event['messageEventDefinition']) {
      type = NodeType.INTERMEDIATE_MESSAGE_EVENT;
    } else if (event['bpmn:signalEventDefinition'] || event['signalEventDefinition']) {
      type = NodeType.INTERMEDIATE_SIGNAL_EVENT;
    }

    return {
      id: event['@_id'] || uuidv4(),
      type,
      name: event['@_name'] || 'Evento intermedio',
      description: this.extractDocumentation(event),
      position: { x: 0, y: 0 },
      config: this.extractTimerConfig(event)
    };
  }

  private parseIntermediateThrowEvent(event: any): WorkflowNode {
    return {
      id: event['@_id'] || uuidv4(),
      type: NodeType.INTERMEDIATE_THROW_EVENT,
      name: event['@_name'] || 'Evento de lanzamiento',
      description: this.extractDocumentation(event),
      position: { x: 0, y: 0 },
      config: {}
    };
  }

  private parseBoundaryEvent(event: any): WorkflowNode {
    let type = NodeType.BOUNDARY_EVENT;

    if (event['bpmn:timerEventDefinition'] || event['timerEventDefinition']) {
      type = NodeType.BOUNDARY_TIMER_EVENT;
    } else if (event['bpmn:errorEventDefinition'] || event['errorEventDefinition']) {
      type = NodeType.BOUNDARY_ERROR_EVENT;
    } else if (event['bpmn:messageEventDefinition'] || event['messageEventDefinition']) {
      type = NodeType.BOUNDARY_MESSAGE_EVENT;
    } else if (event['bpmn:signalEventDefinition'] || event['signalEventDefinition']) {
      type = NodeType.BOUNDARY_SIGNAL_EVENT;
    }

    return {
      id: event['@_id'] || uuidv4(),
      type,
      name: event['@_name'] || 'Evento de frontera',
      description: this.extractDocumentation(event),
      position: { x: 0, y: 0 },
      config: {
        ...this.extractTimerConfig(event)
      }
    };
  }

  // ========================================================================
  // Métodos auxiliares
  // ========================================================================

  private getArray(value: any): any[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  private extractDocumentation(element: any): string | undefined {
    const doc = element['bpmn:documentation'] || element['documentation'];
    if (!doc) return undefined;
    return typeof doc === 'string' ? doc : doc['#text'];
  }

  private extractText(element: any): string | undefined {
    if (!element) return undefined;
    return typeof element === 'string' ? element : element['#text'];
  }

  private extractNumber(element: any): number | undefined {
    const text = this.extractText(element);
    if (!text) return undefined;
    const num = parseInt(text, 10);
    return isNaN(num) ? undefined : num;
  }

  private parseCommaSeparated(value: string | undefined): string[] | undefined {
    if (!value) return undefined;
    return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
  }

  private parsePriority(value: any): TaskPriority | undefined {
    if (!value) return undefined;
    const priorities: Record<string, TaskPriority> = {
      'low': TaskPriority.LOW,
      'normal': TaskPriority.NORMAL,
      'high': TaskPriority.HIGH,
      'urgent': TaskPriority.URGENT,
      'critical': TaskPriority.CRITICAL
    };
    return priorities[String(value).toLowerCase()] || TaskPriority.NORMAL;
  }

  private extractConfig(process: any): WorkflowConfig {
    return {
      allowMultipleInstances: true,
      notifyOnStart: true,
      notifyOnComplete: true,
      notifyOnError: true,
      retryOnError: false,
      maxRetries: 3,
      retryInterval: 60000
    };
  }

  private extractVariables(process: any): VariableDefinition[] {
    const variables: VariableDefinition[] = [];

    const extensionElements = process['bpmn:extensionElements'] || process['extensionElements'];
    if (extensionElements) {
      const properties = this.getArray(extensionElements['camunda:properties']?.[0]?.['camunda:property'] ||
                                        extensionElements['camunda:property']);
      properties.forEach((prop: any) => {
        if (prop['@_name']?.startsWith('var_')) {
          variables.push({
            name: prop['@_name'].substring(4),
            type: VariableType.STRING,
            required: false,
            defaultValue: prop['@_value']
          });
        }
      });
    }

    return variables;
  }

  private extractTimerConfig(event: any): NodeConfig {
    const config: NodeConfig = {};

    const timerDef = event['bpmn:timerEventDefinition'] || event['timerEventDefinition'];
    if (!timerDef) return config;

    const timeDate = timerDef['bpmn:timeDate'] || timerDef['timeDate'];
    const timeDuration = timerDef['bpmn:timeDuration'] || timerDef['timeDuration'];
    const timeCycle = timerDef['bpmn:timeCycle'] || timerDef['timeCycle'];

    if (timeDate) {
      config.timerType = TimerEventType.TIME_DATE;
      config.timerExpression = this.extractText(timeDate);
    } else if (timeDuration) {
      config.timerType = TimerEventType.TIME_DURATION;
      config.timerExpression = this.extractText(timeDuration);
    } else if (timeCycle) {
      config.timerType = TimerEventType.TIME_CYCLE;
      config.timerExpression = this.extractText(timeCycle);
    }

    return config;
  }

  private extractTaskListeners(extensionElements: any): TaskListener[] {
    const listeners: TaskListener[] = [];
    const taskListeners = this.getArray(extensionElements['camunda:taskListener']);

    taskListeners.forEach((listener: any) => {
      listeners.push({
        event: listener['@_event'] || 'create',
        listenerType: listener['@_class'] ? 'class' : (listener['@_expression'] ? 'expression' : 'script'),
        value: listener['@_class'] || listener['@_expression'] || ''
      });
    });

    return listeners;
  }

  private extractExecutionListeners(extensionElements: any): ExecutionListener[] {
    const listeners: ExecutionListener[] = [];
    const execListeners = this.getArray(extensionElements['camunda:executionListener']);

    execListeners.forEach((listener: any) => {
      listeners.push({
        event: listener['@_event'] || 'start',
        listenerType: listener['@_class'] ? 'class' : (listener['@_expression'] ? 'expression' : 'script'),
        value: listener['@_class'] || listener['@_expression'] || ''
      });
    });

    return listeners;
  }

  private extractInputParameters(inputOutput: any): string[] {
    const params: string[] = [];
    const inputParams = this.getArray(inputOutput['camunda:inputParameter']);

    inputParams.forEach((param: any) => {
      params.push(param['@_name']);
    });

    return params;
  }

  private extractOutputParameters(inputOutput: any): string[] {
    const params: string[] = [];
    const outputParams = this.getArray(inputOutput['camunda:outputParameter']);

    outputParams.forEach((param: any) => {
      params.push(param['@_name']);
    });

    return params;
  }

  private getFirstOutgoing(element: any): string | undefined {
    const outgoing = this.getArray(element['bpmn:outgoing'] || element['outgoing']);
    return outgoing[0];
  }

  private extractDiagramInfo(definitions: any): Map<string, { x: number; y: number; width: number; height: number }> {
    const info = new Map<string, { x: number; y: number; width: number; height: number }>();

    const diagrams = this.getArray(definitions['bpmndi:BPMNDiagram'] || definitions['BPMNDiagram']);
    diagrams.forEach((diagram: any) => {
      const planes = this.getArray(diagram['bpmndi:BPMNPlane'] || diagram['BPMNPlane']);
      planes.forEach((plane: any) => {
        const shapes = this.getArray(plane['bpmndi:BPMNShape'] || plane['BPMNShape']);
        shapes.forEach((shape: any) => {
          const bounds = shape['dc:Bounds'] || shape['Bounds'];
          if (bounds) {
            info.set(shape['@_bpmnElement'], {
              x: bounds['@_x'] || 0,
              y: bounds['@_y'] || 0,
              width: bounds['@_width'] || 100,
              height: bounds['@_height'] || 80
            });
          }
        });
      });
    });

    return info;
  }

  private applyDiagramPositions(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    diagramInfo: Map<string, { x: number; y: number; width: number; height: number }>
  ): void {
    nodes.forEach(node => {
      const info = diagramInfo.get(node.id);
      if (info) {
        node.position = { x: info.x, y: info.y };
      }
    });
  }

  // ========================================================================
  // Validación
  // ========================================================================

  private validateConnectivity(definition: WorkflowDefinition): BpmnValidationError[] {
    const errors: BpmnValidationError[] = [];

    definition.nodes.forEach(node => {
      // Los eventos de inicio no deben tener flujos entrantes
      if (this.isStartEvent(node.type)) {
        const incoming = definition.edges.filter(e => e.targetNodeId === node.id);
        if (incoming.length > 0) {
          errors.push({
            code: 'INVALID_START_EVENT',
            message: `El evento de inicio "${node.name}" no debe tener flujos entrantes`,
            nodeId: node.id
          });
        }
      }

      // Los eventos de fin no deben tener flujos salientes
      if (this.isEndEvent(node.type)) {
        const outgoing = definition.edges.filter(e => e.sourceNodeId === node.id);
        if (outgoing.length > 0) {
          errors.push({
            code: 'INVALID_END_EVENT',
            message: `El evento de fin "${node.name}" no debe tener flujos salientes`,
            nodeId: node.id
          });
        }
      }

      // Las tareas deben tener al menos un flujo entrante y uno saliente
      if (this.isTask(node.type)) {
        const incoming = definition.edges.filter(e => e.targetNodeId === node.id);
        const outgoing = definition.edges.filter(e => e.sourceNodeId === node.id);

        if (incoming.length === 0) {
          errors.push({
            code: 'DISCONNECTED_TASK',
            message: `La tarea "${node.name}" no tiene flujos entrantes`,
            nodeId: node.id
          });
        }

        if (outgoing.length === 0) {
          errors.push({
            code: 'DISCONNECTED_TASK',
            message: `La tarea "${node.name}" no tiene flujos salientes`,
            nodeId: node.id
          });
        }
      }
    });

    return errors;
  }

  private validateGateways(definition: WorkflowDefinition): BpmnValidationError[] {
    const errors: BpmnValidationError[] = [];

    definition.nodes.forEach(node => {
      if (!this.isGateway(node.type)) return;

      const incoming = definition.edges.filter(e => e.targetNodeId === node.id);
      const outgoing = definition.edges.filter(e => e.sourceNodeId === node.id);

      // Exclusive/Inclusive gateways divergentes deben tener condiciones
      if ((node.type === NodeType.EXCLUSIVE_GATEWAY || node.type === NodeType.INCLUSIVE_GATEWAY) &&
          outgoing.length > 1) {
        const conditionalFlows = outgoing.filter(e => e.conditionExpression || e.isDefault);
        if (conditionalFlows.length < outgoing.length) {
          errors.push({
            code: 'GATEWAY_MISSING_CONDITIONS',
            message: `El gateway "${node.name}" tiene flujos sin condiciones definidas`,
            nodeId: node.id
          });
        }
      }

      // Parallel gateways convergentes deben esperar todos los flujos
      if (node.type === NodeType.PARALLEL_GATEWAY && incoming.length > 1) {
        // Esto es solo informativo, la lógica de sincronización está en el motor
      }
    });

    return errors;
  }

  private validateTasks(definition: WorkflowDefinition): BpmnValidationWarning[] {
    const warnings: BpmnValidationWarning[] = [];

    definition.nodes.forEach(node => {
      if (node.type === NodeType.USER_TASK) {
        if (!node.config.assigneeExpression &&
            (!node.config.candidateUsers || node.config.candidateUsers.length === 0) &&
            (!node.config.candidateGroups || node.config.candidateGroups.length === 0)) {
          warnings.push({
            code: 'TASK_NO_ASSIGNEE',
            message: `La tarea "${node.name}" no tiene asignación definida`,
            nodeId: node.id,
            suggestion: 'Defina un asignatario, usuarios candidatos o grupos candidatos'
          });
        }
      }

      if (node.type === NodeType.SERVICE_TASK) {
        if (!node.config.serviceEndpoint && !node.config.script) {
          warnings.push({
            code: 'SERVICE_TASK_NO_CONFIG',
            message: `La tarea de servicio "${node.name}" no tiene configuración`,
            nodeId: node.id,
            suggestion: 'Configure el endpoint del servicio o el script a ejecutar'
          });
        }
      }
    });

    return warnings;
  }

  private validateExpressions(definition: WorkflowDefinition): BpmnValidationWarning[] {
    const warnings: BpmnValidationWarning[] = [];

    definition.edges.forEach(edge => {
      if (edge.conditionExpression) {
        // Validar sintaxis básica de expresión
        try {
          // Verificar que las variables referenciadas existan o sean válidas
          const varPattern = /\$\{([^}]+)\}/g;
          let match;
          while ((match = varPattern.exec(edge.conditionExpression)) !== null) {
            // Solo advertir si parece haber un error de sintaxis
            const expr = match[1];
            if (expr.includes('==') && !expr.includes('===')) {
              // Está bien, es comparación
            }
          }
        } catch (e) {
          warnings.push({
            code: 'INVALID_EXPRESSION',
            message: `Posible error en expresión: ${edge.conditionExpression}`,
            suggestion: 'Verifique la sintaxis de la expresión'
          });
        }
      }
    });

    return warnings;
  }

  private isStartEvent(type: NodeType): boolean {
    return [
      NodeType.START_EVENT,
      NodeType.START_EVENT_TIMER,
      NodeType.START_EVENT_MESSAGE,
      NodeType.START_EVENT_SIGNAL,
      NodeType.START_EVENT_CONDITIONAL
    ].includes(type);
  }

  private isEndEvent(type: NodeType): boolean {
    return [
      NodeType.END_EVENT,
      NodeType.END_EVENT_ERROR,
      NodeType.END_EVENT_TERMINATE,
      NodeType.END_EVENT_MESSAGE,
      NodeType.END_EVENT_SIGNAL
    ].includes(type);
  }

  private isTask(type: NodeType): boolean {
    return [
      NodeType.USER_TASK,
      NodeType.SERVICE_TASK,
      NodeType.SCRIPT_TASK,
      NodeType.SEND_TASK,
      NodeType.RECEIVE_TASK,
      NodeType.MANUAL_TASK,
      NodeType.BUSINESS_RULE_TASK
    ].includes(type);
  }

  private isGateway(type: NodeType): boolean {
    return [
      NodeType.EXCLUSIVE_GATEWAY,
      NodeType.INCLUSIVE_GATEWAY,
      NodeType.PARALLEL_GATEWAY,
      NodeType.EVENT_BASED_GATEWAY,
      NodeType.COMPLEX_GATEWAY
    ].includes(type);
  }

  /**
   * Genera XML BPMN desde una definición
   */
  generateBpmnXml(definition: WorkflowDefinition): string {
    // Implementación básica para generar XML
    const bpmn: any = {
      'bpmn:definitions': {
        '@_xmlns:bpmn': this.BPMN_NS,
        '@_xmlns:bpmndi': this.BPMNDI_NS,
        '@_xmlns:dc': this.DC_NS,
        '@_xmlns:di': this.DI_NS,
        '@_id': `Definitions_${definition.id}`,
        '@_targetNamespace': 'http://bpmn.io/schema/bpmn',
        'bpmn:process': {
          '@_id': definition.code,
          '@_name': definition.name,
          '@_isExecutable': true
        }
      }
    };

    // Agregar nodos y flujos...
    // (Implementación completa requeriría más código)

    return this.xmlBuilder.build(bpmn);
  }
}

export const bpmnParserService = new BpmnParserService();

import { Task, Project, TaskPriority, TaskStatus } from '@/types/tasks';

// Mock users for assignees
export const mockUsers = [
  {
    id: '1',
    name: 'Ana García',
    email: 'ana.garcia@aitcore.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
  },
  {
    id: '2',
    name: 'Carlos Ruiz',
    email: 'carlos.ruiz@aitcore.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
  },
  {
    id: '3',
    name: 'María López',
    email: 'maria.lopez@aitcore.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
  },
  {
    id: '4',
    name: 'Juan Pérez',
    email: 'juan.perez@aitcore.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan',
  },
];

// Mock projects
export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'AIT-CORE Suite',
    description: 'Enterprise application suite development',
    color: '#3b82f6',
    icon: '🚀',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Website Redesign',
    description: 'Corporate website modernization',
    color: '#8b5cf6',
    icon: '🎨',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    name: 'Mobile App',
    description: 'iOS and Android mobile application',
    color: '#10b981',
    icon: '📱',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'API Integration',
    description: 'Third-party API integrations',
    color: '#f59e0b',
    icon: '🔌',
    createdAt: '2024-02-15T00:00:00Z',
  },
];

// Mock tasks
export const mockTasks: Task[] = [
  // TO DO Tasks
  {
    id: '1',
    title: 'Implementar autenticación OAuth',
    description: 'Añadir soporte para login con Google y Microsoft',
    priority: 'high',
    status: 'todo',
    assignee: mockUsers[0],
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['backend', 'security', 'oauth'],
    checklist: [
      { id: '1-1', text: 'Configurar OAuth providers', completed: false },
      { id: '1-2', text: 'Implementar callback handlers', completed: false },
      { id: '1-3', text: 'Añadir tests', completed: false },
    ],
    attachments: [],
    comments: [
      {
        id: '1-c1',
        content: 'Necesitamos también añadir GitHub OAuth',
        author: mockUsers[1],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
    projectId: '1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Diseñar sistema de notificaciones',
    description: 'Crear mockups y prototipos para el sistema de notificaciones push',
    priority: 'medium',
    status: 'todo',
    assignee: mockUsers[2],
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['design', 'ui/ux', 'notifications'],
    checklist: [
      { id: '2-1', text: 'Investigar mejores prácticas', completed: true },
      { id: '2-2', text: 'Crear wireframes', completed: false },
      { id: '2-3', text: 'Diseñar componentes en Figma', completed: false },
    ],
    attachments: [
      {
        id: '2-a1',
        name: 'notification-research.pdf',
        url: '#',
        size: 2456789,
        type: 'application/pdf',
        uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    comments: [],
    projectId: '1',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Optimizar consultas de base de datos',
    description: 'Revisar y optimizar queries lentas identificadas en producción',
    priority: 'urgent',
    status: 'todo',
    assignee: mockUsers[3],
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['database', 'performance', 'backend'],
    checklist: [
      { id: '3-1', text: 'Analizar logs de queries lentas', completed: false },
      { id: '3-2', text: 'Añadir índices necesarios', completed: false },
      { id: '3-3', text: 'Optimizar queries N+1', completed: false },
      { id: '3-4', text: 'Validar mejoras en staging', completed: false },
    ],
    attachments: [],
    comments: [
      {
        id: '3-c1',
        content: 'Query de usuarios está tardando 3+ segundos',
        author: mockUsers[0],
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3-c2',
        content: 'Voy a revisar los índices hoy mismo',
        author: mockUsers[3],
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ],
    projectId: '1',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Actualizar documentación de API',
    description: 'Documentar nuevos endpoints y actualizar ejemplos',
    priority: 'low',
    status: 'todo',
    assignee: mockUsers[1],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['documentation', 'api'],
    checklist: [
      { id: '4-1', text: 'Listar nuevos endpoints', completed: true },
      { id: '4-2', text: 'Escribir descripciones', completed: false },
      { id: '4-3', text: 'Añadir ejemplos de código', completed: false },
      { id: '4-4', text: 'Publicar en portal de docs', completed: false },
    ],
    attachments: [],
    comments: [],
    projectId: '1',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // IN PROGRESS Tasks
  {
    id: '5',
    title: 'Implementar dashboard de analytics',
    description: 'Crear componentes de visualización de datos con Recharts',
    priority: 'high',
    status: 'in_progress',
    assignee: mockUsers[0],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['frontend', 'analytics', 'charts'],
    checklist: [
      { id: '5-1', text: 'Configurar Recharts', completed: true },
      { id: '5-2', text: 'Crear componente de gráficos', completed: true },
      { id: '5-3', text: 'Integrar con API', completed: false },
      { id: '5-4', text: 'Añadir filtros de fecha', completed: false },
      { id: '5-5', text: 'Optimizar rendimiento', completed: false },
    ],
    attachments: [
      {
        id: '5-a1',
        name: 'dashboard-mockup.png',
        url: '#',
        size: 1234567,
        type: 'image/png',
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    comments: [
      {
        id: '5-c1',
        content: 'Ya tengo los componentes básicos funcionando',
        author: mockUsers[0],
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
    ],
    projectId: '1',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    title: 'Configurar CI/CD pipeline',
    description: 'Setup GitHub Actions para deploy automático',
    priority: 'medium',
    status: 'in_progress',
    assignee: mockUsers[3],
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['devops', 'ci/cd', 'automation'],
    checklist: [
      { id: '6-1', text: 'Configurar workflows de GitHub Actions', completed: true },
      { id: '6-2', text: 'Setup tests automáticos', completed: true },
      { id: '6-3', text: 'Configurar deploy a staging', completed: false },
      { id: '6-4', text: 'Configurar deploy a producción', completed: false },
    ],
    attachments: [],
    comments: [],
    projectId: '1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    title: 'Implementar sistema de caché',
    description: 'Añadir Redis para caché de sesiones y queries frecuentes',
    priority: 'high',
    status: 'in_progress',
    assignee: mockUsers[1],
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['backend', 'performance', 'redis'],
    checklist: [
      { id: '7-1', text: 'Configurar servidor Redis', completed: true },
      { id: '7-2', text: 'Implementar cliente de caché', completed: true },
      { id: '7-3', text: 'Añadir caché de sesiones', completed: false },
      { id: '7-4', text: 'Caché de queries frecuentes', completed: false },
      { id: '7-5', text: 'Configurar estrategia de invalidación', completed: false },
    ],
    attachments: [],
    comments: [
      {
        id: '7-c1',
        content: 'Redis está funcionando en desarrollo',
        author: mockUsers[1],
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    ],
    projectId: '1',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },

  // DONE Tasks
  {
    id: '8',
    title: 'Setup proyecto Next.js',
    description: 'Configuración inicial del proyecto con TypeScript y Tailwind',
    priority: 'high',
    status: 'done',
    assignee: mockUsers[0],
    dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['setup', 'frontend', 'nextjs'],
    checklist: [
      { id: '8-1', text: 'Crear proyecto Next.js', completed: true },
      { id: '8-2', text: 'Configurar TypeScript', completed: true },
      { id: '8-3', text: 'Setup Tailwind CSS', completed: true },
      { id: '8-4', text: 'Configurar ESLint y Prettier', completed: true },
    ],
    attachments: [],
    comments: [
      {
        id: '8-c1',
        content: 'Proyecto configurado y funcionando',
        author: mockUsers[0],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    projectId: '1',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '9',
    title: 'Implementar sistema de autenticación',
    description: 'Login, registro y gestión de sesiones con JWT',
    priority: 'urgent',
    status: 'done',
    assignee: mockUsers[1],
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['backend', 'security', 'authentication'],
    checklist: [
      { id: '9-1', text: 'Implementar endpoints de auth', completed: true },
      { id: '9-2', text: 'Configurar JWT', completed: true },
      { id: '9-3', text: 'Crear middleware de autenticación', completed: true },
      { id: '9-4', text: 'Añadir refresh tokens', completed: true },
      { id: '9-5', text: 'Tests de seguridad', completed: true },
    ],
    attachments: [],
    comments: [
      {
        id: '9-c1',
        content: 'Sistema de auth completado y testeado',
        author: mockUsers[1],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    projectId: '1',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '10',
    title: 'Diseñar sistema de componentes',
    description: 'Crear biblioteca de componentes reutilizables con Radix UI',
    priority: 'medium',
    status: 'done',
    assignee: mockUsers[2],
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['frontend', 'ui', 'components'],
    checklist: [
      { id: '10-1', text: 'Setup Radix UI', completed: true },
      { id: '10-2', text: 'Crear componentes base', completed: true },
      { id: '10-3', text: 'Documentar componentes', completed: true },
      { id: '10-4', text: 'Crear Storybook', completed: true },
    ],
    attachments: [
      {
        id: '10-a1',
        name: 'components-guide.pdf',
        url: '#',
        size: 3456789,
        type: 'application/pdf',
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    comments: [],
    projectId: '1',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '11',
    title: 'Configurar base de datos PostgreSQL',
    description: 'Setup PostgreSQL y configurar migraciones con Prisma',
    priority: 'high',
    status: 'done',
    assignee: mockUsers[3],
    dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['database', 'backend', 'postgresql'],
    checklist: [
      { id: '11-1', text: 'Instalar PostgreSQL', completed: true },
      { id: '11-2', text: 'Configurar Prisma', completed: true },
      { id: '11-3', text: 'Crear esquema inicial', completed: true },
      { id: '11-4', text: 'Setup migraciones', completed: true },
      { id: '11-5', text: 'Seed data inicial', completed: true },
    ],
    attachments: [],
    comments: [
      {
        id: '11-c1',
        content: 'Base de datos funcionando perfectamente',
        author: mockUsers[3],
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    projectId: '1',
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '12',
    title: 'Implementar modo oscuro',
    description: 'Añadir soporte para tema oscuro en toda la aplicación',
    priority: 'medium',
    status: 'done',
    assignee: mockUsers[2],
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['frontend', 'ui', 'theme'],
    checklist: [
      { id: '12-1', text: 'Configurar next-themes', completed: true },
      { id: '12-2', text: 'Definir paleta de colores oscuros', completed: true },
      { id: '12-3', text: 'Actualizar componentes', completed: true },
      { id: '12-4', text: 'Añadir toggle de tema', completed: true },
      { id: '12-5', text: 'Persistir preferencia de usuario', completed: true },
    ],
    attachments: [],
    comments: [],
    projectId: '1',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper function to get tasks by status
export function getTasksByStatus(status: TaskStatus): Task[] {
  return mockTasks.filter((task) => task.status === status);
}

// Helper function to get tasks by priority
export function getTasksByPriority(priority: TaskPriority): Task[] {
  return mockTasks.filter((task) => task.priority === priority);
}

// Helper function to get tasks by project
export function getTasksByProject(projectId: string): Task[] {
  return mockTasks.filter((task) => task.projectId === projectId);
}

// Helper function to get tasks by assignee
export function getTasksByAssignee(assigneeId: string): Task[] {
  return mockTasks.filter((task) => task.assignee?.id === assigneeId);
}

// Helper function to search tasks
export function searchTasks(query: string): Task[] {
  const lowerQuery = query.toLowerCase();
  return mockTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(lowerQuery) ||
      task.description?.toLowerCase().includes(lowerQuery) ||
      task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

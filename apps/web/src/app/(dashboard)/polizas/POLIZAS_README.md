# Sistema de Pólizas de Seguros

## Descripción General

El módulo de pólizas es un sistema completo para gestionar y visualizar pólizas de seguros. Permite a los usuarios:

- Ver todas sus pólizas de seguros
- Filtrar por tipo, estado y búsqueda
- Visualizar detalles completos de cada póliza
- Acceder a documentos asociados
- Recibir alertas de vencimiento
- Gestionar información de contacto del asegurador

## Estructura de Carpetas

```
src/
├── app/
│   └── (dashboard)/
│       └── polizas/
│           ├── page.tsx              # Página principal de listado
│           ├── [id]/
│           │   └── page.tsx          # Página de detalles de póliza
│           └── POLIZAS_README.md    # Este archivo
├── types/
│   └── policies.ts                   # Interfaces y tipos TypeScript
├── hooks/
│   └── usePolicies.ts               # Hooks personalizados
├── lib/
│   └── policies.ts                   # Funciones utilitarias
```

## Componentes

### 1. Página Principal (`/polizas/page.tsx`)

**Características:**
- Listado en grid de todas las pólizas
- Tarjetas informativas con:
  - Número de póliza
  - Tipo (Auto, Hogar, Vida, Salud)
  - Compañía
  - Prima anual
  - Estado (color-coded)
  - Fechas de vigencia
  - Cantidad asegurada
  - Documentos asociados

**Filtros:**
- Búsqueda por número, compañía o descripción
- Filtro por tipo de póliza (4 tipos)
- Filtro por estado (4 estados)
- Limpieza de filtros

**Estadísticas:**
- Total de pólizas
- Pólizas activas
- Pólizas por vencer (< 30 días)
- Prima total anual

**Alertas:**
- Advertencia para pólizas vencidas o próximas a vencer

### 2. Página de Detalles (`/polizas/[id]/page.tsx`)

**Características:**
- Información completa de la póliza
- Secciones organizadas:
  - **Información de la Póliza**: Prima, cantidad asegurada, deducible, tipo
  - **Vigencia**: Fechas de inicio y vencimiento
  - **Descripción**: Detalles del contrato
  - **Cobertura**: Detalles de coberturas
  - **Personas**: Asegurado y beneficiario
  - **Documentos**: Descarga de archivos
  - **Contacto Asegurador**: Teléfono, email, dirección
  - **Estado Actual**: Resumen del estado

**Acciones:**
- Renovar póliza
- Realizar reclamación
- Modificar datos

## Tipos TypeScript (`types/policies.ts`)

### Interfaces Principales

```typescript
interface Policy {
  id: string;
  policyNumber: string;
  type: 'AUTO' | 'HOGAR' | 'VIDA' | 'SALUD';
  company: string;
  premium: number;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED';
  expirationDate: string;
  startDate: string;
  // ... más campos opcionales
}

interface PolicyDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt?: string;
}

interface PolicyStats {
  total: number;
  active: number;
  expired: number;
  pending: number;
  cancelled: number;
  expiringSoon: number;
  totalPremium: number;
  averagePremium: number;
}
```

## Hooks Personalizados (`hooks/usePolicies.ts`)

### `usePolicies(options)`

Hook principal para gestionar el estado de pólizas.

**Parámetros:**
```typescript
interface UsePoliciesOptions {
  includeDocuments?: boolean;  // Incluir documentos (default: true)
  autoFetch?: boolean;         // Obtener datos al montar (default: true)
}
```

**Retorna:**
```typescript
{
  policies: Policy[];          // Array de pólizas
  loading: boolean;            // Estado de carga
  error: string | null;        // Mensaje de error
  stats: PolicyStats | null;   // Estadísticas calculadas
  fetchPolicies: () => void;   // Función para obtener pólizas
  refetch: () => void;         // Actualizar pólizas
}
```

**Ejemplo de uso:**
```typescript
const { policies, loading, error, stats, refetch } = usePolicies({
  includeDocuments: true,
  autoFetch: true
});
```

### `useFilteredPolicies(policies, filters)`

Filtra pólizas según criterios.

```typescript
const filtered = useFilteredPolicies(policies, {
  searchTerm: 'Auto',
  types: ['AUTO'],
  statuses: ['ACTIVE']
});
```

### `useDaysUntilExpiration(expirationDate)`

Calcula días hasta vencimiento.

### `useIsExpiringSoon(expirationDate, threshold)`

Verifica si está próxima a vencer.

## Funciones Utilitarias (`lib/policies.ts`)

### Formatos

```typescript
formatDate(date: string | Date): string
// Formato: "27 de enero de 2026"

formatCurrency(amount: number): string
// Formato: "1.234,56 €"
```

### Cálculos

```typescript
calculateDaysUntilExpiration(expirationDate: string | Date): number
// Retorna número de días

isExpiringSoon(expirationDate: string | Date, threshold?: number): boolean
// Verificar si vence en próximos 30 días (por defecto)

isExpired(expirationDate: string | Date): boolean
// Verificar si ya venció
```

### Configuración

```typescript
getPolicyTypeConfig(type: PolicyType): PolicyTypeConfig
// Obtiene icono, etiqueta y color para cada tipo

getStatusConfig(status: PolicyStatus): StatusConfig
// Obtiene estilos para cada estado
```

### Estadísticas y Exportación

```typescript
calculatePolicyStats(policies: Policy[]): PolicyStats
// Calcula estadísticas de pólizas

exportPoliciesAsCSV(policies: Policy[]): string
// Exporta a formato CSV

downloadCSV(policies: Policy[], filename?: string): void
// Descarga archivo CSV
```

### Validación

```typescript
validatePolicy(policy: Partial<Policy>): {
  valid: boolean;
  errors: string[];
}
// Valida datos de póliza
```

## API Esperada

### Obtener Pólizas

```
GET /api/policies?includeDocuments=true
```

**Respuesta:**
```json
{
  "policies": [
    {
      "id": "pol_123",
      "policyNumber": "POL-2024-001",
      "type": "AUTO",
      "company": "Aseguradora XYZ",
      "premium": 450,
      "status": "ACTIVE",
      "expirationDate": "2026-12-31",
      "startDate": "2024-01-01",
      "description": "Cobertura completa de vehículo",
      "insuranceAmount": 50000,
      "deductible": 500,
      "documents": [
        {
          "id": "doc_1",
          "name": "Póliza PDF",
          "url": "/documents/poliza.pdf",
          "type": "application/pdf"
        }
      ]
    }
  ]
}
```

### Obtener Póliza Individual

```
GET /api/policies/:id?includeDocuments=true
```

## Estilos y Diseño

### Paleta de Colores por Tipo

- **AUTO**: Azul (`text-blue-600`)
- **HOGAR**: Ámbar (`text-amber-600`)
- **VIDA**: Rojo (`text-red-600`)
- **SALUD**: Verde (`text-green-600`)

### Paleta de Colores por Estado

- **ACTIVE**: Verde (`bg-green-50`, `text-green-800`)
- **EXPIRED**: Rojo (`bg-red-50`, `text-red-800`)
- **PENDING**: Amarillo (`bg-yellow-50`, `text-yellow-800`)
- **CANCELLED**: Gris (`bg-gray-50`, `text-gray-800`)

### Iconografía

Se utiliza la librería **Lucide React** para iconos:
- `Shield`: Seguros generales
- `Car`: Seguros de auto
- `Home`: Seguros de hogar
- `Heart`: Seguros de vida
- `AlertTriangle`: Advertencias
- `Calendar`: Fechas
- `DollarSign`: Dinero
- `FileText`: Documentos
- `Phone`, `Mail`, `MapPin`: Contacto

## Características de Accesibilidad

- Estructura semántica HTML
- Labels asociados a inputs
- Colores contrastados
- Iconos con texto descriptivo
- Navegación con teclado
- ARIA labels donde es necesario

## Rendimiento

### Optimizaciones

1. **Lazy Loading**: Las pólizas se cargan bajo demanda
2. **Memoización**: Uso de `useCallback` para funciones
3. **Caching**: Estadísticas calculadas una sola vez
4. **Suspense**: Carga progresiva de contenido
5. **Image Optimization**: Iconos SVG nativos

### Limitaciones Recomendadas

- Máximo 100 pólizas por página
- Paginación para más de 50 pólizas
- Debouncing en búsqueda (300-500ms)

## Responsive Design

### Breakpoints

- **Mobile**: < 640px - Stack vertical completo
- **Tablet**: 640px - 1024px - 2 columnas
- **Desktop**: > 1024px - 2-4 columnas según sección

### Mobile First

Todos los componentes se diseñaron con enfoque mobile-first y se expanden en pantallas más grandes.

## Dark Mode

Totalmente soportado con Tailwind CSS:
- `dark:` prefijo para estilos oscuros
- Transiciones suaves entre temas
- Preservación de contraste en ambos modos

## Integraciones Futuras

1. **Renovación en línea**: Flujo completo de renovación
2. **Reclamaciones**: Sistema de gestión de reclamaciones
3. **Chat en vivo**: Soporte con asegurador
4. **Notificaciones**: Alertas push para vencimientos
5. **Comparativa**: Comparar con otras pólizas
6. **Historial**: Versiones anteriores de pólizas
7. **Pagos**: Integración con gateway de pagos
8. **Firmas digitales**: Documentos firmados

## Testing

### Tests Unitarios Recomendados

```typescript
// Probar funciones utilitarias
describe('policies.ts', () => {
  test('formatDate formatea correctamente', () => {});
  test('calculateDaysUntilExpiration calcula bien', () => {});
  test('isExpiringSoon detecta correctamente', () => {});
});
```

### Tests de Integración Recomendados

```typescript
// Probar hooks
describe('usePolicies', () => {
  test('carga pólizas al montar', async () => {});
  test('maneja errores correctamente', async () => {});
  test('calcula estadísticas', () => {});
});
```

## Troubleshooting

### Problema: No se cargan las pólizas

**Solución:**
1. Verificar conexión a `/api/policies`
2. Revisar CORS si está en otro dominio
3. Verificar credenciales de autenticación
4. Revisar console.log de errores

### Problema: Filtros no funcionan

**Solución:**
1. Verificar que `selectedTypes` y `selectedStatus` estén sincronizados
2. Asegurar que los valores coincidan con los tipos TypeScript
3. Revisar que los datos vengan del servidor correctamente

### Problema: Fechas incorrectas

**Solución:**
1. Verificar timezone del servidor
2. Usar ISO 8601 para fechas en API
3. Convertir a `Date` antes de comparar

## Mantenimiento

### Actualizar Tipos

Si la API cambia:
1. Actualizar `types/policies.ts`
2. Actualizar tipos en respuesta API
3. Actualizar validaciones en `lib/policies.ts`

### Agregar Nuevo Tipo de Póliza

1. Agregar a `PolicyType` en `types/policies.ts`
2. Agregar configuración en `getPolicyTypeConfig` en `lib/policies.ts`
3. Agregar POLICY_TYPES en componentes
4. Actualizar filtros

### Agregar Nuevo Estado

1. Agregar a `PolicyStatus` en `types/policies.ts`
2. Agregar configuración en `getStatusConfig` en `lib/policies.ts`
3. Agregar STATUS_CONFIG en componentes
4. Actualizar lógica de cálculos

## Contacto y Soporte

Para preguntas o reportar bugs, contactar al equipo de desarrollo.

# Módulo de Seguros de Vida - AIT Core Soriano

## Descripción
Módulo especializado para la gestión de seguros de vida en el mercado español. Incluye tarificación, asegurabilidad, coberturas y gestión completa del ciclo de vida de pólizas.

## Características

### Tipos de Seguros de Vida
- **Vida Entera**: Cobertura vitalicia
- **Vida Temporal**: Cobertura por periodo determinado
- **Vida Riesgo**: Solo cobertura de fallecimiento
- **Vida Ahorro**: Combinación de protección y ahorro
- **Mixto**: Cobertura completa con componente de inversión

### Coberturas Disponibles
- Fallecimiento por cualquier causa
- Invalidez Permanente Absoluta (IPA)
- Invalidez Permanente Total (IPT)
- Dependencia
- Enfermedades graves
- Accidentes
- Asistencia funeraria

### Funcionalidades Principales

#### 1. Tarificación Automática
```typescript
const prima = vidaService.calcularPrima({
  edad: 35,
  sexo: 'M',
  capital: 100000,
  tipo: TipoSeguroVida.VIDA_TEMPORAL,
  duracion: 20,
  fumador: false,
  profesion_riesgo: false
});
```

#### 2. Verificación de Asegurabilidad
```typescript
const asegurabilidad = await vidaService.verificarRequisitosAsegurabilidad({
  edad: 45,
  capital: 200000,
  deportes_riesgo: true
});
```

#### 3. Generación de Presupuestos
```typescript
const presupuesto = await vidaService.generarPresupuesto({
  edad: 40,
  sexo: 'F',
  capital: 150000,
  tipo: TipoSeguroVida.VIDA_TEMPORAL,
  duracion: 25,
  fumador: false,
  profesion_riesgo: false
});
```

#### 4. Cálculo de Valor de Rescate
```typescript
const valorRescate = await vidaService.calcularValorRescate(polizaId, new Date());
```

## API Endpoints

### Gestión de Pólizas
- `POST /api/seguros/vida` - Crear póliza
- `GET /api/seguros/vida` - Listar pólizas
- `GET /api/seguros/vida/:id` - Obtener póliza
- `GET /api/seguros/vida/asegurado/:aseguradoId` - Pólizas por asegurado
- `PUT /api/seguros/vida/:id` - Actualizar póliza
- `DELETE /api/seguros/vida/:id` - Eliminar póliza

### Cálculos y Presupuestos
- `POST /api/seguros/vida/calcular-prima` - Calcular prima
- `POST /api/seguros/vida/presupuesto` - Generar presupuesto completo
- `POST /api/seguros/vida/verificar-asegurabilidad` - Verificar requisitos
- `GET /api/seguros/vida/:id/valor-rescate` - Calcular valor rescate

## Normativa Aplicable

### DGSFP (Dirección General de Seguros)
- Cumplimiento de requisitos de solvencia
- Información precontractual obligatoria
- Registro de operaciones

### LOSSP (Ley de Ordenación, Supervisión y Solvencia)
- Protección al consumidor
- Gestión de reclamaciones
- Transparencia en tarifas

### RGPD
- Protección de datos de salud
- Consentimiento informado
- Derecho al olvido

## Parámetros de Tarificación

### Factores de Riesgo
1. **Edad**: 18-75 años
2. **Sexo**: Diferencial actuarial
3. **Profesión**: Clasificación de riesgos
4. **Estado de salud**: Cuestionario médico
5. **Hábitos**: Fumador, alcohol, drogas
6. **Deportes de riesgo**: Escalada, buceo, etc.

### Límites de Capital
- Mínimo: 6.000€
- Máximo estándar: 1.000.000€
- Máximo con reconocimiento médico: Sin límite

### Edades de Contratación
- Mínima: 18 años
- Máxima: 75 años (según compañía)

## Tablas Actuariales
Utiliza las tablas de mortalidad:
- **PERM/F 2000**: Población española
- **Ajustes**: Por mejora de supervivencia
- **Factores corrección**: Según experiencia propia

## Integración

### Con otros módulos
- **Clientes**: Datos del tomador y asegurado
- **Beneficiarios**: Gestión de beneficiarios
- **Pagos**: Cobro de primas
- **Siniestros**: Gestión de reclamaciones
- **Documentos**: Generación de pólizas y anexos

## Instalación

```bash
npm install
```

## Uso

```typescript
import { VidaService } from '@ait-core/seguro-vida';

// Generar presupuesto
const presupuesto = await vidaService.generarPresupuesto({
  edad: 35,
  sexo: 'M',
  capital: 200000,
  tipo: TipoSeguroVida.VIDA_TEMPORAL,
  duracion: 25,
  fumador: false,
  profesion_riesgo: false
});
```

## Soporte
Para soporte contactar: soporte@sorianomediadores.com

## Licencia
Propietario - AIT Soriano Mediadores

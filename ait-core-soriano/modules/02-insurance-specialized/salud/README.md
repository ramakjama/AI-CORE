# Módulo de Seguros de Salud - AIT Core Soriano

## Descripción
Módulo especializado para la gestión de seguros de salud privados en España. Compatible con principales aseguradoras (Sanitas, Adeslas, Asisa, DKV, etc.).

## Características

### Modalidades
- **Sin Copagos**: Prima más alta, sin pago por uso
- **Con Copagos**: Prima reducida, copago por servicio
- **Reembolso**: Libre elección médico, reembolso gastos
- **Mixto**: Combinación cuadro médico + reembolso

### Tipos de Cobertura
- **Básica**: Medicina general, especialistas básicos
- **Completa**: Incluye hospitalización y cirugía
- **Premium**: Cobertura total + servicios adicionales
- **Dental**: Específica para odontología

### Prestaciones Principales
- Medicina general
- Especialistas
- Hospitalización
- Urgencias 24h
- Pruebas diagnósticas
- Cirugía
- Maternidad
- Pediatría
- Fisioterapia
- Psicología

## API Endpoints

- `POST /api/seguros/salud` - Crear póliza
- `GET /api/seguros/salud` - Listar pólizas
- `GET /api/seguros/salud/:id` - Obtener póliza
- `PUT /api/seguros/salud/:id` - Actualizar póliza
- `DELETE /api/seguros/salud/:id` - Eliminar póliza
- `POST /api/seguros/salud/calcular-prima` - Calcular prima
- `POST /api/seguros/salud/presupuesto` - Generar presupuesto
- `POST /api/seguros/salud/:id/verificar-autorizacion` - Verificar autorización

## Periodo de Carencia
- Medicina general: Sin carencia
- Especialistas: 6 meses
- Hospitalización: 6 meses
- Maternidad: 8-10 meses
- Prótesis: 12 meses

## Integración con Cuadro Médico
Permite consultar disponibilidad de centros y profesionales según:
- Ámbito geográfico (Nacional/Provincial/Local)
- Especialidad médica
- Disponibilidad de citas

## Normativa
- Ley General de Sanidad
- DGSFP - Supervisión seguros salud
- RGPD - Protección datos de salud

## Licencia
Propietario - AIT Soriano Mediadores

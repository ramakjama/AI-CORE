# Módulo de Seguros de Autos - AIT Core Soriano

## Descripción
Módulo especializado para seguros de vehículos en España con sistema bonus/malus.

## Tipos de Cobertura
- **Terceros**: RC obligatoria
- **Terceros Ampliado**: + Lunas, robo, incendio
- **Todo Riesgo con Franquicia**: Cobertura completa con franquicia (300€)
- **Todo Riesgo**: Cobertura máxima sin franquicia

## Coberturas
- RC Ilimitada (obligatoria)
- Lunas
- Robo e incendio
- Daños propios
- Asistencia en viaje
- Vehículo de sustitución
- Conductor novel
- Defensa jurídica

## Sistema Bonus/Malus
- Cada año sin siniestro: -5% prima (hasta 60%)
- Siniestro con culpa: +25% prima
- Máximo descuento: 15 años (75% descuento)

## Factores de Tarificación
- Edad conductor (menores 25 años: +80%)
- Antigüedad carnet (menos 2 años: +50%)
- Valor vehículo
- Tipo cobertura
- Código postal
- Km anuales
- Parking cerrado (-5%)

## API Endpoints
- `POST /api/seguros/autos` - Crear póliza
- `GET /api/seguros/autos/matricula/:matricula` - Buscar por matrícula
- `POST /api/seguros/autos/presupuesto` - Generar presupuesto
- `POST /api/seguros/autos/calcular-prima` - Calcular prima

## Integración DGT
Consulta datos vehículo por matrícula (pendiente implementación API DGT).

## Licencia
Propietario - AIT Soriano Mediadores

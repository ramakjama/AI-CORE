# Módulo de Seguros de Hogar - AIT Core Soriano

## Descripción
Módulo para gestión de seguros de hogar en España.

## Coberturas
- **Continente**: Daños en la estructura
- **Contenido**: Bienes muebles
- **RC Familiar**: Hasta 300.000€
- **Robo**: Contenido asegurado
- **Agua/Incendio**: Cobertura completa
- **Cristales**: Hasta 3.000€
- **Asistencia 24h**: Fontanería, electricidad, cerrajería

## Tipos de Vivienda
- Piso
- Chalet
- Adosado
- Dúplex
- Ático

## Factores de Tarificación
- Valor continente y contenido
- Superficie
- Ubicación (código postal)
- Medidas de seguridad
- Tipo de vivienda
- Año construcción
- Vivienda habitual

## Medidas de Seguridad (Descuentos)
- Alarma conectada: -10%
- Puerta blindada: -5%
- Rejas: -3%
- Cerradura seguridad: -2%

## API Endpoints
- `POST /api/seguros/hogar` - Crear póliza
- `GET /api/seguros/hogar` - Listar pólizas
- `POST /api/seguros/hogar/presupuesto` - Generar presupuesto
- `POST /api/seguros/hogar/calcular-prima` - Calcular prima

## Licencia
Propietario - AIT Soriano Mediadores

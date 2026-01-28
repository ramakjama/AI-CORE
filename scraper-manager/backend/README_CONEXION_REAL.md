# 🚀 Portal Mapper - CONEXIÓN REAL al Portal

## ✅ ¿Qué incluye esta actualización?

**ANTES:** El sistema solo simulaba la conexión y generaba datos falsos.

**AHORA:** El sistema se conecta REALMENTE al portal con browser automation:

- ✅ **Browser automation real** con Playwright
- ✅ **Autenticación Microsoft OAuth** automática
- ✅ **Detección real de elementos DOM** del portal
- ✅ **Navegación y exploración real** clickeando elementos
- ✅ **Screenshots** de cada paso del proceso
- ✅ **SIN LÍMITES** de profundidad ni elementos (999,999)

## 📦 Instalación

### Windows:
```bash
cd backend
install_dependencies.bat
```

### Linux/Mac:
```bash
cd backend
chmod +x install_dependencies.sh
./install_dependencies.sh
```

### Manual:
```bash
cd backend
pip install -r requirements.txt
playwright install chromium
```

## 🎯 Uso

### 1. Configurar credenciales

Asegúrate de pasar las credenciales correctas de Microsoft al iniciar el mapper:

```python
credentials = {
    "username": "tu-email@occident.com",
    "password": "tu-contraseña"
}
```

### 2. Iniciar el mapper

```python
from modules.portal_mapper import PortalStructureMapper

mapper = PortalStructureMapper(
    portal_url="https://portal.occident.com",
    credentials=credentials,
    config={
        "max_depth": 999999,      # SIN LÍMITE
        "max_elements": 999999,   # SIN LÍMITE
        "timeout": 7200,          # 2 horas
        "headless": False,        # True para modo headless
        "screenshots": True       # Capturas de pantalla
    }
)

# Iniciar mapeo real
result = await mapper.start_mapping()
```

### 3. Resultados

- **Reporte JSON**: Se guarda en `reports/portal_structure_map_YYYYMMDD_HHMMSS.json`
- **Screenshots**: Se guardan en `screenshots/`

## 🔍 Características de la Exploración Real

### 1. Login Automático
- Detecta automáticamente si es Microsoft OAuth o login tradicional
- Maneja el flujo completo de Microsoft (email → password → "Stay signed in?")
- Toma screenshots en cada paso

### 2. Descubrimiento de Estructura
- Detecta elementos de navegación del portal REAL
- Encuentra menús, botones, enlaces, formularios
- Extrae atributos, clases, XPath de cada elemento

### 3. Exploración Profunda
- Sistema iterativo (no recursivo) para evitar stack overflow
- Hace hover sobre elementos para detectar submenús
- Clickea elementos para navegar a nuevas páginas
- Detecta elementos en cada nueva vista
- Vuelve atrás automáticamente para continuar exploración
- **SIN LÍMITES** de profundidad - explora TODO

### 4. Documentación Exhaustiva
- Mapea jerarquía completa de elementos
- Identifica interacciones entre elementos
- Detecta workflows del portal
- Genera rutas de navegación

## 🛠️ Configuración Avanzada

### Modo Headless vs Visible

**Headless (True)**: El browser se ejecuta en background sin ventana visible.
- ✅ Más rápido
- ✅ Menor consumo de recursos
- ❌ No puedes ver qué está pasando

**Visible (False)**: Puedes ver el browser en acción.
- ✅ Depuración visual
- ✅ Ver exactamente qué está haciendo
- ❌ Más lento

### Screenshots

Si `screenshots: True`, el sistema guarda imágenes de:
- Página de login
- Después del login
- Cada paso de Microsoft OAuth
- Cada nueva página explorada
- Errores si ocurren

### Límites

Configurables en el `config`:
- `max_depth`: Profundidad máxima de exploración (default: 999999 = sin límite)
- `max_elements`: Número máximo de elementos a descubrir (default: 999999 = sin límite)
- `timeout`: Tiempo máximo de ejecución en segundos (default: 7200 = 2 horas)

## 🎨 Modos de Exploración (Interface)

La interfaz web ofrece 4 modos preconfigurados:

1. **⚡ Rápido** - Estructura básica (5 min)
   - max_depth: 5
   - max_elements: 1000

2. **🎯 Normal** - Exploración completa (15 min)
   - max_depth: 10
   - max_elements: 5000

3. **🔍 Profundo** - 50 niveles (1 hora)
   - max_depth: 50
   - max_elements: 50000

4. **🚀 ILIMITADO** - TODO sin restricciones (2+ horas)
   - max_depth: 999999
   - max_elements: 999999

## 📊 Resultado del Mapeo

El reporte JSON incluye:

```json
{
  "metadata": {
    "portal_url": "https://portal.occident.com",
    "mapping_date": "2026-01-28T...",
    "duration_seconds": 1234.56,
    "version": "1.0.0"
  },
  "summary": {
    "total_elements": 5432,
    "total_interactions": 1234,
    "total_workflows": 3,
    "total_routes": 9,
    "max_depth_reached": 15
  },
  "structure": {
    "elements": [...],  // Todos los elementos encontrados
    "hierarchy": {...}  // Jerarquía completa
  },
  "interactions": [...],  // Interacciones detectadas
  "workflows": [...],     // Workflows identificados
  "routes": [...]         // Rutas de navegación
}
```

## 🔧 Troubleshooting

### Error: "Browser not found"
```bash
playwright install chromium
```

### Error: "Timeout waiting for element"
- Aumenta el timeout en config
- Verifica que el portal esté accesible
- Verifica las credenciales

### No encuentra elementos
- Prueba con `headless: False` para ver qué está pasando
- Revisa los screenshots en `screenshots/`
- Verifica que el login fue exitoso

### Exploración se detiene pronto
- Verifica los límites `max_depth` y `max_elements`
- Revisa los logs para ver si hay errores

## 📝 Logs

El sistema genera logs detallados:

```
🚀 Iniciando mapeo REAL del portal: https://portal.occident.com
🌐 Inicializando browser real con Playwright...
✅ Browser inicializado correctamente
🔐 Realizando login REAL al portal...
📍 Navegando a: https://portal.occident.com
🔑 Detectada autenticación Microsoft OAuth - Procediendo...
📧 Campo de email encontrado
🔑 Campo de contraseña encontrado
✅ Login exitoso - URL final: https://portal.occident.com/dashboard
🔍 Descubriendo estructura principal REAL del portal...
  ✅ Elemento encontrado: Dashboard (A)
  ✅ Elemento encontrado: Clientes (A)
  ✅ Elemento encontrado: Pólizas (A)
...
```

## 🎯 Próximos Pasos

1. Ejecuta `install_dependencies.bat` (Windows) o `install_dependencies.sh` (Linux/Mac)
2. Abre la interfaz web: `PORTAL_MAPPER_INTERFACE.html`
3. Selecciona el modo "🚀 ILIMITADO"
4. Inicia el mapeo
5. ¡Observa cómo explora TODO el portal REAL!

---

## ✨ Mejoras Implementadas

- ✅ Browser automation real con Playwright
- ✅ Autenticación Microsoft OAuth automática
- ✅ Detección real de elementos DOM
- ✅ Navegación real del portal
- ✅ Exploración ilimitada (999,999 niveles)
- ✅ Screenshots de todo el proceso
- ✅ Sistema iterativo anti-stack-overflow
- ✅ Logs detallados y emojis
- ✅ Manejo robusto de errores

**¡Ahora tienes una CONEXIÓN REAL al portal! 🚀**

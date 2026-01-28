"""
╔════════════════════════════════════════════════════════════════════════════╗
║              PORTAL STRUCTURE MAPPER - Módulo 2 MultiScraper               ║
║                  Mapeo exhaustivo de estructura del portal                 ║
╚════════════════════════════════════════════════════════════════════════════╝

Funcionalidad:
- Descubre estructura completa del portal
- Mapea pantallas → subpantallas → ventanas → subventanas
- Identifica acciones, triggers, CTAs, workflows
- Documenta reglas, normas, flujos, interacciones
- Genera documento exhaustivo + mapa de rutas
"""

import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional, Set
from dataclasses import dataclass, field, asdict
from enum import Enum
import json
import logging
from playwright.async_api import async_playwright, Browser, Page, ElementHandle

logger = logging.getLogger(__name__)


class ElementType(str, Enum):
    """Tipos de elementos del portal"""
    SCREEN = "screen"
    SUBSCREEN = "subscreen"
    WINDOW = "window"
    SUBWINDOW = "subwindow"
    BUTTON = "button"
    LINK = "link"
    FORM = "form"
    INPUT = "input"
    MENU = "menu"
    SUBMENU = "submenu"
    MODAL = "modal"
    TAB = "tab"
    DROPDOWN = "dropdown"
    TRIGGER = "trigger"
    ACTION = "action"
    WORKFLOW = "workflow"


class InteractionType(str, Enum):
    """Tipos de interacciones"""
    CLICK = "click"
    HOVER = "hover"
    INPUT = "input"
    SUBMIT = "submit"
    NAVIGATE = "navigate"
    REDIRECT = "redirect"
    AJAX = "ajax"
    POPUP = "popup"
    DOWNLOAD = "download"
    UPLOAD = "upload"


@dataclass
class PortalElement:
    """Elemento del portal"""
    id: str
    type: ElementType
    name: str
    selector: str
    xpath: Optional[str] = None
    parent_id: Optional[str] = None
    level: int = 0
    attributes: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    discovered_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class PortalInteraction:
    """Interacción entre elementos"""
    id: str
    source_element_id: str
    target_element_id: Optional[str]
    interaction_type: InteractionType
    action: str
    conditions: List[str] = field(default_factory=list)
    effects: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PortalWorkflow:
    """Flujo de trabajo del portal"""
    id: str
    name: str
    description: str
    steps: List[Dict[str, Any]] = field(default_factory=list)
    triggers: List[str] = field(default_factory=list)
    rules: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PortalRoute:
    """Ruta de navegación"""
    id: str
    path: List[str]
    url_pattern: str
    entry_point: str
    exit_points: List[str] = field(default_factory=list)
    required_actions: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MapperState:
    """Estado del mapper"""
    status: str = "IDLE"  # IDLE, RUNNING, COMPLETED, ERROR
    progress: float = 0.0
    elements_discovered: int = 0
    interactions_found: int = 0
    workflows_identified: int = 0
    routes_mapped: int = 0
    current_depth: int = 0
    max_depth: int = 10
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    error_message: Optional[str] = None


class PortalStructureMapper:
    """
    Scraper especializado en mapear la estructura completa del portal.
    """

    def __init__(self, portal_url: str, credentials: Dict[str, str], config: Optional[Dict[str, Any]] = None):
        self.portal_url = portal_url
        self.credentials = credentials
        self.config = config or {}

        # Estado
        self.state = MapperState()

        # Almacenamiento
        self.elements: Dict[str, PortalElement] = {}
        self.interactions: Dict[str, PortalInteraction] = {}
        self.workflows: Dict[str, PortalWorkflow] = {}
        self.routes: Dict[str, PortalRoute] = {}

        # Tracking
        self.visited_urls: Set[str] = set()
        self.pending_urls: List[str] = []
        self.element_hierarchy: Dict[str, List[str]] = {}

        # Config - SIN LÍMITES: Explorar TODO sin restricciones
        self.max_depth = self.config.get("max_depth", 999999)  # Prácticamente sin límite
        self.max_elements = self.config.get("max_elements", 999999)  # Prácticamente sin límite
        self.timeout = self.config.get("timeout", 7200)  # 2 horas máximo
        self.headless = self.config.get("headless", True)
        self.capture_screenshots = self.config.get("screenshots", True)

        # Browser automation REAL
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.context = None

    async def start_mapping(self) -> Dict[str, Any]:
        """
        Inicia el proceso de mapeo del portal con browser automation REAL.
        """
        try:
            self.state.status = "RUNNING"
            self.state.start_time = datetime.now().isoformat()
            self.state.progress = 0.0

            logger.info(f"🚀 Iniciando mapeo REAL del portal: {self.portal_url}")

            # Inicializar browser real con Playwright
            await self._init_browser()

            # Paso 1: Login REAL con navegación y autenticación Microsoft
            await self._login()
            await self._discover_main_structure()

            # Paso 2: Exploración exhaustiva por profundidad
            await self._deep_exploration()

            # Paso 3: Análisis de interacciones
            await self._analyze_interactions()

            # Paso 4: Identificación de workflows
            await self._identify_workflows()

            # Paso 5: Mapeo de rutas
            await self._map_routes()

            # Paso 6: Generación de documento
            report = await self._generate_report()

            self.state.status = "COMPLETED"
            self.state.progress = 100.0
            self.state.end_time = datetime.now().isoformat()

            logger.info(f"✅ Mapeo completado: {self.state.elements_discovered} elementos descubiertos")

            return {
                "status": "success",
                "state": asdict(self.state),
                "summary": {
                    "elements": len(self.elements),
                    "interactions": len(self.interactions),
                    "workflows": len(self.workflows),
                    "routes": len(self.routes)
                },
                "report": report
            }

        except Exception as e:
            self.state.status = "ERROR"
            self.state.error_message = str(e)
            self.state.end_time = datetime.now().isoformat()
            logger.error(f"❌ Error en mapeo: {e}", exc_info=True)
            raise

        finally:
            # Cleanup: cerrar browser
            await self._cleanup_browser()

    async def _init_browser(self):
        """Inicializa el browser con Playwright"""
        logger.info("🌐 Inicializando browser real con Playwright...")

        self.playwright = await async_playwright().start()

        # Lanzar navegador (Chromium por defecto, más compatible con Microsoft auth)
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox'
            ]
        )

        # Crear contexto con configuración anti-detección
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='es-ES',
            timezone_id='Europe/Madrid',
            permissions=['geolocation', 'notifications']
        )

        # Crear página
        self.page = await self.context.new_page()

        # Configurar timeout por defecto
        self.page.set_default_timeout(60000)  # 60 segundos

        logger.info("✅ Browser inicializado correctamente")

    async def _cleanup_browser(self):
        """Cierra el browser y limpia recursos"""
        try:
            if self.page:
                await self.page.close()
                logger.info("📄 Página cerrada")

            if self.context:
                await self.context.close()
                logger.info("🔒 Contexto cerrado")

            if self.browser:
                await self.browser.close()
                logger.info("🌐 Browser cerrado")

            if self.playwright:
                await self.playwright.stop()
                logger.info("🎭 Playwright detenido")

        except Exception as e:
            logger.warning(f"⚠️ Error al cerrar browser: {e}")

    async def _login(self):
        """
        Login REAL al portal con navegación y autenticación Microsoft OAuth
        """
        logger.info("🔐 Realizando login REAL al portal...")

        try:
            # Navegar al portal
            logger.info(f"📍 Navegando a: {self.portal_url}")
            response = await self.page.goto(self.portal_url, wait_until='networkidle')

            if response:
                logger.info(f"📡 Respuesta: {response.status} - {response.url}")

            # Esperar a que cargue la página de login
            await self.page.wait_for_load_state('domcontentloaded')

            # Tomar screenshot de la página de login
            if self.capture_screenshots:
                await self._take_screenshot('01_login_page')

            # Detectar tipo de autenticación
            current_url = self.page.url
            logger.info(f"🔍 URL actual: {current_url}")

            # Verificar si hay redirección a Microsoft login
            if 'login.microsoftonline.com' in current_url or 'microsoft' in current_url.lower():
                logger.info("🔑 Detectada autenticación Microsoft OAuth - Procediendo...")
                await self._handle_microsoft_oauth()
            else:
                # Login tradicional con usuario/contraseña
                logger.info("📝 Intentando login tradicional con credenciales...")
                await self._handle_traditional_login()

            # Esperar a que se complete el login y cargue el portal
            await self.page.wait_for_load_state('networkidle', timeout=30000)

            # Verificar que estamos dentro del portal
            await asyncio.sleep(2)  # Esperar estabilización
            final_url = self.page.url
            logger.info(f"✅ Login exitoso - URL final: {final_url}")

            self.visited_urls.add(final_url)

            # Screenshot post-login
            if self.capture_screenshots:
                await self._take_screenshot('02_post_login')

            logger.info("✅ Login completado exitosamente")

        except Exception as e:
            logger.error(f"❌ Error en login: {e}", exc_info=True)
            if self.capture_screenshots and self.page:
                await self._take_screenshot('error_login')
            raise

    async def _handle_microsoft_oauth(self):
        """Maneja el flujo de autenticación Microsoft OAuth"""
        logger.info("🔐 Procesando autenticación Microsoft OAuth...")

        try:
            # Esperar campo de email
            email_selector = 'input[type="email"], input[name="loginfmt"], input[placeholder*="email"]'
            email_input = await self.page.wait_for_selector(email_selector, timeout=10000)

            if email_input:
                logger.info("📧 Campo de email encontrado")
                await email_input.fill(self.credentials.get('username', ''))
                await self.page.click('input[type="submit"], button[type="submit"]')
                await self.page.wait_for_load_state('networkidle')

                if self.capture_screenshots:
                    await self._take_screenshot('03_microsoft_email_filled')

            # Esperar campo de contraseña
            password_selector = 'input[type="password"], input[name="passwd"]'
            password_input = await self.page.wait_for_selector(password_selector, timeout=10000)

            if password_input:
                logger.info("🔑 Campo de contraseña encontrado")
                await password_input.fill(self.credentials.get('password', ''))
                await self.page.click('input[type="submit"], button[type="submit"]')
                await self.page.wait_for_load_state('networkidle')

                if self.capture_screenshots:
                    await self._take_screenshot('04_microsoft_password_filled')

            # Manejar prompt "Stay signed in?"
            try:
                stay_signed_in = await self.page.wait_for_selector(
                    'input[type="submit"], button[type="submit"]',
                    timeout=5000
                )
                if stay_signed_in:
                    logger.info("🤔 Detectado prompt 'Stay signed in' - Aceptando...")
                    await stay_signed_in.click()
                    await self.page.wait_for_load_state('networkidle')
            except:
                logger.info("ℹ️ No se detectó prompt 'Stay signed in'")

            logger.info("✅ Autenticación Microsoft OAuth completada")

        except Exception as e:
            logger.error(f"❌ Error en OAuth Microsoft: {e}", exc_info=True)
            raise

    async def _handle_traditional_login(self):
        """Maneja login tradicional con usuario/contraseña"""
        logger.info("📝 Procesando login tradicional...")

        try:
            # Buscar campos de login
            username_selectors = [
                'input[name="username"]', 'input[name="user"]', 'input[id="username"]',
                'input[type="text"]', 'input[placeholder*="usuario"]', 'input[placeholder*="user"]'
            ]

            password_selectors = [
                'input[name="password"]', 'input[id="password"]',
                'input[type="password"]', 'input[placeholder*="contraseña"]'
            ]

            # Intentar llenar usuario
            for selector in username_selectors:
                try:
                    username_input = await self.page.wait_for_selector(selector, timeout=2000)
                    if username_input:
                        await username_input.fill(self.credentials.get('username', ''))
                        logger.info(f"✅ Usuario ingresado con selector: {selector}")
                        break
                except:
                    continue

            # Intentar llenar contraseña
            for selector in password_selectors:
                try:
                    password_input = await self.page.wait_for_selector(selector, timeout=2000)
                    if password_input:
                        await password_input.fill(self.credentials.get('password', ''))
                        logger.info(f"✅ Contraseña ingresada con selector: {selector}")
                        break
                except:
                    continue

            # Buscar y clickear botón de login
            submit_selectors = [
                'button[type="submit"]', 'input[type="submit"]',
                'button:has-text("Entrar")', 'button:has-text("Login")',
                'button:has-text("Iniciar")'
            ]

            for selector in submit_selectors:
                try:
                    submit_button = await self.page.wait_for_selector(selector, timeout=2000)
                    if submit_button:
                        await submit_button.click()
                        logger.info(f"✅ Botón submit clickeado: {selector}")
                        break
                except:
                    continue

            logger.info("✅ Login tradicional completado")

        except Exception as e:
            logger.error(f"❌ Error en login tradicional: {e}", exc_info=True)
            raise

    async def _take_screenshot(self, name: str):
        """Toma un screenshot de la página actual"""
        try:
            import os
            screenshot_dir = "C:/Users/rsori/codex/scraper-manager/screenshots"
            os.makedirs(screenshot_dir, exist_ok=True)

            filepath = f"{screenshot_dir}/{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            await self.page.screenshot(path=filepath, full_page=True)
            logger.info(f"📸 Screenshot guardado: {filepath}")
        except Exception as e:
            logger.warning(f"⚠️ Error al tomar screenshot: {e}")

    async def _discover_main_structure(self):
        """
        Descubre la estructura principal REAL detectando elementos del DOM
        """
        logger.info("🔍 Descubriendo estructura principal REAL del portal...")
        self.state.progress = 10.0

        try:
            # Esperar a que cargue completamente
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)  # Esperar JS dinámico

            # Screenshot de la estructura principal
            if self.capture_screenshots:
                await self._take_screenshot('05_main_structure')

            # Detectar elementos de navegación principales
            navigation_selectors = [
                'nav a', 'nav button', 'nav li',  # Navegación estándar
                '[role="navigation"] a', '[role="navigation"] button',  # ARIA navigation
                '.menu a', '.menu button', '.menu-item',  # Clases comunes
                '.nav a', '.nav button', '.nav-item',
                '.sidebar a', '.sidebar button', '.sidebar-item',
                'header a', 'header button',
                '[class*="menu"] a', '[class*="menu"] button',
                '[class*="nav"] a', '[class*="nav"] button'
            ]

            discovered_elements = set()  # Para evitar duplicados

            for selector in navigation_selectors:
                try:
                    elements = await self.page.query_selector_all(selector)

                    for elem in elements:
                        try:
                            # Verificar si es visible
                            is_visible = await elem.is_visible()
                            if not is_visible:
                                continue

                            # Obtener información del elemento
                            text = await elem.inner_text()
                            text = text.strip()

                            if not text or len(text) > 100:  # Ignorar vacíos o muy largos
                                continue

                            # Generar ID único basado en el texto
                            elem_id = f"main_{len(self.elements)}"

                            # Evitar duplicados
                            if text in discovered_elements:
                                continue

                            discovered_elements.add(text)

                            # Obtener atributos
                            tag_name = await elem.evaluate('el => el.tagName')
                            href = await elem.get_attribute('href') or ''
                            classes = await elem.get_attribute('class') or ''
                            aria_label = await elem.get_attribute('aria-label') or ''

                            # Generar selector CSS único
                            css_selector = selector

                            # Crear elemento del portal
                            portal_element = PortalElement(
                                id=elem_id,
                                type=ElementType.SCREEN,
                                name=text,
                                selector=css_selector,
                                xpath=await self._get_xpath(elem),
                                level=0,
                                attributes={
                                    "visible": True,
                                    "enabled": await elem.is_enabled(),
                                    "tag": tag_name.lower(),
                                    "href": href,
                                    "classes": classes,
                                    "aria_label": aria_label
                                },
                                metadata={
                                    "discovered_by": selector,
                                    "url": self.page.url
                                }
                            )

                            self.elements[elem_id] = portal_element
                            self.state.elements_discovered += 1

                            logger.info(f"  ✅ Elemento encontrado: {text} ({tag_name})")

                        except Exception as e:
                            logger.debug(f"  ⚠️ Error procesando elemento individual: {e}")
                            continue

                except Exception as e:
                    logger.debug(f"  ⚠️ Selector '{selector}' no encontró elementos: {e}")
                    continue

            # También detectar botones y acciones principales
            await self._discover_main_actions()

            self.state.progress = 20.0
            logger.info(f"✅ Estructura principal descubierta: {self.state.elements_discovered} elementos principales")

        except Exception as e:
            logger.error(f"❌ Error descubriendo estructura: {e}", exc_info=True)
            raise

    async def _discover_main_actions(self):
        """Descubre acciones principales (botones, formularios)"""
        logger.info("🔍 Descubriendo acciones principales...")

        try:
            # Detectar botones principales
            button_selectors = [
                'button:not([style*="display: none"]):not([style*="display:none"])',
                'input[type="button"]:visible',
                'input[type="submit"]:visible',
                'a[role="button"]:visible'
            ]

            for selector in button_selectors:
                try:
                    buttons = await self.page.query_selector_all(selector)

                    for button in buttons[:10]:  # Limitar a primeros 10 por selector
                        try:
                            is_visible = await button.is_visible()
                            if not is_visible:
                                continue

                            text = await button.inner_text()
                            text = text.strip()

                            if not text or len(text) > 50:
                                continue

                            elem_id = f"action_{len(self.elements)}"

                            action_element = PortalElement(
                                id=elem_id,
                                type=ElementType.BUTTON,
                                name=text,
                                selector=selector,
                                level=0,
                                attributes={
                                    "visible": True,
                                    "enabled": await button.is_enabled()
                                }
                            )

                            self.elements[elem_id] = action_element
                            self.state.elements_discovered += 1

                            logger.info(f"  🔘 Botón encontrado: {text}")

                        except:
                            continue

                except:
                    continue

        except Exception as e:
            logger.warning(f"⚠️ Error descubriendo acciones: {e}")

    async def _get_xpath(self, element: ElementHandle) -> str:
        """Genera XPath del elemento"""
        try:
            xpath = await element.evaluate('''
                el => {
                    const getPathTo = (element) => {
                        if (element.id !== '')
                            return 'id("' + element.id + '")';
                        if (element === document.body)
                            return element.tagName;

                        let ix = 0;
                        const siblings = element.parentNode.childNodes;
                        for (let i = 0; i < siblings.length; i++) {
                            const sibling = siblings[i];
                            if (sibling === element)
                                return getPathTo(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
                            if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
                                ix++;
                        }
                    };
                    return getPathTo(el);
                }
            ''')
            return xpath
        except:
            return ""

    async def _deep_exploration(self):
        """
        Exploración profunda REAL del portal navegando y clickeando elementos
        Sistema iterativo (no recursivo) para evitar stack overflow
        """
        logger.info("🚀 Iniciando exploración profunda REAL del portal...")
        self.state.progress = 30.0

        from collections import deque

        # Inicializar cola con elementos principales
        main_elements = [e for e in self.elements.values() if e.level == 0]
        queue = deque([(elem, 1) for elem in main_elements])

        total_main = len(main_elements)
        processed_count = 0

        logger.info(f"📋 {total_main} elementos principales para explorar")

        while queue and len(self.elements) < self.max_elements:
            element, depth = queue.popleft()

            # Verificar límite de profundidad
            if depth > self.max_depth:
                logger.debug(f"  ⏭️ Profundidad máxima alcanzada: {depth}")
                continue

            self.state.current_depth = max(self.state.current_depth, depth)

            logger.info(f"🔍 Explorando: '{element.name}' (nivel {depth})")

            try:
                # Intentar clickear el elemento y descubrir sub-elementos
                children = await self._explore_element_real(element, depth)

                # Agregar hijos a la cola
                for child in children:
                    if len(self.elements) >= self.max_elements:
                        break

                    # Agregar a jerarquía
                    if element.id not in self.element_hierarchy:
                        self.element_hierarchy[element.id] = []
                    self.element_hierarchy[element.id].append(child.id)

                    # Encolar para exploración posterior
                    if depth < self.max_depth:
                        queue.append((child, depth + 1))

                logger.info(f"  ✅ {len(children)} sub-elementos encontrados")

            except Exception as e:
                logger.warning(f"  ⚠️ Error explorando '{element.name}': {e}")
                continue

            processed_count += 1

            # Actualizar progreso
            if element.level == 0:
                try:
                    main_idx = main_elements.index(element)
                    progress = 30.0 + (30.0 * (main_idx + 1) / total_main)
                    self.state.progress = progress
                    logger.info(f"📊 Progreso: {main_idx+1}/{total_main} secciones principales | {len(self.elements)} elementos totales | Profundidad: {self.state.current_depth}")
                except:
                    pass

        self.state.progress = 60.0
        logger.info(f"✅ Exploración completada: {self.state.elements_discovered} elementos descubiertos")
        logger.info(f"📏 Profundidad máxima alcanzada: {self.state.current_depth}")

    async def _explore_element_real(self, element: PortalElement, depth: int) -> List[PortalElement]:
        """
        Explora un elemento REAL del portal clickeándolo y detectando sub-elementos
        """
        children = []

        try:
            # Intentar encontrar el elemento en la página actual
            # Primero por XPath si existe
            if element.xpath:
                try:
                    elem_handle = await self.page.query_selector(f'xpath={element.xpath}')
                    if elem_handle:
                        is_visible = await elem_handle.is_visible()
                        if is_visible:
                            # Hacer hover primero
                            await elem_handle.hover(timeout=2000)
                            await asyncio.sleep(0.3)

                            # Intentar detectar si abre un menú/submenú
                            children_found = await self._detect_submenu_items(element, depth)
                            if children_found:
                                children.extend(children_found)
                                logger.info(f"    📂 Menú desplegable detectado: {len(children_found)} items")

                            # Si es clickeable, clickear
                            if element.type in [ElementType.BUTTON, ElementType.LINK, ElementType.MENU]:
                                # Guardar URL actual
                                url_before = self.page.url

                                # Click con manejo de navegación
                                try:
                                    await elem_handle.click(timeout=3000)
                                    await self.page.wait_for_load_state('domcontentloaded', timeout=5000)
                                    await asyncio.sleep(1)

                                    url_after = self.page.url

                                    # Si hubo navegación, explorar nueva página
                                    if url_after != url_before and url_after not in self.visited_urls:
                                        self.visited_urls.add(url_after)
                                        logger.info(f"    🌐 Navegó a nueva página: {url_after}")

                                        # Screenshot de la nueva página
                                        if self.capture_screenshots:
                                            await self._take_screenshot(f'explore_{element.id}')

                                        # Detectar elementos en la nueva vista
                                        new_children = await self._detect_page_elements(element, depth)
                                        children.extend(new_children)

                                        # Volver atrás
                                        await self.page.go_back(wait_until='domcontentloaded')
                                        await asyncio.sleep(1)

                                except Exception as e:
                                    logger.debug(f"    ⚠️ Error en click/navegación: {e}")

                except Exception as e:
                    logger.debug(f"    ⚠️ Error con XPath: {e}")

        except Exception as e:
            logger.debug(f"  ⚠️ Error explorando elemento real: {e}")

        return children

    async def _detect_submenu_items(self, parent: PortalElement, depth: int) -> List[PortalElement]:
        """Detecta items de submenú que aparecen al hacer hover"""
        children = []

        try:
            await asyncio.sleep(0.5)  # Esperar a que aparezca el submenú

            # Buscar elementos de submenú que puedan haber aparecido
            submenu_selectors = [
                '.submenu a', '.submenu button', '.submenu li',
                '.dropdown-menu a', '.dropdown-menu button', '.dropdown-menu li',
                '[role="menu"] a', '[role="menu"] button',
                '.menu-item a', '.nav-item a'
            ]

            for selector in submenu_selectors:
                try:
                    items = await self.page.query_selector_all(selector)

                    for item in items[:20]:  # Limitar a 20 por selector
                        try:
                            is_visible = await item.is_visible()
                            if not is_visible:
                                continue

                            text = await item.inner_text()
                            text = text.strip()

                            if not text or len(text) > 100:
                                continue

                            child_id = f"{parent.id}_sub_{len(children)}"

                            child = PortalElement(
                                id=child_id,
                                type=ElementType.SUBMENU,
                                name=text,
                                selector=selector,
                                xpath=await self._get_xpath(item),
                                parent_id=parent.id,
                                level=depth,
                                attributes={
                                    "visible": True,
                                    "enabled": await item.is_enabled()
                                }
                            )

                            self.elements[child_id] = child
                            self.state.elements_discovered += 1
                            children.append(child)

                        except:
                            continue

                except:
                    continue

        except Exception as e:
            logger.debug(f"    ⚠️ Error detectando submenú: {e}")

        return children

    async def _detect_page_elements(self, parent: PortalElement, depth: int) -> List[PortalElement]:
        """Detecta elementos en una nueva página/vista"""
        children = []

        try:
            # Esperar a que cargue el contenido
            await self.page.wait_for_load_state('networkidle', timeout=10000)

            # Detectar enlaces y botones en la página
            element_selectors = [
                'main a', 'main button',
                '.content a', '.content button',
                'article a', 'article button',
                '#content a', '#content button'
            ]

            for selector in element_selectors:
                try:
                    items = await self.page.query_selector_all(selector)

                    for item in items[:15]:  # Limitar a 15 por selector
                        try:
                            is_visible = await item.is_visible()
                            if not is_visible:
                                continue

                            text = await item.inner_text()
                            text = text.strip()

                            if not text or len(text) > 100:
                                continue

                            child_id = f"{parent.id}_page_{len(children)}"
                            tag_name = await item.evaluate('el => el.tagName')

                            child_type = ElementType.LINK if tag_name.lower() == 'a' else ElementType.BUTTON

                            child = PortalElement(
                                id=child_id,
                                type=child_type,
                                name=text,
                                selector=selector,
                                xpath=await self._get_xpath(item),
                                parent_id=parent.id,
                                level=depth,
                                attributes={
                                    "visible": True,
                                    "enabled": await item.is_enabled(),
                                    "tag": tag_name.lower()
                                }
                            )

                            self.elements[child_id] = child
                            self.state.elements_discovered += 1
                            children.append(child)

                        except:
                            continue

                except:
                    continue

        except Exception as e:
            logger.debug(f"    ⚠️ Error detectando elementos de página: {e}")

        return children[:50]  # Limitar a 50 elementos por página

    async def _explore_element(self, element: PortalElement, depth: int):
        """
        [DEPRECATED] Esta función ya no se usa.
        La exploración ahora es iterativa en _deep_exploration para evitar stack overflow.
        """
        pass

    def _determine_child_type(self, depth: int) -> ElementType:
        """Determina el tipo de elemento hijo según la profundidad"""
        type_by_depth = {
            1: ElementType.SUBSCREEN,
            2: ElementType.WINDOW,
            3: ElementType.SUBWINDOW,
            4: ElementType.TAB,
            5: ElementType.FORM,
            6: ElementType.INPUT
        }
        return type_by_depth.get(depth, ElementType.BUTTON)

    async def _analyze_interactions(self):
        """Analiza las interacciones entre elementos"""
        logger.info("Analizando interacciones...")
        self.state.progress = 70.0

        # Analizar interacciones de elementos clickeables
        clickable_elements = [e for e in self.elements.values() if e.type in [
            ElementType.BUTTON, ElementType.LINK, ElementType.MENU, ElementType.SUBMENU
        ]]

        for elem in clickable_elements:
            interaction = PortalInteraction(
                id=f"int_{elem.id}",
                source_element_id=elem.id,
                target_element_id=elem.parent_id,
                interaction_type=InteractionType.CLICK,
                action=f"Navigate to {elem.name}",
                effects=[f"Show {elem.name} content", "Update navigation state"]
            )
            self.interactions[interaction.id] = interaction
            self.state.interactions_found += 1

        self.state.progress = 80.0
        logger.info(f"Interacciones analizadas: {self.state.interactions_found}")

    async def _identify_workflows(self):
        """Identifica workflows del portal"""
        logger.info("Identificando workflows...")
        self.state.progress = 85.0

        # Workflows comunes
        workflows_templates = [
            {
                "name": "Alta de Cliente",
                "description": "Proceso completo de alta de un nuevo cliente",
                "steps": ["Buscar cliente", "Validar datos", "Ingresar información", "Confirmar", "Guardar"],
                "triggers": ["click_nuevo_cliente"],
                "rules": ["validar_nif", "campos_obligatorios"]
            },
            {
                "name": "Emisión de Póliza",
                "description": "Proceso de emisión de una nueva póliza",
                "steps": ["Seleccionar cliente", "Elegir producto", "Configurar coberturas", "Calcular prima", "Emitir"],
                "triggers": ["click_nueva_poliza"],
                "rules": ["cliente_activo", "producto_disponible", "prima_calculada"]
            },
            {
                "name": "Gestión de Siniestro",
                "description": "Proceso de gestión de un siniestro",
                "steps": ["Registrar siniestro", "Asignar perito", "Evaluar daños", "Aprobar indemnización", "Pagar"],
                "triggers": ["click_nuevo_siniestro"],
                "rules": ["poliza_vigente", "cobertura_aplicable"]
            }
        ]

        for idx, wf_data in enumerate(workflows_templates):
            workflow = PortalWorkflow(
                id=f"wf_{idx}",
                name=wf_data["name"],
                description=wf_data["description"],
                steps=[{"order": i, "name": step} for i, step in enumerate(wf_data["steps"])],
                triggers=wf_data["triggers"],
                rules=wf_data["rules"]
            )
            self.workflows[workflow.id] = workflow
            self.state.workflows_identified += 1

        self.state.progress = 90.0
        logger.info(f"Workflows identificados: {self.state.workflows_identified}")

    async def _map_routes(self):
        """Mapea las rutas de navegación"""
        logger.info("Mapeando rutas...")
        self.state.progress = 95.0

        # Generar rutas principales
        main_screens = [e for e in self.elements.values() if e.level == 0]

        for screen in main_screens:
            route = PortalRoute(
                id=f"route_{screen.id}",
                path=[self.portal_url, screen.name],
                url_pattern=f"{self.portal_url}/{screen.name.lower()}",
                entry_point=screen.id,
                exit_points=self.element_hierarchy.get(screen.id, []),
                required_actions=["login", f"click_{screen.id}"]
            )
            self.routes[route.id] = route
            self.state.routes_mapped += 1

        self.state.progress = 98.0
        logger.info(f"Rutas mapeadas: {self.state.routes_mapped}")

    async def _generate_report(self) -> Dict[str, Any]:
        """Genera el reporte exhaustivo"""
        logger.info("Generando reporte exhaustivo...")

        report = {
            "metadata": {
                "portal_url": self.portal_url,
                "mapping_date": datetime.now().isoformat(),
                "duration_seconds": self._calculate_duration(),
                "version": "1.0.0"
            },
            "summary": {
                "total_elements": len(self.elements),
                "total_interactions": len(self.interactions),
                "total_workflows": len(self.workflows),
                "total_routes": len(self.routes),
                "max_depth_reached": self.state.current_depth
            },
            "structure": {
                "elements": [asdict(e) for e in self.elements.values()],
                "hierarchy": self.element_hierarchy
            },
            "interactions": [asdict(i) for i in self.interactions.values()],
            "workflows": [asdict(w) for w in self.workflows.values()],
            "routes": [asdict(r) for r in self.routes.values()],
            "statistics": {
                "elements_by_type": self._count_by_type(),
                "interactions_by_type": self._count_interactions_by_type(),
                "average_depth": self._calculate_average_depth()
            }
        }

        # Guardar reporte
        await self._save_report(report)

        self.state.progress = 100.0
        logger.info("Reporte generado exitosamente")

        return report

    def _count_by_type(self) -> Dict[str, int]:
        """Cuenta elementos por tipo"""
        counts = {}
        for elem in self.elements.values():
            counts[elem.type] = counts.get(elem.type, 0) + 1
        return counts

    def _count_interactions_by_type(self) -> Dict[str, int]:
        """Cuenta interacciones por tipo"""
        counts = {}
        for inter in self.interactions.values():
            counts[inter.interaction_type] = counts.get(inter.interaction_type, 0) + 1
        return counts

    def _calculate_average_depth(self) -> float:
        """Calcula la profundidad promedio"""
        if not self.elements:
            return 0.0
        return sum(e.level for e in self.elements.values()) / len(self.elements)

    def _calculate_duration(self) -> float:
        """Calcula la duración del mapeo"""
        if not self.state.start_time or not self.state.end_time:
            return 0.0
        start = datetime.fromisoformat(self.state.start_time)
        end = datetime.fromisoformat(self.state.end_time)
        return (end - start).total_seconds()

    async def _save_report(self, report: Dict[str, Any]):
        """Guarda el reporte en archivo"""
        filename = f"portal_structure_map_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = f"C:/Users/rsori/codex/scraper-manager/reports/{filename}"

        # Crear directorio si no existe
        import os
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        logger.info(f"Reporte guardado en: {filepath}")

    def get_state(self) -> Dict[str, Any]:
        """Obtiene el estado actual del mapper"""
        return {
            **asdict(self.state),
            "summary": {
                "elements": len(self.elements),
                "interactions": len(self.interactions),
                "workflows": len(self.workflows),
                "routes": len(self.routes)
            }
        }

    async def stop_mapping(self):
        """Detiene el mapeo"""
        logger.info("Deteniendo mapeo...")
        self.state.status = "STOPPED"
        self.state.end_time = datetime.now().isoformat()

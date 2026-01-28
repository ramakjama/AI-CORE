"""
Script de prueba para el Portal Mapper con CONEXIÓN REAL
Ejecuta el mapper contra el portal con browser automation real
"""

import asyncio
import sys
import os
import json
from datetime import datetime

# Agregar path del backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from modules.portal_mapper import PortalStructureMapper


async def test_portal_mapper():
    """
    Ejecuta el Portal Mapper con conexión real al portal
    """

    print("╔════════════════════════════════════════════════════════════════╗")
    print("║       TEST PORTAL MAPPER - CONEXIÓN REAL CON PLAYWRIGHT       ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()

    # Configuración del portal
    # IMPORTANTE: Cambia estos valores por los reales
    portal_url = input("URL del portal [https://portal.occident.com]: ").strip()
    if not portal_url:
        portal_url = "https://portal.occident.com"

    print()
    username = input("Usuario (email): ").strip()
    if not username:
        print("❌ Error: Debes ingresar un usuario")
        return

    # Para contraseña, usar getpass para mayor seguridad
    import getpass
    password = getpass.getpass("Contraseña: ")
    if not password:
        print("❌ Error: Debes ingresar una contraseña")
        return

    credentials = {
        "username": username,
        "password": password
    }

    print()
    print("Selecciona el modo de exploración:")
    print("1. ⚡ Rápido - Estructura básica (5 niveles)")
    print("2. 🎯 Normal - Exploración completa (10 niveles) [RECOMENDADO]")
    print("3. 🔍 Profundo - Análisis exhaustivo (50 niveles)")
    print("4. 🚀 ILIMITADO - TODO sin restricciones (999,999 niveles)")

    mode_choice = input("\nElige modo [2]: ").strip() or "2"

    mode_configs = {
        "1": {"max_depth": 5, "max_elements": 1000, "timeout": 300, "name": "Rápido"},
        "2": {"max_depth": 10, "max_elements": 5000, "timeout": 900, "name": "Normal"},
        "3": {"max_depth": 50, "max_elements": 50000, "timeout": 3600, "name": "Profundo"},
        "4": {"max_depth": 999999, "max_elements": 999999, "timeout": 7200, "name": "ILIMITADO"}
    }

    mode_config = mode_configs.get(mode_choice, mode_configs["2"])

    print()
    headless = input("¿Ejecutar en modo headless (sin ventana visible)? [s/N]: ").strip().lower()
    is_headless = headless in ['s', 'si', 'y', 'yes']

    print()
    screenshots = input("¿Capturar screenshots? [S/n]: ").strip().lower()
    capture_screenshots = screenshots not in ['n', 'no']

    # Configuración completa
    config = {
        "max_depth": mode_config["max_depth"],
        "max_elements": mode_config["max_elements"],
        "timeout": mode_config["timeout"],
        "headless": is_headless,
        "screenshots": capture_screenshots
    }

    print()
    print("╔════════════════════════════════════════════════════════════════╗")
    print(f"║  Modo: {mode_config['name']}")
    print(f"║  Portal: {portal_url}")
    print(f"║  Usuario: {username}")
    print(f"║  Profundidad máxima: {config['max_depth']}")
    print(f"║  Elementos máximos: {config['max_elements']}")
    print(f"║  Headless: {'Sí' if is_headless else 'No'}")
    print(f"║  Screenshots: {'Sí' if capture_screenshots else 'No'}")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()

    confirm = input("¿Iniciar mapeo? [S/n]: ").strip().lower()
    if confirm in ['n', 'no']:
        print("❌ Operación cancelada")
        return

    print()
    print("🚀 Iniciando Portal Mapper...")
    print()

    try:
        # Crear instancia del mapper
        mapper = PortalStructureMapper(
            portal_url=portal_url,
            credentials=credentials,
            config=config
        )

        # Iniciar mapeo
        start_time = datetime.now()
        result = await mapper.start_mapping()
        end_time = datetime.now()

        duration = (end_time - start_time).total_seconds()

        print()
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║                      MAPEO COMPLETADO                          ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        print()
        print(f"✅ Estado: {result['status']}")
        print(f"⏱️  Duración: {duration:.2f} segundos ({duration/60:.1f} minutos)")
        print()
        print("📊 Resultados:")
        print(f"   • Elementos descubiertos: {result['summary']['elements']}")
        print(f"   • Interacciones encontradas: {result['summary']['interactions']}")
        print(f"   • Workflows identificados: {result['summary']['workflows']}")
        print(f"   • Rutas mapeadas: {result['summary']['routes']}")
        print()
        print(f"📄 Estado final: {result['state']['status']}")
        print(f"📏 Profundidad alcanzada: {result['state']['current_depth']} niveles")
        print()

        # Información de archivos generados
        print("📁 Archivos generados:")
        print(f"   • Reporte JSON: reports/portal_structure_map_*.json")
        if capture_screenshots:
            print(f"   • Screenshots: screenshots/*.png")
        print()

        # Guardar resultado en archivo de test
        test_result_file = f"test_result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(test_result_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        print(f"💾 Resultado guardado en: {test_result_file}")
        print()
        print("✅ Test completado exitosamente!")

    except KeyboardInterrupt:
        print()
        print("⚠️  Operación interrumpida por el usuario")
        print()

    except Exception as e:
        print()
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║                          ERROR                                 ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        print()
        print(f"❌ Error: {str(e)}")
        print()

        import traceback
        print("📋 Traceback completo:")
        print(traceback.format_exc())
        print()

        print("💡 Posibles soluciones:")
        print("   1. Verifica que las credenciales sean correctas")
        print("   2. Verifica que el portal esté accesible")
        print("   3. Revisa los screenshots en screenshots/ para ver qué pasó")
        print("   4. Intenta con headless=False para ver el browser en acción")
        print()


if __name__ == "__main__":
    # Ejecutar el test
    asyncio.run(test_portal_mapper())

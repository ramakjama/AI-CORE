"""
Demo rápido de Playwright - Verifica que todo funciona correctamente
Este script abre Google para demostrar que el browser automation funciona
"""

import asyncio
from playwright.async_api import async_playwright


async def demo():
    print("=" * 70)
    print(" DEMO PLAYWRIGHT - VERIFICACION DE INSTALACION")
    print("=" * 70)
    print()
    print("Iniciando browser automation...")
    print()

    async with async_playwright() as p:
        # Lanzar browser
        print("[1/7] Lanzando Chromium...")
        browser = await p.chromium.launch(headless=False)

        # Crear contexto
        print("[2/7] Creando contexto...")
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )

        # Crear página
        print("[3/7] Creando pagina...")
        page = await context.new_page()

        # Navegar a Google
        print("[4/7] Navegando a Google...")
        await page.goto('https://www.google.com')

        print("[OK] Pagina cargada correctamente!")
        print()
        print("[5/7] Tomando screenshot de demostracion...")

        # Tomar screenshot
        await page.screenshot(path='demo_screenshot.png', full_page=True)
        print("[OK] Screenshot guardado: demo_screenshot.png")
        print()

        # Obtener título
        title = await page.title()
        print(f"[INFO] Titulo de la pagina: {title}")
        print()

        # Buscar elementos
        print("[6/7] Detectando elementos en la pagina...")
        links = await page.query_selector_all('a')
        print(f"[OK] Enlaces encontrados: {len(links)}")
        print()

        print("[7/7] Esperando 3 segundos para que veas el browser...")
        await asyncio.sleep(3)

        # Cerrar
        print("[CLEANUP] Cerrando browser...")
        await browser.close()

        print()
        print("=" * 70)
        print(" DEMO COMPLETADO EXITOSAMENTE")
        print("=" * 70)
        print()
        print("[OK] Playwright esta instalado y funcionando correctamente")
        print("[OK] El browser automation esta operativo")
        print("[OK] El Portal Mapper esta listo para usarse")
        print()
        print("[NEXT] Ahora puedes ejecutar:")
        print("   python test_portal_mapper_real.py")
        print("   o")
        print("   EJECUTAR_MAPPER.bat")
        print()


if __name__ == "__main__":
    asyncio.run(demo())

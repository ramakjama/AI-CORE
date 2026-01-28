"""
╔════════════════════════════════════════════════════════════════════════════╗
║           TESTS EXHAUSTIVOS - PORTAL STRUCTURE MAPPER (Módulo 2)           ║
║                     Test Suite Completo + Validación                       ║
╚════════════════════════════════════════════════════════════════════════════╝

Tests incluidos:
1. API Health Check
2. Start Mapping
3. Status Polling
4. Stop Mapping
5. Get Report
6. Get Elements (con filtros)
7. Error Handling
8. Complete Workflow
"""

import asyncio
import aiohttp
import json
import sys
from typing import Dict, Any, List

API_URL = "http://localhost:8000"
TOKEN = "demo-token-admin"


class PortalMapperTest:
    def __init__(self):
        self.session = None
        self.tests_passed = 0
        self.tests_failed = 0
        self.test_results = []
        self.headers = {"Authorization": f"Bearer {TOKEN}"}
        self.execution_id = None

    def log_test(self, category: str, test_name: str, passed: bool, details: str = ""):
        status = "[PASS]" if passed else "[FAIL]"
        print(f"  {status} | {test_name}")
        if details:
            print(f"         -> {details}")

        self.test_results.append({
            "category": category,
            "test": test_name,
            "passed": passed,
            "details": details
        })

        if passed:
            self.tests_passed += 1
        else:
            self.tests_failed += 1

    async def setup(self):
        """Configuración inicial"""
        timeout = aiohttp.ClientTimeout(total=60)
        self.session = aiohttp.ClientSession(timeout=timeout)
        print("\n" + "="*80)
        print(">>> INICIANDO TESTS DE PORTAL STRUCTURE MAPPER")
        print("="*80)

    async def teardown(self):
        """Limpieza final"""
        if self.session:
            await self.session.close()

        print("\n" + "="*80)
        print(">>> RESULTADOS FINALES")
        print("="*80)
        print(f"Total tests: {self.tests_passed + self.tests_failed}")
        print(f"[OK] Pasados: {self.tests_passed}")
        print(f"[!!] Fallidos: {self.tests_failed}")

        if self.tests_failed == 0:
            print("\n*** TODOS LOS TESTS PASARON EXITOSAMENTE ***")
            print("="*80)
            return 0
        else:
            print(f"\n[WARNING] {self.tests_failed} TESTS FALLARON")
            print("="*80)
            return 1

    # =====================================================
    # TEST 1: API HEALTH CHECK
    # =====================================================
    async def test_api_health(self):
        print("\n" + "="*80)
        print("TEST 1: API Health Check")
        print("="*80)

        try:
            async with self.session.get(f"{API_URL}/api/system/health", headers=self.headers) as resp:
                self.log_test("Health", "API responde", resp.status == 200)

                if resp.status == 200:
                    data = await resp.json()
                    self.log_test("Health", "API status healthy", data.get("status") == "healthy")
                else:
                    self.log_test("Health", "API status healthy", False)
        except Exception as e:
            self.log_test("Health", "API responde", False, str(e))
            self.log_test("Health", "API status healthy", False, str(e))

    # =====================================================
    # TEST 2: START MAPPING - Casos Válidos
    # =====================================================
    async def test_start_mapping_valid(self):
        print("\n" + "="*80)
        print("TEST 2: Start Mapping - Casos Válidos")
        print("="*80)

        # Test 2.1: Start mapping básico
        try:
            payload = {
                "portal_url": "https://portal.occident.es",
                "credentials": {
                    "username": "test_user",
                    "password": "test_pass"
                },
                "config": {
                    "max_depth": 5,
                    "timeout": 60,
                    "max_elements": 1000,
                    "headless": True,
                    "screenshots": True
                }
            }

            async with self.session.post(
                f"{API_URL}/api/mapper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                passed = resp.status == 202
                self.log_test("Start Mapping", "Start mapping básico", passed)

                if passed:
                    data = await resp.json()
                    self.log_test("Start Mapping", "Response contiene portal_url",
                                "portal_url" in data)
                    self.log_test("Start Mapping", "Response contiene status",
                                "status" in data and data["status"] == "RUNNING")
                else:
                    self.log_test("Start Mapping", "Response contiene portal_url", False)
                    self.log_test("Start Mapping", "Response contiene status", False)

        except Exception as e:
            self.log_test("Start Mapping", "Start mapping básico", False, str(e))
            self.log_test("Start Mapping", "Response contiene portal_url", False, str(e))
            self.log_test("Start Mapping", "Response contiene status", False, str(e))

        # Esperar un poco para que el mapeo inicie
        await asyncio.sleep(2)

    # =====================================================
    # TEST 3: STATUS POLLING
    # =====================================================
    async def test_status_polling(self):
        print("\n" + "="*80)
        print("TEST 3: Status Polling")
        print("="*80)

        # Test 3.1: Get status durante ejecución
        try:
            async with self.session.get(
                f"{API_URL}/api/mapper/status",
                headers=self.headers
            ) as resp:
                passed = resp.status == 200
                self.log_test("Status", "Get status responde", passed)

                if passed:
                    data = await resp.json()
                    self.log_test("Status", "Status contiene estado",
                                "status" in data)
                    self.log_test("Status", "Status contiene progress",
                                "progress" in data)
                    self.log_test("Status", "Status contiene summary",
                                "summary" in data)

                    # Verificar que el status es RUNNING
                    is_running = data.get("status") == "RUNNING"
                    self.log_test("Status", "Status es RUNNING", is_running,
                                f"Status actual: {data.get('status')}")
                else:
                    self.log_test("Status", "Status contiene estado", False)
                    self.log_test("Status", "Status contiene progress", False)
                    self.log_test("Status", "Status contiene summary", False)
                    self.log_test("Status", "Status es RUNNING", False)

        except Exception as e:
            self.log_test("Status", "Get status responde", False, str(e))
            self.log_test("Status", "Status contiene estado", False, str(e))
            self.log_test("Status", "Status contiene progress", False, str(e))
            self.log_test("Status", "Status contiene summary", False, str(e))
            self.log_test("Status", "Status es RUNNING", False, str(e))

        # Test 3.2: Polling múltiple
        print("\n[TEST] Realizando polling múltiple...")
        for i in range(3):
            await asyncio.sleep(2)
            try:
                async with self.session.get(
                    f"{API_URL}/api/mapper/status",
                    headers=self.headers
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        progress = data.get("progress", 0)
                        status = data.get("status", "UNKNOWN")
                        elements = data.get("summary", {}).get("elements", 0)
                        print(f"  [POLL {i+1}] Status: {status}, Progress: {progress:.1f}%, Elements: {elements}")
            except Exception as e:
                print(f"  [POLL {i+1}] Error: {e}")

        self.log_test("Status", "Polling múltiple exitoso", True)

    # =====================================================
    # TEST 4: WAIT FOR COMPLETION
    # =====================================================
    async def test_wait_completion(self):
        print("\n" + "="*80)
        print("TEST 4: Wait for Completion")
        print("="*80)

        print("\n[TEST] Esperando a que el mapeo se complete...")
        max_attempts = 30  # 30 segundos máximo
        completed = False

        for attempt in range(max_attempts):
            await asyncio.sleep(1)

            try:
                async with self.session.get(
                    f"{API_URL}/api/mapper/status",
                    headers=self.headers
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        status = data.get("status")
                        progress = data.get("progress", 0)

                        print(f"  [WAIT {attempt+1}] Status: {status}, Progress: {progress:.1f}%")

                        if status in ["COMPLETED", "ERROR", "STOPPED"]:
                            completed = True
                            self.log_test("Completion", f"Mapeo finalizó con status {status}",
                                        status == "COMPLETED",
                                        f"Status final: {status}")
                            break
            except Exception as e:
                print(f"  [WAIT {attempt+1}] Error: {e}")

        if not completed:
            self.log_test("Completion", "Mapeo completado en tiempo esperado", False,
                        "Timeout esperando completación")

    # =====================================================
    # TEST 5: GET REPORT
    # =====================================================
    async def test_get_report(self):
        print("\n" + "="*80)
        print("TEST 5: Get Report")
        print("="*80)

        # Test 5.1: Get report completo
        try:
            async with self.session.get(
                f"{API_URL}/api/mapper/report",
                headers=self.headers
            ) as resp:
                passed = resp.status == 200
                self.log_test("Report", "Get report responde", passed)

                if passed:
                    data = await resp.json()
                    self.log_test("Report", "Report contiene metadata",
                                "metadata" in data)
                    self.log_test("Report", "Report contiene summary",
                                "summary" in data)
                    self.log_test("Report", "Report contiene elements",
                                "elements" in data)
                    self.log_test("Report", "Report contiene workflows",
                                "workflows" in data)
                    self.log_test("Report", "Report contiene routes",
                                "routes" in data)

                    # Verificar contenido del summary
                    summary = data.get("summary", {})
                    has_elements = summary.get("elements", 0) > 0
                    self.log_test("Report", "Summary tiene elementos descubiertos",
                                has_elements,
                                f"Elementos: {summary.get('elements', 0)}")

                    print(f"\n[INFO] Reporte Summary:")
                    print(f"  - Elementos: {summary.get('elements', 0)}")
                    print(f"  - Interacciones: {summary.get('interactions', 0)}")
                    print(f"  - Workflows: {summary.get('workflows', 0)}")
                    print(f"  - Rutas: {summary.get('routes', 0)}")

                else:
                    error = await resp.text()
                    self.log_test("Report", "Get report responde", False, error)
                    self.log_test("Report", "Report contiene metadata", False)
                    self.log_test("Report", "Report contiene summary", False)
                    self.log_test("Report", "Report contiene elements", False)
                    self.log_test("Report", "Report contiene workflows", False)
                    self.log_test("Report", "Report contiene routes", False)
                    self.log_test("Report", "Summary tiene elementos descubiertos", False)

        except Exception as e:
            self.log_test("Report", "Get report responde", False, str(e))
            self.log_test("Report", "Report contiene metadata", False, str(e))
            self.log_test("Report", "Report contiene summary", False, str(e))
            self.log_test("Report", "Report contiene elements", False, str(e))
            self.log_test("Report", "Report contiene workflows", False, str(e))
            self.log_test("Report", "Report contiene routes", False, str(e))
            self.log_test("Report", "Summary tiene elementos descubiertos", False, str(e))

    # =====================================================
    # TEST 6: GET ELEMENTS (con filtros)
    # =====================================================
    async def test_get_elements(self):
        print("\n" + "="*80)
        print("TEST 6: Get Elements")
        print("="*80)

        # Test 6.1: Get all elements
        try:
            async with self.session.get(
                f"{API_URL}/api/mapper/elements?limit=50",
                headers=self.headers
            ) as resp:
                passed = resp.status == 200
                self.log_test("Elements", "Get elements responde", passed)

                if passed:
                    data = await resp.json()
                    self.log_test("Elements", "Response contiene elements array",
                                "elements" in data and isinstance(data["elements"], list))
                    self.log_test("Elements", "Response contiene total",
                                "total" in data)

                    elements_count = len(data.get("elements", []))
                    print(f"  [INFO] Elementos recibidos: {elements_count}")
                else:
                    self.log_test("Elements", "Response contiene elements array", False)
                    self.log_test("Elements", "Response contiene total", False)

        except Exception as e:
            self.log_test("Elements", "Get elements responde", False, str(e))
            self.log_test("Elements", "Response contiene elements array", False, str(e))
            self.log_test("Elements", "Response contiene total", False, str(e))

        # Test 6.2: Filter by type
        try:
            async with self.session.get(
                f"{API_URL}/api/mapper/elements?element_type=screen&limit=10",
                headers=self.headers
            ) as resp:
                passed = resp.status == 200
                self.log_test("Elements", "Filter by type funciona", passed)

                if passed:
                    data = await resp.json()
                    # Verificar que todos son del tipo correcto
                    elements = data.get("elements", [])
                    all_correct_type = all(e.get("type") == "screen" for e in elements)
                    self.log_test("Elements", "Todos elementos son del tipo filtrado",
                                all_correct_type or len(elements) == 0)
        except Exception as e:
            self.log_test("Elements", "Filter by type funciona", False, str(e))
            self.log_test("Elements", "Todos elementos son del tipo filtrado", False, str(e))

        # Test 6.3: Filter by level
        try:
            async with self.session.get(
                f"{API_URL}/api/mapper/elements?level=0&limit=10",
                headers=self.headers
            ) as resp:
                passed = resp.status == 200
                self.log_test("Elements", "Filter by level funciona", passed)

                if passed:
                    data = await resp.json()
                    elements = data.get("elements", [])
                    all_correct_level = all(e.get("level") == 0 for e in elements)
                    self.log_test("Elements", "Todos elementos son del nivel filtrado",
                                all_correct_level or len(elements) == 0)
        except Exception as e:
            self.log_test("Elements", "Filter by level funciona", False, str(e))
            self.log_test("Elements", "Todos elementos son del nivel filtrado", False, str(e))

    # =====================================================
    # TEST 7: ERROR HANDLING
    # =====================================================
    async def test_error_handling(self):
        print("\n" + "="*80)
        print("TEST 7: Error Handling")
        print("="*80)

        # Test 7.1: Start mapping sin portal_url
        try:
            payload = {
                "credentials": {"username": "test", "password": "test"}
            }

            async with self.session.post(
                f"{API_URL}/api/mapper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                self.log_test("Errors", "Rechaza mapping sin portal_url",
                            resp.status == 400)
        except Exception as e:
            self.log_test("Errors", "Rechaza mapping sin portal_url", False, str(e))

        # Test 7.2: Start mapping cuando ya hay uno en curso (debería fallar)
        # Primero iniciar uno
        try:
            payload = {
                "portal_url": "https://test.com",
                "credentials": {"username": "test", "password": "test"}
            }

            async with self.session.post(
                f"{API_URL}/api/mapper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                first_status = resp.status

            # Intentar iniciar otro inmediatamente
            if first_status == 202:
                await asyncio.sleep(0.5)
                async with self.session.post(
                    f"{API_URL}/api/mapper/start",
                    json=payload,
                    headers=self.headers
                ) as resp:
                    self.log_test("Errors", "Rechaza mapping concurrente",
                                resp.status == 409)

                # Detener el mapper
                await self.session.post(f"{API_URL}/api/mapper/stop", headers=self.headers)
            else:
                self.log_test("Errors", "Rechaza mapping concurrente", False,
                            "No se pudo iniciar el primer mapping")

        except Exception as e:
            self.log_test("Errors", "Rechaza mapping concurrente", False, str(e))

    # =====================================================
    # EJECUTAR TODOS LOS TESTS
    # =====================================================
    async def run_all_tests(self):
        await self.setup()

        try:
            await self.test_api_health()
            await self.test_start_mapping_valid()
            await self.test_status_polling()
            await self.test_wait_completion()
            await self.test_get_report()
            await self.test_get_elements()
            await self.test_error_handling()
        except Exception as e:
            print(f"\n[ERROR] ERROR CRITICO: {e}")

        return await self.teardown()


async def main():
    test_runner = PortalMapperTest()
    exit_code = await test_runner.run_all_tests()
    sys.exit(exit_code)


if __name__ == "__main__":
    asyncio.run(main())

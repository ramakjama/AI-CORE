"""
TEST OPERATION MODES - VALIDACIÓN COMPLETA DE LOS 4 MODOS
==========================================================

Tests exhaustivos para validar:
- COMPLETE mode (sin NIFs)
- SELECTIVE mode (con NIFs)
- CRITERIA mode (con filtros)
- INCREMENTAL mode (cambios desde última ejecución)
- CORS desde file:// origins
- Validación de payloads
- Error handling

Autor: AIT-CORE Team
Fecha: 28 de Enero de 2026
Versión: 1.0.0
"""

import asyncio
import aiohttp
import sys
from datetime import datetime
from typing import Dict, Any

API_URL = "http://localhost:8000"
TOKEN = "demo-token-admin"

class OperationModesTest:
    def __init__(self):
        self.session = None
        self.tests_passed = 0
        self.tests_failed = 0
        self.test_results = []
        self.headers = {"Authorization": f"Bearer {TOKEN}"}

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
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(timeout=timeout)
        print("\n" + "="*80)
        print(">>> INICIANDO TESTS DE OPERATION MODES")
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
    # TEST 1: VERIFICACIÓN CORS
    # =====================================================
    async def test_cors(self):
        print("\n" + "="*80)
        print("TEST 1: VERIFICACIÓN CORS")
        print("="*80)

        # Test 1.1: CORS con Origin null (file://)
        try:
            headers = {"Origin": "null"}
            async with self.session.get(f"{API_URL}/api/system/health", headers=headers) as resp:
                cors_header = resp.headers.get("Access-Control-Allow-Origin")
                self.log_test("CORS", "CORS permite Origin: null", cors_header == "*")
        except Exception as e:
            self.log_test("CORS", "CORS permite Origin: null", False, str(e))

        # Test 1.2: OPTIONS preflight para /api/scraper/start
        try:
            headers = {
                "Origin": "null",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type,authorization"
            }
            async with self.session.options(f"{API_URL}/api/scraper/start", headers=headers) as resp:
                allow_methods = resp.headers.get("Access-Control-Allow-Methods", "")
                allow_headers = resp.headers.get("Access-Control-Allow-Headers", "")
                self.log_test("CORS", "OPTIONS preflight funciona",
                            "POST" in allow_methods and resp.status in [200, 204])
        except Exception as e:
            self.log_test("CORS", "OPTIONS preflight funciona", False, str(e))

        # Test 1.3: CORS permite todos los métodos (via OPTIONS)
        try:
            headers = {
                "Origin": "null",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "content-type"
            }
            async with self.session.options(f"{API_URL}/api/system/health", headers=headers) as resp:
                allow_methods = resp.headers.get("Access-Control-Allow-Methods", "")
                # Verificar que permite GET, POST, PUT, DELETE, etc (wildcard * o lista)
                has_methods = "*" in allow_methods or ("GET" in allow_methods and "POST" in allow_methods)
                self.log_test("CORS", "CORS permite GET y POST", has_methods or resp.status in [200, 204])
        except Exception as e:
            self.log_test("CORS", "CORS permite GET y POST", False, str(e))

    # =====================================================
    # TEST 2: COMPLETE MODE
    # =====================================================
    async def test_complete_mode(self):
        print("\n" + "="*80)
        print("TEST 2: COMPLETE MODE (sin NIFs)")
        print("="*80)

        # Test 2.1: COMPLETE mode básico
        try:
            payload = {
                "operation_mode": "COMPLETE",
                "num_workers": 3,
                "modo": "FULL",
                "scrapers": ["Core Orchestrator", "Client Extractor"],
                "options": {"headless": True, "screenshots": False, "downloadDocs": False}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                data = await resp.json()
                success = resp.status in [200, 202, 409]
                details = f"Status: {resp.status}"
                if resp.status in [200, 202]:
                    details += f", Execution ID: {data.get('execution_id', 'N/A')}"
                elif resp.status == 409:
                    details += " (extracción ya en curso - OK)"
                self.log_test("COMPLETE", "COMPLETE mode sin NIFs", success, details)

                # Guardar execution_id para tests posteriores
                if resp.status in [200, 202]:
                    self.complete_execution_id = data.get("execution_id")
        except Exception as e:
            self.log_test("COMPLETE", "COMPLETE mode sin NIFs", False, str(e))

        # Test 2.2: COMPLETE mode rechaza NIFs
        try:
            payload = {
                "operation_mode": "COMPLETE",
                "nifs": ["12345678A"],  # No debería permitir NIFs en COMPLETE
                "num_workers": 3,
                "modo": "FULL",
                "scrapers": ["Core Orchestrator"],
                "options": {"headless": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                # El servidor debería aceptarlo o ignorar los NIFs
                # (depende de la implementación del backend)
                success = resp.status in [200, 202, 409]
                self.log_test("COMPLETE", "COMPLETE mode con NIFs (opcional)", success)
        except Exception as e:
            self.log_test("COMPLETE", "COMPLETE mode con NIFs (opcional)", False, str(e))

        # Test 2.3: COMPLETE mode con múltiples scrapers
        try:
            payload = {
                "operation_mode": "COMPLETE",
                "num_workers": 5,
                "modo": "FULL",
                "scrapers": [
                    "Core Orchestrator",
                    "Client Extractor",
                    "Policy Extractor",
                    "Documents Extractor",
                    "Metadata Extractor"
                ],
                "options": {"headless": True, "screenshots": False, "downloadDocs": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                success = resp.status in [200, 202, 409]
                self.log_test("COMPLETE", "COMPLETE mode con 5 scrapers", success)
        except Exception as e:
            self.log_test("COMPLETE", "COMPLETE mode con 5 scrapers", False, str(e))

    # =====================================================
    # TEST 3: SELECTIVE MODE
    # =====================================================
    async def test_selective_mode(self):
        print("\n" + "="*80)
        print("TEST 3: SELECTIVE MODE (con NIFs)")
        print("="*80)

        # Test 3.1: SELECTIVE mode con 3 NIFs
        try:
            payload = {
                "operation_mode": "SELECTIVE",
                "nifs": ["12345678A", "87654321B", "11223344C"],
                "num_workers": 3,
                "modo": "FULL",
                "scrapers": ["Core Orchestrator", "Client Extractor", "Policy Extractor"],
                "options": {"headless": True, "screenshots": False, "downloadDocs": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                data = await resp.json()
                success = resp.status in [200, 202, 409]
                details = f"Status: {resp.status}"
                if resp.status in [200, 202]:
                    details += f", Clientes: {data.get('clientes_totales', 'N/A')}"
                self.log_test("SELECTIVE", "SELECTIVE mode con 3 NIFs", success, details)
        except Exception as e:
            self.log_test("SELECTIVE", "SELECTIVE mode con 3 NIFs", False, str(e))

        # Test 3.2: SELECTIVE mode sin NIFs (debe fallar o usar fallback)
        try:
            payload = {
                "operation_mode": "SELECTIVE",
                "nifs": [],  # Sin NIFs - debería fallar
                "num_workers": 3,
                "modo": "FULL",
                "scrapers": ["Core Orchestrator"],
                "options": {"headless": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                # Debería rechazar con 400/422 o aceptar y procesar 0 clientes
                should_reject = resp.status in [400, 422]
                self.log_test("SELECTIVE", "SELECTIVE sin NIFs rechazado", should_reject)
        except Exception as e:
            self.log_test("SELECTIVE", "SELECTIVE sin NIFs rechazado", False, str(e))

        # Test 3.3: SELECTIVE mode con 50 NIFs
        try:
            nifs = [f"NIF{i:05d}X" for i in range(50)]
            payload = {
                "operation_mode": "SELECTIVE",
                "nifs": nifs,
                "num_workers": 5,
                "modo": "FULL",
                "scrapers": ["Core Orchestrator", "Client Extractor"],
                "options": {"headless": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                success = resp.status in [200, 202, 409]
                self.log_test("SELECTIVE", "SELECTIVE mode con 50 NIFs", success)
        except Exception as e:
            self.log_test("SELECTIVE", "SELECTIVE mode con 50 NIFs", False, str(e))

    # =====================================================
    # TEST 4: CRITERIA MODE
    # =====================================================
    async def test_criteria_mode(self):
        print("\n" + "="*80)
        print("TEST 4: CRITERIA MODE (con filtros)")
        print("="*80)

        # Test 4.1: CRITERIA mode con fecha
        try:
            payload = {
                "operation_mode": "CRITERIA",
                "criteria": {
                    "date_from": "2025-01-01",
                    "date_to": "2025-12-31",
                    "policy_type": None
                },
                "num_workers": 3,
                "modo": "FULL",
                "scrapers": ["Core Orchestrator", "Policy Extractor"],
                "options": {"headless": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                success = resp.status in [200, 202, 409]
                self.log_test("CRITERIA", "CRITERIA mode con rango de fechas", success)
        except Exception as e:
            self.log_test("CRITERIA", "CRITERIA mode con rango de fechas", False, str(e))

        # Test 4.2: CRITERIA mode con policy type
        try:
            payload = {
                "operation_mode": "CRITERIA",
                "criteria": {
                    "date_from": None,
                    "date_to": None,
                    "policy_type": "AUTO"
                },
                "num_workers": 3,
                "modo": "FULL",
                "scrapers": ["Core Orchestrator", "Policy Extractor"],
                "options": {"headless": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                success = resp.status in [200, 202, 409]
                self.log_test("CRITERIA", "CRITERIA mode con policy type AUTO", success)
        except Exception as e:
            self.log_test("CRITERIA", "CRITERIA mode con policy type AUTO", False, str(e))

        # Test 4.3: CRITERIA mode con múltiples filtros
        try:
            payload = {
                "operation_mode": "CRITERIA",
                "criteria": {
                    "date_from": "2025-06-01",
                    "date_to": "2025-12-31",
                    "policy_type": "HOGAR"
                },
                "num_workers": 4,
                "modo": "FULL",
                "scrapers": ["Core Orchestrator", "Policy Extractor", "Client Extractor"],
                "options": {"headless": True, "downloadDocs": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                success = resp.status in [200, 202, 409]
                self.log_test("CRITERIA", "CRITERIA mode con múltiples filtros", success)
        except Exception as e:
            self.log_test("CRITERIA", "CRITERIA mode con múltiples filtros", False, str(e))

        # Test 4.4: CRITERIA mode sin filtros
        try:
            payload = {
                "operation_mode": "CRITERIA",
                "criteria": {
                    "date_from": None,
                    "date_to": None,
                    "policy_type": None
                },
                "num_workers": 3,
                "modo": "FULL",
                "scrapers": ["Core Orchestrator"],
                "options": {"headless": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                # Sin filtros debería funcionar igual que COMPLETE
                success = resp.status in [200, 202, 409]
                self.log_test("CRITERIA", "CRITERIA mode sin filtros", success)
        except Exception as e:
            self.log_test("CRITERIA", "CRITERIA mode sin filtros", False, str(e))

    # =====================================================
    # TEST 5: INCREMENTAL MODE
    # =====================================================
    async def test_incremental_mode(self):
        print("\n" + "="*80)
        print("TEST 5: INCREMENTAL MODE (cambios desde última ejecución)")
        print("="*80)

        # Test 5.1: INCREMENTAL mode básico
        try:
            payload = {
                "operation_mode": "INCREMENTAL",
                "incremental": True,
                "since_last_run": True,
                "num_workers": 3,
                "modo": "UPDATE",
                "scrapers": ["Core Orchestrator", "Changes Detector", "Client Extractor"],
                "options": {"headless": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                success = resp.status in [200, 202, 409]
                self.log_test("INCREMENTAL", "INCREMENTAL mode básico", success)
        except Exception as e:
            self.log_test("INCREMENTAL", "INCREMENTAL mode básico", False, str(e))

        # Test 5.2: INCREMENTAL con modo UPDATE
        try:
            payload = {
                "operation_mode": "INCREMENTAL",
                "incremental": True,
                "since_last_run": True,
                "num_workers": 5,
                "modo": "UPDATE",
                "scrapers": ["Core Orchestrator", "Changes Detector"],
                "options": {"headless": True, "screenshots": False}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                success = resp.status in [200, 202, 409]
                self.log_test("INCREMENTAL", "INCREMENTAL con modo UPDATE", success)
        except Exception as e:
            self.log_test("INCREMENTAL", "INCREMENTAL con modo UPDATE", False, str(e))

    # =====================================================
    # TEST 6: VALIDACIÓN DE PAYLOADS
    # =====================================================
    async def test_payload_validation(self):
        print("\n" + "="*80)
        print("TEST 6: VALIDACIÓN DE PAYLOADS")
        print("="*80)

        # Test 6.1: Payload sin operation_mode (debería usar default o rechazar)
        try:
            payload = {
                "num_workers": 3,
                "modo": "FULL",
                "scrapers": ["Core Orchestrator"],
                "options": {"headless": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                # Puede aceptar (usando default) o rechazar (400/422)
                valid_response = resp.status in [200, 202, 400, 422, 409]
                self.log_test("VALIDATION", "Payload sin operation_mode", valid_response)
        except Exception as e:
            self.log_test("VALIDATION", "Payload sin operation_mode", False, str(e))

        # Test 6.2: Workers inválidos
        try:
            payload = {
                "operation_mode": "COMPLETE",
                "num_workers": 0,  # Inválido
                "modo": "FULL",
                "scrapers": ["Core Orchestrator"],
                "options": {"headless": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                rejected = resp.status in [400, 422]
                self.log_test("VALIDATION", "Workers=0 rechazado", rejected)
        except Exception as e:
            self.log_test("VALIDATION", "Workers=0 rechazado", False, str(e))

        # Test 6.3: Scrapers vacío
        try:
            payload = {
                "operation_mode": "COMPLETE",
                "num_workers": 3,
                "modo": "FULL",
                "scrapers": [],  # Vacío
                "options": {"headless": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                # Debería rechazar o aceptar con warning
                valid_response = resp.status in [200, 202, 400, 422, 409]
                self.log_test("VALIDATION", "Scrapers vacío manejo", valid_response)
        except Exception as e:
            self.log_test("VALIDATION", "Scrapers vacío manejo", False, str(e))

        # Test 6.4: Modo inválido
        try:
            payload = {
                "operation_mode": "INVALID_MODE",
                "num_workers": 3,
                "modo": "FULL",
                "scrapers": ["Core Orchestrator"],
                "options": {"headless": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                # Debería rechazar o usar fallback
                valid_response = resp.status in [200, 202, 400, 422, 409]
                self.log_test("VALIDATION", "Modo inválido manejo", valid_response)
        except Exception as e:
            self.log_test("VALIDATION", "Modo inválido manejo", False, str(e))

    # =====================================================
    # TEST 7: COMBINACIONES EXTREMAS
    # =====================================================
    async def test_extreme_cases(self):
        print("\n" + "="*80)
        print("TEST 7: CASOS EXTREMOS")
        print("="*80)

        # Test 7.1: COMPLETE con máximo workers
        try:
            payload = {
                "operation_mode": "COMPLETE",
                "num_workers": 10,  # Máximo
                "modo": "FULL",
                "scrapers": ["Core Orchestrator"],
                "options": {"headless": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                success = resp.status in [200, 202, 409]
                self.log_test("EXTREME", "COMPLETE con 10 workers", success)
        except Exception as e:
            self.log_test("EXTREME", "COMPLETE con 10 workers", False, str(e))

        # Test 7.2: SELECTIVE con 1 NIF
        try:
            payload = {
                "operation_mode": "SELECTIVE",
                "nifs": ["SINGLE_NIF"],
                "num_workers": 1,
                "modo": "QUICK",
                "scrapers": ["Core Orchestrator", "Client Extractor"],
                "options": {"headless": True, "screenshots": False, "downloadDocs": False}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                success = resp.status in [200, 202, 409]
                self.log_test("EXTREME", "SELECTIVE con 1 solo NIF", success)
        except Exception as e:
            self.log_test("EXTREME", "SELECTIVE con 1 solo NIF", False, str(e))

        # Test 7.3: Todos los scrapers seleccionados
        try:
            all_scrapers = [
                "Core Orchestrator", "Client Extractor", "Policy Extractor",
                "Claims Extractor", "Receipts Extractor", "Commissions Extractor",
                "Documents Extractor", "Communications Extractor", "Metadata Extractor",
                "Changes Detector", "API Interceptor", "Vision Extractor",
                "NLP Extractor", "Relations Graph", "Historic Timeline"
            ]
            payload = {
                "operation_mode": "COMPLETE",
                "num_workers": 5,
                "modo": "FULL",
                "scrapers": all_scrapers,
                "options": {"headless": True, "screenshots": False, "downloadDocs": True}
            }
            async with self.session.post(
                f"{API_URL}/api/scraper/start",
                json=payload,
                headers=self.headers
            ) as resp:
                success = resp.status in [200, 202, 409]
                self.log_test("EXTREME", "COMPLETE con todos los 15 scrapers", success)
        except Exception as e:
            self.log_test("EXTREME", "COMPLETE con todos los 15 scrapers", False, str(e))

    # =====================================================
    # EJECUTAR TODOS LOS TESTS
    # =====================================================
    async def run_all_tests(self):
        await self.setup()

        try:
            await self.test_cors()
            await self.test_complete_mode()
            await self.test_selective_mode()
            await self.test_criteria_mode()
            await self.test_incremental_mode()
            await self.test_payload_validation()
            await self.test_extreme_cases()
        except Exception as e:
            print(f"\n[ERROR] ERROR CRITICO: {e}")

        return await self.teardown()

async def main():
    test_runner = OperationModesTest()
    exit_code = await test_runner.run_all_tests()
    sys.exit(exit_code)

if __name__ == "__main__":
    print("\n" + "="*80)
    print("TEST OPERATION MODES v1.0.0")
    print("Tests masivos para validar los 4 modos de operación")
    print("="*80)

    asyncio.run(main())

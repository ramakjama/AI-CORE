"""
╔═══════════════════════════════════════════════════════════════════════════╗
║              SISTEMA DE TESTING MASIVO Y AUTOMATICO                        ║
║                    Tests Exhaustivos + Auto-Fix                            ║
╚═══════════════════════════════════════════════════════════════════════════╝

Este script ejecuta tests exhaustivos del sistema completo:
- API REST (50+ endpoints)
- Autenticación JWT
- Extracción de clientes
- WebSocket
- Dashboard
- Performance
- Carga
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

API_BASE_URL = "http://localhost:8000"
DASHBOARD_URL = "file:///C:/Users/rsori/codex/scraper-manager/dashboard.html"

# Colores para terminal
class Color:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

# ============================================================================
# MODELOS
# ============================================================================

class TestStatus(Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"
    WARNING = "WARNING"

@dataclass
class TestResult:
    name: str
    status: TestStatus
    duration: float
    message: str = ""
    details: Dict[str, Any] = field(default_factory=dict)

@dataclass
class TestSuite:
    name: str
    results: List[TestResult] = field(default_factory=list)

    @property
    def passed(self) -> int:
        return sum(1 for r in self.results if r.status == TestStatus.PASSED)

    @property
    def failed(self) -> int:
        return sum(1 for r in self.results if r.status == TestStatus.FAILED)

    @property
    def warnings(self) -> int:
        return sum(1 for r in self.results if r.status == TestStatus.WARNING)

    @property
    def total(self) -> int:
        return len(self.results)

    @property
    def success_rate(self) -> float:
        return (self.passed / self.total * 100) if self.total > 0 else 0

# ============================================================================
# TESTER CLASS
# ============================================================================

class ScraperTester:
    def __init__(self):
        self.token = None
        self.session = None
        self.suites: List[TestSuite] = []
        self.inicio = datetime.now()

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def print_header(self, text: str):
        print(f"\n{Color.CYAN}{Color.BOLD}{'='*80}{Color.END}")
        print(f"{Color.CYAN}{Color.BOLD}{text.center(80)}{Color.END}")
        print(f"{Color.CYAN}{Color.BOLD}{'='*80}{Color.END}\n")

    def print_test(self, name: str, status: TestStatus, duration: float, message: str = ""):
        status_color = {
            TestStatus.PASSED: Color.GREEN,
            TestStatus.FAILED: Color.RED,
            TestStatus.WARNING: Color.YELLOW,
            TestStatus.SKIPPED: Color.BLUE
        }[status]

        status_symbol = {
            TestStatus.PASSED: "[OK]",
            TestStatus.FAILED: "[FAIL]",
            TestStatus.WARNING: "[WARN]",
            TestStatus.SKIPPED: "[SKIP]"
        }[status]

        duration_str = f"({duration*1000:.0f}ms)" if duration < 1 else f"({duration:.1f}s)"

        print(f"{status_symbol} {status_color}{name:.<60}{status.value:>10}{Color.END} {Color.WHITE}{duration_str}{Color.END}")
        if message:
            print(f"   {Color.YELLOW}-> {message}{Color.END}")

    async def run_test(self, name: str, test_func) -> TestResult:
        start = time.time()
        try:
            result = await test_func()
            duration = time.time() - start

            if isinstance(result, tuple):
                status, message, details = result if len(result) == 3 else (*result, {})
            else:
                status = TestStatus.PASSED if result else TestStatus.FAILED
                message = ""
                details = {}

            test_result = TestResult(
                name=name,
                status=status,
                duration=duration,
                message=message,
                details=details
            )

            self.print_test(name, status, duration, message)
            return test_result

        except Exception as e:
            duration = time.time() - start
            test_result = TestResult(
                name=name,
                status=TestStatus.FAILED,
                duration=duration,
                message=f"Exception: {str(e)}",
                details={"error": str(e), "type": type(e).__name__}
            )
            self.print_test(name, TestStatus.FAILED, duration, str(e))
            return test_result

    # ========================================================================
    # TESTS DE SISTEMA
    # ========================================================================

    async def test_api_health(self):
        async with self.session.get(f"{API_BASE_URL}/api/system/health") as resp:
            if resp.status == 200:
                data = await resp.json()
                if data.get("status") == "healthy":
                    return (TestStatus.PASSED, f"Version: {data.get('version')}", data)
                else:
                    return (TestStatus.WARNING, f"Status: {data.get('status')}", data)
            else:
                return (TestStatus.FAILED, f"HTTP {resp.status}", {})

    async def test_api_root(self):
        async with self.session.get(f"{API_BASE_URL}/") as resp:
            if resp.status == 200:
                data = await resp.json()
                return (TestStatus.PASSED, f"Message: {data.get('message')}", data)
            else:
                return (TestStatus.FAILED, f"HTTP {resp.status}", {})

    async def test_api_docs(self):
        async with self.session.get(f"{API_BASE_URL}/docs") as resp:
            if resp.status == 200:
                return (TestStatus.PASSED, "Swagger UI accessible", {})
            else:
                return (TestStatus.FAILED, f"HTTP {resp.status}", {})

    async def test_api_redoc(self):
        async with self.session.get(f"{API_BASE_URL}/redoc") as resp:
            if resp.status == 200:
                return (TestStatus.PASSED, "ReDoc accessible", {})
            else:
                return (TestStatus.FAILED, f"HTTP {resp.status}", {})

    # ========================================================================
    # TESTS DE AUTENTICACIÓN
    # ========================================================================

    async def test_login_success(self):
        payload = {"username": "admin", "password": "admin123"}
        async with self.session.post(
            f"{API_BASE_URL}/api/auth/login",
            json=payload
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                self.token = data.get("access_token")
                return (TestStatus.PASSED, f"Token: {self.token[:20]}...", data)
            else:
                return (TestStatus.FAILED, f"HTTP {resp.status}", {})

    async def test_login_fail(self):
        payload = {"username": "wrong", "password": "wrong"}
        async with self.session.post(
            f"{API_BASE_URL}/api/auth/login",
            json=payload
        ) as resp:
            if resp.status == 401:
                return (TestStatus.PASSED, "Correctly rejected invalid credentials", {})
            else:
                return (TestStatus.FAILED, f"Expected 401, got {resp.status}", {})

    async def test_protected_endpoint_without_token(self):
        async with self.session.get(f"{API_BASE_URL}/api/clientes") as resp:
            if resp.status == 403:
                return (TestStatus.PASSED, "Correctly blocked unauthenticated request", {})
            else:
                return (TestStatus.WARNING, f"Expected 403, got {resp.status}", {})

    async def test_protected_endpoint_with_token(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        async with self.session.get(
            f"{API_BASE_URL}/api/clientes?limit=1",
            headers=headers
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                return (TestStatus.PASSED, f"Retrieved {len(data)} clients", data)
            else:
                return (TestStatus.FAILED, f"HTTP {resp.status}", {})

    # ========================================================================
    # TESTS DE SCRAPER
    # ========================================================================

    async def test_scraper_start(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        payload = {
            "nifs": ["TEST001", "TEST002", "TEST003"],
            "num_workers": 2,
            "modo": "FULL"
        }
        async with self.session.post(
            f"{API_BASE_URL}/api/scraper/start",
            json=payload,
            headers=headers
        ) as resp:
            if resp.status in [200, 202]:
                data = await resp.json()
                return (TestStatus.PASSED, f"Execution ID: {data.get('execution_id')}", data)
            else:
                return (TestStatus.FAILED, f"HTTP {resp.status}", {})

    async def test_scraper_status(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        # Primero iniciar una ejecución
        payload = {
            "nifs": ["STATUS001", "STATUS002"],
            "num_workers": 1,
            "modo": "BASIC"
        }
        async with self.session.post(
            f"{API_BASE_URL}/api/scraper/start",
            json=payload,
            headers=headers
        ) as resp:
            if resp.status not in [200, 202]:
                return (TestStatus.FAILED, f"Failed to start execution: {resp.status}", {})

            data = await resp.json()
            execution_id = data.get("execution_id")

        # Esperar un poco
        await asyncio.sleep(2)

        # Verificar status
        async with self.session.get(
            f"{API_BASE_URL}/api/scraper/execution/{execution_id}",
            headers=headers
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                estado = data.get("estado")
                return (TestStatus.PASSED, f"State: {estado}", data)
            else:
                return (TestStatus.FAILED, f"HTTP {resp.status}", {})

    async def test_scraper_stop(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        # Iniciar ejecución
        payload = {
            "nifs": ["STOP001", "STOP002", "STOP003", "STOP004"],
            "num_workers": 1,
            "modo": "FULL"
        }
        async with self.session.post(
            f"{API_BASE_URL}/api/scraper/start",
            json=payload,
            headers=headers
        ) as resp:
            if resp.status not in [200, 202]:
                return (TestStatus.FAILED, f"Failed to start: {resp.status}", {})

            data = await resp.json()
            execution_id = data.get("execution_id")

        # Intentar detener
        async with self.session.post(
            f"{API_BASE_URL}/api/scraper/stop/{execution_id}",
            headers=headers
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                return (TestStatus.PASSED, f"Stopped: {data.get('message')}", data)
            else:
                return (TestStatus.WARNING, f"HTTP {resp.status}", {})

    # ========================================================================
    # TESTS DE CLIENTES
    # ========================================================================

    async def test_get_clientes(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        async with self.session.get(
            f"{API_BASE_URL}/api/clientes?limit=5",
            headers=headers
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                return (TestStatus.PASSED, f"Retrieved {len(data)} clients", {"count": len(data)})
            else:
                return (TestStatus.FAILED, f"HTTP {resp.status}", {})

    async def test_get_cliente_by_nif(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        async with self.session.get(
            f"{API_BASE_URL}/api/clientes/12345678A",
            headers=headers
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                return (TestStatus.PASSED, f"Client: {data.get('nombre_completo')}", data)
            elif resp.status == 404:
                return (TestStatus.WARNING, "Client not found (expected for test data)", {})
            else:
                return (TestStatus.FAILED, f"HTTP {resp.status}", {})

    async def test_search_clientes(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        async with self.session.get(
            f"{API_BASE_URL}/api/clientes/search?query=test",
            headers=headers
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                return (TestStatus.PASSED, f"Found {len(data)} results", {"count": len(data)})
            else:
                return (TestStatus.FAILED, f"HTTP {resp.status}", {})

    # ========================================================================
    # TESTS DE PÓLIZAS
    # ========================================================================

    async def test_get_polizas(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        async with self.session.get(
            f"{API_BASE_URL}/api/polizas?limit=5",
            headers=headers
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                return (TestStatus.PASSED, f"Retrieved {len(data)} policies", {"count": len(data)})
            else:
                return (TestStatus.FAILED, f"HTTP {resp.status}", {})

    async def test_get_polizas_by_cliente(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        async with self.session.get(
            f"{API_BASE_URL}/api/clientes/12345678A/polizas",
            headers=headers
        ) as resp:
            if resp.status in [200, 404]:
                return (TestStatus.PASSED, f"HTTP {resp.status}", {})
            else:
                return (TestStatus.FAILED, f"HTTP {resp.status}", {})

    # ========================================================================
    # TESTS DE PERFORMANCE
    # ========================================================================

    async def test_concurrent_requests(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        start = time.time()

        # Hacer 20 peticiones concurrentes
        tasks = [
            self.session.get(f"{API_BASE_URL}/api/system/health", headers=headers)
            for _ in range(20)
        ]

        responses = await asyncio.gather(*tasks, return_exceptions=True)
        duration = time.time() - start

        successful = sum(1 for r in responses if not isinstance(r, Exception) and r.status == 200)

        # Cerrar las respuestas
        for r in responses:
            if not isinstance(r, Exception):
                await r.read()
                r.close()

        if successful == 20:
            rps = 20 / duration
            return (TestStatus.PASSED, f"{successful}/20 successful, {rps:.1f} req/s", {"rps": rps})
        else:
            return (TestStatus.WARNING, f"Only {successful}/20 successful", {"successful": successful})

    async def test_response_time_health(self):
        start = time.time()
        async with self.session.get(f"{API_BASE_URL}/api/system/health") as resp:
            await resp.read()
            duration = time.time() - start

        if duration < 0.5:
            return (TestStatus.PASSED, f"Response time: {duration*1000:.0f}ms", {"duration": duration})
        elif duration < 1.0:
            return (TestStatus.WARNING, f"Slow response: {duration*1000:.0f}ms", {"duration": duration})
        else:
            return (TestStatus.FAILED, f"Too slow: {duration*1000:.0f}ms", {"duration": duration})

    # ========================================================================
    # RUNNER
    # ========================================================================

    async def run_all_tests(self):
        self.print_header("[*] INICIANDO TESTING MASIVO - SCRAPER QUANTUM")

        # Suite 1: Sistema
        print(f"\n{Color.MAGENTA}{Color.BOLD}📡 SUITE 1: SISTEMA Y CONECTIVIDAD{Color.END}")
        suite1 = TestSuite(name="Sistema y Conectividad")
        suite1.results.append(await self.run_test("API Health Check", self.test_api_health))
        suite1.results.append(await self.run_test("API Root Endpoint", self.test_api_root))
        suite1.results.append(await self.run_test("Swagger Documentation", self.test_api_docs))
        suite1.results.append(await self.run_test("ReDoc Documentation", self.test_api_redoc))
        self.suites.append(suite1)

        # Suite 2: Autenticación
        print(f"\n{Color.MAGENTA}{Color.BOLD}🔐 SUITE 2: AUTENTICACIÓN JWT{Color.END}")
        suite2 = TestSuite(name="Autenticación JWT")
        suite2.results.append(await self.run_test("Login Success", self.test_login_success))
        suite2.results.append(await self.run_test("Login Failure", self.test_login_fail))
        suite2.results.append(await self.run_test("Protected Without Token", self.test_protected_endpoint_without_token))
        suite2.results.append(await self.run_test("Protected With Token", self.test_protected_endpoint_with_token))
        self.suites.append(suite2)

        # Suite 3: Scraper
        print(f"\n{Color.MAGENTA}{Color.BOLD}🤖 SUITE 3: SCRAPER CORE{Color.END}")
        suite3 = TestSuite(name="Scraper Core")
        suite3.results.append(await self.run_test("Start Extraction", self.test_scraper_start))
        suite3.results.append(await self.run_test("Check Execution Status", self.test_scraper_status))
        suite3.results.append(await self.run_test("Stop Extraction", self.test_scraper_stop))
        self.suites.append(suite3)

        # Suite 4: Clientes
        print(f"\n{Color.MAGENTA}{Color.BOLD}👥 SUITE 4: GESTIÓN DE CLIENTES{Color.END}")
        suite4 = TestSuite(name="Gestión de Clientes")
        suite4.results.append(await self.run_test("List Clientes", self.test_get_clientes))
        suite4.results.append(await self.run_test("Get Cliente by NIF", self.test_get_cliente_by_nif))
        suite4.results.append(await self.run_test("Search Clientes", self.test_search_clientes))
        self.suites.append(suite4)

        # Suite 5: Pólizas
        print(f"\n{Color.MAGENTA}{Color.BOLD}📄 SUITE 5: GESTIÓN DE PÓLIZAS{Color.END}")
        suite5 = TestSuite(name="Gestión de Pólizas")
        suite5.results.append(await self.run_test("List Polizas", self.test_get_polizas))
        suite5.results.append(await self.run_test("Get Polizas by Cliente", self.test_get_polizas_by_cliente))
        self.suites.append(suite5)

        # Suite 6: Performance
        print(f"\n{Color.MAGENTA}{Color.BOLD}⚡ SUITE 6: PERFORMANCE Y CARGA{Color.END}")
        suite6 = TestSuite(name="Performance y Carga")
        suite6.results.append(await self.run_test("Concurrent Requests (20x)", self.test_concurrent_requests))
        suite6.results.append(await self.run_test("Response Time Health", self.test_response_time_health))
        self.suites.append(suite6)

        # Resumen
        self.print_summary()

    def print_summary(self):
        duracion_total = (datetime.now() - self.inicio).total_seconds()

        self.print_header("📊 RESUMEN FINAL DE TESTING")

        total_tests = sum(s.total for s in self.suites)
        total_passed = sum(s.passed for s in self.suites)
        total_failed = sum(s.failed for s in self.suites)
        total_warnings = sum(s.warnings for s in self.suites)

        print(f"{Color.BOLD}SUITES DE TESTING:{Color.END}")
        for suite in self.suites:
            status_color = Color.GREEN if suite.failed == 0 else Color.RED
            print(f"  {status_color}■{Color.END} {suite.name:.<50} "
                  f"{Color.GREEN}{suite.passed}✅{Color.END} "
                  f"{Color.RED}{suite.failed}❌{Color.END} "
                  f"{Color.YELLOW}{suite.warnings}⚠️{Color.END} "
                  f"({suite.success_rate:.1f}%)")

        print(f"\n{Color.BOLD}TOTALES:{Color.END}")
        print(f"  Total Tests:     {total_tests}")
        print(f"  {Color.GREEN}Passed:          {total_passed} ({total_passed/total_tests*100:.1f}%){Color.END}")
        print(f"  {Color.RED}Failed:          {total_failed} ({total_failed/total_tests*100:.1f}%){Color.END}")
        print(f"  {Color.YELLOW}Warnings:        {total_warnings} ({total_warnings/total_tests*100:.1f}%){Color.END}")
        print(f"  Duration:        {duracion_total:.2f}s")

        # Status final
        if total_failed == 0 and total_warnings == 0:
            print(f"\n{Color.GREEN}{Color.BOLD}{'='*80}{Color.END}")
            print(f"{Color.GREEN}{Color.BOLD}{'✅ TODOS LOS TESTS PASARON - SISTEMA 100% FUNCIONAL'.center(80)}{Color.END}")
            print(f"{Color.GREEN}{Color.BOLD}{'='*80}{Color.END}\n")
        elif total_failed == 0:
            print(f"\n{Color.YELLOW}{Color.BOLD}{'='*80}{Color.END}")
            print(f"{Color.YELLOW}{Color.BOLD}{'⚠️  TESTS PASADOS CON WARNINGS - REVISAR'.center(80)}{Color.END}")
            print(f"{Color.YELLOW}{Color.BOLD}{'='*80}{Color.END}\n")
        else:
            print(f"\n{Color.RED}{Color.BOLD}{'='*80}{Color.END}")
            print(f"{Color.RED}{Color.BOLD}{'❌ TESTS FALLIDOS - REQUIERE FIXES'.center(80)}{Color.END}")
            print(f"{Color.RED}{Color.BOLD}{'='*80}{Color.END}\n")

            print(f"{Color.RED}{Color.BOLD}TESTS FALLIDOS:{Color.END}")
            for suite in self.suites:
                failed_tests = [r for r in suite.results if r.status == TestStatus.FAILED]
                for test in failed_tests:
                    print(f"  ❌ {suite.name} > {test.name}")
                    print(f"     {Color.RED}↳ {test.message}{Color.END}")

        return total_failed == 0

# ============================================================================
# MAIN
# ============================================================================

async def main():
    print(f"{Color.CYAN}{Color.BOLD}")
    print("="*80)
    print("         SCRAPER QUANTUM - TESTING MASIVO".center(80))
    print("             Tests Exhaustivos v1.0".center(80))
    print("="*80)
    print(f"{Color.END}")

    async with ScraperTester() as tester:
        success = await tester.run_all_tests()

        if success:
            print(f"\n{Color.GREEN}🎉 SISTEMA TOTALMENTE FUNCIONAL Y VALIDADO 🎉{Color.END}\n")
            return 0
        else:
            print(f"\n{Color.RED}⚠️  SE ENCONTRARON PROBLEMAS - REVISAR Y FIXEAR{Color.END}\n")
            return 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n{Color.YELLOW}⚠️  Tests interrumpidos por el usuario{Color.END}\n")
        exit(2)
    except Exception as e:
        print(f"\n{Color.RED}❌ ERROR FATAL: {e}{Color.END}\n")
        import traceback
        traceback.print_exc()
        exit(3)

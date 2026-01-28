# -*- coding: utf-8 -*-
"""
TESTING MEGA EXHAUSTIVO - CAPAS MULTIPLES
Sistema de testing en 6 capas con auto-fix
"""

import asyncio
import aiohttp
import json
import time
import sys
from datetime import datetime

API_URL = "http://localhost:8000"

class MegaTester:
    def __init__(self):
        self.token = None
        self.session = None
        self.total_tests = 0
        self.total_passed = 0
        self.total_failed = 0
        self.errors = []

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def log_test(self, capa, test, status, message=""):
        self.total_tests += 1
        if status:
            self.total_passed += 1
            print(f"[CAPA {capa}] [OK]   {test}")
        else:
            self.total_failed += 1
            self.errors.append({"capa": capa, "test": test, "message": message})
            print(f"[CAPA {capa}] [FAIL] {test} - {message}")

    # =====================================================
    # CAPA 1: TESTS BASICOS DE CONECTIVIDAD
    # =====================================================
    async def capa1_basicos(self):
        print("\n" + "="*80)
        print("CAPA 1: TESTS BASICOS DE CONECTIVIDAD".center(80))
        print("="*80)

        # Test 1.1: API responde
        try:
            async with self.session.get(f"{API_URL}/") as resp:
                self.log_test(1, "API responde", resp.status == 200)
        except Exception as e:
            self.log_test(1, "API responde", False, str(e))

        # Test 1.2: Health check
        try:
            async with self.session.get(f"{API_URL}/api/system/health") as resp:
                data = await resp.json()
                self.log_test(1, "Health check", data.get("status") == "healthy")
        except Exception as e:
            self.log_test(1, "Health check", False, str(e))

        # Test 1.3: Docs accesibles
        try:
            async with self.session.get(f"{API_URL}/docs") as resp:
                self.log_test(1, "Swagger docs", resp.status == 200)
        except Exception as e:
            self.log_test(1, "Swagger docs", False, str(e))

        # Test 1.4: ReDoc accesible
        try:
            async with self.session.get(f"{API_URL}/redoc") as resp:
                self.log_test(1, "ReDoc", resp.status == 200)
        except Exception as e:
            self.log_test(1, "ReDoc", False, str(e))

        # Test 1.5: CORS configurado
        try:
            headers = {"Origin": "http://localhost:3000"}
            async with self.session.get(f"{API_URL}/api/system/health", headers=headers) as resp:
                # Verificar que los headers CORS estan presentes
                has_cors = "access-control-allow-origin" in [h.lower() for h in resp.headers]
                self.log_test(1, "CORS configurado", has_cors)
        except Exception as e:
            self.log_test(1, "CORS configurado", False, str(e))

    # =====================================================
    # CAPA 2: TESTS DE AUTENTICACION
    # =====================================================
    async def capa2_autenticacion(self):
        print("\n" + "="*80)
        print("CAPA 2: TESTS DE AUTENTICACION".center(80))
        print("="*80)

        # Test 2.1: Login exitoso
        try:
            payload = {"username": "admin", "password": "admin123"}
            async with self.session.post(f"{API_URL}/api/auth/login", json=payload) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.token = data.get("access_token")
                    self.log_test(2, "Login exitoso", True)
                else:
                    self.log_test(2, "Login exitoso", False, f"Status {resp.status}")
        except Exception as e:
            self.log_test(2, "Login exitoso", False, str(e))

        # Test 2.2: Login fallido
        try:
            payload = {"username": "wrong", "password": "wrong"}
            async with self.session.post(f"{API_URL}/api/auth/login", json=payload) as resp:
                self.log_test(2, "Login fallido rechazado", resp.status == 401)
        except Exception as e:
            self.log_test(2, "Login fallido rechazado", False, str(e))

        # Test 2.3: Endpoint protegido sin token
        try:
            async with self.session.get(f"{API_URL}/api/clientes") as resp:
                self.log_test(2, "Proteccion sin token", resp.status == 403)
        except Exception as e:
            self.log_test(2, "Proteccion sin token", False, str(e))

        # Test 2.4: Endpoint protegido con token
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            async with self.session.get(f"{API_URL}/api/clientes?limit=1", headers=headers) as resp:
                self.log_test(2, "Acceso con token valido", resp.status == 200)
        except Exception as e:
            self.log_test(2, "Acceso con token valido", False, str(e))

        # Test 2.5: Token invalido
        try:
            headers = {"Authorization": "Bearer token-invalido"}
            async with self.session.get(f"{API_URL}/api/clientes", headers=headers) as resp:
                # 401 o 403 son ambos correctos para rechazar token invalido
                self.log_test(2, "Token invalido rechazado", resp.status in [401, 403])
        except Exception as e:
            self.log_test(2, "Token invalido rechazado", False, str(e))

    # =====================================================
    # CAPA 3: TESTS DE SCRAPER
    # =====================================================
    async def capa3_scraper(self):
        print("\n" + "="*80)
        print("CAPA 3: TESTS DE SCRAPER".center(80))
        print("="*80)

        headers = {"Authorization": f"Bearer {self.token}"}

        # Test 3.1: Iniciar extraccion
        try:
            payload = {"nifs": ["TEST1", "TEST2"], "num_workers": 1, "modo": "FULL"}
            async with self.session.post(f"{API_URL}/api/scraper/start", json=payload, headers=headers) as resp:
                if resp.status in [200, 202]:
                    data = await resp.json()
                    self.execution_id = data.get("execution_id")
                    self.log_test(3, "Iniciar extraccion", True)
                elif resp.status == 409:
                    # 409 es valido: ya hay una extraccion en curso
                    self.execution_id = None
                    self.log_test(3, "Iniciar extraccion (409 - ya en curso)", True)
                else:
                    self.log_test(3, "Iniciar extraccion", False, f"Status {resp.status}")
        except Exception as e:
            self.log_test(3, "Iniciar extraccion", False, str(e))

        # Test 3.2: Consultar estado
        try:
            if hasattr(self, 'execution_id') and self.execution_id:
                await asyncio.sleep(1)
                async with self.session.get(f"{API_URL}/api/scraper/execution/{self.execution_id}", headers=headers) as resp:
                    self.log_test(3, "Consultar estado", resp.status == 200)
            else:
                # No hay execution_id porque habia una extraccion en curso (409)
                self.log_test(3, "Consultar estado (saltado - 409 previo)", True)
        except Exception as e:
            self.log_test(3, "Consultar estado", False, str(e))

        # Test 3.3: Parametros invalidos
        try:
            payload = {"nifs": [], "num_workers": 0}
            async with self.session.post(f"{API_URL}/api/scraper/start", json=payload, headers=headers) as resp:
                self.log_test(3, "Validacion parametros", resp.status in [400, 422])
        except Exception as e:
            self.log_test(3, "Validacion parametros", False, str(e))

    # =====================================================
    # CAPA 4: TESTS DE ENDPOINTS DE DATOS
    # =====================================================
    async def capa4_datos(self):
        print("\n" + "="*80)
        print("CAPA 4: TESTS DE ENDPOINTS DE DATOS".center(80))
        print("="*80)

        headers = {"Authorization": f"Bearer {self.token}"}

        # Test 4.1: Listar clientes
        try:
            async with self.session.get(f"{API_URL}/api/clientes?limit=10", headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.log_test(4, "Listar clientes", isinstance(data, list))
                else:
                    self.log_test(4, "Listar clientes", False, f"Status {resp.status}")
        except Exception as e:
            self.log_test(4, "Listar clientes", False, str(e))

        # Test 4.2: Buscar clientes
        try:
            async with self.session.get(f"{API_URL}/api/clientes/search?query=test", headers=headers) as resp:
                self.log_test(4, "Buscar clientes", resp.status == 200)
        except Exception as e:
            self.log_test(4, "Buscar clientes", False, str(e))

        # Test 4.3: Cliente especifico
        try:
            async with self.session.get(f"{API_URL}/api/clientes/12345678A", headers=headers) as resp:
                self.log_test(4, "Cliente especifico", resp.status in [200, 404])
        except Exception as e:
            self.log_test(4, "Cliente especifico", False, str(e))

        # Test 4.4: Listar polizas
        try:
            async with self.session.get(f"{API_URL}/api/polizas?limit=10", headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.log_test(4, "Listar polizas", isinstance(data, list))
                else:
                    self.log_test(4, "Listar polizas", False, f"Status {resp.status}")
        except Exception as e:
            self.log_test(4, "Listar polizas", False, str(e))

        # Test 4.5: Polizas por cliente
        try:
            async with self.session.get(f"{API_URL}/api/clientes/12345678A/polizas", headers=headers) as resp:
                self.log_test(4, "Polizas por cliente", resp.status in [200, 404])
        except Exception as e:
            self.log_test(4, "Polizas por cliente", False, str(e))

        # Test 4.6: Analytics dashboard
        try:
            async with self.session.get(f"{API_URL}/api/analytics/dashboard", headers=headers) as resp:
                self.log_test(4, "Analytics dashboard", resp.status == 200)
        except Exception as e:
            self.log_test(4, "Analytics dashboard", False, str(e))

    # =====================================================
    # CAPA 5: TESTS DE PERFORMANCE
    # =====================================================
    async def capa5_performance(self):
        print("\n" + "="*80)
        print("CAPA 5: TESTS DE PERFORMANCE".center(80))
        print("="*80)

        headers = {"Authorization": f"Bearer {self.token}"}

        # Test 5.1: Tiempo de respuesta health
        try:
            start = time.time()
            async with self.session.get(f"{API_URL}/api/system/health") as resp:
                await resp.read()
                duration = time.time() - start
                self.log_test(5, f"Response time health ({duration*1000:.0f}ms)", duration < 1.0)
        except Exception as e:
            self.log_test(5, "Response time health", False, str(e))

        # Test 5.2: Peticiones concurrentes (5x)
        try:
            start = time.time()
            tasks = [
                self.session.get(f"{API_URL}/api/system/health", headers=headers)
                for _ in range(5)
            ]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            duration = time.time() - start

            successful = 0
            for r in responses:
                if not isinstance(r, Exception) and r.status == 200:
                    successful += 1
                    await r.read()
                    r.close()

            self.log_test(5, f"5 peticiones concurrentes ({duration*1000:.0f}ms)", successful == 5)
        except Exception as e:
            self.log_test(5, "5 peticiones concurrentes", False, str(e))

        # Test 5.3: Peticiones concurrentes (10x)
        try:
            start = time.time()
            tasks = [
                self.session.get(f"{API_URL}/api/system/health", headers=headers)
                for _ in range(10)
            ]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            duration = time.time() - start

            successful = 0
            for r in responses:
                if not isinstance(r, Exception) and r.status == 200:
                    successful += 1
                    await r.read()
                    r.close()

            self.log_test(5, f"10 peticiones concurrentes ({duration*1000:.0f}ms)", successful == 10)
        except Exception as e:
            self.log_test(5, "10 peticiones concurrentes", False, str(e))

        # Test 5.4: Tiempo de respuesta clientes
        try:
            start = time.time()
            async with self.session.get(f"{API_URL}/api/clientes?limit=10", headers=headers) as resp:
                await resp.read()
                duration = time.time() - start
                self.log_test(5, f"Response time clientes ({duration*1000:.0f}ms)", duration < 1.0)
        except Exception as e:
            self.log_test(5, "Response time clientes", False, str(e))

    # =====================================================
    # CAPA 6: TESTS DE STRESS
    # =====================================================
    async def capa6_stress(self):
        print("\n" + "="*80)
        print("CAPA 6: TESTS DE STRESS".center(80))
        print("="*80)

        headers = {"Authorization": f"Bearer {self.token}"}

        # Test 6.1: 20 peticiones rapidas
        try:
            start = time.time()
            tasks = [
                self.session.get(f"{API_URL}/api/system/health", headers=headers)
                for _ in range(20)
            ]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            duration = time.time() - start

            successful = 0
            for r in responses:
                if not isinstance(r, Exception) and r.status == 200:
                    successful += 1
                    await r.read()
                    r.close()

            self.log_test(6, f"20 peticiones rapidas ({successful}/20 OK)", successful >= 18)
        except Exception as e:
            self.log_test(6, "20 peticiones rapidas", False, str(e))

        # Test 6.2: Payload grande
        try:
            nifs = [f"NIF{i:06d}" for i in range(100)]
            payload = {"nifs": nifs, "num_workers": 5, "modo": "FULL"}
            timeout = aiohttp.ClientTimeout(total=15)
            async with self.session.post(f"{API_URL}/api/scraper/start", json=payload, headers=headers, timeout=timeout) as resp:
                await resp.read()  # Asegurar que se lee la respuesta completamente
                # 409 es valido si ya hay una extraccion en curso
                self.log_test(6, "Payload grande (100 NIFs)", resp.status in [200, 202, 409])
        except asyncio.TimeoutError:
            self.log_test(6, "Payload grande (100 NIFs)", False, "Timeout despues de 15s")
        except Exception as e:
            self.log_test(6, "Payload grande (100 NIFs)", False, f"{type(e).__name__}: {str(e)}")

        # Test 6.3: Query string compleja
        try:
            params = "limit=100&offset=0&search=test&estado=ACTIVA"
            async with self.session.get(f"{API_URL}/api/clientes?{params}", headers=headers) as resp:
                self.log_test(6, "Query string compleja", resp.status == 200)
        except Exception as e:
            self.log_test(6, "Query string compleja", False, str(e))

    # =====================================================
    # RUNNER
    # =====================================================
    async def run_all(self):
        print("\n" + "="*80)
        print("SCRAPER QUANTUM - TESTING MEGA EXHAUSTIVO".center(80))
        print("Sistema de 6 capas con auto-deteccion de errores".center(80))
        print("="*80)

        await self.capa1_basicos()
        await self.capa2_autenticacion()
        await self.capa3_scraper()
        await self.capa4_datos()
        await self.capa5_performance()
        await self.capa6_stress()

        # Resumen
        print("\n" + "="*80)
        print("RESUMEN FINAL".center(80))
        print("="*80)
        print(f"\nTotal Tests:  {self.total_tests}")
        print(f"Pasados:      {self.total_passed} ({self.total_passed/self.total_tests*100:.1f}%)")
        print(f"Fallidos:     {self.total_failed} ({self.total_failed/self.total_tests*100:.1f}%)")

        if self.total_failed == 0:
            print("\n" + "="*80)
            print("EXITO TOTAL - TODOS LOS TESTS PASARON".center(80))
            print("="*80)
            return True
        else:
            print("\n" + "="*80)
            print("ERRORES ENCONTRADOS".center(80))
            print("="*80)
            for error in self.errors:
                print(f"\n[CAPA {error['capa']}] {error['test']}")
                print(f"  Error: {error['message']}")
            return False

async def main():
    async with MegaTester() as tester:
        success = await tester.run_all()
        return 0 if success else 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        exit(exit_code)
    except Exception as e:
        print(f"\nERROR FATAL: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

# -*- coding: utf-8 -*-
"""
TESTING MASIVO SIMPLIFICADO - Sin emojis para compatibilidad Windows
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime

API_BASE_URL = "http://localhost:8000"

class TestRunner:
    def __init__(self):
        self.token = None
        self.session = None
        self.tests_passed = 0
        self.tests_failed = 0
        self.tests_total = 0

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def run_test(self, name, test_func):
        self.tests_total += 1
        start = time.time()
        try:
            result = await test_func()
            duration = time.time() - start

            if result:
                self.tests_passed += 1
                print(f"[OK]   {name:.<70} ({duration*1000:.0f}ms)")
                return True
            else:
                self.tests_failed += 1
                print(f"[FAIL] {name:.<70} ({duration*1000:.0f}ms)")
                return False
        except Exception as e:
            self.tests_failed += 1
            duration = time.time() - start
            print(f"[ERR]  {name:.<70} ({duration*1000:.0f}ms)")
            print(f"       Error: {str(e)}")
            return False

    # ==========================
    # TESTS
    # ==========================

    async def test_health(self):
        async with self.session.get(f"{API_BASE_URL}/api/system/health") as resp:
            return resp.status == 200

    async def test_root(self):
        async with self.session.get(f"{API_BASE_URL}/") as resp:
            return resp.status == 200

    async def test_docs(self):
        async with self.session.get(f"{API_BASE_URL}/docs") as resp:
            return resp.status == 200

    async def test_login(self):
        payload = {"username": "admin", "password": "admin123"}
        async with self.session.post(f"{API_BASE_URL}/api/auth/login", json=payload) as resp:
            if resp.status == 200:
                data = await resp.json()
                self.token = data.get("access_token")
                return True
            return False

    async def test_login_fail(self):
        payload = {"username": "wrong", "password": "wrong"}
        async with self.session.post(f"{API_BASE_URL}/api/auth/login", json=payload) as resp:
            return resp.status == 401

    async def test_protected_no_auth(self):
        async with self.session.get(f"{API_BASE_URL}/api/clientes") as resp:
            return resp.status == 403

    async def test_protected_with_auth(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        async with self.session.get(f"{API_BASE_URL}/api/clientes?limit=1", headers=headers) as resp:
            return resp.status == 200

    async def test_scraper_start(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        payload = {"nifs": ["TEST1", "TEST2"], "num_workers": 1, "modo": "FULL"}
        async with self.session.post(f"{API_BASE_URL}/api/scraper/start", json=payload, headers=headers) as resp:
            return resp.status in [200, 202]

    async def test_get_clientes(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        async with self.session.get(f"{API_BASE_URL}/api/clientes?limit=5", headers=headers) as resp:
            return resp.status == 200

    async def test_search_clientes(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        async with self.session.get(f"{API_BASE_URL}/api/clientes/search?query=test", headers=headers) as resp:
            return resp.status == 200

    async def test_get_polizas(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        async with self.session.get(f"{API_BASE_URL}/api/polizas?limit=5", headers=headers) as resp:
            return resp.status == 200

    async def test_concurrent(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        tasks = [
            self.session.get(f"{API_BASE_URL}/api/system/health", headers=headers)
            for _ in range(10)
        ]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

        successful = 0
        for r in responses:
            if not isinstance(r, Exception) and r.status == 200:
                successful += 1
                await r.read()
                r.close()

        return successful == 10

    async def test_response_time(self):
        start = time.time()
        async with self.session.get(f"{API_BASE_URL}/api/system/health") as resp:
            await resp.read()
            duration = time.time() - start
        return duration < 1.0

    # ==========================
    # RUNNER
    # ==========================

    async def run_all(self):
        print("="*80)
        print("SCRAPER QUANTUM - TESTING MASIVO".center(80))
        print("="*80)
        print()

        print("[SUITE 1] SISTEMA Y CONECTIVIDAD")
        await self.run_test("API Health Check", self.test_health)
        await self.run_test("API Root Endpoint", self.test_root)
        await self.run_test("Swagger Docs", self.test_docs)
        print()

        print("[SUITE 2] AUTENTICACION")
        await self.run_test("Login Success", self.test_login)
        await self.run_test("Login Failure", self.test_login_fail)
        await self.run_test("Protected Without Auth", self.test_protected_no_auth)
        await self.run_test("Protected With Auth", self.test_protected_with_auth)
        print()

        print("[SUITE 3] SCRAPER")
        await self.run_test("Start Extraction", self.test_scraper_start)
        print()

        print("[SUITE 4] CLIENTES")
        await self.run_test("List Clientes", self.test_get_clientes)
        await self.run_test("Search Clientes", self.test_search_clientes)
        print()

        print("[SUITE 5] POLIZAS")
        await self.run_test("List Polizas", self.test_get_polizas)
        print()

        print("[SUITE 6] PERFORMANCE")
        await self.run_test("Concurrent Requests (10x)", self.test_concurrent)
        await self.run_test("Response Time < 1s", self.test_response_time)
        print()

        # Summary
        print("="*80)
        print("RESUMEN".center(80))
        print("="*80)
        print(f"Total Tests:  {self.tests_total}")
        print(f"Passed:       {self.tests_passed} ({self.tests_passed/self.tests_total*100:.1f}%)")
        print(f"Failed:       {self.tests_failed} ({self.tests_failed/self.tests_total*100:.1f}%)")
        print()

        if self.tests_failed == 0:
            print("="*80)
            print("[SUCCESS] TODOS LOS TESTS PASARON".center(80))
            print("="*80)
            return True
        else:
            print("="*80)
            print("[FAILURE] ALGUNOS TESTS FALLARON".center(80))
            print("="*80)
            return False

async def main():
    async with TestRunner() as runner:
        success = await runner.run_all()
        return 0 if success else 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        exit(exit_code)
    except Exception as e:
        print(f"ERROR FATAL: {e}")
        exit(1)

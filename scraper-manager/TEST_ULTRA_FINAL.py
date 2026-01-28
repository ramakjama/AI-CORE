# -*- coding: utf-8 -*-
"""
TEST ULTRA FINAL - Ronda mas agresiva
"""

import asyncio
import aiohttp
import time

API_URL = "http://localhost:8000"

async def mega_stress_test():
    """Test ultra-agresivo de stress"""
    print("\n" + "="*80)
    print("TEST ULTRA FINAL - STRESS EXTREMO".center(80))
    print("="*80)

    passed = 0
    failed = 0

    async with aiohttp.ClientSession() as session:
        # Login
        async with session.post(f"{API_URL}/api/auth/login", json={"username": "admin", "password": "admin123"}) as resp:
            data = await resp.json()
            token = data.get("access_token")

        headers = {"Authorization": f"Bearer {token}"}

        # Test 1: 50 peticiones concurrentes health
        print("\n[TEST 1] 50 peticiones concurrentes a /health...")
        try:
            start = time.time()
            tasks = [session.get(f"{API_URL}/api/system/health") for _ in range(50)]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            duration = time.time() - start

            ok = sum(1 for r in responses if not isinstance(r, Exception) and r.status == 200)
            for r in responses:
                if not isinstance(r, Exception):
                    await r.read()
                    r.close()

            if ok >= 48:  # 96% success rate
                print(f"[OK] {ok}/50 exitosos en {duration*1000:.0f}ms")
                passed += 1
            else:
                print(f"[FAIL] Solo {ok}/50 exitosos")
                failed += 1
        except Exception as e:
            print(f"[FAIL] {e}")
            failed += 1

        # Test 2: 100 peticiones rapidas a /clientes
        print("\n[TEST 2] 100 peticiones concurrentes a /clientes...")
        try:
            start = time.time()
            tasks = [session.get(f"{API_URL}/api/clientes?limit=5", headers=headers) for _ in range(100)]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            duration = time.time() - start

            ok = sum(1 for r in responses if not isinstance(r, Exception) and r.status == 200)
            for r in responses:
                if not isinstance(r, Exception):
                    await r.read()
                    r.close()

            if ok >= 95:  # 95% success rate
                print(f"[OK] {ok}/100 exitosos en {duration*1000:.0f}ms")
                passed += 1
            else:
                print(f"[FAIL] Solo {ok}/100 exitosos")
                failed += 1
        except Exception as e:
            print(f"[FAIL] {e}")
            failed += 1

        # Test 3: Payload masivo
        print("\n[TEST 3] Payload masivo (200 NIFs)...")
        try:
            nifs = [f"STRESS{i:06d}" for i in range(200)]
            payload = {"nifs": nifs, "num_workers": 5, "modo": "FULL"}
            timeout = aiohttp.ClientTimeout(total=20)

            async with session.post(f"{API_URL}/api/scraper/start", json=payload, headers=headers, timeout=timeout) as resp:
                await resp.read()
                if resp.status in [200, 202, 409]:
                    print(f"[OK] Status {resp.status}")
                    passed += 1
                else:
                    print(f"[FAIL] Status {resp.status}")
                    failed += 1
        except asyncio.TimeoutError:
            print("[FAIL] Timeout")
            failed += 1
        except Exception as e:
            print(f"[FAIL] {e}")
            failed += 1

        # Test 4: Peticiones simultaneas mixtas
        print("\n[TEST 4] 30 peticiones mixtas simultaneas...")
        try:
            start = time.time()
            tasks = []
            for i in range(30):
                if i % 3 == 0:
                    tasks.append(session.get(f"{API_URL}/api/system/health"))
                elif i % 3 == 1:
                    tasks.append(session.get(f"{API_URL}/api/clientes?limit=1", headers=headers))
                else:
                    tasks.append(session.get(f"{API_URL}/api/polizas?limit=1", headers=headers))

            responses = await asyncio.gather(*tasks, return_exceptions=True)
            duration = time.time() - start

            ok = sum(1 for r in responses if not isinstance(r, Exception) and r.status == 200)
            for r in responses:
                if not isinstance(r, Exception):
                    await r.read()
                    r.close()

            if ok >= 28:  # 93% success rate
                print(f"[OK] {ok}/30 exitosos en {duration*1000:.0f}ms")
                passed += 1
            else:
                print(f"[FAIL] Solo {ok}/30 exitosos")
                failed += 1
        except Exception as e:
            print(f"[FAIL] {e}")
            failed += 1

        # Test 5: Busquedas complejas
        print("\n[TEST 5] 20 busquedas complejas simultaneas...")
        try:
            start = time.time()
            queries = ["test", "cliente", "poliza", "activo", "demo", "admin", "nombre", "nif", "email", "telefono"]
            tasks = [session.get(f"{API_URL}/api/clientes/search?query={q}", headers=headers) for q in queries*2]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            duration = time.time() - start

            ok = sum(1 for r in responses if not isinstance(r, Exception) and r.status == 200)
            for r in responses:
                if not isinstance(r, Exception):
                    await r.read()
                    r.close()

            if ok >= 18:  # 90% success rate
                print(f"[OK] {ok}/20 exitosos en {duration*1000:.0f}ms")
                passed += 1
            else:
                print(f"[FAIL] Solo {ok}/20 exitosos")
                failed += 1
        except Exception as e:
            print(f"[FAIL] {e}")
            failed += 1

    # Resumen
    print("\n" + "="*80)
    print("RESUMEN ULTRA FINAL".center(80))
    print("="*80)
    print(f"\nTotal:    {passed + failed}")
    print(f"Pasados:  {passed} ({passed/(passed+failed)*100:.1f}%)")
    print(f"Fallidos: {failed}")

    if failed == 0:
        print("\n" + "="*80)
        print("SISTEMA ULTRA-VALIDADO - TODO PERFECTO".center(80))
        print("="*80)
        return True
    else:
        print("\n" + "="*80)
        print(f"ALGUNOS TESTS FALLARON ({failed})".center(80))
        print("="*80)
        return False

async def main():
    success = await mega_stress_test()
    return 0 if success else 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        exit(exit_code)
    except Exception as e:
        print(f"\nERROR: {e}")
        exit(1)

"""
Test diagnóstico específico para el test de CORS que falla
"""

import asyncio
import aiohttp

API_URL = "http://localhost:8000"

async def test_cors_headers():
    async with aiohttp.ClientSession() as session:
        headers = {"Origin": "null"}

        print("="*80)
        print("TEST: CORS Headers Diagnostic")
        print("="*80)

        async with session.get(f"{API_URL}/api/system/health", headers=headers) as resp:
            print(f"Status: {resp.status}")
            print(f"\nAll Response Headers:")
            for key, value in resp.headers.items():
                print(f"  {key}: {value}")

            print(f"\nCORS-related headers:")
            allow_methods = resp.headers.get("Access-Control-Allow-Methods", "NOT FOUND")
            allow_origin = resp.headers.get("Access-Control-Allow-Origin", "NOT FOUND")
            allow_headers = resp.headers.get("Access-Control-Allow-Headers", "NOT FOUND")

            print(f"  Access-Control-Allow-Origin: {allow_origin}")
            print(f"  Access-Control-Allow-Methods: {allow_methods}")
            print(f"  Access-Control-Allow-Headers: {allow_headers}")

            print(f"\nChecking for GET and POST:")
            has_get = "GET" in allow_methods if allow_methods != "NOT FOUND" else False
            has_post = "POST" in allow_methods if allow_methods != "NOT FOUND" else False

            print(f"  Has GET: {has_get}")
            print(f"  Has POST: {has_post}")

            if allow_methods == "NOT FOUND":
                print(f"\n[ISSUE] Access-Control-Allow-Methods header is missing!")
                print(f"This might be because it's only sent on OPTIONS requests, not GET")

asyncio.run(test_cors_headers())

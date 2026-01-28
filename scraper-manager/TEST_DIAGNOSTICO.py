# -*- coding: utf-8 -*-
"""
TEST DE DIAGNOSTICO - Para identificar los 3 errores exactos
"""

import asyncio
import aiohttp

API_URL = "http://localhost:8000"

async def test_cors():
    print("\n=== TEST 1: CORS ===")
    async with aiohttp.ClientSession() as session:
        headers = {"Origin": "http://localhost:3000"}
        try:
            async with session.options(f"{API_URL}/api/system/health", headers=headers) as resp:
                print(f"Status: {resp.status}")
                print(f"Headers: {dict(resp.headers)}")
                text = await resp.text()
                print(f"Body: {text[:200]}")
        except Exception as e:
            print(f"Error: {e}")

async def test_token_invalido():
    print("\n=== TEST 2: TOKEN INVALIDO ===")
    async with aiohttp.ClientSession() as session:
        headers = {"Authorization": "Bearer token-invalido-xyz"}
        try:
            async with session.get(f"{API_URL}/api/clientes", headers=headers) as resp:
                print(f"Status: {resp.status}")
                text = await resp.text()
                print(f"Body: {text[:200]}")
        except Exception as e:
            print(f"Error: {e}")

async def test_payload_grande():
    print("\n=== TEST 3: PAYLOAD GRANDE ===")
    async with aiohttp.ClientSession() as session:
        # Login primero
        async with session.post(f"{API_URL}/api/auth/login", json={"username": "admin", "password": "admin123"}) as resp:
            data = await resp.json()
            token = data.get("access_token")

        headers = {"Authorization": f"Bearer {token}"}
        nifs = [f"NIF{i:06d}" for i in range(100)]
        payload = {"nifs": nifs, "num_workers": 5, "modo": "FULL"}

        try:
            async with session.post(f"{API_URL}/api/scraper/start", json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                print(f"Status: {resp.status}")
                text = await resp.text()
                print(f"Body: {text[:500]}")
        except asyncio.TimeoutError:
            print("TIMEOUT - La peticion tardo mas de 10 segundos")
        except Exception as e:
            print(f"Error: {type(e).__name__}: {e}")

async def main():
    await test_cors()
    await test_token_invalido()
    await test_payload_grande()

if __name__ == "__main__":
    asyncio.run(main())

"""
Test diagnóstico para ver los errores exactos de validación
"""

import asyncio
import aiohttp
import json

API_URL = "http://localhost:8000"
TOKEN = "demo-token-admin"

async def test_complete_mode_diagnostic():
    async with aiohttp.ClientSession() as session:
        headers = {
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json"
        }

        payload = {
            "operation_mode": "COMPLETE",
            "num_workers": 3,
            "modo": "FULL",
            "scrapers": ["Core Orchestrator", "Client Extractor"],
            "options": {"headless": True, "screenshots": False, "downloadDocs": False}
        }

        print("="*80)
        print("TEST: COMPLETE MODE")
        print("="*80)
        print(f"Payload: {json.dumps(payload, indent=2)}")
        print()

        async with session.post(
            f"{API_URL}/api/scraper/start",
            json=payload,
            headers=headers
        ) as resp:
            print(f"Status Code: {resp.status}")
            print(f"Headers: {dict(resp.headers)}")
            print()

            text = await resp.text()
            print(f"Response Body:")
            try:
                data = json.loads(text)
                print(json.dumps(data, indent=2))
            except:
                print(text)

asyncio.run(test_complete_mode_diagnostic())

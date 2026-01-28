"""
Test de ejecución REAL del scraper - Diagnóstico completo
"""

import asyncio
import aiohttp
import json

API_URL = "http://localhost:8000"
TOKEN = "demo-token-admin"

async def test_real_execution():
    async with aiohttp.ClientSession() as session:
        headers = {
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json"
        }

        print("="*80)
        print("TEST DE EJECUCION REAL - COMPLETE MODE")
        print("="*80)

        # Payload COMPLETE mode
        payload = {
            "operation_mode": "COMPLETE",
            "num_workers": 5,
            "modo": "FULL",
            "scrapers": ["Core Orchestrator", "Client Extractor", "Policy Extractor"],
            "options": {
                "headless": True,
                "screenshots": False,
                "downloadDocs": True
            }
        }

        print("\n[1] Payload a enviar:")
        print(json.dumps(payload, indent=2))

        print("\n[2] Enviando POST a /api/scraper/start...")
        async with session.post(
            f"{API_URL}/api/scraper/start",
            json=payload,
            headers=headers
        ) as resp:
            print(f"   Status Code: {resp.status}")

            response_text = await resp.text()
            print(f"\n[3] Response Body:")
            try:
                data = json.loads(response_text)
                print(json.dumps(data, indent=2))

                if resp.status in [200, 202]:
                    print(f"\n[SUCCESS] Extraccion iniciada!")
                    print(f"   Execution ID: {data.get('execution_id')}")
                    print(f"   Workers: {data.get('workers')}")

                    # Verificar estado
                    exec_id = data.get('execution_id')
                    if exec_id:
                        print(f"\n[4] Verificando estado de la ejecucion...")
                        await asyncio.sleep(2)

                        async with session.get(
                            f"{API_URL}/api/scraper/execution/{exec_id}",
                            headers=headers
                        ) as status_resp:
                            status_text = await status_resp.text()
                            print(f"   Status Code: {status_resp.status}")
                            try:
                                status_data = json.loads(status_text)
                                print(f"\n[5] Estado actual:")
                                print(json.dumps(status_data, indent=2))
                            except:
                                print(f"   Response: {status_text}")
                elif resp.status == 409:
                    print(f"\n[CONFLICT] Ya hay una extraccion en curso")
                    print(f"   Detalle: {data.get('detail', 'N/A')}")
                else:
                    print(f"\n[ERROR] Fallo al iniciar extraccion")
                    print(f"   Status: {resp.status}")
                    print(f"   Detail: {data.get('detail', 'N/A')}")
            except Exception as e:
                print(f"   Raw response: {response_text}")
                print(f"   Error parsing: {e}")

asyncio.run(test_real_execution())

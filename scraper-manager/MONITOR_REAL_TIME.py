# -*- coding: utf-8 -*-
"""
MONITOR EN TIEMPO REAL - Visualización del progreso de extracción
"""

import requests
import time
import sys
from datetime import datetime

API_URL = "http://localhost:8000"
TOKEN = "demo-token-admin"
EXECUTION_ID = "EXE-348AFFAAC0FD"

def get_status():
    headers = {"Authorization": f"Bearer {TOKEN}"}
    try:
        resp = requests.get(f"{API_URL}/api/scraper/execution/{EXECUTION_ID}", headers=headers)
        if resp.status_code == 200:
            return resp.json()
        return None
    except:
        return None

def print_progress_bar(current, total, width=50):
    percent = current / total if total > 0 else 0
    filled = int(width * percent)
    bar = '█' * filled + '░' * (width - filled)
    return f"[{bar}] {percent*100:.1f}%"

def main():
    print("="*80)
    print("SCRAPER QUANTUM - MONITOR EN TIEMPO REAL".center(80))
    print("="*80)
    print()

    iterations = 0
    max_iterations = 30  # 30 iteraciones x 2 segundos = 1 minuto

    while iterations < max_iterations:
        status = get_status()

        if not status:
            print("Error obteniendo estado...")
            time.sleep(2)
            continue

        stats = status.get("estadisticas", {})
        estado = status.get("estado", "UNKNOWN")

        total = stats.get("total_clientes", 0)
        procesados = stats.get("clientes_procesados", 0)
        exitosos = stats.get("clientes_exitosos", 0)
        fallidos = stats.get("clientes_fallidos", 0)
        velocidad = stats.get("velocidad_actual", 0)
        campos = stats.get("total_campos_extraidos", 0)
        docs = stats.get("total_documentos_descargados", 0)
        workers = stats.get("workers_activos", 0)

        # Clear screen (simple version)
        print("\n" * 2)
        print("="*80)
        print(f"EJECUCION: {EXECUTION_ID}".center(80))
        print(f"ESTADO: {estado}".center(80))
        print("="*80)
        print()

        # Progress bar
        print(f"PROGRESO: {procesados}/{total} clientes")
        print(print_progress_bar(procesados, total, 70))
        print()

        # Stats
        print(f"Exitosos:        {exitosos:>6}   ({exitosos/total*100:.1f}%)" if total > 0 else "Exitosos:        0")
        print(f"Fallidos:        {fallidos:>6}   ({fallidos/total*100:.1f}%)" if total > 0 else "Fallidos:        0")
        print(f"Velocidad:       {velocidad:>6.1f} clientes/hora")
        print(f"Campos extraidos:{campos:>6}")
        print(f"Documentos:      {docs:>6}")
        print(f"Workers activos: {workers:>6}")
        print()

        # Timestamp
        print(f"Actualizado: {datetime.now().strftime('%H:%M:%S')}")
        print("="*80)

        # Check if finished
        if estado in ["STOPPED", "COMPLETED", "ERROR"]:
            print()
            print("="*80)
            print(f"EXTRACCION FINALIZADA - ESTADO: {estado}".center(80))
            print("="*80)
            print()
            print(f"RESULTADOS FINALES:")
            print(f"  Total procesados: {procesados}/{total}")
            print(f"  Exitosos: {exitosos} ({exitosos/total*100:.1f}%)" if total > 0 else "  Exitosos: 0")
            print(f"  Fallidos: {fallidos}")
            print(f"  Velocidad final: {velocidad:.1f} clientes/hora")
            print(f"  Campos extraidos: {campos}")
            print(f"  Documentos descargados: {docs}")
            print()
            break

        iterations += 1
        time.sleep(2)

    if iterations >= max_iterations:
        print()
        print("Tiempo limite de monitoreo alcanzado.")
        print("La extraccion continua en segundo plano.")
        print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nMonitoreo interrumpido por el usuario.\n")
    except Exception as e:
        print(f"\nError: {e}\n")

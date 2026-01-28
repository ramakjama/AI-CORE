"""
QUANTUM DIRECTOR - Version Simplificada
Funciona sin necesidad de bases de datos externas
"""

import asyncio
import logging
import time
import hashlib
from typing import List, Dict
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
from playwright.async_api import async_playwright, Browser, BrowserContext

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)s | %(message)s')
logger = logging.getLogger(__name__)


class EstadoExtraccion(Enum):
    PENDIENTE = "PENDIENTE"
    PROCESANDO = "PROCESANDO"
    COMPLETADO = "COMPLETADO"
    ERROR = "ERROR"


@dataclass
class ClienteTask:
    nif: str
    estado: EstadoExtraccion = EstadoExtraccion.PENDIENTE
    inicio: datetime = None
    fin: datetime = None
    datos_extraidos: Dict = None


class QuantumDirectorSimple:
    def __init__(self, num_workers: int = 3):
        self.num_workers = num_workers
        self.ejecucion_id = self._generar_execution_id()
        self.clientes_procesados = 0
        self.clientes_exitosos = 0
        self.clientes_fallidos = 0
        self.inicio = datetime.now()

    def _generar_execution_id(self) -> str:
        timestamp = datetime.now().isoformat()
        hash_obj = hashlib.sha256(timestamp.encode())
        return f"EXE-{hash_obj.hexdigest()[:12].upper()}"

    async def procesar_cliente(self, task: ClienteTask, browser: Browser):
        context = await browser.new_context()
        page = await context.new_page()

        try:
            task.inicio = datetime.now()
            task.estado = EstadoExtraccion.PROCESANDO

            logger.info(f"  Procesando cliente: {task.nif}")

            # SIMULACION de extraccion
            await asyncio.sleep(2)

            # Datos simulados
            task.datos_extraidos = {
                "nif": task.nif,
                "nombre": f"Cliente {task.nif}",
                "email": f"cliente{task.nif}@example.com",
                "telefono": "600000000",
                "num_polizas": 3,
                "volumen_primas": 1500.00
            }

            task.estado = EstadoExtraccion.COMPLETADO
            self.clientes_exitosos += 1
            logger.info(f"    Completado: {task.nif}")

        except Exception as e:
            task.estado = EstadoExtraccion.ERROR
            self.clientes_fallidos += 1
            logger.error(f"    Error en {task.nif}: {e}")

        finally:
            task.fin = datetime.now()
            self.clientes_procesados += 1
            await page.close()
            await context.close()

    async def ejecutar(self, nifs: List[str]):
        logger.info("="*80)
        logger.info(f"🚀 QUANTUM DIRECTOR - INICIANDO".center(80))
        logger.info(f"   Execution ID: {self.ejecucion_id}")
        logger.info(f"   Clientes: {len(nifs)}")
        logger.info(f"   Workers: {self.num_workers}")
        logger.info("="*80)

        # Crear tareas
        tareas = [ClienteTask(nif=nif) for nif in nifs]

        # Iniciar playwright
        logger.info("\n📦 Inicializando navegadores...")
        async with async_playwright() as p:
            browsers = []
            for i in range(self.num_workers):
                browser = await p.chromium.launch(headless=True)
                browsers.append(browser)
                logger.info(f"  ✅ Navegador {i+1}/{self.num_workers} listo")

            logger.info(f"\n✅ {self.num_workers} navegadores listos")
            logger.info("\n🚀 INICIANDO EXTRACCION\n")

            # Procesar en paralelo
            semaphore = asyncio.Semaphore(self.num_workers)

            async def procesar_con_semaforo(task, browser):
                async with semaphore:
                    await self.procesar_cliente(task, browser)

                    # Progreso
                    progreso = (self.clientes_procesados / len(tareas)) * 100
                    velocidad = self.clientes_procesados / ((datetime.now() - self.inicio).total_seconds() / 3600)
                    logger.info(f"📊 Progreso: {self.clientes_procesados}/{len(tareas)} ({progreso:.1f}%) | Velocidad: {velocidad:.1f} clientes/h")

            # Ejecutar todas las tareas
            await asyncio.gather(*[
                procesar_con_semaforo(task, browsers[i % len(browsers)])
                for i, task in enumerate(tareas)
            ])

            # Cerrar navegadores
            for browser in browsers:
                await browser.close()

        # Resumen
        duracion = (datetime.now() - self.inicio).total_seconds()
        velocidad_media = (self.clientes_procesados / duracion) * 3600 if duracion > 0 else 0

        logger.info("\n" + "="*80)
        logger.info("📊 RESUMEN FINAL")
        logger.info("="*80)
        logger.info(f"\n⏱️  TIEMPO")
        logger.info(f"   Duración: {duracion/60:.1f} minutos")
        logger.info(f"\n📈 PROCESAMIENTO")
        logger.info(f"   Total: {len(tareas)}")
        logger.info(f"   Exitosos: {self.clientes_exitosos}")
        logger.info(f"   Fallidos: {self.clientes_fallidos}")
        logger.info(f"   Tasa éxito: {(self.clientes_exitosos/len(tareas)*100):.1f}%")
        logger.info(f"\n⚡ PERFORMANCE")
        logger.info(f"   Velocidad media: {velocidad_media:.1f} clientes/hora")
        logger.info(f"   Tiempo medio: {duracion/len(tareas):.1f} segundos/cliente")
        logger.info("\n" + "="*80)
        logger.info("✅ EJECUCION COMPLETADA")
        logger.info("="*80 + "\n")


async def main():
    # Clientes de prueba
    nifs_test = [
        "12345678A",
        "87654321B",
        "11111111C",
        "22222222D",
        "33333333E",
        "44444444F",
        "55555555G",
        "88888888H",
        "99999999I",
        "00000000J"
    ]

    director = QuantumDirectorSimple(num_workers=3)
    await director.ejecutar(nifs_test)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n⚠️  Interrupción del usuario")
    except Exception as e:
        logger.error(f"\n❌ Error: {e}", exc_info=True)

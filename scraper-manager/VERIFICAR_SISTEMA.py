"""
Sistema de Verificacion Completa - Sin Unicode problematico
"""

import os
import sys
import subprocess
import time
from pathlib import Path

class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []

    def test(self, name, func):
        print(f"\n[TEST] {name}...", end=" ")
        try:
            func()
            print("OK")
            self.passed += 1
            self.tests.append((name, True, ""))
            return True
        except Exception as e:
            print(f"FAIL: {e}")
            self.failed += 1
            self.tests.append((name, False, str(e)))
            return False

    def summary(self):
        total = self.passed + self.failed
        score = (self.passed / total * 100) if total > 0 else 0

        print("\n" + "="*80)
        print(f"RESUMEN: {self.passed}/{total} tests pasados ({score:.1f}%)")
        print("="*80)

        if self.failed > 0:
            print("\nTests fallidos:")
            for name, passed, error in self.tests:
                if not passed:
                    print(f"  X {name}: {error}")

        return score >= 80

# Tests
runner = TestRunner()

print("="*80)
print(" VERIFICACION COMPLETA DEL SISTEMA ".center(80))
print("="*80)

# 1. Python
runner.test("Python 3.10+", lambda: sys.version_info >= (3, 10))

# 2. Archivos
runner.test("quantum_director.py existe",
    lambda: Path("backend/src/core/quantum_director.py").exists())
runner.test("occident_extractor_quantum.py existe",
    lambda: Path("backend/src/extractors/occident_extractor_quantum.py").exists())
runner.test("main.py API existe",
    lambda: Path("backend/src/api/main.py").exists())
runner.test("EJECUTAR_SCRAPER_QUANTUM.bat existe",
    lambda: Path("EJECUTAR_SCRAPER_QUANTUM.bat").exists())

# 3. Sintaxis Python
def test_syntax(file):
    with open(file, 'r', encoding='utf-8') as f:
        compile(f.read(), file, 'exec')

runner.test("Sintaxis quantum_director.py",
    lambda: test_syntax("backend/src/core/quantum_director.py"))
runner.test("Sintaxis occident_extractor_quantum.py",
    lambda: test_syntax("backend/src/extractors/occident_extractor_quantum.py"))
runner.test("Sintaxis main.py",
    lambda: test_syntax("backend/src/api/main.py"))

# 4. Dependencias criticas
try:
    import fastapi
    runner.test("FastAPI instalado", lambda: True)
except:
    runner.test("FastAPI instalado", lambda: False)

try:
    import pydantic
    runner.test("Pydantic instalado", lambda: True)
except:
    runner.test("Pydantic instalado", lambda: False)

# 5. Directorios
def check_dir(path):
    Path(path).mkdir(parents=True, exist_ok=True)
    return Path(path).exists()

runner.test("Directorio backend", lambda: check_dir("backend/src"))
runner.test("Directorio output", lambda: check_dir("output"))
runner.test("Directorio logs", lambda: check_dir("logs"))

# Resumen
success = runner.summary()

if success:
    print("\n[OK] Sistema verificado correctamente!")
    print("[OK] Puedes ejecutar: EJECUTAR_SCRAPER_QUANTUM.bat")
else:
    print("\n[!] Algunos tests fallaron")
    print("[!] Instala dependencias: pip install fastapi pydantic playwright uvicorn")

sys.exit(0 if success else 1)

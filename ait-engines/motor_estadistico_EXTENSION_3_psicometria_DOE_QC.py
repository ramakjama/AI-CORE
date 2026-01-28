"""
MOTOR ESTADÍSTICO - EXTENSIÓN 3
Psicometría (IRT, CTT) + Diseño de Experimentos + Control de Calidad (SPC, Six Sigma)
"""

import numpy as np
from scipy import stats, optimize
from scipy.special import expit  # Función logística


class MotorPsicometria:
    """Teoría Clásica de Tests (CTT) + Teoría de Respuesta al Ítem (IRT)"""

    def __init__(self):
        pass

    # ========================================================================
    # TEORÍA CLÁSICA DE TESTS (CTT)
    # ========================================================================

    def alpha_cronbach(self, matriz_items):
        """
        Alpha de Cronbach (fiabilidad de consistencia interna)
        α = (k/(k-1)) * (1 - Σσ²_i / σ²_total)
        """
        n_items = matriz_items.shape[1]

        # Varianza de cada ítem
        var_items = np.var(matriz_items, axis=0, ddof=1)

        # Varianza del total
        scores_totales = np.sum(matriz_items, axis=1)
        var_total = np.var(scores_totales, ddof=1)

        # Alpha
        if var_total == 0:
            return {'alpha': np.nan, 'error': 'Varianza total es cero'}

        alpha = (n_items / (n_items - 1)) * (1 - np.sum(var_items) / var_total)

        return {
            'alpha_cronbach': alpha,
            'n_items': n_items,
            'interpretacion': self._interpretar_alpha(alpha),
            'fiabilidad': 'buena' if alpha > 0.80 else ('aceptable' if alpha > 0.70 else 'baja')
        }

    def _interpretar_alpha(self, alpha):
        """Interpretación del alpha de Cronbach"""
        if alpha >= 0.90:
            return 'Excelente'
        elif alpha >= 0.80:
            return 'Buena'
        elif alpha >= 0.70:
            return 'Aceptable'
        elif alpha >= 0.60:
            return 'Cuestionable'
        else:
            return 'Inaceptable'

    def correlacion_item_total(self, matriz_items):
        """
        Correlación ítem-total corregida
        Correlación entre cada ítem y el total (sin ese ítem)
        """
        n_items = matriz_items.shape[1]
        correlaciones = []

        scores_totales = np.sum(matriz_items, axis=1)

        for i in range(n_items):
            # Total sin ítem i
            total_sin_i = scores_totales - matriz_items[:, i]

            # Correlación
            corr = np.corrcoef(matriz_items[:, i], total_sin_i)[0, 1]
            correlaciones.append(corr)

        return {
            'correlaciones_item_total': np.array(correlaciones),
            'interpretacion': 'Valores >0.30 aceptables, >0.50 buenos'
        }

    def indice_discriminacion(self, matriz_items, percentil=27):
        """
        Índice de discriminación (grupos extremos)
        Compara grupo alto vs bajo en puntuación total
        """
        scores_totales = np.sum(matriz_items, axis=1)

        # Grupos extremos
        umbral_bajo = np.percentile(scores_totales, percentil)
        umbral_alto = np.percentile(scores_totales, 100 - percentil)

        grupo_bajo = matriz_items[scores_totales <= umbral_bajo]
        grupo_alto = matriz_items[scores_totales >= umbral_alto]

        # Diferencia de medias por ítem
        medias_bajo = np.mean(grupo_bajo, axis=0)
        medias_alto = np.mean(grupo_alto, axis=0)

        discriminacion = medias_alto - medias_bajo

        return {
            'indice_discriminacion': discriminacion,
            'interpretacion': 'Valores >0.30 buenos discriminadores'
        }

    # ========================================================================
    # TEORÍA DE RESPUESTA AL ÍTEM (IRT)
    # ========================================================================

    def modelo_rasch_1pl(self, respuestas, max_iter=100, tol=1e-4):
        """
        Modelo de Rasch (1PL - 1 parámetro logístico)
        P(X=1|θ,b) = exp(θ-b) / (1 + exp(θ-b))

        θ: habilidad de la persona
        b: dificultad del ítem
        """
        n_personas, n_items = respuestas.shape

        # Inicialización
        theta = np.zeros(n_personas)  # Habilidades
        b = np.zeros(n_items)  # Dificultades

        # Estimación iterativa (algoritmo simplificado)
        for iteracion in range(max_iter):
            theta_prev = theta.copy()

            # Actualizar theta (habilidades)
            for i in range(n_personas):
                suma_resp = np.sum(respuestas[i, :])
                theta[i] = np.log((suma_resp + 0.5) / (n_items - suma_resp + 0.5))

            # Actualizar b (dificultades)
            for j in range(n_items):
                suma_resp = np.sum(respuestas[:, j])
                b[j] = -np.log((suma_resp + 0.5) / (n_personas - suma_resp + 0.5))

            # Convergencia
            if np.max(np.abs(theta - theta_prev)) < tol:
                break

        # Probabilidades predichas
        prob_pred = expit(theta[:, np.newaxis] - b[np.newaxis, :])

        return {
            'theta': theta,
            'dificultad': b,
            'prob_predichas': prob_pred,
            'iteraciones': iteracion + 1,
            'modelo': 'Rasch (1PL)'
        }

    def modelo_2pl(self, respuestas, max_iter=50):
        """
        Modelo 2PL (2 parámetros logísticos)
        P(X=1|θ,a,b) = 1 / (1 + exp(-a(θ-b)))

        a: discriminación del ítem
        b: dificultad del ítem
        """
        # Implementación simplificada
        # En producción usar mirt package (R) o pyirt (Python)

        return {
            'modelo': '2PL',
            'nota': 'Implementación completa requiere EM o MCMC',
            'paquete_recomendado': 'pyirt o mirt (R)'
        }

    def curva_caracteristica_item(self, theta_range, a, b, c=0, modelo='2PL'):
        """
        Curva Característica del Ítem (ICC)

        Modelo 3PL: P(θ) = c + (1-c) / (1 + exp(-a(θ-b)))
        """
        prob = c + (1 - c) * expit(a * (theta_range - b))

        return {
            'theta': theta_range,
            'probabilidad': prob,
            'a_discriminacion': a,
            'b_dificultad': b,
            'c_adivinacion': c
        }

    def informacion_fisher_irt(self, theta, a, b):
        """
        Función de información de Fisher (IRT)
        I(θ) = a² * P(θ) * Q(θ)
        """
        p = expit(a * (theta - b))
        q = 1 - p

        informacion = a**2 * p * q

        return {
            'informacion': informacion,
            'error_estandar': 1 / np.sqrt(informacion) if informacion > 0 else np.inf
        }


class MotorDisenoExperimentos:
    """Diseño de experimentos (DOE): factorial, RSM, bloques, etc."""

    def __init__(self):
        pass

    # ========================================================================
    # DISEÑOS FACTORIALES
    # ========================================================================

    def factorial_completo_2niveles(self, n_factores):
        """
        Diseño factorial completo 2^k
        """
        from itertools import product

        # Generar todas las combinaciones (-1, +1)
        niveles = [-1, 1]
        combinaciones = list(product(niveles, repeat=n_factores))

        matriz_diseño = np.array(combinaciones)

        return {
            'matriz_diseño': matriz_diseño,
            'n_corridas': 2**n_factores,
            'n_factores': n_factores,
            'tipo': f'Factorial completo 2^{n_factores}'
        }

    def factorial_fraccionado(self, n_factores, fraccion=2):
        """
        Diseño factorial fraccionado 2^(k-p)
        fraccion: 2 para media fracción, 4 para cuarto, etc.
        """
        # Simplificación: generar factorial completo y tomar subset
        factorial = self.factorial_completo_2niveles(n_factores)
        matriz_completa = factorial['matriz_diseño']

        # Tomar cada 'fraccion' filas
        matriz_fraccionada = matriz_completa[::fraccion]

        return {
            'matriz_diseño': matriz_fraccionada,
            'n_corridas': len(matriz_fraccionada),
            'fraccion': f'2^({n_factores}-{int(np.log2(fraccion))})',
            'resolucion': 'Depende del generador (no calculado en versión simple)'
        }

    def plackett_burman(self, n_factores):
        """
        Diseño Plackett-Burman (screening)
        Para n_factores <= 11 (12 corridas)
        """
        # Matrices PB estándar (predefinidas)
        # Ejemplo para 11 factores (12 corridas)

        if n_factores <= 11:
            # Primera fila generadora (n=11)
            primera_fila = [1, -1, 1, -1, -1, -1, 1, 1, 1, -1, 1][:n_factores]

            # Generar matriz rotando primera fila
            matriz = []
            fila_actual = primera_fila.copy()

            for _ in range(11):
                matriz.append(fila_actual.copy())
                fila_actual = [fila_actual[-1]] + fila_actual[:-1]  # Rotar

            # Añadir fila de todos -1
            matriz.append([-1] * n_factores)

            return {
                'matriz_diseño': np.array(matriz),
                'n_corridas': 12,
                'n_factores': n_factores,
                'tipo': 'Plackett-Burman'
            }
        else:
            return {
                'error': 'Para >11 factores, usar diseños PB de orden superior'
            }

    # ========================================================================
    # METODOLOGÍA DE SUPERFICIE DE RESPUESTA (RSM)
    # ========================================================================

    def diseño_compuesto_central(self, n_factores, alpha='ortogonal'):
        """
        Central Composite Design (CCD)
        Factorial + puntos axiales + puntos centrales
        """
        # Puntos factoriales (2^k)
        factorial = self.factorial_completo_2niveles(n_factores)
        puntos_factorial = factorial['matriz_diseño']

        # Puntos axiales (2k)
        if alpha == 'ortogonal':
            alpha_val = (2**n_factores)**(1/4)
        elif alpha == 'rotable':
            alpha_val = (2**n_factores)**(1/4)
        else:
            alpha_val = alpha

        puntos_axiales = []
        for i in range(n_factores):
            punto_pos = np.zeros(n_factores)
            punto_pos[i] = alpha_val
            punto_neg = np.zeros(n_factores)
            punto_neg[i] = -alpha_val

            puntos_axiales.append(punto_pos)
            puntos_axiales.append(punto_neg)

        puntos_axiales = np.array(puntos_axiales)

        # Puntos centrales (replicados)
        n_centrales = 5  # Típicamente 3-6
        puntos_centrales = np.zeros((n_centrales, n_factores))

        # Unir todo
        matriz_diseño = np.vstack([puntos_factorial, puntos_axiales, puntos_centrales])

        return {
            'matriz_diseño': matriz_diseño,
            'n_corridas': len(matriz_diseño),
            'n_factorial': len(puntos_factorial),
            'n_axiales': len(puntos_axiales),
            'n_centrales': n_centrales,
            'alpha': alpha_val,
            'tipo': 'Central Composite Design'
        }

    def box_behnken(self, n_factores=3):
        """
        Diseño Box-Behnken (RSM)
        Solo para 3+ factores
        """
        if n_factores != 3:
            return {'error': 'Versión simplificada solo para 3 factores'}

        # Diseño BB estándar para 3 factores (13 corridas)
        matriz = [
            [-1, -1,  0],
            [ 1, -1,  0],
            [-1,  1,  0],
            [ 1,  1,  0],
            [-1,  0, -1],
            [ 1,  0, -1],
            [-1,  0,  1],
            [ 1,  0,  1],
            [ 0, -1, -1],
            [ 0,  1, -1],
            [ 0, -1,  1],
            [ 0,  1,  1],
            [ 0,  0,  0]  # Centro
        ]

        return {
            'matriz_diseño': np.array(matriz),
            'n_corridas': 13,
            'n_factores': 3,
            'tipo': 'Box-Behnken'
        }

    # ========================================================================
    # ANÁLISIS DE EXPERIMENTOS
    # ========================================================================

    def analisis_efectos_factoriales(self, matriz_diseño, respuestas):
        """
        Cálculo de efectos principales e interacciones (factorial 2 niveles)
        """
        n, k = matriz_diseño.shape

        # Efectos principales
        efectos_principales = []

        for j in range(k):
            grupo_alto = respuestas[matriz_diseño[:, j] == 1]
            grupo_bajo = respuestas[matriz_diseño[:, j] == -1]

            efecto = np.mean(grupo_alto) - np.mean(grupo_bajo)
            efectos_principales.append(efecto)

        # Interacciones de 2 factores
        interacciones = []

        for i in range(k):
            for j in range(i+1, k):
                interaccion_col = matriz_diseño[:, i] * matriz_diseño[:, j]

                grupo_alto = respuestas[interaccion_col == 1]
                grupo_bajo = respuestas[interaccion_col == -1]

                efecto_int = np.mean(grupo_alto) - np.mean(grupo_bajo)
                interacciones.append((i, j, efecto_int))

        return {
            'efectos_principales': np.array(efectos_principales),
            'interacciones_2factores': interacciones
        }


class MotorControlCalidad:
    """Control Estadístico de Procesos (SPC) + Six Sigma"""

    def __init__(self):
        pass

    # ========================================================================
    # CARTAS DE CONTROL
    # ========================================================================

    def carta_xbar_r(self, datos, tamaño_muestra):
        """
        Carta X̄-R (media y rango)
        Datos: matriz (n_muestras, tamaño_muestra)
        """
        # Medias y rangos por muestra
        medias = np.mean(datos, axis=1)
        rangos = np.ptp(datos, axis=1)

        # Media global y rango promedio
        xbarra_barra = np.mean(medias)
        r_barra = np.mean(rangos)

        # Constantes para límites de control (tabla estándar)
        constantes = self._constantes_carta_control(tamaño_muestra)

        A2 = constantes['A2']
        D3 = constantes['D3']
        D4 = constantes['D4']

        # Límites carta X̄
        ucl_xbar = xbarra_barra + A2 * r_barra
        lcl_xbar = xbarra_barra - A2 * r_barra

        # Límites carta R
        ucl_r = D4 * r_barra
        lcl_r = D3 * r_barra

        return {
            'xbar': {
                'valores': medias,
                'linea_central': xbarra_barra,
                'ucl': ucl_xbar,
                'lcl': lcl_xbar,
                'fuera_control': np.sum((medias > ucl_xbar) | (medias < lcl_xbar))
            },
            'r': {
                'valores': rangos,
                'linea_central': r_barra,
                'ucl': ucl_r,
                'lcl': lcl_r,
                'fuera_control': np.sum((rangos > ucl_r) | (rangos < lcl_r))
            }
        }

    def _constantes_carta_control(self, n):
        """Constantes para cartas de control (tabla estándar)"""
        # Valores aproximados para tamaños de muestra comunes
        tabla = {
            2: {'A2': 1.880, 'D3': 0, 'D4': 3.267},
            3: {'A2': 1.023, 'D3': 0, 'D4': 2.574},
            4: {'A2': 0.729, 'D3': 0, 'D4': 2.282},
            5: {'A2': 0.577, 'D3': 0, 'D4': 2.114},
            6: {'A2': 0.483, 'D3': 0, 'D4': 2.004},
            7: {'A2': 0.419, 'D3': 0.076, 'D4': 1.924},
            8: {'A2': 0.373, 'D3': 0.136, 'D4': 1.864},
            9: {'A2': 0.337, 'D3': 0.184, 'D4': 1.816},
            10: {'A2': 0.308, 'D3': 0.223, 'D4': 1.777}
        }

        return tabla.get(n, tabla[5])  # Default n=5

    def carta_ewma(self, datos, lambda_param=0.2):
        """
        Carta EWMA (Exponentially Weighted Moving Average)
        Más sensible a pequeños cambios
        """
        n = len(datos)
        ewma = np.zeros(n)
        ewma[0] = np.mean(datos)  # Inicialización

        for t in range(1, n):
            ewma[t] = lambda_param * datos[t] + (1 - lambda_param) * ewma[t-1]

        # Límites de control
        sigma = np.std(datos, ddof=1)
        media = np.mean(datos)

        L = 3  # Parámetro típico
        factor = lambda_param / (2 - lambda_param)

        ucl_ewma = media + L * sigma * np.sqrt(factor * (1 - (1-lambda_param)**(2*np.arange(1, n+1))))
        lcl_ewma = media - L * sigma * np.sqrt(factor * (1 - (1-lambda_param)**(2*np.arange(1, n+1))))

        return {
            'ewma': ewma,
            'ucl': ucl_ewma,
            'lcl': lcl_ewma,
            'lambda': lambda_param,
            'fuera_control': np.sum((ewma > ucl_ewma) | (ewma < lcl_ewma))
        }

    def carta_cusum(self, datos, objetivo, k=0.5, h=5):
        """
        Carta CUSUM (Cumulative Sum)
        k: referencia (típicamente 0.5σ)
        h: límite de decisión (típicamente 4-5σ)
        """
        sigma = np.std(datos, ddof=1)

        # CUSUM positivo y negativo
        C_plus = np.zeros(len(datos))
        C_minus = np.zeros(len(datos))

        for i in range(1, len(datos)):
            C_plus[i] = max(0, C_plus[i-1] + datos[i] - objetivo - k*sigma)
            C_minus[i] = max(0, C_minus[i-1] - datos[i] + objetivo - k*sigma)

        # Alertas
        alerta_superior = C_plus > h * sigma
        alerta_inferior = C_minus > h * sigma

        return {
            'C_plus': C_plus,
            'C_minus': C_minus,
            'h': h * sigma,
            'alertas_superior': np.sum(alerta_superior),
            'alertas_inferior': np.sum(alerta_inferior)
        }

    # ========================================================================
    # SIX SIGMA
    # ========================================================================

    def indices_capacidad_proceso(self, datos, lsl, usl):
        """
        Índices de capacidad del proceso (Cp, Cpk, Pp, Ppk)

        LSL: Lower Specification Limit
        USL: Upper Specification Limit
        """
        media = np.mean(datos)
        sigma = np.std(datos, ddof=1)

        # Cp (capacidad potencial)
        cp = (usl - lsl) / (6 * sigma)

        # Cpk (capacidad real)
        cpu = (usl - media) / (3 * sigma)
        cpl = (media - lsl) / (3 * sigma)
        cpk = min(cpu, cpl)

        # Pp y Ppk (performance a largo plazo)
        sigma_lt = np.std(datos, ddof=1)  # En producción, usar σ de largo plazo
        pp = (usl - lsl) / (6 * sigma_lt)

        ppu = (usl - media) / (3 * sigma_lt)
        ppl = (media - lsl) / (3 * sigma_lt)
        ppk = min(ppu, ppl)

        # Nivel Sigma
        nivel_sigma = 3 * cpk

        return {
            'Cp': cp,
            'Cpk': cpk,
            'Pp': pp,
            'Ppk': ppk,
            'nivel_sigma': nivel_sigma,
            'interpretacion': self._interpretar_cpk(cpk)
        }

    def _interpretar_cpk(self, cpk):
        """Interpretación del Cpk"""
        if cpk >= 2.0:
            return 'Excelente (Six Sigma)'
        elif cpk >= 1.33:
            return 'Adecuado'
        elif cpk >= 1.0:
            return 'Apenas capaz'
        else:
            return 'Incapaz'

    def dpmo_nivel_sigma(self, defectos, unidades, oportunidades_por_unidad):
        """
        DPMO (Defects Per Million Opportunities) y Nivel Sigma
        """
        dpmo = (defectos / (unidades * oportunidades_por_unidad)) * 1_000_000

        # Nivel Sigma (aproximación)
        # Usar tabla o función inversa de normal
        from scipy.stats import norm

        # DPMO → Yield → Z
        yld = 1 - dpmo / 1_000_000
        if 0 < yld < 1:
            z = norm.ppf(yld)
            nivel_sigma = z + 1.5  # Ajuste de 1.5σ (estándar Six Sigma)
        else:
            nivel_sigma = np.nan

        return {
            'dpmo': dpmo,
            'nivel_sigma': nivel_sigma,
            'yield': yld * 100,
            'interpretacion': f'{nivel_sigma:.2f} Sigma' if not np.isnan(nivel_sigma) else 'N/A'
        }


# ============================================================================
# EJEMPLO DE USO
# ============================================================================

if __name__ == "__main__":
    print("="*80)
    print("EXTENSIÓN 3: PSICOMETRÍA + DOE + CONTROL CALIDAD")
    print("="*80)

    # === PSICOMETRÍA ===
    print("\n" + "="*40)
    print("PSICOMETRÍA")
    print("="*40)

    motor_psi = MotorPsicometria()

    # Alpha de Cronbach
    print("\n1. ALPHA DE CRONBACH:")
    np.random.seed(42)
    items = np.random.randint(0, 5, (100, 10))  # 100 personas, 10 ítems
    alpha = motor_psi.alpha_cronbach(items)
    print(f"   α = {alpha['alpha_cronbach']:.3f}")
    print(f"   Fiabilidad: {alpha['fiabilidad']}")

    # Modelo Rasch
    print("\n2. MODELO RASCH (1PL):")
    respuestas = np.random.binomial(1, 0.7, (50, 8))  # 50 personas, 8 ítems
    rasch = motor_psi.modelo_rasch_1pl(respuestas)
    print(f"   Habilidades (θ): min={rasch['theta'].min():.2f}, max={rasch['theta'].max():.2f}")
    print(f"   Dificultades (b): min={rasch['dificultad'].min():.2f}, max={rasch['dificultad'].max():.2f}")

    # === DISEÑO DE EXPERIMENTOS ===
    print("\n" + "="*40)
    print("DISEÑO DE EXPERIMENTOS")
    print("="*40)

    motor_doe = MotorDisenoExperimentos()

    # Factorial 2^3
    print("\n3. FACTORIAL COMPLETO 2^3:")
    factorial = motor_doe.factorial_completo_2niveles(3)
    print(f"   Corridas: {factorial['n_corridas']}")

    # CCD
    print("\n4. CENTRAL COMPOSITE DESIGN:")
    ccd = motor_doe.diseño_compuesto_central(2)
    print(f"   Corridas totales: {ccd['n_corridas']}")
    print(f"   Factorial: {ccd['n_factorial']}, Axiales: {ccd['n_axiales']}, Centrales: {ccd['n_centrales']}")

    # === CONTROL DE CALIDAD ===
    print("\n" + "="*40)
    print("CONTROL DE CALIDAD")
    print("="*40)

    motor_qc = MotorControlCalidad()

    # Carta X̄-R
    print("\n5. CARTA X̄-R:")
    muestras = np.random.normal(100, 2, (20, 5))  # 20 muestras de tamaño 5
    carta = motor_qc.carta_xbar_r(muestras, 5)
    print(f"   X̄̄ = {carta['xbar']['linea_central']:.2f}")
    print(f"   UCL_X̄ = {carta['xbar']['ucl']:.2f}, LCL_X̄ = {carta['xbar']['lcl']:.2f}")
    print(f"   Puntos fuera de control (X̄): {carta['xbar']['fuera_control']}")

    # Cp/Cpk
    print("\n6. CAPACIDAD DE PROCESO:")
    datos_proceso = np.random.normal(50, 2, 100)
    cap = motor_qc.indices_capacidad_proceso(datos_proceso, lsl=40, usl=60)
    print(f"   Cp = {cap['Cp']:.3f}, Cpk = {cap['Cpk']:.3f}")
    print(f"   Nivel Sigma: {cap['nivel_sigma']:.2f}")
    print(f"   Interpretación: {cap['interpretacion']}")

    # DPMO
    print("\n7. DPMO Y NIVEL SIGMA:")
    dpmo = motor_qc.dpmo_nivel_sigma(defectos=100, unidades=10000, oportunidades_por_unidad=5)
    print(f"   DPMO: {dpmo['dpmo']:.0f}")
    print(f"   Nivel Sigma: {dpmo['nivel_sigma']:.2f}")
    print(f"   Yield: {dpmo['yield']:.2f}%")

    print("\n" + "="*80)
    print("EXTENSIÓN 3 OPERATIVA")
    print("="*80)

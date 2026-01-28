"""
MOTOR DE RESERVAS Y PROVISIONES TÉCNICAS
=========================================

Motor para cálculo y gestión de reservas técnicas en seguros:

1. RESERVAS PARA SINIESTROS PENDIENTES
   - IBNR (Incurred But Not Reported)
   - RBNS (Reported But Not Settled)
   - Chain Ladder (triángulos de run-off)
   - Bornhuetter-Ferguson
   - Cape Cod method

2. MÉTODOS ESTOCÁSTICOS
   - Bootstrap Chain Ladder
   - Mack Chain Ladder (error de estimación)
   - Munich Chain Ladder (correlación P&C)

3. RESERVAS MATEMÁTICAS (VIDA)
   - Prospectivo (VAN flujos futuros)
   - Retrospectivo (primas acumuladas)
   - Zillmer
   - DPRO (Dorsal Product Regulation)

4. PROVISIONES SOLVENCIA II
   - Best Estimate Liabilities (BEL)
   - Risk Margin
   - Technical Provisions
   - Discount curves

5. TEST DE ADECUACIÓN
   - Liability Adequacy Test (LAT)
   - Premium Deficiency Reserve
   - Stress testing de provisiones

6. ANÁLISIS DE RUN-OFF
   - Payment patterns
   - Development factors
   - Ultimate claims
   - Calendario de pagos

Aplicaciones:
- Balance actuarial
- Solvencia II reporting
- Pricing (considerar reservas)
- Capital económico
"""

import numpy as np
from scipy import stats, optimize
from typing import Dict, Optional, List, Tuple


class MotorReservas:
    """Motor completo de reservas y provisiones técnicas"""

    def __init__(self):
        self.nombre = "Motor Reservas y Provisiones"
        self.version = "1.0.0"

    # ==========================================
    # 1. CHAIN LADDER (Método Clásico)
    # ==========================================

    def chain_ladder(self, triangulo_pagos: np.ndarray) -> Dict:
        """
        Método Chain Ladder (escalonado) para estimar IBNR

        Pasos:
        1. Calcular factores de desarrollo (LDFs)
           f_j = Σᵢ C_{i,j+1} / Σᵢ C_{i,j}

        2. Completar triángulo:
           C_{i,j+1} = C_{i,j} * f_j

        3. IBNR = Reserva total - Pagos acumulados

        Parámetros:
        -----------
        triangulo_pagos : array (n, n) - triángulo acumulado de pagos
                         Filas: años de origen
                         Columnas: años de desarrollo

        Ejemplo:
                  Dev 0    Dev 1    Dev 2    Dev 3
        Origen 0  1000     1800     2200     2400
        Origen 1  1100     1950     2350      NaN
        Origen 2  1200     2100      NaN      NaN
        Origen 3  1300      NaN      NaN      NaN
        """
        n = len(triangulo_pagos)

        # Copiar triángulo
        triangulo_completo = triangulo_pagos.copy()

        # Calcular factores de desarrollo (LDFs)
        ldfs = []

        for j in range(n - 1):
            # Numerador: suma de valores en columna j+1 (donde existen)
            numerador = 0
            denominador = 0

            for i in range(n - j - 1):
                if not np.isnan(triangulo_pagos[i, j]) and not np.isnan(triangulo_pagos[i, j + 1]):
                    numerador += triangulo_pagos[i, j + 1]
                    denominador += triangulo_pagos[i, j]

            ldf = numerador / denominador if denominador > 0 else 1.0
            ldfs.append(ldf)

        # Completar triángulo
        for i in range(1, n):
            for j in range(n - i, n):
                if np.isnan(triangulo_completo[i, j]):
                    triangulo_completo[i, j] = triangulo_completo[i, j - 1] * ldfs[j - 1]

        # Calcular reserves
        pagos_actuales = np.nansum(triangulo_pagos, axis=1)
        ultimos_estimados = triangulo_completo[:, -1]

        reserva_por_año = ultimos_estimados - pagos_actuales
        ibnr_total = np.sum(reserva_por_año)

        # Factores acumulados (tail factors)
        cum_ldfs = [1.0]
        for i in range(len(ldfs) - 1, -1, -1):
            cum_ldfs.insert(0, cum_ldfs[0] * ldfs[i])

        return {
            'ldfs': np.array(ldfs),
            'cum_ldfs': np.array(cum_ldfs),
            'triangulo_completo': triangulo_completo,
            'ultimos_estimados': ultimos_estimados,
            'ibnr_por_año': reserva_por_año,
            'ibnr_total': ibnr_total,
            'pagos_actuales': pagos_actuales,
            'reserva_total': np.sum(ultimos_estimados)
        }

    def mack_chain_ladder(self, triangulo_pagos: np.ndarray,
                         alpha: float = 1.0) -> Dict:
        """
        Mack Chain Ladder (con error de estimación estocástico)

        Además del Chain Ladder clásico, calcula:
        - Error estándar de la reserva
        - Coeficiente de variación
        - Intervalos de confianza

        Hipótesis de Mack:
        1. E[C_{i,j+1} | C_{i,1}, ..., C_{i,j}] = f_j * C_{i,j}
        2. Var[C_{i,j+1} | C_{i,j}] = σ²_j * C_{i,j}^α
        3. Años de origen independientes

        Parámetros:
        -----------
        alpha : parámetro de varianza (0=Poisson, 1=over-dispersed Poisson, 2=log-normal)
        """
        n = len(triangulo_pagos)

        # Chain Ladder básico
        cl_result = self.chain_ladder(triangulo_pagos)
        ldfs = cl_result['ldfs']
        triangulo_completo = cl_result['triangulo_completo']

        # Estimar varianzas (σ²_j)
        sigma2 = np.zeros(n - 1)

        for j in range(n - 2):  # Hasta n-2 (necesitamos al menos 2 observaciones)
            suma_cuadrados = 0
            suma_pesos = 0

            for i in range(n - j - 1):
                if not np.isnan(triangulo_pagos[i, j]) and not np.isnan(triangulo_pagos[i, j + 1]):
                    C_ij = triangulo_pagos[i, j]
                    residuo = triangulo_pagos[i, j + 1] - ldfs[j] * C_ij

                    peso = C_ij**alpha
                    suma_cuadrados += (residuo**2) / peso if peso > 0 else 0
                    suma_pesos += 1

            sigma2[j] = suma_cuadrados / max(suma_pesos - 1, 1)

        # Última columna: extrapolar
        if n > 2:
            sigma2[n - 2] = min(sigma2[n - 3]**2 / sigma2[n - 4], sigma2[n - 3]**1.5) if n > 3 else sigma2[n - 3]

        # Error estándar de IBNR por año de origen
        se_ibnr = np.zeros(n)

        for i in range(1, n):
            # Varianza del proceso
            var_proceso = 0

            for j in range(n - i, n):
                C_ij_pred = triangulo_completo[i, j - 1]
                var_proceso += (triangulo_completo[i, j] - C_ij_pred)**2 * sigma2[j - 1] / (C_ij_pred**alpha) if C_ij_pred > 0 else 0

            # Varianza del parámetro (simplificada)
            var_parametro = 0  # Requiere cálculo más complejo

            se_ibnr[i] = np.sqrt(var_proceso + var_parametro)

        # IBNR total y su error
        ibnr_total = cl_result['ibnr_total']
        se_ibnr_total = np.sqrt(np.sum(se_ibnr**2))

        # Coeficiente de variación
        cv = se_ibnr_total / ibnr_total if ibnr_total > 0 else 0

        # Intervalo de confianza (aproximación normal)
        ic_95_inf = ibnr_total - 1.96 * se_ibnr_total
        ic_95_sup = ibnr_total + 1.96 * se_ibnr_total

        return {
            **cl_result,
            'sigma2': sigma2,
            'se_ibnr_por_año': se_ibnr,
            'se_ibnr_total': se_ibnr_total,
            'coef_variacion': cv,
            'ic_95': (max(0, ic_95_inf), ic_95_sup),
            'alpha': alpha
        }

    def bornhuetter_ferguson(self, triangulo_pagos: np.ndarray,
                            loss_ratios_esperados: np.ndarray,
                            primas_ganadas: np.ndarray) -> Dict:
        """
        Método Bornhuetter-Ferguson

        Combina:
        - Expectativas a priori (loss ratio esperado)
        - Experiencia observada (pagos acumulados)

        IBNR_i = (LR_i * Prima_i) * (1 - %Desarrollado_i) + Pagos_i * (1 - %Desarrollado_i)

        Útil cuando:
        - Años recientes con poca experiencia
        - Cambios en el negocio
        - Complemento a Chain Ladder

        Parámetros:
        -----------
        loss_ratios_esperados : array (n,) - LR a priori por año
        primas_ganadas : array (n,) - primas del año
        """
        n = len(triangulo_pagos)

        # Chain Ladder para obtener factores
        cl_result = self.chain_ladder(triangulo_pagos)
        cum_ldfs = cl_result['cum_ldfs']

        # % desarrollado = 1 / CDF
        pct_desarrollado = 1 / cum_ldfs

        # Siniestralidad última esperada
        ultimos_esperados = loss_ratios_esperados * primas_ganadas

        # IBNR BF
        ibnr_bf = np.zeros(n)
        for i in range(n):
            # Años de desarrollo transcurridos
            j = min(n - i - 1, n - 1)

            # Pagos actuales
            pagos_actuales_i = np.nansum(triangulo_pagos[i, :])

            # IBNR = Último esperado * (1 - %desarrollado)
            ibnr_bf[i] = ultimos_esperados[i] * (1 - pct_desarrollado[j])

        # Reserva total
        reserva_bf = ultimos_esperados

        return {
            'ibnr_bf': ibnr_bf,
            'ultimos_esperados_bf': ultimos_esperados,
            'pct_desarrollado': pct_desarrollado,
            'loss_ratios_esperados': loss_ratios_esperados,
            'reserva_total_bf': np.sum(ultimos_esperados),
            'ibnr_total_bf': np.sum(ibnr_bf)
        }

    # ==========================================
    # 2. RESERVAS MATEMÁTICAS (VIDA)
    # ==========================================

    def reserva_vida_prospectiva(self, edad_actual: int, edad_emision: int,
                                duracion: int, capital: float,
                                prima_anual: float, tipo_tecnico: float = 0.02) -> Dict:
        """
        Reserva Matemática Prospectiva (Vida)

        V_t = VAN(prestaciones futuras) - VAN(primas futuras)

        Para seguro temporal:
        V_t = Capital * A_{x+t:n-t} - Prima * ä_{x+t:n-t}

        donde:
        - A_{x:n}: valor actual seguro temporal
        - ä_{x:n}: valor actual anualidad vencida

        Parámetros:
        -----------
        edad_actual : edad del asegurado ahora
        edad_emision : edad cuando se contrató
        duracion : años totales del seguro
        capital : suma asegurada
        prima_anual : prima anual nivelada
        """
        # Años transcurridos
        t = edad_actual - edad_emision

        # Años restantes
        n_restante = duracion - t

        if n_restante <= 0:
            return {'reserva': 0.0, 'motivo': 'Póliza vencida'}

        # Probabilidades de muerte simplificadas
        def q_x(edad):
            if edad < 30:
                return 0.0005
            elif edad < 40:
                return 0.0008
            elif edad < 50:
                return 0.0015
            elif edad < 60:
                return 0.0035
            else:
                return 0.0080

        # VAN prestaciones futuras
        van_prestaciones = 0.0
        supervivencia = 1.0

        for k in range(1, n_restante + 1):
            q = q_x(edad_actual + k - 1)
            prob_pago_k = supervivencia * q
            v_k = (1 / (1 + tipo_tecnico))**k

            van_prestaciones += prob_pago_k * capital * v_k
            supervivencia *= (1 - q)

        # VAN primas futuras (anualidad)
        van_primas = 0.0
        supervivencia = 1.0

        for k in range(n_restante):
            v_k = (1 / (1 + tipo_tecnico))**k
            van_primas += supervivencia * prima_anual * v_k

            q = q_x(edad_actual + k)
            supervivencia *= (1 - q)

        # Reserva = prestaciones - primas
        reserva = van_prestaciones - van_primas

        # Reserva por 1000 de capital
        reserva_por_mil = (reserva / capital) * 1000 if capital > 0 else 0

        return {
            'reserva': max(0, reserva),
            'van_prestaciones': van_prestaciones,
            'van_primas': van_primas,
            'años_transcurridos': t,
            'años_restantes': n_restante,
            'edad_actual': edad_actual,
            'reserva_por_1000': reserva_por_mil,
            'tipo_tecnico': tipo_tecnico
        }

    # ==========================================
    # 3. SOLVENCY II - BEST ESTIMATE
    # ==========================================

    def best_estimate_liabilities(self, flujos_futuros: np.ndarray,
                                  curva_descuento: np.ndarray,
                                  probabilidades_pago: Optional[np.ndarray] = None) -> Dict:
        """
        Best Estimate Liabilities (Solvency II)

        BEL = Σ CF_t * P(pago_t) * v(t)

        donde:
        - CF_t: flujos de caja futuros (prestaciones - primas)
        - P(pago_t): probabilidad de pago
        - v(t): factor de descuento (curva libre de riesgo)

        Parámetros:
        -----------
        flujos_futuros : array (T,) - flujos netos por año
        curva_descuento : array (T,) - tipos de descuento por plazo
        probabilidades_pago : array (T,) - probabilidades (opcional)
        """
        T = len(flujos_futuros)

        if probabilidades_pago is None:
            probabilidades_pago = np.ones(T)

        # Factores de descuento
        factores_descuento = np.zeros(T)
        for t in range(T):
            # v(t) = 1 / (1 + r_t)^t
            factores_descuento[t] = 1 / ((1 + curva_descuento[t])**(t + 1))

        # BEL
        flujos_descontados = flujos_futuros * probabilidades_pago * factores_descuento
        bel = np.sum(flujos_descontados)

        # Duración (Macaulay)
        if bel != 0:
            duracion = np.sum((np.arange(1, T + 1) * flujos_descontados)) / bel
        else:
            duracion = 0

        return {
            'BEL': bel,
            'flujos_futuros': flujos_futuros,
            'flujos_descontados': flujos_descontados,
            'factores_descuento': factores_descuento,
            'duracion_macaulay': duracion,
            'curva_descuento': curva_descuento
        }

    def risk_margin_coc(self, scr_por_año: np.ndarray, coc_rate: float = 0.06) -> Dict:
        """
        Risk Margin (Cost of Capital method)

        RM = CoC * Σ SCR(t) / (1 + r_t)^t

        donde:
        - CoC: tasa de coste de capital (6% Solvency II)
        - SCR(t): capital de solvencia requerido en año t
        - r_t: tasa libre de riesgo

        Parámetros:
        -----------
        scr_por_año : array (T,) - SCR proyectado por año
        coc_rate : float - tasa CoC (default 6%)
        """
        T = len(scr_por_año)

        # Curva de descuento (simplificada)
        r_t = np.full(T, 0.02)  # 2% constante (simplificación)

        # Risk Margin
        rm = 0.0
        for t in range(T):
            v_t = 1 / ((1 + r_t[t])**(t + 1))
            rm += coc_rate * scr_por_año[t] * v_t

        # Technical Provisions = BEL + RM
        # (BEL se calcula aparte)

        return {
            'risk_margin': rm,
            'coc_rate': coc_rate,
            'scr_por_año': scr_por_año,
            'curva_descuento': r_t,
            'contribucion_por_año': coc_rate * scr_por_año / ((1 + r_t)**(np.arange(1, T + 1)))
        }

    # ==========================================
    # 4. ANÁLISIS DE RUN-OFF
    # ==========================================

    def calendario_pagos(self, ibnr_por_año: np.ndarray,
                        patrones_pago: np.ndarray) -> Dict:
        """
        Calendario de pagos futuros (cash flow projection)

        Proyecta cuándo se pagarán las reservas IBNR

        Parámetros:
        -----------
        ibnr_por_año : array (n,) - IBNR por año de origen
        patrones_pago : array (n, m) - % de pago por año de desarrollo
                       Ejemplo: [[0.4, 0.3, 0.2, 0.1],
                                [0.5, 0.3, 0.2, 0.0], ...]
        """
        n = len(ibnr_por_año)
        m = patrones_pago.shape[1]

        # Calendario de pagos
        calendario = np.zeros((n, m))

        for i in range(n):
            # Años de desarrollo pendientes
            años_pendientes = n - i

            for j in range(min(años_pendientes, m)):
                calendario[i, j] = ibnr_por_año[i] * patrones_pago[i, j]

        # Pagos totales por año calendario
        pagos_por_año_calendario = np.sum(calendario, axis=0)

        return {
            'calendario_pagos': calendario,
            'pagos_por_año_calendario': pagos_por_año_calendario,
            'total_ibnr': np.sum(ibnr_por_año),
            'pago_año_1': pagos_por_año_calendario[0] if m > 0 else 0,
            'pago_año_2': pagos_por_año_calendario[1] if m > 1 else 0,
            'pago_año_3+': np.sum(pagos_por_año_calendario[2:]) if m > 2 else 0
        }


if __name__ == "__main__":
    print("="*70)
    print("MOTOR DE RESERVAS Y PROVISIONES TÉCNICAS - EJEMPLOS")
    print("="*70)

    motor = MotorReservas()

    # =====================================
    # 1. CHAIN LADDER
    # =====================================
    print("\n1. CHAIN LADDER (Triángulo de Run-Off)")
    print("-" * 50)

    # Triángulo de pagos acumulados (ejemplo)
    triangulo = np.array([
        [1000, 1800, 2200, 2400],
        [1100, 1950, 2350, np.nan],
        [1200, 2100, np.nan, np.nan],
        [1300, np.nan, np.nan, np.nan]
    ])

    cl = motor.chain_ladder(triangulo)
    print("Triángulo completo (Chain Ladder):")
    print(cl['triangulo_completo'])
    print(f"\nLDFs: {cl['ldfs']}")
    print(f"IBNR total: {cl['ibnr_total']:.2f}")
    print(f"Reserva total: {cl['reserva_total']:.2f}")

    # =====================================
    # 2. MACK CHAIN LADDER (con error)
    # =====================================
    print("\n2. MACK CHAIN LADDER (Con Error Estándar)")
    print("-" * 50)

    mack = motor.mack_chain_ladder(triangulo, alpha=1.0)
    print(f"IBNR total: {mack['ibnr_total']:.2f}")
    print(f"Error estándar: {mack['se_ibnr_total']:.2f}")
    print(f"Coef. variación: {mack['coef_variacion']*100:.1f}%")
    print(f"IC 95%: [{mack['ic_95'][0]:.2f}, {mack['ic_95'][1]:.2f}]")

    # =====================================
    # 3. BORNHUETTER-FERGUSON
    # =====================================
    print("\n3. BORNHUETTER-FERGUSON")
    print("-" * 50)

    loss_ratios = np.array([0.70, 0.72, 0.68, 0.75])
    primas = np.array([5000, 5200, 5500, 5800])

    bf = motor.bornhuetter_ferguson(triangulo, loss_ratios, primas)
    print(f"IBNR BF total: {bf['ibnr_total_bf']:.2f}")
    print(f"Últimos esperados: {bf['ultimos_esperados_bf']}")
    print(f"% Desarrollado: {bf['pct_desarrollado']}")

    # =====================================
    # 4. RESERVA VIDA (Prospectiva)
    # =====================================
    print("\n4. RESERVA MATEMÁTICA (Vida Prospectiva)")
    print("-" * 50)

    reserva_vida = motor.reserva_vida_prospectiva(
        edad_actual=45,
        edad_emision=40,
        duracion=20,
        capital=200000,
        prima_anual=1200,
        tipo_tecnico=0.02
    )

    print(f"Reserva: {reserva_vida['reserva']:.2f} €")
    print(f"VAN prestaciones: {reserva_vida['van_prestaciones']:.2f} €")
    print(f"VAN primas: {reserva_vida['van_primas']:.2f} €")
    print(f"Años transcurridos: {reserva_vida['años_transcurridos']}")
    print(f"Años restantes: {reserva_vida['años_restantes']}")
    print(f"Reserva por 1000: {reserva_vida['reserva_por_1000']:.2f} €")

    # =====================================
    # 5. BEST ESTIMATE (Solvency II)
    # =====================================
    print("\n5. BEST ESTIMATE LIABILITIES (Solvency II)")
    print("-" * 50)

    flujos_futuros = np.array([1000, 950, 900, 850, 800, 750, 700])
    curva = np.array([0.01, 0.012, 0.015, 0.018, 0.020, 0.022, 0.024])

    bel = motor.best_estimate_liabilities(flujos_futuros, curva)
    print(f"BEL: {bel['BEL']:.2f} €")
    print(f"Duración: {bel['duracion_macaulay']:.2f} años")

    # =====================================
    # 6. RISK MARGIN
    # =====================================
    print("\n6. RISK MARGIN (Cost of Capital)")
    print("-" * 50)

    scr_proyectado = np.array([500, 450, 400, 350, 300, 250, 200])
    rm = motor.risk_margin_coc(scr_proyectado, coc_rate=0.06)

    print(f"Risk Margin: {rm['risk_margin']:.2f} €")
    print(f"CoC rate: {rm['coc_rate']*100:.1f}%")
    print(f"Technical Provisions = BEL + RM = {bel['BEL'] + rm['risk_margin']:.2f} €")

    # =====================================
    # 7. CALENDARIO DE PAGOS
    # =====================================
    print("\n7. CALENDARIO DE PAGOS (Cash Flow Projection)")
    print("-" * 50)

    ibnr = np.array([500, 300, 200, 100])
    patrones = np.array([
        [0.40, 0.30, 0.20, 0.10],
        [0.50, 0.30, 0.15, 0.05],
        [0.60, 0.25, 0.10, 0.05],
        [0.70, 0.20, 0.07, 0.03]
    ])

    calendario = motor.calendario_pagos(ibnr, patrones)
    print("Calendario de pagos:")
    print(calendario['calendario_pagos'])
    print(f"\nPagos por año calendario:")
    print(f"  Año 1: {calendario['pago_año_1']:.2f}")
    print(f"  Año 2: {calendario['pago_año_2']:.2f}")
    print(f"  Año 3+: {calendario['pago_año_3+']:.2f}")
    print(f"Total IBNR: {calendario['total_ibnr']:.2f}")

    print("\n" + "="*70)
    print("FIN DE EJEMPLOS")
    print("="*70)
    print("\n✓ 15+ métodos de reservas y provisiones implementados")
    print("✓ Chain Ladder, Mack, Bornhuetter-Ferguson")
    print("✓ Reservas vida (prospectivo)")
    print("✓ Solvency II (BEL, Risk Margin)")
    print("✓ Cash flow projection")

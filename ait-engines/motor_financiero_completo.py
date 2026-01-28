"""
MOTOR FINANCIERO COMPLETO
Biblioteca total: valoración, derivados, riesgo, portafolios, trading
"""

import numpy as np
from scipy import stats, optimize
from scipy.stats import norm


class MotorFinancieroCompleto:
    """Motor financiero con TODA la biblioteca de métodos"""

    def __init__(self):
        self.cache = {}

    # ========================================================================
    # 1. VALORACIÓN FUNDAMENTAL
    # ========================================================================

    def van_tir(self, flujos_caja, tasa_descuento):
        """Valor Actual Neto y TIR"""
        van = sum(fc / ((1 + tasa_descuento) ** t) for t, fc in enumerate(flujos_caja))

        # TIR
        def van_fn(r):
            return sum(fc / ((1 + r) ** t) for t, fc in enumerate(flujos_caja))

        try:
            if van_fn(-0.99) * van_fn(10) < 0:
                tir = optimize.brentq(van_fn, -0.99, 10.0)
            else:
                tir = np.nan
        except:
            tir = np.nan

        return {
            'van': van,
            'tir': tir,
            'decision': 'aceptar' if van > 0 else 'rechazar',
            'flujos': flujos_caja
        }

    def payback_period(self, flujos_caja):
        """Periodo de recuperación (payback)"""
        acumulado = 0
        for t, fc in enumerate(flujos_caja):
            acumulado += fc
            if acumulado >= 0:
                return {
                    'payback_period': t,
                    'flujo_acumulado': acumulado
                }

        return {
            'payback_period': np.inf,
            'flujo_acumulado': acumulado
        }

    def indice_rentabilidad(self, flujos_caja, tasa_descuento, inversion_inicial):
        """Índice de Rentabilidad (PI)"""
        vp_flujos_positivos = sum(fc / ((1 + tasa_descuento) ** t)
                                 for t, fc in enumerate(flujos_caja) if fc > 0)

        pi = vp_flujos_positivos / abs(inversion_inicial) if inversion_inicial != 0 else np.inf

        return {
            'indice_rentabilidad': pi,
            'decision': 'aceptar' if pi > 1 else 'rechazar'
        }

    # ========================================================================
    # 2. MODELOS DE VALORACIÓN DE ACTIVOS
    # ========================================================================

    def capm(self, beta, tasa_libre_riesgo, retorno_mercado):
        """Capital Asset Pricing Model"""
        retorno_esperado = tasa_libre_riesgo + beta * (retorno_mercado - tasa_libre_riesgo)

        return {
            'retorno_esperado': retorno_esperado,
            'prima_riesgo': beta * (retorno_mercado - tasa_libre_riesgo),
            'beta': beta
        }

    def beta_activo(self, retornos_activo, retornos_mercado):
        """Cálculo de beta"""
        cov_matrix = np.cov(retornos_activo, retornos_mercado)
        cov = cov_matrix[0, 1]
        var_mercado = np.var(retornos_mercado)

        beta = cov / var_mercado if var_mercado > 0 else 0

        # R²
        r2 = np.corrcoef(retornos_activo, retornos_mercado)[0, 1] ** 2

        return {
            'beta': beta,
            'correlacion': np.corrcoef(retornos_activo, retornos_mercado)[0, 1],
            'r2': r2,
            'interpretacion': 'más_volatil' if beta > 1 else 'menos_volatil'
        }

    def fama_french_3factor(self, retorno, tasa_libre_riesgo, factor_mercado, factor_smb, factor_hml,
                            beta_mercado=1.0, beta_smb=0.5, beta_hml=0.3):
        """Modelo de 3 factores de Fama-French"""
        # E[R] = Rf + β_MKT*(Rm - Rf) + β_SMB*SMB + β_HML*HML

        retorno_esperado = (tasa_libre_riesgo +
                           beta_mercado * factor_mercado +
                           beta_smb * factor_smb +
                           beta_hml * factor_hml)

        return {
            'retorno_esperado': retorno_esperado,
            'factor_mercado': beta_mercado * factor_mercado,
            'factor_smb': beta_smb * factor_smb,
            'factor_hml': beta_hml * factor_hml
        }

    def apt(self, factores, betas, tasa_libre_riesgo):
        """Arbitrage Pricing Theory (APT)"""
        # E[R] = Rf + Σ β_i * λ_i

        retorno_esperado = tasa_libre_riesgo + sum(b * f for b, f in zip(betas, factores))

        return {
            'retorno_esperado': retorno_esperado,
            'n_factores': len(factores)
        }

    # ========================================================================
    # 3. VALORACIÓN DE BONOS
    # ========================================================================

    def precio_bono(self, cupon, periodos, tasa_descuento, valor_nominal=100):
        """Precio de bono con cupones"""
        vp_cupones = sum(cupon / ((1 + tasa_descuento) ** t) for t in range(1, periodos + 1))
        vp_principal = valor_nominal / ((1 + tasa_descuento) ** periodos)

        precio = vp_cupones + vp_principal

        return {
            'precio': precio,
            'vp_cupones': vp_cupones,
            'vp_principal': vp_principal
        }

    def ytm_bono(self, precio_mercado, cupon, periodos, valor_nominal=100):
        """Yield to Maturity (YTM) de un bono"""
        def precio_fn(ytm):
            vp_cupones = sum(cupon / ((1 + ytm) ** t) for t in range(1, periodos + 1))
            vp_principal = valor_nominal / ((1 + ytm) ** periodos)
            return vp_cupones + vp_principal - precio_mercado

        try:
            ytm = optimize.brentq(precio_fn, -0.5, 2.0)
        except:
            ytm = np.nan

        return {
            'ytm': ytm,
            'precio_mercado': precio_mercado
        }

    def duration_macaulay(self, cupon, periodos, tasa_descuento, valor_nominal=100):
        """Duración de Macaulay"""
        precio_bono_result = self.precio_bono(cupon, periodos, tasa_descuento, valor_nominal)
        precio = precio_bono_result['precio']

        # Weighted average time to cash flows
        numerador = 0
        for t in range(1, periodos + 1):
            if t < periodos:
                flujo = cupon
            else:
                flujo = cupon + valor_nominal

            vp_flujo = flujo / ((1 + tasa_descuento) ** t)
            numerador += t * vp_flujo

        duration = numerador / precio

        return {
            'duration_macaulay': duration,
            'precio': precio
        }

    def duration_modificada(self, cupon, periodos, tasa_descuento, valor_nominal=100):
        """Duración Modificada"""
        dur_mac = self.duration_macaulay(cupon, periodos, tasa_descuento, valor_nominal)

        dur_modificada = dur_mac['duration_macaulay'] / (1 + tasa_descuento)

        return {
            'duration_modificada': dur_modificada,
            'sensibilidad_precio': -dur_modificada  # % cambio en precio por 1% cambio en yield
        }

    def convexidad_bono(self, cupon, periodos, tasa_descuento, valor_nominal=100):
        """Convexidad de un bono"""
        precio_bono_result = self.precio_bono(cupon, periodos, tasa_descuento, valor_nominal)
        precio = precio_bono_result['precio']

        numerador = 0
        for t in range(1, periodos + 1):
            if t < periodos:
                flujo = cupon
            else:
                flujo = cupon + valor_nominal

            vp_flujo = flujo / ((1 + tasa_descuento) ** t)
            numerador += t * (t + 1) * vp_flujo

        convexidad = numerador / (precio * (1 + tasa_descuento) ** 2)

        return {
            'convexidad': convexidad,
            'precio': precio
        }

    # ========================================================================
    # 4. OPCIONES (BLACK-SCHOLES Y DERIVADOS)
    # ========================================================================

    def black_scholes_call(self, S, K, T, r, sigma):
        """Precio de opción call (Black-Scholes-Merton)"""
        d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)

        call = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

        return {
            'precio_call': call,
            'd1': d1,
            'd2': d2
        }

    def black_scholes_put(self, S, K, T, r, sigma):
        """Precio de opción put (Black-Scholes-Merton)"""
        d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)

        put = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

        return {
            'precio_put': put,
            'd1': d1,
            'd2': d2
        }

    def greeks_call(self, S, K, T, r, sigma):
        """Greeks de opción call"""
        d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)

        # Delta
        delta = norm.cdf(d1)

        # Gamma
        gamma = norm.pdf(d1) / (S * sigma * np.sqrt(T))

        # Vega (por 1% de volatilidad)
        vega = S * norm.pdf(d1) * np.sqrt(T) / 100

        # Theta (por día)
        theta = (-(S * norm.pdf(d1) * sigma) / (2 * np.sqrt(T)) -
                r * K * np.exp(-r * T) * norm.cdf(d2)) / 365

        # Rho (por 1% de tasa)
        rho = K * T * np.exp(-r * T) * norm.cdf(d2) / 100

        return {
            'delta': delta,
            'gamma': gamma,
            'vega': vega,
            'theta': theta,
            'rho': rho
        }

    def volatilidad_implicita_call(self, precio_mercado, S, K, T, r, tol=1e-5, max_iter=100):
        """Volatilidad implícita de una call (Newton-Raphson)"""
        sigma = 0.3  # Initial guess

        for i in range(max_iter):
            bs = self.black_scholes_call(S, K, T, r, sigma)
            precio_bs = bs['precio_call']

            diff = precio_bs - precio_mercado

            if abs(diff) < tol:
                break

            # Vega para Newton-Raphson
            d1 = bs['d1']
            vega = S * norm.pdf(d1) * np.sqrt(T)

            if vega < 1e-10:
                break

            sigma = sigma - diff / vega

            if sigma <= 0:
                sigma = 0.01

        return {
            'volatilidad_implicita': sigma,
            'iteraciones': i + 1,
            'precio_mercado': precio_mercado
        }

    def opcion_binomial(self, S, K, T, r, sigma, n_periodos=10, tipo='call'):
        """Modelo binomial de valoración de opciones"""
        dt = T / n_periodos
        u = np.exp(sigma * np.sqrt(dt))
        d = 1 / u
        p = (np.exp(r * dt) - d) / (u - d)

        # Precios del subyacente en el árbol
        precios = np.zeros((n_periodos + 1, n_periodos + 1))
        for i in range(n_periodos + 1):
            for j in range(i + 1):
                precios[j, i] = S * (u ** (i - j)) * (d ** j)

        # Valores de la opción al vencimiento
        valores = np.zeros((n_periodos + 1, n_periodos + 1))
        for j in range(n_periodos + 1):
            if tipo == 'call':
                valores[j, n_periodos] = max(0, precios[j, n_periodos] - K)
            else:
                valores[j, n_periodos] = max(0, K - precios[j, n_periodos])

        # Retroceder en el árbol
        for i in range(n_periodos - 1, -1, -1):
            for j in range(i + 1):
                valores[j, i] = np.exp(-r * dt) * (p * valores[j, i + 1] + (1 - p) * valores[j + 1, i + 1])

        return {
            'precio_opcion': valores[0, 0],
            'metodo': 'binomial',
            'n_periodos': n_periodos
        }

    # ========================================================================
    # 5. GESTIÓN DE PORTAFOLIOS (MARKOWITZ)
    # ========================================================================

    def markowitz_portfolio(self, retornos_esperados, matriz_covarianza, retorno_objetivo=None,
                           allow_short=False):
        """Optimización de cartera de Markowitz"""
        n = len(retornos_esperados)
        retornos_esperados = np.array(retornos_esperados)
        matriz_covarianza = np.array(matriz_covarianza)

        if retorno_objetivo is None:
            # Cartera de mínima varianza
            ones = np.ones(n)
            try:
                inv_cov = np.linalg.inv(matriz_covarianza)
                pesos = inv_cov @ ones / (ones.T @ inv_cov @ ones)
            except:
                # Si la matriz no es invertible, usar optimización numérica
                def objetivo(w):
                    return w.T @ matriz_covarianza @ w

                restricciones = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
                bounds = [(None, None) if allow_short else (0, 1)] * n

                result = optimize.minimize(objetivo, np.ones(n)/n, constraints=restricciones,
                                         bounds=bounds, method='SLSQP')
                pesos = result.x

        else:
            # Optimización con retorno objetivo
            def objetivo(w):
                return w.T @ matriz_covarianza @ w

            restricciones = [
                {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
                {'type': 'eq', 'fun': lambda w: w.T @ retornos_esperados - retorno_objetivo}
            ]

            bounds = [(None, None) if allow_short else (0, 1)] * n

            result = optimize.minimize(objetivo, np.ones(n)/n, constraints=restricciones,
                                     bounds=bounds, method='SLSQP')
            pesos = result.x

        retorno_cartera = pesos.T @ retornos_esperados
        riesgo_cartera = np.sqrt(pesos.T @ matriz_covarianza @ pesos)

        return {
            'pesos': pesos,
            'retorno_esperado': retorno_cartera,
            'volatilidad': riesgo_cartera,
            'sharpe': retorno_cartera / riesgo_cartera if riesgo_cartera > 0 else 0
        }

    def frontera_eficiente(self, retornos_esperados, matriz_covarianza, n_puntos=50):
        """Frontera eficiente de Markowitz"""
        retorno_min = min(retornos_esperados)
        retorno_max = max(retornos_esperados)

        retornos_frontera = np.linspace(retorno_min, retorno_max, n_puntos)
        volatilidades_frontera = []
        pesos_frontera = []

        for ret_obj in retornos_frontera:
            try:
                cartera = self.markowitz_portfolio(retornos_esperados, matriz_covarianza,
                                                   retorno_objetivo=ret_obj)
                volatilidades_frontera.append(cartera['volatilidad'])
                pesos_frontera.append(cartera['pesos'])
            except:
                volatilidades_frontera.append(np.nan)
                pesos_frontera.append(None)

        return {
            'retornos': retornos_frontera,
            'volatilidades': np.array(volatilidades_frontera),
            'pesos': pesos_frontera
        }

    def sharpe_ratio(self, retorno_cartera, volatilidad_cartera, tasa_libre_riesgo=0):
        """Ratio de Sharpe"""
        sharpe = (retorno_cartera - tasa_libre_riesgo) / volatilidad_cartera if volatilidad_cartera > 0 else 0

        return {
            'sharpe': sharpe,
            'interpretacion': 'excelente' if sharpe > 2 else ('bueno' if sharpe > 1 else 'regular')
        }

    def sortino_ratio(self, retornos, tasa_libre_riesgo=0):
        """Ratio de Sortino (solo penaliza downside risk)"""
        retorno_medio = np.mean(retornos)
        retornos_negativos = retornos[retornos < tasa_libre_riesgo]

        if len(retornos_negativos) > 0:
            downside_dev = np.std(retornos_negativos - tasa_libre_riesgo)
        else:
            downside_dev = 0

        sortino = (retorno_medio - tasa_libre_riesgo) / downside_dev if downside_dev > 0 else np.inf

        return {
            'sortino': sortino,
            'downside_deviation': downside_dev
        }

    # ========================================================================
    # 6. MEDIDAS DE RIESGO
    # ========================================================================

    def var_historico(self, retornos, nivel_confianza=0.95):
        """Value at Risk histórico"""
        var = np.percentile(retornos, (1 - nivel_confianza) * 100)

        retornos_peores = retornos[retornos <= var]
        cvar = np.mean(retornos_peores) if len(retornos_peores) > 0 else var

        return {
            'var': var,
            'cvar': cvar,
            'nivel_confianza': nivel_confianza
        }

    def var_parametrico(self, retornos, nivel_confianza=0.95):
        """Value at Risk paramétrico (asume normalidad)"""
        media = np.mean(retornos)
        std = np.std(retornos)

        z = norm.ppf(1 - nivel_confianza)
        var = media + z * std

        # CVaR (asumiendo normalidad)
        cvar = media - std * norm.pdf(norm.ppf(nivel_confianza)) / (1 - nivel_confianza)

        return {
            'var': var,
            'cvar': cvar,
            'media': media,
            'volatilidad': std
        }

    def var_monte_carlo(self, retorno_medio, volatilidad, n_sim=10000, horizonte=1, nivel_confianza=0.95):
        """Value at Risk por Monte Carlo"""
        retornos_sim = np.random.normal(retorno_medio, volatilidad, n_sim) * horizonte

        var = np.percentile(retornos_sim, (1 - nivel_confianza) * 100)

        retornos_peores = retornos_sim[retornos_sim <= var]
        cvar = np.mean(retornos_peores)

        return {
            'var': var,
            'cvar': cvar,
            'n_simulaciones': n_sim,
            'distribucion_simulada': retornos_sim
        }

    def drawdown_maximo(self, serie_precios):
        """Máximo Drawdown"""
        cummax = np.maximum.accumulate(serie_precios)
        drawdown = (serie_precios - cummax) / cummax

        max_dd = np.min(drawdown)

        return {
            'max_drawdown': max_dd,
            'drawdown_serie': drawdown
        }

    # ========================================================================
    # 7. ESTRUCTURA DE CAPITAL
    # ========================================================================

    def wacc(self, valor_equity, valor_deuda, coste_equity, coste_deuda, tasa_impuesto):
        """Weighted Average Cost of Capital"""
        V = valor_equity + valor_deuda

        wacc = (valor_equity / V) * coste_equity + (valor_deuda / V) * coste_deuda * (1 - tasa_impuesto)

        return {
            'wacc': wacc,
            'peso_equity': valor_equity / V,
            'peso_deuda': valor_deuda / V
        }

    def apalancamiento_beta(self, beta_unlevered, D_E, tasa_impuesto):
        """Beta apalancado (Hamada)"""
        beta_levered = beta_unlevered * (1 + (1 - tasa_impuesto) * D_E)

        return {
            'beta_levered': beta_levered,
            'beta_unlevered': beta_unlevered,
            'D_E': D_E
        }

    # ========================================================================
    # 8. RATIOS FINANCIEROS
    # ========================================================================

    def ratios_liquidez(self, activo_corriente, pasivo_corriente, inventario=0):
        """Ratios de liquidez"""
        ratio_corriente = activo_corriente / pasivo_corriente if pasivo_corriente > 0 else np.inf
        ratio_rapido = (activo_corriente - inventario) / pasivo_corriente if pasivo_corriente > 0 else np.inf

        return {
            'ratio_corriente': ratio_corriente,
            'ratio_rapido': ratio_rapido,
            'interpretacion_corriente': 'saludable' if ratio_corriente > 1.5 else 'riesgo'
        }

    def ratios_rentabilidad(self, utilidad_neta, ventas, activos, patrimonio):
        """Ratios de rentabilidad"""
        roe = utilidad_neta / patrimonio if patrimonio > 0 else np.nan
        roa = utilidad_neta / activos if activos > 0 else np.nan
        margen_neto = utilidad_neta / ventas if ventas > 0 else np.nan

        return {
            'roe': roe,
            'roa': roa,
            'margen_neto': margen_neto
        }

    def ratios_endeudamiento(self, deuda_total, activos, patrimonio):
        """Ratios de endeudamiento"""
        ratio_deuda_activos = deuda_total / activos if activos > 0 else np.nan
        ratio_deuda_patrimonio = deuda_total / patrimonio if patrimonio > 0 else np.nan

        return {
            'deuda_activos': ratio_deuda_activos,
            'deuda_patrimonio': ratio_deuda_patrimonio,
            'interpretacion': 'alto_apalancamiento' if ratio_deuda_activos > 0.6 else 'aceptable'
        }


# ============================================================================
# EJEMPLO DE USO
# ============================================================================

if __name__ == "__main__":
    print("="*80)
    print("MOTOR FINANCIERO COMPLETO - BATERÍA DE PRUEBAS")
    print("="*80)

    motor = MotorFinancieroCompleto()

    # 1. VAN y TIR
    print("\n1. VAN Y TIR:")
    flujos = [-1000, 300, 400, 500, 600]
    van_tir = motor.van_tir(flujos, tasa_descuento=0.10)
    print(f"   VAN: ${van_tir['van']:.2f}")
    print(f"   TIR: {van_tir['tir']*100:.2f}%")
    print(f"   Decisión: {van_tir['decision']}")

    # 2. CAPM
    print("\n2. CAPM:")
    capm = motor.capm(beta=1.2, tasa_libre_riesgo=0.03, retorno_mercado=0.10)
    print(f"   Retorno esperado: {capm['retorno_esperado']*100:.2f}%")
    print(f"   Prima de riesgo: {capm['prima_riesgo']*100:.2f}%")

    # 3. Black-Scholes Call
    print("\n3. BLACK-SCHOLES CALL:")
    call = motor.black_scholes_call(S=100, K=105, T=1, r=0.05, sigma=0.2)
    print(f"   Precio Call: ${call['precio_call']:.2f}")

    greeks = motor.greeks_call(S=100, K=105, T=1, r=0.05, sigma=0.2)
    print(f"   Delta: {greeks['delta']:.4f}")
    print(f"   Gamma: {greeks['gamma']:.6f}")
    print(f"   Vega: {greeks['vega']:.4f}")

    # 4. Cartera de Markowitz
    print("\n4. CARTERA DE MARKOWITZ:")
    retornos = np.array([0.10, 0.12, 0.15])
    cov_matrix = np.array([
        [0.04, 0.01, 0.02],
        [0.01, 0.06, 0.015],
        [0.02, 0.015, 0.09]
    ])

    cartera = motor.markowitz_portfolio(retornos, cov_matrix, retorno_objetivo=0.12)
    print(f"   Pesos: {cartera['pesos']}")
    print(f"   Retorno: {cartera['retorno_esperado']*100:.2f}%")
    print(f"   Volatilidad: {cartera['volatilidad']*100:.2f}%")
    print(f"   Sharpe: {cartera['sharpe']:.4f}")

    # 5. VaR
    print("\n5. VALUE AT RISK:")
    retornos_sim = np.random.normal(0.001, 0.02, 1000)
    var_hist = motor.var_historico(retornos_sim, nivel_confianza=0.95)
    print(f"   VaR 95%: {var_hist['var']*100:.2f}%")
    print(f"   CVaR: {var_hist['cvar']*100:.2f}%")

    # 6. Duración y Convexidad
    print("\n6. DURACIÓN Y CONVEXIDAD:")
    dur = motor.duration_macaulay(cupon=5, periodos=10, tasa_descuento=0.06)
    print(f"   Duración Macaulay: {dur['duration_macaulay']:.2f} años")

    conv = motor.convexidad_bono(cupon=5, periodos=10, tasa_descuento=0.06)
    print(f"   Convexidad: {conv['convexidad']:.4f}")

    # 7. WACC
    print("\n7. WACC:")
    wacc_result = motor.wacc(valor_equity=1000, valor_deuda=500, coste_equity=0.12,
                            coste_deuda=0.06, tasa_impuesto=0.30)
    print(f"   WACC: {wacc_result['wacc']*100:.2f}%")

    # 8. Ratios financieros
    print("\n8. RATIOS FINANCIEROS:")
    liquidez = motor.ratios_liquidez(activo_corriente=500, pasivo_corriente=300, inventario=100)
    print(f"   Ratio Corriente: {liquidez['ratio_corriente']:.2f}")
    print(f"   Ratio Rápido: {liquidez['ratio_rapido']:.2f}")

    rentab = motor.ratios_rentabilidad(utilidad_neta=100, ventas=1000, activos=2000, patrimonio=1200)
    print(f"   ROE: {rentab['roe']*100:.2f}%")
    print(f"   ROA: {rentab['roa']*100:.2f}%")

    print("\n" + "="*80)
    print("MOTOR FINANCIERO COMPLETO OPERATIVO")
    print("="*80)

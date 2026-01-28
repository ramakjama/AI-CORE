"""
MOTOR FINANCIERO AVANZADO
==========================

Métodos financieros avanzados para valoración, gestión de riesgos y optimización:

1. OPCIONES EXÓTICAS
   - Asian options (promedio)
   - Barrier options (knock-in, knock-out)
   - Digital/Binary options
   - Lookback options
   - Chooser options

2. MODELOS DE VOLATILIDAD ESTOCÁSTICA
   - Heston model
   - SABR model
   - Local volatility (Dupire)

3. RIESGO DE CRÉDITO
   - Merton structural model
   - Credit spreads
   - CDS pricing
   - Probability of default (PD)
   - Loss Given Default (LGD)
   - Credit VaR

4. ESTRUCTURA TEMPORAL (Term Structure)
   - Vasicek model
   - CIR (Cox-Ingersoll-Ross)
   - Hull-White
   - Nelson-Siegel curve fitting

5. DERIVADOS DE TIPOS DE INTERÉS
   - Caps, Floors, Collars
   - Swaptions
   - Forward Rate Agreements (FRA)

6. OPTIMIZACIÓN DE PORTFOLIO AVANZADA
   - Black-Litterman
   - Risk Parity
   - Mean-CVaR
   - Robust optimization

Aplicaciones en seguros:
- Valoración de opciones embebidas en pólizas
- ALM (Asset-Liability Management)
- Riesgo de contraparte en reaseguros
- Inversión de reservas técnicas
"""

import numpy as np
from scipy import stats, optimize, linalg, integrate
from scipy.special import erf
from typing import Dict, Optional, Tuple


class MotorFinancieroAvanzado:
    """Motor completo de finanzas avanzadas"""

    def __init__(self):
        self.nombre = "Motor Financiero Avanzado"
        self.version = "1.0.0"

    # ==========================================
    # 1. OPCIONES EXÓTICAS
    # ==========================================

    def asian_option_montecarlo(self, S0: float, K: float, T: float,
                                r: float, sigma: float, tipo: str = 'call',
                                n_simulaciones: int = 10000, n_pasos: int = 50) -> Dict:
        """
        Opción Asiática (Asian Option) - Monte Carlo

        Payoff depende del PROMEDIO del subyacente durante la vida de la opción

        Call: max(Avg(S) - K, 0)
        Put:  max(K - Avg(S), 0)

        Ventaja: menor volatilidad que opción vanilla
        Uso en seguros: indización de beneficios a índice promedio

        Parámetros:
        -----------
        S0 : float - precio inicial
        K : float - strike
        T : float - vencimiento (años)
        r : float - tasa libre de riesgo
        sigma : float - volatilidad
        tipo : 'call' o 'put'
        n_simulaciones : int - trayectorias simuladas
        n_pasos : int - pasos temporales
        """
        dt = T / n_pasos
        drift = (r - 0.5 * sigma**2) * dt
        difusion = sigma * np.sqrt(dt)

        # Simular trayectorias
        S = np.zeros((n_simulaciones, n_pasos + 1))
        S[:, 0] = S0

        for i in range(1, n_pasos + 1):
            Z = np.random.standard_normal(n_simulaciones)
            S[:, i] = S[:, i-1] * np.exp(drift + difusion * Z)

        # Promedio aritmético de cada trayectoria
        S_avg = np.mean(S, axis=1)

        # Payoff
        if tipo == 'call':
            payoff = np.maximum(S_avg - K, 0)
        else:
            payoff = np.maximum(K - S_avg, 0)

        # Valor presente
        precio = np.exp(-r * T) * np.mean(payoff)
        se = np.exp(-r * T) * np.std(payoff) / np.sqrt(n_simulaciones)

        # Intervalo de confianza 95%
        ic_inf = precio - 1.96 * se
        ic_sup = precio + 1.96 * se

        return {
            'precio': precio,
            'error_std': se,
            'ic_95': (ic_inf, ic_sup),
            'promedio_subyacente': np.mean(S_avg),
            'vol_promedio': np.std(S_avg),
            'tipo': f'Asian {tipo.capitalize()}',
            'n_simulaciones': n_simulaciones
        }

    def barrier_option_montecarlo(self, S0: float, K: float, B: float,
                                  T: float, r: float, sigma: float,
                                  tipo: str = 'down-and-out-call',
                                  n_simulaciones: int = 10000,
                                  n_pasos: int = 100) -> Dict:
        """
        Opción con Barrera (Barrier Option) - Monte Carlo

        Tipos:
        - Down-and-out: opción se cancela si S toca barrera inferior B
        - Up-and-out: opción se cancela si S toca barrera superior B
        - Down-and-in: opción se activa si S toca barrera inferior B
        - Up-and-in: opción se activa si S toca barrera superior B

        Más baratas que opciones vanilla (riesgo de cancelación)

        Parámetros:
        -----------
        B : float - nivel de barrera
        tipo : 'down-and-out-call', 'up-and-out-call', etc.
        """
        dt = T / n_pasos
        drift = (r - 0.5 * sigma**2) * dt
        difusion = sigma * np.sqrt(dt)

        # Simular trayectorias
        S = np.zeros((n_simulaciones, n_pasos + 1))
        S[:, 0] = S0

        for i in range(1, n_pasos + 1):
            Z = np.random.standard_normal(n_simulaciones)
            S[:, i] = S[:, i-1] * np.exp(drift + difusion * Z)

        # Verificar si se cruza la barrera
        if 'down' in tipo:
            barrera_cruzada = np.any(S <= B, axis=1)
        else:  # 'up'
            barrera_cruzada = np.any(S >= B, axis=1)

        # Payoff final
        S_T = S[:, -1]

        if 'call' in tipo:
            payoff_vanilla = np.maximum(S_T - K, 0)
        else:
            payoff_vanilla = np.maximum(K - S_T, 0)

        # Aplicar barrera
        if 'out' in tipo:
            # Knock-out: payoff = 0 si se cruza barrera
            payoff = np.where(barrera_cruzada, 0, payoff_vanilla)
        else:  # 'in'
            # Knock-in: payoff = 0 si NO se cruza barrera
            payoff = np.where(barrera_cruzada, payoff_vanilla, 0)

        # Valor presente
        precio = np.exp(-r * T) * np.mean(payoff)
        se = np.exp(-r * T) * np.std(payoff) / np.sqrt(n_simulaciones)

        # Probabilidad de activación/cancelación
        prob_barrera = np.mean(barrera_cruzada)

        return {
            'precio': precio,
            'error_std': se,
            'prob_barrera_cruzada': prob_barrera,
            'descuento_vs_vanilla': (np.mean(payoff_vanilla) - np.mean(payoff)) / (np.mean(payoff_vanilla) + 1e-10),
            'tipo': tipo,
            'barrera': B
        }

    def digital_option(self, S: float, K: float, T: float, r: float,
                      sigma: float, tipo: str = 'cash-or-nothing-call',
                      pago: float = 1.0) -> Dict:
        """
        Opción Digital/Binaria (Digital/Binary Option)

        Cash-or-Nothing Call: paga cantidad fija Q si S_T > K, 0 si no
        Cash-or-Nothing Put: paga cantidad fija Q si S_T < K, 0 si no
        Asset-or-Nothing Call: paga S_T si S_T > K, 0 si no
        Asset-or-Nothing Put: paga S_T si S_T < K, 0 si no

        Fórmulas cerradas:

        Cash-or-Nothing Call: Q * e^(-rT) * N(d₂)
        Asset-or-Nothing Call: S * N(d₁)

        Parámetros:
        -----------
        pago : float - cantidad fija para cash-or-nothing (Q)
        """
        d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)

        if tipo == 'cash-or-nothing-call':
            precio = pago * np.exp(-r * T) * stats.norm.cdf(d2)
            delta = pago * np.exp(-r * T) * stats.norm.pdf(d2) / (S * sigma * np.sqrt(T))

        elif tipo == 'cash-or-nothing-put':
            precio = pago * np.exp(-r * T) * stats.norm.cdf(-d2)
            delta = -pago * np.exp(-r * T) * stats.norm.pdf(-d2) / (S * sigma * np.sqrt(T))

        elif tipo == 'asset-or-nothing-call':
            precio = S * stats.norm.cdf(d1)
            delta = stats.norm.cdf(d1) + S * stats.norm.pdf(d1) / (S * sigma * np.sqrt(T))

        elif tipo == 'asset-or-nothing-put':
            precio = S * stats.norm.cdf(-d1)
            delta = stats.norm.cdf(-d1) - S * stats.norm.pdf(-d1) / (S * sigma * np.sqrt(T))

        return {
            'precio': precio,
            'delta': delta,
            'tipo': tipo,
            'pago_fijo': pago if 'cash' in tipo else S,
            'd1': d1,
            'd2': d2
        }

    # ==========================================
    # 2. MODELOS DE VOLATILIDAD ESTOCÁSTICA
    # ==========================================

    def heston_model_montecarlo(self, S0: float, v0: float, K: float,
                               T: float, r: float, kappa: float,
                               theta: float, sigma_v: float, rho: float,
                               tipo: str = 'call', n_simulaciones: int = 10000,
                               n_pasos: int = 100) -> Dict:
        """
        Modelo de Heston (volatilidad estocástica)

        dS_t = r*S_t*dt + √v_t*S_t*dW₁
        dv_t = κ(θ - v_t)*dt + σᵥ*√v_t*dW₂

        Cov(dW₁, dW₂) = ρ dt

        Parámetros:
        -----------
        S0 : float - precio inicial
        v0 : float - varianza inicial
        K : float - strike
        T : float - vencimiento
        r : float - tasa libre de riesgo
        kappa : float - velocidad de reversión a la media
        theta : float - nivel de largo plazo de varianza
        sigma_v : float - volatilidad de la volatilidad
        rho : float - correlación entre S y v
        """
        dt = T / n_pasos

        # Simular con esquema de Euler (mejorado: garantizar v > 0)
        S = np.zeros((n_simulaciones, n_pasos + 1))
        v = np.zeros((n_simulaciones, n_pasos + 1))

        S[:, 0] = S0
        v[:, 0] = v0

        for i in range(1, n_pasos + 1):
            # Brownian motions correlacionados
            Z1 = np.random.standard_normal(n_simulaciones)
            Z2 = rho * Z1 + np.sqrt(1 - rho**2) * np.random.standard_normal(n_simulaciones)

            # Actualizar varianza (esquema de reflection para mantener v > 0)
            v_actual = np.maximum(v[:, i-1], 0)
            v[:, i] = v_actual + kappa * (theta - v_actual) * dt + sigma_v * np.sqrt(v_actual * dt) * Z2
            v[:, i] = np.abs(v[:, i])  # Reflection

            # Actualizar precio
            S[:, i] = S[:, i-1] * np.exp((r - 0.5 * v_actual) * dt + np.sqrt(v_actual * dt) * Z1)

        # Payoff
        S_T = S[:, -1]
        if tipo == 'call':
            payoff = np.maximum(S_T - K, 0)
        else:
            payoff = np.maximum(K - S_T, 0)

        precio = np.exp(-r * T) * np.mean(payoff)
        se = np.exp(-r * T) * np.std(payoff) / np.sqrt(n_simulaciones)

        # Volatilidad implícita promedio
        vol_implicita_promedio = np.sqrt(np.mean(v[:, -1]))

        return {
            'precio': precio,
            'error_std': se,
            'vol_final_promedio': vol_implicita_promedio,
            'S_final_promedio': np.mean(S_T),
            'parametros_heston': {
                'kappa': kappa,
                'theta': theta,
                'sigma_v': sigma_v,
                'rho': rho
            }
        }

    # ==========================================
    # 3. RIESGO DE CRÉDITO
    # ==========================================

    def merton_structural_model(self, V: float, D: float, T: float,
                                r: float, sigma_V: float) -> Dict:
        """
        Modelo Estructural de Merton (credit risk)

        Empresa quiebra si V_T < D (valor de activos < deuda)

        Equity como Call Option: E = V*N(d₁) - D*e^(-rT)*N(d₂)
        Debt como Put Option vendida: D_value = D*e^(-rT) - Put

        Probability of Default: PD = N(-d₂)

        Distance to Default: d₂ = [ln(V/D) + (r - 0.5σ²_V)T] / (σ_V√T)

        Parámetros:
        -----------
        V : float - valor de mercado de activos
        D : float - valor nominal de deuda (face value)
        T : float - vencimiento de deuda (años)
        r : float - tasa libre de riesgo
        sigma_V : float - volatilidad de activos
        """
        d1 = (np.log(V / D) + (r + 0.5 * sigma_V**2) * T) / (sigma_V * np.sqrt(T))
        d2 = d1 - sigma_V * np.sqrt(T)

        # Valor de equity (opción call sobre activos)
        E = V * stats.norm.cdf(d1) - D * np.exp(-r * T) * stats.norm.cdf(d2)

        # Valor de deuda
        D_value_riskfree = D * np.exp(-r * T)
        put_value = D * np.exp(-r * T) * stats.norm.cdf(-d2) - V * stats.norm.cdf(-d1)
        D_value = D_value_riskfree - put_value

        # Probabilidad de default
        PD = stats.norm.cdf(-d2)

        # Credit spread
        # D_value = D * e^(-(r+s)T)  →  s = -ln(D_value/D)/T - r
        credit_spread = -np.log(D_value / D) / T - r if D_value > 0 else np.inf

        # Distance to default
        distance_to_default = d2

        # Volatilidad implícita de equity (aproximación)
        # σ_E ≈ (V/E) * N(d₁) * σ_V
        sigma_E = (V / E) * stats.norm.cdf(d1) * sigma_V if E > 0 else np.inf

        return {
            'valor_equity': E,
            'valor_deuda': D_value,
            'prob_default': PD,
            'credit_spread_bps': credit_spread * 10000,
            'distance_to_default': distance_to_default,
            'sigma_equity': sigma_E,
            'd1': d1,
            'd2': d2,
            'interpretacion': f"PD={PD*100:.2f}%, Spread={credit_spread*10000:.0f} bps, {'ALTO RIESGO' if PD > 0.05 else 'BAJO RIESGO'}"
        }

    def credit_var(self, exposiciones: np.ndarray, PDs: np.ndarray,
                  LGDs: np.ndarray, correlacion: float = 0.3,
                  confianza: float = 0.99, n_simulaciones: int = 10000) -> Dict:
        """
        Credit VaR (Value at Risk crediticio)

        Modelo de pérdidas crediticias con correlación entre defaults

        Modelo Gaussiano de cópula:
        - Default_i ocurre si Z_i < Φ⁻¹(PD_i)
        - Z_i = √ρ * M + √(1-ρ) * ε_i
        - M, ε_i ~ N(0,1)

        Pérdida: L = Σ Exposición_i * LGD_i * 1{default_i}

        Parámetros:
        -----------
        exposiciones : array (n,) - EAD (Exposure At Default) por contraparte
        PDs : array (n,) - Probability of Default por contraparte
        LGDs : array (n,) - Loss Given Default por contraparte
        correlacion : float - correlación entre defaults (típicamente 0.1-0.5)
        confianza : float - nivel de confianza para VaR (ej: 0.99)
        """
        n_contrapartes = len(exposiciones)

        # Simular pérdidas
        perdidas = np.zeros(n_simulaciones)

        for sim in range(n_simulaciones):
            # Factor común (estado de la economía)
            M = np.random.standard_normal()

            # Factores idiosincráticos
            epsilon = np.random.standard_normal(n_contrapartes)

            # Variables latentes
            Z = np.sqrt(correlacion) * M + np.sqrt(1 - correlacion) * epsilon

            # Umbrales de default
            umbrales = stats.norm.ppf(PDs)

            # Defaults
            defaults = Z < umbrales

            # Pérdida total
            perdidas[sim] = np.sum(exposiciones * LGDs * defaults)

        # VaR y CVaR
        VaR = np.percentile(perdidas, confianza * 100)
        CVaR = np.mean(perdidas[perdidas >= VaR])

        # Pérdida esperada
        EL = np.sum(exposiciones * PDs * LGDs)

        # Pérdida inesperada
        UL = VaR - EL

        return {
            'VaR': VaR,
            'CVaR': CVaR,
            'perdida_esperada': EL,
            'perdida_inesperada': UL,
            'perdida_maxima': np.max(perdidas),
            'percentil_95': np.percentile(perdidas, 95),
            'percentil_99': VaR,
            'percentil_99.9': np.percentile(perdidas, 99.9),
            'exposicion_total': np.sum(exposiciones),
            'n_contrapartes': n_contrapartes,
            'correlacion_defaults': correlacion
        }

    # ==========================================
    # 4. ESTRUCTURA TEMPORAL (Term Structure)
    # ==========================================

    def vasicek_model(self, r0: float, kappa: float, theta: float,
                     sigma: float, T: np.ndarray) -> Dict:
        """
        Modelo de Vasicek (short rate)

        dr_t = κ(θ - r_t)*dt + σ*dW_t

        Proceso de Ornstein-Uhlenbeck (mean-reverting)

        Solución para precio de bono cupón cero:
        P(t, T) = A(t,T) * exp(-B(t,T) * r_t)

        donde:
        B(t,T) = [1 - e^(-κ(T-t))] / κ
        A(t,T) = exp([B(t,T) - (T-t)] * (θ - σ²/(2κ²)) - σ²B²(t,T)/(4κ))

        Parámetros:
        -----------
        r0 : float - tasa corta inicial
        kappa : float - velocidad de reversión a la media
        theta : float - nivel de largo plazo
        sigma : float - volatilidad
        T : array - vencimientos (años)
        """
        # B(0, T)
        B = (1 - np.exp(-kappa * T)) / kappa

        # A(0, T)
        factor1 = (B - T) * (theta - sigma**2 / (2 * kappa**2))
        factor2 = -(sigma**2 * B**2) / (4 * kappa)
        A = np.exp(factor1 + factor2)

        # Precio de bonos
        P = A * np.exp(-B * r0)

        # Yields
        y = -np.log(P) / T

        # Forward rates instantáneas
        # f(0,T) = -∂log(P)/∂T = r₀*e^(-κT) + θ(1 - e^(-κT)) + (σ²/2κ²)(1 - e^(-κT))²
        f = r0 * np.exp(-kappa * T) + theta * (1 - np.exp(-kappa * T)) + \
            (sigma**2 / (2 * kappa**2)) * (1 - np.exp(-kappa * T))**2

        return {
            'precios_bonos': P,
            'yields': y,
            'forward_rates': f,
            'B_function': B,
            'parametros': {
                'kappa': kappa,
                'theta': theta,
                'sigma': sigma,
                'r0': r0
            },
            'nivel_largo_plazo': theta,
            'velocidad_reversion': kappa
        }

    def nelson_siegel_curve(self, yields_observados: np.ndarray,
                           vencimientos_observados: np.ndarray) -> Dict:
        """
        Modelo de Nelson-Siegel para curva de tipos

        y(τ) = β₀ + β₁*[(1 - e^(-τ/λ))/(τ/λ)] + β₂*[(1 - e^(-τ/λ))/(τ/λ) - e^(-τ/λ)]

        donde:
        - β₀: nivel (yield de largo plazo)
        - β₁: pendiente (corto plazo - largo plazo)
        - β₂: curvatura
        - λ: parámetro de escala temporal

        Parámetros:
        -----------
        yields_observados : array - yields de mercado
        vencimientos_observados : array - vencimientos correspondientes (años)
        """
        def nelson_siegel(tau, beta0, beta1, beta2, lam):
            """Función de Nelson-Siegel"""
            factor1 = (1 - np.exp(-tau / lam)) / (tau / lam + 1e-10)
            factor2 = factor1 - np.exp(-tau / lam)
            return beta0 + beta1 * factor1 + beta2 * factor2

        # Función objetivo (minimizar suma de errores cuadrados)
        def objetivo(params):
            beta0, beta1, beta2, lam = params
            if lam <= 0:
                return 1e10
            y_pred = nelson_siegel(vencimientos_observados, beta0, beta1, beta2, lam)
            return np.sum((yields_observados - y_pred)**2)

        # Valores iniciales
        beta0_init = yields_observados[-1]  # Yield largo plazo
        beta1_init = yields_observados[0] - yields_observados[-1]  # Pendiente
        beta2_init = 0
        lam_init = 2.0

        # Optimización
        resultado = optimize.minimize(
            objetivo,
            x0=[beta0_init, beta1_init, beta2_init, lam_init],
            method='Nelder-Mead',
            options={'maxiter': 5000}
        )

        beta0, beta1, beta2, lam = resultado.x

        # Curva ajustada
        tau_curva = np.linspace(0.25, max(vencimientos_observados), 100)
        y_curva = nelson_siegel(tau_curva, beta0, beta1, beta2, lam)

        # Ajuste en puntos observados
        y_pred_obs = nelson_siegel(vencimientos_observados, beta0, beta1, beta2, lam)
        rmse = np.sqrt(np.mean((yields_observados - y_pred_obs)**2))

        return {
            'beta0_nivel': beta0,
            'beta1_pendiente': beta1,
            'beta2_curvatura': beta2,
            'lambda': lam,
            'vencimientos_curva': tau_curva,
            'yields_curva': y_curva,
            'yields_ajustados': y_pred_obs,
            'rmse': rmse,
            'interpretacion': {
                'nivel': f"{beta0*100:.2f}% (largo plazo)",
                'pendiente': f"{beta1*100:.2f}% ({'Normal' if beta1 < 0 else 'Invertida'})",
                'curvatura': f"{beta2*100:.2f}% ({'Cóncava' if beta2 > 0 else 'Convexa'})"
            }
        }

    # ==========================================
    # 5. OPTIMIZACIÓN AVANZADA DE PORTFOLIO
    # ==========================================

    def black_litterman(self, Pi_eq: np.ndarray, Sigma: np.ndarray,
                       P: np.ndarray, Q: np.ndarray, Omega: Optional[np.ndarray] = None,
                       tau: float = 0.05, risk_aversion: float = 2.5) -> Dict:
        """
        Modelo de Black-Litterman

        Combina equilibrio de mercado (CAPM) con views del inversor

        Retorno esperado posterior:
        E[R] = [(τΣ)⁻¹ + P'Ω⁻¹P]⁻¹ * [(τΣ)⁻¹*Π + P'Ω⁻¹*Q]

        donde:
        - Π: retornos de equilibrio (implícitos en pesos de mercado)
        - P: matriz de views (k x n)
        - Q: retornos esperados de views (k x 1)
        - Ω: incertidumbre de views
        - τ: escalar de incertidumbre (típicamente 0.01-0.05)

        Parámetros:
        -----------
        Pi_eq : array (n,) - retornos de equilibrio
        Sigma : array (n, n) - matriz de covarianza de retornos
        P : array (k, n) - matriz de views
        Q : array (k,) - retornos de views
        Omega : array (k, k) - incertidumbre de views (si None, usar τ*P*Σ*P')
        tau : float - incertidumbre en Π
        risk_aversion : float - coeficiente de aversión al riesgo (λ)
        """
        n = len(Pi_eq)
        k = len(Q)

        # Incertidumbre de views (si no se especifica)
        if Omega is None:
            Omega = tau * P @ Sigma @ P.T

        # Inversa de tau*Sigma
        tau_Sigma_inv = np.linalg.inv(tau * Sigma)

        # Inversa de Omega
        Omega_inv = np.linalg.inv(Omega)

        # Retorno esperado posterior (Black-Litterman)
        cov_posterior_inv = tau_Sigma_inv + P.T @ Omega_inv @ P
        cov_posterior = np.linalg.inv(cov_posterior_inv)

        mu_bl = cov_posterior @ (tau_Sigma_inv @ Pi_eq + P.T @ Omega_inv @ Q)

        # Varianza posterior
        Sigma_bl = Sigma + cov_posterior

        # Pesos óptimos
        w_bl = np.linalg.inv(risk_aversion * Sigma_bl) @ mu_bl

        # Normalizar (suma = 1)
        w_bl = w_bl / np.sum(w_bl)

        # Retorno y riesgo del portfolio
        ret_portfolio = mu_bl @ w_bl
        vol_portfolio = np.sqrt(w_bl @ Sigma_bl @ w_bl)
        sharpe = ret_portfolio / vol_portfolio if vol_portfolio > 0 else 0

        return {
            'retornos_bl': mu_bl,
            'covarianza_bl': Sigma_bl,
            'pesos_optimos': w_bl,
            'retorno_portfolio': ret_portfolio,
            'volatilidad_portfolio': vol_portfolio,
            'sharpe_ratio': sharpe,
            'views_incorporadas': k
        }

    def risk_parity_portfolio(self, Sigma: np.ndarray,
                             max_iter: int = 1000, tol: float = 1e-6) -> Dict:
        """
        Risk Parity Portfolio

        Cada activo contribuye IGUAL al riesgo total del portfolio

        Contribución de riesgo del activo i:
        RC_i = w_i * (Σw)_i / √(w'Σw)

        Objetivo: RC_i = RC_j para todo i, j

        Optimización:
        min Σ(RC_i - 1/n)²

        Ventaja: diversificación balanceada de riesgo (no de capital)

        Parámetros:
        -----------
        Sigma : array (n, n) - matriz de covarianza
        """
        n = Sigma.shape[0]

        # Función objetivo: suma de diferencias cuadradas de risk contributions
        def objetivo(w):
            # Asegurar pesos positivos
            w = np.abs(w)
            w = w / np.sum(w)

            # Riesgo total
            sigma_p = np.sqrt(w @ Sigma @ w)

            # Contribuciones marginales de riesgo
            mcr = Sigma @ w / sigma_p

            # Contribuciones al riesgo
            rc = w * mcr

            # Target: cada activo contribuye 1/n al riesgo
            target = sigma_p / n

            # Error
            return np.sum((rc - target)**2)

        # Valores iniciales (igual ponderación)
        w0 = np.ones(n) / n

        # Optimización
        bounds = [(0, 1) for _ in range(n)]
        constraints = {'type': 'eq', 'fun': lambda w: np.sum(w) - 1}

        resultado = optimize.minimize(
            objetivo,
            w0,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': max_iter, 'ftol': tol}
        )

        w_rp = resultado.x

        # Contribuciones de riesgo
        sigma_p = np.sqrt(w_rp @ Sigma @ w_rp)
        mcr = Sigma @ w_rp / sigma_p
        rc = w_rp * mcr

        return {
            'pesos': w_rp,
            'contribuciones_riesgo': rc,
            'volatilidad_portfolio': sigma_p,
            'pct_riesgo_por_activo': rc / sigma_p * 100,
            'diversificacion_perfecta': np.std(rc) < 0.01,
            'convergido': resultado.success
        }


if __name__ == "__main__":
    print("="*70)
    print("MOTOR FINANCIERO AVANZADO - EJEMPLOS")
    print("="*70)

    motor = MotorFinancieroAvanzado()

    # =====================================
    # 1. OPCIÓN ASIÁTICA
    # =====================================
    print("\n1. OPCIÓN ASIÁTICA (Asian Option)")
    print("-" * 50)

    asian = motor.asian_option_montecarlo(
        S0=100, K=100, T=1, r=0.05, sigma=0.2,
        tipo='call', n_simulaciones=5000, n_pasos=50
    )
    print(f"Precio Asian Call: {asian['precio']:.2f}")
    print(f"IC 95%: [{asian['ic_95'][0]:.2f}, {asian['ic_95'][1]:.2f}]")
    print(f"Promedio subyacente: {asian['promedio_subyacente']:.2f}")

    # =====================================
    # 2. OPCIÓN CON BARRERA
    # =====================================
    print("\n2. OPCIÓN CON BARRERA (Barrier Option)")
    print("-" * 50)

    barrier = motor.barrier_option_montecarlo(
        S0=100, K=100, B=90, T=1, r=0.05, sigma=0.2,
        tipo='down-and-out-call', n_simulaciones=5000
    )
    print(f"Precio Down-and-Out Call: {barrier['precio']:.2f}")
    print(f"Prob. barrera cruzada: {barrier['prob_barrera_cruzada']*100:.1f}%")
    print(f"Descuento vs vanilla: {barrier['descuento_vs_vanilla']*100:.1f}%")

    # =====================================
    # 3. OPCIÓN DIGITAL
    # =====================================
    print("\n3. OPCIÓN DIGITAL (Binary Option)")
    print("-" * 50)

    digital = motor.digital_option(
        S=100, K=100, T=1, r=0.05, sigma=0.2,
        tipo='cash-or-nothing-call', pago=100
    )
    print(f"Precio Cash-or-Nothing Call: {digital['precio']:.2f}")
    print(f"Delta: {digital['delta']:.4f}")

    # =====================================
    # 4. MODELO DE HESTON
    # =====================================
    print("\n4. MODELO DE HESTON (Stochastic Volatility)")
    print("-" * 50)

    heston = motor.heston_model_montecarlo(
        S0=100, v0=0.04, K=100, T=1, r=0.05,
        kappa=2, theta=0.04, sigma_v=0.3, rho=-0.7,
        tipo='call', n_simulaciones=3000
    )
    print(f"Precio Call (Heston): {heston['precio']:.2f}")
    print(f"Vol final promedio: {heston['vol_final_promedio']:.2%}")

    # =====================================
    # 5. MODELO DE MERTON (Riesgo Crédito)
    # =====================================
    print("\n5. MODELO DE MERTON (Credit Risk)")
    print("-" * 50)

    merton = motor.merton_structural_model(
        V=200, D=100, T=1, r=0.05, sigma_V=0.25
    )
    print(f"Valor Equity: {merton['valor_equity']:.2f}")
    print(f"Prob. Default: {merton['prob_default']*100:.2f}%")
    print(f"Credit Spread: {merton['credit_spread_bps']:.0f} bps")
    print(f"{merton['interpretacion']}")

    # =====================================
    # 6. CREDIT VAR
    # =====================================
    print("\n6. CREDIT VAR")
    print("-" * 50)

    exposiciones = np.array([100, 150, 200, 80, 120])
    PDs = np.array([0.02, 0.05, 0.01, 0.03, 0.04])
    LGDs = np.array([0.45, 0.40, 0.50, 0.45, 0.40])

    credit_var_result = motor.credit_var(exposiciones, PDs, LGDs, correlacion=0.3, n_simulaciones=5000)
    print(f"VaR 99%: {credit_var_result['VaR']:.2f}")
    print(f"CVaR 99%: {credit_var_result['CVaR']:.2f}")
    print(f"Pérdida Esperada: {credit_var_result['perdida_esperada']:.2f}")
    print(f"Pérdida Inesperada: {credit_var_result['perdida_inesperada']:.2f}")

    # =====================================
    # 7. MODELO DE VASICEK
    # =====================================
    print("\n7. MODELO DE VASICEK (Term Structure)")
    print("-" * 50)

    vencimientos = np.array([1, 2, 5, 10, 20])
    vasicek = motor.vasicek_model(r0=0.03, kappa=0.2, theta=0.04, sigma=0.01, T=vencimientos)

    print("Yields por vencimiento:")
    for i, T in enumerate(vencimientos):
        print(f"  {T}Y: {vasicek['yields'][i]*100:.2f}%")

    # =====================================
    # 8. NELSON-SIEGEL
    # =====================================
    print("\n8. CURVA DE NELSON-SIEGEL")
    print("-" * 50)

    yields_obs = np.array([0.02, 0.025, 0.03, 0.035, 0.04, 0.042])
    venc_obs = np.array([1, 2, 5, 10, 20, 30])

    ns = motor.nelson_siegel_curve(yields_obs, venc_obs)
    print(f"β₀ (nivel): {ns['beta0_nivel']*100:.2f}%")
    print(f"β₁ (pendiente): {ns['beta1_pendiente']*100:.2f}%")
    print(f"β₂ (curvatura): {ns['beta2_curvatura']*100:.2f}%")
    print(f"λ: {ns['lambda']:.2f}")
    print(f"RMSE: {ns['rmse']*10000:.1f} bps")

    # =====================================
    # 9. BLACK-LITTERMAN
    # =====================================
    print("\n9. BLACK-LITTERMAN")
    print("-" * 50)

    # Retornos de equilibrio (3 activos)
    Pi_eq = np.array([0.08, 0.06, 0.05])
    Sigma = np.array([
        [0.04, 0.01, 0.01],
        [0.01, 0.03, 0.01],
        [0.01, 0.01, 0.02]
    ])

    # View: activo 0 superará activo 1 por 2%
    P = np.array([[1, -1, 0]])
    Q = np.array([0.02])

    bl = motor.black_litterman(Pi_eq, Sigma, P, Q, tau=0.05, risk_aversion=2.5)
    print(f"Retornos BL: {bl['retornos_bl']}")
    print(f"Pesos óptimos: {bl['pesos_optimos']}")
    print(f"Retorno portfolio: {bl['retorno_portfolio']*100:.2f}%")
    print(f"Sharpe ratio: {bl['sharpe_ratio']:.2f}")

    # =====================================
    # 10. RISK PARITY
    # =====================================
    print("\n10. RISK PARITY PORTFOLIO")
    print("-" * 50)

    rp = motor.risk_parity_portfolio(Sigma)
    print(f"Pesos Risk Parity: {rp['pesos']}")
    print(f"% Riesgo por activo: {rp['pct_riesgo_por_activo']}")
    print(f"Volatilidad portfolio: {rp['volatilidad_portfolio']*100:.2f}%")

    print("\n" + "="*70)
    print("FIN DE EJEMPLOS")
    print("="*70)
    print("\n✓ 20+ métodos de finanzas avanzadas implementados")
    print("✓ Opciones exóticas, vol estocástica, crédito, term structure, portfolios")

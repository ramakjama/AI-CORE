"""
MOTOR ESTADÍSTICO - EXTENSIÓN 1
Series Temporales Avanzadas + Econometría de Series + Cointegración
"""

import numpy as np
from scipy import stats, signal
from scipy.linalg import cholesky


class MotorSeriesTemporalesAvanzadas:
    """Series temporales: VAR, VECM, GARCH, State-Space, Wavelets, Cambio estructural"""

    def __init__(self):
        self.modelos_entrenados = {}

    # ========================================================================
    # VAR (Vector Autoregression) y VECM
    # ========================================================================

    def var_estimacion(self, data, p=1):
        """
        VAR(p): Vector Autoregression
        Y_t = A_1*Y_{t-1} + ... + A_p*Y_{t-p} + e_t
        """
        T, n = data.shape

        # Construir matriz de rezagos
        Y = data[p:, :]
        X = np.column_stack([data[p-i-1:-i-1, :] if i < p-1 else data[:T-p, :]
                            for i in range(p)])
        X = np.column_stack([np.ones((T-p, 1)), X])

        # Estimación OLS
        B = np.linalg.lstsq(X, Y, rcond=None)[0]
        residuos = Y - X @ B
        Sigma = (residuos.T @ residuos) / (T - p - n*p - 1)

        return {
            'coeficientes': B,
            'Sigma': Sigma,
            'residuos': residuos,
            'n_variables': n,
            'p_lags': p,
            'log_likelihood': self._log_likelihood_var(residuos, Sigma)
        }

    def _log_likelihood_var(self, residuos, Sigma):
        """Log-likelihood de VAR"""
        T = len(residuos)
        n = residuos.shape[1]

        det_Sigma = np.linalg.det(Sigma)
        if det_Sigma <= 0:
            return -np.inf

        ll = -0.5 * T * n * np.log(2*np.pi) - 0.5 * T * np.log(det_Sigma)
        ll -= 0.5 * np.trace(residuos.T @ residuos @ np.linalg.inv(Sigma))

        return ll

    def granger_causality_test(self, y, x, max_lag=5):
        """
        Test de causalidad de Granger: ¿X causa Y?
        H0: X no causa (en sentido Granger) a Y
        """
        n = len(y)
        resultados = []

        for lag in range(1, max_lag + 1):
            # Modelo restringido: Y ~ lags(Y)
            Y_datos = y[lag:]
            X_restringido = np.column_stack([y[lag-i:-i] if i < lag else y[:n-lag]
                                            for i in range(1, lag+1)])
            X_restringido = np.column_stack([np.ones(n-lag), X_restringido])

            # Modelo no restringido: Y ~ lags(Y) + lags(X)
            X_completo = np.column_stack([X_restringido[:, 1:],
                                         *[x[lag-i:-i] if i < lag else x[:n-lag]
                                           for i in range(1, lag+1)]])
            X_completo = np.column_stack([np.ones(n-lag), X_completo])

            # Estimación
            beta_rest = np.linalg.lstsq(X_restringido, Y_datos, rcond=None)[0]
            beta_full = np.linalg.lstsq(X_completo, Y_datos, rcond=None)[0]

            rss_rest = np.sum((Y_datos - X_restringido @ beta_rest)**2)
            rss_full = np.sum((Y_datos - X_completo @ beta_full)**2)

            # F-test
            q = lag  # Restricciones (lags de X)
            df1 = q
            df2 = n - lag - X_completo.shape[1]

            if df2 > 0 and rss_full > 0:
                F_stat = ((rss_rest - rss_full) / q) / (rss_full / df2)
                p_value = 1 - stats.f.cdf(F_stat, df1, df2)
            else:
                F_stat = np.nan
                p_value = np.nan

            resultados.append({
                'lag': lag,
                'F_stat': F_stat,
                'p_value': p_value,
                'causa_granger': p_value < 0.05 if not np.isnan(p_value) else None
            })

        return resultados

    def johansen_cointegration(self, data, det_order=0, k_ar_diff=1):
        """
        Test de cointegración de Johansen
        H0: r vectores de cointegración (vs H1: r+1)
        """
        # Simplificación: implementación básica
        # En producción usar statsmodels

        nobs, neqs = data.shape

        # Diferencias y rezagos
        diff_data = np.diff(data, axis=0)

        # Matrices de momentos
        S00 = (diff_data.T @ diff_data) / nobs

        # Eigenvalores (simplificado)
        eigenvalues = np.linalg.eigvalsh(S00)
        eigenvalues = np.sort(eigenvalues)[::-1]

        # Trace statistic
        trace_stats = []
        for r in range(neqs):
            trace = -nobs * np.sum(np.log(1 - eigenvalues[r:]))
            trace_stats.append(trace)

        return {
            'eigenvalues': eigenvalues,
            'trace_statistics': trace_stats,
            'max_eigenvalue_stats': -nobs * np.log(1 - eigenvalues),
            'interpretacion': 'Ver tablas críticas de Johansen para decisión'
        }

    # ========================================================================
    # GARCH y Volatilidad
    # ========================================================================

    def garch_11(self, retornos, max_iter=1000):
        """
        GARCH(1,1): σ²_t = ω + α*ε²_{t-1} + β*σ²_{t-1}
        Estimación por MLE (simplificada)
        """
        n = len(retornos)

        # Inicialización
        omega = np.var(retornos) * 0.05
        alpha = 0.1
        beta = 0.85

        # Varianza condicional inicial
        sigma2 = np.zeros(n)
        sigma2[0] = np.var(retornos)

        def garch_likelihood(params):
            omega, alpha, beta = params

            # Restricciones
            if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
                return 1e10

            sigma2_temp = np.zeros(n)
            sigma2_temp[0] = np.var(retornos)

            for t in range(1, n):
                sigma2_temp[t] = omega + alpha * retornos[t-1]**2 + beta * sigma2_temp[t-1]

                if sigma2_temp[t] <= 0:
                    return 1e10

            # Negative log-likelihood
            ll = -0.5 * np.sum(np.log(2*np.pi*sigma2_temp) + retornos**2/sigma2_temp)
            return -ll

        # Optimización
        from scipy.optimize import minimize

        result = minimize(garch_likelihood, [omega, alpha, beta],
                         method='L-BFGS-B',
                         bounds=[(1e-6, None), (0, 0.3), (0, 0.95)])

        if result.success:
            omega_opt, alpha_opt, beta_opt = result.x

            # Calcular volatilidad con parámetros óptimos
            for t in range(1, n):
                sigma2[t] = omega_opt + alpha_opt * retornos[t-1]**2 + beta_opt * sigma2[t-1]

            return {
                'omega': omega_opt,
                'alpha': alpha_opt,
                'beta': beta_opt,
                'volatilidad': np.sqrt(sigma2),
                'persistencia': alpha_opt + beta_opt,
                'varianza_incondicional': omega_opt / (1 - alpha_opt - beta_opt),
                'log_likelihood': -result.fun
            }
        else:
            return {'error': 'No convergió', 'message': result.message}

    def egarch_11(self, retornos):
        """
        EGARCH(1,1): permite efectos asimétricos (leverage effect)
        log(σ²_t) = ω + α*|z_{t-1}| + γ*z_{t-1} + β*log(σ²_{t-1})
        """
        # Implementación simplificada
        n = len(retornos)

        # Placeholder: en producción usar arch package
        return {
            'metodo': 'EGARCH(1,1)',
            'nota': 'Requiere arch package para implementación completa',
            'permite_asimetria': True
        }

    # ========================================================================
    # State-Space y Filtro de Kalman
    # ========================================================================

    def kalman_filter_univariate(self, observaciones, F, H, Q, R, x0, P0):
        """
        Filtro de Kalman univariante

        State equation: x_t = F*x_{t-1} + w_t,  w_t ~ N(0, Q)
        Obs equation:   y_t = H*x_t + v_t,      v_t ~ N(0, R)
        """
        n = len(observaciones)

        # Inicialización
        x_pred = np.zeros(n)
        x_filt = np.zeros(n)
        P_pred = np.zeros(n)
        P_filt = np.zeros(n)

        x_filt[0] = x0
        P_filt[0] = P0

        # Filtrado
        for t in range(1, n):
            # Predicción
            x_pred[t] = F * x_filt[t-1]
            P_pred[t] = F * P_filt[t-1] * F + Q

            # Actualización
            y_pred = H * x_pred[t]
            innovation = observaciones[t] - y_pred
            S = H * P_pred[t] * H + R

            K = P_pred[t] * H / S  # Ganancia de Kalman

            x_filt[t] = x_pred[t] + K * innovation
            P_filt[t] = (1 - K * H) * P_pred[t]

        return {
            'estados_filtrados': x_filt,
            'estados_predichos': x_pred,
            'varianza_filtrada': P_filt,
            'varianza_predicha': P_pred,
            'log_likelihood': self._kalman_loglik(observaciones, x_pred, P_pred, H, R)
        }

    def _kalman_loglik(self, y, x_pred, P_pred, H, R):
        """Log-likelihood del filtro de Kalman"""
        n = len(y)
        ll = 0

        for t in range(1, n):
            y_pred = H * x_pred[t]
            v = y[t] - y_pred
            S = H * P_pred[t] * H + R

            if S > 0:
                ll += -0.5 * (np.log(2*np.pi) + np.log(S) + v**2/S)

        return ll

    def modelo_estructural_local_level(self, serie):
        """
        Modelo estructural: Local Level
        y_t = μ_t + ε_t
        μ_t = μ_{t-1} + η_t
        """
        # Kalman filter con F=1, H=1
        # Estimar Q y R por MLE (simplificado)

        var_serie = np.var(serie)
        Q = var_serie * 0.1  # Varianza nivel
        R = var_serie * 0.9  # Varianza observación

        resultado = self.kalman_filter_univariate(
            serie, F=1, H=1, Q=Q, R=R,
            x0=serie[0], P0=var_serie
        )

        return {
            'nivel': resultado['estados_filtrados'],
            'Q': Q,
            'R': R,
            'signal_to_noise': Q / R
        }

    # ========================================================================
    # Wavelets y Análisis Frecuencia
    # ========================================================================

    def wavelet_decomposition(self, serie, wavelet='db4', level=3):
        """
        Descomposición wavelet (DWT)
        Requiere pywt (opcional)
        """
        try:
            import pywt

            coeffs = pywt.wavedec(serie, wavelet, level=level)

            # Reconstrucción por nivel
            reconstrucciones = []
            for i in range(len(coeffs)):
                coeff_list = [np.zeros_like(c) if j != i else c
                             for j, c in enumerate(coeffs)]
                rec = pywt.waverec(coeff_list, wavelet)
                reconstrucciones.append(rec[:len(serie)])

            return {
                'coeficientes': coeffs,
                'reconstrucciones_por_nivel': reconstrucciones,
                'energia_por_nivel': [np.sum(c**2) for c in coeffs]
            }
        except ImportError:
            return {
                'error': 'pywt no instalado',
                'install': 'pip install PyWavelets'
            }

    def periodogram(self, serie, fs=1.0):
        """
        Periodograma (análisis espectral)
        """
        freqs, pxx = signal.periodogram(serie, fs=fs)

        # Frecuencia dominante
        idx_max = np.argmax(pxx[1:]) + 1  # Ignorar freq=0
        freq_dominante = freqs[idx_max]
        periodo_dominante = 1 / freq_dominante if freq_dominante > 0 else np.inf

        return {
            'frecuencias': freqs,
            'densidad_espectral': pxx,
            'frecuencia_dominante': freq_dominante,
            'periodo_dominante': periodo_dominante
        }

    def spectral_density_welch(self, serie, fs=1.0, nperseg=256):
        """
        Densidad espectral (método de Welch)
        """
        freqs, pxx = signal.welch(serie, fs=fs, nperseg=nperseg)

        return {
            'frecuencias': freqs,
            'densidad_espectral': pxx
        }

    # ========================================================================
    # Cambio Estructural y Ruptura
    # ========================================================================

    def chow_test(self, X, y, breakpoint):
        """
        Test de Chow para cambio estructural
        H0: No hay cambio estructural en breakpoint
        """
        n = len(y)
        k = X.shape[1]

        # Modelo completo
        beta_full = np.linalg.lstsq(X, y, rcond=None)[0]
        rss_full = np.sum((y - X @ beta_full)**2)

        # Modelos separados
        X1, y1 = X[:breakpoint], y[:breakpoint]
        X2, y2 = X[breakpoint:], y[breakpoint:]

        beta1 = np.linalg.lstsq(X1, y1, rcond=None)[0]
        beta2 = np.linalg.lstsq(X2, y2, rcond=None)[0]

        rss1 = np.sum((y1 - X1 @ beta1)**2)
        rss2 = np.sum((y2 - X2 @ beta2)**2)
        rss_separado = rss1 + rss2

        # F-test
        F_stat = ((rss_full - rss_separado) / k) / (rss_separado / (n - 2*k))
        p_value = 1 - stats.f.cdf(F_stat, k, n - 2*k)

        return {
            'F_stat': F_stat,
            'p_value': p_value,
            'cambio_estructural': p_value < 0.05,
            'breakpoint': breakpoint
        }

    def cusum_test(self, residuos, alpha=0.05):
        """
        CUSUM test para estabilidad de parámetros
        """
        n = len(residuos)
        sigma = np.std(residuos)

        # CUSUM
        W = np.cumsum(residuos) / (sigma * np.sqrt(n))

        # Bandas críticas (aproximación)
        c_alpha = 0.948  # Para alpha=0.05
        lower_band = -c_alpha - 2*c_alpha*np.arange(n)/n
        upper_band = c_alpha + 2*c_alpha*np.arange(n)/n

        # Detección de rupturas
        ruptura_detectada = np.any((W < lower_band) | (W > upper_band))

        return {
            'cusum': W,
            'lower_band': lower_band,
            'upper_band': upper_band,
            'ruptura_detectada': ruptura_detectada
        }

    def bai_perron_breakpoints(self, X, y, m_max=5):
        """
        Bai-Perron: detección de múltiples puntos de ruptura
        (Implementación simplificada - en producción usar strucchange)
        """
        n = len(y)

        # Búsqueda de 1 breakpoint
        mejor_bic = np.inf
        mejor_bp = None

        for bp in range(int(n*0.15), int(n*0.85)):  # 15%-85% de la muestra
            chow = self.chow_test(X, y, bp)

            # Aproximación BIC
            k = X.shape[1]
            rss = np.sum((y - X @ np.linalg.lstsq(X, y, rcond=None)[0])**2)
            bic = n * np.log(rss/n) + k * np.log(n)

            if bic < mejor_bic:
                mejor_bic = bic
                mejor_bp = bp

        return {
            'breakpoint': mejor_bp,
            'bic': mejor_bic,
            'nota': 'Implementación simplificada (1 BP). Para múltiples usar strucchange package'
        }

    # ========================================================================
    # Filtros y Suavizado
    # ========================================================================

    def hodrick_prescott_filter(self, serie, lambda_param=1600):
        """
        Filtro Hodrick-Prescott
        Descompone serie en tendencia + ciclo
        """
        n = len(serie)

        # Matriz de diferencias de segundo orden
        D2 = np.zeros((n-2, n))
        for i in range(n-2):
            D2[i, i:i+3] = [1, -2, 1]

        # Solución: tendencia = (I + λ*D2'*D2)^{-1} * y
        I = np.eye(n)
        A = I + lambda_param * (D2.T @ D2)
        tendencia = np.linalg.solve(A, serie)

        ciclo = serie - tendencia

        return {
            'tendencia': tendencia,
            'ciclo': ciclo,
            'lambda': lambda_param
        }

    def baxter_king_filter(self, serie, low=6, high=32, K=12):
        """
        Filtro Baxter-King (band-pass)
        Extrae componente cíclico en frecuencias [low, high]
        """
        # Implementación simplificada usando FFT
        n = len(serie)

        # FFT
        fft_serie = np.fft.fft(serie)
        freqs = np.fft.fftfreq(n)

        # Band-pass filter
        filter_mask = (np.abs(freqs) >= 1/high) & (np.abs(freqs) <= 1/low)
        fft_filtrada = fft_serie * filter_mask

        # IFFT
        ciclo = np.real(np.fft.ifft(fft_filtrada))
        tendencia = serie - ciclo

        return {
            'ciclo': ciclo,
            'tendencia': tendencia,
            'freq_low': low,
            'freq_high': high
        }


# ============================================================================
# EJEMPLO DE USO
# ============================================================================

if __name__ == "__main__":
    print("="*80)
    print("MOTOR SERIES TEMPORALES AVANZADAS")
    print("="*80)

    motor = MotorSeriesTemporalesAvanzadas()

    # Generar datos sintéticos
    np.random.seed(42)
    n = 500

    # Serie temporal con tendencia y ciclo
    t = np.arange(n)
    tendencia = 0.05 * t
    estacionalidad = 10 * np.sin(2*np.pi*t/50)
    ruido = np.random.normal(0, 2, n)
    serie = tendencia + estacionalidad + ruido

    # 1. GARCH
    print("\n1. GARCH(1,1):")
    retornos = np.diff(serie)
    garch = motor.garch_11(retornos)
    if 'omega' in garch:
        print(f"   ω = {garch['omega']:.6f}")
        print(f"   α = {garch['alpha']:.4f}")
        print(f"   β = {garch['beta']:.4f}")
        print(f"   Persistencia = {garch['persistencia']:.4f}")

    # 2. Granger Causality
    print("\n2. GRANGER CAUSALITY:")
    x = np.random.randn(n)
    y = 0.5 * np.roll(x, 1) + np.random.randn(n)  # Y depende de X_{t-1}
    granger = motor.granger_causality_test(y, x, max_lag=3)
    for res in granger:
        print(f"   Lag {res['lag']}: p-value = {res['p_value']:.4f}, Causa = {res['causa_granger']}")

    # 3. Hodrick-Prescott
    print("\n3. FILTRO HODRICK-PRESCOTT:")
    hp = motor.hodrick_prescott_filter(serie)
    print(f"   Varianza ciclo / Varianza serie = {np.var(hp['ciclo'])/np.var(serie):.2%}")

    # 4. Periodogram
    print("\n4. PERIODOGRAMA:")
    periodo = motor.periodogram(serie)
    print(f"   Periodo dominante: {periodo['periodo_dominante']:.1f} observaciones")

    # 5. Kalman Filter (Local Level)
    print("\n5. KALMAN FILTER (LOCAL LEVEL):")
    ll = motor.modelo_estructural_local_level(serie)
    print(f"   Signal-to-noise ratio: {ll['signal_to_noise']:.4f}")

    # 6. CUSUM
    print("\n6. CUSUM TEST:")
    residuos = serie - hp['tendencia']
    cusum = motor.cusum_test(residuos)
    print(f"   Ruptura detectada: {cusum['ruptura_detectada']}")

    print("\n" + "="*80)
    print("EXTENSIÓN 1 OPERATIVA")
    print("="*80)

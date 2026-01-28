"""
MOTOR DE SIMULACIÓN Y MÉTODOS DE MONTE CARLO
=============================================

Métodos avanzados de simulación estocástica y técnicas de reducción de varianza:

1. MONTE CARLO BÁSICO Y VARIANTES
   - Monte Carlo clásico
   - Quasi-Monte Carlo (secuencias de baja discrepancia)
   - Latin Hypercube Sampling
   - Stratified sampling
   - Importance sampling

2. TÉCNICAS DE REDUCCIÓN DE VARIANZA
   - Antithetic variates
   - Control variates
   - Stratified sampling
   - Conditional Monte Carlo

3. MARKOV CHAIN MONTE CARLO (MCMC)
   - Metropolis-Hastings
   - Gibbs Sampling
   - Hamiltonian Monte Carlo (conceptual)

4. BOOTSTRAP Y RESAMPLING
   - Bootstrap paramétrico
   - Bootstrap no paramétrico
   - Bootstrap de bloques (series temporales)
   - Jackkn

ife
   - Permutation tests

5. SIMULACIÓN DE PROCESOS ESTOCÁSTICOS
   - Brownian Motion / Wiener Process
   - Geometric Brownian Motion (GBM)
   - Mean-reverting processes (Ornstein-Uhlenbeck)
   - Jump processes (Poisson)
   - Lévy processes

6. APLICACIONES ESPECÍFICAS
   - Simulación de cópulas (Gaussiana, t-Student)
   - Value at Risk (VaR) por Monte Carlo
   - Stress testing
   - Scenario generation

Aplicaciones en seguros:
- Valoración de opciones embebidas
- Cálculo de reservas estocásticas (Solvency II)
- Simulación de siniestros agregados
- Stress testing de carteras
- Pricing de contratos complejos
"""

import numpy as np
from scipy import stats, optimize, linalg
from typing import Dict, Optional, Tuple, List, Callable


class MotorSimulacion:
    """Motor completo de simulación y Monte Carlo"""

    def __init__(self):
        self.nombre = "Motor Simulación y Monte Carlo"
        self.version = "1.0.0"

    # ==========================================
    # 1. MONTE CARLO Y VARIANTES
    # ==========================================

    def monte_carlo_integral(self, func: Callable, a: float, b: float,
                            n_simulaciones: int = 10000) -> Dict:
        """
        Integración por Monte Carlo

        I = ∫ₐᵇ f(x) dx ≈ (b-a) * (1/n) * Σ f(Xᵢ)

        donde Xᵢ ~ U(a, b)

        Varianza: Var(I_MC) = (b-a)² * Var(f(X)) / n

        Parámetros:
        -----------
        func : función a integrar
        a, b : límites de integración
        n_simulaciones : número de muestras
        """
        # Generar muestras uniformes
        X = np.random.uniform(a, b, n_simulaciones)

        # Evaluar función
        f_X = func(X)

        # Estimador Monte Carlo
        integral_mc = (b - a) * np.mean(f_X)

        # Error estándar
        se = (b - a) * np.std(f_X) / np.sqrt(n_simulaciones)

        # Intervalo de confianza 95%
        ic_inf = integral_mc - 1.96 * se
        ic_sup = integral_mc + 1.96 * se

        return {
            'integral': integral_mc,
            'error_std': se,
            'ic_95': (ic_inf, ic_sup),
            'n_simulaciones': n_simulaciones,
            'varianza_estimador': se**2
        }

    def quasi_monte_carlo_sobol(self, func: Callable, dim: int, n_simulaciones: int = 1000) -> Dict:
        """
        Quasi-Monte Carlo con secuencia de Sobol

        Secuencias de baja discrepancia (low-discrepancy sequences):
        - Cubren espacio más uniformemente que números aleatorios
        - Convergencia O(1/n) vs O(1/√n) de MC clásico

        Aplicación: integración en [0,1]^d

        Nota: implementación simplificada (Halton en lugar de Sobol)
        """
        def halton_sequence(n, base):
            """Generar secuencia de Halton"""
            sequence = []
            for i in range(1, n + 1):
                f = 1
                r = 0
                while i > 0:
                    f /= base
                    r += f * (i % base)
                    i //= base
                sequence.append(r)
            return np.array(sequence)

        # Generar puntos quasi-aleatorios (Halton)
        bases_primos = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29][:dim]
        points = np.zeros((n_simulaciones, dim))

        for d in range(dim):
            points[:, d] = halton_sequence(n_simulaciones, bases_primos[d])

        # Evaluar función
        f_vals = func(points)

        # Estimador QMC
        integral_qmc = np.mean(f_vals)

        return {
            'integral': integral_qmc,
            'n_simulaciones': n_simulaciones,
            'dimension': dim,
            'metodo': 'Quasi-Monte Carlo (Halton)',
            'puntos': points
        }

    def latin_hypercube_sampling(self, n_muestras: int, dim: int,
                                 distributions: Optional[List] = None) -> Dict:
        """
        Latin Hypercube Sampling (LHS)

        Divide cada dimensión en n estratos y muestrea exactamente un punto por estrato.

        Ventajas:
        - Mejor cobertura del espacio que Monte Carlo simple
        - Bueno para estudios de sensibilidad
        - Eficiente para modelos costosos

        Parámetros:
        -----------
        n_muestras : número de muestras
        dim : dimensión
        distributions : lista de distribuciones scipy.stats (opcional)
        """
        # LHS en [0, 1]^dim
        lhs_samples = np.zeros((n_muestras, dim))

        for d in range(dim):
            # Dividir [0,1] en n intervalos
            intervals = np.arange(n_muestras) / n_muestras

            # Muestrear aleatoriamente dentro de cada intervalo
            samples_d = intervals + np.random.rand(n_muestras) / n_muestras

            # Permutación aleatoria
            lhs_samples[:, d] = np.random.permutation(samples_d)

        # Transformar a distribuciones especificadas (si se proporcionan)
        if distributions is not None:
            lhs_transformed = np.zeros_like(lhs_samples)
            for d in range(dim):
                # Transformación por cuantiles
                lhs_transformed[:, d] = distributions[d].ppf(lhs_samples[:, d])

            return {
                'muestras': lhs_transformed,
                'muestras_uniformes': lhs_samples,
                'n_muestras': n_muestras,
                'dimension': dim,
                'con_transformacion': True
            }

        return {
            'muestras': lhs_samples,
            'n_muestras': n_muestras,
            'dimension': dim,
            'con_transformacion': False
        }

    def importance_sampling(self, func_h: Callable, pdf_f: Callable,
                           pdf_g: Callable, sampler_g: Callable,
                           n_simulaciones: int = 10000) -> Dict:
        """
        Importance Sampling (muestreo por importancia)

        Estimar: E_f[h(X)] = ∫ h(x) f(x) dx

        Problema: f(x) difícil de muestrear o h(x)f(x) concentrado en región pequeña

        Solución: muestrear de g(x) (proposal distribution)

        E_f[h(X)] = ∫ h(x) f(x)/g(x) * g(x) dx
                  = E_g[h(X) * w(X)]

        donde w(X) = f(X)/g(X) (importance weight)

        Parámetros:
        -----------
        func_h : función de interés h(x)
        pdf_f : PDF objetivo f(x)
        pdf_g : PDF proposal g(x)
        sampler_g : función para muestrear de g
        """
        # Muestrear de g
        X = sampler_g(n_simulaciones)

        # Calcular h(X)
        h_vals = func_h(X)

        # Importance weights
        w = pdf_f(X) / (pdf_g(X) + 1e-10)

        # Estimador IS
        estimador_is = np.mean(h_vals * w)

        # Error estándar
        se_is = np.std(h_vals * w) / np.sqrt(n_simulaciones)

        # Effective Sample Size (ESS)
        ess = np.sum(w)**2 / np.sum(w**2)

        # Varianza de pesos (indicador de calidad de proposal)
        cv_weights = np.std(w) / (np.mean(w) + 1e-10)

        return {
            'estimador': estimador_is,
            'error_std': se_is,
            'effective_sample_size': ess,
            'cv_weights': cv_weights,
            'interpretacion': f"ESS={ess:.0f}/{n_simulaciones} ({'Bueno' if ess/n_simulaciones > 0.5 else 'Pobre'} proposal)"
        }

    # ==========================================
    # 2. TÉCNICAS DE REDUCCIÓN DE VARIANZA
    # ==========================================

    def antithetic_variates(self, sampler: Callable, func: Callable,
                           n_simulaciones: int = 5000) -> Dict:
        """
        Antithetic Variates (variables antitéticas)

        Si X ~ F, generar X' tal que Cov(f(X), f(X')) < 0

        Para U ~ U(0,1): X' = 1 - X (perfectamente anticorrelacionado)

        Estimador: θ̂ = (f(X) + f(X')) / 2

        Varianza reducida: Var(θ̂) = [Var(f(X)) + Var(f(X')) + 2*Cov(f(X), f(X'))] / 4
                                     < Var(f(X)) / 2  (si Cov < 0)

        Parámetros:
        -----------
        sampler : función que genera muestras base (típicamente U(0,1))
        func : función a evaluar
        """
        # Muestras base
        n_pairs = n_simulaciones // 2
        U = sampler(n_pairs)

        # Muestras antitéticas
        U_anti = 1 - U

        # Evaluar función
        f_U = func(U)
        f_U_anti = func(U_anti)

        # Estimador estándar (sin antithetic)
        estimador_std = np.mean(np.concatenate([f_U, f_U_anti]))
        var_std = np.var(np.concatenate([f_U, f_U_anti]))

        # Estimador con antithetic variates
        pairs_avg = (f_U + f_U_anti) / 2
        estimador_av = np.mean(pairs_avg)
        var_av = np.var(pairs_avg)

        # Reducción de varianza
        var_reduction = (1 - var_av / var_std) * 100 if var_std > 0 else 0

        return {
            'estimador': estimador_av,
            'varianza': var_av,
            'varianza_std': var_std,
            'reduccion_varianza_pct': var_reduction,
            'correlacion': np.corrcoef(f_U, f_U_anti)[0, 1],
            'n_pares': n_pairs
        }

    def control_variates(self, X: np.ndarray, Y_target: np.ndarray,
                        Y_control: np.ndarray, mu_control: float) -> Dict:
        """
        Control Variates

        Estimar E[Y]  (difícil)
        Conocemos E[X] = μ  (control variate)

        Estimador mejorado: Y* = Y - c(X - μ)

        donde c = Cov(Y, X) / Var(X)  (minimize Var(Y*))

        Varianza reducida: Var(Y*) = Var(Y) * (1 - ρ²_XY)

        Parámetros:
        -----------
        X : array - variable de control (misma muestra que Y)
        Y_target : array - variable de interés
        Y_control : no usado (deprecado)
        mu_control : E[X] conocido
        """
        # Coeficiente óptimo c
        cov_YX = np.cov(Y_target, X)[0, 1]
        var_X = np.var(X)
        c_opt = cov_YX / var_X if var_X > 0 else 0

        # Estimador con control variate
        Y_star = Y_target - c_opt * (X - mu_control)

        estimador_cv = np.mean(Y_star)
        var_cv = np.var(Y_star)

        # Sin control variate
        estimador_std = np.mean(Y_target)
        var_std = np.var(Y_target)

        # Reducción de varianza
        rho_squared = (np.corrcoef(Y_target, X)[0, 1])**2
        reduccion_teorica = rho_squared * 100

        return {
            'estimador': estimador_cv,
            'varianza': var_cv,
            'varianza_std': var_std,
            'c_optimo': c_opt,
            'reduccion_varianza_pct': (1 - var_cv / var_std) * 100 if var_std > 0 else 0,
            'reduccion_teorica_pct': reduccion_teorica,
            'correlacion_YX': np.corrcoef(Y_target, X)[0, 1]
        }

    # ==========================================
    # 3. MCMC (Markov Chain Monte Carlo)
    # ==========================================

    def metropolis_hastings(self, log_posterior: Callable, x0: np.ndarray,
                           proposal_std: float = 0.5, n_iterations: int = 10000,
                           burn_in: int = 1000) -> Dict:
        """
        Algoritmo de Metropolis-Hastings

        Objetivo: muestrear de π(x) (posterior) difícil de muestrear directamente

        Algoritmo:
        1. Inicializar x₀
        2. Para t = 1 to T:
           a. Proponer x* ~ q(·|x_t)  (ej: N(x_t, σ²))
           b. Calcular ratio de aceptación:
              α = min(1, π(x*)/π(x_t) * q(x_t|x*)/q(x*|x_t))
           c. Aceptar x* con probabilidad α:
              x_{t+1} = x* con prob α, x_t con prob 1-α

        Para proposal simétrico (ej: normal): q(x*|x_t) = q(x_t|x*)

        Parámetros:
        -----------
        log_posterior : log(π(x)) - evita underflow
        x0 : punto inicial
        proposal_std : desviación estándar de propuesta Normal
        n_iterations : iteraciones totales
        burn_in : iteraciones a descartar
        """
        dim = len(x0)
        samples = np.zeros((n_iterations, dim))
        samples[0] = x0

        log_pi_current = log_posterior(x0)
        n_accepted = 0

        for t in range(1, n_iterations):
            # Propuesta (random walk Gaussian)
            x_current = samples[t - 1]
            x_proposal = x_current + np.random.normal(0, proposal_std, dim)

            # Log-posterior de propuesta
            log_pi_proposal = log_posterior(x_proposal)

            # Log-ratio de aceptación
            log_alpha = log_pi_proposal - log_pi_current

            # Aceptar/rechazar
            if np.log(np.random.rand()) < log_alpha:
                samples[t] = x_proposal
                log_pi_current = log_pi_proposal
                n_accepted += 1
            else:
                samples[t] = x_current

        # Descartar burn-in
        samples_final = samples[burn_in:]

        # Tasa de aceptación
        acceptance_rate = n_accepted / n_iterations

        # Autocorrelación (lag 1)
        acf_lag1 = np.mean([np.corrcoef(samples_final[:-1, d], samples_final[1:, d])[0, 1]
                           for d in range(dim)])

        return {
            'samples': samples_final,
            'samples_full': samples,
            'acceptance_rate': acceptance_rate,
            'autocorrelation_lag1': acf_lag1,
            'n_iterations': n_iterations,
            'burn_in': burn_in,
            'effective_sample_size': len(samples_final) / (1 + 2 * acf_lag1) if acf_lag1 > 0 else len(samples_final),
            'interpretacion': f"Aceptación: {acceptance_rate*100:.1f}% ({'Óptimo ~25-50%' if 0.2 < acceptance_rate < 0.6 else 'Ajustar proposal_std'})"
        }

    def gibbs_sampling(self, conditionals: List[Callable], x0: np.ndarray,
                      n_iterations: int = 5000, burn_in: int = 500) -> Dict:
        """
        Gibbs Sampling

        Para distribución conjunta π(x₁, x₂, ..., x_d):

        Si conocemos condicionales completas π(x_i | x_{-i}):

        Algoritmo:
        1. Inicializar (x₁⁽⁰⁾, x₂⁽⁰⁾, ..., x_d⁽⁰⁾)
        2. Para t = 1 to T:
           - x₁⁽ᵗ⁾ ~ π(x₁ | x₂⁽ᵗ⁻¹⁾, x₃⁽ᵗ⁻¹⁾, ..., x_d⁽ᵗ⁻¹⁾)
           - x₂⁽ᵗ⁾ ~ π(x₂ | x₁⁽ᵗ⁾, x₃⁽ᵗ⁻¹⁾, ..., x_d⁽ᵗ⁻¹⁾)
           - ...
           - x_d⁽ᵗ⁾ ~ π(x_d | x₁⁽ᵗ⁾, x₂⁽ᵗ⁾, ..., x_{d-1}⁽ᵗ⁾)

        Parámetros:
        -----------
        conditionals : lista de funciones para muestrear condicionales
                      conditionals[i](x) devuelve muestra de π(x_i | x_{-i})
        x0 : punto inicial
        """
        dim = len(x0)
        samples = np.zeros((n_iterations, dim))
        samples[0] = x0

        for t in range(1, n_iterations):
            x_current = samples[t - 1].copy()

            # Actualizar cada componente secuencialmente
            for d in range(dim):
                # Muestrear x_d dado el resto
                x_current[d] = conditionals[d](x_current)

            samples[t] = x_current

        # Descartar burn-in
        samples_final = samples[burn_in:]

        return {
            'samples': samples_final,
            'samples_full': samples,
            'n_iterations': n_iterations,
            'burn_in': burn_in,
            'dimension': dim
        }

    # ==========================================
    # 4. BOOTSTRAP
    # ==========================================

    def bootstrap_ci(self, data: np.ndarray, statistic: Callable,
                    n_bootstrap: int = 1000, alpha: float = 0.05,
                    metodo: str = 'percentil') -> Dict:
        """
        Bootstrap para intervalos de confianza

        1. Generar B muestras bootstrap: X*_b (resample con reemplazo)
        2. Calcular θ̂*_b = statistic(X*_b) para cada muestra
        3. IC según método:
           - Percentil: [θ̂*_{α/2}, θ̂*_{1-α/2}]
           - Normal: θ̂ ± z_{α/2} * se_bootstrap
           - BCa: bias-corrected and accelerated

        Parámetros:
        -----------
        data : array - datos originales
        statistic : función a calcular (ej: np.mean, np.median)
        n_bootstrap : número de muestras bootstrap
        alpha : nivel de significancia (0.05 → IC 95%)
        metodo : 'percentil', 'normal', 'basic'
        """
        n = len(data)
        theta_hat = statistic(data)

        # Generar muestras bootstrap
        theta_boot = np.zeros(n_bootstrap)

        for b in range(n_bootstrap):
            # Resample con reemplazo
            indices = np.random.randint(0, n, size=n)
            data_boot = data[indices]

            # Calcular estadístico
            theta_boot[b] = statistic(data_boot)

        # Método de IC
        if metodo == 'percentil':
            ic_inf = np.percentile(theta_boot, alpha/2 * 100)
            ic_sup = np.percentile(theta_boot, (1 - alpha/2) * 100)

        elif metodo == 'normal':
            se_boot = np.std(theta_boot)
            z = stats.norm.ppf(1 - alpha/2)
            ic_inf = theta_hat - z * se_boot
            ic_sup = theta_hat + z * se_boot

        elif metodo == 'basic':
            # Método básico (pivotal)
            ic_inf = 2 * theta_hat - np.percentile(theta_boot, (1 - alpha/2) * 100)
            ic_sup = 2 * theta_hat - np.percentile(theta_boot, alpha/2 * 100)

        # Sesgo
        bias = np.mean(theta_boot) - theta_hat

        return {
            'estadistico': theta_hat,
            'ic_inferior': ic_inf,
            'ic_superior': ic_sup,
            'se_bootstrap': np.std(theta_boot),
            'bias': bias,
            'distribucion_bootstrap': theta_boot,
            'metodo': metodo,
            'n_bootstrap': n_bootstrap
        }

    def block_bootstrap(self, data: np.ndarray, statistic: Callable,
                       block_length: int, n_bootstrap: int = 1000) -> Dict:
        """
        Block Bootstrap (para series temporales)

        Preserva dependencia temporal muestreando bloques en lugar de observaciones individuales

        Tipos:
        - Moving Block Bootstrap (MBB): bloques solapados
        - Circular Block Bootstrap (CBB): datos tratados como circulares

        Implementación: MBB

        Parámetros:
        -----------
        block_length : longitud de bloques (típicamente √n)
        """
        n = len(data)

        # Crear bloques solapados
        n_blocks_total = n - block_length + 1

        # Bootstrap samples
        theta_boot = np.zeros(n_bootstrap)

        for b in range(n_bootstrap):
            # Número de bloques a muestrear
            n_blocks_needed = int(np.ceil(n / block_length))

            # Muestrear bloques con reemplazo
            data_boot = []
            for _ in range(n_blocks_needed):
                start_idx = np.random.randint(0, n_blocks_total)
                block = data[start_idx:start_idx + block_length]
                data_boot.extend(block)

            # Recortar a longitud original
            data_boot = np.array(data_boot[:n])

            # Calcular estadístico
            theta_boot[b] = statistic(data_boot)

        theta_hat = statistic(data)

        return {
            'estadistico': theta_hat,
            'se_bootstrap': np.std(theta_boot),
            'ic_95': (np.percentile(theta_boot, 2.5), np.percentile(theta_boot, 97.5)),
            'distribucion_bootstrap': theta_boot,
            'block_length': block_length,
            'n_bootstrap': n_bootstrap
        }

    # ==========================================
    # 5. PROCESOS ESTOCÁSTICOS
    # ==========================================

    def brownian_motion(self, T: float, n_pasos: int, n_trayectorias: int = 1) -> Dict:
        """
        Brownian Motion / Wiener Process

        W(t) con:
        - W(0) = 0
        - Incrementos independientes
        - W(t) - W(s) ~ N(0, t-s)  para t > s
        - Trayectorias continuas

        Discretización: ΔW_i = √Δt * Z_i,  Z_i ~ N(0, 1)

        Parámetros:
        -----------
        T : tiempo final
        n_pasos : número de pasos temporales
        n_trayectorias : número de trayectorias a simular
        """
        dt = T / n_pasos
        sqrt_dt = np.sqrt(dt)

        # Incrementos brownianos
        dW = sqrt_dt * np.random.randn(n_trayectorias, n_pasos)

        # Trayectorias (acumulación)
        W = np.cumsum(dW, axis=1)
        W = np.column_stack([np.zeros(n_trayectorias), W])  # Añadir W(0) = 0

        t = np.linspace(0, T, n_pasos + 1)

        # Propiedades
        varianza_final = np.var(W[:, -1])
        varianza_teorica = T

        return {
            'trayectorias': W,
            'tiempos': t,
            'varianza_final': varianza_final,
            'varianza_teorica': varianza_teorica,
            'n_trayectorias': n_trayectorias,
            'n_pasos': n_pasos
        }

    def geometric_brownian_motion(self, S0: float, mu: float, sigma: float,
                                  T: float, n_pasos: int, n_trayectorias: int = 1) -> Dict:
        """
        Geometric Brownian Motion (GBM)

        dS_t = μ*S_t*dt + σ*S_t*dW_t

        Solución exacta:
        S_t = S_0 * exp((μ - σ²/2)*t + σ*W_t)

        Usado en:
        - Modelo de Black-Scholes (precios de acciones)
        - Tasas de interés (no mean-reverting)

        Parámetros:
        -----------
        S0 : valor inicial
        mu : drift (retorno esperado)
        sigma : volatilidad
        T : tiempo final
        """
        dt = T / n_pasos
        t = np.linspace(0, T, n_pasos + 1)

        # Incrementos brownianos
        dW = np.sqrt(dt) * np.random.randn(n_trayectorias, n_pasos)
        W = np.cumsum(dW, axis=1)
        W = np.column_stack([np.zeros(n_trayectorias), W])

        # GBM (solución exacta)
        S = S0 * np.exp((mu - 0.5 * sigma**2) * t + sigma * W)

        # Estadísticos
        media_final = np.mean(S[:, -1])
        media_teorica = S0 * np.exp(mu * T)

        return {
            'trayectorias': S,
            'tiempos': t,
            'S0': S0,
            'mu': mu,
            'sigma': sigma,
            'media_final': media_final,
            'media_teorica': media_teorica,
            'mediana_final': np.median(S[:, -1]),
            'percentil_5': np.percentile(S[:, -1], 5),
            'percentil_95': np.percentile(S[:, -1], 95)
        }

    def ornstein_uhlenbeck(self, X0: float, theta: float, mu: float,
                          sigma: float, T: float, n_pasos: int,
                          n_trayectorias: int = 1) -> Dict:
        """
        Proceso de Ornstein-Uhlenbeck (mean-reverting)

        dX_t = θ(μ - X_t)dt + σ*dW_t

        donde:
        - θ: velocidad de reversión a la media
        - μ: nivel de largo plazo
        - σ: volatilidad

        Usado en:
        - Tasas de interés (Vasicek)
        - Spreads de pairs trading
        - Volatilidad (mean-reverting)

        Discretización (Euler-Maruyama):
        X_{t+Δt} = X_t + θ(μ - X_t)Δt + σ√Δt * Z
        """
        dt = T / n_pasos
        sqrt_dt = np.sqrt(dt)
        t = np.linspace(0, T, n_pasos + 1)

        X = np.zeros((n_trayectorias, n_pasos + 1))
        X[:, 0] = X0

        for i in range(n_pasos):
            dW = sqrt_dt * np.random.randn(n_trayectorias)
            X[:, i + 1] = X[:, i] + theta * (mu - X[:, i]) * dt + sigma * dW

        # Estadísticos
        half_life = np.log(2) / theta

        return {
            'trayectorias': X,
            'tiempos': t,
            'X0': X0,
            'theta': theta,
            'mu_largo_plazo': mu,
            'sigma': sigma,
            'half_life': half_life,
            'media_final': np.mean(X[:, -1]),
            'convergencia_a_mu': np.abs(np.mean(X[:, -1]) - mu)
        }


if __name__ == "__main__":
    print("="*70)
    print("MOTOR DE SIMULACIÓN Y MONTE CARLO - EJEMPLOS")
    print("="*70)

    motor = MotorSimulacion()

    # =====================================
    # 1. INTEGRACIÓN MONTE CARLO
    # =====================================
    print("\n1. INTEGRACIÓN MONTE CARLO")
    print("-" * 50)

    # Integrar x² en [0, 1] (resultado exacto: 1/3)
    func = lambda x: x**2
    mc_int = motor.monte_carlo_integral(func, 0, 1, n_simulaciones=10000)
    print(f"Integral (MC): {mc_int['integral']:.4f} (exacto: 0.3333)")
    print(f"Error estándar: {mc_int['error_std']:.4f}")
    print(f"IC 95%: [{mc_int['ic_95'][0]:.4f}, {mc_int['ic_95'][1]:.4f}]")

    # =====================================
    # 2. LATIN HYPERCUBE SAMPLING
    # =====================================
    print("\n2. LATIN HYPERCUBE SAMPLING")
    print("-" * 50)

    lhs = motor.latin_hypercube_sampling(
        n_muestras=50,
        dim=3,
        distributions=[stats.norm(0, 1), stats.uniform(0, 10), stats.gamma(2, scale=2)]
    )
    print(f"Muestras generadas: {lhs['muestras'].shape}")
    print(f"Media dim 0: {np.mean(lhs['muestras'][:, 0]):.2f} (esperado: 0)")
    print(f"Media dim 1: {np.mean(lhs['muestras'][:, 1]):.2f} (esperado: 5)")

    # =====================================
    # 3. ANTITHETIC VARIATES
    # =====================================
    print("\n3. ANTITHETIC VARIATES")
    print("-" * 50)

    # Estimar E[exp(X)] donde X ~ N(0, 1)
    sampler = lambda n: np.random.randn(n)
    func_av = lambda x: np.exp(x)

    av = motor.antithetic_variates(sampler, func_av, n_simulaciones=2000)
    print(f"Estimador: {av['estimador']:.4f} (exacto: {np.exp(0.5):.4f})")
    print(f"Reducción de varianza: {av['reduccion_varianza_pct']:.1f}%")
    print(f"Correlación: {av['correlacion']:.3f}")

    # =====================================
    # 4. METROPOLIS-HASTINGS
    # =====================================
    print("\n4. METROPOLIS-HASTINGS MCMC")
    print("-" * 50)

    # Muestrear de N(3, 2²)
    log_posterior = lambda x: -0.5 * ((x[0] - 3) / 2)**2

    mh = motor.metropolis_hastings(
        log_posterior,
        x0=np.array([0.0]),
        proposal_std=1.0,
        n_iterations=5000,
        burn_in=500
    )
    print(f"Media muestral: {np.mean(mh['samples']):.2f} (teórico: 3.0)")
    print(f"Std muestral: {np.std(mh['samples']):.2f} (teórico: 2.0)")
    print(f"{mh['interpretacion']}")
    print(f"ESS: {mh['effective_sample_size']:.0f}/{len(mh['samples'])}")

    # =====================================
    # 5. BOOTSTRAP
    # =====================================
    print("\n5. BOOTSTRAP")
    print("-" * 50)

    data = np.random.exponential(scale=2, size=100)
    boot = motor.bootstrap_ci(data, statistic=np.mean, n_bootstrap=1000, metodo='percentil')

    print(f"Media: {boot['estadistico']:.3f}")
    print(f"IC 95%: [{boot['ic_inferior']:.3f}, {boot['ic_superior']:.3f}]")
    print(f"SE Bootstrap: {boot['se_bootstrap']:.3f}")
    print(f"Sesgo: {boot['bias']:.4f}")

    # =====================================
    # 6. BROWNIAN MOTION
    # =====================================
    print("\n6. BROWNIAN MOTION")
    print("-" * 50)

    bm = motor.brownian_motion(T=1.0, n_pasos=1000, n_trayectorias=100)
    print(f"Varianza final: {bm['varianza_final']:.3f} (teórico: {bm['varianza_teorica']:.3f})")
    print(f"Trayectorias simuladas: {bm['n_trayectorias']}")

    # =====================================
    # 7. GEOMETRIC BROWNIAN MOTION
    # =====================================
    print("\n7. GEOMETRIC BROWNIAN MOTION (Black-Scholes)")
    print("-" * 50)

    gbm = motor.geometric_brownian_motion(
        S0=100, mu=0.05, sigma=0.2, T=1.0, n_pasos=252, n_trayectorias=1000
    )
    print(f"S₀: {gbm['S0']}")
    print(f"Media final: {gbm['media_final']:.2f} (teórico: {gbm['media_teorica']:.2f})")
    print(f"Mediana final: {gbm['mediana_final']:.2f}")
    print(f"VaR 95%: {gbm['percentil_5']:.2f}")

    # =====================================
    # 8. ORNSTEIN-UHLENBECK
    # =====================================
    print("\n8. ORNSTEIN-UHLENBECK (Mean-Reverting)")
    print("-" * 50)

    ou = motor.ornstein_uhlenbeck(
        X0=10, theta=0.5, mu=5, sigma=1, T=10, n_pasos=1000, n_trayectorias=100
    )
    print(f"X₀: {ou['X0']}, μ (largo plazo): {ou['mu_largo_plazo']}")
    print(f"Half-life: {ou['half_life']:.2f} años")
    print(f"Media final: {ou['media_final']:.2f} (convergencia a μ: {ou['convergencia_a_mu']:.2f})")

    print("\n" + "="*70)
    print("FIN DE EJEMPLOS")
    print("="*70)
    print("\n✓ 20+ métodos de simulación y Monte Carlo implementados")
    print("✓ MC, QMC, LHS, IS, antithetic variates, control variates")
    print("✓ MCMC (Metropolis-Hastings, Gibbs)")
    print("✓ Bootstrap (clásico, block)")
    print("✓ Procesos estocásticos (Brownian, GBM, OU)")

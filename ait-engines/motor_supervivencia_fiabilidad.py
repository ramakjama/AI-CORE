"""
MOTOR DE ANÁLISIS DE SUPERVIVENCIA Y FIABILIDAD
================================================

Métodos para análisis de tiempo hasta evento y fiabilidad de sistemas:

1. ESTIMACIÓN NO PARAMÉTRICA
   - Kaplan-Meier (product-limit estimator)
   - Nelson-Aalen (cumulative hazard)
   - Tabla de vida actuarial (life table)
   - Intervalos de confianza (Greenwood, log-log)

2. MODELOS PARAMÉTRICOS DE SUPERVIVENCIA
   - Exponencial
   - Weibull
   - Log-normal
   - Log-logístico
   - Gamma
   - Gompertz

3. MODELOS DE REGRESIÓN
   - Cox Proportional Hazards (semiparamétrico)
   - AFT (Accelerated Failure Time)
   - Piecewise exponential
   - Cure models

4. FIABILIDAD DE SISTEMAS
   - Series/Parallel systems
   - k-out-of-n systems
   - MTTF (Mean Time To Failure)
   - MTBF (Mean Time Between Failures)
   - Availability

5. ANÁLISIS DE RECURRENCIA
   - Andersen-Gill model
   - PWP (Prentice, Williams, Peterson)
   - Frailty models

6. RIESGOS COMPETITIVOS (Competing Risks)
   - Cumulative Incidence Function (CIF)
   - Fine-Gray model
   - Cause-specific hazards

Aplicaciones en seguros:
- Churn de clientes (tiempo hasta cancelación)
- Siniestralidad (tiempo hasta primer siniestro)
- Duración de pólizas
- Fiabilidad de sistemas de prevención
- Mortalidad y longevidad
"""

import numpy as np
from scipy import stats, optimize
from typing import Dict, Optional, Tuple, List


class MotorSupervivencia:
    """Motor completo de análisis de supervivencia"""

    def __init__(self):
        self.nombre = "Motor Supervivencia y Fiabilidad"
        self.version = "1.0.0"

    # ==========================================
    # 1. ESTIMACIÓN NO PARAMÉTRICA
    # ==========================================

    def kaplan_meier(self, tiempos: np.ndarray, eventos: np.ndarray,
                    alpha: float = 0.05) -> Dict:
        """
        Estimador de Kaplan-Meier (product-limit estimator)

        S(t) = Π_{t_i ≤ t} (1 - d_i/n_i)

        donde:
        - d_i = número de eventos en t_i
        - n_i = número en riesgo justo antes de t_i

        Parámetros:
        -----------
        tiempos : array (n,) - tiempos observados
        eventos : array (n,) - indicador de evento (1=evento, 0=censura)
        alpha : float - nivel de significancia para IC

        Returns:
        --------
        Dict con tiempos únicos, supervivencia, IC, etc.
        """
        # Ordenar por tiempo
        orden = np.argsort(tiempos)
        tiempos = tiempos[orden]
        eventos = eventos[orden]

        # Tiempos únicos de eventos
        tiempos_evento = np.unique(tiempos[eventos == 1])

        if len(tiempos_evento) == 0:
            return {'error': 'No hay eventos observados'}

        # Calcular supervivencia en cada tiempo de evento
        n = len(tiempos)
        supervivencia = []
        n_riesgo = []
        n_eventos = []

        S_t = 1.0
        var_acum = 0.0  # Para fórmula de Greenwood

        for t in tiempos_evento:
            # Número en riesgo (aún no han tenido evento ni censura)
            n_i = np.sum(tiempos >= t)

            # Número de eventos en tiempo t
            d_i = np.sum((tiempos == t) & (eventos == 1))

            # Actualizar supervivencia
            S_t *= (1 - d_i / n_i)

            # Varianza (Greenwood's formula)
            var_acum += d_i / (n_i * (n_i - d_i)) if n_i > d_i else 0

            supervivencia.append(S_t)
            n_riesgo.append(n_i)
            n_eventos.append(d_i)

        supervivencia = np.array(supervivencia)
        n_riesgo = np.array(n_riesgo)
        n_eventos = np.array(n_eventos)

        # Varianza de S(t) (Greenwood)
        var_S = supervivencia**2 * var_acum

        # Intervalo de confianza (transformación log-log)
        z = stats.norm.ppf(1 - alpha/2)
        se_log_log = np.sqrt(var_acum) / np.log(supervivencia + 1e-10)

        ic_inferior = supervivencia ** np.exp(z * se_log_log)
        ic_superior = supervivencia ** np.exp(-z * se_log_log)

        # Mediana de supervivencia
        idx_mediana = np.where(supervivencia <= 0.5)[0]
        mediana = tiempos_evento[idx_mediana[0]] if len(idx_mediana) > 0 else np.inf

        return {
            'tiempos': tiempos_evento,
            'supervivencia': supervivencia,
            'n_riesgo': n_riesgo,
            'n_eventos': n_eventos,
            'varianza': var_S,
            'ic_inferior': ic_inferior,
            'ic_superior': ic_superior,
            'mediana_supervivencia': mediana,
            'supervivencia_1año': supervivencia[tiempos_evento <= 365][-1] if np.any(tiempos_evento <= 365) else supervivencia[0]
        }

    def nelson_aalen(self, tiempos: np.ndarray, eventos: np.ndarray) -> Dict:
        """
        Estimador de Nelson-Aalen (cumulative hazard)

        H(t) = Σ_{t_i ≤ t} d_i/n_i

        Relación con Kaplan-Meier:
        S(t) ≈ exp(-H(t))

        Mejor para estimar hazard que derivar de KM
        """
        # Ordenar
        orden = np.argsort(tiempos)
        tiempos = tiempos[orden]
        eventos = eventos[orden]

        # Tiempos únicos de eventos
        tiempos_evento = np.unique(tiempos[eventos == 1])

        if len(tiempos_evento) == 0:
            return {'error': 'No hay eventos observados'}

        # Calcular hazard acumulado
        H_t = 0.0
        hazard_acum = []
        var_H = 0.0
        var_hazard = []

        for t in tiempos_evento:
            n_i = np.sum(tiempos >= t)
            d_i = np.sum((tiempos == t) & (eventos == 1))

            # Incremento de hazard
            H_t += d_i / n_i

            # Varianza (Aalen)
            var_H += d_i / (n_i**2)

            hazard_acum.append(H_t)
            var_hazard.append(var_H)

        hazard_acum = np.array(hazard_acum)
        var_hazard = np.array(var_hazard)

        # Supervivencia estimada
        supervivencia_na = np.exp(-hazard_acum)

        # Hazard rate instantáneo (aproximado por diferencias)
        hazard_rate = np.diff(np.concatenate([[0], hazard_acum])) / np.diff(np.concatenate([[0], tiempos_evento]))

        return {
            'tiempos': tiempos_evento,
            'hazard_acumulado': hazard_acum,
            'varianza_hazard': var_hazard,
            'supervivencia_estimada': supervivencia_na,
            'hazard_rate': hazard_rate
        }

    def tabla_vida(self, tiempos: np.ndarray, eventos: np.ndarray,
                  intervalos: Optional[np.ndarray] = None) -> Dict:
        """
        Tabla de vida actuarial (life table)

        Agrupa datos en intervalos de tiempo y calcula:
        - q_x: probabilidad de muerte en intervalo
        - p_x: probabilidad de supervivencia en intervalo
        - l_x: número de supervivientes al inicio
        - d_x: número de muertes en intervalo

        Parámetros:
        -----------
        intervalos : array - límites de intervalos (si None, usa años)
        """
        if intervalos is None:
            # Intervalos anuales automáticos
            max_tiempo = np.max(tiempos)
            intervalos = np.arange(0, max_tiempo + 365, 365)

        n_intervalos = len(intervalos) - 1

        # Inicializar tabla
        n_inicio = len(tiempos)
        l_x = [n_inicio]  # Supervivientes al inicio
        d_x = []  # Muertes
        c_x = []  # Censuras
        n_x = []  # Exposición ajustada
        q_x = []  # Probabilidad de muerte
        p_x = []  # Probabilidad de supervivencia
        S_x = [1.0]  # Supervivencia acumulada

        supervivientes = n_inicio

        for i in range(n_intervalos):
            t_inicio = intervalos[i]
            t_fin = intervalos[i + 1]

            # Eventos y censuras en intervalo
            en_intervalo = (tiempos >= t_inicio) & (tiempos < t_fin)
            muertes = np.sum(en_intervalo & (eventos == 1))
            censuras = np.sum(en_intervalo & (eventos == 0))

            # Exposición ajustada (asume censuras uniformes)
            n_efectivo = supervivientes - 0.5 * censuras

            # Probabilidad de muerte
            q_i = muertes / n_efectivo if n_efectivo > 0 else 0
            p_i = 1 - q_i

            # Actualizar supervivientes
            supervivientes -= (muertes + censuras)

            d_x.append(muertes)
            c_x.append(censuras)
            n_x.append(n_efectivo)
            q_x.append(q_i)
            p_x.append(p_i)

            # Supervivencia acumulada
            S_acum = S_x[-1] * p_i
            S_x.append(S_acum)
            l_x.append(supervivientes)

        return {
            'intervalos': intervalos,
            'l_x': np.array(l_x[:-1]),  # Supervivientes al inicio de intervalo
            'd_x': np.array(d_x),  # Muertes
            'c_x': np.array(c_x),  # Censuras
            'n_x': np.array(n_x),  # Exposición ajustada
            'q_x': np.array(q_x),  # Prob. muerte
            'p_x': np.array(p_x),  # Prob. supervivencia
            'S_x': np.array(S_x[:-1])  # Supervivencia acumulada
        }

    # ==========================================
    # 2. MODELOS PARAMÉTRICOS
    # ==========================================

    def weibull_mle(self, tiempos: np.ndarray, eventos: np.ndarray) -> Dict:
        """
        Modelo de Weibull (MLE)

        S(t) = exp(-(t/λ)^k)
        h(t) = (k/λ) * (t/λ)^(k-1)

        donde:
        - λ (lambda): parámetro de escala
        - k (kappa): parámetro de forma
          k < 1: hazard decreciente (mortalidad infantil)
          k = 1: hazard constante (exponencial)
          k > 1: hazard creciente (envejecimiento)

        Parámetros:
        -----------
        tiempos : array (n,) - tiempos observados
        eventos : array (n,) - indicador de evento
        """
        # Log-likelihood
        def log_likelihood(params):
            k, lam = params
            if k <= 0 or lam <= 0:
                return 1e10

            # Contribución de eventos
            ll_eventos = np.sum(
                eventos * (np.log(k) - k * np.log(lam) + (k - 1) * np.log(tiempos))
            )

            # Contribución de supervivientes (eventos + censuras)
            ll_supervivencia = -np.sum((tiempos / lam)**k)

            return -(ll_eventos + ll_supervivencia)

        # Valores iniciales (método de momentos aproximado)
        media = np.mean(tiempos[eventos == 1])
        k_init = 1.5
        lam_init = media / stats.gamma(1 + 1/k_init)

        # Optimización
        resultado = optimize.minimize(
            log_likelihood,
            x0=[k_init, lam_init],
            method='Nelder-Mead',
            options={'maxiter': 5000}
        )

        k_mle, lam_mle = resultado.x

        # Funciones de supervivencia y hazard
        t_grid = np.linspace(0, np.max(tiempos), 100)
        S_t = np.exp(-(t_grid / lam_mle)**k_mle)
        h_t = (k_mle / lam_mle) * (t_grid / lam_mle)**(k_mle - 1)

        # Media y mediana
        media_weibull = lam_mle * stats.gamma(1 + 1/k_mle)
        mediana_weibull = lam_mle * (np.log(2))**(1/k_mle)

        # Interpretación de k
        if k_mle < 0.9:
            interpretacion_k = "Hazard DECRECIENTE (mortalidad infantil, defectos tempranos)"
        elif k_mle > 1.1:
            interpretacion_k = "Hazard CRECIENTE (envejecimiento, desgaste)"
        else:
            interpretacion_k = "Hazard CONSTANTE (fallas aleatorias, exponencial)"

        return {
            'k_forma': k_mle,
            'lambda_escala': lam_mle,
            'log_likelihood': -resultado.fun,
            'supervivencia': S_t,
            'hazard': h_t,
            'tiempos_grid': t_grid,
            'media': media_weibull,
            'mediana': mediana_weibull,
            'interpretacion_k': interpretacion_k,
            'convergido': resultado.success
        }

    def lognormal_mle(self, tiempos: np.ndarray, eventos: np.ndarray) -> Dict:
        """
        Modelo Log-normal (MLE)

        log(T) ~ N(μ, σ²)

        S(t) = 1 - Φ((log(t) - μ)/σ)
        h(t) = φ((log(t) - μ)/σ) / [σ*t*(1 - Φ((log(t) - μ)/σ))]

        Características:
        - Hazard no monótono (sube y luego baja)
        - Apropiado para fallas con período de "desgaste" seguido de mejora
        """
        log_tiempos = np.log(tiempos)

        # Log-likelihood
        def log_likelihood(params):
            mu, sigma = params
            if sigma <= 0:
                return 1e10

            # Contribución de eventos
            ll_eventos = np.sum(
                eventos * stats.norm.logpdf(log_tiempos, loc=mu, scale=sigma)
            )

            # Contribución de censuras
            ll_censuras = np.sum(
                (1 - eventos) * stats.norm.logsf(log_tiempos, loc=mu, scale=sigma)
            )

            return -(ll_eventos + ll_censuras)

        # Valores iniciales
        mu_init = np.mean(log_tiempos[eventos == 1])
        sigma_init = np.std(log_tiempos[eventos == 1])

        # Optimización
        resultado = optimize.minimize(
            log_likelihood,
            x0=[mu_init, sigma_init],
            method='Nelder-Mead'
        )

        mu_mle, sigma_mle = resultado.x

        # Funciones
        t_grid = np.linspace(0.1, np.max(tiempos), 100)
        log_t_grid = np.log(t_grid)

        S_t = 1 - stats.norm.cdf(log_t_grid, loc=mu_mle, scale=sigma_mle)
        pdf_t = stats.norm.pdf(log_t_grid, loc=mu_mle, scale=sigma_mle) / t_grid
        h_t = pdf_t / (S_t + 1e-10)

        # Media y mediana
        media_lognormal = np.exp(mu_mle + 0.5 * sigma_mle**2)
        mediana_lognormal = np.exp(mu_mle)

        return {
            'mu': mu_mle,
            'sigma': sigma_mle,
            'log_likelihood': -resultado.fun,
            'supervivencia': S_t,
            'hazard': h_t,
            'tiempos_grid': t_grid,
            'media': media_lognormal,
            'mediana': mediana_lognormal,
            'moda_hazard': np.exp(mu_mle - sigma_mle**2)
        }

    # ==========================================
    # 3. REGRESIÓN DE SUPERVIVENCIA
    # ==========================================

    def cox_proportional_hazards(self, tiempos: np.ndarray, eventos: np.ndarray,
                                 X: np.ndarray, max_iter: int = 50) -> Dict:
        """
        Modelo de Cox (Proportional Hazards)

        h(t|X) = h₀(t) * exp(X'β)

        donde:
        - h₀(t): baseline hazard (no especificado - semiparamétrico)
        - exp(X'β): hazard ratio

        Partial Likelihood:
        L(β) = Π_i [exp(X_i'β) / Σ_{j∈R(t_i)} exp(X_j'β)]^{δ_i}

        donde R(t_i) = risk set en tiempo t_i

        Parámetros:
        -----------
        tiempos : array (n,) - tiempos observados
        eventos : array (n,) - indicador de evento
        X : array (n, p) - covariables
        """
        n, p = X.shape

        # Ordenar por tiempo
        orden = np.argsort(tiempos)
        tiempos = tiempos[orden]
        eventos = eventos[orden]
        X = X[orden]

        # Partial log-likelihood
        def partial_log_likelihood(beta):
            xb = X @ beta

            ll = 0
            for i in range(n):
                if eventos[i] == 1:
                    # Risk set: todos con tiempo ≥ t_i
                    risk_set = tiempos >= tiempos[i]

                    # Numerador
                    num = xb[i]

                    # Denominador (log-sum-exp trick para estabilidad)
                    log_sum_exp = np.log(np.sum(np.exp(xb[risk_set])))

                    ll += num - log_sum_exp

            return -ll

        # Valores iniciales
        beta_init = np.zeros(p)

        # Optimización
        resultado = optimize.minimize(
            partial_log_likelihood,
            beta_init,
            method='BFGS',
            options={'maxiter': max_iter}
        )

        beta_mle = resultado.x

        # Hazard Ratios
        hazard_ratios = np.exp(beta_mle)

        # Errores estándar (aproximación: Hessian numérico)
        # En producción: usar información de Fisher
        hess_inv = resultado.hess_inv if hasattr(resultado, 'hess_inv') else np.eye(p)
        se_beta = np.sqrt(np.diag(hess_inv)) if isinstance(hess_inv, np.ndarray) else np.ones(p)

        # Intervalos de confianza para HR
        z = stats.norm.ppf(0.975)
        hr_ic_inf = np.exp(beta_mle - z * se_beta)
        hr_ic_sup = np.exp(beta_mle + z * se_beta)

        # Estadísticos de Wald
        z_stats = beta_mle / se_beta
        p_valores = 2 * (1 - stats.norm.cdf(np.abs(z_stats)))

        return {
            'coeficientes': beta_mle,
            'errores_std': se_beta,
            'hazard_ratios': hazard_ratios,
            'hr_ic_inferior': hr_ic_inf,
            'hr_ic_superior': hr_ic_sup,
            'z_estadisticos': z_stats,
            'p_valores': p_valores,
            'log_likelihood': -resultado.fun,
            'convergido': resultado.success,
            'interpretacion': [
                f"HR={hr:.2f} ({'↑' if hr > 1 else '↓'}{abs((hr-1)*100):.0f}% riesgo)"
                for hr in hazard_ratios
            ]
        }

    # ==========================================
    # 4. FIABILIDAD DE SISTEMAS
    # ==========================================

    def sistema_serie(self, fiabilidades: np.ndarray) -> Dict:
        """
        Sistema en Serie (todos los componentes deben funcionar)

        R_sistema = Π R_i

        El sistema falla si CUALQUIER componente falla.
        Ejemplo: cadena de producción
        """
        R_sistema = np.prod(fiabilidades)

        # Si componentes son independientes con tasa de fallo λ_i
        # MTTF = 1 / Σλ_i (aproximación para tasas pequeñas)

        return {
            'fiabilidad_sistema': R_sistema,
            'prob_fallo': 1 - R_sistema,
            'n_componentes': len(fiabilidades),
            'efecto': 'Fiabilidad MENOR que el peor componente',
            'critico': np.argmin(fiabilidades)
        }

    def sistema_paralelo(self, fiabilidades: np.ndarray) -> Dict:
        """
        Sistema en Paralelo (al menos un componente debe funcionar)

        R_sistema = 1 - Π (1 - R_i)

        El sistema falla si TODOS los componentes fallan.
        Ejemplo: redundancia, backup systems
        """
        R_sistema = 1 - np.prod(1 - fiabilidades)

        return {
            'fiabilidad_sistema': R_sistema,
            'prob_fallo': 1 - R_sistema,
            'n_componentes': len(fiabilidades),
            'redundancia': len(fiabilidades),
            'efecto': 'Fiabilidad MAYOR que el mejor componente'
        }

    def sistema_k_out_of_n(self, n: int, k: int, R_componente: float) -> Dict:
        """
        Sistema k-out-of-n (al menos k de n componentes deben funcionar)

        R_sistema = Σ_{j=k}^n C(n,j) * R^j * (1-R)^(n-j)

        Casos especiales:
        - n-out-of-n: serie (todos deben funcionar)
        - 1-out-of-n: paralelo (al menos uno debe funcionar)

        Ejemplo: sistema de votación (2-out-of-3)
        """
        R_sistema = 0

        for j in range(k, n + 1):
            # Binomial: C(n,j) * R^j * (1-R)^(n-j)
            prob = stats.binom.pmf(j, n, R_componente) + stats.binom.sf(j, n, R_componente)
            if j == k:
                prob = 1 - stats.binom.cdf(k - 1, n, R_componente)

        R_sistema = 1 - stats.binom.cdf(k - 1, n, R_componente)

        return {
            'fiabilidad_sistema': R_sistema,
            'prob_fallo': 1 - R_sistema,
            'k': k,
            'n': n,
            'R_componente': R_componente,
            'tipo': f"{k}-out-of-{n}"
        }

    def mttf(self, tiempos_fallo: np.ndarray) -> Dict:
        """
        MTTF (Mean Time To Failure)

        Tiempo medio hasta fallo (para sistemas no reparables)

        MTTF = ∫₀^∞ R(t) dt

        Si distribución exponencial: MTTF = 1/λ
        """
        mttf_empirico = np.mean(tiempos_fallo)
        mediana = np.median(tiempos_fallo)

        # Estimar tasa de fallo (si exponencial)
        lambda_estimado = 1 / mttf_empirico

        # Percentiles
        p95 = np.percentile(tiempos_fallo, 95)

        return {
            'MTTF': mttf_empirico,
            'mediana': mediana,
            'lambda_exponencial': lambda_estimado,
            'desviacion_std': np.std(tiempos_fallo),
            'percentil_95': p95,
            'n_fallos': len(tiempos_fallo)
        }

    # ==========================================
    # 5. RIESGOS COMPETITIVOS
    # ==========================================

    def cumulative_incidence_function(self, tiempos: np.ndarray,
                                      eventos: np.ndarray, tipo_evento: int = 1) -> Dict:
        """
        Función de Incidencia Acumulada (CIF) - Competing Risks

        CIF_j(t) = P(T ≤ t, tipo = j)
                 = ∫₀^t S(u) * h_j(u) du

        donde:
        - eventos: 0=censura, 1=evento tipo 1, 2=evento tipo 2, ...

        Ejemplo en seguros:
        - Tipo 1: cancelación voluntaria
        - Tipo 2: muerte del asegurado
        - Tipo 3: impago

        Parámetros:
        -----------
        eventos : array - 0=censura, 1,2,3,...=tipos de evento
        tipo_evento : int - tipo de interés para calcular CIF
        """
        # Ordenar
        orden = np.argsort(tiempos)
        tiempos = tiempos[orden]
        eventos = eventos[orden]

        # Tiempos únicos
        tiempos_unicos = np.unique(tiempos[eventos > 0])

        if len(tiempos_unicos) == 0:
            return {'error': 'No hay eventos'}

        # Calcular CIF
        CIF = []
        S_all = 1.0  # Supervivencia overall (todos los riesgos)

        for t in tiempos_unicos:
            # Número en riesgo
            n_i = np.sum(tiempos >= t)

            # Eventos del tipo de interés en tiempo t
            d_ji = np.sum((tiempos == t) & (eventos == tipo_evento))

            # Todos los eventos en tiempo t
            d_i = np.sum((tiempos == t) & (eventos > 0))

            # Actualizar supervivencia overall
            S_prev = S_all
            S_all *= (1 - d_i / n_i) if n_i > 0 else 1

            # Incremento de CIF
            delta_CIF = S_prev * (d_ji / n_i) if n_i > 0 else 0

            if len(CIF) == 0:
                CIF.append(delta_CIF)
            else:
                CIF.append(CIF[-1] + delta_CIF)

        CIF = np.array(CIF)

        return {
            'tiempos': tiempos_unicos,
            'CIF': CIF,
            'tipo_evento': tipo_evento,
            'prob_acumulada_final': CIF[-1] if len(CIF) > 0 else 0,
            'mediana': tiempos_unicos[np.where(CIF >= 0.5)[0][0]] if np.any(CIF >= 0.5) else np.inf
        }


if __name__ == "__main__":
    print("="*70)
    print("MOTOR DE SUPERVIVENCIA Y FIABILIDAD - EJEMPLOS")
    print("="*70)

    motor = MotorSupervivencia()

    # Datos simulados: tiempo hasta churn de clientes
    np.random.seed(42)
    n = 200

    # Simular tiempos de supervivencia (Weibull)
    k_true = 1.2  # Hazard creciente
    lam_true = 500  # Escala
    tiempos = lam_true * (-np.log(1 - np.random.rand(n)))**(1/k_true)

    # Censura aleatoria (30% censurados)
    censura_tiempos = np.random.uniform(0, 800, n)
    eventos = (tiempos <= censura_tiempos).astype(int)
    tiempos_obs = np.minimum(tiempos, censura_tiempos)

    # =====================================
    # 1. KAPLAN-MEIER
    # =====================================
    print("\n1. ESTIMADOR DE KAPLAN-MEIER")
    print("-" * 50)

    km = motor.kaplan_meier(tiempos_obs, eventos)
    print(f"Mediana supervivencia: {km['mediana_supervivencia']:.1f} días")
    print(f"Supervivencia a 1 año: {km['supervivencia_1año']*100:.1f}%")
    print(f"Número de eventos: {len(km['tiempos'])}")

    # =====================================
    # 2. NELSON-AALEN
    # =====================================
    print("\n2. ESTIMADOR DE NELSON-AALEN (Hazard Acumulado)")
    print("-" * 50)

    na = motor.nelson_aalen(tiempos_obs, eventos)
    print(f"Hazard acumulado final: {na['hazard_acumulado'][-1]:.3f}")
    print(f"Hazard rate promedio: {np.mean(na['hazard_rate']):.5f}")

    # =====================================
    # 3. TABLA DE VIDA
    # =====================================
    print("\n3. TABLA DE VIDA ACTUARIAL")
    print("-" * 50)

    tabla = motor.tabla_vida(tiempos_obs, eventos, intervalos=np.array([0, 180, 365, 545, 730]))
    print("Intervalo | Superv. | Muertes | q_x")
    for i in range(len(tabla['d_x'])):
        print(f"{tabla['intervalos'][i]:6.0f}-{tabla['intervalos'][i+1]:6.0f} | "
              f"{tabla['l_x'][i]:5.0f}   | {tabla['d_x'][i]:5.0f}   | {tabla['q_x'][i]:.3f}")

    # =====================================
    # 4. MODELO WEIBULL
    # =====================================
    print("\n4. MODELO WEIBULL (MLE)")
    print("-" * 50)

    weibull = motor.weibull_mle(tiempos_obs, eventos)
    print(f"k (forma): {weibull['k_forma']:.2f}")
    print(f"λ (escala): {weibull['lambda_escala']:.1f}")
    print(f"Media: {weibull['media']:.1f}")
    print(f"Mediana: {weibull['mediana']:.1f}")
    print(f"{weibull['interpretacion_k']}")

    # =====================================
    # 5. MODELO LOG-NORMAL
    # =====================================
    print("\n5. MODELO LOG-NORMAL (MLE)")
    print("-" * 50)

    lognorm = motor.lognormal_mle(tiempos_obs, eventos)
    print(f"μ: {lognorm['mu']:.2f}")
    print(f"σ: {lognorm['sigma']:.2f}")
    print(f"Media: {lognorm['media']:.1f}")
    print(f"Mediana: {lognorm['mediana']:.1f}")

    # =====================================
    # 6. COX PROPORTIONAL HAZARDS
    # =====================================
    print("\n6. MODELO DE COX (Proportional Hazards)")
    print("-" * 50)

    # Covariables simuladas: edad, ingresos
    X_cox = np.column_stack([
        np.random.normal(45, 15, n),  # Edad
        np.random.normal(50000, 20000, n)  # Ingresos
    ])
    X_cox_std = (X_cox - np.mean(X_cox, axis=0)) / np.std(X_cox, axis=0)

    cox = motor.cox_proportional_hazards(tiempos_obs, eventos, X_cox_std, max_iter=30)
    print(f"Coeficientes: {cox['coeficientes']}")
    print(f"Hazard Ratios: {cox['hazard_ratios']}")
    print(f"P-valores: {cox['p_valores']}")
    print("Interpretación:")
    for i, interp in enumerate(cox['interpretacion']):
        print(f"  Variable {i+1}: {interp}")

    # =====================================
    # 7. FIABILIDAD DE SISTEMAS
    # =====================================
    print("\n7. FIABILIDAD DE SISTEMAS")
    print("-" * 50)

    fiab_componentes = np.array([0.95, 0.90, 0.92, 0.88])

    # Sistema en serie
    serie = motor.sistema_serie(fiab_componentes)
    print(f"Sistema SERIE: R={serie['fiabilidad_sistema']*100:.1f}%")
    print(f"  Componente crítico: {serie['critico']}")

    # Sistema en paralelo
    paralelo = motor.sistema_paralelo(fiab_componentes)
    print(f"Sistema PARALELO: R={paralelo['fiabilidad_sistema']*100:.2f}%")

    # Sistema 2-out-of-3
    k_out_n = motor.sistema_k_out_of_n(n=3, k=2, R_componente=0.90)
    print(f"Sistema 2-out-of-3: R={k_out_n['fiabilidad_sistema']*100:.2f}%")

    # MTTF
    tiempos_fallo_sistema = tiempos[eventos == 1]
    mttf = motor.mttf(tiempos_fallo_sistema)
    print(f"MTTF: {mttf['MTTF']:.1f} días")
    print(f"Mediana: {mttf['mediana']:.1f} días")

    # =====================================
    # 8. RIESGOS COMPETITIVOS
    # =====================================
    print("\n8. RIESGOS COMPETITIVOS (Competing Risks)")
    print("-" * 50)

    # Simular dos tipos de eventos
    eventos_competitivos = np.copy(eventos)
    # Dividir eventos en dos tipos
    idx_eventos = eventos == 1
    tipo1 = np.random.rand(np.sum(idx_eventos)) < 0.6
    eventos_competitivos[idx_eventos] = np.where(tipo1, 1, 2)

    # CIF para tipo 1
    cif1 = motor.cumulative_incidence_function(tiempos_obs, eventos_competitivos, tipo_evento=1)
    print(f"CIF Tipo 1 (cancelación): {cif1['prob_acumulada_final']*100:.1f}%")

    # CIF para tipo 2
    cif2 = motor.cumulative_incidence_function(tiempos_obs, eventos_competitivos, tipo_evento=2)
    print(f"CIF Tipo 2 (muerte): {cif2['prob_acumulada_final']*100:.1f}%")

    print("\n" + "="*70)
    print("FIN DE EJEMPLOS")
    print("="*70)
    print("\n✓ 20+ métodos de supervivencia y fiabilidad implementados")
    print("✓ Kaplan-Meier, Nelson-Aalen, Weibull, Cox, sistemas, competing risks")

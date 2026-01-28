"""
MOTOR INTEGRADO: ESTADÍSTICO + ECONÓMICO + FINANCIERO + MATEMÁTICO + ESTRATÉGICO
Arquitectura modular completa y operativa
"""

import numpy as np
import pandas as pd
from scipy import stats, optimize
from scipy.linalg import cholesky, solve
from sklearn.linear_model import Ridge, Lasso, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# ============================================================================
# MOTOR 1: ESTADÍSTICO
# ============================================================================

class MotorEstadistico:
    """Motor de inferencia, predicción y causalidad"""

    def __init__(self):
        self.modelos = {}
        self.scaler = StandardScaler()

    def descriptiva(self, data):
        """Estadística descriptiva completa"""
        return {
            'media': np.mean(data, axis=0),
            'mediana': np.median(data, axis=0),
            'std': np.std(data, axis=0),
            'var': np.var(data, axis=0),
            'q25': np.percentile(data, 25, axis=0),
            'q75': np.percentile(data, 75, axis=0),
            'skewness': stats.skew(data, axis=0),
            'kurtosis': stats.kurtosis(data, axis=0),
            'n': len(data)
        }

    def test_normalidad(self, data):
        """Test de normalidad multivariante"""
        resultados = {}
        for i in range(data.shape[1]):
            stat, pval = stats.shapiro(data[:, i])
            resultados[f'var_{i}'] = {'stat': stat, 'pval': pval, 'normal': pval > 0.05}
        return resultados

    def regresion_lineal(self, X, y, regularizacion='ridge', alpha=1.0):
        """Regresión lineal con regularización"""
        X_scaled = self.scaler.fit_transform(X)

        if regularizacion == 'ridge':
            modelo = Ridge(alpha=alpha)
        elif regularizacion == 'lasso':
            modelo = Lasso(alpha=alpha)
        else:
            from sklearn.linear_model import LinearRegression
            modelo = LinearRegression()

        modelo.fit(X_scaled, y)

        # Diagnóstico
        y_pred = modelo.predict(X_scaled)
        residuos = y - y_pred

        return {
            'modelo': modelo,
            'coeficientes': modelo.coef_,
            'intercepto': modelo.intercept_,
            'r2': 1 - np.sum(residuos**2) / np.sum((y - np.mean(y))**2),
            'rmse': np.sqrt(np.mean(residuos**2)),
            'mae': np.mean(np.abs(residuos)),
            'residuos': residuos,
            'predicciones': y_pred
        }

    def glm_logistico(self, X, y):
        """Modelo logístico (clasificación binaria)"""
        X_scaled = self.scaler.fit_transform(X)
        modelo = LogisticRegression(max_iter=1000)
        modelo.fit(X_scaled, y)

        y_pred_proba = modelo.predict_proba(X_scaled)[:, 1]
        y_pred = modelo.predict(X_scaled)

        # AUC
        from sklearn.metrics import roc_auc_score, log_loss

        return {
            'modelo': modelo,
            'coeficientes': modelo.coef_[0],
            'intercepto': modelo.intercept_[0],
            'auc': roc_auc_score(y, y_pred_proba),
            'log_loss': log_loss(y, y_pred_proba),
            'accuracy': np.mean(y == y_pred),
            'predicciones_proba': y_pred_proba
        }

    def survival_kaplan_meier(self, tiempos, eventos):
        """Estimador Kaplan-Meier"""
        orden = np.argsort(tiempos)
        tiempos = tiempos[orden]
        eventos = eventos[orden]

        tiempos_unicos = np.unique(tiempos)
        supervivencia = []
        s_actual = 1.0

        for t in tiempos_unicos:
            en_riesgo = np.sum(tiempos >= t)
            eventos_t = np.sum((tiempos == t) & (eventos == 1))
            s_actual *= (1 - eventos_t / en_riesgo)
            supervivencia.append(s_actual)

        return {
            'tiempos': tiempos_unicos,
            'supervivencia': np.array(supervivencia),
            'mediana': tiempos_unicos[np.argmin(np.abs(np.array(supervivencia) - 0.5))]
        }

    def bootstrap_ci(self, data, estadistico_fn, n_bootstrap=1000, alpha=0.05):
        """Intervalo de confianza bootstrap"""
        estadisticos = []
        n = len(data)

        for _ in range(n_bootstrap):
            muestra = data[np.random.randint(0, n, n)]
            estadisticos.append(estadistico_fn(muestra))

        estadisticos = np.array(estadisticos)
        return {
            'media': np.mean(estadisticos),
            'ci_lower': np.percentile(estadisticos, alpha/2 * 100),
            'ci_upper': np.percentile(estadisticos, (1 - alpha/2) * 100),
            'distribucion': estadisticos
        }

    def analisis_causal_did(self, pre_tratados, post_tratados, pre_control, post_control):
        """Difference-in-Differences"""
        diff_tratados = np.mean(post_tratados) - np.mean(pre_tratados)
        diff_control = np.mean(post_control) - np.mean(pre_control)

        ate = diff_tratados - diff_control

        # SE robusto
        var_tratados = np.var(post_tratados - pre_tratados[:len(post_tratados)]) / len(post_tratados)
        var_control = np.var(post_control - pre_control[:len(post_control)]) / len(post_control)
        se = np.sqrt(var_tratados + var_control)

        return {
            'ate': ate,
            'se': se,
            't_stat': ate / se,
            'pval': 2 * (1 - stats.norm.cdf(np.abs(ate / se))),
            'ci_95': (ate - 1.96 * se, ate + 1.96 * se)
        }

    def pca_reduccion(self, X, n_componentes=None):
        """Análisis de componentes principales"""
        X_scaled = self.scaler.fit_transform(X)

        if n_componentes is None:
            n_componentes = min(X.shape)

        pca = PCA(n_components=n_componentes)
        X_transformed = pca.fit_transform(X_scaled)

        return {
            'componentes': pca.components_,
            'varianza_explicada': pca.explained_variance_ratio_,
            'varianza_acumulada': np.cumsum(pca.explained_variance_ratio_),
            'X_transformado': X_transformed,
            'modelo': pca
        }

    def clustering_kmeans(self, X, n_clusters=3):
        """Clustering K-means"""
        X_scaled = self.scaler.fit_transform(X)
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X_scaled)

        # Silhouette score
        from sklearn.metrics import silhouette_score

        return {
            'labels': labels,
            'centroides': kmeans.cluster_centers_,
            'inercia': kmeans.inertia_,
            'silhouette': silhouette_score(X_scaled, labels),
            'modelo': kmeans
        }


# ============================================================================
# MOTOR 2: ECONÓMICO
# ============================================================================

class MotorEconomico:
    """Motor de valoración, equilibrios y comportamiento"""

    def __init__(self):
        pass

    def elasticidad_precio(self, precios, cantidades):
        """Elasticidad precio de la demanda"""
        # Log-log regression
        log_p = np.log(precios)
        log_q = np.log(cantidades)

        coef = np.polyfit(log_p, log_q, 1)
        elasticidad = coef[0]

        return {
            'elasticidad': elasticidad,
            'interpretacion': 'elástica' if abs(elasticidad) > 1 else 'inelástica',
            'coeficiente': coef
        }

    def clv_basico(self, ingresos_promedio_periodo, tasa_retencion, tasa_descuento, periodos=60):
        """Customer Lifetime Value"""
        clv = 0
        for t in range(periodos):
            clv += (ingresos_promedio_periodo * (tasa_retencion ** t)) / ((1 + tasa_descuento) ** t)

        # Fórmula cerrada (perpetuidad geométrica)
        if tasa_retencion < 1:
            clv_formula = ingresos_promedio_periodo / (1 + tasa_descuento - tasa_retencion)
        else:
            clv_formula = np.inf

        return {
            'clv_simulado': clv,
            'clv_formula': clv_formula,
            'valor_presente': clv
        }

    def equilibrio_cournot(self, costes_marginales, demanda_intercepto, demanda_pendiente, n_empresas=2):
        """Equilibrio de Cournot (competencia en cantidades)"""
        # Q = a - bP, donde a = intercepto, b = pendiente
        # CM = c (constante)

        c = np.mean(costes_marginales)
        a = demanda_intercepto
        b = demanda_pendiente

        # Cantidad por empresa
        q_i = (a - c) / (b * (n_empresas + 1))
        Q_total = n_empresas * q_i

        # Precio de equilibrio
        P = (a - b * Q_total) / b if b != 0 else a

        # Beneficio por empresa
        beneficio_i = (P - c) * q_i

        return {
            'cantidad_por_empresa': q_i,
            'cantidad_total': Q_total,
            'precio_equilibrio': P,
            'beneficio_por_empresa': beneficio_i,
            'excedente_consumidor': 0.5 * b * Q_total ** 2
        }

    def utilidad_cobb_douglas(self, x1, x2, alpha=0.5):
        """Función de utilidad Cobb-Douglas"""
        return (x1 ** alpha) * (x2 ** (1 - alpha))

    def demanda_marshalliana(self, p1, p2, ingreso, alpha=0.5):
        """Demanda óptima con utilidad Cobb-Douglas"""
        x1 = (alpha * ingreso) / p1
        x2 = ((1 - alpha) * ingreso) / p2

        return {
            'x1': x1,
            'x2': x2,
            'utilidad': self.utilidad_cobb_douglas(x1, x2, alpha),
            'gasto_total': p1 * x1 + p2 * x2
        }

    def excedente_consumidor(self, demanda_fn, precio_mercado, precio_max):
        """Cálculo de excedente del consumidor"""
        from scipy.integrate import quad

        ec, _ = quad(lambda p: demanda_fn(p), precio_mercado, precio_max)
        return ec

    def oligopolio_bertrand(self, costes_marginales):
        """Equilibrio de Bertrand (competencia en precios)"""
        # Con productos homogéneos, precio = coste marginal del segundo más eficiente
        c_ordenados = np.sort(costes_marginales)

        if len(c_ordenados) > 1:
            precio_equilibrio = c_ordenados[1]
        else:
            precio_equilibrio = c_ordenados[0]

        return {
            'precio_equilibrio': precio_equilibrio,
            'beneficio_empresas': 0,  # Competencia perfecta
            'empresa_ganadora': np.argmin(costes_marginales)
        }

    def indice_herfindahl(self, cuotas_mercado):
        """Índice de concentración Herfindahl-Hirschman"""
        hhi = np.sum(cuotas_mercado ** 2)

        interpretacion = 'competitivo'
        if hhi > 0.25:
            interpretacion = 'muy concentrado'
        elif hhi > 0.15:
            interpretacion = 'moderadamente concentrado'

        return {
            'hhi': hhi,
            'interpretacion': interpretacion,
            'n_equivalente': 1 / hhi if hhi > 0 else np.inf
        }


# ============================================================================
# MOTOR 3: FINANCIERO
# ============================================================================

class MotorFinanciero:
    """Motor de valoración de activos y gestión de riesgo"""

    def __init__(self):
        pass

    def van_tir(self, flujos_caja, tasa_descuento):
        """Valor Actual Neto y TIR"""
        van = np.sum([fc / ((1 + tasa_descuento) ** t) for t, fc in enumerate(flujos_caja)])

        # TIR (buscar tasa que hace VAN = 0)
        def van_fn(r):
            return np.sum([fc / ((1 + r) ** t) for t, fc in enumerate(flujos_caja)])

        try:
            tir = optimize.brentq(van_fn, -0.99, 10.0)
        except:
            tir = np.nan

        return {
            'van': van,
            'tir': tir,
            'decision': 'aceptar' if van > 0 else 'rechazar'
        }

    def capm(self, beta, tasa_libre_riesgo, retorno_mercado):
        """Capital Asset Pricing Model"""
        retorno_esperado = tasa_libre_riesgo + beta * (retorno_mercado - tasa_libre_riesgo)

        return {
            'retorno_esperado': retorno_esperado,
            'prima_riesgo': beta * (retorno_mercado - tasa_libre_riesgo)
        }

    def beta_activo(self, retornos_activo, retornos_mercado):
        """Estimación de beta (CAPM)"""
        cov = np.cov(retornos_activo, retornos_mercado)[0, 1]
        var_mercado = np.var(retornos_mercado)

        beta = cov / var_mercado if var_mercado > 0 else 0

        return {
            'beta': beta,
            'interpretacion': 'más volátil' if beta > 1 else 'menos volátil',
            'correlacion': np.corrcoef(retornos_activo, retornos_mercado)[0, 1]
        }

    def markowitz_portfolio(self, retornos_esperados, matriz_covarianza, retorno_objetivo=None):
        """Optimización de cartera de Markowitz"""
        n = len(retornos_esperados)

        # Cartera de mínima varianza
        ones = np.ones(n)
        inv_cov = np.linalg.inv(matriz_covarianza)

        pesos_min_var = inv_cov @ ones / (ones.T @ inv_cov @ ones)

        # Si hay retorno objetivo, usar frontera eficiente
        if retorno_objetivo is not None:
            # Optimización con restricción de retorno
            from scipy.optimize import minimize

            def objetivo(w):
                return w.T @ matriz_covarianza @ w

            restricciones = [
                {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
                {'type': 'eq', 'fun': lambda w: w.T @ retornos_esperados - retorno_objetivo}
            ]

            result = minimize(objetivo, np.ones(n)/n, constraints=restricciones,
                            bounds=[(0, 1)] * n, method='SLSQP')
            pesos_optimos = result.x
        else:
            pesos_optimos = pesos_min_var

        retorno_cartera = pesos_optimos.T @ retornos_esperados
        riesgo_cartera = np.sqrt(pesos_optimos.T @ matriz_covarianza @ pesos_optimos)

        return {
            'pesos': pesos_optimos,
            'retorno_esperado': retorno_cartera,
            'volatilidad': riesgo_cartera,
            'sharpe': retorno_cartera / riesgo_cartera if riesgo_cartera > 0 else 0
        }

    def var_historico(self, retornos, nivel_confianza=0.95):
        """Value at Risk histórico"""
        var = np.percentile(retornos, (1 - nivel_confianza) * 100)

        # CVaR (Expected Shortfall)
        cvar = np.mean(retornos[retornos <= var])

        return {
            'var': var,
            'cvar': cvar,
            'nivel_confianza': nivel_confianza
        }

    def var_parametrico(self, retornos, nivel_confianza=0.95):
        """Value at Risk paramétrico (normal)"""
        media = np.mean(retornos)
        std = np.std(retornos)

        z = stats.norm.ppf(1 - nivel_confianza)
        var = media + z * std

        return {
            'var': var,
            'media': media,
            'volatilidad': std
        }

    def black_scholes_call(self, S, K, T, r, sigma):
        """Precio de opción call (Black-Scholes)"""
        d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)

        call = S * stats.norm.cdf(d1) - K * np.exp(-r * T) * stats.norm.cdf(d2)

        # Greeks
        delta = stats.norm.cdf(d1)
        gamma = stats.norm.pdf(d1) / (S * sigma * np.sqrt(T))
        vega = S * stats.norm.pdf(d1) * np.sqrt(T)
        theta = -(S * stats.norm.pdf(d1) * sigma) / (2 * np.sqrt(T)) - r * K * np.exp(-r * T) * stats.norm.cdf(d2)

        return {
            'precio_call': call,
            'delta': delta,
            'gamma': gamma,
            'vega': vega,
            'theta': theta
        }

    def duration_macaulay(self, flujos, tasas_descuento, periodos):
        """Duración de Macaulay (bonos)"""
        vp_flujos = [f / ((1 + tasas_descuento[i]) ** periodos[i]) for i, f in enumerate(flujos)]
        precio = np.sum(vp_flujos)

        duracion = np.sum([periodos[i] * vp_flujos[i] for i in range(len(flujos))]) / precio

        return {
            'duration': duracion,
            'precio': precio,
            'sensibilidad': -duracion / (1 + tasas_descuento[0])  # aproximación
        }


# ============================================================================
# MOTOR 4: MATEMÁTICO
# ============================================================================

class MotorMatematico:
    """Motor de optimización, álgebra y cálculo numérico"""

    def __init__(self):
        pass

    def optimizar_convexo(self, objetivo_fn, restricciones=None, x0=None, bounds=None):
        """Optimización convexa general"""
        if x0 is None:
            x0 = np.zeros(2)

        result = optimize.minimize(objetivo_fn, x0, constraints=restricciones,
                                  bounds=bounds, method='SLSQP')

        return {
            'x_optimo': result.x,
            'valor_optimo': result.fun,
            'exito': result.success,
            'mensaje': result.message,
            'n_iteraciones': result.nit
        }

    def programacion_lineal(self, c, A_ub=None, b_ub=None, A_eq=None, b_eq=None, bounds=None):
        """Programación lineal: min c^T x"""
        from scipy.optimize import linprog

        result = linprog(c, A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq,
                        bounds=bounds, method='highs')

        return {
            'x_optimo': result.x,
            'valor_optimo': result.fun,
            'exito': result.success
        }

    def gradiente_descendente(self, grad_fn, x0, learning_rate=0.01, max_iter=1000, tol=1e-6):
        """Descenso de gradiente básico"""
        x = x0.copy()
        trayectoria = [x.copy()]

        for i in range(max_iter):
            grad = grad_fn(x)
            x_new = x - learning_rate * grad

            if np.linalg.norm(x_new - x) < tol:
                break

            x = x_new
            trayectoria.append(x.copy())

        return {
            'x_optimo': x,
            'n_iteraciones': i + 1,
            'trayectoria': np.array(trayectoria)
        }

    def newton_raphson(self, f, df, x0, max_iter=100, tol=1e-6):
        """Método de Newton-Raphson para encontrar raíces"""
        x = x0

        for i in range(max_iter):
            fx = f(x)
            dfx = df(x)

            if abs(dfx) < 1e-12:
                break

            x_new = x - fx / dfx

            if abs(x_new - x) < tol:
                break

            x = x_new

        return {
            'raiz': x,
            'valor_funcion': f(x),
            'n_iteraciones': i + 1
        }

    def descomposicion_cholesky(self, A):
        """Descomposición de Cholesky (A = L L^T)"""
        L = cholesky(A, lower=True)

        return {
            'L': L,
            'verificacion': np.allclose(L @ L.T, A)
        }

    def svd_descomposicion(self, A):
        """Descomposición en valores singulares"""
        U, s, Vt = np.linalg.svd(A, full_matrices=False)

        return {
            'U': U,
            'valores_singulares': s,
            'Vt': Vt,
            'rango': np.sum(s > 1e-10),
            'condicionamiento': s[0] / s[-1] if s[-1] > 0 else np.inf
        }

    def resolver_sistema_lineal(self, A, b):
        """Resolver Ax = b"""
        try:
            x = solve(A, b)
            residuo = np.linalg.norm(A @ x - b)

            return {
                'solucion': x,
                'residuo': residuo,
                'exito': True
            }
        except np.linalg.LinAlgError:
            return {
                'solucion': None,
                'residuo': np.inf,
                'exito': False
            }

    def integracion_numerica(self, f, a, b, metodo='quad'):
        """Integración numérica"""
        from scipy.integrate import quad, simpson

        if metodo == 'quad':
            resultado, error = quad(f, a, b)
        elif metodo == 'simpson':
            x = np.linspace(a, b, 1001)
            y = f(x)
            resultado = simpson(y, x=x)
            error = 0
        else:
            # Trapezoidal
            x = np.linspace(a, b, 1001)
            y = f(x)
            resultado = np.trapz(y, x)
            error = 0

        return {
            'integral': resultado,
            'error_estimado': error,
            'metodo': metodo
        }

    def eigenvalores(self, A):
        """Valores y vectores propios"""
        valores, vectores = np.linalg.eig(A)

        return {
            'valores_propios': valores,
            'vectores_propios': vectores,
            'espectro': np.sort(np.abs(valores))[::-1]
        }


# ============================================================================
# MOTOR 5: ESTRATÉGICO
# ============================================================================

class MotorEstrategico:
    """Motor de decisión, teoría de juegos y control óptimo"""

    def __init__(self):
        pass

    def equilibrio_nash_2x2(self, matriz_jugador1, matriz_jugador2):
        """Encuentra equilibrios de Nash en juegos 2x2"""
        # Buscar equilibrios en estrategias puras
        equilibrios = []

        for i in range(2):
            for j in range(2):
                # Mejor respuesta jugador 1 a j
                br1 = np.argmax(matriz_jugador1[:, j])
                # Mejor respuesta jugador 2 a i
                br2 = np.argmax(matriz_jugador2[i, :])

                if br1 == i and br2 == j:
                    equilibrios.append({
                        'estrategia': (i, j),
                        'pagos': (matriz_jugador1[i, j], matriz_jugador2[i, j])
                    })

        return {
            'equilibrios_puros': equilibrios,
            'n_equilibrios': len(equilibrios)
        }

    def decision_bajo_incertidumbre(self, matriz_pagos, probabilidades=None, criterio='esperado'):
        """Decisión bajo incertidumbre"""
        if criterio == 'esperado' and probabilidades is not None:
            # Valor esperado
            valores = matriz_pagos @ probabilidades
            decision = np.argmax(valores)

            return {
                'decision_optima': decision,
                'valor_esperado': valores[decision],
                'valores': valores
            }

        elif criterio == 'maximin':
            # Criterio conservador (maximizar el mínimo)
            minimos = np.min(matriz_pagos, axis=1)
            decision = np.argmax(minimos)

            return {
                'decision_optima': decision,
                'valor_minimo_garantizado': minimos[decision],
                'minimos_por_decision': minimos
            }

        elif criterio == 'maximax':
            # Criterio optimista (maximizar el máximo)
            maximos = np.max(matriz_pagos, axis=1)
            decision = np.argmax(maximos)

            return {
                'decision_optima': decision,
                'valor_maximo_posible': maximos[decision],
                'maximos_por_decision': maximos
            }

    def bellman_valor_iteracion(self, transiciones, recompensas, gamma=0.9, max_iter=1000, tol=1e-6):
        """Value iteration (Programación dinámica)"""
        n_estados = transiciones.shape[1]
        n_acciones = transiciones.shape[0]

        V = np.zeros(n_estados)

        for _ in range(max_iter):
            V_new = np.zeros(n_estados)

            for s in range(n_estados):
                valores_acciones = []
                for a in range(n_acciones):
                    valor_a = recompensas[a, s] + gamma * np.sum(transiciones[a, s, :] * V)
                    valores_acciones.append(valor_a)

                V_new[s] = max(valores_acciones)

            if np.max(np.abs(V_new - V)) < tol:
                break

            V = V_new

        # Extraer política
        politica = np.zeros(n_estados, dtype=int)
        for s in range(n_estados):
            valores_acciones = []
            for a in range(n_acciones):
                valor_a = recompensas[a, s] + gamma * np.sum(transiciones[a, s, :] * V)
                valores_acciones.append(valor_a)
            politica[s] = np.argmax(valores_acciones)

        return {
            'valor_optimo': V,
            'politica_optima': politica
        }

    def arbol_decision(self, nodos, probabilidades, valores):
        """Árbol de decisión simple (backward induction)"""
        # Simplificación: asumir estructura binaria
        # En producción, usar librería especializada

        valor_esperado = np.sum(probabilidades * valores)

        return {
            'valor_esperado': valor_esperado,
            'decision_optima': np.argmax(probabilidades * valores)
        }

    def teoria_colas_mm1(self, lambda_llegada, mu_servicio):
        """Modelo M/M/1 (llegadas Poisson, servicio exponencial, 1 servidor)"""
        rho = lambda_llegada / mu_servicio

        if rho >= 1:
            return {
                'estable': False,
                'mensaje': 'Sistema inestable (λ ≥ μ)'
            }

        L = rho / (1 - rho)  # Clientes promedio en sistema
        W = 1 / (mu_servicio - lambda_llegada)  # Tiempo promedio en sistema
        Lq = (rho ** 2) / (1 - rho)  # Clientes en cola
        Wq = lambda_llegada / (mu_servicio * (mu_servicio - lambda_llegada))  # Tiempo en cola

        return {
            'estable': True,
            'utilizacion': rho,
            'clientes_sistema': L,
            'tiempo_sistema': W,
            'clientes_cola': Lq,
            'tiempo_cola': Wq
        }

    def scoring_multicriterio(self, alternativas, criterios, pesos, matriz_evaluacion):
        """Análisis multicriterio (weighted scoring)"""
        # matriz_evaluacion: alternativas x criterios
        # pesos: importancia de cada criterio

        pesos_norm = pesos / np.sum(pesos)
        scores = matriz_evaluacion @ pesos_norm

        ranking = np.argsort(scores)[::-1]

        return {
            'scores': scores,
            'ranking': ranking,
            'mejor_alternativa': ranking[0],
            'peor_alternativa': ranking[-1]
        }

    def sensibilidad_parametro(self, funcion_objetivo, param_nominal, rango_variacion=0.2, n_puntos=50):
        """Análisis de sensibilidad univariante"""
        param_min = param_nominal * (1 - rango_variacion)
        param_max = param_nominal * (1 + rango_variacion)

        params = np.linspace(param_min, param_max, n_puntos)
        valores = [funcion_objetivo(p) for p in params]

        # Elasticidad local
        delta_param = params[1] - params[0]
        delta_valor = valores[1] - valores[0]
        elasticidad = (delta_valor / valores[0]) / (delta_param / params[0])

        return {
            'parametros': params,
            'valores_objetivo': np.array(valores),
            'elasticidad': elasticidad,
            'valor_nominal': funcion_objetivo(param_nominal)
        }


# ============================================================================
# INTEGRADOR: MOTOR MAESTRO
# ============================================================================

class MotorIntegrado:
    """Orquestador de los 5 motores"""

    def __init__(self):
        self.estadistico = MotorEstadistico()
        self.economico = MotorEconomico()
        self.financiero = MotorFinanciero()
        self.matematico = MotorMatematico()
        self.estrategico = MotorEstrategico()

        self.resultados = {}

    def analisis_completo(self, data, config):
        """Pipeline integrado completo"""
        resultados = {}

        # 1. ESTADÍSTICA: Exploración y modelado
        if 'estadistica' in config:
            resultados['estadistica'] = {}

            if 'descriptiva' in config['estadistica']:
                resultados['estadistica']['descriptiva'] = self.estadistico.descriptiva(data)

            if 'regresion' in config['estadistica']:
                X = data[:, :-1]
                y = data[:, -1]
                resultados['estadistica']['regresion'] = self.estadistico.regresion_lineal(X, y)

        # 2. ECONÓMICO: Comportamiento y equilibrios
        if 'economico' in config:
            resultados['economico'] = {}

            # Ejemplo: calcular CLV
            if 'clv' in config['economico']:
                params = config['economico']['clv']
                resultados['economico']['clv'] = self.economico.clv_basico(**params)

        # 3. FINANCIERO: Valoración y riesgo
        if 'financiero' in config:
            resultados['financiero'] = {}

            if 'var' in config['financiero']:
                retornos = config['financiero']['var']['retornos']
                resultados['financiero']['var'] = self.financiero.var_historico(retornos)

        # 4. MATEMÁTICO: Optimización
        if 'matematico' in config:
            resultados['matematico'] = {}

            if 'optimizacion' in config['matematico']:
                obj_fn = config['matematico']['optimizacion']['objetivo']
                x0 = config['matematico']['optimizacion'].get('x0', np.zeros(2))
                resultados['matematico']['optimizacion'] = self.matematico.optimizar_convexo(obj_fn, x0=x0)

        # 5. ESTRATÉGICO: Decisión
        if 'estrategico' in config:
            resultados['estrategico'] = {}

            if 'decision' in config['estrategico']:
                matriz = config['estrategico']['decision']['matriz_pagos']
                probs = config['estrategico']['decision'].get('probabilidades')
                resultados['estrategico']['decision'] = self.estrategico.decision_bajo_incertidumbre(
                    matriz, probs
                )

        self.resultados = resultados
        return resultados

    def pipeline_pricing_optimo(self, datos_historicos, perfil_cliente, contexto_mercado):
        """
        Pipeline integrado: Pricing óptimo personalizado

        Integra los 5 motores:
        1. Estadístico: predice elasticidad y probabilidad de aceptación
        2. Económico: calcula CLV y equilibrio competitivo
        3. Financiero: evalúa riesgo y valor esperado
        4. Matemático: optimiza precio
        5. Estratégico: analiza sensibilidad y estrategia competitiva
        """

        # 1. ESTADÍSTICA: Modelo predictivo de aceptación
        X = datos_historicos[['precio', 'elasticidad', 'competencia']].values
        y = datos_historicos['acepta'].values

        modelo_aceptacion = self.estadistico.glm_logistico(X, y)

        # 2. ECONÓMICO: CLV y elasticidad
        clv = self.economico.clv_basico(
            ingresos_promedio_periodo=perfil_cliente['ingreso_promedio'],
            tasa_retencion=perfil_cliente['tasa_retencion'],
            tasa_descuento=contexto_mercado['tasa_descuento']
        )

        # 3. FINANCIERO: Valoración del cliente
        flujos = [perfil_cliente['ingreso_promedio'] * (perfil_cliente['tasa_retencion'] ** t)
                 for t in range(60)]
        van = self.financiero.van_tir(flujos, contexto_mercado['tasa_descuento'])

        # 4. MATEMÁTICO: Optimización del precio
        def beneficio_esperado(precio):
            # Predecir probabilidad de aceptación
            X_new = np.array([[precio, perfil_cliente['elasticidad'], contexto_mercado['precio_competencia']]])
            X_scaled = modelo_aceptacion['modelo'].named_steps['standardscaler'].transform(X_new) if hasattr(modelo_aceptacion['modelo'], 'named_steps') else X_new

            # Usar modelo para predecir
            prob_acepta = 1 / (1 + np.exp(-(modelo_aceptacion['intercepto'] +
                                           np.sum(modelo_aceptacion['coeficientes'] * X_scaled[0]))))

            margen = precio - perfil_cliente['coste']
            return -(margen * prob_acepta)  # Negativo para minimizar

        precio_optimo = self.matematico.optimizar_convexo(
            beneficio_esperado,
            x0=np.array([contexto_mercado['precio_competencia']]),
            bounds=[(perfil_cliente['coste'] * 1.1, perfil_cliente['precio_max'])]
        )

        # 5. ESTRATÉGICO: Análisis de sensibilidad
        sensibilidad = self.estrategico.sensibilidad_parametro(
            lambda p: -beneficio_esperado(p),
            precio_optimo['x_optimo'][0]
        )

        return {
            'precio_optimo': precio_optimo['x_optimo'][0],
            'beneficio_esperado': -precio_optimo['valor_optimo'],
            'clv': clv['clv_formula'],
            'van': van['van'],
            'sensibilidad': sensibilidad,
            'prob_aceptacion': modelo_aceptacion['auc']
        }

    def resumen(self):
        """Genera resumen ejecutivo de todos los análisis"""
        if not self.resultados:
            return "No hay resultados disponibles"

        resumen = {
            'n_analisis': len(self.resultados),
            'motores_usados': list(self.resultados.keys()),
            'timestamp': pd.Timestamp.now()
        }

        return resumen


# ============================================================================
# EJEMPLO DE USO COMPLETO
# ============================================================================

if __name__ == "__main__":
    print("="*80)
    print("MOTOR INTEGRADO: ESTADÍSTICO + ECONÓMICO + FINANCIERO + MATEMÁTICO + ESTRATÉGICO")
    print("="*80)

    # Crear instancia del motor
    motor = MotorIntegrado()

    # ========================================================================
    # EJEMPLO 1: Análisis estadístico básico
    # ========================================================================
    print("\n" + "="*80)
    print("EJEMPLO 1: ANÁLISIS ESTADÍSTICO")
    print("="*80)

    # Generar datos sintéticos
    np.random.seed(42)
    n = 1000
    X1 = np.random.normal(50, 10, n)
    X2 = np.random.normal(30, 5, n)
    y = 10 + 2 * X1 + 3 * X2 + np.random.normal(0, 5, n)

    data_regresion = np.column_stack([X1, X2, y])

    # Estadística descriptiva
    desc = motor.estadistico.descriptiva(data_regresion)
    print("\nEstadística Descriptiva:")
    print(f"  Media: {desc['media']}")
    print(f"  Desv. Std: {desc['std']}")
    print(f"  Asimetría: {desc['skewness']}")

    # Regresión
    reg = motor.estadistico.regresion_lineal(data_regresion[:, :2], data_regresion[:, 2])
    print("\nRegresión Lineal:")
    print(f"  R²: {reg['r2']:.4f}")
    print(f"  RMSE: {reg['rmse']:.4f}")
    print(f"  Coeficientes: {reg['coeficientes']}")

    # ========================================================================
    # EJEMPLO 2: Optimización de cartera (Markowitz)
    # ========================================================================
    print("\n" + "="*80)
    print("EJEMPLO 2: OPTIMIZACIÓN DE CARTERA (MARKOWITZ)")
    print("="*80)

    retornos_esp = np.array([0.10, 0.12, 0.15, 0.08])
    cov_matrix = np.array([
        [0.04, 0.01, 0.02, 0.005],
        [0.01, 0.06, 0.015, 0.01],
        [0.02, 0.015, 0.09, 0.02],
        [0.005, 0.01, 0.02, 0.03]
    ])

    cartera = motor.financiero.markowitz_portfolio(retornos_esp, cov_matrix, retorno_objetivo=0.11)
    print("\nCartera Óptima:")
    print(f"  Pesos: {cartera['pesos']}")
    print(f"  Retorno esperado: {cartera['retorno_esperado']:.2%}")
    print(f"  Volatilidad: {cartera['volatilidad']:.2%}")
    print(f"  Sharpe Ratio: {cartera['sharpe']:.4f}")

    # ========================================================================
    # EJEMPLO 3: Equilibrio de Cournot
    # ========================================================================
    print("\n" + "="*80)
    print("EJEMPLO 3: EQUILIBRIO DE COURNOT")
    print("="*80)

    cournot = motor.economico.equilibrio_cournot(
        costes_marginales=[20, 20],
        demanda_intercepto=100,
        demanda_pendiente=1,
        n_empresas=2
    )

    print("\nEquilibrio:")
    print(f"  Cantidad por empresa: {cournot['cantidad_por_empresa']:.2f}")
    print(f"  Precio de equilibrio: {cournot['precio_equilibrio']:.2f}")
    print(f"  Beneficio por empresa: {cournot['beneficio_por_empresa']:.2f}")

    # ========================================================================
    # EJEMPLO 4: Black-Scholes (Opciones)
    # ========================================================================
    print("\n" + "="*80)
    print("EJEMPLO 4: VALORACIÓN DE OPCIÓN CALL (BLACK-SCHOLES)")
    print("="*80)

    opcion = motor.financiero.black_scholes_call(
        S=100,     # Precio spot
        K=105,     # Strike
        T=1,       # 1 año
        r=0.05,    # Tasa libre riesgo
        sigma=0.2  # Volatilidad 20%
    )

    print("\nOpción Call:")
    print(f"  Precio: {opcion['precio_call']:.2f}")
    print(f"  Delta: {opcion['delta']:.4f}")
    print(f"  Gamma: {opcion['gamma']:.6f}")
    print(f"  Vega: {opcion['vega']:.4f}")

    # ========================================================================
    # EJEMPLO 5: Programación dinámica (Value Iteration)
    # ========================================================================
    print("\n" + "="*80)
    print("EJEMPLO 5: PROGRAMACIÓN DINÁMICA (MDP)")
    print("="*80)

    # Ejemplo simple: 3 estados, 2 acciones
    n_estados, n_acciones = 3, 2

    # Transiciones: [acción, estado_origen, estado_destino]
    transiciones = np.array([
        [[0.7, 0.2, 0.1],   # Acción 0 desde estado 0
         [0.1, 0.8, 0.1],   # Acción 0 desde estado 1
         [0.1, 0.1, 0.8]],  # Acción 0 desde estado 2

        [[0.5, 0.3, 0.2],   # Acción 1 desde estado 0
         [0.2, 0.6, 0.2],   # Acción 1 desde estado 1
         [0.1, 0.2, 0.7]]   # Acción 1 desde estado 2
    ])

    recompensas = np.array([
        [10, 5, 3],   # Recompensas acción 0 en cada estado
        [8, 7, 4]     # Recompensas acción 1 en cada estado
    ])

    mdp = motor.estrategico.bellman_valor_iteracion(transiciones, recompensas, gamma=0.9)
    print("\nMDP Resuelto:")
    print(f"  Valor óptimo por estado: {mdp['valor_optimo']}")
    print(f"  Política óptima: {mdp['politica_optima']}")

    # ========================================================================
    # EJEMPLO 6: Análisis causal (DID)
    # ========================================================================
    print("\n" + "="*80)
    print("EJEMPLO 6: ANÁLISIS CAUSAL (DIFFERENCE-IN-DIFFERENCES)")
    print("="*80)

    pre_tratados = np.random.normal(50, 10, 100)
    post_tratados = np.random.normal(60, 10, 100)  # Efecto +10
    pre_control = np.random.normal(48, 10, 100)
    post_control = np.random.normal(50, 10, 100)   # Tendencia +2

    did = motor.estadistico.analisis_causal_did(pre_tratados, post_tratados, pre_control, post_control)
    print("\nResultados DID:")
    print(f"  Efecto tratamiento (ATE): {did['ate']:.2f}")
    print(f"  Error estándar: {did['se']:.2f}")
    print(f"  p-valor: {did['pval']:.4f}")
    print(f"  IC 95%: [{did['ci_95'][0]:.2f}, {did['ci_95'][1]:.2f}]")

    # ========================================================================
    # EJEMPLO 7: Optimización matemática (minimización)
    # ========================================================================
    print("\n" + "="*80)
    print("EJEMPLO 7: OPTIMIZACIÓN MATEMÁTICA")
    print("="*80)

    # Minimizar: f(x, y) = (x-3)² + (y-2)²
    def objetivo(x):
        return (x[0] - 3)**2 + (x[1] - 2)**2

    opt = motor.matematico.optimizar_convexo(objetivo, x0=np.array([0, 0]))
    print("\nMinimización:")
    print(f"  Óptimo en: {opt['x_optimo']}")
    print(f"  Valor mínimo: {opt['valor_optimo']:.6f}")

    # ========================================================================
    # EJEMPLO 8: CLV (Customer Lifetime Value)
    # ========================================================================
    print("\n" + "="*80)
    print("EJEMPLO 8: CUSTOMER LIFETIME VALUE")
    print("="*80)

    clv = motor.economico.clv_basico(
        ingresos_promedio_periodo=100,
        tasa_retencion=0.85,
        tasa_descuento=0.10
    )

    print("\nCLV:")
    print(f"  Valor simulado (60 periodos): {clv['clv_simulado']:.2f}")
    print(f"  Valor fórmula cerrada: {clv['clv_formula']:.2f}")

    # ========================================================================
    # EJEMPLO 9: VaR (Value at Risk)
    # ========================================================================
    print("\n" + "="*80)
    print("EJEMPLO 9: VALUE AT RISK")
    print("="*80)

    retornos_diarios = np.random.normal(0.001, 0.02, 1000)
    var = motor.financiero.var_historico(retornos_diarios, nivel_confianza=0.95)

    print("\nVaR:")
    print(f"  VaR 95%: {var['var']:.4f}")
    print(f"  CVaR (Expected Shortfall): {var['cvar']:.4f}")

    # ========================================================================
    # EJEMPLO 10: Teoría de colas (M/M/1)
    # ========================================================================
    print("\n" + "="*80)
    print("EJEMPLO 10: TEORÍA DE COLAS (M/M/1)")
    print("="*80)

    colas = motor.estrategico.teoria_colas_mm1(lambda_llegada=8, mu_servicio=10)

    if colas['estable']:
        print("\nSistema de Colas:")
        print(f"  Utilización: {colas['utilizacion']:.2%}")
        print(f"  Clientes promedio en sistema: {colas['clientes_sistema']:.2f}")
        print(f"  Tiempo promedio en sistema: {colas['tiempo_sistema']:.4f}")
        print(f"  Clientes en cola: {colas['clientes_cola']:.2f}")

    print("\n" + "="*80)
    print("MOTOR INICIALIZADO Y PROBADO EXITOSAMENTE")
    print("="*80)
    print("\nMotores disponibles:")
    print("  1. motor.estadistico")
    print("  2. motor.economico")
    print("  3. motor.financiero")
    print("  4. motor.matematico")
    print("  5. motor.estrategico")
    print("\nMétodo integrado:")
    print("  motor.pipeline_pricing_optimo()")

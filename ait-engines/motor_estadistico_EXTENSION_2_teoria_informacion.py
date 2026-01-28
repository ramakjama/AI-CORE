"""
MOTOR ESTADÍSTICO - EXTENSIÓN 2
Teoría de la Información + Criterios de Modelo + Divergencias
"""

import numpy as np
from scipy import stats
from scipy.special import xlogy, rel_entr


class MotorTeoriaInformacion:
    """Teoría de la información, entropía, divergencias, criterios de modelo"""

    def __init__(self):
        pass

    # ========================================================================
    # ENTROPÍA (Shannon, Rényi, Tsallis)
    # ========================================================================

    def entropia_shannon(self, probabilidades):
        """
        Entropía de Shannon: H(X) = -Σ p_i log(p_i)
        """
        # Eliminar ceros
        p = probabilidades[probabilidades > 0]

        entropia = -np.sum(p * np.log2(p))

        return {
            'entropia': entropia,
            'entropia_max': np.log2(len(probabilidades)),
            'entropia_normalizada': entropia / np.log2(len(probabilidades)) if len(probabilidades) > 1 else 0
        }

    def entropia_renyi(self, probabilidades, alpha=2.0):
        """
        Entropía de Rényi (generalización de Shannon)
        H_α(X) = 1/(1-α) * log(Σ p_i^α)

        α=0: max-entropy
        α=1: Shannon entropy (límite)
        α=2: collision entropy
        α=∞: min-entropy
        """
        if alpha == 1:
            return self.entropia_shannon(probabilidades)

        p = probabilidades[probabilidades > 0]

        if alpha == np.inf:
            # Min-entropy
            entropia = -np.log2(np.max(p))
        elif alpha == 0:
            # Max-entropy (Hartley)
            entropia = np.log2(len(p))
        else:
            suma = np.sum(p ** alpha)
            entropia = (1 / (1 - alpha)) * np.log2(suma)

        return {
            'entropia_renyi': entropia,
            'alpha': alpha,
            'tipo': self._tipo_renyi(alpha)
        }

    def _tipo_renyi(self, alpha):
        """Clasificar tipo de entropía Rényi"""
        if alpha == 0:
            return 'Hartley (max-entropy)'
        elif alpha == 1:
            return 'Shannon'
        elif alpha == 2:
            return 'Collision entropy'
        elif alpha == np.inf:
            return 'Min-entropy'
        else:
            return f'Rényi α={alpha}'

    def entropia_tsallis(self, probabilidades, q=2.0):
        """
        Entropía de Tsallis (no-aditiva)
        S_q(X) = (1 - Σ p_i^q) / (q-1)
        """
        if q == 1:
            return self.entropia_shannon(probabilidades)

        p = probabilidades[probabilidades > 0]

        suma_pq = np.sum(p ** q)
        entropia = (1 - suma_pq) / (q - 1)

        return {
            'entropia_tsallis': entropia,
            'q': q,
            'no_aditiva': True
        }

    def entropia_conjunta(self, prob_conjunta):
        """
        Entropía conjunta H(X,Y) = -ΣΣ p(x,y) log p(x,y)
        """
        p = prob_conjunta[prob_conjunta > 0]

        entropia = -np.sum(p * np.log2(p))

        return {
            'entropia_conjunta': entropia
        }

    def entropia_condicional(self, prob_conjunta):
        """
        Entropía condicional H(Y|X) = H(X,Y) - H(X)
        """
        # Marginales
        p_x = np.sum(prob_conjunta, axis=1)
        p_y = np.sum(prob_conjunta, axis=0)

        h_xy = self.entropia_conjunta(prob_conjunta)['entropia_conjunta']
        h_x = self.entropia_shannon(p_x)['entropia']

        h_y_dado_x = h_xy - h_x

        return {
            'entropia_condicional': h_y_dado_x,
            'H_XY': h_xy,
            'H_X': h_x
        }

    # ========================================================================
    # INFORMACIÓN MUTUA
    # ========================================================================

    def informacion_mutua(self, prob_conjunta):
        """
        Información mutua: I(X;Y) = H(X) + H(Y) - H(X,Y)
        Mide dependencia entre X e Y
        """
        # Marginales
        p_x = np.sum(prob_conjunta, axis=1)
        p_y = np.sum(prob_conjunta, axis=0)

        h_x = self.entropia_shannon(p_x)['entropia']
        h_y = self.entropia_shannon(p_y)['entropia']
        h_xy = self.entropia_conjunta(prob_conjunta)['entropia_conjunta']

        mi = h_x + h_y - h_xy

        # Información mutua normalizada
        if max(h_x, h_y) > 0:
            mi_normalizada = mi / max(h_x, h_y)
        else:
            mi_normalizada = 0

        return {
            'informacion_mutua': mi,
            'mi_normalizada': mi_normalizada,
            'independientes': mi < 1e-6,
            'H_X': h_x,
            'H_Y': h_y
        }

    def informacion_mutua_condicional(self, X, Y, Z):
        """
        Información mutua condicional: I(X;Y|Z)
        """
        # Implementación simplificada para variables discretas
        # En producción, usar sklearn o scipy

        return {
            'metodo': 'Información mutua condicional',
            'nota': 'Implementación completa requiere estimadores no paramétricos'
        }

    # ========================================================================
    # DIVERGENCIAS (KL, JS, Hellinger, etc.)
    # ========================================================================

    def divergencia_kl(self, p, q):
        """
        Divergencia de Kullback-Leibler: KL(P||Q) = Σ p_i log(p_i/q_i)
        No simétrica, no es métrica
        """
        # Asegurar soporte común
        mask = (p > 0) & (q > 0)

        if not np.any(mask):
            return {
                'kl_divergence': np.inf,
                'error': 'Sin soporte común'
            }

        p_masked = p[mask]
        q_masked = q[mask]

        kl = np.sum(p_masked * np.log(p_masked / q_masked))

        return {
            'kl_divergence': kl,
            'direccion': 'P hacia Q',
            'simetrica': False
        }

    def divergencia_kl_simetrica(self, p, q):
        """
        Divergencia KL simétrica (Jeffrey): D(P||Q) = KL(P||Q) + KL(Q||P)
        """
        kl_pq = self.divergencia_kl(p, q)['kl_divergence']
        kl_qp = self.divergencia_kl(q, p)['kl_divergence']

        return {
            'kl_simetrica': kl_pq + kl_qp,
            'kl_pq': kl_pq,
            'kl_qp': kl_qp
        }

    def divergencia_jensen_shannon(self, p, q, pesos=[0.5, 0.5]):
        """
        Divergencia de Jensen-Shannon: JS(P||Q) = 0.5*KL(P||M) + 0.5*KL(Q||M)
        Simétrica, limitada, métrica (su raíz cuadrada)
        """
        w1, w2 = pesos

        # Distribución media
        m = w1 * p + w2 * q

        kl_pm = self.divergencia_kl(p, m)['kl_divergence']
        kl_qm = self.divergencia_kl(q, m)['kl_divergence']

        js = w1 * kl_pm + w2 * kl_qm

        return {
            'js_divergence': js,
            'distancia_js': np.sqrt(js),  # Métrica
            'simetrica': True,
            'limitada': True
        }

    def distancia_hellinger(self, p, q):
        """
        Distancia de Hellinger: H(P,Q) = sqrt(1 - Σ sqrt(p_i * q_i))
        Métrica verdadera, limitada [0,1]
        """
        bc = np.sum(np.sqrt(p * q))  # Coeficiente Bhattacharyya

        hellinger = np.sqrt(1 - bc)

        return {
            'hellinger': hellinger,
            'bhattacharyya_coef': bc,
            'distancia': hellinger,
            'metrica': True,
            'rango': '[0, 1]'
        }

    def divergencia_total_variation(self, p, q):
        """
        Variación total: TV(P,Q) = 0.5 * Σ |p_i - q_i|
        """
        tv = 0.5 * np.sum(np.abs(p - q))

        return {
            'total_variation': tv,
            'rango': '[0, 1]',
            'metrica': True
        }

    def divergencia_chi_cuadrado(self, p, q):
        """
        Divergencia χ²: χ²(P||Q) = Σ (p_i - q_i)² / q_i
        """
        mask = q > 0

        if not np.any(mask):
            return {'error': 'Q tiene soporte vacío'}

        chi2 = np.sum((p[mask] - q[mask])**2 / q[mask])

        return {
            'chi2_divergence': chi2,
            'simetrica': False
        }

    def coeficiente_bhattacharyya(self, p, q):
        """
        Coeficiente de Bhattacharyya: BC(P,Q) = Σ sqrt(p_i * q_i)
        """
        bc = np.sum(np.sqrt(p * q))

        # Distancia de Bhattacharyya
        if bc > 0:
            distancia = -np.log(bc)
        else:
            distancia = np.inf

        return {
            'bhattacharyya_coef': bc,
            'bhattacharyya_distance': distancia,
            'rango_coef': '[0, 1]',
            'similitud': bc  # Cercano a 1 = similar
        }

    def distancia_wasserstein_1d(self, p, q, posiciones=None):
        """
        Distancia de Wasserstein (Earth Mover's Distance) para 1D
        """
        if posiciones is None:
            posiciones = np.arange(len(p))

        # CDF acumulada
        cdf_p = np.cumsum(p)
        cdf_q = np.cumsum(q)

        # Distancia = integral de |CDF_P - CDF_Q|
        wasserstein = np.sum(np.abs(cdf_p - cdf_q)) * (posiciones[1] - posiciones[0]) if len(posiciones) > 1 else 0

        return {
            'wasserstein_distance': wasserstein,
            'earth_mover': wasserstein,
            'metrica': True
        }

    # ========================================================================
    # CRITERIOS DE SELECCIÓN DE MODELOS
    # ========================================================================

    def aic(self, log_likelihood, n_parametros):
        """
        Criterio de Información de Akaike: AIC = 2k - 2ln(L)
        Menor es mejor
        """
        aic = 2 * n_parametros - 2 * log_likelihood

        return {
            'AIC': aic,
            'n_parametros': n_parametros,
            'log_likelihood': log_likelihood,
            'criterio': 'Menor es mejor'
        }

    def aicc(self, log_likelihood, n_parametros, n_observaciones):
        """
        AIC corregido (para muestras pequeñas)
        AICc = AIC + 2k(k+1)/(n-k-1)
        """
        aic = self.aic(log_likelihood, n_parametros)['AIC']

        if n_observaciones - n_parametros - 1 > 0:
            correccion = (2 * n_parametros * (n_parametros + 1)) / (n_observaciones - n_parametros - 1)
            aicc = aic + correccion
        else:
            aicc = np.inf

        return {
            'AICc': aicc,
            'AIC': aic,
            'n_parametros': n_parametros,
            'n_observaciones': n_observaciones,
            'usar_si': 'n/k < 40'
        }

    def bic(self, log_likelihood, n_parametros, n_observaciones):
        """
        Criterio de Información Bayesiano (Schwarz)
        BIC = k*ln(n) - 2ln(L)
        """
        bic = n_parametros * np.log(n_observaciones) - 2 * log_likelihood

        return {
            'BIC': bic,
            'n_parametros': n_parametros,
            'n_observaciones': n_observaciones,
            'penalizacion': 'Más severa que AIC para n grande'
        }

    def hqic(self, log_likelihood, n_parametros, n_observaciones):
        """
        Criterio de Hannan-Quinn
        HQIC = 2k*ln(ln(n)) - 2ln(L)
        """
        hqic = 2 * n_parametros * np.log(np.log(n_observaciones)) - 2 * log_likelihood

        return {
            'HQIC': hqic,
            'penalizacion': 'Entre AIC y BIC'
        }

    def mdl(self, log_likelihood, n_parametros, n_observaciones):
        """
        Minimum Description Length
        Equivalente a BIC en muchos contextos
        """
        # Versión simplificada
        mdl = -log_likelihood + 0.5 * n_parametros * np.log(n_observaciones)

        return {
            'MDL': mdl,
            'equivalencia': 'Similar a BIC/2',
            'interpretacion': 'Longitud mínima de codificación'
        }

    def dic_bayesiano(self, log_likelihood_posterior_media, log_likelihood_muestras):
        """
        Deviance Information Criterion (Bayesiano)
        DIC = pD + D̄,  pD = D̄ - D(θ̄)
        """
        # D(θ) = -2 * log p(y|θ)
        D_barra = -2 * np.mean(log_likelihood_muestras)
        D_theta_barra = -2 * log_likelihood_posterior_media

        pD = D_barra - D_theta_barra  # Effective number of parameters
        dic = pD + D_barra

        return {
            'DIC': dic,
            'pD': pD,
            'D_bar': D_barra,
            'metodo': 'Bayesiano'
        }

    def waic(self, log_likelihood_por_observacion_y_muestra):
        """
        Watanabe-Akaike Information Criterion (Bayesiano)
        WAIC = -2 * (lppd - p_WAIC)
        """
        # lppd: log pointwise predictive density
        # log_lik: matriz (n_observaciones, n_muestras_posterior)

        log_lik = log_likelihood_por_observacion_y_muestra

        # lppd
        lppd = np.sum(np.log(np.mean(np.exp(log_lik), axis=1)))

        # p_WAIC (effective number of parameters)
        p_waic = np.sum(np.var(log_lik, axis=1))

        waic = -2 * (lppd - p_waic)

        return {
            'WAIC': waic,
            'lppd': lppd,
            'p_WAIC': p_waic,
            'metodo': 'Bayesiano (mejor que DIC)'
        }

    # ========================================================================
    # CROSS-ENTROPY Y LOG-LOSS
    # ========================================================================

    def cross_entropy(self, p_true, p_pred):
        """
        Cross-entropy: H(P,Q) = -Σ p(x) log q(x)
        Mide qué tan bien Q predice P
        """
        # Evitar log(0)
        q_safe = np.clip(p_pred, 1e-15, 1 - 1e-15)

        ce = -np.sum(p_true * np.log(q_safe))

        return {
            'cross_entropy': ce,
            'uso': 'Función de pérdida en clasificación'
        }

    def log_loss_binario(self, y_true, y_pred_proba):
        """
        Log-loss para clasificación binaria
        """
        # Clip probabilities
        y_pred_proba = np.clip(y_pred_proba, 1e-15, 1 - 1e-15)

        log_loss = -np.mean(y_true * np.log(y_pred_proba) +
                           (1 - y_true) * np.log(1 - y_pred_proba))

        return {
            'log_loss': log_loss,
            'interpretacion': 'Menor es mejor (0 = perfecto)'
        }

    # ========================================================================
    # PERPLEXITY (Modelos de Lenguaje)
    # ========================================================================

    def perplexity(self, probabilidades_predichas):
        """
        Perplexity: exp(H) = exp(-Σ p log p)
        Usado en modelos de lenguaje
        """
        h = self.entropia_shannon(probabilidades_predichas)['entropia']

        perplexity = 2 ** h

        return {
            'perplexity': perplexity,
            'entropia': h,
            'interpretacion': 'Promedio de posibilidades por decisión'
        }


# ============================================================================
# EJEMPLO DE USO
# ============================================================================

if __name__ == "__main__":
    print("="*80)
    print("MOTOR TEORÍA DE LA INFORMACIÓN")
    print("="*80)

    motor = MotorTeoriaInformacion()

    # 1. Entropía de Shannon
    print("\n1. ENTROPÍA DE SHANNON:")
    p = np.array([0.5, 0.25, 0.125, 0.125])
    ent = motor.entropia_shannon(p)
    print(f"   Distribución: {p}")
    print(f"   H(X) = {ent['entropia']:.4f} bits")
    print(f"   H_max = {ent['entropia_max']:.4f} bits")
    print(f"   Normalizada = {ent['entropia_normalizada']:.2%}")

    # 2. Divergencia KL
    print("\n2. DIVERGENCIA KL:")
    q = np.array([0.4, 0.3, 0.2, 0.1])
    kl = motor.divergencia_kl(p, q)
    print(f"   KL(P||Q) = {kl['kl_divergence']:.4f}")

    # 3. Divergencia Jensen-Shannon
    print("\n3. DIVERGENCIA JENSEN-SHANNON:")
    js = motor.divergencia_jensen_shannon(p, q)
    print(f"   JS(P||Q) = {js['js_divergence']:.4f}")
    print(f"   Distancia JS = {js['distancia_js']:.4f}")

    # 4. Distancia Hellinger
    print("\n4. DISTANCIA HELLINGER:")
    hellinger = motor.distancia_hellinger(p, q)
    print(f"   d_H(P,Q) = {hellinger['hellinger']:.4f}")
    print(f"   Coef. Bhattacharyya = {hellinger['bhattacharyya_coef']:.4f}")

    # 5. Información Mutua
    print("\n5. INFORMACIÓN MUTUA:")
    # Distribución conjunta 2x2
    prob_conjunta = np.array([[0.4, 0.1],
                             [0.2, 0.3]])
    mi = motor.informacion_mutua(prob_conjunta)
    print(f"   I(X;Y) = {mi['informacion_mutua']:.4f} bits")
    print(f"   Normalizada = {mi['mi_normalizada']:.2%}")
    print(f"   Independientes: {mi['independientes']}")

    # 6. Criterios de Modelo
    print("\n6. CRITERIOS DE SELECCIÓN (Modelo con LL=-100, k=5, n=200):")
    aic = motor.aic(-100, 5)
    bic = motor.bic(-100, 5, 200)
    aicc = motor.aicc(-100, 5, 200)
    print(f"   AIC  = {aic['AIC']:.2f}")
    print(f"   AICc = {aicc['AICc']:.2f}")
    print(f"   BIC  = {bic['BIC']:.2f}")

    # 7. Log-loss
    print("\n7. LOG-LOSS (Clasificación Binaria):")
    y_true = np.array([1, 0, 1, 1, 0])
    y_pred = np.array([0.9, 0.1, 0.8, 0.7, 0.3])
    ll = motor.log_loss_binario(y_true, y_pred)
    print(f"   Log-loss = {ll['log_loss']:.4f}")

    print("\n" + "="*80)
    print("EXTENSIÓN 2 OPERATIVA")
    print("="*80)

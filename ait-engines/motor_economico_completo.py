"""
MOTOR ECONÓMICO COMPLETO
Biblioteca total: microeconomía, macroeconomía, IO, comercio, laboral, público
"""

import numpy as np
from scipy import optimize
from scipy.special import comb


class MotorEconomicoCompleto:
    """Motor económico con TODA la biblioteca de modelos"""

    def __init__(self):
        self.cache = {}

    # ========================================================================
    # 1. MICROECONOMÍA: TEORÍA DEL CONSUMIDOR
    # ========================================================================

    def utilidad_cobb_douglas(self, x1, x2, alpha=0.5, beta=0.5):
        """Función de utilidad Cobb-Douglas"""
        return (x1 ** alpha) * (x2 ** beta)

    def utilidad_ces(self, x1, x2, rho=0.5, alpha=0.5):
        """Utilidad CES (Elasticidad de Sustitución Constante)"""
        return (alpha * x1**rho + (1 - alpha) * x2**rho) ** (1 / rho)

    def utilidad_leontief(self, x1, x2, a=1, b=1):
        """Utilidad Leontief (complementos perfectos)"""
        return min(x1 / a, x2 / b)

    def utilidad_cuasilineal(self, x1, x2, v_fn=None):
        """Utilidad cuasilineal: U = x1 + v(x2)"""
        if v_fn is None:
            v_fn = np.sqrt  # Por defecto v(x2) = sqrt(x2)

        return x1 + v_fn(x2)

    def demanda_marshalliana_cd(self, p1, p2, ingreso, alpha=0.5):
        """Demanda Marshalliana con Cobb-Douglas"""
        x1_star = (alpha * ingreso) / p1
        x2_star = ((1 - alpha) * ingreso) / p2

        return {
            'x1': x1_star,
            'x2': x2_star,
            'utilidad': self.utilidad_cobb_douglas(x1_star, x2_star, alpha),
            'gasto': p1 * x1_star + p2 * x2_star
        }

    def demanda_hicksiana_cd(self, p1, p2, utilidad_objetivo, alpha=0.5):
        """Demanda Hicksiana (compensada) con Cobb-Douglas"""
        # Minimizar gasto sujeto a U = U_objetivo
        x1_star = utilidad_objetivo * ((1 - alpha) * p1 / (alpha * p2)) ** (alpha - 1)
        x2_star = utilidad_objetivo * ((1 - alpha) * p1 / (alpha * p2)) ** (-alpha)

        return {
            'x1': x1_star,
            'x2': x2_star,
            'gasto_minimo': p1 * x1_star + p2 * x2_star
        }

    def elasticidad_precio_demanda(self, precios, cantidades, metodo='log-log'):
        """Elasticidad precio de la demanda"""
        if metodo == 'log-log':
            log_p = np.log(precios)
            log_q = np.log(cantidades)
            coef = np.polyfit(log_p, log_q, 1)
            elasticidad = coef[0]

        elif metodo == 'punto':
            # Elasticidad en un punto (promedio)
            dQ = np.diff(cantidades)
            dP = np.diff(precios)
            Q_media = (cantidades[:-1] + cantidades[1:]) / 2
            P_media = (precios[:-1] + precios[1:]) / 2

            elasticidad = np.mean((dQ / Q_media) / (dP / P_media))

        return {
            'elasticidad': elasticidad,
            'tipo': 'elástica' if abs(elasticidad) > 1 else 'inelástica',
            'interpretacion': f'Un aumento del 1% en precio → {elasticidad:.2f}% cambio en cantidad'
        }

    def excedente_consumidor_lineal(self, precio_max, precio_mercado, cantidad_mercado):
        """Excedente del consumidor con demanda lineal"""
        ec = 0.5 * (precio_max - precio_mercado) * cantidad_mercado

        return {
            'excedente_consumidor': ec,
            'precio_max': precio_max,
            'precio_mercado': precio_mercado
        }

    def efecto_sustitucion_ingreso(self, p1_inicial, p1_final, p2, ingreso, alpha=0.5):
        """Descomposición de Slutsky (efecto sustitución e ingreso)"""
        # Demanda inicial
        dem_inicial = self.demanda_marshalliana_cd(p1_inicial, p2, ingreso, alpha)

        # Demanda final
        dem_final = self.demanda_marshalliana_cd(p1_final, p2, ingreso, alpha)

        # Demanda intermedia (mismo poder adquisitivo)
        gasto_inicial = p1_inicial * dem_inicial['x1'] + p2 * dem_inicial['x2']
        dem_intermedia = self.demanda_marshalliana_cd(p1_final, p2, gasto_inicial, alpha)

        # Efectos
        efecto_sustitucion = dem_intermedia['x1'] - dem_inicial['x1']
        efecto_ingreso = dem_final['x1'] - dem_intermedia['x1']
        efecto_total = dem_final['x1'] - dem_inicial['x1']

        return {
            'efecto_sustitucion': efecto_sustitucion,
            'efecto_ingreso': efecto_ingreso,
            'efecto_total': efecto_total,
            'verificacion': abs(efecto_total - (efecto_sustitucion + efecto_ingreso)) < 1e-6
        }

    # ========================================================================
    # 2. MICROECONOMÍA: TEORÍA DE LA EMPRESA
    # ========================================================================

    def produccion_cobb_douglas(self, K, L, A=1, alpha=0.3, beta=0.7):
        """Función de producción Cobb-Douglas"""
        return A * (K ** alpha) * (L ** beta)

    def produccion_ces(self, K, L, A=1, rho=0.5, alpha=0.5):
        """Función de producción CES"""
        return A * (alpha * K**rho + (1 - alpha) * L**rho) ** (1 / rho)

    def productividad_marginal(self, K, L, A=1, alpha=0.3, beta=0.7):
        """Productividades marginales (Cobb-Douglas)"""
        PMgK = alpha * A * (K ** (alpha - 1)) * (L ** beta)
        PMgL = beta * A * (K ** alpha) * (L ** (beta - 1))

        return {
            'PMgK': PMgK,
            'PMgL': PMgL,
            'TMST': PMgK / PMgL if PMgL > 0 else np.inf  # Tasa marginal de sustitución técnica
        }

    def coste_total(self, Q, CF=100, CV_fn=None):
        """Coste total, medio y marginal"""
        if CV_fn is None:
            CV_fn = lambda q: 2 * q + 0.5 * q**2  # Por defecto cuadrático

        CT = CF + CV_fn(Q)
        CMe = CT / Q if Q > 0 else np.inf
        CV = CV_fn(Q)
        CVMe = CV / Q if Q > 0 else np.inf

        return {
            'coste_total': CT,
            'coste_fijo': CF,
            'coste_variable': CV,
            'coste_medio': CMe,
            'coste_variable_medio': CVMe
        }

    def coste_marginal_numerico(self, Q, CF=100, CV_fn=None, delta=0.01):
        """Coste marginal (aproximación numérica)"""
        if CV_fn is None:
            CV_fn = lambda q: 2 * q + 0.5 * q**2

        CT_Q = CF + CV_fn(Q)
        CT_Q_delta = CF + CV_fn(Q + delta)

        CMg = (CT_Q_delta - CT_Q) / delta

        return {
            'coste_marginal': CMg,
            'Q': Q
        }

    def maximizacion_beneficio_competencia(self, P, CF=100, CV_fn=None):
        """Maximización de beneficios en competencia perfecta"""
        if CV_fn is None:
            CV_fn = lambda q: 2 * q + 0.5 * q**2

        # Maximizar π = P*Q - CF - CV(Q)
        def beneficio_negativo(Q):
            if Q < 0:
                return 1e10
            return -(P * Q - CF - CV_fn(Q))

        resultado = optimize.minimize_scalar(beneficio_negativo, bounds=(0, 1000), method='bounded')
        Q_optimo = resultado.x
        beneficio_max = -resultado.fun

        return {
            'Q_optimo': Q_optimo,
            'beneficio_maximo': beneficio_max,
            'ingreso_total': P * Q_optimo,
            'coste_total': CF + CV_fn(Q_optimo)
        }

    # ========================================================================
    # 3. ORGANIZACIÓN INDUSTRIAL
    # ========================================================================

    def equilibrio_cournot(self, costes_marginales, demanda_intercepto, demanda_pendiente, n_empresas=None):
        """Equilibrio de Cournot (competencia en cantidades)"""
        if n_empresas is None:
            n_empresas = len(costes_marginales)

        c = np.mean(costes_marginales)
        a = demanda_intercepto
        b = demanda_pendiente

        # Cantidad por empresa (simétrico)
        q_i = (a - c) / (b * (n_empresas + 1))
        Q_total = n_empresas * q_i

        # Precio de equilibrio: P = a - b*Q
        P = a - b * Q_total

        # Beneficio por empresa
        beneficio_i = (P - c) * q_i

        return {
            'cantidad_por_empresa': q_i,
            'cantidad_total': Q_total,
            'precio_equilibrio': P,
            'beneficio_por_empresa': beneficio_i,
            'excedente_consumidor': 0.5 * b * Q_total ** 2,
            'indice_lerner': (P - c) / P if P > 0 else 0  # Poder de mercado
        }

    def equilibrio_bertrand(self, costes_marginales):
        """Equilibrio de Bertrand (competencia en precios, productos homogéneos)"""
        c_ordenados = np.sort(costes_marginales)

        if len(c_ordenados) > 1:
            precio_equilibrio = c_ordenados[1]  # Segundo coste más bajo
        else:
            precio_equilibrio = c_ordenados[0]

        return {
            'precio_equilibrio': precio_equilibrio,
            'empresa_ganadora': np.argmin(costes_marginales),
            'beneficio_total': 0  # Competencia perfecta
        }

    def equilibrio_stackelberg(self, c_lider, c_seguidor, a, b):
        """Equilibrio de Stackelberg (líder-seguidor)"""
        # Líder mueve primero
        # Mejor respuesta del seguidor: q2 = (a - c2 - b*q1) / (2b)
        # Líder anticipa y maximiza

        q1_lider = (a - c_lider) / (2 * b)
        q2_seguidor = (a - c_seguidor - b * q1_lider) / (2 * b)

        Q_total = q1_lider + q2_seguidor
        P = a - b * Q_total

        beneficio_lider = (P - c_lider) * q1_lider
        beneficio_seguidor = (P - c_seguidor) * q2_seguidor

        return {
            'q_lider': q1_lider,
            'q_seguidor': q2_seguidor,
            'precio': P,
            'beneficio_lider': beneficio_lider,
            'beneficio_seguidor': beneficio_seguidor
        }

    def monopolio_precio_discriminacion(self, demandas_segmentos, costes_marginales):
        """Monopolio con discriminación de precios de 3er grado"""
        # demandas_segmentos: lista de (a, b) por segmento
        # Maximizar π = Σ (Pi * Qi - c * Qi)

        resultados = []

        for (a, b) in demandas_segmentos:
            c = costes_marginales

            # Maximizar (a - b*Q)*Q - c*Q
            # FOC: a - 2*b*Q - c = 0
            Q_opt = (a - c) / (2 * b)
            P_opt = a - b * Q_opt

            beneficio = (P_opt - c) * Q_opt

            resultados.append({
                'cantidad': Q_opt,
                'precio': P_opt,
                'beneficio': beneficio,
                'elasticidad': -P_opt / (b * Q_opt) if Q_opt > 0 else np.inf
            })

        beneficio_total = sum(r['beneficio'] for r in resultados)

        return {
            'segmentos': resultados,
            'beneficio_total': beneficio_total
        }

    def indice_herfindahl(self, cuotas_mercado):
        """Índice Herfindahl-Hirschman (concentración de mercado)"""
        hhi = np.sum(cuotas_mercado ** 2)

        if hhi < 0.15:
            interpretacion = 'competitivo'
        elif hhi < 0.25:
            interpretacion = 'moderadamente_concentrado'
        else:
            interpretacion = 'altamente_concentrado'

        return {
            'hhi': hhi,
            'n_equivalente': 1 / hhi if hhi > 0 else np.inf,
            'interpretacion': interpretacion
        }

    def indice_lerner(self, precio, coste_marginal):
        """Índice de Lerner (poder de mercado)"""
        if precio == 0:
            return {'lerner': np.nan, 'interpretacion': 'precio_cero'}

        lerner = (precio - coste_marginal) / precio

        return {
            'lerner': lerner,
            'interpretacion': 'competencia_perfecta' if lerner < 0.1 else 'poder_mercado'
        }

    # ========================================================================
    # 4. VALORACIÓN Y CLV
    # ========================================================================

    def clv_basico(self, ingresos_promedio, tasa_retencion, tasa_descuento, periodos=60):
        """Customer Lifetime Value (simulación + fórmula cerrada)"""
        clv_sim = 0
        for t in range(periodos):
            clv_sim += (ingresos_promedio * (tasa_retencion ** t)) / ((1 + tasa_descuento) ** t)

        # Fórmula cerrada
        if tasa_retencion / (1 + tasa_descuento) < 1:
            clv_formula = ingresos_promedio / (1 + tasa_descuento - tasa_retencion)
        else:
            clv_formula = np.inf

        return {
            'clv_simulado': clv_sim,
            'clv_formula': clv_formula,
            'tasa_retencion': tasa_retencion,
            'tasa_descuento': tasa_descuento
        }

    def clv_con_crecimiento(self, ingresos_inicial, tasa_retencion, tasa_descuento, tasa_crecimiento, periodos=60):
        """CLV con crecimiento de ingresos"""
        clv = 0
        for t in range(periodos):
            ingreso_t = ingresos_inicial * ((1 + tasa_crecimiento) ** t)
            clv += (ingreso_t * (tasa_retencion ** t)) / ((1 + tasa_descuento) ** t)

        return {
            'clv': clv,
            'ingresos_inicial': ingresos_inicial,
            'tasa_crecimiento': tasa_crecimiento
        }

    def valor_presente_neto(self, flujos_caja, tasa_descuento):
        """VPN (Valor Presente Neto)"""
        vpn = sum(fc / ((1 + tasa_descuento) ** t) for t, fc in enumerate(flujos_caja))

        return {
            'vpn': vpn,
            'decision': 'aceptar' if vpn > 0 else 'rechazar'
        }

    # ========================================================================
    # 5. TEORÍA DE SUBASTAS Y MECANISMOS
    # ========================================================================

    def subasta_primer_precio(self, valoraciones, n_participantes):
        """Subasta de primer precio (sealed-bid)"""
        # Estrategia de equilibrio: bidding = (n-1)/n * valoración
        bids = [(n_participantes - 1) / n_participantes * v for v in valoraciones]

        ganador = np.argmax(bids)
        precio = bids[ganador]

        return {
            'ganador': ganador,
            'precio_pagado': precio,
            'valoracion_ganador': valoraciones[ganador],
            'excedente_ganador': valoraciones[ganador] - precio
        }

    def subasta_segundo_precio(self, valoraciones):
        """Subasta de segundo precio (Vickrey)"""
        valoraciones_ordenadas = sorted(valoraciones, reverse=True)

        ganador = np.argmax(valoraciones)
        precio = valoraciones_ordenadas[1] if len(valoraciones_ordenadas) > 1 else valoraciones_ordenadas[0]

        return {
            'ganador': ganador,
            'precio_pagado': precio,
            'valoracion_ganador': valoraciones[ganador],
            'excedente_ganador': valoraciones[ganador] - precio,
            'propiedad': 'incentivo_compatible'  # Decir la verdad es estrategia dominante
        }

    def revenue_equivalence(self, valoraciones_media, n_participantes):
        """Teorema de equivalencia de ingresos (subastas)"""
        # Revenue esperado en subastas simétricas
        # E[Revenue] = E[2nd highest valuation]

        # Simulación simple
        revenue_simulado = valoraciones_media * (n_participantes - 1) / (n_participantes + 1)

        return {
            'revenue_esperado': revenue_simulado,
            'n_participantes': n_participantes
        }

    # ========================================================================
    # 6. ECONOMÍA LABORAL
    # ========================================================================

    def ecuacion_mincer(self, años_educacion, experiencia, experiencia2=None):
        """Ecuación de Mincer (retornos a la educación)"""
        # log(salario) = β0 + β1*educación + β2*experiencia + β3*experiencia² + ε

        # Parámetros típicos (ejemplo)
        beta0 = 1.5  # Intercepto (log-salario base)
        beta1 = 0.08  # Retorno por año de educación (~8%)
        beta2 = 0.04  # Retorno por año de experiencia
        beta3 = -0.0008  # Término cuadrático (rendimientos decrecientes)

        if experiencia2 is None:
            experiencia2 = experiencia ** 2

        log_salario = beta0 + beta1 * años_educacion + beta2 * experiencia + beta3 * experiencia2
        salario = np.exp(log_salario)

        return {
            'salario_estimado': salario,
            'log_salario': log_salario,
            'retorno_educacion': beta1,
            'interpretacion': f'Un año adicional de educación → {beta1*100:.1f}% más salario'
        }

    def tasa_participacion_laboral(self, poblacion_activa, poblacion_edad_trabajar):
        """Tasa de participación laboral"""
        tasa = poblacion_activa / poblacion_edad_trabajar if poblacion_edad_trabajar > 0 else 0

        return {
            'tasa_participacion': tasa,
            'porcentaje': tasa * 100
        }

    def tasa_desempleo(self, desempleados, poblacion_activa):
        """Tasa de desempleo"""
        tasa = desempleados / poblacion_activa if poblacion_activa > 0 else 0

        return {
            'tasa_desempleo': tasa,
            'porcentaje': tasa * 100
        }

    # ========================================================================
    # 7. ECONOMÍA PÚBLICA
    # ========================================================================

    def incidencia_impuesto(self, demanda_a, demanda_b, oferta_a, oferta_b, impuesto):
        """Incidencia de un impuesto (quién lo paga realmente)"""
        # Demanda: P = a - b*Q
        # Oferta: P = a' + b'*Q

        # Equilibrio sin impuesto
        Q_eq = (demanda_a - oferta_a) / (oferta_b + demanda_b)
        P_eq = demanda_a - demanda_b * Q_eq

        # Equilibrio con impuesto (sobre productores)
        Q_eq_tax = (demanda_a - oferta_a - impuesto) / (oferta_b + demanda_b)
        P_demanda_tax = demanda_a - demanda_b * Q_eq_tax
        P_oferta_tax = P_demanda_tax - impuesto

        # Incidencia
        carga_consumidores = P_demanda_tax - P_eq
        carga_productores = P_eq - P_oferta_tax

        return {
            'precio_antes': P_eq,
            'precio_consumidores': P_demanda_tax,
            'precio_productores': P_oferta_tax,
            'carga_consumidores': carga_consumidores,
            'carga_productores': carga_productores,
            'porcentaje_consumidores': carga_consumidores / impuesto if impuesto > 0 else 0,
            'perdida_eficiencia': 0.5 * impuesto * (Q_eq - Q_eq_tax)
        }

    def bien_publico_provision_optima(self, beneficios_marginales_individuos, coste_marginal):
        """Provisión óptima de bien público"""
        # Condición de Samuelson: Σ BMg_i = CMg

        suma_beneficios_marginales = sum(beneficios_marginales_individuos)

        provision_optima = suma_beneficios_marginales >= coste_marginal

        return {
            'suma_bmg': suma_beneficios_marginales,
            'coste_marginal': coste_marginal,
            'provision_optima': provision_optima,
            'exceso_beneficio': suma_beneficios_marginales - coste_marginal
        }

    # ========================================================================
    # 8. ECONOMÍA INTERNACIONAL
    # ========================================================================

    def ventaja_comparativa_ricardo(self, costes_pais1, costes_pais2):
        """Ventaja comparativa (Ricardo)"""
        # costes_pais1/2: [coste bien A, coste bien B]

        ratio_pais1 = costes_pais1[0] / costes_pais1[1]
        ratio_pais2 = costes_pais2[0] / costes_pais2[1]

        if ratio_pais1 < ratio_pais2:
            return {
                'pais1_especializa': 'bien_A',
                'pais2_especializa': 'bien_B',
                'ganancia_comercio': True
            }
        else:
            return {
                'pais1_especializa': 'bien_B',
                'pais2_especializa': 'bien_A',
                'ganancia_comercio': True
            }

    def terminos_intercambio(self, indice_precios_exportaciones, indice_precios_importaciones):
        """Términos de intercambio"""
        tdi = (indice_precios_exportaciones / indice_precios_importaciones) * 100

        return {
            'terminos_intercambio': tdi,
            'interpretacion': 'mejora' if tdi > 100 else 'deterioro'
        }

    # ========================================================================
    # 9. CRECIMIENTO Y DESARROLLO
    # ========================================================================

    def modelo_solow_estado_estacionario(self, s, delta, n, g, alpha=0.3):
        """Estado estacionario del modelo de Solow"""
        # s: tasa de ahorro
        # delta: depreciación
        # n: crecimiento población
        # g: progreso tecnológico
        # alpha: participación del capital

        k_star = (s / (delta + n + g)) ** (1 / (1 - alpha))
        y_star = k_star ** alpha

        return {
            'k_estrella': k_star,
            'y_estrella': y_star,
            'tasa_ahorro': s,
            'crecimiento_estado_estacionario': n + g
        }

    def regla_oro_solow(self, delta, n, g, alpha=0.3):
        """Regla de oro del modelo de Solow (consumo máximo)"""
        # s* que maximiza consumo en estado estacionario

        s_oro = alpha

        k_oro = (alpha / (delta + n + g)) ** (1 / (1 - alpha))
        y_oro = k_oro ** alpha
        c_oro = y_oro - (delta + n + g) * k_oro

        return {
            's_regla_oro': s_oro,
            'k_oro': k_oro,
            'consumo_oro': c_oro
        }

    # ========================================================================
    # 10. BEHAVIORAL ECONOMICS
    # ========================================================================

    def descuento_hiperbolico(self, flujo_futuro, periodos, beta=0.9, delta=0.95):
        """Descuento hiperbólico (present bias)"""
        # Modelo β-δ

        vp_exponencial = flujo_futuro / ((1 + (1/delta - 1)) ** periodos)
        vp_hiperbolico = beta * (delta ** periodos) * flujo_futuro

        return {
            'vp_exponencial': vp_exponencial,
            'vp_hiperbolico': vp_hiperbolico,
            'sesgo_presente': vp_exponencial - vp_hiperbolico,
            'beta': beta,
            'delta': delta
        }

    def prospect_theory_value(self, ganancia_perdida, alpha=0.88, lambda_param=2.25):
        """Función de valor de Prospect Theory (Kahneman-Tversky)"""
        # v(x) = x^α si x >= 0
        # v(x) = -λ * (-x)^α si x < 0

        if ganancia_perdida >= 0:
            valor = ganancia_perdida ** alpha
        else:
            valor = -lambda_param * ((-ganancia_perdida) ** alpha)

        return {
            'valor': valor,
            'ganancia_perdida': ganancia_perdida,
            'aversion_perdidas': lambda_param
        }


# ============================================================================
# EJEMPLO DE USO
# ============================================================================

if __name__ == "__main__":
    print("="*80)
    print("MOTOR ECONÓMICO COMPLETO - BATERÍA DE PRUEBAS")
    print("="*80)

    motor = MotorEconomicoCompleto()

    # 1. Demanda Marshalliana
    print("\n1. DEMANDA MARSHALLIANA (COBB-DOUGLAS):")
    dem = motor.demanda_marshalliana_cd(p1=2, p2=3, ingreso=100, alpha=0.4)
    print(f"   x1* = {dem['x1']:.2f}, x2* = {dem['x2']:.2f}")
    print(f"   Utilidad = {dem['utilidad']:.2f}")

    # 2. Equilibrio de Cournot
    print("\n2. EQUILIBRIO DE COURNOT:")
    cournot = motor.equilibrio_cournot([20, 20], demanda_intercepto=100,
                                       demanda_pendiente=1, n_empresas=2)
    print(f"   Cantidad por empresa: {cournot['cantidad_por_empresa']:.2f}")
    print(f"   Precio: {cournot['precio_equilibrio']:.2f}")
    print(f"   Índice de Lerner: {cournot['indice_lerner']:.2f}")

    # 3. CLV
    print("\n3. CUSTOMER LIFETIME VALUE:")
    clv = motor.clv_basico(ingresos_promedio=50, tasa_retencion=0.8, tasa_descuento=0.1)
    print(f"   CLV (fórmula): {clv['clv_formula']:.2f}")

    # 4. Subasta de segundo precio
    print("\n4. SUBASTA DE SEGUNDO PRECIO:")
    subasta = motor.subasta_segundo_precio([100, 80, 90, 70])
    print(f"   Ganador: {subasta['ganador']}")
    print(f"   Precio pagado: {subasta['precio_pagado']:.2f}")
    print(f"   Excedente: {subasta['excedente_ganador']:.2f}")

    # 5. Modelo de Solow
    print("\n5. MODELO DE SOLOW (ESTADO ESTACIONARIO):")
    solow = motor.modelo_solow_estado_estacionario(s=0.3, delta=0.05, n=0.02, g=0.03)
    print(f"   k*: {solow['k_estrella']:.2f}")
    print(f"   y*: {solow['y_estrella']:.2f}")

    # 6. Incidencia de impuesto
    print("\n6. INCIDENCIA DE IMPUESTO:")
    inc = motor.incidencia_impuesto(demanda_a=100, demanda_b=2, oferta_a=10,
                                    oferta_b=1, impuesto=10)
    print(f"   Carga consumidores: {inc['carga_consumidores']:.2f}")
    print(f"   Carga productores: {inc['carga_productores']:.2f}")
    print(f"   % consumidores: {inc['porcentaje_consumidores']*100:.1f}%")

    # 7. Prospect Theory
    print("\n7. PROSPECT THEORY:")
    pt_ganancia = motor.prospect_theory_value(100)
    pt_perdida = motor.prospect_theory_value(-100)
    print(f"   Valor ganancia $100: {pt_ganancia['valor']:.2f}")
    print(f"   Valor pérdida $100: {pt_perdida['valor']:.2f}")
    print(f"   Ratio (aversión pérdidas): {abs(pt_perdida['valor'] / pt_ganancia['valor']):.2f}")

    print("\n" + "="*80)
    print("MOTOR ECONÓMICO COMPLETO OPERATIVO")
    print("="*80)

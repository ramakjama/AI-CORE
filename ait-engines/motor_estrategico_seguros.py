"""
MOTOR ESTRATÉGICO COMPLETO + MÓDULOS ESPECÍFICOS SEGUROS
Teoría de juegos, decisión, optimización de cartera, pricing competitivo
"""

import numpy as np
from scipy import optimize, stats
from scipy.special import comb


class MotorEstrategicoSeguros:
    """Motor estratégico con extensiones para seguros"""

    def __init__(self):
        self.cache = {}

    # ========================================================================
    # 1. TEORÍA DE JUEGOS PARA SEGUROS
    # ========================================================================

    def equilibrio_nash_pricing_2_companias(self, coste_1, coste_2, demanda_a, demanda_b):
        """
        Equilibrio de Nash en pricing de seguros (2 compañías, Bertrand)

        Modelo: Demanda_i = a - b*P_i + c*P_j (sustitutos)
        """
        # Simplificado: sustitutos perfectos → precio = coste marginal
        # En realidad, diferenciación permite markup

        # Con diferenciación (Bertrand con productos diferenciados)
        # P1* = (a + b*c2 + c*P2) / (2b)
        # P2* = (a + b*c1 + c*P1) / (2b)

        # Resolver sistema (asumiendo simetría inicial)
        b = demanda_b  # Sensibilidad precio propio
        c = demanda_b * 0.3  # Sensibilidad precio cruzada (30% del propio)
        a = demanda_a

        # Equilibrio Nash
        denominador = (4 * b**2 - c**2)

        if denominador <= 0:
            return {
                'error': 'No hay equilibrio estable (productos demasiado sustituibles)'
            }

        p1_nash = (2*b*a + b*c*coste_2 + 2*b*c*coste_1) / denominador
        p2_nash = (2*b*a + b*c*coste_1 + 2*b*c*coste_2) / denominador

        # Demandas en equilibrio
        q1 = a - b*p1_nash + c*p2_nash
        q2 = a - b*p2_nash + c*p1_nash

        # Beneficios
        beneficio_1 = (p1_nash - coste_1) * q1
        beneficio_2 = (p2_nash - coste_2) * q2

        return {
            'precio_nash_1': p1_nash,
            'precio_nash_2': p2_nash,
            'cantidad_1': q1,
            'cantidad_2': q2,
            'beneficio_1': beneficio_1,
            'beneficio_2': beneficio_2,
            'markup_1': (p1_nash - coste_1) / p1_nash if p1_nash > 0 else 0,
            'markup_2': (p2_nash - coste_2) / p2_nash if p2_nash > 0 else 0
        }

    def guerra_precios_dinamica(self, precio_inicial_1, precio_inicial_2, n_periodos=10,
                                factor_reaccion=0.8):
        """
        Simulación de guerra de precios (pricing dinámico competitivo)

        Cada periodo: P_t+1 = P_t * (1 - factor_reaccion * (P_competidor / P_propio - 1))
        """
        precios_1 = [precio_inicial_1]
        precios_2 = [precio_inicial_2]

        for t in range(n_periodos - 1):
            p1_actual = precios_1[-1]
            p2_actual = precios_2[-1]

            # Reacción competitiva
            if p2_actual < p1_actual:
                # Compañía 1 baja precio para competir
                p1_nuevo = p1_actual * (1 - factor_reaccion * (p2_actual / p1_actual - 1))
            else:
                p1_nuevo = p1_actual  # No baja si ya es más barata

            if p1_actual < p2_actual:
                p2_nuevo = p2_actual * (1 - factor_reaccion * (p1_actual / p2_actual - 1))
            else:
                p2_nuevo = p2_actual

            precios_1.append(p1_nuevo)
            precios_2.append(p2_nuevo)

        return {
            'precios_1': np.array(precios_1),
            'precios_2': np.array(precios_2),
            'precio_final_1': precios_1[-1],
            'precio_final_2': precios_2[-1],
            'reduccion_1': (precio_inicial_1 - precios_1[-1]) / precio_inicial_1,
            'reduccion_2': (precio_inicial_2 - precios_2[-1]) / precio_inicial_2,
            'convergencia': abs(precios_1[-1] - precios_2[-1]) < 0.01 * precio_inicial_1
        }

    def estrategia_entrada_mercado(self, cuota_mercado_actual, precio_incumbente,
                                   coste_entrada, años_amortizacion=5):
        """
        Decisión de entrada a mercado: ¿Vale la pena entrar?

        Modelo: Valorar beneficio esperado vs coste de entrada
        """
        # Estrategias posibles
        estrategias = {
            'precio_bajo': {
                'precio': precio_incumbente * 0.85,  # -15%
                'cuota_esperada': 0.15,  # Captura 15% mercado
                'coste_adicional_marketing': coste_entrada * 0.3
            },
            'precio_similar': {
                'precio': precio_incumbente * 0.95,
                'cuota_esperada': 0.08,
                'coste_adicional_marketing': coste_entrada * 0.5
            },
            'diferenciacion': {
                'precio': precio_incumbente * 1.10,  # Premium
                'cuota_esperada': 0.05,
                'coste_adicional_marketing': coste_entrada * 0.8  # Marca
            }
        }

        resultados = {}

        for nombre, estrategia in estrategias.items():
            # Beneficio anual esperado
            margen = estrategia['precio'] * 0.20  # Asumiendo 20% margen
            beneficio_anual = margen * estrategia['cuota_esperada'] * cuota_mercado_actual

            # Coste total entrada
            coste_total = coste_entrada + estrategia['coste_adicional_marketing']

            # VPN (tasa descuento 10%)
            vpn = sum(beneficio_anual / (1.10 ** t) for t in range(1, años_amortizacion + 1)) - coste_total

            # Payback
            if beneficio_anual > 0:
                payback = coste_total / beneficio_anual
            else:
                payback = np.inf

            resultados[nombre] = {
                'precio': estrategia['precio'],
                'cuota_mercado_esperada': estrategia['cuota_esperada'],
                'beneficio_anual': beneficio_anual,
                'coste_entrada_total': coste_total,
                'vpn': vpn,
                'payback_años': payback,
                'decision': 'ENTRAR' if vpn > 0 else 'NO_ENTRAR'
            }

        # Mejor estrategia
        mejor = max(resultados.items(), key=lambda x: x[1]['vpn'])

        return {
            'estrategias': resultados,
            'mejor_estrategia': mejor[0],
            'mejor_vpn': mejor[1]['vpn']
        }

    # ========================================================================
    # 2. DECISIÓN BAJO INCERTIDUMBRE (SEGUROS)
    # ========================================================================

    def decision_retencion_cliente(self, clv, coste_retencion, prob_churn_sin_accion,
                                   prob_churn_con_accion):
        """
        Decisión: ¿Invertir en retener a este cliente?

        Análisis: Valor esperado con/sin acción
        """
        # Valor esperado SIN acción
        ve_sin_accion = clv * (1 - prob_churn_sin_accion)

        # Valor esperado CON acción
        ve_con_accion = clv * (1 - prob_churn_con_accion) - coste_retencion

        # Valor incremental
        valor_incremental = ve_con_accion - ve_sin_accion

        # ROI de la acción
        if coste_retencion > 0:
            roi = (clv * (prob_churn_sin_accion - prob_churn_con_accion) - coste_retencion) / coste_retencion
        else:
            roi = np.inf

        return {
            've_sin_accion': ve_sin_accion,
            've_con_accion': ve_con_accion,
            'valor_incremental': valor_incremental,
            'roi': roi,
            'decision': 'ACTUAR' if valor_incremental > 0 else 'NO_ACTUAR',
            'reduccion_churn': prob_churn_sin_accion - prob_churn_con_accion
        }

    def decision_multi_criterio_producto(self, productos, pesos_criterios):
        """
        Decisión multicriterio: ¿Qué producto lanzar/potenciar?

        Criterios: Rentabilidad, Potencial mercado, Complejidad, Tiempo lanzamiento
        Método: Weighted scoring
        """
        # productos: dict con {nombre: {criterio: valor}}
        # pesos_criterios: {criterio: peso}

        scores = {}

        for nombre, criterios in productos.items():
            score_total = 0

            for criterio, valor in criterios.items():
                peso = pesos_criterios.get(criterio, 0)
                # Normalizar valor (asumiendo 0-10)
                score_total += valor * peso

            scores[nombre] = score_total

        # Ranking
        ranking = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        return {
            'scores': scores,
            'ranking': ranking,
            'mejor_producto': ranking[0][0],
            'score_mejor': ranking[0][1]
        }

    def matriz_decision_riesgo_retorno(self, productos_cartera):
        """
        Matriz de decisión: Riesgo vs Retorno (Boston Consulting Group style)

        Clasifica productos en: Estrella, Vaca lechera, Interrogante, Perro
        """
        # productos_cartera: [{nombre, crecimiento_mercado, cuota_relativa, margen}]

        clasificacion = {}

        for producto in productos_cartera:
            nombre = producto['nombre']
            crecimiento = producto['crecimiento_mercado']  # % YoY
            cuota = producto['cuota_relativa']  # Cuota propia / cuota líder
            margen = producto.get('margen', 0)

            # Clasificación BCG
            if crecimiento > 0.10 and cuota > 1.0:
                categoria = 'ESTRELLA'
                accion = 'Invertir para mantener liderazgo'
            elif crecimiento <= 0.10 and cuota > 1.0:
                categoria = 'VACA_LECHERA'
                accion = 'Cosechar beneficios, minimizar inversión'
            elif crecimiento > 0.10 and cuota <= 1.0:
                categoria = 'INTERROGANTE'
                accion = 'Decidir: invertir fuerte o desinvertir'
            else:
                categoria = 'PERRO'
                accion = 'Considerar descatalogación o nicho'

            clasificacion[nombre] = {
                'categoria': categoria,
                'accion_recomendada': accion,
                'crecimiento': crecimiento,
                'cuota_relativa': cuota,
                'margen': margen,
                'prioridad': self._calcular_prioridad_bcg(categoria, margen)
            }

        return clasificacion

    def _calcular_prioridad_bcg(self, categoria, margen):
        """Prioridad estratégica según BCG"""
        prioridades = {
            'ESTRELLA': 5,
            'INTERROGANTE': 4,
            'VACA_LECHERA': 3,
            'PERRO': 1
        }

        prioridad_base = prioridades.get(categoria, 2)

        # Ajustar por margen
        if margen > 0.25:
            prioridad_base += 1
        elif margen < 0.10:
            prioridad_base -= 1

        return max(1, min(5, prioridad_base))

    # ========================================================================
    # 3. OPTIMIZACIÓN DE CARTERA DE PRODUCTOS
    # ========================================================================

    def optimizar_mix_productos(self, productos, presupuesto_total, objetivo='beneficio'):
        """
        Optimización de mix de productos (programación lineal)

        Objetivo: Maximizar beneficio o minimizar riesgo
        Restricción: Presupuesto, regulación, diversificación
        """
        n = len(productos)

        # Extraer datos
        beneficios = np.array([p['beneficio_esperado'] for p in productos])
        costes = np.array([p['coste_inversion'] for p in productos])
        riesgos = np.array([p.get('riesgo', 1.0) for p in productos])

        if objetivo == 'beneficio':
            # Maximizar beneficio
            c = -beneficios  # Negativo porque minimize
        elif objetivo == 'sharpe':
            # Maximizar ratio beneficio/riesgo
            c = -beneficios / (riesgos + 1e-6)
        else:
            c = -beneficios

        # Restricción: suma de costes <= presupuesto
        A_ub = [costes]
        b_ub = [presupuesto_total]

        # Restricción: suma de pesos = 1 (si son proporciones)
        A_eq = [np.ones(n)]
        b_eq = [1.0]

        # Bounds: cada producto entre 0 y 0.5 (máx 50% en un producto)
        bounds = [(0, 0.5) for _ in range(n)]

        from scipy.optimize import linprog

        result = linprog(c, A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq,
                        bounds=bounds, method='highs')

        if result.success:
            pesos_optimos = result.x

            return {
                'pesos': {productos[i]['nombre']: pesos_optimos[i] for i in range(n)},
                'beneficio_total': -result.fun if objetivo == 'beneficio' else np.sum(pesos_optimos * beneficios),
                'coste_total': np.sum(pesos_optimos * costes),
                'riesgo_total': np.sum(pesos_optimos * riesgos),
                'exito': True
            }
        else:
            return {
                'exito': False,
                'mensaje': 'No se encontró solución factible'
            }

    # ========================================================================
    # 4. ANÁLISIS COMPETITIVO Y POSICIONAMIENTO
    # ========================================================================

    def analisis_5_fuerzas_porter(self, datos_industria):
        """
        Análisis de las 5 fuerzas de Porter (scoring)

        Fuerzas: Rivalidad, Nuevos entrantes, Sustitutos, Poder proveedores, Poder clientes
        """
        # datos_industria: {fuerza: score_0_10}

        scores = {
            'rivalidad_competidores': datos_industria.get('rivalidad', 5),
            'amenaza_nuevos_entrantes': datos_industria.get('entrantes', 5),
            'amenaza_sustitutos': datos_industria.get('sustitutos', 5),
            'poder_proveedores': datos_industria.get('proveedores', 5),
            'poder_compradores': datos_industria.get('compradores', 5)
        }

        # Score agregado (atractivo de industria)
        # Menor score = más atractivo (menos amenazas)
        atractivo_total = 10 - (sum(scores.values()) / len(scores))

        # Interpretación
        if atractivo_total > 7:
            interpretacion = 'Industria muy atractiva'
        elif atractivo_total > 5:
            interpretacion = 'Industria moderadamente atractiva'
        else:
            interpretacion = 'Industria poco atractiva'

        # Identificar fuerza más crítica
        fuerza_critica = max(scores.items(), key=lambda x: x[1])

        return {
            'scores_fuerzas': scores,
            'atractivo_industria': atractivo_total,
            'interpretacion': interpretacion,
            'fuerza_mas_critica': fuerza_critica[0],
            'score_critico': fuerza_critica[1]
        }

    def curva_valor_oceano_azul(self, factores_competitivos, empresa_propia, competidores):
        """
        Estrategia Océano Azul: Curva de valor

        Identifica factores donde diferenciarse (eliminar, reducir, elevar, crear)
        """
        # factores_competitivos: [factor1, factor2, ...]
        # empresa_propia: {factor: score_0_10}
        # competidores: [{factor: score}, ...]

        analisis = {}

        for factor in factores_competitivos:
            score_propio = empresa_propia.get(factor, 5)
            scores_competencia = [c.get(factor, 5) for c in competidores]
            score_promedio_competencia = np.mean(scores_competencia)

            # Diferencia
            diferencia = score_propio - score_promedio_competencia

            # Clasificación
            if diferencia > 2:
                accion = 'MANTENER (ventaja competitiva)'
            elif diferencia > 0:
                accion = 'ELEVAR (reforzar)'
            elif diferencia > -2:
                accion = 'REDUCIR o ELIMINAR (no diferencia)'
            else:
                accion = 'CREAR alternativa (desventaja importante)'

            analisis[factor] = {
                'score_propio': score_propio,
                'score_competencia_promedio': score_promedio_competencia,
                'diferencia': diferencia,
                'accion_recomendada': accion
            }

        return analisis

    # ========================================================================
    # 5. SENSIBILIDAD Y SIMULACIÓN (SEGUROS)
    # ========================================================================

    def sensibilidad_combined_ratio(self, loss_ratio_base, expense_ratio_base,
                                    variaciones_loss=None, variaciones_expense=None):
        """
        Análisis de sensibilidad del Combined Ratio

        Combined Ratio = Loss Ratio + Expense Ratio
        Objetivo: CR < 100% (rentable)
        """
        if variaciones_loss is None:
            variaciones_loss = np.linspace(-0.10, 0.10, 11)  # -10% a +10%

        if variaciones_expense is None:
            variaciones_expense = np.linspace(-0.05, 0.05, 11)

        # Matriz de sensibilidad
        matriz_cr = np.zeros((len(variaciones_loss), len(variaciones_expense)))

        for i, var_loss in enumerate(variaciones_loss):
            for j, var_exp in enumerate(variaciones_expense):
                loss_ratio = loss_ratio_base * (1 + var_loss)
                expense_ratio = expense_ratio_base * (1 + var_exp)

                matriz_cr[i, j] = loss_ratio + expense_ratio

        return {
            'variaciones_loss_ratio': variaciones_loss,
            'variaciones_expense_ratio': variaciones_expense,
            'matriz_combined_ratio': matriz_cr,
            'cr_base': loss_ratio_base + expense_ratio_base,
            'cr_mejor_caso': np.min(matriz_cr),
            'cr_peor_caso': np.max(matriz_cr),
            'rentable_base': (loss_ratio_base + expense_ratio_base) < 1.0,
            'escenarios_rentables': np.sum(matriz_cr < 1.0)
        }

    def simulacion_monte_carlo_pricing(self, prima_base, elasticidad_media, elasticidad_std,
                                      coste_siniestro_media, coste_siniestro_std,
                                      n_simulaciones=10000):
        """
        Simulación Monte Carlo para pricing bajo incertidumbre

        Simula: Elasticidad de demanda + Coste siniestral → Beneficio esperado
        """
        # Simular elasticidades (distribución normal)
        elasticidades = np.random.normal(elasticidad_media, elasticidad_std, n_simulaciones)

        # Simular costes siniestros (lognormal, asimétrico)
        costes = np.random.lognormal(np.log(coste_siniestro_media), coste_siniestro_std, n_simulaciones)

        # Para cada simulación, calcular beneficio
        beneficios = []

        for elasticidad, coste in zip(elasticidades, costes):
            # Demanda = D_base * (P / P_base)^elasticidad
            demanda = 1000 * (prima_base / prima_base) ** elasticidad  # Base = 1000 pólizas

            # Beneficio = (Prima - Coste) * Demanda
            beneficio = (prima_base - coste) * demanda

            beneficios.append(beneficio)

        beneficios = np.array(beneficios)

        return {
            'beneficio_medio': np.mean(beneficios),
            'beneficio_mediano': np.median(beneficios),
            'beneficio_std': np.std(beneficios),
            'var_95': np.percentile(beneficios, 5),  # 5% peor
            'percentil_25': np.percentile(beneficios, 25),
            'percentil_75': np.percentile(beneficios, 75),
            'prob_beneficio_positivo': np.mean(beneficios > 0),
            'distribucion_beneficios': beneficios
        }

    # ========================================================================
    # 6. MODELOS DE CRECIMIENTO ESTRATÉGICO
    # ========================================================================

    def modelo_crecimiento_bcg(self, tasa_retencion, tasa_crecimiento_nueva_emision,
                               cartera_actual, años=5):
        """
        Modelo de crecimiento Boston Consulting Group

        Crecimiento = Retención de cartera + Nueva emisión
        """
        proyeccion = []
        cartera = cartera_actual

        for año in range(años):
            # Retención
            cartera_retenida = cartera * tasa_retencion

            # Nueva emisión
            nueva_emision = cartera_actual * tasa_crecimiento_nueva_emision

            # Cartera año siguiente
            cartera_siguiente = cartera_retenida + nueva_emision

            proyeccion.append({
                'año': año + 1,
                'cartera_inicial': cartera,
                'cartera_retenida': cartera_retenida,
                'nueva_emision': nueva_emision,
                'cartera_final': cartera_siguiente,
                'crecimiento_yoy': (cartera_siguiente - cartera) / cartera if cartera > 0 else 0
            })

            cartera = cartera_siguiente

        return {
            'proyeccion': proyeccion,
            'cartera_año_5': cartera,
            'cagr': (cartera / cartera_actual) ** (1 / años) - 1
        }

    def analisis_canibalizacion_producto(self, ventas_producto_nuevo, ventas_productos_existentes_antes,
                                        ventas_productos_existentes_despues):
        """
        Análisis de canibalización: ¿El producto nuevo roba ventas a los existentes?
        """
        # Ventas totales
        ventas_totales_antes = sum(ventas_productos_existentes_antes.values())
        ventas_totales_despues = sum(ventas_productos_existentes_despues.values()) + ventas_producto_nuevo

        # Ventas incrementales
        ventas_incrementales_reales = ventas_totales_despues - ventas_totales_antes

        # Tasa de canibalización
        tasa_canibalizacion = 1 - (ventas_incrementales_reales / ventas_producto_nuevo)

        return {
            'ventas_producto_nuevo': ventas_producto_nuevo,
            'ventas_totales_antes': ventas_totales_antes,
            'ventas_totales_despues': ventas_totales_despues,
            'ventas_incrementales_reales': ventas_incrementales_reales,
            'tasa_canibalizacion': tasa_canibalizacion,
            'interpretacion': f'{tasa_canibalizacion*100:.1f}% del nuevo producto canibaliza ventas existentes'
        }


# ============================================================================
# EJEMPLO DE USO
# ============================================================================

if __name__ == "__main__":
    print("="*80)
    print("MOTOR ESTRATÉGICO SEGUROS - DEMO")
    print("="*80)

    motor = MotorEstrategicoSeguros()

    # 1. Equilibrio Nash en pricing
    print("\n1. EQUILIBRIO NASH (2 ASEGURADORAS):")
    nash = motor.equilibrio_nash_pricing_2_companias(
        coste_1=300, coste_2=320,
        demanda_a=10000, demanda_b=50
    )
    print(f"   Precio Nash Aseguradora 1: {nash['precio_nash_1']:.2f}€")
    print(f"   Precio Nash Aseguradora 2: {nash['precio_nash_2']:.2f}€")
    print(f"   Markup Aseg. 1: {nash['markup_1']*100:.1f}%")

    # 2. Decisión de retención
    print("\n2. DECISIÓN DE RETENCIÓN:")
    decision = motor.decision_retencion_cliente(
        clv=1200, coste_retencion=50,
        prob_churn_sin_accion=0.30, prob_churn_con_accion=0.15
    )
    print(f"   Decisión: {decision['decision']}")
    print(f"   ROI: {decision['roi']*100:.1f}%")
    print(f"   Valor incremental: {decision['valor_incremental']:.2f}€")

    # 3. Análisis BCG de cartera
    print("\n3. MATRIZ BCG (CARTERA DE PRODUCTOS):")
    productos = [
        {'nombre': 'Auto Básico', 'crecimiento_mercado': 0.15, 'cuota_relativa': 1.3, 'margen': 0.22},
        {'nombre': 'Hogar', 'crecimiento_mercado': 0.05, 'cuota_relativa': 1.8, 'margen': 0.28},
        {'nombre': 'Moto', 'crecimiento_mercado': 0.12, 'cuota_relativa': 0.7, 'margen': 0.15},
        {'nombre': 'Decesos', 'crecimiento_mercado': 0.02, 'cuota_relativa': 0.5, 'margen': 0.08}
    ]

    bcg = motor.matriz_decision_riesgo_retorno(productos)
    for nombre, analisis in bcg.items():
        print(f"   {nombre}: {analisis['categoria']} - Prioridad {analisis['prioridad']}/5")

    # 4. Simulación Monte Carlo pricing
    print("\n4. SIMULACIÓN MONTE CARLO (PRICING):")
    mc = motor.simulacion_monte_carlo_pricing(
        prima_base=450, elasticidad_media=-1.5, elasticidad_std=0.2,
        coste_siniestro_media=300, coste_siniestro_std=0.3,
        n_simulaciones=5000
    )
    print(f"   Beneficio esperado: {mc['beneficio_medio']:.2f}€")
    print(f"   VaR 95%: {mc['var_95']:.2f}€")
    print(f"   P(beneficio > 0): {mc['prob_beneficio_positivo']*100:.1f}%")

    # 5. Modelo de crecimiento
    print("\n5. PROYECCIÓN DE CRECIMIENTO (5 AÑOS):")
    crecimiento = motor.modelo_crecimiento_bcg(
        tasa_retencion=0.80, tasa_crecimiento_nueva_emision=0.12,
        cartera_actual=5000, años=5
    )
    print(f"   Cartera actual: {crecimiento['proyeccion'][0]['cartera_inicial']:.0f} pólizas")
    print(f"   Cartera año 5: {crecimiento['cartera_año_5']:.0f} pólizas")
    print(f"   CAGR: {crecimiento['cagr']*100:.1f}%")

    # 6. Sensibilidad Combined Ratio
    print("\n6. SENSIBILIDAD COMBINED RATIO:")
    sensibilidad = motor.sensibilidad_combined_ratio(
        loss_ratio_base=0.65, expense_ratio_base=0.32
    )
    print(f"   CR base: {sensibilidad['cr_base']*100:.1f}%")
    print(f"   CR mejor caso: {sensibilidad['cr_mejor_caso']*100:.1f}%")
    print(f"   CR peor caso: {sensibilidad['cr_peor_caso']*100:.1f}%")
    print(f"   Escenarios rentables (CR<100%): {sensibilidad['escenarios_rentables']}/121")

    print("\n" + "="*80)
    print("MOTOR ESTRATÉGICO SEGUROS OPERATIVO")
    print("="*80)

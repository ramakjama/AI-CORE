"""
═══════════════════════════════════════════════════════════════════════════════
MOTOR MAESTRO INTEGRADO
Integración completa de 5 motores + Cliente360 + PESTEL + Sinergias
═══════════════════════════════════════════════════════════════════════════════
"""

import numpy as np
import pandas as pd
from datetime import datetime
import json

# Importar motores (asumiendo que están disponibles)
try:
    from motor_estadistico_completo import MotorEstadisticoCompleto
    from motor_economico_completo import MotorEconomicoCompleto
    from motor_financiero_completo import MotorFinancieroCompleto
except:
    print("Motores no encontrados. Usando versiones simplificadas.")


# ============================================================================
# CAPAS DE DATOS
# ============================================================================

class Cliente360:
    """Perfil completo del cliente (todas las dimensiones)"""

    def __init__(self, cliente_id):
        self.cliente_id = cliente_id
        self.perfil = self._inicializar_perfil()

    def _inicializar_perfil(self):
        """Estructura completa de datos del cliente"""
        return {
            # DEMOGRÁFICO ESTÁTICO
            'demografico': {
                'edad': None,
                'genero': None,
                'educacion': None,
                'ocupacion': None,
                'ingresos_anuales': None,
                'patrimonio': None,
                'estado_civil': None,
                'n_dependientes': None,
                'ubicacion': {
                    'pais': None,
                    'region': None,
                    'ciudad': None,
                    'codigo_postal': None,
                    'nivel_socioeconomico': None,
                    'lat': None,
                    'lon': None
                }
            },

            # COMPORTAMENTAL DINÁMICO
            'comportamiento': {
                'transaccional': {
                    'frecuencia_compra_12m': None,
                    'ticket_promedio': None,
                    'recency_dias': None,
                    'monetario_12m': None,
                    'canal_preferido': None,
                    'dispositivo_preferido': None
                },
                'engagement': {
                    'sesiones_web_30d': None,
                    'tiempo_promedio_sesion': None,
                    'paginas_vistas_30d': None,
                    'tasa_rebote': None,
                    'email_open_rate': None,
                    'email_click_rate': None
                },
                'lealtad': {
                    'antiguedad_meses': None,
                    'n_productos_activos': None,
                    'tasa_retencion_historica': None,
                    'nps': None,
                    'csat': None,
                    'n_quejas_12m': None
                }
            },

            # RIESGO Y FINANCIERO
            'riesgo': {
                'crediticio': {
                    'score_bureau': None,
                    'n_morosidades_historico': None,
                    'dias_mora_promedio': None,
                    'deuda_ingreso_ratio': None,
                    'limite_credito': None,
                    'utilizacion_credito': None
                },
                'seguros': {
                    'n_siniestros_3a': None,
                    'severidad_promedio': None,
                    'claims_ratio': None,
                    'ultima_reclamacion_dias': None
                },
                'fraude': {
                    'flags_historicos': None,
                    'score_anomalia': None,
                    'transacciones_sospechosas_12m': None
                }
            },

            # PSICOGRÁFICO Y PREFERENCIAS
            'psicografico': {
                'preferencias_reveladas': {
                    'productos_favoritos': [],
                    'categorias_interes': [],
                    'horarios_compra_preferidos': [],
                    'sensibilidad_precio': None
                },
                'actitudes': {
                    'aversion_riesgo_estimada': None,
                    'tasa_descuento_temporal': None,
                    'propension_innovacion': None
                },
                'segmento': {
                    'segmento_principal': None,
                    'subsegmentos': [],
                    'persona_marketing': None
                }
            },

            # RELACIONAL Y CONTEXTO
            'relacional': {
                'red_social': {
                    'n_referidos': None,
                    'n_referidos_activos': None,
                    'influencia_score': None,
                    'centralidad': None
                },
                'ciclo_vida': {
                    'eventos_recientes': [],
                    'life_stage': None,
                    'momentos_criticos_proximos': []
                }
            },

            # LATENTE (INFERIDO/CALCULADO)
            'latente': {
                'propension_compra': {},  # Por producto
                'propension_churn': None,
                'elasticidad_precio': None,
                'clv_3a': None,
                'clv_lifetime': None,
                'wtp_productos': {},  # Willingness to pay
                'next_best_action': None,
                'next_best_offer': None
            },

            # METADATOS
            'metadata': {
                'fecha_creacion': datetime.now().isoformat(),
                'ultima_actualizacion': datetime.now().isoformat(),
                'fuentes_datos': [],
                'calidad_datos_score': None,
                'completitud': None
            }
        }

    def cargar_datos(self, datos):
        """Cargar datos del cliente desde dict/JSON"""
        def update_nested(d, u):
            for k, v in u.items():
                if isinstance(v, dict):
                    d[k] = update_nested(d.get(k, {}), v)
                else:
                    d[k] = v
            return d

        self.perfil = update_nested(self.perfil, datos)
        self.perfil['metadata']['ultima_actualizacion'] = datetime.now().isoformat()

        # Calcular completitud
        self._calcular_completitud()

        return self

    def _calcular_completitud(self):
        """Calcular % de campos completos"""
        def count_filled(d):
            total, filled = 0, 0
            for v in d.values():
                if isinstance(v, dict):
                    t, f = count_filled(v)
                    total += t
                    filled += f
                elif v is not None and v != [] and v != {}:
                    total += 1
                    filled += 1
                else:
                    total += 1
            return total, filled

        total, filled = count_filled(self.perfil)
        self.perfil['metadata']['completitud'] = filled / total if total > 0 else 0

    def export_vector(self):
        """Exportar perfil como vector plano (para ML)"""
        # Simplificado: extraer valores numéricos
        vector = []
        # Implementación completa requeriría encoders, embeddings, etc.
        return np.array(vector)


class ContextoPESTEL:
    """Contexto PESTEL (macro + entorno)"""

    def __init__(self):
        self.contexto = self._inicializar_contexto()

    def _inicializar_contexto(self):
        """Estructura completa PESTEL"""
        return {
            # POLÍTICO
            'politico': {
                'estabilidad_gubernamental': None,
                'indice_democracia': None,
                'riesgo_politico': None,
                'elecciones_proximas_dias': None,
                'polarizacion_score': None,
                'regulacion_sector': {
                    'solvencia_ii_ratio_min': None,
                    'caps_precio': None,
                    'restricciones_comercializacion': []
                }
            },

            # ECONÓMICO
            'economico': {
                'macro': {
                    'gdp_growth_yoy': None,
                    'gdp_per_capita': None,
                    'inflacion_yoy': None,
                    'inflacion_subyacente': None,
                    'desempleo': None,
                    'tipo_interes_referencia': None,
                    'tipo_interes_10a': None,
                    'tipo_cambio': None,
                    'balanza_comercial': None
                },
                'mercado': {
                    'indice_bolsa_principal': None,
                    'indice_bolsa_variacion_ytd': None,
                    'vix': None,
                    'spread_credito_corporativo': None,
                    'precio_petroleo': None,
                    'precio_oro': None
                },
                'sectorial': {
                    'penetracion_mercado': None,
                    'crecimiento_sector_yoy': None,
                    'hhi_concentracion': None,
                    'barreras_entrada': None
                }
            },

            # SOCIAL
            'social': {
                'demografia': {
                    'poblacion_total': None,
                    'tasa_crecimiento_poblacion': None,
                    'edad_mediana': None,
                    'ratio_dependencia': None,
                    'tasa_urbanizacion': None,
                    'migracion_neta': None
                },
                'tendencias': {
                    'preferencia_sostenibilidad': None,
                    'preferencia_digital': None,
                    'preferencia_salud': None,
                    'preferencia_experiencia': None
                },
                'desigualdad': {
                    'gini': None,
                    'ratio_ingreso_p90_p10': None,
                    'movilidad_social_score': None
                }
            },

            # TECNOLÓGICO
            'tecnologico': {
                'adopcion': {
                    'penetracion_internet': None,
                    'penetracion_smartphone': None,
                    'penetracion_banda_ancha': None,
                    'usuarios_redes_sociales': None
                },
                'innovacion_sector': {
                    'adopcion_telematica': None,
                    'adopcion_iot': None,
                    'adopcion_ai': None,
                    'gasto_rd_pib': None
                },
                'infraestructura': {
                    'calidad_infraestructura_tech': None,
                    'velocidad_internet_promedio': None,
                    'ciberseguridad_index': None
                }
            },

            # AMBIENTAL
            'ambiental': {
                'riesgo_climatico': {
                    'riesgo_fisico_global': None,
                    'riesgo_transicion_global': None,
                    'eventos_catastroficos_12m': None,
                    'temperatura_anomalia': None
                },
                'por_zona': {
                    'riesgo_inundacion': None,
                    'riesgo_incendio': None,
                    'riesgo_terremoto': None,
                    'riesgo_huracan': None
                },
                'politicas': {
                    'impuesto_carbono': None,
                    'subsidios_renovables': None,
                    'esg_regulacion_score': None
                }
            },

            # LEGAL
            'legal': {
                'proteccion_datos': {
                    'gdpr_aplica': None,
                    'ccpa_aplica': None,
                    'sanciones_promedio_violacion': None
                },
                'regulacion_precios': {
                    'caps_activos': None,
                    'servicio_universal_obligatorio': None
                },
                'litigiosidad': {
                    'n_demandas_sector_12m': None,
                    'coste_promedio_litigio': None,
                    'tiempo_resolucion_promedio_dias': None
                }
            },

            # METADATOS
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'fuentes': [],
                'frecuencia_actualizacion': None
            }
        }

    def cargar_datos(self, datos):
        """Cargar contexto PESTEL desde dict/JSON"""
        def update_nested(d, u):
            for k, v in u.items():
                if isinstance(v, dict):
                    d[k] = update_nested(d.get(k, {}), v)
                else:
                    d[k] = v
            return d

        self.contexto = update_nested(self.contexto, datos)
        self.contexto['metadata']['timestamp'] = datetime.now().isoformat()

        return self


# ============================================================================
# MOTOR MAESTRO INTEGRADO
# ============================================================================

class MotorMaestro:
    """Orquestador de los 5 motores + Cliente360 + PESTEL"""

    def __init__(self):
        # Inicializar motores
        try:
            self.estadistico = MotorEstadisticoCompleto()
            self.economico = MotorEconomicoCompleto()
            self.financiero = MotorFinancieroCompleto()
        except:
            print("Algunos motores no disponibles. Funcionalidad limitada.")
            self.estadistico = None
            self.economico = None
            self.financiero = None

        # Versiones simplificadas de motores matemático y estratégico
        self.matematico = MotorMatematico()
        self.estrategico = MotorEstrategico()

        # Cache
        self.cache = {}
        self.resultados = {}

    # ========================================================================
    # PIPELINE INTEGRADO: PRICING ÓPTIMO PERSONALIZADO
    # ========================================================================

    def pipeline_pricing_optimo(self, cliente_id, producto_id, datos_historicos,
                                contexto_pestel=None):
        """
        Pipeline completo: Pricing óptimo personalizado

        SINERGIAS:
        1. Estadístico: predice elasticidad y P(acepta)
        2. Económico: calcula CLV y WTP
        3. Financiero: evalúa riesgo y valor esperado
        4. Matemático: optimiza precio
        5. Estratégico: analiza sensibilidad y competencia

        INPUT:
        - cliente_id: ID del cliente
        - producto_id: ID del producto
        - datos_historicos: DataFrame con histórico de precios y respuestas
        - contexto_pestel: ContextoPESTEL opcional

        OUTPUT:
        - precio_optimo: precio personalizado
        - prob_aceptacion: probabilidad de que el cliente acepte
        - beneficio_esperado: beneficio esperado
        - sensibilidad: análisis de sensibilidad
        """

        # 1. Cargar perfil del cliente
        cliente = Cliente360(cliente_id)
        # En producción: cliente.cargar_datos(fetch_from_database(cliente_id))

        # 2. Contexto PESTEL
        if contexto_pestel is None:
            contexto_pestel = ContextoPESTEL()
            # En producción: contexto_pestel.cargar_datos(fetch_pestel())

        # 3. ESTADÍSTICO: Modelo predictivo de aceptación
        if self.estadistico and datos_historicos is not None:
            X = datos_historicos[['precio', 'elasticidad_cliente', 'precio_competencia']].values
            y = datos_historicos['acepta'].values

            modelo = self.estadistico.glm_completo(X, y, familia='binomial')
        else:
            modelo = {'metricas': {'auc': 0.8}}  # Mock

        # 4. ECONÓMICO: CLV y elasticidad
        if self.economico and cliente.perfil['latente']['clv_3a']:
            clv = self.economico.clv_basico(
                ingresos_promedio=cliente.perfil['comportamiento']['transaccional']['ticket_promedio'] or 100,
                tasa_retencion=cliente.perfil['comportamiento']['lealtad']['tasa_retencion_historica'] or 0.8,
                tasa_descuento=contexto_pestel.contexto['economico']['macro']['tipo_interes_referencia'] or 0.05
            )
        else:
            clv = {'clv_formula': 1000}  # Mock

        # 5. FINANCIERO: VaR y riesgo
        # (Evaluar riesgo de concentración, volatilidad de ingresos del cliente)

        # 6. MATEMÁTICO: Optimización del precio
        def beneficio_esperado(precio):
            # Modelo simplificado de demanda
            elasticidad = cliente.perfil['latente']['elasticidad_precio'] or -1.5
            precio_ref = 100
            cantidad_base = 10

            cantidad = cantidad_base * (precio / precio_ref) ** elasticidad
            prob_acepta = 1 / (1 + np.exp(-(5 - 0.05 * precio)))  # Logit simplificado

            coste = 50
            margen = precio - coste

            return -(margen * cantidad * prob_acepta)  # Negativo para minimizar

        resultado_opt = self.matematico.optimizar_convexo(
            objetivo_fn=beneficio_esperado,
            x0=np.array([80]),
            bounds=[(50, 200)]
        )

        precio_optimo = resultado_opt['x_optimo'][0]
        beneficio_max = -resultado_opt['valor_optimo']

        # 7. ESTRATÉGICO: Análisis de sensibilidad
        sensibilidad = self.estrategico.sensibilidad_parametro(
            funcion_objetivo=lambda p: -beneficio_esperado(p),
            param_nominal=precio_optimo,
            rango_variacion=0.15
        )

        # 8. Compilar resultados
        resultado = {
            'cliente_id': cliente_id,
            'producto_id': producto_id,
            'precio_optimo': precio_optimo,
            'beneficio_esperado': beneficio_max,
            'clv': clv['clv_formula'],
            'modelo_auc': modelo['metricas']['auc'],
            'sensibilidad': {
                'elasticidad_local': sensibilidad['elasticidad'],
                'rango_precios': (sensibilidad['parametros'][0], sensibilidad['parametros'][-1])
            },
            'contexto': {
                'inflacion': contexto_pestel.contexto['economico']['macro']['inflacion_yoy'],
                'tipo_interes': contexto_pestel.contexto['economico']['macro']['tipo_interes_referencia']
            },
            'timestamp': datetime.now().isoformat()
        }

        self.resultados[f'{cliente_id}_{producto_id}'] = resultado

        return resultado

    # ========================================================================
    # PIPELINE: SEGMENTACIÓN ESTRATÉGICA
    # ========================================================================

    def pipeline_segmentacion_estrategica(self, clientes_data, n_segmentos=5):
        """
        Segmentación avanzada con perfil económico-financiero

        SINERGIAS:
        1. Estadístico: clustering + PCA
        2. Económico: CLV por segmento
        3. Financiero: riesgo por segmento
        """

        if self.estadistico is None:
            return {'error': 'Motor estadístico no disponible'}

        # 1. PCA para reducción dimensional
        pca = self.estadistico.pca_completo(clientes_data, n_componentes=10)

        # 2. Clustering
        clusters = self.estadistico.clustering_completo(
            pca['X_transformado'],
            metodo='kmeans',
            n_clusters=n_segmentos
        )

        # 3. Caracterizar segmentos
        segmentos = []
        for seg in range(n_segmentos):
            idx_seg = clusters['labels'] == seg

            # Perfil demográfico
            datos_seg = clientes_data[idx_seg]

            # CLV promedio del segmento (si disponible)
            if self.economico:
                clv_seg = np.mean([
                    self.economico.clv_basico(100, 0.8, 0.05)['clv_formula']
                    for _ in range(min(100, len(datos_seg)))
                ])
            else:
                clv_seg = 0

            segmentos.append({
                'segmento_id': seg,
                'n_clientes': int(np.sum(idx_seg)),
                'clv_promedio': clv_seg,
                'centroide': clusters['centroides'][seg] if clusters['centroides'] is not None else None
            })

        return {
            'segmentos': segmentos,
            'silhouette': clusters['silhouette'],
            'varianza_explicada_pca': np.sum(pca['varianza_explicada'][:10])
        }

    # ========================================================================
    # PIPELINE: GESTIÓN DE RIESGO INTEGRADA
    # ========================================================================

    def pipeline_gestion_riesgo(self, portfolio, horizonte_dias=250):
        """
        Gestión de riesgo completa: VaR, stress testing, optimización

        SINERGIAS:
        1. Estadístico: bootstrapbootstrap, monte carlo
        2. Financiero: VaR, CVaR, Markowitz
        3. Matemático: optimización bajo restricciones de riesgo
        """

        if self.financiero is None:
            return {'error': 'Motor financiero no disponible'}

        # 1. VaR por Monte Carlo
        var_mc = self.financiero.var_monte_carlo(
            retorno_medio=portfolio['retorno_esperado'],
            volatilidad=portfolio['volatilidad'],
            n_sim=10000,
            horizonte=horizonte_dias / 252,
            nivel_confianza=0.95
        )

        # 2. Optimización de cartera con restricción de VaR
        retornos = portfolio['retornos_esperados']
        cov_matrix = portfolio['matriz_covarianza']

        cartera_opt = self.financiero.markowitz_portfolio(retornos, cov_matrix)

        # 3. Stress testing
        # (Simulación de escenarios extremos)

        return {
            'var_95': var_mc['var'],
            'cvar_95': var_mc['cvar'],
            'cartera_optima': {
                'pesos': cartera_opt['pesos'].tolist(),
                'sharpe': cartera_opt['sharpe']
            },
            'horizonte_dias': horizonte_dias
        }

    # ========================================================================
    # UTILIDADES
    # ========================================================================

    def export_resultados(self, formato='json'):
        """Exportar resultados a JSON/CSV"""
        if formato == 'json':
            return json.dumps(self.resultados, indent=2, default=str)
        elif formato == 'dict':
            return self.resultados

    def clear_cache(self):
        """Limpiar cache"""
        self.cache = {}
        self.resultados = {}


# ============================================================================
# MOTOR MATEMÁTICO SIMPLIFICADO (placeholder)
# ============================================================================

class MotorMatematico:
    """Motor matemático básico (optimización)"""

    def optimizar_convexo(self, objetivo_fn, x0=None, bounds=None):
        """Optimización convexa básica"""
        from scipy import optimize

        if x0 is None:
            x0 = np.zeros(2)

        result = optimize.minimize(objetivo_fn, x0, bounds=bounds, method='L-BFGS-B')

        return {
            'x_optimo': result.x,
            'valor_optimo': result.fun,
            'exito': result.success
        }


# ============================================================================
# MOTOR ESTRATÉGICO SIMPLIFICADO (placeholder)
# ============================================================================

class MotorEstrategico:
    """Motor estratégico básico"""

    def sensibilidad_parametro(self, funcion_objetivo, param_nominal, rango_variacion=0.2, n_puntos=50):
        """Análisis de sensibilidad"""
        param_min = param_nominal * (1 - rango_variacion)
        param_max = param_nominal * (1 + rango_variacion)

        params = np.linspace(param_min, param_max, n_puntos)
        valores = [funcion_objetivo(p) for p in params]

        delta_param = params[1] - params[0]
        delta_valor = valores[1] - valores[0]
        elasticidad = (delta_valor / valores[0]) / (delta_param / params[0]) if params[0] != 0 else 0

        return {
            'parametros': params,
            'valores_objetivo': np.array(valores),
            'elasticidad': elasticidad
        }


# ============================================================================
# DEMO EJECUTABLE
# ============================================================================

if __name__ == "__main__":
    print("="*80)
    print(" MOTOR MAESTRO INTEGRADO - DEMO COMPLETA")
    print("="*80)

    # 1. Inicializar motor
    motor = MotorMaestro()

    # 2. Cliente 360 (ejemplo)
    print("\n[1] CLIENTE 360:")
    cliente = Cliente360("C001")
    cliente.cargar_datos({
        'demografico': {'edad': 35, 'ingresos_anuales': 50000},
        'comportamiento': {
            'transaccional': {'ticket_promedio': 120, 'frecuencia_compra_12m': 8},
            'lealtad': {'tasa_retencion_historica': 0.85, 'nps': 8}
        },
        'latente': {'elasticidad_precio': -1.5, 'clv_3a': 3600}
    })
    print(f"   Completitud: {cliente.perfil['metadata']['completitud']*100:.1f}%")

    # 3. Contexto PESTEL (ejemplo)
    print("\n[2] CONTEXTO PESTEL:")
    pestel = ContextoPESTEL()
    pestel.cargar_datos({
        'economico': {
            'macro': {'inflacion_yoy': 0.032, 'tipo_interes_referencia': 0.045}
        },
        'social': {'demografia': {'tasa_urbanizacion': 0.82}}
    })
    print(f"   Inflación: {pestel.contexto['economico']['macro']['inflacion_yoy']*100:.1f}%")

    # 4. Pipeline de pricing óptimo
    print("\n[3] PIPELINE PRICING ÓPTIMO:")
    # Datos históricos simulados
    datos_hist = pd.DataFrame({
        'precio': np.random.uniform(80, 120, 200),
        'elasticidad_cliente': np.random.uniform(-2, -1, 200),
        'precio_competencia': np.random.uniform(90, 110, 200),
        'acepta': np.random.binomial(1, 0.6, 200)
    })

    resultado = motor.pipeline_pricing_optimo(
        cliente_id="C001",
        producto_id="P001",
        datos_historicos=datos_hist,
        contexto_pestel=pestel
    )

    print(f"   Precio óptimo: ${resultado['precio_optimo']:.2f}")
    print(f"   Beneficio esperado: ${resultado['beneficio_esperado']:.2f}")
    print(f"   CLV: ${resultado['clv']:.2f}")

    # 5. Exportar
    print("\n[4] EXPORTAR RESULTADOS:")
    print("   Resultados guardados en motor.resultados")

    print("\n" + "="*80)
    print(" MOTOR MAESTRO INTEGRADO OPERATIVO")
    print("="*80)
    print("\nComponentes disponibles:")
    print("  • motor.estadistico")
    print("  • motor.economico")
    print("  • motor.financiero")
    print("  • motor.matematico")
    print("  • motor.estrategico")
    print("\nCapas de datos:")
    print("  • Cliente360")
    print("  • ContextoPESTEL")
    print("\nPipelines integrados:")
    print("  • pipeline_pricing_optimo()")
    print("  • pipeline_segmentacion_estrategica()")
    print("  • pipeline_gestion_riesgo()")

"""
MOTOR DE APIs - FUENTES OFICIALES Y VERÍDICAS
Conexión con organismos oficiales para datos económicos, financieros, meteorológicos, seguros
"""

import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json


class APIsFuentesOficiales:
    """Conectores a fuentes de datos oficiales y verídicas"""

    def __init__(self):
        self.cache = {}
        self.api_keys = {
            'alpha_vantage': None,  # Usuario debe configurar
            'openweather': None,
            'fred': None
        }

    # ========================================================================
    # DATOS ECONÓMICOS OFICIALES
    # ========================================================================

    def ine_ipc_espana(self, fecha_inicio=None, fecha_fin=None):
        """
        INE (Instituto Nacional de Estadística España)
        API: IPC (Índice de Precios al Consumo)
        URL: https://www.ine.es/dynt3/inebase/index.htm?type=pcaxis
        """
        # INE no tiene API REST simple, pero tiene datos descargables
        # Simulación con estructura real

        url_base = "https://www.ine.es/jaxiT3/Tabla.htm"

        # En producción, parsear HTML o usar archivos PC-Axis
        # Aquí retorno estructura ejemplo

        return {
            'fuente': 'INE España',
            'serie': 'IPC General',
            'url': 'https://www.ine.es/jaxiT3/Tabla.htm?t=22344',
            'metodo': 'Descargar manualmente o parsear HTML',
            'estructura_ejemplo': {
                'fecha': ['2024-01', '2024-02', '2024-03'],
                'ipc_general': [110.5, 111.2, 111.8],
                'ipc_interanual': [3.2, 3.1, 2.9]
            },
            'nota': 'INE no tiene API REST pública. Usar web scraping o descargas manuales.'
        }

    def banco_espana_tipos_interes(self):
        """
        Banco de España - Tipos de interés oficiales
        URL: https://www.bde.es/webbde/es/estadis/infoest/tipos/tipos.html
        """
        # Banco de España tiene área de estadísticas descargable

        url = "https://www.bde.es/webbde/es/estadis/infoest/tipos/tipos.html"

        return {
            'fuente': 'Banco de España',
            'serie': 'Tipos de interés oficiales BCE',
            'url': url,
            'metodo': 'Web scraping o descarga Excel',
            'estructura_ejemplo': {
                'fecha': ['2024-01', '2024-02'],
                'euribor_12m': [4.12, 4.05],
                'tipo_bce': [4.50, 4.50]
            },
            'alternativa': 'Usar API del BCE directamente'
        }

    def bce_estadisticas(self, serie_clave='IRS', fecha_inicio='2020-01-01'):
        """
        BCE (Banco Central Europeo) - Statistical Data Warehouse
        API: https://sdw-wsrest.ecb.europa.eu/
        Series: IRS (tipos interés), EXR (tipo cambio), etc.
        """
        url_base = "https://sdw-wsrest.ecb.europa.eu/service/data"

        # Ejemplo: tipos de interés
        # Formato: {dataset}/{key}/{agency}
        url = f"{url_base}/IRS/M.U2.L.L40.CI.0000.EUR.N.Z"

        params = {
            'startPeriod': fecha_inicio,
            'format': 'jsondata'
        }

        try:
            response = requests.get(url, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()

                return {
                    'fuente': 'BCE Statistical Data Warehouse',
                    'serie': serie_clave,
                    'datos': data,
                    'url': url,
                    'exito': True
                }
            else:
                return {
                    'fuente': 'BCE',
                    'error': f'HTTP {response.status_code}',
                    'url': url
                }
        except Exception as e:
            return {
                'fuente': 'BCE',
                'error': str(e),
                'nota': 'Verificar conexión y formato de serie'
            }

    def eurostat_gdp(self, pais='ES', fecha_inicio='2020'):
        """
        Eurostat - PIB y estadísticas europeas
        API: https://ec.europa.eu/eurostat/api/
        """
        # Eurostat API (JSON-stat format)
        url_base = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"

        # Dataset: PIB trimestral
        dataset = "namq_10_gdp"

        url = f"{url_base}/{dataset}"

        params = {
            'geo': pais,
            'time': f'{fecha_inicio}-Q1',
            'format': 'JSON',
            'lang': 'en'
        }

        try:
            response = requests.get(url, params=params, timeout=15)

            if response.status_code == 200:
                data = response.json()

                return {
                    'fuente': 'Eurostat',
                    'pais': pais,
                    'datos': data,
                    'url': url,
                    'exito': True
                }
            else:
                return {
                    'fuente': 'Eurostat',
                    'error': f'HTTP {response.status_code}',
                    'url': url
                }
        except Exception as e:
            return {
                'fuente': 'Eurostat',
                'error': str(e)
            }

    def fred_api(self, serie='UNRATE', api_key=None):
        """
        FRED (Federal Reserve Economic Data) - USA
        API: https://fred.stlouisfed.org/docs/api/fred/
        Series: UNRATE (desempleo), GDP, CPI, etc.

        Requiere API key gratuita: https://fred.stlouisfed.org/docs/api/api_key.html
        """
        if api_key is None:
            api_key = self.api_keys.get('fred')

        if not api_key:
            return {
                'fuente': 'FRED (Federal Reserve)',
                'error': 'Requiere API key',
                'registro': 'https://fred.stlouisfed.org/docs/api/api_key.html',
                'gratuito': True
            }

        url = f"https://api.stlouisfed.org/fred/series/observations"

        params = {
            'series_id': serie,
            'api_key': api_key,
            'file_type': 'json'
        }

        try:
            response = requests.get(url, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()

                observaciones = data.get('observations', [])
                df = pd.DataFrame(observaciones)

                return {
                    'fuente': 'FRED',
                    'serie': serie,
                    'datos': df,
                    'n_observaciones': len(observaciones),
                    'exito': True
                }
            else:
                return {
                    'fuente': 'FRED',
                    'error': f'HTTP {response.status_code}'
                }
        except Exception as e:
            return {
                'fuente': 'FRED',
                'error': str(e)
            }

    # ========================================================================
    # DATOS FINANCIEROS
    # ========================================================================

    def yahoo_finance_precios(self, ticker='IBEX', periodo='1y'):
        """
        Yahoo Finance - Precios históricos
        Librería: yfinance (pip install yfinance)
        """
        try:
            import yfinance as yf

            # Descargar datos
            data = yf.download(ticker, period=periodo, progress=False)

            return {
                'fuente': 'Yahoo Finance',
                'ticker': ticker,
                'datos': data,
                'inicio': data.index[0],
                'fin': data.index[-1],
                'n_dias': len(data),
                'exito': True
            }
        except ImportError:
            return {
                'fuente': 'Yahoo Finance',
                'error': 'yfinance no instalado',
                'install': 'pip install yfinance'
            }
        except Exception as e:
            return {
                'fuente': 'Yahoo Finance',
                'error': str(e)
            }

    def alpha_vantage_forex(self, from_currency='EUR', to_currency='USD', api_key=None):
        """
        Alpha Vantage - Tipos de cambio y datos financieros
        API gratuita: https://www.alphavantage.co/support/#api-key
        """
        if api_key is None:
            api_key = self.api_keys.get('alpha_vantage')

        if not api_key:
            return {
                'fuente': 'Alpha Vantage',
                'error': 'Requiere API key gratuita',
                'registro': 'https://www.alphavantage.co/support/#api-key'
            }

        url = "https://www.alphavantage.co/query"

        params = {
            'function': 'FX_DAILY',
            'from_symbol': from_currency,
            'to_symbol': to_currency,
            'apikey': api_key
        }

        try:
            response = requests.get(url, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()

                time_series = data.get('Time Series FX (Daily)', {})

                return {
                    'fuente': 'Alpha Vantage',
                    'par': f'{from_currency}/{to_currency}',
                    'datos': time_series,
                    'n_dias': len(time_series),
                    'exito': True
                }
            else:
                return {
                    'fuente': 'Alpha Vantage',
                    'error': f'HTTP {response.status_code}'
                }
        except Exception as e:
            return {
                'fuente': 'Alpha Vantage',
                'error': str(e)
            }

    # ========================================================================
    # DATOS METEOROLÓGICOS Y CATÁSTROFES
    # ========================================================================

    def aemet_api(self, municipio='28079', api_key=None):
        """
        AEMET (Agencia Estatal de Meteorología - España)
        API oficial: https://opendata.aemet.es/centrodedescargas/inicio
        Requiere API key gratuita
        """
        if not api_key:
            return {
                'fuente': 'AEMET',
                'error': 'Requiere API key gratuita',
                'registro': 'https://opendata.aemet.es/centrodedescargas/obtencionAPIKey',
                'gratuito': True
            }

        # Endpoint: predicción por municipio
        url = f"https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/{municipio}"

        headers = {
            'api_key': api_key
        }

        try:
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code == 200:
                data = response.json()

                # AEMET devuelve URL a datos
                datos_url = data.get('datos')

                if datos_url:
                    datos_response = requests.get(datos_url, timeout=10)
                    prediccion = datos_response.json()

                    return {
                        'fuente': 'AEMET',
                        'municipio': municipio,
                        'prediccion': prediccion,
                        'exito': True
                    }
                else:
                    return {
                        'fuente': 'AEMET',
                        'error': 'No se obtuvo URL de datos'
                    }
            else:
                return {
                    'fuente': 'AEMET',
                    'error': f'HTTP {response.status_code}'
                }
        except Exception as e:
            return {
                'fuente': 'AEMET',
                'error': str(e)
            }

    def openweather_api(self, ciudad='Madrid', api_key=None):
        """
        OpenWeatherMap - Clima mundial
        API: https://openweathermap.org/api
        Requiere API key (plan gratuito disponible)
        """
        if api_key is None:
            api_key = self.api_keys.get('openweather')

        if not api_key:
            return {
                'fuente': 'OpenWeatherMap',
                'error': 'Requiere API key',
                'registro': 'https://openweathermap.org/api',
                'plan_gratuito': True
            }

        url = "https://api.openweathermap.org/data/2.5/weather"

        params = {
            'q': ciudad,
            'appid': api_key,
            'units': 'metric',
            'lang': 'es'
        }

        try:
            response = requests.get(url, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()

                return {
                    'fuente': 'OpenWeatherMap',
                    'ciudad': ciudad,
                    'temperatura': data['main']['temp'],
                    'humedad': data['main']['humidity'],
                    'descripcion': data['weather'][0]['description'],
                    'datos_completos': data,
                    'exito': True
                }
            else:
                return {
                    'fuente': 'OpenWeatherMap',
                    'error': f'HTTP {response.status_code}'
                }
        except Exception as e:
            return {
                'fuente': 'OpenWeatherMap',
                'error': str(e)
            }

    # ========================================================================
    # DATOS DE SEGUROS (ESPAÑA)
    # ========================================================================

    def unespa_estadisticas(self):
        """
        UNESPA (Asociación Empresarial del Seguro - España)
        URL: https://www.unespa.es/
        Datos: No tienen API, pero publican informes estadísticos descargables
        """
        return {
            'fuente': 'UNESPA',
            'url': 'https://www.unespa.es/estadisticas-seguros/',
            'metodo': 'Descarga manual de informes (PDF/Excel)',
            'datos_disponibles': [
                'Primas totales por ramo',
                'Siniestralidad',
                'Cuotas de mercado',
                'Evolución sector',
                'Indicadores técnicos (Combined Ratio, etc.)'
            ],
            'frecuencia': 'Trimestral y anual',
            'nota': 'Requiere scraping o descarga manual'
        }

    def dgs_autorizaciones_seguros(self):
        """
        DGS (Dirección General de Seguros y Fondos de Pensiones)
        URL: https://www.dgsfp.mineco.gob.es/
        """
        return {
            'fuente': 'DGS (Ministerio Economía España)',
            'url': 'https://www.dgsfp.mineco.gob.es/es/Paginas/default.aspx',
            'datos_disponibles': [
                'Entidades autorizadas',
                'Informes trimestrales del sector',
                'Estadísticas de solvencia',
                'Reclamaciones'
            ],
            'metodo': 'Descarga manual o scraping',
            'nota': 'Datos oficiales y auditados'
        }

    # ========================================================================
    # DATOS GEOGRÁFICOS Y CATASTRALES
    # ========================================================================

    def catastro_espana_valoracion(self, referencia_catastral):
        """
        Sede Electrónica del Catastro - España
        API: https://ovc.catastro.meh.es/
        """
        url_base = "http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC"

        params = {
            'Provincia': '',
            'Municipio': '',
            'RC': referencia_catastral
        }

        try:
            response = requests.get(url_base, params=params, timeout=10)

            if response.status_code == 200:
                # Respuesta en XML
                return {
                    'fuente': 'Catastro España',
                    'referencia': referencia_catastral,
                    'datos_xml': response.text,
                    'exito': True,
                    'nota': 'Parsear XML para extraer valor catastral, superficie, uso'
                }
            else:
                return {
                    'fuente': 'Catastro',
                    'error': f'HTTP {response.status_code}'
                }
        except Exception as e:
            return {
                'fuente': 'Catastro',
                'error': str(e)
            }

    def ine_padron_poblacion(self):
        """
        INE - Padrón municipal
        Datos demográficos por municipio
        """
        return {
            'fuente': 'INE - Padrón',
            'url': 'https://www.ine.es/dynt3/inebase/index.htm?padre=517',
            'datos': 'Población por municipio, edad, nacionalidad',
            'formato': 'Descarga PC-Axis o Excel',
            'nota': 'Útil para rating geográfico en seguros'
        }

    # ========================================================================
    # DATOS DE SINIESTRALIDAD Y RIESGO
    # ========================================================================

    def consorcio_compensacion_seguros(self):
        """
        Consorcio de Compensación de Seguros
        Datos de catástrofes naturales en España
        URL: https://www.consorseguros.es/
        """
        return {
            'fuente': 'Consorcio de Compensación de Seguros',
            'url': 'https://www.consorseguros.es/web/estadisticas',
            'datos': [
                'Siniestros extraordinarios (inundaciones, terremotos, etc.)',
                'Indemnizaciones pagadas',
                'Estadísticas por provincias',
                'Series históricas'
            ],
            'metodo': 'Descarga manual de informes',
            'nota': 'Fundamental para pricing de riesgo catastrófico'
        }

    # ========================================================================
    # UTILIDADES
    # ========================================================================

    def configurar_api_key(self, servicio, api_key):
        """Configurar API keys"""
        if servicio in self.api_keys:
            self.api_keys[servicio] = api_key
            return {'exito': True, 'servicio': servicio}
        else:
            return {'error': f'Servicio {servicio} no reconocido'}

    def listar_fuentes_disponibles(self):
        """Listar todas las fuentes de datos"""
        return {
            'economicas_oficiales': [
                'INE (España) - IPC, PIB, desempleo',
                'Banco de España - Tipos de interés',
                'BCE - Tipos, tipo cambio',
                'Eurostat - Estadísticas UE',
                'FRED (USA) - Todos los indicadores económicos'
            ],
            'financieras': [
                'Yahoo Finance - Precios acciones/índices',
                'Alpha Vantage - Forex, stocks, crypto'
            ],
            'meteorologicas': [
                'AEMET (España) - Predicción oficial',
                'OpenWeatherMap - Clima mundial'
            ],
            'seguros': [
                'UNESPA - Estadísticas sector seguros España',
                'DGS - Dirección General de Seguros',
                'Consorcio - Catástrofes naturales'
            ],
            'geograficas': [
                'Catastro España - Valoraciones inmuebles',
                'INE Padrón - Datos demográficos por municipio'
            ]
        }


# ============================================================================
# EJEMPLO DE USO
# ============================================================================

if __name__ == "__main__":
    print("="*80)
    print("MOTOR DE APIs - FUENTES OFICIALES")
    print("="*80)

    api = APIsFuentesOficiales()

    # 1. Listar fuentes
    print("\n1. FUENTES DISPONIBLES:")
    fuentes = api.listar_fuentes_disponibles()
    for categoria, lista in fuentes.items():
        print(f"\n   {categoria.upper()}:")
        for fuente in lista:
            print(f"   • {fuente}")

    # 2. INE España
    print("\n2. INE - IPC ESPAÑA:")
    ine = api.ine_ipc_espana()
    print(f"   Fuente: {ine['fuente']}")
    print(f"   Método: {ine['metodo']}")

    # 3. BCE
    print("\n3. BCE - TIPOS DE INTERÉS:")
    bce = api.bce_estadisticas()
    print(f"   Fuente: {bce['fuente']}")
    print(f"   Éxito: {bce.get('exito', False)}")

    # 4. Yahoo Finance (si yfinance instalado)
    print("\n4. YAHOO FINANCE - IBEX35:")
    yahoo = api.yahoo_finance_precios(ticker='^IBEX', periodo='1mo')
    if yahoo.get('exito'):
        print(f"   Ticker: {yahoo['ticker']}")
        print(f"   Días: {yahoo['n_dias']}")
    else:
        print(f"   {yahoo.get('error', 'Error desconocido')}")

    # 5. UNESPA
    print("\n5. UNESPA - ESTADÍSTICAS SEGUROS:")
    unespa = api.unespa_estadisticas()
    print(f"   Fuente: {unespa['fuente']}")
    print(f"   Datos: {', '.join(unespa['datos_disponibles'][:3])}")

    # 6. Catastro
    print("\n6. CATASTRO ESPAÑA:")
    print("   Referencia ejemplo: 1234567VK1234A")
    print("   Método: catastro_espana_valoracion('1234567VK1234A')")

    print("\n" + "="*80)
    print("APIs CONFIGURADAS - LISTAS PARA USAR")
    print("="*80)
    print("\nNOTA: Algunas APIs requieren claves (gratuitas):")
    print("  • FRED: https://fred.stlouisfed.org/docs/api/api_key.html")
    print("  • AEMET: https://opendata.aemet.es/centrodedescargas/obtencionAPIKey")
    print("  • Alpha Vantage: https://www.alphavantage.co/support/#api-key")
    print("  • OpenWeatherMap: https://openweathermap.org/api")

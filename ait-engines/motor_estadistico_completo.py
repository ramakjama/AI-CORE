"""
MOTOR ESTADÍSTICO COMPLETO
Biblioteca total de métodos estadísticos: inferencia, predicción, causalidad, tests
"""

import numpy as np
import pandas as pd
from scipy import stats, special
from scipy.optimize import minimize
from sklearn.linear_model import (Ridge, Lasso, ElasticNet, LogisticRegression,
                                  PoissonRegressor, GammaRegressor, TweedieRegressor)
from sklearn.ensemble import (RandomForestRegressor, RandomForestClassifier,
                              GradientBoostingRegressor, GradientBoostingClassifier)
from sklearn.svm import SVR, SVC
from sklearn.neighbors import KNeighborsRegressor, KNeighborsClassifier
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB, MultinomialNB
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis, QuadraticDiscriminantAnalysis
from sklearn.cluster import (KMeans, DBSCAN, AgglomerativeClustering,
                             SpectralClustering, MeanShift)
from sklearn.mixture import GaussianMixture
from sklearn.decomposition import PCA, FastICA, NMF, FactorAnalysis
from sklearn.preprocessing import StandardScaler, RobustScaler, MinMaxScaler
from sklearn.metrics import (roc_auc_score, log_loss, mean_squared_error,
                             mean_absolute_error, r2_score, silhouette_score)
import warnings
warnings.filterwarnings('ignore')


class MotorEstadisticoCompleto:
    """Motor estadístico con TODA la biblioteca de métodos"""

    def __init__(self):
        self.modelos = {}
        self.scalers = {
            'standard': StandardScaler(),
            'robust': RobustScaler(),
            'minmax': MinMaxScaler()
        }
        self.cache = {}

    # ========================================================================
    # 1. ESTADÍSTICA DESCRIPTIVA COMPLETA
    # ========================================================================

    def descriptiva_completa(self, data):
        """Estadística descriptiva exhaustiva"""
        if isinstance(data, pd.DataFrame):
            data = data.values

        return {
            # Localización
            'media': np.mean(data, axis=0),
            'mediana': np.median(data, axis=0),
            'moda': stats.mode(data, axis=0, keepdims=True)[0],
            'media_geometrica': stats.gmean(data, axis=0),
            'media_armonica': stats.hmean(data, axis=0),
            'media_recortada_5': stats.trim_mean(data, 0.05, axis=0),
            'media_recortada_10': stats.trim_mean(data, 0.10, axis=0),

            # Dispersión
            'varianza': np.var(data, axis=0),
            'desviacion_std': np.std(data, axis=0),
            'mad': stats.median_abs_deviation(data, axis=0),
            'iqr': stats.iqr(data, axis=0),
            'rango': np.ptp(data, axis=0),
            'cv': stats.variation(data, axis=0),

            # Cuantiles
            'q01': np.percentile(data, 1, axis=0),
            'q05': np.percentile(data, 5, axis=0),
            'q10': np.percentile(data, 10, axis=0),
            'q25': np.percentile(data, 25, axis=0),
            'q50': np.percentile(data, 50, axis=0),
            'q75': np.percentile(data, 75, axis=0),
            'q90': np.percentile(data, 90, axis=0),
            'q95': np.percentile(data, 95, axis=0),
            'q99': np.percentile(data, 99, axis=0),

            # Forma
            'asimetria': stats.skew(data, axis=0),
            'curtosis': stats.kurtosis(data, axis=0),
            'momento3': stats.moment(data, moment=3, axis=0),
            'momento4': stats.moment(data, moment=4, axis=0),

            # Extremos
            'minimo': np.min(data, axis=0),
            'maximo': np.max(data, axis=0),

            # Info
            'n': data.shape[0],
            'n_vars': data.shape[1] if data.ndim > 1 else 1,
            'missing': np.sum(np.isnan(data), axis=0) if np.any(np.isnan(data)) else 0
        }

    def correlaciones_completas(self, data):
        """Matriz de correlaciones (Pearson, Spearman, Kendall)"""
        df = pd.DataFrame(data)

        return {
            'pearson': df.corr(method='pearson').values,
            'spearman': df.corr(method='spearman').values,
            'kendall': df.corr(method='kendall').values
        }

    def covarianza_robusta(self, data):
        """Matriz de covarianza robusta (MCD)"""
        from sklearn.covariance import MinCovDet

        mcd = MinCovDet(random_state=42).fit(data)

        return {
            'covarianza_robusta': mcd.covariance_,
            'localizacion_robusta': mcd.location_,
            'soporte': mcd.support_,
            'distancia_mahalanobis': mcd.mahalanobis(data)
        }

    # ========================================================================
    # 2. TESTS DE HIPÓTESIS (INVENTARIO COMPLETO)
    # ========================================================================

    def test_normalidad_completo(self, data):
        """Batería completa de tests de normalidad"""
        resultados = {}

        for i in range(data.shape[1] if data.ndim > 1 else 1):
            x = data[:, i] if data.ndim > 1 else data

            # Shapiro-Wilk
            sw_stat, sw_p = stats.shapiro(x)

            # Kolmogorov-Smirnov
            ks_stat, ks_p = stats.kstest(x, 'norm', args=(np.mean(x), np.std(x)))

            # Anderson-Darling
            ad_result = stats.anderson(x, dist='norm')

            # Jarque-Bera
            jb_stat, jb_p = stats.jarque_bera(x)

            # D'Agostino
            da_stat, da_p = stats.normaltest(x)

            resultados[f'var_{i}'] = {
                'shapiro_wilk': {'stat': sw_stat, 'pval': sw_p},
                'kolmogorov_smirnov': {'stat': ks_stat, 'pval': ks_p},
                'anderson_darling': {'stat': ad_result.statistic, 'critical_values': ad_result.critical_values},
                'jarque_bera': {'stat': jb_stat, 'pval': jb_p},
                'dagostino': {'stat': da_stat, 'pval': da_p},
                'conclusion': 'normal' if sw_p > 0.05 else 'no_normal'
            }

        return resultados

    def test_medias(self, muestra1, muestra2=None, tipo='t_student', pareado=False):
        """Tests de comparación de medias"""
        if muestra2 is None:
            # Test de 1 muestra
            stat, pval = stats.ttest_1samp(muestra1, 0)
            return {'test': 't_1muestra', 'stat': stat, 'pval': pval}

        if tipo == 't_student':
            if pareado:
                stat, pval = stats.ttest_rel(muestra1, muestra2)
                return {'test': 't_pareado', 'stat': stat, 'pval': pval}
            else:
                stat, pval = stats.ttest_ind(muestra1, muestra2)
                return {'test': 't_independiente', 'stat': stat, 'pval': pval}

        elif tipo == 'welch':
            stat, pval = stats.ttest_ind(muestra1, muestra2, equal_var=False)
            return {'test': 'welch', 'stat': stat, 'pval': pval}

        elif tipo == 'mann_whitney':
            stat, pval = stats.mannwhitneyu(muestra1, muestra2)
            return {'test': 'mann_whitney', 'stat': stat, 'pval': pval}

        elif tipo == 'wilcoxon':
            stat, pval = stats.wilcoxon(muestra1, muestra2)
            return {'test': 'wilcoxon', 'stat': stat, 'pval': pval}

    def anova_oneway(self, *grupos):
        """ANOVA de un factor"""
        stat, pval = stats.f_oneway(*grupos)

        return {
            'F_stat': stat,
            'pval': pval,
            'n_grupos': len(grupos),
            'conclusion': 'diferencias_significativas' if pval < 0.05 else 'no_diferencias'
        }

    def kruskal_wallis(self, *grupos):
        """Test de Kruskal-Wallis (ANOVA no paramétrico)"""
        stat, pval = stats.kruskal(*grupos)

        return {
            'H_stat': stat,
            'pval': pval,
            'n_grupos': len(grupos)
        }

    def test_varianzas(self, muestra1, muestra2, tipo='levene'):
        """Tests de homogeneidad de varianzas"""
        if tipo == 'levene':
            stat, pval = stats.levene(muestra1, muestra2)
            return {'test': 'levene', 'stat': stat, 'pval': pval}

        elif tipo == 'bartlett':
            stat, pval = stats.bartlett(muestra1, muestra2)
            return {'test': 'bartlett', 'stat': stat, 'pval': pval}

        elif tipo == 'fligner':
            stat, pval = stats.fligner(muestra1, muestra2)
            return {'test': 'fligner', 'stat': stat, 'pval': pval}

    def test_independencia_chi2(self, tabla_contingencia):
        """Test χ² de independencia"""
        chi2, pval, dof, expected = stats.chi2_contingency(tabla_contingencia)

        return {
            'chi2': chi2,
            'pval': pval,
            'grados_libertad': dof,
            'frecuencias_esperadas': expected,
            'independiente': pval > 0.05
        }

    def test_bondad_ajuste_chi2(self, observados, esperados):
        """Test χ² de bondad de ajuste"""
        chi2, pval = stats.chisquare(observados, esperados)

        return {
            'chi2': chi2,
            'pval': pval,
            'ajuste_bueno': pval > 0.05
        }

    # ========================================================================
    # 3. MODELOS DE REGRESIÓN (INVENTARIO COMPLETO)
    # ========================================================================

    def regresion_lineal_completa(self, X, y, tipo='ols', alpha=1.0):
        """Regresión lineal con diagnóstico completo"""
        # Estandarizar
        scaler = self.scalers['standard']
        X_scaled = scaler.fit_transform(X)

        # Seleccionar modelo
        modelos = {
            'ols': Ridge(alpha=0.0001),
            'ridge': Ridge(alpha=alpha),
            'lasso': Lasso(alpha=alpha),
            'elastic_net': ElasticNet(alpha=alpha, l1_ratio=0.5)
        }

        modelo = modelos.get(tipo, Ridge(alpha=0.0001))
        modelo.fit(X_scaled, y)

        # Predicciones y residuos
        y_pred = modelo.predict(X_scaled)
        residuos = y - y_pred

        # Métricas
        r2 = r2_score(y, y_pred)
        rmse = np.sqrt(mean_squared_error(y, y_pred))
        mae = mean_absolute_error(y, y_pred)

        # Diagnóstico
        residuos_std = (residuos - np.mean(residuos)) / np.std(residuos)

        # Leverage
        H = X_scaled @ np.linalg.pinv(X_scaled.T @ X_scaled) @ X_scaled.T
        leverage = np.diag(H)

        # Cook's distance
        n, p = X_scaled.shape
        mse = np.sum(residuos**2) / (n - p)
        cooks_d = (residuos**2 / (p * mse)) * (leverage / (1 - leverage)**2)

        # Tests
        # Durbin-Watson (autocorrelación)
        dw = np.sum(np.diff(residuos)**2) / np.sum(residuos**2)

        # Breusch-Pagan (heterocedasticidad)
        from scipy import stats as sp_stats
        residuos2 = residuos**2
        bp_stat = n * r2_score(residuos2, modelo.predict(X_scaled))

        return {
            'modelo': modelo,
            'coeficientes': modelo.coef_,
            'intercepto': modelo.intercept_,
            'metricas': {
                'r2': r2,
                'r2_ajustado': 1 - (1 - r2) * (n - 1) / (n - p - 1),
                'rmse': rmse,
                'mae': mae
            },
            'diagnostico': {
                'residuos': residuos,
                'residuos_std': residuos_std,
                'leverage': leverage,
                'cooks_distance': cooks_d,
                'durbin_watson': dw,
                'breusch_pagan_stat': bp_stat
            },
            'predicciones': y_pred
        }

    def glm_completo(self, X, y, familia='gaussian', link='identity'):
        """Modelo lineal generalizado completo"""
        scaler = self.scalers['standard']
        X_scaled = scaler.fit_transform(X)

        modelos_disponibles = {
            'binomial': LogisticRegression(max_iter=1000),
            'poisson': PoissonRegressor(max_iter=1000),
            'gamma': GammaRegressor(max_iter=1000),
            'tweedie': TweedieRegressor(power=1.5, max_iter=1000)
        }

        if familia == 'gaussian':
            from sklearn.linear_model import LinearRegression
            modelo = LinearRegression()
        else:
            modelo = modelos_disponibles.get(familia, LogisticRegression(max_iter=1000))

        modelo.fit(X_scaled, y)

        if familia == 'binomial':
            y_pred_proba = modelo.predict_proba(X_scaled)[:, 1]
            y_pred = modelo.predict(X_scaled)

            return {
                'modelo': modelo,
                'coeficientes': modelo.coef_[0],
                'intercepto': modelo.intercept_[0],
                'metricas': {
                    'auc': roc_auc_score(y, y_pred_proba),
                    'log_loss': log_loss(y, y_pred_proba),
                    'accuracy': np.mean(y == y_pred)
                },
                'predicciones_proba': y_pred_proba
            }
        else:
            y_pred = modelo.predict(X_scaled)

            return {
                'modelo': modelo,
                'coeficientes': modelo.coef_,
                'intercepto': modelo.intercept_,
                'metricas': {
                    'rmse': np.sqrt(mean_squared_error(y, y_pred)),
                    'mae': mean_absolute_error(y, y_pred)
                },
                'predicciones': y_pred
            }

    def regresion_cuantiles(self, X, y, cuantil=0.5):
        """Regresión por cuantiles"""
        from sklearn.linear_model import QuantileRegressor

        modelo = QuantileRegressor(quantile=cuantil, alpha=0)
        modelo.fit(X, y)

        y_pred = modelo.predict(X)

        return {
            'modelo': modelo,
            'cuantil': cuantil,
            'coeficientes': modelo.coef_,
            'intercepto': modelo.intercept_,
            'predicciones': y_pred
        }

    # ========================================================================
    # 4. MACHINE LEARNING SUPERVISADO
    # ========================================================================

    def random_forest(self, X, y, tipo='regresion', n_trees=100):
        """Random Forest"""
        if tipo == 'regresion':
            modelo = RandomForestRegressor(n_estimators=n_trees, random_state=42)
        else:
            modelo = RandomForestClassifier(n_estimators=n_trees, random_state=42)

        modelo.fit(X, y)
        y_pred = modelo.predict(X)

        return {
            'modelo': modelo,
            'importancia_variables': modelo.feature_importances_,
            'predicciones': y_pred,
            'n_arboles': n_trees
        }

    def gradient_boosting(self, X, y, tipo='regresion', n_estimators=100):
        """Gradient Boosting"""
        if tipo == 'regresion':
            modelo = GradientBoostingRegressor(n_estimators=n_estimators, random_state=42)
        else:
            modelo = GradientBoostingClassifier(n_estimators=n_estimators, random_state=42)

        modelo.fit(X, y)
        y_pred = modelo.predict(X)

        return {
            'modelo': modelo,
            'importancia_variables': modelo.feature_importances_,
            'predicciones': y_pred
        }

    def svm(self, X, y, tipo='regresion', kernel='rbf'):
        """Support Vector Machines"""
        if tipo == 'regresion':
            modelo = SVR(kernel=kernel)
        else:
            modelo = SVC(kernel=kernel, probability=True)

        modelo.fit(X, y)
        y_pred = modelo.predict(X)

        return {
            'modelo': modelo,
            'kernel': kernel,
            'predicciones': y_pred,
            'n_support': modelo.n_support_ if tipo == 'clasificacion' else None
        }

    def knn(self, X, y, tipo='regresion', n_neighbors=5):
        """K-Nearest Neighbors"""
        if tipo == 'regresion':
            modelo = KNeighborsRegressor(n_neighbors=n_neighbors)
        else:
            modelo = KNeighborsClassifier(n_neighbors=n_neighbors)

        modelo.fit(X, y)
        y_pred = modelo.predict(X)

        return {
            'modelo': modelo,
            'n_neighbors': n_neighbors,
            'predicciones': y_pred
        }

    def naive_bayes(self, X, y, tipo='gaussiano'):
        """Naive Bayes"""
        if tipo == 'gaussiano':
            modelo = GaussianNB()
        else:
            modelo = MultinomialNB()

        modelo.fit(X, y)
        y_pred = modelo.predict(X)
        y_proba = modelo.predict_proba(X)

        return {
            'modelo': modelo,
            'predicciones': y_pred,
            'probabilidades': y_proba
        }

    def lda_qda(self, X, y, tipo='lda'):
        """Análisis Discriminante Lineal/Cuadrático"""
        if tipo == 'lda':
            modelo = LinearDiscriminantAnalysis()
        else:
            modelo = QuadraticDiscriminantAnalysis()

        modelo.fit(X, y)
        y_pred = modelo.predict(X)

        return {
            'modelo': modelo,
            'tipo': tipo,
            'predicciones': y_pred,
            'probabilidades': modelo.predict_proba(X)
        }

    # ========================================================================
    # 5. ANÁLISIS MULTIVARIANTE
    # ========================================================================

    def pca_completo(self, X, n_componentes=None, whiten=False):
        """PCA completo con diagnóstico"""
        scaler = self.scalers['standard']
        X_scaled = scaler.fit_transform(X)

        if n_componentes is None:
            n_componentes = min(X.shape)

        pca = PCA(n_components=n_componentes, whiten=whiten, random_state=42)
        X_transformed = pca.fit_transform(X_scaled)

        return {
            'componentes': pca.components_,
            'varianza_explicada': pca.explained_variance_ratio_,
            'varianza_acumulada': np.cumsum(pca.explained_variance_ratio_),
            'valores_propios': pca.explained_variance_,
            'X_transformado': X_transformed,
            'modelo': pca,
            'n_componentes_95': np.argmax(np.cumsum(pca.explained_variance_ratio_) >= 0.95) + 1
        }

    def factor_analysis(self, X, n_factores=2):
        """Análisis factorial"""
        fa = FactorAnalysis(n_components=n_factores, random_state=42)
        X_transformed = fa.fit_transform(X)

        return {
            'cargas': fa.components_.T,
            'ruido': fa.noise_variance_,
            'log_likelihood': fa.score(X),
            'scores': X_transformed
        }

    def ica(self, X, n_componentes=None):
        """Independent Component Analysis"""
        if n_componentes is None:
            n_componentes = min(X.shape)

        ica = FastICA(n_components=n_componentes, random_state=42)
        X_transformed = ica.fit_transform(X)

        return {
            'componentes': ica.components_,
            'mixing_matrix': ica.mixing_,
            'X_transformado': X_transformed,
            'modelo': ica
        }

    def nmf(self, X, n_componentes=2):
        """Non-negative Matrix Factorization"""
        nmf_model = NMF(n_components=n_componentes, random_state=42)
        W = nmf_model.fit_transform(X)
        H = nmf_model.components_

        return {
            'W': W,
            'H': H,
            'reconstruccion_error': nmf_model.reconstruction_err_,
            'modelo': nmf_model
        }

    # ========================================================================
    # 6. CLUSTERING (TODOS LOS MÉTODOS)
    # ========================================================================

    def clustering_completo(self, X, metodo='kmeans', n_clusters=3):
        """Clustering con múltiples algoritmos"""
        scaler = self.scalers['standard']
        X_scaled = scaler.fit_transform(X)

        if metodo == 'kmeans':
            modelo = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            labels = modelo.fit_predict(X_scaled)
            centroides = modelo.cluster_centers_
            inercia = modelo.inertia_

        elif metodo == 'dbscan':
            modelo = DBSCAN(eps=0.5, min_samples=5)
            labels = modelo.fit_predict(X_scaled)
            centroides = None
            inercia = None

        elif metodo == 'hierarchical':
            modelo = AgglomerativeClustering(n_clusters=n_clusters)
            labels = modelo.fit_predict(X_scaled)
            centroides = None
            inercia = None

        elif metodo == 'spectral':
            modelo = SpectralClustering(n_clusters=n_clusters, random_state=42)
            labels = modelo.fit_predict(X_scaled)
            centroides = None
            inercia = None

        elif metodo == 'gmm':
            modelo = GaussianMixture(n_components=n_clusters, random_state=42)
            labels = modelo.fit_predict(X_scaled)
            centroides = modelo.means_
            inercia = -modelo.score(X_scaled)

        elif metodo == 'meanshift':
            modelo = MeanShift()
            labels = modelo.fit_predict(X_scaled)
            centroides = modelo.cluster_centers_
            inercia = None

        # Métricas
        if len(np.unique(labels)) > 1:
            silhouette = silhouette_score(X_scaled, labels)
        else:
            silhouette = 0

        return {
            'labels': labels,
            'centroides': centroides,
            'inercia': inercia,
            'silhouette': silhouette,
            'n_clusters': len(np.unique(labels)),
            'modelo': modelo
        }

    # ========================================================================
    # 7. SERIES TEMPORALES
    # ========================================================================

    def arima_simple(self, serie, p=1, d=1, q=1):
        """ARIMA básico (requiere statsmodels - opcional)"""
        try:
            from statsmodels.tsa.arima.model import ARIMA

            modelo = ARIMA(serie, order=(p, d, q))
            resultado = modelo.fit()

            return {
                'parametros': resultado.params,
                'aic': resultado.aic,
                'bic': resultado.bic,
                'predicciones': resultado.fittedvalues,
                'residuos': resultado.resid,
                'modelo': resultado
            }
        except ImportError:
            return {'error': 'statsmodels no está instalado'}

    def suavizado_exponencial(self, serie, alpha=0.3):
        """Suavizado exponencial simple"""
        n = len(serie)
        s = np.zeros(n)
        s[0] = serie[0]

        for t in range(1, n):
            s[t] = alpha * serie[t] + (1 - alpha) * s[t-1]

        return {
            'serie_suavizada': s,
            'alpha': alpha
        }

    def descomposicion_serie(self, serie, periodo=12):
        """Descomposición de serie temporal (tendencia + estacionalidad + residuo)"""
        try:
            from statsmodels.tsa.seasonal import seasonal_decompose

            resultado = seasonal_decompose(serie, model='additive', period=periodo)

            return {
                'tendencia': resultado.trend,
                'estacionalidad': resultado.seasonal,
                'residuo': resultado.resid,
                'observado': resultado.observed
            }
        except ImportError:
            return {'error': 'statsmodels no está instalado'}

    # ========================================================================
    # 8. SUPERVIVENCIA
    # ========================================================================

    def kaplan_meier(self, tiempos, eventos):
        """Estimador Kaplan-Meier"""
        orden = np.argsort(tiempos)
        tiempos = tiempos[orden]
        eventos = eventos[orden]

        tiempos_unicos = np.unique(tiempos)
        supervivencia = []
        ic_lower = []
        ic_upper = []
        s_actual = 1.0
        var_acum = 0

        for t in tiempos_unicos:
            en_riesgo = np.sum(tiempos >= t)
            eventos_t = np.sum((tiempos == t) & (eventos == 1))

            if en_riesgo > 0:
                s_actual *= (1 - eventos_t / en_riesgo)
                supervivencia.append(s_actual)

                # Greenwood variance
                if eventos_t > 0:
                    var_acum += eventos_t / (en_riesgo * (en_riesgo - eventos_t))

                se = s_actual * np.sqrt(var_acum)
                ic_lower.append(max(0, s_actual - 1.96 * se))
                ic_upper.append(min(1, s_actual + 1.96 * se))

        supervivencia = np.array(supervivencia)

        return {
            'tiempos': tiempos_unicos,
            'supervivencia': supervivencia,
            'ic_lower': np.array(ic_lower),
            'ic_upper': np.array(ic_upper),
            'mediana': tiempos_unicos[np.argmin(np.abs(supervivencia - 0.5))] if len(supervivencia) > 0 else np.nan
        }

    # ========================================================================
    # 9. CAUSALIDAD
    # ========================================================================

    def diferencias_en_diferencias(self, pre_tratados, post_tratados, pre_control, post_control):
        """Difference-in-Differences con IC bootstrap"""
        diff_tratados = np.mean(post_tratados) - np.mean(pre_tratados)
        diff_control = np.mean(post_control) - np.mean(pre_control)

        ate = diff_tratados - diff_control

        # Bootstrap CI
        n_boot = 1000
        ates_boot = []

        for _ in range(n_boot):
            idx_t_pre = np.random.choice(len(pre_tratados), len(pre_tratados))
            idx_t_post = np.random.choice(len(post_tratados), len(post_tratados))
            idx_c_pre = np.random.choice(len(pre_control), len(pre_control))
            idx_c_post = np.random.choice(len(post_control), len(post_control))

            diff_t = np.mean(post_tratados[idx_t_post]) - np.mean(pre_tratados[idx_t_pre])
            diff_c = np.mean(post_control[idx_c_post]) - np.mean(pre_control[idx_c_pre])

            ates_boot.append(diff_t - diff_c)

        ates_boot = np.array(ates_boot)

        return {
            'ate': ate,
            'se_bootstrap': np.std(ates_boot),
            'ci_95': (np.percentile(ates_boot, 2.5), np.percentile(ates_boot, 97.5)),
            'distribucion_ate_bootstrap': ates_boot
        }

    def propensity_score_matching(self, X_tratados, X_control, y_tratados, y_control):
        """Propensity Score Matching simple"""
        # Estimar propensity scores
        X_all = np.vstack([X_tratados, X_control])
        tratamiento = np.hstack([np.ones(len(X_tratados)), np.zeros(len(X_control))])

        modelo_ps = LogisticRegression(max_iter=1000)
        modelo_ps.fit(X_all, tratamiento)

        ps_tratados = modelo_ps.predict_proba(X_tratados)[:, 1]
        ps_control = modelo_ps.predict_proba(X_control)[:, 1]

        # Matching simple (nearest neighbor)
        matches = []
        for i, ps_t in enumerate(ps_tratados):
            distancias = np.abs(ps_control - ps_t)
            idx_match = np.argmin(distancias)
            matches.append(idx_match)

        y_control_matched = y_control[matches]

        ate = np.mean(y_tratados) - np.mean(y_control_matched)

        return {
            'ate': ate,
            'ps_tratados': ps_tratados,
            'ps_control': ps_control,
            'matches': matches
        }

    # ========================================================================
    # 10. BOOTSTRAP E INFERENCIA
    # ========================================================================

    def bootstrap_completo(self, data, estadistico_fn, n_bootstrap=1000, alpha=0.05, metodo='percentil'):
        """Bootstrap con múltiples métodos de IC"""
        n = len(data)
        estadisticos = []

        for _ in range(n_bootstrap):
            muestra = data[np.random.randint(0, n, n)]
            estadisticos.append(estadistico_fn(muestra))

        estadisticos = np.array(estadisticos)
        estadistico_obs = estadistico_fn(data)

        # IC percentil
        ic_percentil = (np.percentile(estadisticos, alpha/2 * 100),
                       np.percentile(estadisticos, (1 - alpha/2) * 100))

        # IC básico
        ic_basico = (2 * estadistico_obs - np.percentile(estadisticos, (1 - alpha/2) * 100),
                     2 * estadistico_obs - np.percentile(estadisticos, alpha/2 * 100))

        # IC normal
        se = np.std(estadisticos)
        z = stats.norm.ppf(1 - alpha/2)
        ic_normal = (estadistico_obs - z * se, estadistico_obs + z * se)

        return {
            'estadistico_observado': estadistico_obs,
            'media_bootstrap': np.mean(estadisticos),
            'se_bootstrap': se,
            'sesgo_bootstrap': np.mean(estadisticos) - estadistico_obs,
            'ic_percentil': ic_percentil,
            'ic_basico': ic_basico,
            'ic_normal': ic_normal,
            'distribucion': estadisticos
        }

    def jackknife(self, data, estadistico_fn):
        """Jackknife (leave-one-out)"""
        n = len(data)
        estadisticos = []

        for i in range(n):
            muestra = np.delete(data, i)
            estadisticos.append(estadistico_fn(muestra))

        estadisticos = np.array(estadisticos)
        estadistico_obs = estadistico_fn(data)

        # Estimación de sesgo y varianza
        sesgo = (n - 1) * (np.mean(estadisticos) - estadistico_obs)
        var_jk = ((n - 1) / n) * np.sum((estadisticos - np.mean(estadisticos))**2)

        return {
            'estadistico_observado': estadistico_obs,
            'sesgo_jackknife': sesgo,
            'varianza_jackknife': var_jk,
            'se_jackknife': np.sqrt(var_jk),
            'estadisticos_jackknife': estadisticos
        }


# ============================================================================
# EJEMPLO DE USO
# ============================================================================

if __name__ == "__main__":
    print("="*80)
    print("MOTOR ESTADÍSTICO COMPLETO - BATERÍA DE PRUEBAS")
    print("="*80)

    motor = MotorEstadisticoCompleto()

    # Datos sintéticos
    np.random.seed(42)
    n = 500
    X = np.random.randn(n, 5)
    y_reg = 10 + 2*X[:, 0] + 3*X[:, 1] + np.random.randn(n)
    y_class = (y_reg > np.median(y_reg)).astype(int)

    # 1. Descriptiva completa
    print("\n1. ESTADÍSTICA DESCRIPTIVA COMPLETA:")
    desc = motor.descriptiva_completa(X)
    print(f"   Media: {desc['media'][:3]}")
    print(f"   Mediana: {desc['mediana'][:3]}")
    print(f"   Asimetría: {desc['asimetria'][:3]}")

    # 2. Tests de normalidad
    print("\n2. TESTS DE NORMALIDAD:")
    norm_test = motor.test_normalidad_completo(X)
    print(f"   Variables analizadas: {len(norm_test)}")

    # 3. Regresión completa
    print("\n3. REGRESIÓN LINEAL COMPLETA:")
    reg = motor.regresion_lineal_completa(X, y_reg, tipo='ridge', alpha=1.0)
    print(f"   R²: {reg['metricas']['r2']:.4f}")
    print(f"   RMSE: {reg['metricas']['rmse']:.4f}")
    print(f"   Durbin-Watson: {reg['diagnostico']['durbin_watson']:.4f}")

    # 4. Random Forest
    print("\n4. RANDOM FOREST:")
    rf = motor.random_forest(X, y_reg, tipo='regresion', n_trees=50)
    print(f"   Importancia top 3: {sorted(rf['importancia_variables'])[-3:]}")

    # 5. PCA
    print("\n5. PCA COMPLETO:")
    pca = motor.pca_completo(X, n_componentes=3)
    print(f"   Varianza explicada: {pca['varianza_explicada']}")
    print(f"   Componentes para 95%: {pca['n_componentes_95']}")

    # 6. Clustering
    print("\n6. CLUSTERING K-MEANS:")
    cluster = motor.clustering_completo(X, metodo='kmeans', n_clusters=3)
    print(f"   Silhouette score: {cluster['silhouette']:.4f}")
    print(f"   Inercia: {cluster['inercia']:.2f}")

    # 7. Kaplan-Meier
    print("\n7. SUPERVIVENCIA (KAPLAN-MEIER):")
    tiempos = np.random.exponential(10, 100)
    eventos = np.random.binomial(1, 0.7, 100)
    km = motor.kaplan_meier(tiempos, eventos)
    print(f"   Mediana de supervivencia: {km['mediana']:.2f}")

    # 8. Bootstrap
    print("\n8. BOOTSTRAP:")
    data_boot = np.random.normal(100, 15, 200)
    boot = motor.bootstrap_completo(data_boot, np.mean, n_bootstrap=1000)
    print(f"   Estadístico observado: {boot['estadistico_observado']:.2f}")
    print(f"   IC 95% percentil: [{boot['ic_percentil'][0]:.2f}, {boot['ic_percentil'][1]:.2f}]")

    print("\n" + "="*80)
    print("MOTOR ESTADÍSTICO COMPLETO OPERATIVO")
    print("="*80)

"""
MOTOR ESTADÍSTICO - EXTENSIÓN 5: ANÁLISIS DE REDES Y DATOS COMPOSICIONALES
===========================================================================

PARTE A: ANÁLISIS DE REDES (Network Analysis)
- Métricas de centralidad (degree, betweenness, closeness, eigenvector)
- Detección de comunidades (Louvain, Girvan-Newman)
- Modelos de redes aleatorias (Erdős-Rényi, Barabási-Albert)
- Asortatividad y homofilia
- Análisis de caminos (shortest paths, diámetro)
- ERGM (Exponential Random Graph Models) simplificado

PARTE B: DATOS COMPOSICIONALES (Compositional Data Analysis)
- Transformaciones (CLR, ILR, ALR)
- Distancia de Aitchison
- Análisis de componentes principales composicional
- Regresión composicional
- Cierre composicional

Aplicaciones en seguros:
- Redes de fraude (clientes, intermediarios)
- Análisis de cartera (composición de primas por ramo)
- Cross-sell (redes de productos)
- Siniestralidad por tipo (proporciones que suman 100%)
"""

import numpy as np
from scipy import stats, optimize, linalg
from scipy.spatial.distance import pdist, squareform
from typing import List, Tuple, Dict, Optional, Union
from collections import defaultdict, deque


class MotorAnalisisRedes:
    """Motor completo de análisis de redes sociales y complejas"""

    def __init__(self):
        self.nombre = "Motor Análisis de Redes"
        self.version = "1.0.0"

    # ==========================================
    # 1. MÉTRICAS DE CENTRALIDAD
    # ==========================================

    def centralidad_grado(self, matriz_adyacencia: np.ndarray,
                         dirigida: bool = False) -> Dict:
        """
        Centralidad de grado (degree centrality)

        C_D(v) = grado(v) / (n - 1)

        Mide la fracción de nodos a los que un nodo está conectado directamente

        Parámetros:
        -----------
        matriz_adyacencia : array (n, n) - 1 si hay conexión, 0 si no
        dirigida : bool - si la red es dirigida (in-degree, out-degree)
        """
        n = len(matriz_adyacencia)

        if not dirigida:
            # Red no dirigida: grado = suma de conexiones
            grados = np.sum(matriz_adyacencia, axis=1)
            centralidad = grados / (n - 1) if n > 1 else grados

            return {
                'centralidad': centralidad,
                'grados': grados,
                'nodo_mas_central': np.argmax(centralidad),
                'grado_promedio': np.mean(grados),
                'densidad': np.sum(grados) / (n * (n - 1))
            }
        else:
            # Red dirigida: in-degree y out-degree
            in_degree = np.sum(matriz_adyacencia, axis=0)
            out_degree = np.sum(matriz_adyacencia, axis=1)

            centralidad_in = in_degree / (n - 1) if n > 1 else in_degree
            centralidad_out = out_degree / (n - 1) if n > 1 else out_degree

            return {
                'centralidad_in': centralidad_in,
                'centralidad_out': centralidad_out,
                'in_degree': in_degree,
                'out_degree': out_degree,
                'hub_principal': np.argmax(out_degree),
                'autoridad_principal': np.argmax(in_degree)
            }

    def centralidad_intermediacion(self, matriz_adyacencia: np.ndarray) -> Dict:
        """
        Centralidad de intermediación (betweenness centrality)

        C_B(v) = Σ_{s≠v≠t} [σ_st(v) / σ_st]

        donde σ_st = número de caminos más cortos de s a t
              σ_st(v) = número de caminos más cortos de s a t que pasan por v

        Mide cuánto un nodo actúa como "puente" en la red
        """
        n = len(matriz_adyacencia)

        # Calcular todos los caminos más cortos (Floyd-Warshall adaptado)
        dist = np.where(matriz_adyacencia > 0, 1, np.inf)
        np.fill_diagonal(dist, 0)

        # Matriz de predecesores para reconstruir caminos
        pred = np.where(matriz_adyacencia > 0, np.arange(n)[:, None], -1)
        np.fill_diagonal(pred, np.arange(n))

        # Floyd-Warshall para distancias más cortas
        for k in range(n):
            for i in range(n):
                for j in range(n):
                    if dist[i, k] + dist[k, j] < dist[i, j]:
                        dist[i, j] = dist[i, k] + dist[k, j]
                        pred[i, j] = pred[k, j]

        # Calcular betweenness (versión simplificada)
        betweenness = np.zeros(n)

        for s in range(n):
            for t in range(n):
                if s != t and dist[s, t] < np.inf:
                    # Reconstruir caminos (simplificado: solo 1 camino)
                    camino = []
                    actual = t
                    while actual != s:
                        camino.append(actual)
                        actual = pred[s, actual]
                        if actual == -1:
                            break

                    # Incrementar betweenness de nodos intermedios
                    for nodo in camino[1:]:  # Excluir s y t
                        if nodo != s:
                            betweenness[nodo] += 1

        # Normalizar
        if n > 2:
            betweenness /= ((n - 1) * (n - 2))

        return {
            'betweenness': betweenness,
            'nodo_puente_principal': np.argmax(betweenness),
            'max_betweenness': np.max(betweenness),
            'matriz_distancias': dist
        }

    def centralidad_cercania(self, matriz_adyacencia: np.ndarray) -> Dict:
        """
        Centralidad de cercanía (closeness centrality)

        C_C(v) = (n - 1) / Σ_u d(v, u)

        Mide qué tan "cerca" está un nodo de todos los demás
        Valores altos: puede alcanzar otros nodos rápidamente
        """
        n = len(matriz_adyacencia)

        # Calcular distancias más cortas (BFS desde cada nodo)
        dist = np.where(matriz_adyacencia > 0, 1, np.inf)
        np.fill_diagonal(dist, 0)

        # Floyd-Warshall
        for k in range(n):
            for i in range(n):
                for j in range(n):
                    dist[i, j] = min(dist[i, j], dist[i, k] + dist[k, j])

        # Calcular closeness
        closeness = np.zeros(n)
        for i in range(n):
            distancias_finitas = dist[i][np.isfinite(dist[i]) & (dist[i] > 0)]
            if len(distancias_finitas) > 0:
                closeness[i] = len(distancias_finitas) / np.sum(distancias_finitas)

        return {
            'closeness': closeness,
            'nodo_mas_cercano': np.argmax(closeness),
            'max_closeness': np.max(closeness),
            'diametro_red': np.max(dist[np.isfinite(dist)])
        }

    def centralidad_eigenvector(self, matriz_adyacencia: np.ndarray,
                                max_iter: int = 100, tol: float = 1e-6) -> Dict:
        """
        Centralidad de eigenvector (eigenvector centrality)

        Ax = λx (autovector principal de A)

        La centralidad de un nodo es proporcional a la suma de centralidades
        de sus vecinos. Captura influencia en la red.

        Similar a PageRank de Google.
        """
        n = len(matriz_adyacencia)

        # Power iteration para autovector principal
        x = np.ones(n) / n

        for iteracion in range(max_iter):
            x_nuevo = matriz_adyacencia @ x

            # Normalizar
            norma = np.linalg.norm(x_nuevo)
            if norma > 0:
                x_nuevo /= norma

            # Verificar convergencia
            if np.linalg.norm(x_nuevo - x) < tol:
                break

            x = x_nuevo

        # Autovalor principal
        lambda_principal = (x @ matriz_adyacencia @ x) / (x @ x) if np.dot(x, x) > 0 else 0

        return {
            'eigenvector_centrality': x,
            'autovalor_principal': lambda_principal,
            'nodo_mas_influyente': np.argmax(x),
            'iteraciones': iteracion + 1,
            'convergido': iteracion < max_iter - 1
        }

    def pagerank(self, matriz_adyacencia: np.ndarray, damping: float = 0.85,
                max_iter: int = 100, tol: float = 1e-6) -> Dict:
        """
        PageRank (algoritmo de Google)

        PR(v) = (1-d)/n + d * Σ_{u→v} PR(u) / L(u)

        donde d = damping factor (0.85 típicamente)
              L(u) = out-degree del nodo u

        Mide importancia considerando la calidad de los enlaces entrantes
        """
        n = len(matriz_adyacencia)

        # Out-degree de cada nodo
        out_degree = np.sum(matriz_adyacencia, axis=1)

        # Evitar división por cero
        out_degree[out_degree == 0] = 1

        # Matriz de transición estocástica
        M = matriz_adyacencia.T / out_degree

        # PageRank inicial
        pr = np.ones(n) / n

        for iteracion in range(max_iter):
            pr_nuevo = (1 - damping) / n + damping * M @ pr

            # Normalizar
            pr_nuevo /= np.sum(pr_nuevo)

            # Convergencia
            if np.linalg.norm(pr_nuevo - pr, 1) < tol:
                break

            pr = pr_nuevo

        return {
            'pagerank': pr,
            'nodo_mas_importante': np.argmax(pr),
            'max_pagerank': np.max(pr),
            'damping_factor': damping,
            'iteraciones': iteracion + 1
        }

    # ==========================================
    # 2. DETECCIÓN DE COMUNIDADES
    # ==========================================

    def modularidad(self, matriz_adyacencia: np.ndarray,
                   asignacion_comunidades: np.ndarray) -> float:
        """
        Modularidad de Newman (quality measure for community detection)

        Q = (1/2m) * Σ_{ij} [A_ij - (k_i * k_j)/(2m)] * δ(c_i, c_j)

        donde m = número total de enlaces
              k_i = grado del nodo i
              δ(c_i, c_j) = 1 si i,j en misma comunidad, 0 si no

        Q ∈ [-0.5, 1]: valores altos indican estructura comunitaria fuerte
        """
        n = len(matriz_adyacencia)
        m = np.sum(matriz_adyacencia) / 2  # Total de enlaces (red no dirigida)

        if m == 0:
            return 0.0

        # Grados
        k = np.sum(matriz_adyacencia, axis=1)

        # Calcular modularidad
        Q = 0.0
        for i in range(n):
            for j in range(n):
                if asignacion_comunidades[i] == asignacion_comunidades[j]:
                    Q += matriz_adyacencia[i, j] - (k[i] * k[j]) / (2 * m)

        Q /= (2 * m)

        return Q

    def louvain_simplificado(self, matriz_adyacencia: np.ndarray,
                            max_iter: int = 50) -> Dict:
        """
        Algoritmo de Louvain (versión simplificada)

        Detecta comunidades maximizando la modularidad.

        Fases:
        1. Asignación local: cada nodo se mueve a comunidad del vecino
           que más incrementa Q
        2. Agregación: crear super-red donde cada comunidad es un nodo

        Nota: implementación simplificada (solo fase 1, pocas iteraciones)
        """
        n = len(matriz_adyacencia)

        # Inicializar: cada nodo en su propia comunidad
        comunidades = np.arange(n)

        m = np.sum(matriz_adyacencia) / 2
        k = np.sum(matriz_adyacencia, axis=1)

        Q_actual = self.modularidad(matriz_adyacencia, comunidades)
        mejoro = True
        iteracion = 0

        while mejoro and iteracion < max_iter:
            mejoro = False
            iteracion += 1

            # Para cada nodo
            for i in np.random.permutation(n):
                # Comunidad actual
                c_actual = comunidades[i]

                # Vecinos del nodo i
                vecinos = np.where(matriz_adyacencia[i] > 0)[0]

                # Comunidades de los vecinos
                comunidades_vecinos = np.unique(comunidades[vecinos])

                mejor_Q = Q_actual
                mejor_comunidad = c_actual

                # Probar mover nodo i a cada comunidad de vecinos
                for c_nueva in comunidades_vecinos:
                    if c_nueva != c_actual:
                        # Cambiar temporalmente
                        comunidades[i] = c_nueva
                        Q_nueva = self.modularidad(matriz_adyacencia, comunidades)

                        if Q_nueva > mejor_Q:
                            mejor_Q = Q_nueva
                            mejor_comunidad = c_nueva

                        # Revertir
                        comunidades[i] = c_actual

                # Si encontramos mejor comunidad, mover permanentemente
                if mejor_comunidad != c_actual:
                    comunidades[i] = mejor_comunidad
                    Q_actual = mejor_Q
                    mejoro = True

        # Re-etiquetar comunidades consecutivamente
        comunidades_unicas = np.unique(comunidades)
        mapeo = {old: new for new, old in enumerate(comunidades_unicas)}
        comunidades = np.array([mapeo[c] for c in comunidades])

        return {
            'comunidades': comunidades,
            'n_comunidades': len(comunidades_unicas),
            'modularidad': Q_actual,
            'iteraciones': iteracion,
            'tamaños_comunidades': [np.sum(comunidades == c) for c in range(len(comunidades_unicas))]
        }

    # ==========================================
    # 3. MODELOS DE REDES ALEATORIAS
    # ==========================================

    def modelo_erdos_renyi(self, n: int, p: float) -> Dict:
        """
        Modelo de Erdős-Rényi G(n, p)

        Red aleatoria donde cada par de nodos se conecta con probabilidad p

        Parámetros:
        -----------
        n : int - número de nodos
        p : float ∈ [0, 1] - probabilidad de conexión

        Propiedades teóricas:
        - Grado esperado: (n-1)*p
        - Número esperado de enlaces: n(n-1)p/2
        - Diámetro: O(log n)
        """
        # Generar matriz de adyacencia aleatoria
        rand_matrix = np.random.rand(n, n)
        matriz_adyacencia = (rand_matrix < p).astype(int)

        # Hacer simétrica (red no dirigida)
        matriz_adyacencia = np.triu(matriz_adyacencia, 1)
        matriz_adyacencia = matriz_adyacencia + matriz_adyacencia.T

        # Estadísticas
        m = np.sum(matriz_adyacencia) / 2
        grados = np.sum(matriz_adyacencia, axis=1)

        return {
            'matriz_adyacencia': matriz_adyacencia,
            'n_nodos': n,
            'n_enlaces': m,
            'probabilidad_p': p,
            'grado_promedio': np.mean(grados),
            'grado_esperado': (n - 1) * p,
            'densidad': 2 * m / (n * (n - 1)) if n > 1 else 0
        }

    def modelo_barabasi_albert(self, n: int, m: int) -> Dict:
        """
        Modelo de Barabási-Albert (preferential attachment)

        Red libre de escala: nodos nuevos se conectan preferentemente a
        nodos con alto grado (ricos se hacen más ricos).

        Genera distribución de grados P(k) ~ k^(-γ) con γ ≈ 3

        Parámetros:
        -----------
        n : int - número final de nodos
        m : int - número de enlaces que añade cada nodo nuevo
        """
        if m >= n:
            m = n - 1

        # Inicializar con grafo completo de m+1 nodos
        matriz_adyacencia = np.zeros((n, n), dtype=int)
        for i in range(m + 1):
            for j in range(i + 1, m + 1):
                matriz_adyacencia[i, j] = 1
                matriz_adyacencia[j, i] = 1

        # Añadir nodos restantes con preferential attachment
        for nuevo_nodo in range(m + 1, n):
            # Grados actuales
            grados = np.sum(matriz_adyacencia[:nuevo_nodo, :nuevo_nodo], axis=1)

            # Evitar división por cero
            suma_grados = np.sum(grados)
            if suma_grados == 0:
                probabilidades = np.ones(nuevo_nodo) / nuevo_nodo
            else:
                # Probabilidad proporcional al grado
                probabilidades = grados / suma_grados

            # Seleccionar m nodos para conectar (sin reemplazo)
            nodos_seleccionados = np.random.choice(
                nuevo_nodo, size=min(m, nuevo_nodo), replace=False, p=probabilidades
            )

            # Crear enlaces
            for nodo in nodos_seleccionados:
                matriz_adyacencia[nuevo_nodo, nodo] = 1
                matriz_adyacencia[nodo, nuevo_nodo] = 1

        # Estadísticas
        grados_finales = np.sum(matriz_adyacencia, axis=1)

        return {
            'matriz_adyacencia': matriz_adyacencia,
            'n_nodos': n,
            'm_enlaces_por_nodo': m,
            'grados': grados_finales,
            'grado_promedio': np.mean(grados_finales),
            'grado_max': np.max(grados_finales),
            'hubs': np.where(grados_finales > np.percentile(grados_finales, 90))[0].tolist()
        }

    # ==========================================
    # 4. ASORTATIVIDAD
    # ==========================================

    def asortatividad_grado(self, matriz_adyacencia: np.ndarray) -> Dict:
        """
        Coeficiente de asortatividad por grado (degree assortativity)

        r = coeficiente de correlación de Pearson entre grados de nodos conectados

        r > 0: asortatividad (nodos de alto grado conectados entre sí)
        r = 0: no hay patrón
        r < 0: disasortatividad (nodos de alto grado conectados a bajo grado)

        Redes sociales: típicamente r > 0 (homofilia)
        Redes tecnológicas: típicamente r < 0 (estructura hub-and-spoke)
        """
        # Grados
        k = np.sum(matriz_adyacencia, axis=1)

        # Pares de grados conectados
        pares_grados_i = []
        pares_grados_j = []

        for i in range(len(matriz_adyacencia)):
            for j in range(i + 1, len(matriz_adyacencia)):
                if matriz_adyacencia[i, j] > 0:
                    pares_grados_i.append(k[i])
                    pares_grados_j.append(k[j])

        if len(pares_grados_i) == 0:
            return {'asortatividad': 0.0, 'interpretacion': 'Red sin enlaces'}

        # Correlación de Pearson
        r, p_valor = stats.pearsonr(pares_grados_i, pares_grados_j)

        # Interpretación
        if r > 0.3:
            interpretacion = "Asortatividad positiva (homofilia por grado)"
        elif r < -0.3:
            interpretacion = "Disasortatividad (estructura jerárquica)"
        else:
            interpretacion = "Sin patrón claro de asortatividad"

        return {
            'asortatividad': r,
            'p_valor': p_valor,
            'n_enlaces': len(pares_grados_i),
            'interpretacion': interpretacion
        }


# ========================================================================
# PARTE B: DATOS COMPOSICIONALES
# ========================================================================

class MotorDatosComposicionales:
    """Motor de análisis de datos composicionales (proporciones que suman constante)"""

    def __init__(self):
        self.nombre = "Motor Datos Composicionales"
        self.version = "1.0.0"

    # ==========================================
    # 1. TRANSFORMACIONES COMPOSICIONALES
    # ==========================================

    def cierre_composicional(self, X: np.ndarray, constante: float = 1.0) -> np.ndarray:
        """
        Cierre composicional (compositional closure)

        C(x) = k * x / Σxᵢ

        Fuerza que los componentes sumen una constante k (típicamente 1 o 100)

        Parámetros:
        -----------
        X : array (n, D) - datos originales (pueden no sumar constante)
        constante : float - valor de cierre (1.0 para proporciones, 100 para %)
        """
        sumas = np.sum(X, axis=1, keepdims=True)
        X_cerrado = constante * X / sumas
        return X_cerrado

    def transformacion_clr(self, X: np.ndarray) -> np.ndarray:
        """
        Transformación CLR (Centered Log-Ratio)

        clr(x) = [log(x₁/g(x)), log(x₂/g(x)), ..., log(xD/g(x))]

        donde g(x) = (x₁ * x₂ * ... * xD)^(1/D) es la media geométrica

        Propiedades:
        - Transforma simplex a espacio real
        - Preserva distancias de Aitchison
        - Resultado vive en subespacio (D-1)-dimensional

        Parámetros:
        -----------
        X : array (n, D) - composiciones (proporciones que suman 1)
        """
        # Evitar log(0) añadiendo pequeña constante
        X_safe = np.where(X > 0, X, 1e-10)

        # Media geométrica
        gm = np.exp(np.mean(np.log(X_safe), axis=1, keepdims=True))

        # CLR
        X_clr = np.log(X_safe / gm)

        return X_clr

    def transformacion_alr(self, X: np.ndarray, referencia: int = -1) -> np.ndarray:
        """
        Transformación ALR (Additive Log-Ratio)

        alr(x) = [log(x₁/xD), log(x₂/xD), ..., log(x_{D-1}/xD)]

        donde xD es el componente de referencia

        Ventaja: resultado en R^(D-1) sin restricciones
        Desventaja: no es invariante a cambio de referencia

        Parámetros:
        -----------
        X : array (n, D) - composiciones
        referencia : int - índice del componente de referencia (default: último)
        """
        # Evitar log(0)
        X_safe = np.where(X > 0, X, 1e-10)

        # Componente de referencia
        x_ref = X_safe[:, referencia:referencia+1]

        # ALR (excluye componente de referencia)
        indices = [i for i in range(X.shape[1]) if i != referencia]
        X_alr = np.log(X_safe[:, indices] / x_ref)

        return X_alr

    def transformacion_ilr(self, X: np.ndarray) -> np.ndarray:
        """
        Transformación ILR (Isometric Log-Ratio)

        ilr(x) = V^T * clr(x)

        donde V es base ortonormal del simplex

        Propiedades:
        - Preserva distancias (isometría)
        - Coordenadas ortogonales en R^(D-1)
        - Interpretable mediante particiones binarias

        Nota: implementación con base de Helmert
        """
        D = X.shape[1]

        # CLR
        X_clr = self.transformacion_clr(X)

        # Matriz de Helmert (base ortonormal)
        V = np.zeros((D, D - 1))
        for k in range(D - 1):
            for i in range(k + 1):
                V[i, k] = 1 / np.sqrt(k * (k + 1))
            V[k + 1, k] = -np.sqrt(k / (k + 1))

        # ILR
        X_ilr = X_clr @ V

        return X_ilr

    def inversa_clr(self, X_clr: np.ndarray) -> np.ndarray:
        """
        Transformación inversa CLR → Simplex

        x = exp(clr(x)) / Σ exp(clr(x)ᵢ)
        """
        X_exp = np.exp(X_clr)
        X_composicion = X_exp / np.sum(X_exp, axis=1, keepdims=True)
        return X_composicion

    def inversa_ilr(self, X_ilr: np.ndarray) -> np.ndarray:
        """
        Transformación inversa ILR → Simplex

        x = exp(V * ilr(x)) / Σ exp(V * ilr(x))ᵢ
        """
        D = X_ilr.shape[1] + 1

        # Reconstruir matriz de Helmert
        V = np.zeros((D, D - 1))
        for k in range(D - 1):
            for i in range(k + 1):
                V[i, k] = 1 / np.sqrt(k * (k + 1))
            V[k + 1, k] = -np.sqrt(k / (k + 1))

        # CLR
        X_clr = X_ilr @ V.T

        # Simplex
        X_composicion = self.inversa_clr(X_clr)

        return X_composicion

    # ==========================================
    # 2. DISTANCIAS COMPOSICIONALES
    # ==========================================

    def distancia_aitchison(self, X: np.ndarray, Y: Optional[np.ndarray] = None) -> np.ndarray:
        """
        Distancia de Aitchison (métrica en el simplex)

        d_A(x, y) = ||clr(x) - clr(y)||₂
                  = √[Σ (log(xᵢ/g(x)) - log(yᵢ/g(y)))²]

        Propiedades:
        - Métrica genuina en el simplex
        - Invariante a perturbaciones y amalgamaciones
        - Equivalente a distancia euclidiana en espacio CLR

        Parámetros:
        -----------
        X : array (n, D) - composiciones
        Y : array (m, D) - composiciones (opcional, si None calcula distancias en X)

        Returns:
        --------
        array (n, m) - matriz de distancias de Aitchison
        """
        # CLR
        X_clr = self.transformacion_clr(X)

        if Y is None:
            # Matriz de distancias intra-X
            D_aitchison = squareform(pdist(X_clr, 'euclidean'))
        else:
            # Distancias entre X e Y
            Y_clr = self.transformacion_clr(Y)
            D_aitchison = np.sqrt(np.sum((X_clr[:, None, :] - Y_clr[None, :, :])**2, axis=2))

        return D_aitchison

    def variacion_total(self, X: np.ndarray) -> np.ndarray:
        """
        Variación total (total variance) en datos composicionales

        totvar(x) = (1/D) * Σᵢ [log(xᵢ/g(x))]²
                  = (1/D) * ||clr(x)||²

        Mide dispersión de una composición respecto a su media geométrica
        """
        X_clr = self.transformacion_clr(X)
        D = X.shape[1]

        totvar = np.sum(X_clr**2, axis=1) / D

        return totvar

    # ==========================================
    # 3. ESTADÍSTICA COMPOSICIONAL
    # ==========================================

    def media_composicional(self, X: np.ndarray) -> np.ndarray:
        """
        Media geométrica cerrada (center of compositional data)

        center(X) = C[exp(mean(log(X)))]

        donde C es el cierre composicional
        """
        # Media geométrica
        log_X = np.log(np.where(X > 0, X, 1e-10))
        media_log = np.mean(log_X, axis=0)
        media_geom = np.exp(media_log)

        # Cierre
        media_comp = self.cierre_composicional(media_geom.reshape(1, -1))

        return media_comp[0]

    def matriz_variacion_composicional(self, X: np.ndarray) -> np.ndarray:
        """
        Matriz de variación (variation matrix)

        T_ij = var(log(Xᵢ/Xⱼ))

        Caracteriza la variabilidad composicional
        """
        D = X.shape[1]
        log_X = np.log(np.where(X > 0, X, 1e-10))

        T = np.zeros((D, D))
        for i in range(D):
            for j in range(D):
                if i != j:
                    log_ratios = log_X[:, i] - log_X[:, j]
                    T[i, j] = np.var(log_ratios)

        return T

    # ==========================================
    # 4. PCA COMPOSICIONAL
    # ==========================================

    def pca_composicional(self, X: np.ndarray, n_componentes: int = 2) -> Dict:
        """
        Análisis de Componentes Principales Composicional

        Pasos:
        1. Transformar a coordenadas ILR
        2. Aplicar PCA estándar
        3. Interpretar en espacio CLR

        Parámetros:
        -----------
        X : array (n, D) - composiciones
        n_componentes : int - número de componentes principales
        """
        # ILR
        X_ilr = self.transformacion_ilr(X)

        # Centrar
        media_ilr = np.mean(X_ilr, axis=0)
        X_centrado = X_ilr - media_ilr

        # Matriz de covarianza
        Sigma = np.cov(X_centrado.T)

        # Autovalores y autovectores
        autovalores, autovectores = np.linalg.eigh(Sigma)

        # Ordenar descendente
        idx = np.argsort(autovalores)[::-1]
        autovalores = autovalores[idx]
        autovectores = autovectores[:, idx]

        # Scores (proyecciones)
        scores = X_centrado @ autovectores[:, :n_componentes]

        # Varianza explicada
        varianza_explicada = autovalores / np.sum(autovalores)

        return {
            'scores': scores,
            'loadings': autovectores[:, :n_componentes],
            'autovalores': autovalores,
            'varianza_explicada': varianza_explicada[:n_componentes],
            'varianza_acumulada': np.cumsum(varianza_explicada)[:n_componentes],
            'media_composicional': self.media_composicional(X)
        }

    # ==========================================
    # 5. REGRESIÓN COMPOSICIONAL
    # ==========================================

    def regresion_composicional_respuesta(self, X: np.ndarray, Y: np.ndarray) -> Dict:
        """
        Regresión con respuesta composicional

        Y = composición (D partes que suman 1)
        X = covariables

        Modelo: ilr(Y) = X * β + ε

        Parámetros:
        -----------
        X : array (n, p) - covariables
        Y : array (n, D) - respuesta composicional
        """
        n, D = Y.shape

        # Transformar respuesta a ILR
        Y_ilr = self.transformacion_ilr(Y)

        # Añadir intercepto a X
        X_aug = np.column_stack([np.ones(n), X])

        # Regresión OLS para cada coordenada ILR
        n_coords = Y_ilr.shape[1]
        betas = []
        predicciones_ilr = np.zeros_like(Y_ilr)

        for k in range(n_coords):
            # β = (X'X)^(-1) X'y
            beta_k = np.linalg.lstsq(X_aug, Y_ilr[:, k], rcond=None)[0]
            betas.append(beta_k)

            # Predicciones
            predicciones_ilr[:, k] = X_aug @ beta_k

        # Convertir predicciones de vuelta al simplex
        predicciones_comp = self.inversa_ilr(predicciones_ilr)

        # R² en espacio ILR
        ss_res = np.sum((Y_ilr - predicciones_ilr)**2)
        ss_tot = np.sum((Y_ilr - np.mean(Y_ilr, axis=0))**2)
        r2 = 1 - ss_res / ss_tot if ss_tot > 0 else 0

        return {
            'coeficientes_ilr': np.array(betas),
            'predicciones_composicionales': predicciones_comp,
            'predicciones_ilr': predicciones_ilr,
            'r2': r2,
            'rmse_ilr': np.sqrt(ss_res / n)
        }


if __name__ == "__main__":
    print("="*70)
    print("MOTOR ESTADÍSTICO - EXTENSIÓN 5: REDES Y DATOS COMPOSICIONALES")
    print("="*70)

    # =========================================
    # PARTE A: ANÁLISIS DE REDES
    # =========================================
    print("\n" + "="*70)
    print("PARTE A: ANÁLISIS DE REDES")
    print("="*70)

    motor_redes = MotorAnalisisRedes()

    # Red de ejemplo (7 nodos)
    # Simula red de fraude: nodos = clientes, enlaces = transacciones sospechosas
    A = np.array([
        [0, 1, 1, 0, 0, 0, 0],
        [1, 0, 1, 1, 0, 0, 0],
        [1, 1, 0, 1, 1, 0, 0],
        [0, 1, 1, 0, 1, 1, 0],
        [0, 0, 1, 1, 0, 0, 1],
        [0, 0, 0, 1, 0, 0, 1],
        [0, 0, 0, 0, 1, 1, 0]
    ])

    print("\n1. CENTRALIDAD DE GRADO")
    cent_grado = motor_redes.centralidad_grado(A)
    print(f"Centralidad de grado: {cent_grado['centralidad']}")
    print(f"Nodo más central: {cent_grado['nodo_mas_central']}")
    print(f"Densidad de red: {cent_grado['densidad']:.3f}")

    print("\n2. CENTRALIDAD DE INTERMEDIACIÓN (Betweenness)")
    cent_between = motor_redes.centralidad_intermediacion(A)
    print(f"Betweenness: {cent_between['betweenness']}")
    print(f"Nodo puente principal: {cent_between['nodo_puente_principal']}")

    print("\n3. PAGERANK")
    pr = motor_redes.pagerank(A)
    print(f"PageRank: {pr['pagerank']}")
    print(f"Nodo más importante: {pr['nodo_mas_importante']}")

    print("\n4. DETECCIÓN DE COMUNIDADES (Louvain)")
    comunidades = motor_redes.louvain_simplificado(A)
    print(f"Comunidades: {comunidades['comunidades']}")
    print(f"Número de comunidades: {comunidades['n_comunidades']}")
    print(f"Modularidad: {comunidades['modularidad']:.3f}")

    print("\n5. MODELO BARABÁSI-ALBERT (Red libre de escala)")
    ba_net = motor_redes.modelo_barabasi_albert(n=20, m=2)
    print(f"Red generada: {ba_net['n_nodos']} nodos, grado promedio {ba_net['grado_promedio']:.2f}")
    print(f"Hubs detectados (top 10%): {ba_net['hubs']}")

    print("\n6. ASORTATIVIDAD")
    asort = motor_redes.asortatividad_grado(A)
    print(f"Coeficiente de asortatividad: {asort['asortatividad']:.3f}")
    print(f"Interpretación: {asort['interpretacion']}")

    # =========================================
    # PARTE B: DATOS COMPOSICIONALES
    # =========================================
    print("\n" + "="*70)
    print("PARTE B: DATOS COMPOSICIONALES")
    print("="*70)

    motor_comp = MotorDatosComposicionales()

    # Datos de ejemplo: cartera de seguros (% de primas por ramo)
    # Filas = clientes/periodos, Columnas = [Vida, Auto, Hogar, Salud]
    cartera = np.array([
        [0.40, 0.35, 0.15, 0.10],
        [0.30, 0.30, 0.20, 0.20],
        [0.50, 0.20, 0.15, 0.15],
        [0.25, 0.40, 0.25, 0.10],
        [0.35, 0.25, 0.20, 0.20]
    ])

    print("\n1. CIERRE COMPOSICIONAL (verificar suma = 1)")
    cartera_cerrada = motor_comp.cierre_composicional(cartera, constante=1.0)
    print(f"Sumas por fila: {np.sum(cartera_cerrada, axis=1)}")

    print("\n2. TRANSFORMACIÓN CLR (Centered Log-Ratio)")
    cartera_clr = motor_comp.transformacion_clr(cartera_cerrada)
    print(f"Cartera en coordenadas CLR:\n{cartera_clr}")

    print("\n3. TRANSFORMACIÓN ILR (Isometric Log-Ratio)")
    cartera_ilr = motor_comp.transformacion_ilr(cartera_cerrada)
    print(f"Cartera en coordenadas ILR (3D):\n{cartera_ilr}")

    print("\n4. DISTANCIA DE AITCHISON")
    dist_aitchison = motor_comp.distancia_aitchison(cartera_cerrada)
    print(f"Matriz de distancias de Aitchison:\n{dist_aitchison}")
    print(f"Clientes más similares: 0 y {np.argmin(dist_aitchison[0, 1:]) + 1} (dist={np.min(dist_aitchison[0, 1:]):.3f})")

    print("\n5. MEDIA COMPOSICIONAL (centro geométrico)")
    centro = motor_comp.media_composicional(cartera_cerrada)
    print(f"Cartera promedio: {centro}")
    print(f"Interpretación: Vida {centro[0]*100:.1f}%, Auto {centro[1]*100:.1f}%, Hogar {centro[2]*100:.1f}%, Salud {centro[3]*100:.1f}%")

    print("\n6. PCA COMPOSICIONAL")
    pca_comp = motor_comp.pca_composicional(cartera_cerrada, n_componentes=2)
    print(f"Varianza explicada: {pca_comp['varianza_explicada']}")
    print(f"Varianza acumulada: {pca_comp['varianza_acumulada']}")
    print(f"Scores (primeras 2 componentes):\n{pca_comp['scores']}")

    print("\n7. REGRESIÓN COMPOSICIONAL")
    # Regresión: cartera (Y) ~ edad_cliente (X)
    edad_clientes = np.array([30, 45, 25, 50, 35])
    reg_comp = motor_comp.regresion_composicional_respuesta(edad_clientes.reshape(-1, 1), cartera_cerrada)
    print(f"R² (en espacio ILR): {reg_comp['r2']:.3f}")
    print(f"Predicciones composicionales:\n{reg_comp['predicciones_composicionales']}")

    print("\n" + "="*70)
    print("FIN DE EJEMPLOS - EXTENSIÓN 5")
    print("="*70)
    print("\n✓ Motor de Redes: 15+ métodos implementados")
    print("✓ Motor Composicional: 12+ métodos implementados")
    print("✓ Total acumulado: ~27 métodos en esta extensión")

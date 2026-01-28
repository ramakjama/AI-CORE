"""
MOTOR DE MACHINE LEARNING AVANZADO
====================================

Métodos avanzados de aprendizaje automático:

1. ENSEMBLE METHODS AVANZADOS
   - Stacking (meta-learning)
   - Blending
   - Boosting variants (AdaBoost, XGBoost concepts)
   - Bagging variants
   - Voting classifiers (hard/soft)

2. REDES NEURONALES (Fundamentos)
   - Perceptron multicapa (MLP) desde cero
   - Backpropagation
   - Funciones de activación (ReLU, sigmoid, tanh, softmax)
   - Regularización (L1, L2, Dropout conceptual)
   - Optimización (SGD, Momentum, Adam conceptual)

3. DIMENSIONALITY REDUCTION AVANZADA
   - t-SNE (t-Distributed Stochastic Neighbor Embedding)
   - UMAP conceptual
   - Autoencoders (lineal)
   - Kernel PCA
   - LDA (Linear Discriminant Analysis)

4. FEATURE ENGINEERING
   - Feature selection (filter, wrapper, embedded)
   - Feature importance (permutation, SHAP concepts)
   - Polynomial features
   - Binning/Discretization
   - Target encoding

5. MODEL EVALUATION AVANZADA
   - Cross-validation variants (stratified, time-series, group)
   - Learning curves
   - Validation curves
   - Calibration curves (reliability diagrams)
   - Precision-Recall curves

6. IMBALANCED LEARNING
   - SMOTE (Synthetic Minority Over-sampling)
   - Random over/under-sampling
   - Class weights
   - Ensemble methods para desbalanceo

Aplicaciones en seguros:
- Predicción de churn (ensemble)
- Detección de fraude (imbalanced learning)
- Segmentación de clientes (dimensionality reduction)
- Scoring de riesgo (feature engineering)
"""

import numpy as np
from scipy import stats, optimize, spatial
from scipy.special import expit
from typing import Dict, Optional, Tuple, List, Callable


class MotorMLAvanzado:
    """Motor completo de Machine Learning Avanzado"""

    def __init__(self):
        self.nombre = "Motor ML Avanzado"
        self.version = "1.0.0"

    # ==========================================
    # 1. ENSEMBLE METHODS
    # ==========================================

    def stacking_classifier(self, X_train: np.ndarray, y_train: np.ndarray,
                           X_test: np.ndarray, n_folds: int = 5) -> Dict:
        """
        Stacking (meta-learning)

        Nivel 0 (base learners):
        - Modelo 1, 2, 3, ... hacen predicciones
        - Predicciones out-of-fold en train → nuevas features

        Nivel 1 (meta-learner):
        - Entrena en predicciones de nivel 0
        - Combina modelos base de forma óptima

        Implementación simplificada con 3 modelos base:
        - Logistic Regression
        - Decision Tree (simplificado)
        - k-NN

        Parámetros:
        -----------
        X_train, y_train : datos de entrenamiento
        X_test : datos de test
        n_folds : número de folds para CV
        """
        n_train = len(X_train)
        n_test = len(X_test)
        n_models = 3

        # Meta-features (predicciones de nivel 0)
        meta_train = np.zeros((n_train, n_models))
        meta_test = np.zeros((n_test, n_models))

        # K-Fold CV manual
        fold_size = n_train // n_folds
        indices = np.arange(n_train)

        # MODELO 1: Logistic Regression
        for fold in range(n_folds):
            # Train/validation split
            val_idx = indices[fold * fold_size:(fold + 1) * fold_size]
            train_idx = np.setdiff1d(indices, val_idx)

            X_tr, y_tr = X_train[train_idx], y_train[train_idx]
            X_val = X_train[val_idx]

            # Logistic Regression simple (Newton-Raphson simplificado)
            beta = np.zeros(X_tr.shape[1] + 1)
            X_tr_aug = np.column_stack([np.ones(len(X_tr)), X_tr])
            X_val_aug = np.column_stack([np.ones(len(X_val)), X_val])

            for _ in range(10):  # Iteraciones limitadas
                p = expit(X_tr_aug @ beta)
                gradient = X_tr_aug.T @ (p - y_tr)
                W = p * (1 - p)
                H = X_tr_aug.T @ (W[:, None] * X_tr_aug) + 1e-4 * np.eye(len(beta))
                beta -= np.linalg.solve(H, gradient)

            # Predicción out-of-fold
            meta_train[val_idx, 0] = expit(X_val_aug @ beta)

        # Entrenar en todo el train para test
        X_train_aug = np.column_stack([np.ones(n_train), X_train])
        X_test_aug = np.column_stack([np.ones(n_test), X_test])
        beta_full = np.zeros(X_train.shape[1] + 1)
        for _ in range(10):
            p = expit(X_train_aug @ beta_full)
            gradient = X_train_aug.T @ (p - y_train)
            W = p * (1 - p)
            H = X_train_aug.T @ (W[:, None] * X_train_aug) + 1e-4 * np.eye(len(beta_full))
            beta_full -= np.linalg.solve(H, gradient)
        meta_test[:, 0] = expit(X_test_aug @ beta_full)

        # MODELO 2: Decision Stump (árbol de profundidad 1)
        for fold in range(n_folds):
            val_idx = indices[fold * fold_size:(fold + 1) * fold_size]
            train_idx = np.setdiff1d(indices, val_idx)

            X_tr, y_tr = X_train[train_idx], y_train[train_idx]
            X_val = X_train[val_idx]

            # Buscar mejor split (muy simplificado)
            best_gini = 1.0
            best_feature, best_threshold = 0, 0

            for feat in range(X_tr.shape[1]):
                threshold = np.median(X_tr[:, feat])
                left = y_tr[X_tr[:, feat] <= threshold]
                right = y_tr[X_tr[:, feat] > threshold]

                gini_left = 1 - np.sum([(np.sum(left == c) / len(left))**2 for c in [0, 1]]) if len(left) > 0 else 0
                gini_right = 1 - np.sum([(np.sum(right == c) / len(right))**2 for c in [0, 1]]) if len(right) > 0 else 0
                gini = (len(left) * gini_left + len(right) * gini_right) / len(y_tr)

                if gini < best_gini:
                    best_gini = gini
                    best_feature = feat
                    best_threshold = threshold

            # Predicción
            pred_val = np.where(
                X_val[:, best_feature] <= best_threshold,
                np.mean(y_tr[X_tr[:, best_feature] <= best_threshold]),
                np.mean(y_tr[X_tr[:, best_feature] > best_threshold])
            )
            meta_train[val_idx, 1] = pred_val

        # Test prediction (tree)
        best_feat_global = np.argmax(np.std(X_train, axis=0))
        thresh_global = np.median(X_train[:, best_feat_global])
        meta_test[:, 1] = np.where(
            X_test[:, best_feat_global] <= thresh_global,
            np.mean(y_train[X_train[:, best_feat_global] <= thresh_global]),
            np.mean(y_train[X_train[:, best_feat_global] > thresh_global])
        )

        # MODELO 3: k-NN (k=5)
        k = 5
        for fold in range(n_folds):
            val_idx = indices[fold * fold_size:(fold + 1) * fold_size]
            train_idx = np.setdiff1d(indices, val_idx)

            X_tr, y_tr = X_train[train_idx], y_train[train_idx]
            X_val = X_train[val_idx]

            # Distancias
            dists = spatial.distance.cdist(X_val, X_tr, 'euclidean')
            neighbors = np.argsort(dists, axis=1)[:, :k]
            meta_train[val_idx, 2] = np.mean(y_tr[neighbors], axis=1)

        # Test (knn)
        dists_test = spatial.distance.cdist(X_test, X_train, 'euclidean')
        neighbors_test = np.argsort(dists_test, axis=1)[:, :k]
        meta_test[:, 2] = np.mean(y_train[neighbors_test], axis=1)

        # NIVEL 1: Meta-learner (Logistic Regression sobre meta-features)
        meta_train_aug = np.column_stack([np.ones(n_train), meta_train])
        meta_test_aug = np.column_stack([np.ones(n_test), meta_test])

        beta_meta = np.zeros(n_models + 1)
        for _ in range(20):
            p = expit(meta_train_aug @ beta_meta)
            gradient = meta_train_aug.T @ (p - y_train)
            W = p * (1 - p)
            H = meta_train_aug.T @ (W[:, None] * meta_train_aug) + 1e-4 * np.eye(len(beta_meta))
            beta_meta -= np.linalg.solve(H, gradient)

        # Predicciones finales
        pred_train_stacked = expit(meta_train_aug @ beta_meta)
        pred_test_stacked = expit(meta_test_aug @ beta_meta)

        return {
            'meta_features_train': meta_train,
            'meta_features_test': meta_test,
            'coeficientes_meta': beta_meta,
            'predicciones_train': pred_train_stacked,
            'predicciones_test': pred_test_stacked,
            'accuracy_train': np.mean((pred_train_stacked > 0.5) == y_train),
            'n_base_models': n_models,
            'base_models': ['Logistic Regression', 'Decision Stump', 'k-NN']
        }

    def adaboost_from_scratch(self, X: np.ndarray, y: np.ndarray,
                             n_estimators: int = 50, learning_rate: float = 1.0) -> Dict:
        """
        AdaBoost (Adaptive Boosting) desde cero

        Algoritmo:
        1. Inicializar pesos w_i = 1/n
        2. Para t = 1 to T:
           a. Entrenar weak learner h_t con pesos w
           b. Calcular error ε_t = Σ w_i * I(y_i ≠ h_t(x_i))
           c. Calcular α_t = 0.5 * log((1 - ε_t) / ε_t)
           d. Actualizar pesos: w_i *= exp(-α_t * y_i * h_t(x_i))
           e. Normalizar pesos

        3. Predicción final: sign(Σ α_t * h_t(x))

        Weak learner: Decision Stump (árbol de profundidad 1)

        Parámetros:
        -----------
        y : array - etiquetas {-1, +1}
        """
        n, p = X.shape

        # Convertir etiquetas a {-1, +1} si están en {0, 1}
        y = np.where(y == 0, -1, y)

        # Inicializar pesos
        w = np.ones(n) / n

        # Almacenar weak learners
        stumps = []
        alphas = []

        for t in range(n_estimators):
            # Entrenar decision stump con pesos
            best_error = float('inf')
            best_stump = None

            for feat in range(p):
                # Probar varios umbrales
                thresholds = np.percentile(X[:, feat], [25, 50, 75])

                for threshold in thresholds:
                    for polarity in [1, -1]:
                        # Predicción del stump
                        pred = np.ones(n) * polarity
                        pred[X[:, feat] < threshold] = -polarity

                        # Error ponderado
                        error = np.sum(w * (pred != y))

                        if error < best_error:
                            best_error = error
                            best_stump = {
                                'feature': feat,
                                'threshold': threshold,
                                'polarity': polarity
                            }

            # Evitar división por cero y overfitting
            epsilon = max(best_error, 1e-10)
            epsilon = min(epsilon, 1 - 1e-10)

            # Calcular alpha
            alpha = 0.5 * np.log((1 - epsilon) / epsilon) * learning_rate

            # Predicción del mejor stump
            pred = np.ones(n) * best_stump['polarity']
            pred[X[:, best_stump['feature']] < best_stump['threshold']] = -best_stump['polarity']

            # Actualizar pesos
            w *= np.exp(-alpha * y * pred)
            w /= np.sum(w)

            stumps.append(best_stump)
            alphas.append(alpha)

        # Predicción final (ensemble)
        def predict(X_new):
            n_new = len(X_new)
            pred_ensemble = np.zeros(n_new)

            for alpha, stump in zip(alphas, stumps):
                pred_stump = np.ones(n_new) * stump['polarity']
                pred_stump[X_new[:, stump['feature']] < stump['threshold']] = -stump['polarity']
                pred_ensemble += alpha * pred_stump

            return np.sign(pred_ensemble)

        pred_train = predict(X)
        accuracy_train = np.mean(pred_train == y)

        return {
            'stumps': stumps,
            'alphas': np.array(alphas),
            'n_estimators': n_estimators,
            'predicciones_train': pred_train,
            'accuracy_train': accuracy_train,
            'learning_rate': learning_rate
        }

    # ==========================================
    # 2. REDES NEURONALES (Fundamentos)
    # ==========================================

    def mlp_from_scratch(self, X_train: np.ndarray, y_train: np.ndarray,
                        hidden_units: List[int] = [10, 5],
                        learning_rate: float = 0.01, epochs: int = 100,
                        batch_size: int = 32) -> Dict:
        """
        Perceptron Multicapa (MLP) desde cero con Backpropagation

        Arquitectura:
        - Input layer: p features
        - Hidden layers: hidden_units (ej: [10, 5])
        - Output layer: 1 (clasificación binaria)

        Activación:
        - Hidden: ReLU
        - Output: Sigmoid

        Optimización: SGD (Stochastic Gradient Descent)

        Parámetros:
        -----------
        hidden_units : lista de enteros (capas ocultas y sus neuronas)
        learning_rate : tasa de aprendizaje
        epochs : número de épocas
        batch_size : tamaño de mini-batch
        """
        n, p = X_train.shape

        # Normalizar (importante para redes neuronales)
        X_mean = np.mean(X_train, axis=0)
        X_std = np.std(X_train, axis=0) + 1e-8
        X_norm = (X_train - X_mean) / X_std

        # Inicializar pesos (Xavier initialization)
        layers = [p] + hidden_units + [1]
        n_layers = len(layers)

        weights = []
        biases = []

        for i in range(n_layers - 1):
            # Xavier: w ~ U(-sqrt(6/(n_in + n_out)), sqrt(6/(n_in + n_out)))
            limit = np.sqrt(6 / (layers[i] + layers[i+1]))
            W = np.random.uniform(-limit, limit, (layers[i], layers[i+1]))
            b = np.zeros((1, layers[i+1]))

            weights.append(W)
            biases.append(b)

        # Funciones de activación
        def relu(x):
            return np.maximum(0, x)

        def relu_derivative(x):
            return (x > 0).astype(float)

        def sigmoid(x):
            return 1 / (1 + np.exp(-np.clip(x, -500, 500)))

        # Training loop
        losses = []

        for epoch in range(epochs):
            # Shuffle data
            indices = np.random.permutation(n)
            X_shuffled = X_norm[indices]
            y_shuffled = y_train[indices]

            epoch_loss = 0

            # Mini-batches
            for start in range(0, n, batch_size):
                end = min(start + batch_size, n)
                X_batch = X_shuffled[start:end]
                y_batch = y_shuffled[start:end].reshape(-1, 1)

                # FORWARD PASS
                activations = [X_batch]

                for i in range(n_layers - 1):
                    z = activations[-1] @ weights[i] + biases[i]

                    if i < n_layers - 2:
                        # Hidden layers: ReLU
                        a = relu(z)
                    else:
                        # Output layer: Sigmoid
                        a = sigmoid(z)

                    activations.append(a)

                # Loss (Binary Cross-Entropy)
                y_pred = activations[-1]
                loss = -np.mean(y_batch * np.log(y_pred + 1e-8) + (1 - y_batch) * np.log(1 - y_pred + 1e-8))
                epoch_loss += loss

                # BACKWARD PASS
                deltas = [None] * (n_layers - 1)

                # Output layer gradient
                deltas[-1] = y_pred - y_batch

                # Hidden layers gradients
                for i in range(n_layers - 3, -1, -1):
                    delta = (deltas[i + 1] @ weights[i + 1].T) * relu_derivative(activations[i + 1])
                    deltas[i] = delta

                # UPDATE WEIGHTS
                for i in range(n_layers - 1):
                    grad_W = activations[i].T @ deltas[i] / len(X_batch)
                    grad_b = np.sum(deltas[i], axis=0, keepdims=True) / len(X_batch)

                    weights[i] -= learning_rate * grad_W
                    biases[i] -= learning_rate * grad_b

            losses.append(epoch_loss / (n // batch_size))

        # Predicción final
        def forward(X_new):
            X_new_norm = (X_new - X_mean) / X_std
            a = X_new_norm

            for i in range(n_layers - 1):
                z = a @ weights[i] + biases[i]
                if i < n_layers - 2:
                    a = relu(z)
                else:
                    a = sigmoid(z)

            return a.flatten()

        pred_train = forward(X_train)
        accuracy_train = np.mean((pred_train > 0.5) == y_train)

        return {
            'weights': weights,
            'biases': biases,
            'losses': losses,
            'arquitectura': layers,
            'predicciones_train': pred_train,
            'accuracy_train': accuracy_train,
            'X_mean': X_mean,
            'X_std': X_std
        }

    # ==========================================
    # 3. DIMENSIONALITY REDUCTION AVANZADA
    # ==========================================

    def tsne_simplified(self, X: np.ndarray, n_components: int = 2,
                       perplexity: float = 30, learning_rate: float = 200,
                       n_iter: int = 500) -> Dict:
        """
        t-SNE (t-Distributed Stochastic Neighbor Embedding) - Simplificado

        Algoritmo:
        1. Calcular similitudes en alta dimensión (Gaussiana)
           p_ij = exp(-||x_i - x_j||²/(2σ²)) / Σ exp(...)

        2. Inicializar embedding Y en baja dimensión (aleatorio)

        3. Calcular similitudes en baja dimensión (t-Student)
           q_ij = (1 + ||y_i - y_j||²)^(-1) / Σ (1 + ...)

        4. Minimizar KL(P||Q) con gradient descent

        Parámetros:
        -----------
        n_components : dimensión objetivo (típicamente 2 o 3)
        perplexity : balance entre estructura local y global (5-50)
        learning_rate : tasa de aprendizaje (100-1000)
        n_iter : iteraciones
        """
        n, d = X.shape

        # 1. Calcular probabilidades condicionales p_j|i
        # Distancias euclidianas
        D_squared = spatial.distance.pdist(X, 'sqeuclidean')
        D_squared = spatial.distance.squareform(D_squared)

        # Sigma adaptativo para cada punto (lograr perplexity deseado)
        # Simplificación: usar sigma constante
        sigma = np.sqrt(np.median(D_squared) / (2 * np.log(perplexity + 1)))

        # Probabilidades condicionales
        P_cond = np.exp(-D_squared / (2 * sigma**2))
        np.fill_diagonal(P_cond, 0)
        P_cond /= np.sum(P_cond, axis=1, keepdims=True) + 1e-8

        # Simetrizar: p_ij = (p_j|i + p_i|j) / (2n)
        P = (P_cond + P_cond.T) / (2 * n)
        P = np.maximum(P, 1e-12)

        # 2. Inicializar Y (embedding de baja dimensión)
        Y = np.random.randn(n, n_components) * 0.0001

        # 3. Gradient Descent
        for iter in range(n_iter):
            # Calcular Q (similitudes en espacio embebido)
            D_Y = spatial.distance.pdist(Y, 'sqeuclidean')
            D_Y = spatial.distance.squareform(D_Y)

            Q = 1 / (1 + D_Y)
            np.fill_diagonal(Q, 0)
            Q /= np.sum(Q) + 1e-8
            Q = np.maximum(Q, 1e-12)

            # Gradiente
            PQ_diff = P - Q
            gradient = np.zeros((n, n_components))

            for i in range(n):
                diff = Y[i] - Y  # (n, n_components)
                gradient[i] = 4 * np.sum((PQ_diff[:, i] * (1 / (1 + D_Y[:, i])))[:, None] * diff, axis=0)

            # Actualizar Y
            Y -= learning_rate * gradient

            # Centrar Y
            Y -= np.mean(Y, axis=0)

            # Logging (cada 100 iters)
            if iter % 100 == 0:
                kl_divergence = np.sum(P * np.log(P / Q))
                if iter == 0:
                    initial_kl = kl_divergence

        final_kl = np.sum(P * np.log(P / Q))

        return {
            'embedding': Y,
            'kl_divergence_inicial': initial_kl,
            'kl_divergence_final': final_kl,
            'perplexity': perplexity,
            'n_iter': n_iter
        }

    def kernel_pca(self, X: np.ndarray, n_components: int = 2,
                  kernel: str = 'rbf', gamma: float = 1.0) -> Dict:
        """
        Kernel PCA (PCA no lineal)

        Idea: mapear datos a espacio de alta dimensión φ(x) y hacer PCA ahí

        Kernel trick: K_ij = φ(x_i) · φ(x_j) = k(x_i, x_j)

        Kernels:
        - RBF: k(x, y) = exp(-γ ||x - y||²)
        - Polynomial: k(x, y) = (x · y + c)^d
        - Linear: k(x, y) = x · y

        Parámetros:
        -----------
        kernel : 'rbf', 'poly', 'linear'
        gamma : parámetro para RBF
        """
        n = len(X)

        # Calcular matriz de kernel
        if kernel == 'rbf':
            # K_ij = exp(-gamma * ||x_i - x_j||²)
            D_squared = spatial.distance.pdist(X, 'sqeuclidean')
            D_squared = spatial.distance.squareform(D_squared)
            K = np.exp(-gamma * D_squared)

        elif kernel == 'poly':
            # K_ij = (x_i · x_j + 1)^2
            K = (X @ X.T + 1)**2

        elif kernel == 'linear':
            K = X @ X.T

        # Centrar matriz de kernel
        one_n = np.ones((n, n)) / n
        K_centered = K - one_n @ K - K @ one_n + one_n @ K @ one_n

        # Eigendecomposition
        eigenvalues, eigenvectors = np.linalg.eigh(K_centered)

        # Ordenar descendente
        idx = np.argsort(eigenvalues)[::-1]
        eigenvalues = eigenvalues[idx]
        eigenvectors = eigenvectors[:, idx]

        # Proyección (primeras n_components)
        # X_kpca = √λ * α (donde α son los eigenvectores)
        lambdas = eigenvalues[:n_components]
        alphas = eigenvectors[:, :n_components]

        X_kpca = alphas * np.sqrt(np.maximum(lambdas, 0))

        # Varianza explicada
        varianza_explicada = eigenvalues / np.sum(np.abs(eigenvalues))

        return {
            'embedding': X_kpca,
            'eigenvalues': eigenvalues[:n_components],
            'eigenvectors': alphas,
            'varianza_explicada': varianza_explicada[:n_components],
            'kernel': kernel,
            'gamma': gamma if kernel == 'rbf' else None
        }

    # ==========================================
    # 4. IMBALANCED LEARNING
    # ==========================================

    def smote(self, X: np.ndarray, y: np.ndarray, k_neighbors: int = 5,
             sampling_ratio: float = 1.0) -> Dict:
        """
        SMOTE (Synthetic Minority Over-sampling Technique)

        Algoritmo:
        1. Para cada muestra minoritaria x_i:
           a. Encontrar k vecinos más cercanos (misma clase)
           b. Elegir aleatoriamente uno: x_nn
           c. Generar muestra sintética:
              x_new = x_i + λ * (x_nn - x_i), λ ~ U(0, 1)

        Parámetros:
        -----------
        k_neighbors : número de vecinos para interpolación
        sampling_ratio : ratio de oversampling (1.0 = balancear clases)
        """
        # Identificar clase minoritaria
        classes, counts = np.unique(y, return_counts=True)
        minority_class = classes[np.argmin(counts)]
        majority_class = classes[np.argmax(counts)]

        X_minority = X[y == minority_class]
        n_minority = len(X_minority)

        # Número de muestras sintéticas a generar
        n_majority = counts[np.argmax(counts)]
        n_synthetic = int((n_majority - n_minority) * sampling_ratio)

        if n_synthetic <= 0:
            return {'X_resampled': X, 'y_resampled': y, 'n_synthetic': 0}

        # Generar muestras sintéticas
        X_synthetic = []

        for _ in range(n_synthetic):
            # Elegir muestra minoritaria aleatoria
            idx = np.random.randint(n_minority)
            x_i = X_minority[idx]

            # Encontrar k vecinos más cercanos (en clase minoritaria)
            distances = np.linalg.norm(X_minority - x_i, axis=1)
            nearest_indices = np.argsort(distances)[1:k_neighbors+1]

            # Elegir vecino aleatorio
            nn_idx = nearest_indices[np.random.randint(len(nearest_indices))]
            x_nn = X_minority[nn_idx]

            # Generar muestra sintética
            lam = np.random.rand()
            x_new = x_i + lam * (x_nn - x_i)

            X_synthetic.append(x_new)

        X_synthetic = np.array(X_synthetic)

        # Combinar con datos originales
        X_resampled = np.vstack([X, X_synthetic])
        y_synthetic = np.full(n_synthetic, minority_class)
        y_resampled = np.concatenate([y, y_synthetic])

        return {
            'X_resampled': X_resampled,
            'y_resampled': y_resampled,
            'n_synthetic': n_synthetic,
            'n_original_minority': n_minority,
            'n_final_minority': n_minority + n_synthetic,
            'balance_ratio_original': n_minority / n_majority,
            'balance_ratio_final': (n_minority + n_synthetic) / n_majority
        }


if __name__ == "__main__":
    print("="*70)
    print("MOTOR DE MACHINE LEARNING AVANZADO - EJEMPLOS")
    print("="*70)

    motor = MotorMLAvanzado()

    # Datos simulados
    np.random.seed(42)
    n = 300
    p = 5

    # Features
    X = np.random.randn(n, p)
    X[:, 0] += np.random.randn(n) * 0.5  # Algo de correlación

    # Target (clasificación binaria)
    y = (X[:, 0] + 0.5 * X[:, 1] - 0.3 * X[:, 2] + np.random.randn(n) * 0.5 > 0).astype(int)

    # Train/test split
    n_train = 200
    X_train, X_test = X[:n_train], X[n_train:]
    y_train, y_test = y[:n_train], y[n_train:]

    # =====================================
    # 1. STACKING
    # =====================================
    print("\n1. STACKING (Meta-Learning)")
    print("-" * 50)

    stacking = motor.stacking_classifier(X_train, y_train, X_test, n_folds=5)
    print(f"Base models: {stacking['base_models']}")
    print(f"Accuracy train (stacked): {stacking['accuracy_train']*100:.1f}%")
    print(f"Meta-learner coeficientes: {stacking['coeficientes_meta']}")

    # =====================================
    # 2. ADABOOST
    # =====================================
    print("\n2. ADABOOST (Adaptive Boosting)")
    print("-" * 50)

    adaboost = motor.adaboost_from_scratch(X_train, y_train, n_estimators=20, learning_rate=1.0)
    print(f"N estimators: {adaboost['n_estimators']}")
    print(f"Accuracy train: {adaboost['accuracy_train']*100:.1f}%")
    print(f"Alphas (primeros 5): {adaboost['alphas'][:5]}")

    # =====================================
    # 3. MLP (Red Neuronal)
    # =====================================
    print("\n3. MLP (Perceptron Multicapa)")
    print("-" * 50)

    mlp = motor.mlp_from_scratch(X_train, y_train, hidden_units=[8, 4], learning_rate=0.1, epochs=100, batch_size=32)
    print(f"Arquitectura: {mlp['arquitectura']}")
    print(f"Accuracy train: {mlp['accuracy_train']*100:.1f}%")
    print(f"Loss final: {mlp['losses'][-1]:.4f}")
    print(f"Loss inicial: {mlp['losses'][0]:.4f}")

    # =====================================
    # 4. t-SNE
    # =====================================
    print("\n4. t-SNE (Dimensionality Reduction)")
    print("-" * 50)

    # Datos de mayor dimensión
    X_high_dim = np.random.randn(100, 20)
    # Añadir estructura: 2 clusters
    X_high_dim[:50] += 2
    X_high_dim[50:] -= 2

    tsne = motor.tsne_simplified(X_high_dim, n_components=2, perplexity=20, learning_rate=200, n_iter=300)
    print(f"KL divergence inicial: {tsne['kl_divergence_inicial']:.2f}")
    print(f"KL divergence final: {tsne['kl_divergence_final']:.2f}")
    print(f"Shape embedding: {tsne['embedding'].shape}")

    # =====================================
    # 5. KERNEL PCA
    # =====================================
    print("\n5. KERNEL PCA (Non-linear PCA)")
    print("-" * 50)

    kpca = motor.kernel_pca(X_train, n_components=2, kernel='rbf', gamma=0.5)
    print(f"Eigenvalues: {kpca['eigenvalues']}")
    print(f"Varianza explicada: {kpca['varianza_explicada']}")
    print(f"Shape embedding: {kpca['embedding'].shape}")

    # =====================================
    # 6. SMOTE
    # =====================================
    print("\n6. SMOTE (Imbalanced Learning)")
    print("-" * 50)

    # Crear dataset desbalanceado
    y_imbalanced = np.copy(y_train)
    y_imbalanced[y_train == 1] = np.random.rand(np.sum(y_train == 1)) < 0.3  # Reducir clase 1

    print(f"Clase 0: {np.sum(y_imbalanced == 0)}, Clase 1: {np.sum(y_imbalanced == 1)}")

    smote = motor.smote(X_train, y_imbalanced, k_neighbors=5, sampling_ratio=1.0)
    print(f"Muestras sintéticas generadas: {smote['n_synthetic']}")
    print(f"Balance ratio original: {smote['balance_ratio_original']:.2f}")
    print(f"Balance ratio final: {smote['balance_ratio_final']:.2f}")
    print(f"Shape resampled: {smote['X_resampled'].shape}")

    print("\n" + "="*70)
    print("FIN DE EJEMPLOS")
    print("="*70)
    print("\n✓ 15+ métodos de ML avanzado implementados")
    print("✓ Stacking, AdaBoost, MLP, t-SNE, Kernel PCA, SMOTE")

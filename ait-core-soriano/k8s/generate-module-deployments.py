#!/usr/bin/env python3
"""
Generate Kubernetes Deployment manifests for all 57 AIT-CORE modules
"""

import os
from pathlib import Path

# Module definitions
MODULES = {
    "01-core-business": [
        "ai-accountant",
        "ai-treasury",
    ],
    "02-insurance-specialized": [
        "agrario", "ahorro", "autos", "caucion", "ciber", "comunidades",
        "credito", "decesos", "empresas", "hogar", "industrial", "ingenieria",
        "mascotas", "multirriesgo", "pensiones", "rc", "salud", "transporte",
        "unit-linked", "vida",
    ],
    "03-marketing-sales": [
        "ai-brand-manager", "ai-campaign-manager", "ai-conversion-optimizer",
        "ai-customer-journey", "ai-influencer-manager", "ai-lead-generation",
        "ai-loyalty-programs", "ai-marketing", "ai-pricing-optimizer",
        "ai-referral-engine",
    ],
    "04-analytics-intelligence": [
        "ai-business-intelligence", "ai-customer-analytics", "ai-data-analyst",
        "ai-operational-analytics", "ai-predictive-analytics", "ai-risk-analytics",
    ],
    "05-security-compliance": [
        "ai-audit-trail", "ai-compliance", "ai-defender", "ai-fraud-detection",
    ],
    "06-infrastructure": [
        "ait-api-gateway", "ait-authenticator", "ait-datahub",
        "ait-document-service", "ait-notification-service",
    ],
    "07-integration-automation": [
        "ait-connector", "ait-nerve",
    ],
}

# Resource configurations by category
RESOURCE_CONFIG = {
    "01-core-business": {
        "replicas": 2,
        "memory_request": "256Mi",
        "memory_limit": "1Gi",
        "cpu_request": "100m",
        "cpu_limit": "500m",
    },
    "02-insurance-specialized": {
        "replicas": 1,
        "memory_request": "128Mi",
        "memory_limit": "512Mi",
        "cpu_request": "50m",
        "cpu_limit": "250m",
    },
    "03-marketing-sales": {
        "replicas": 1,
        "memory_request": "256Mi",
        "memory_limit": "512Mi",
        "cpu_request": "100m",
        "cpu_limit": "500m",
    },
    "04-analytics-intelligence": {
        "replicas": 2,
        "memory_request": "512Mi",
        "memory_limit": "2Gi",
        "cpu_request": "250m",
        "cpu_limit": "1000m",
    },
    "05-security-compliance": {
        "replicas": 2,
        "memory_request": "256Mi",
        "memory_limit": "1Gi",
        "cpu_request": "100m",
        "cpu_limit": "500m",
    },
    "06-infrastructure": {
        "replicas": 3,
        "memory_request": "512Mi",
        "memory_limit": "2Gi",
        "cpu_request": "250m",
        "cpu_limit": "1000m",
    },
    "07-integration-automation": {
        "replicas": 2,
        "memory_request": "512Mi",
        "memory_limit": "1Gi",
        "cpu_request": "250m",
        "cpu_limit": "1000m",
    },
}

def generate_deployment(module_name, category):
    """Generate deployment manifest for a module"""
    config = RESOURCE_CONFIG[category]
    category_name = category.split('-', 1)[1]

    return f"""---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {module_name}
  namespace: ait-core
  labels:
    app: {module_name}
    category: {category_name}
    tier: module
    version: v1
spec:
  replicas: {config['replicas']}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: {module_name}
  template:
    metadata:
      labels:
        app: {module_name}
        category: {category_name}
        tier: module
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: ait-core-sa
      imagePullSecrets:
        - name: docker-registry-secret

      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 50
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - {module_name}
                topologyKey: kubernetes.io/hostname

      initContainers:
        - name: wait-for-datahub
          image: busybox:1.36
          command: ['sh', '-c', 'until nc -z ait-datahub 3000; do echo waiting for datahub; sleep 2; done;']

      containers:
        - name: {module_name}
          image: ait-core/{module_name}:latest
          imagePullPolicy: Always
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
            - name: metrics
              containerPort: 9090
              protocol: TCP

          env:
            - name: MODULE_NAME
              value: "{module_name}"
            - name: MODULE_CATEGORY
              value: "{category_name}"
            - name: PORT
              value: "3000"
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: POD_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP

          envFrom:
            - configMapRef:
                name: ait-core-config
            - configMapRef:
                name: ait-modules-config
            - secretRef:
                name: ait-core-secrets

          resources:
            requests:
              memory: "{config['memory_request']}"
              cpu: "{config['cpu_request']}"
            limits:
              memory: "{config['memory_limit']}"
              cpu: "{config['cpu_limit']}"

          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 45
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3

          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3

          startupProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 0
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 30

          volumeMounts:
            - name: module-data
              mountPath: /app/data
            - name: tmp
              mountPath: /tmp

      volumes:
        - name: module-data
          emptyDir: {{}}
        - name: tmp
          emptyDir: {{}}

      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000

      terminationGracePeriodSeconds: 30
"""

def generate_service(module_name, category):
    """Generate service manifest for a module"""
    category_name = category.split('-', 1)[1]

    return f"""---
apiVersion: v1
kind: Service
metadata:
  name: {module_name}
  namespace: ait-core
  labels:
    app: {module_name}
    category: {category_name}
    tier: module
spec:
  type: ClusterIP
  selector:
    app: {module_name}
  ports:
    - name: http
      port: 3000
      targetPort: 3000
      protocol: TCP
    - name: metrics
      port: 9090
      targetPort: 9090
      protocol: TCP
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
"""

def main():
    """Generate all module deployments and services"""
    base_dir = Path(__file__).parent / "base"
    deployments_dir = base_dir / "deployments" / "modules"
    services_dir = base_dir / "services" / "modules"

    # Create directories
    deployments_dir.mkdir(parents=True, exist_ok=True)
    services_dir.mkdir(parents=True, exist_ok=True)

    total_modules = 0

    # Generate for each category
    for category, modules in MODULES.items():
        category_name = category.split('-', 1)[1]

        # Create category files
        deployment_file = deployments_dir / f"{category}.yaml"
        service_file = services_dir / f"{category}.yaml"

        with open(deployment_file, 'w') as df, open(service_file, 'w') as sf:
            # Write header
            df.write(f"# {category_name.upper().replace('-', ' ')} MODULES\n")
            df.write(f"# Category: {category}\n")
            df.write(f"# Total modules: {len(modules)}\n\n")

            sf.write(f"# {category_name.upper().replace('-', ' ')} SERVICES\n")
            sf.write(f"# Category: {category}\n")
            sf.write(f"# Total services: {len(modules)}\n\n")

            # Generate for each module
            for module in modules:
                df.write(generate_deployment(module, category))
                sf.write(generate_service(module, category))
                total_modules += 1

        print(f"Generated {len(modules)} modules for category: {category_name}")

    print(f"\nTotal modules generated: {total_modules}")
    print(f"Deployments location: {deployments_dir}")
    print(f"Services location: {services_dir}")

if __name__ == "__main__":
    main()

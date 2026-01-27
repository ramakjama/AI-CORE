#!/bin/bash

# Script para generar todos los clientes Prisma de las bases de datos
# AI-CORE - Soriano Mediadores

echo "🚀 Generando clientes Prisma para todas las bases de datos..."
echo ""

# Array de bases de datos
databases=(
  "sm_global"
  "sm_auth"
  "sm_audit"
  "sm_analytics"
  "sm_communications"
  "sm_documents"
  "sm_ai_agents"
  "sm_accounting"
  "sm_commercial"
  "sm_compliance"
  "sm_data_quality"
  "sm_hr"
  "sm_integrations"
  "sm_inventory"
  "sm_leads"
  "sm_legal"
  "sm_marketing"
  "sm_notifications"
  "sm_objectives"
  "sm_products"
  "sm_projects"
  "sm_quality"
  "sm_scheduling"
  "sm_strategy"
  "sm_techteam"
  "sm_tickets"
  "sm_workflows"
  "ss_insurance"
  "ss_commissions"
  "ss_endorsements"
  "ss_retention"
  "ss_vigilance"
  "se_energy"
  "st_telecom"
  "sf_finance"
  "sr_repairs"
  "sw_workshops"
  "soriano_ecliente"
  "soriano_web_premium"
  "ai_core"
  "ai_super_app"
)

# Contador
total=${#databases[@]}
current=0
success=0
failed=0

# Generar cada cliente
for db in "${databases[@]}"; do
  current=$((current + 1))
  echo "[$current/$total] Generando cliente para: $db"
  
  if [ -d "../databases/$db" ]; then
    cd "../databases/$db" || exit
    
    if [ -f "prisma/schema.prisma" ]; then
      if npx prisma generate; then
        echo "✅ $db - Cliente generado exitosamente"
        success=$((success + 1))
      else
        echo "❌ $db - Error al generar cliente"
        failed=$((failed + 1))
      fi
    else
      echo "⚠️  $db - No se encontró schema.prisma"
      failed=$((failed + 1))
    fi
    
    cd - > /dev/null || exit
  else
    echo "⚠️  $db - Directorio no encontrado"
    failed=$((failed + 1))
  fi
  
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total de bases de datos: $total"
echo "✅ Exitosos: $success"
echo "❌ Fallidos: $failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $failed -eq 0 ]; then
  echo "🎉 ¡Todos los clientes Prisma generados exitosamente!"
  exit 0
else
  echo "⚠️  Algunos clientes fallaron. Revisa los errores arriba."
  exit 1
fi

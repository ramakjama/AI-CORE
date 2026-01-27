#!/bin/bash

# ============================================
# AI-CORE - Setup Automatizado
# ============================================
# Este script configura el entorno completo
# ============================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
print_header() {
    echo -e "\n${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  $1"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Verificar requisitos
check_requirements() {
    print_header "Verificando Requisitos del Sistema"
    
    local all_ok=true
    
    # Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -ge 20 ]; then
            print_success "Node.js $(node --version) instalado"
        else
            print_error "Node.js >= 20.0.0 requerido (actual: $(node --version))"
            all_ok=false
        fi
    else
        print_error "Node.js no encontrado"
        all_ok=false
    fi
    
    # pnpm
    if command -v pnpm &> /dev/null; then
        print_success "pnpm $(pnpm --version) instalado"
    else
        print_warning "pnpm no encontrado. Instalando..."
        npm install -g pnpm
        print_success "pnpm instalado"
    fi
    
    # Docker
    if command -v docker &> /dev/null; then
        print_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) instalado"
    else
        print_error "Docker no encontrado"
        all_ok=false
    fi
    
    # Docker Compose
    if command -v docker compose &> /dev/null || command -v docker-compose &> /dev/null; then
        print_success "Docker Compose instalado"
    else
        print_error "Docker Compose no encontrado"
        all_ok=false
    fi
    
    # Git
    if command -v git &> /dev/null; then
        print_success "Git $(git --version | cut -d' ' -f3) instalado"
    else
        print_error "Git no encontrado"
        all_ok=false
    fi
    
    if [ "$all_ok" = false ]; then
        print_error "Algunos requisitos no están instalados. Por favor, instálalos antes de continuar."
        exit 1
    fi
}

# Instalar dependencias
install_dependencies() {
    print_header "Instalando Dependencias"
    
    print_info "Instalando dependencias con pnpm..."
    pnpm install
    
    print_success "Dependencias instaladas correctamente"
}

# Configurar variables de entorno
setup_env() {
    print_header "Configurando Variables de Entorno"
    
    if [ -f .env ]; then
        print_warning "El archivo .env ya existe"
        read -p "¿Deseas sobrescribirlo? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Manteniendo archivo .env existente"
            return
        fi
    fi
    
    print_info "Copiando .env.example a .env..."
    cp .env.example .env
    
    print_success "Archivo .env creado"
    print_warning "IMPORTANTE: Edita el archivo .env con tus credenciales reales"
    print_info "Especialmente:"
    print_info "  - DATABASE_URL"
    print_info "  - OPENAI_API_KEY"
    print_info "  - ANTHROPIC_API_KEY"
    print_info "  - JWT_SECRET"
    print_info "  - ENCRYPTION_KEY"
}

# Iniciar servicios Docker
start_docker_services() {
    print_header "Iniciando Servicios de Infraestructura"
    
    print_info "Iniciando PostgreSQL, Redis, Kafka..."
    docker compose up -d
    
    print_info "Esperando a que los servicios estén listos..."
    sleep 10
    
    # Verificar PostgreSQL
    if docker compose exec -T postgres pg_isready &> /dev/null; then
        print_success "PostgreSQL está listo"
    else
        print_warning "PostgreSQL aún no está listo. Esperando..."
        sleep 10
    fi
    
    # Verificar Redis
    if docker compose exec -T redis redis-cli ping &> /dev/null; then
        print_success "Redis está listo"
    else
        print_warning "Redis aún no está listo"
    fi
    
    print_success "Servicios de infraestructura iniciados"
}

# Crear bases de datos
create_databases() {
    print_header "Creando Bases de Datos"
    
    print_info "Creando 81 bases de datos..."
    
    # Array de nombres de bases de datos
    databases=(
        # Core (5)
        "ai_core_main"
        "ai_core_global"
        "ai_core_system"
        "ai_core_audit"
        "ai_core_logs"
        
        # Insurance (5)
        "ss_insurance"
        "ss_policies"
        "ss_claims"
        "ss_commissions"
        "ss_carriers"
        
        # HR (5)
        "sm_hr"
        "sm_hr_payroll"
        "sm_hr_recruitment"
        "sm_hr_training"
        "sm_hr_performance"
        
        # Analytics (4)
        "sm_analytics"
        "sm_analytics_reports"
        "sm_analytics_dashboards"
        "sm_analytics_metrics"
        
        # AI Agents (4)
        "sm_ai_agents"
        "sm_ai_models"
        "sm_ai_training"
        "sm_ai_prompts"
        
        # Communications (5)
        "sm_communications"
        "sm_comms_email"
        "sm_comms_sms"
        "sm_comms_whatsapp"
        "sm_comms_voice"
        
        # Finance (4)
        "sm_finance"
        "sm_finance_accounting"
        "sm_finance_invoicing"
        "sm_finance_treasury"
        
        # CRM (3)
        "sm_crm"
        "sm_leads"
        "sm_customers"
        
        # Documents (2)
        "sm_documents"
        "sm_storage"
        
        # Workflows (2)
        "sm_workflows"
        "sm_tasks"
        
        # Shared Ecosystem (8)
        "shared_sso"
        "shared_master_customers"
        "shared_master_products"
        "shared_unified_crm"
        "shared_unified_analytics"
        "shared_assets"
        "shared_global_config"
        "shared_event_bus"
        
        # Soriano Web (5)
        "soriano_web_main"
        "soriano_web_content"
        "soriano_web_blog"
        "soriano_web_forms"
        "soriano_web_seo"
        
        # e-SORI (5)
        "esori_main"
        "esori_users"
        "esori_quotes"
        "esori_sessions"
        "esori_content"
        
        # Landing Pages (4)
        "landing_soriano_main"
        "landing_soriano_leads"
        "landing_soriano_analytics"
        "landing_soriano_campaigns"
        
        # Taxi Asegurado (5)
        "taxi_asegurado_main"
        "taxi_asegurado_leads"
        "taxi_asegurado_quotes"
        "taxi_asegurado_policies"
        "taxi_asegurado_analytics"
        
        # Extended (10)
        "sm_inventory"
        "sm_products"
        "sm_projects"
        "sm_marketing"
        "sm_legal"
        "sm_compliance"
        "sm_quality"
        "sm_tickets"
        "sm_notifications"
        "sm_scheduling"
        
        # External (5)
        "ext_carriers"
        "ext_payments"
        "ext_maps"
        "ext_ai_models"
        "ext_backups"
    )
    
    local created=0
    local skipped=0
    
    for db in "${databases[@]}"; do
        if docker compose exec -T postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "$db"; then
            print_info "Base de datos '$db' ya existe (omitiendo)"
            ((skipped++))
        else
            docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE $db;" &> /dev/null
            print_success "Base de datos '$db' creada"
            ((created++))
        fi
    done
    
    print_success "Bases de datos creadas: $created, omitidas: $skipped"
}

# Generar cliente Prisma
generate_prisma() {
    print_header "Generando Cliente Prisma"
    
    print_info "Generando clientes Prisma para todas las bases de datos..."
    pnpm db:generate
    
    print_success "Clientes Prisma generados"
}

# Ejecutar migraciones
run_migrations() {
    print_header "Ejecutando Migraciones"
    
    print_info "Aplicando migraciones a las bases de datos..."
    pnpm db:migrate
    
    print_success "Migraciones aplicadas"
}

# Cargar datos de prueba
seed_data() {
    print_header "Cargando Datos de Prueba"
    
    read -p "¿Deseas cargar datos de prueba? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_info "Omitiendo carga de datos de prueba"
        return
    fi
    
    print_info "Cargando datos de prueba..."
    pnpm db:seed
    
    print_success "Datos de prueba cargados"
}

# Verificar instalación
verify_installation() {
    print_header "Verificando Instalación"
    
    print_info "Ejecutando tests de verificación..."
    
    # Verificar conexión a PostgreSQL
    if docker compose exec -T postgres pg_isready &> /dev/null; then
        print_success "PostgreSQL: Conectado"
    else
        print_error "PostgreSQL: No conectado"
    fi
    
    # Verificar conexión a Redis
    if docker compose exec -T redis redis-cli ping &> /dev/null; then
        print_success "Redis: Conectado"
    else
        print_error "Redis: No conectado"
    fi
    
    # Verificar que las dependencias están instaladas
    if [ -d "node_modules" ]; then
        print_success "Dependencias: Instaladas"
    else
        print_error "Dependencias: No instaladas"
    fi
    
    # Verificar archivo .env
    if [ -f ".env" ]; then
        print_success "Configuración: .env existe"
    else
        print_error "Configuración: .env no encontrado"
    fi
    
    print_success "Verificación completada"
}

# Mostrar siguiente paso
show_next_steps() {
    print_header "¡Instalación Completada!"
    
    echo -e "${GREEN}✓ AI-CORE está listo para usar${NC}\n"
    
    echo -e "${BLUE}Próximos pasos:${NC}"
    echo -e "  1. Edita el archivo ${YELLOW}.env${NC} con tus credenciales reales"
    echo -e "  2. Inicia el servidor de desarrollo:"
    echo -e "     ${YELLOW}pnpm dev${NC}"
    echo -e "  3. Abre tu navegador en:"
    echo -e "     ${YELLOW}http://localhost:3000${NC} (Web App)"
    echo -e "     ${YELLOW}http://localhost:4000${NC} (API)"
    echo -e "     ${YELLOW}http://localhost:4000/graphql${NC} (GraphQL Playground)"
    echo -e ""
    echo -e "${BLUE}Comandos útiles:${NC}"
    echo -e "  ${YELLOW}pnpm dev${NC}              - Iniciar todos los servicios"
    echo -e "  ${YELLOW}pnpm dev:web${NC}          - Solo Web App"
    echo -e "  ${YELLOW}pnpm dev:api${NC}          - Solo API"
    echo -e "  ${YELLOW}pnpm build${NC}            - Build de producción"
    echo -e "  ${YELLOW}pnpm test${NC}             - Ejecutar tests"
    echo -e "  ${YELLOW}pnpm db:studio${NC}        - Abrir Prisma Studio"
    echo -e "  ${YELLOW}docker compose logs -f${NC} - Ver logs de servicios"
    echo -e ""
    echo -e "${BLUE}Documentación:${NC}"
    echo -e "  ${YELLOW}docs/guides/getting-started.md${NC}"
    echo -e "  ${YELLOW}docs/guides/development.md${NC}"
    echo -e "  ${YELLOW}README.md${NC}"
    echo -e ""
}

# Main
main() {
    clear
    
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════╗"
    echo "║                                                   ║"
    echo "║           AI-CORE Setup Automatizado             ║"
    echo "║                                                   ║"
    echo "║     Sistema ERP Empresarial con IA Nativa        ║"
    echo "║                                                   ║"
    echo "╚═══════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    check_requirements
    install_dependencies
    setup_env
    start_docker_services
    create_databases
    generate_prisma
    run_migrations
    seed_data
    verify_installation
    show_next_steps
}

# Ejecutar
main

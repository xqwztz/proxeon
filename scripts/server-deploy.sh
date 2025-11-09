#!/bin/bash

##############################################################
# Proxeon - Server-side Deployment Script
# Ten skrypt jest wykonywany NA SERWERZE przez GitHub Actions
# Użycie: bash server-deploy.sh [backend|frontend|all]
##############################################################

set -e  # Przerwij przy błędzie

# Kolory dla outputu
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcje pomocnicze
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Konfiguracja (można nadpisać przez zmienne środowiskowe)
BACKEND_PATH="${DEPLOY_PATH_BACKEND:-$HOME/domains/api.proxeon.pl}"
FRONTEND_PATH="${DEPLOY_PATH_FRONTEND:-$HOME/domains/proxeon.pl/public_html}"
PM2_APP_NAME="${PM2_APP_NAME:-proxeon-backend}"
BACKUP_DIR="$HOME/backups"
MAX_BACKUPS=5

# Parametry
DEPLOY_TARGET="${1:-all}"
SKIP_BACKUP="${2:-false}"

echo ""
print_header "🚀 Proxeon Server Deployment"
echo ""
print_info "Deploy target: $DEPLOY_TARGET"
print_info "Backend path: $BACKEND_PATH"
print_info "Frontend path: $FRONTEND_PATH"
echo ""

# Funkcja do tworzenia backupu
create_backup() {
    if [ "$SKIP_BACKUP" = "true" ]; then
        print_warning "Skipping backup (SKIP_BACKUP=true)"
        return 0
    fi

    print_header "📦 Creating Backup"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/proxeon_$TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    if [ "$DEPLOY_TARGET" = "backend" ] || [ "$DEPLOY_TARGET" = "all" ]; then
        if [ -d "$BACKEND_PATH" ]; then
            print_info "Backing up backend..."
            rsync -a --exclude='node_modules' --exclude='.env' \
                "$BACKEND_PATH/" "$BACKUP_PATH/backend/"
            print_success "Backend backed up"
        fi
    fi
    
    if [ "$DEPLOY_TARGET" = "frontend" ] || [ "$DEPLOY_TARGET" = "all" ]; then
        if [ -d "$FRONTEND_PATH" ]; then
            print_info "Backing up frontend..."
            rsync -a "$FRONTEND_PATH/" "$BACKUP_PATH/frontend/"
            print_success "Frontend backed up"
        fi
    fi
    
    print_success "Backup created: $BACKUP_PATH"
    
    # Cleanup old backups
    print_info "Cleaning old backups (keeping last $MAX_BACKUPS)..."
    cd "$BACKUP_DIR"
    ls -t | grep "proxeon_" | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -rf
    
    echo ""
}

# Funkcja do deploymentu backendu
deploy_backend() {
    print_header "🔧 Deploying Backend"
    
    if [ ! -d "$BACKEND_PATH" ]; then
        print_error "Backend path does not exist: $BACKEND_PATH"
        return 1
    fi
    
    cd "$BACKEND_PATH"
    
    # Sprawdź czy package.json się zmienił
    if [ -f "package.json.old" ]; then
        if ! diff -q package.json package.json.old > /dev/null 2>&1; then
            print_info "package.json changed, reinstalling dependencies..."
            npm ci --production
        else
            print_info "package.json unchanged, skipping npm install"
        fi
    else
        print_info "First deployment, installing dependencies..."
        npm ci --production
    fi
    
    # Zapisz obecną wersję package.json dla następnego porównania
    cp package.json package.json.old
    
    # Utwórz wymagane katalogi
    mkdir -p public/logos
    
    # Sprawdź czy .env istnieje
    if [ ! -f ".env" ]; then
        print_warning ".env file not found! Application may not work correctly."
        print_info "Copy env.local to .env and configure it:"
        print_info "  cp env.local .env"
        print_info "  nano .env"
    fi
    
    print_success "Backend deployed successfully"
    echo ""
}

# Funkcja do deploymentu frontendu
deploy_frontend() {
    print_header "🎨 Deploying Frontend"
    
    if [ ! -d "$FRONTEND_PATH" ]; then
        print_error "Frontend path does not exist: $FRONTEND_PATH"
        return 1
    fi
    
    cd "$FRONTEND_PATH"
    
    # Sprawdź czy pliki istnieją
    if [ ! -f "index.html" ]; then
        print_warning "index.html not found! Deployment may be incomplete."
    else
        print_success "Frontend files deployed successfully"
    fi
    
    echo ""
}

# Funkcja do restartu PM2
restart_pm2() {
    print_header "🔄 Restarting PM2"
    
    cd "$BACKEND_PATH"
    
    # Sprawdź czy PM2 jest zainstalowany
    if ! command -v pm2 &> /dev/null; then
        print_error "PM2 is not installed!"
        print_info "Install PM2: npm install -g pm2"
        return 1
    fi
    
    # Sprawdź czy proces istnieje
    if pm2 list | grep -q "$PM2_APP_NAME"; then
        print_info "PM2 process found, reloading..."
        pm2 reload "$PM2_APP_NAME"
        print_success "PM2 process reloaded (zero-downtime)"
    else
        print_info "PM2 process not found, starting..."
        pm2 start app.js --name "$PM2_APP_NAME"
        pm2 save
        print_success "PM2 process started"
    fi
    
    # Pokaż status
    pm2 list
    
    echo ""
}

# Funkcja health check
health_check() {
    print_header "🏥 Health Check"
    
    print_info "Waiting 5 seconds for application to start..."
    sleep 5
    
    # Sprawdź PM2 status
    if pm2 list | grep -q "$PM2_APP_NAME"; then
        PM2_STATUS=$(pm2 list | grep "$PM2_APP_NAME" | awk '{print $10}')
        if [ "$PM2_STATUS" = "online" ]; then
            print_success "PM2 process is online"
        else
            print_warning "PM2 process status: $PM2_STATUS"
        fi
    else
        print_warning "PM2 process not found"
    fi
    
    # Sprawdź czy port nasłuchuje (jeśli znamy port)
    if command -v netstat &> /dev/null; then
        PORT=$(grep "PORT=" "$BACKEND_PATH/.env" 2>/dev/null | cut -d'=' -f2 | tr -d ' ')
        if [ -n "$PORT" ]; then
            if netstat -tuln | grep -q ":$PORT "; then
                print_success "Application is listening on port $PORT"
            else
                print_warning "Application is not listening on port $PORT"
            fi
        fi
    fi
    
    echo ""
}

# Main execution
main() {
    # Backup
    create_backup
    
    # Deploy based on target
    case "$DEPLOY_TARGET" in
        backend)
            deploy_backend
            restart_pm2
            health_check
            ;;
        frontend)
            deploy_frontend
            ;;
        all)
            deploy_backend
            deploy_frontend
            restart_pm2
            health_check
            ;;
        *)
            print_error "Invalid deploy target: $DEPLOY_TARGET"
            print_info "Usage: $0 [backend|frontend|all] [skip_backup]"
            exit 1
            ;;
    esac
    
    # Summary
    print_header "✅ Deployment Completed"
    print_info "Target: $DEPLOY_TARGET"
    print_info "Time: $(date)"
    print_info "Backup: $([ "$SKIP_BACKUP" = "true" ] && echo "Skipped" || echo "Created")"
    echo ""
    print_success "🎉 Deployment successful!"
    echo ""
}

# Uruchom main
main


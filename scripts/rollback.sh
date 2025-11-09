#!/bin/bash

##############################################################
# Proxeon - Rollback Script
# Przywraca poprzednią wersję aplikacji z backupu
# Użycie: bash rollback.sh [backup_name]
##############################################################

set -e  # Przerwij przy błędzie

# Kolory dla outputu
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Konfiguracja
BACKEND_PATH="${DEPLOY_PATH_BACKEND:-$HOME/domains/api.meet.sqx.pl}"
FRONTEND_PATH="${DEPLOY_PATH_FRONTEND:-$HOME/domains/meet.sqx.pl/public_html}"
# MyDevil.net używa Passenger (nie PM2)
BACKUP_DIR="$HOME/backups"

echo ""
print_header "⏮️  Proxeon Rollback"
echo ""

# Sprawdź czy katalog z backupami istnieje
if [ ! -d "$BACKUP_DIR" ]; then
    print_error "Backup directory not found: $BACKUP_DIR"
    exit 1
fi

# Lista dostępnych backupów
list_backups() {
    print_info "Available backups:"
    echo ""
    cd "$BACKUP_DIR"
    ls -lt | grep "proxeon_" | awk '{print NR". "$9" ("$6" "$7" "$8")"}'
    echo ""
}

# Wybór backupu
select_backup() {
    if [ -n "$1" ]; then
        BACKUP_NAME="$1"
    else
        list_backups
        
        read -p "Enter backup number or name (or 'latest' for most recent): " CHOICE
        
        if [ "$CHOICE" = "latest" ]; then
            BACKUP_NAME=$(ls -t "$BACKUP_DIR" | grep "proxeon_" | head -n 1)
        elif [[ "$CHOICE" =~ ^[0-9]+$ ]]; then
            BACKUP_NAME=$(ls -t "$BACKUP_DIR" | grep "proxeon_" | sed -n "${CHOICE}p")
        else
            BACKUP_NAME="$CHOICE"
        fi
    fi
    
    if [ -z "$BACKUP_NAME" ]; then
        print_error "No backup selected"
        exit 1
    fi
    
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    if [ ! -d "$BACKUP_PATH" ]; then
        print_error "Backup not found: $BACKUP_PATH"
        exit 1
    fi
    
    print_success "Selected backup: $BACKUP_NAME"
    echo ""
}

# Potwierdzenie
confirm_rollback() {
    print_warning "⚠️  WARNING: This will restore the application to a previous version!"
    print_info "Backup: $BACKUP_NAME"
    print_info "Backend will be restored to: $BACKEND_PATH"
    print_info "Frontend will be restored to: $FRONTEND_PATH"
    echo ""
    
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        print_info "Rollback cancelled"
        exit 0
    fi
    
    echo ""
}

# Utworzenie backupu przed rollbackiem
create_pre_rollback_backup() {
    print_header "📦 Creating Pre-Rollback Backup"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    PRE_ROLLBACK_PATH="$BACKUP_DIR/pre_rollback_$TIMESTAMP"
    
    mkdir -p "$PRE_ROLLBACK_PATH"
    
    if [ -d "$BACKEND_PATH" ]; then
        print_info "Backing up current backend..."
        rsync -a --exclude='node_modules' --exclude='.env' \
            "$BACKEND_PATH/" "$PRE_ROLLBACK_PATH/backend/"
    fi
    
    if [ -d "$FRONTEND_PATH" ]; then
        print_info "Backing up current frontend..."
        rsync -a "$FRONTEND_PATH/" "$PRE_ROLLBACK_PATH/frontend/"
    fi
    
    print_success "Pre-rollback backup created: $PRE_ROLLBACK_PATH"
    echo ""
}

# Rollback backendu
rollback_backend() {
    print_header "🔧 Rolling Back Backend"
    
    if [ ! -d "$BACKUP_PATH/backend" ]; then
        print_warning "No backend backup found in: $BACKUP_PATH/backend"
        return 0
    fi
    
    print_info "Restoring backend files..."
    rsync -av --delete \
        --exclude='node_modules' \
        --exclude='.env' \
        "$BACKUP_PATH/backend/" "$BACKEND_PATH/"
    
    cd "$BACKEND_PATH"
    
    print_info "Installing dependencies..."
    npm ci --production
    
    print_success "Backend rolled back successfully"
    echo ""
}

# Rollback frontendu
rollback_frontend() {
    print_header "🎨 Rolling Back Frontend"
    
    if [ ! -d "$BACKUP_PATH/frontend" ]; then
        print_warning "No frontend backup found in: $BACKUP_PATH/frontend"
        return 0
    fi
    
    print_info "Restoring frontend files..."
    rsync -av --delete \
        "$BACKUP_PATH/frontend/" "$FRONTEND_PATH/"
    
    print_success "Frontend rolled back successfully"
    echo ""
}

# Restart Passenger (MyDevil.net)
restart_passenger() {
    print_header "🔄 Restarting Passenger Application"
    
    cd "$BACKEND_PATH"
    
    mkdir -p tmp
    touch tmp/restart.txt
    
    print_success "Passenger restart triggered (tmp/restart.txt updated)"
    print_info "Application will restart on next HTTP request"
    
    echo ""
}

# Health check
health_check() {
    print_header "🏥 Health Check"
    
    print_info "Waiting 10 seconds for application to start..."
    sleep 10
    
    # Sprawdź czy Passenger działa (przez próbę HTTP request)
    if [ ! -z "$BACKEND_URL" ]; then
        print_info "Testing backend URL: $BACKEND_URL"
        if curl -s -f -o /dev/null "$BACKEND_URL"; then
            print_success "Backend responds to HTTP requests"
        else
            print_warning "Backend may not be responding yet (Passenger starts on first request)"
        fi
    else
        print_info "BACKEND_URL not set, skipping HTTP check"
        print_info "Passenger will start application on first HTTP request"
    fi
    
    echo ""
}

# Main execution
main() {
    select_backup "$1"
    confirm_rollback
    create_pre_rollback_backup
    
    rollback_backend
    rollback_frontend
    restart_passenger
    health_check
    
    # Summary
    print_header "✅ Rollback Completed"
    print_info "Rolled back to: $BACKUP_NAME"
    print_info "Pre-rollback backup: pre_rollback_$(date +%Y%m%d_%H%M%S)"
    print_info "Time: $(date)"
    echo ""
    print_success "🎉 Rollback successful!"
    print_warning "⚠️  Test the application to ensure everything works correctly"
    echo ""
}

# Uruchom main
main "$@"


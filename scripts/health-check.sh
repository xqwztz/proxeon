#!/bin/bash

##############################################################
# Proxeon - Health Check Script
# Sprawdza stan aplikacji (PM2, porty, API endpoints)
# Użycie: bash health-check.sh [--verbose]
##############################################################

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
# MyDevil.net używa Passenger (nie PM2)
VERBOSE="${1}"

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

echo ""
print_header "🏥 Proxeon Health Check"
echo ""
print_info "Checking application health..."
print_info "Time: $(date)"
echo ""

# Funkcja do sprawdzenia Passenger (MyDevil.net)
check_passenger() {
    print_header "1. Passenger Application Check"
    
    # Sprawdź czy plik restart.txt istnieje (standard Passenger)
    if [ -f "$BACKEND_PATH/tmp/restart.txt" ]; then
        RESTART_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$BACKEND_PATH/tmp/restart.txt" 2>/dev/null || stat -c "%y" "$BACKEND_PATH/tmp/restart.txt" 2>/dev/null | cut -d'.' -f1)
        print_success "Passenger restart file exists"
        print_info "  Last restart: $RESTART_TIME"
        ((CHECKS_PASSED++))
    else
        print_warning "Passenger restart file (tmp/restart.txt) not found"
        print_info "  Application may not have been restarted yet"
        ((CHECKS_WARNING++))
    fi
    
    # Sprawdź czy katalog aplikacji istnieje
    if [ -d "$BACKEND_PATH" ]; then
        print_success "Application directory exists: $BACKEND_PATH"
        ((CHECKS_PASSED++))
    else
        print_error "Application directory not found: $BACKEND_PATH"
        ((CHECKS_FAILED++))
    fi
    
    # Sprawdź czy app.js istnieje
    if [ -f "$BACKEND_PATH/app.js" ]; then
        print_success "Main application file (app.js) exists"
        ((CHECKS_PASSED++))
    else
        print_error "Main application file (app.js) not found"
        ((CHECKS_FAILED++))
    fi
    
    print_info "  Note: Passenger starts application on first HTTP request"
    
    echo ""
}

# Funkcja do sprawdzenia portu
check_port() {
    print_header "2. Port Check"
    
    if [ ! -f "$BACKEND_PATH/.env" ]; then
        print_warning ".env file not found, skipping port check"
        ((CHECKS_WARNING++))
        echo ""
        return 0
    fi
    
    PORT=$(grep "^PORT=" "$BACKEND_PATH/.env" 2>/dev/null | cut -d'=' -f2 | tr -d ' "' | tr -d "'")
    
    if [ -z "$PORT" ]; then
        print_warning "PORT not defined in .env"
        ((CHECKS_WARNING++))
        echo ""
        return 0
    fi
    
    print_info "Checking port: $PORT"
    
    if command -v netstat &> /dev/null; then
        if netstat -tuln | grep -q ":$PORT "; then
            print_success "Port $PORT is listening"
            ((CHECKS_PASSED++))
        else
            print_error "Port $PORT is not listening"
            ((CHECKS_FAILED++))
        fi
    elif command -v ss &> /dev/null; then
        if ss -tuln | grep -q ":$PORT "; then
            print_success "Port $PORT is listening"
            ((CHECKS_PASSED++))
        else
            print_error "Port $PORT is not listening"
            ((CHECKS_FAILED++))
        fi
    else
        print_warning "Neither netstat nor ss available, skipping port check"
        ((CHECKS_WARNING++))
    fi
    
    echo ""
}

# Funkcja do sprawdzenia plików
check_files() {
    print_header "3. Files Check"
    
    if [ ! -d "$BACKEND_PATH" ]; then
        print_error "Backend directory not found: $BACKEND_PATH"
        ((CHECKS_FAILED++))
        echo ""
        return 1
    fi
    
    print_success "Backend directory exists"
    
    cd "$BACKEND_PATH"
    
    # Sprawdź kluczowe pliki
    REQUIRED_FILES=("app.js" "package.json" "config.json")
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "$file" ]; then
            print_success "  $file exists"
        else
            print_error "  $file missing"
            ((CHECKS_FAILED++))
        fi
    done
    
    # Sprawdź .env
    if [ -f ".env" ]; then
        print_success "  .env exists"
        
        # Sprawdź kluczowe zmienne
        REQUIRED_VARS=("BBB_URL" "BBB_SECRET" "PORT")
        for var in "${REQUIRED_VARS[@]}"; do
            if grep -q "^${var}=" .env; then
                print_success "    $var configured"
            else
                print_warning "    $var not found in .env"
                ((CHECKS_WARNING++))
            fi
        done
    else
        print_error "  .env missing"
        ((CHECKS_FAILED++))
    fi
    
    # Sprawdź node_modules
    if [ -d "node_modules" ]; then
        print_success "  node_modules exists"
        ((CHECKS_PASSED++))
    else
        print_error "  node_modules missing"
        print_info "    Run: npm ci --production"
        ((CHECKS_FAILED++))
    fi
    
    # Sprawdź katalog logo
    if [ -d "public/logos" ]; then
        print_success "  public/logos exists"
    else
        print_warning "  public/logos missing"
        ((CHECKS_WARNING++))
    fi
    
    echo ""
}

# Funkcja do sprawdzenia MongoDB
check_mongodb() {
    print_header "4. MongoDB Check"
    
    if [ ! -f "$BACKEND_PATH/.env" ]; then
        print_warning ".env file not found, skipping MongoDB check"
        ((CHECKS_WARNING++))
        echo ""
        return 0
    fi
    
    MONGO_URI=$(grep "^MONGO_URI=" "$BACKEND_PATH/.env" 2>/dev/null | cut -d'=' -f2- | tr -d ' "' | tr -d "'")
    
    if [ -z "$MONGO_URI" ]; then
        print_warning "MONGO_URI not defined in .env"
        ((CHECKS_WARNING++))
        echo ""
        return 0
    fi
    
    print_info "MongoDB URI configured"
    
    # Sprawdź czy mongosh lub mongo jest dostępny
    if command -v mongosh &> /dev/null; then
        print_info "Testing MongoDB connection..."
        if mongosh "$MONGO_URI" --quiet --eval "db.adminCommand('ping')" &> /dev/null; then
            print_success "MongoDB connection successful"
            ((CHECKS_PASSED++))
        else
            print_error "MongoDB connection failed"
            ((CHECKS_FAILED++))
        fi
    elif command -v mongo &> /dev/null; then
        print_info "Testing MongoDB connection..."
        if mongo "$MONGO_URI" --quiet --eval "db.adminCommand('ping')" &> /dev/null; then
            print_success "MongoDB connection successful"
            ((CHECKS_PASSED++))
        else
            print_error "MongoDB connection failed"
            ((CHECKS_FAILED++))
        fi
    else
        print_warning "MongoDB client not available, skipping connection test"
        ((CHECKS_WARNING++))
    fi
    
    echo ""
}

# Funkcja do sprawdzenia API endpoint
check_api_endpoint() {
    print_header "5. API Endpoint Check"
    
    if [ ! -f "$BACKEND_PATH/.env" ]; then
        print_warning ".env file not found, skipping API check"
        ((CHECKS_WARNING++))
        echo ""
        return 0
    fi
    
    PORT=$(grep "^PORT=" "$BACKEND_PATH/.env" 2>/dev/null | cut -d'=' -f2 | tr -d ' "' | tr -d "'")
    
    if [ -z "$PORT" ]; then
        print_warning "PORT not defined, skipping API check"
        ((CHECKS_WARNING++))
        echo ""
        return 0
    fi
    
    API_URL="http://localhost:$PORT"
    
    print_info "Testing API endpoint: $API_URL"
    
    if command -v curl &> /dev/null; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" 2>/dev/null)
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "401" ]; then
            print_success "API is responding (HTTP $HTTP_CODE)"
            ((CHECKS_PASSED++))
        else
            print_error "API not responding (HTTP $HTTP_CODE)"
            ((CHECKS_FAILED++))
        fi
    else
        print_warning "curl not available, skipping API endpoint test"
        ((CHECKS_WARNING++))
    fi
    
    echo ""
}

# Funkcja do sprawdzenia logów
check_logs() {
    print_header "6. Logs Check"
    
    # MyDevil.net Passenger logs są zazwyczaj w panelu DevilWEB
    # lub w katalogu aplikacji jako stderr/stdout
    print_info "Passenger logs location:"
    print_info "  - Panel DevilWEB: Strony WWW → [Twoja domena] → Logi"
    print_info "  - Application directory: $BACKEND_PATH"
    
    # Szukaj lokalnych logów
    if [ -f "$BACKEND_PATH/app.log" ]; then
        print_info "Application log found: app.log"
        print_info "Last 10 lines:"
        echo ""
        tail -n 10 "$BACKEND_PATH/app.log"
    else
        print_info "No local application logs found (app.log)"
    fi
    
    echo ""
}

# Funkcja do sprawdzenia dysku
check_disk_space() {
    print_header "7. Disk Space Check"
    
    DISK_USAGE=$(df -h "$BACKEND_PATH" | awk 'NR==2 {print $5}' | tr -d '%')
    
    print_info "Disk usage: ${DISK_USAGE}%"
    
    if [ "$DISK_USAGE" -lt 80 ]; then
        print_success "Sufficient disk space"
        ((CHECKS_PASSED++))
    elif [ "$DISK_USAGE" -lt 90 ]; then
        print_warning "Disk usage above 80%"
        ((CHECKS_WARNING++))
    else
        print_error "Disk usage critical (>90%)"
        ((CHECKS_FAILED++))
    fi
    
    echo ""
}

# Main execution
main() {
    check_passenger
    check_port
    check_files
    check_mongodb
    check_api_endpoint
    
    if [ "$VERBOSE" = "--verbose" ]; then
        check_logs
    fi
    
    check_disk_space
    
    # Summary
    print_header "📊 Health Check Summary"
    
    TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))
    
    print_success "Passed: $CHECKS_PASSED"
    print_warning "Warnings: $CHECKS_WARNING"
    print_error "Failed: $CHECKS_FAILED"
    
    echo ""
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        if [ $CHECKS_WARNING -eq 0 ]; then
            print_success "🎉 All checks passed! Application is healthy."
            exit 0
        else
            print_warning "⚠️  Some warnings detected. Review above."
            exit 0
        fi
    else
        print_error "❌ Some checks failed. Action required!"
        exit 1
    fi
}

# Uruchom main
main


#!/bin/bash

##############################################################
# Proxeon Frontend - Skrypt instalacyjny dla serwera
# Użycie: sudo bash deploy-frontend.sh
##############################################################

set -e  # Przerwij przy błędzie

echo "=============================================="
echo "🎨 Proxeon Frontend - Instalacja na serwerze"
echo "=============================================="
echo ""

# Kolory dla outputu
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    echo -e "ℹ $1"
}

# Sprawdź czy skrypt jest uruchomiony jako root
if [ "$EUID" -ne 0 ]; then 
    print_error "Proszę uruchomić jako root (sudo)"
    exit 1
fi

# 1. Sprawdzenie Node.js
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Krok 1/5: Sprawdzanie Node.js"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js zainstalowany: $NODE_VERSION"
else
    print_error "Node.js nie jest zainstalowany!"
    exit 1
fi

# 2. Przygotowanie katalogów
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 Krok 2/5: Przygotowanie katalogów"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

APP_DIR="/var/www/proxeon/proxeon-client"

if [ ! -d "$APP_DIR" ]; then
    print_warning "Katalog $APP_DIR nie istnieje"
    print_info "Proszę skopiować pliki aplikacji do $APP_DIR"
    exit 1
fi

cd "$APP_DIR"
print_success "Katalog aplikacji: $APP_DIR"

# 3. Konfiguracja
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  Krok 3/5: Konfiguracja"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f ".env.local" ]; then
    if [ -f "env.local" ]; then
        print_info "Tworzę plik .env.local z env.local..."
        cp env.local .env.local
        print_success "Plik .env.local utworzony"
        print_warning "⚠️  WAŻNE: Edytuj plik .env.local i ustaw produkcyjne wartości!"
        print_info "nano .env.local"
    else
        print_error "Brak pliku env.local!"
        exit 1
    fi
else
    print_success "Plik .env.local już istnieje"
fi

# 4. Instalacja zależności i build
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Krok 4/5: Instalacja zależności i build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

print_info "Instaluję zależności npm (to może potrwać kilka minut)..."
npm install

print_success "Zależności zainstalowane"

print_info "Buduję wersję produkcyjną (to może potrwać kilka minut)..."
npm run build

print_success "Build zakończony"

# Sprawdź czy katalog build został utworzony
if [ -d "build" ]; then
    print_success "Katalog build/ utworzony"
    BUILD_SIZE=$(du -sh build | cut -f1)
    print_info "Rozmiar buildu: $BUILD_SIZE"
else
    print_error "Katalog build/ nie został utworzony!"
    exit 1
fi

# 5. Konfiguracja Nginx (opcjonalnie)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Krok 5/5: Konfiguracja Nginx"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v nginx &> /dev/null; then
    print_success "Nginx zainstalowany"
    
    # Sprawdź czy konfiguracja już istnieje
    if [ -f "/etc/nginx/sites-available/proxeon-frontend" ]; then
        print_success "Konfiguracja Nginx już istnieje"
    else
        print_info "Tworzę konfigurację Nginx..."
        
        cat > /etc/nginx/sites-available/proxeon-frontend << 'EOF'
server {
    listen 80;
    server_name meet.sqx.pl www.meet.sqx.pl;

    root /var/www/proxeon/proxeon-client/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache statycznych plików
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
EOF
        
        # Utwórz symlink
        ln -sf /etc/nginx/sites-available/proxeon-frontend /etc/nginx/sites-enabled/
        
        # Test konfiguracji
        if nginx -t 2>/dev/null; then
            print_success "Konfiguracja Nginx poprawna"
            
            # Restart Nginx
            systemctl restart nginx
            print_success "Nginx zrestartowany"
        else
            print_warning "Konfiguracja Nginx ma błędy, sprawdź ręcznie"
        fi
    fi
else
    print_warning "Nginx nie jest zainstalowany"
    print_info "Frontend będzie dostępny w katalogu: $APP_DIR/build"
fi

echo ""
echo "=============================================="
echo "✅ Instalacja frontendu zakończona!"
echo "=============================================="
echo ""
print_info "Pliki buildu: $APP_DIR/build"
print_info "Rozmiar: $BUILD_SIZE"
echo ""

if command -v nginx &> /dev/null; then
    print_success "Frontend dostępny przez Nginx"
    print_info "Sprawdź konfigurację: sudo nginx -t"
    print_info "Restart Nginx: sudo systemctl restart nginx"
else
    print_warning "Aby serwować frontend, zainstaluj i skonfiguruj Nginx"
    print_info "Zobacz: DEPLOYMENT.md sekcja 'Konfiguracja Nginx'"
fi

echo ""
print_warning "⚠️  Pamiętaj:"
print_warning "1. Edytuj plik .env.local i ustaw URL do API"
print_warning "2. Zainstaluj SSL certyfikaty (certbot)"
print_warning "3. Skonfiguruj DNS aby wskazywał na serwer"
echo ""


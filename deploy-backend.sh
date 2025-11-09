#!/bin/bash

##############################################################
# Proxeon Backend - Skrypt instalacyjny dla serwera
# Użycie: sudo bash deploy-backend.sh
##############################################################

set -e  # Przerwij przy błędzie

echo "=============================================="
echo "🚀 Proxeon Backend - Instalacja na serwerze"
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
echo "📦 Krok 1/7: Sprawdzanie Node.js"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js zainstalowany: $NODE_VERSION"
else
    print_warning "Node.js nie jest zainstalowany"
    print_info "Instaluję Node.js 20.x..."
    
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    print_success "Node.js zainstalowany: $(node --version)"
fi

# 2. Sprawdzenie MongoDB
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Krok 2/7: Sprawdzanie MongoDB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v mongod &> /dev/null; then
    print_success "MongoDB zainstalowany"
    
    if systemctl is-active --quiet mongod; then
        print_success "MongoDB uruchomiony"
    else
        print_warning "MongoDB nie jest uruchomiony, startuję..."
        systemctl start mongod
        systemctl enable mongod
        print_success "MongoDB uruchomiony"
    fi
else
    print_error "MongoDB nie jest zainstalowany!"
    print_info "Proszę zainstalować MongoDB ręcznie zgodnie z DEPLOYMENT.md"
    exit 1
fi

# 3. Instalacja PM2
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Krok 3/7: Instalacja PM2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v pm2 &> /dev/null; then
    print_success "PM2 już zainstalowany: $(pm2 --version)"
else
    print_info "Instaluję PM2..."
    npm install -g pm2
    print_success "PM2 zainstalowany: $(pm2 --version)"
fi

# 4. Przygotowanie katalogów
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 Krok 4/7: Przygotowanie katalogów"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

APP_DIR="/var/www/proxeon/proxeon-srv"

if [ ! -d "$APP_DIR" ]; then
    print_warning "Katalog $APP_DIR nie istnieje"
    print_info "Proszę skopiować pliki aplikacji do $APP_DIR"
    exit 1
fi

cd "$APP_DIR"
print_success "Katalog aplikacji: $APP_DIR"

# 5. Konfiguracja
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  Krok 5/7: Konfiguracja"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f ".env" ]; then
    if [ -f "env.local" ]; then
        print_info "Tworzę plik .env z env.local..."
        cp env.local .env
        print_success "Plik .env utworzony"
        print_warning "⚠️  WAŻNE: Edytuj plik .env i ustaw produkcyjne wartości!"
        print_info "nano .env"
    else
        print_error "Brak pliku env.local!"
        exit 1
    fi
else
    print_success "Plik .env już istnieje"
fi

# Utwórz katalog dla logo
mkdir -p public/logos
print_success "Katalog public/logos utworzony"

# 6. Instalacja zależności
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Krok 6/7: Instalacja zależności"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

print_info "Instaluję zależności npm (to może potrwać kilka minut)..."
npm install --production

print_success "Zależności zainstalowane"

# 7. Uruchomienie przez PM2
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Krok 7/7: Uruchomienie backendu"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Sprawdź czy aplikacja już działa w PM2
if pm2 list | grep -q "proxeon-backend"; then
    print_info "Backend już działa w PM2, restartuję..."
    pm2 restart proxeon-backend
    print_success "Backend zrestartowany"
else
    print_info "Uruchamiam backend przez PM2..."
    pm2 start app.js --name proxeon-backend
    pm2 save
    print_success "Backend uruchomiony"
fi

# Ustaw PM2 startup
print_info "Konfiguruję autostart PM2..."
pm2 startup systemd -u root --hp /root
pm2 save

# Pokaż status
echo ""
pm2 status

echo ""
echo "=============================================="
echo "✅ Instalacja backendu zakończona!"
echo "=============================================="
echo ""
print_info "Status: pm2 status"
print_info "Logi: pm2 logs proxeon-backend"
print_info "Restart: pm2 restart proxeon-backend"
echo ""
print_warning "⚠️  Pamiętaj:"
print_warning "1. Edytuj plik .env i ustaw produkcyjne wartości"
print_warning "2. Skonfiguruj Nginx jako reverse proxy"
print_warning "3. Zainstaluj SSL certyfikaty"
print_warning "4. Utwórz pierwszego użytkownika admin w bazie"
echo ""


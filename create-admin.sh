#!/bin/bash

##############################################################
# Proxeon - Skrypt do tworzenia użytkownika Admin
# Użycie: bash create-admin.sh
##############################################################

echo "=============================================="
echo "👤 Proxeon - Tworzenie użytkownika Admin"
echo "=============================================="
echo ""

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Znajdź katalog backendu (proxeon-srv)
if [ -d "proxeon-srv" ]; then
    BACKEND_DIR="proxeon-srv"
elif [ -f "app.js" ] && [ -f "package.json" ]; then
    BACKEND_DIR="."
else
    print_error "Nie znaleziono katalogu backendu (proxeon-srv)!"
    echo "Uruchom skrypt z root projektu lub z katalogu proxeon-srv"
    exit 1
fi

echo "📁 Używam katalogu: $BACKEND_DIR"
cd "$BACKEND_DIR"

# Poproś o dane admina
echo "Podaj dane nowego użytkownika Admin:"
echo ""

read -p "Email: " ADMIN_EMAIL
read -p "Imię: " ADMIN_FIRSTNAME
read -p "Nazwisko: " ADMIN_LASTNAME
read -sp "Hasło: " ADMIN_PASSWORD
echo ""
read -sp "Powtórz hasło: " ADMIN_PASSWORD_CONFIRM
echo ""

# Sprawdź czy hasła się zgadzają
if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
    print_error "Hasła nie są identyczne!"
    exit 1
fi

# Sprawdź czy hasło jest wystarczająco silne (min 8 znaków)
if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
    print_error "Hasło musi mieć minimum 8 znaków!"
    exit 1
fi

echo ""
print_warning "Tworzę użytkownika Admin..."

# Utwórz tymczasowy skrypt Node.js
cat > /tmp/create-admin-temp.js << EOF
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Zmień katalog roboczy na backend
process.chdir('$PWD');

require('dotenv').config();

const config = require('./_helpers/db');

async function createAdmin() {
  try {
    const Account = require('./accounts/account.model');
    
    // Sprawdź czy admin już istnieje
    const existing = await Account.findOne({ email: '$ADMIN_EMAIL' });
    if (existing) {
      console.error('❌ Użytkownik z tym emailem już istnieje!');
      process.exit(1);
    }
    
    // Hashuj hasło
    const passwordHash = await bcrypt.hash('$ADMIN_PASSWORD', 10);
    
    // Utwórz admina
    const admin = new Account({
      email: '$ADMIN_EMAIL',
      passwordHash: passwordHash,
      firstName: '$ADMIN_FIRSTNAME',
      lastName: '$ADMIN_LASTNAME',
      role: 'Admin',
      isVerified: true,
      created: Date.now()
    });
    
    await admin.save();
    
    console.log('✅ Użytkownik Admin utworzony pomyślnie!');
    console.log('');
    console.log('Dane logowania:');
    console.log('Email: $ADMIN_EMAIL');
    console.log('Hasło: [wprowadzone hasło]');
    console.log('');
    console.log('⚠️  WAŻNE: Zmień hasło po pierwszym logowaniu!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Błąd podczas tworzenia admina:', error.message);
    process.exit(1);
  }
}

// Połącz z bazą i utwórz admina
mongoose.connection.on('connected', () => {
  createAdmin();
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Błąd połączenia z MongoDB:', err);
  process.exit(1);
});
EOF

# Uruchom skrypt z katalogu backendu
node /tmp/create-admin-temp.js

# Usuń tymczasowy skrypt
rm -f /tmp/create-admin-temp.js

echo ""
print_success "Gotowe!"
echo ""


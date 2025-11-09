#!/bin/bash

##############################################################
# Proxeon - MongoDB Backup Script
# Tworzy backup bazy MongoDB
# Użycie: bash mongodb-backup.sh
##############################################################

set -e

# Kolory
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

echo ""
print_header "💾 Proxeon MongoDB Backup"
echo ""

# Odczytaj connection string z config.json
BACKEND_DIR="${1:-../proxeon-srv}"

if [ ! -f "$BACKEND_DIR/config.json" ]; then
    print_error "config.json not found in: $BACKEND_DIR"
    print_info "Usage: bash mongodb-backup.sh [path-to-backend]"
    exit 1
fi

print_info "Reading connection string from config.json..."

# Wyciągnij connection string (używając jq jeśli jest dostępny, w przeciwnym razie grep)
if command -v jq &> /dev/null; then
    MONGO_URI=$(jq -r '.connectionString' "$BACKEND_DIR/config.json")
else
    # Fallback - grep i sed
    MONGO_URI=$(grep '"connectionString"' "$BACKEND_DIR/config.json" | sed -E 's/.*"connectionString":\s*"([^"]+)".*/\1/')
fi

if [ -z "$MONGO_URI" ]; then
    print_error "Could not read connectionString from config.json"
    exit 1
fi

print_success "Connection string found"

# Parsuj URI do komponentów
# Format: mongodb://user:pass@host/database
DB_USER=$(echo "$MONGO_URI" | sed -E 's|mongodb://([^:]+):.*|\1|')
DB_PASS=$(echo "$MONGO_URI" | sed -E 's|mongodb://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "$MONGO_URI" | sed -E 's|mongodb://[^@]+@([^/]+)/.*|\1|')
DB_NAME=$(echo "$MONGO_URI" | sed -E 's|.*/([^/?]+).*|\1|')

print_info "Database: $DB_NAME"
print_info "Host: $DB_HOST"
print_info "User: $DB_USER"

# Utwórz katalog backupów
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/mongodb-backups/proxeon_$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

print_info "Backup location: $BACKUP_DIR"
echo ""

# Sprawdź czy mongodump jest dostępny
if ! command -v mongodump &> /dev/null; then
    print_error "mongodump is not installed!"
    print_info "Install MongoDB Tools:"
    print_info "  macOS: brew install mongodb/brew/mongodb-database-tools"
    print_info "  Ubuntu: sudo apt-get install mongodb-database-tools"
    print_info "  Or download from: https://www.mongodb.com/try/download/database-tools"
    exit 1
fi

print_success "mongodump found"
echo ""

# Wykonaj backup
print_header "📦 Creating backup..."
echo ""

mongodump \
    --uri="$MONGO_URI" \
    --out="$BACKUP_DIR" \
    --gzip

if [ $? -eq 0 ]; then
    echo ""
    print_success "Backup completed successfully!"
    
    # Pokaż statystyki
    BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
    FILE_COUNT=$(find "$BACKUP_DIR" -type f | wc -l | tr -d ' ')
    
    echo ""
    print_header "📊 Backup Statistics"
    print_info "Location: $BACKUP_DIR"
    print_info "Size: $BACKUP_SIZE"
    print_info "Files: $FILE_COUNT"
    
    # Pokaż strukturę
    echo ""
    print_info "Backup structure:"
    ls -lh "$BACKUP_DIR/$DB_NAME/" 2>/dev/null | tail -n +2 || echo "  (database folder structure)"
    
    echo ""
    print_header "✅ Backup Complete"
    echo ""
    print_info "To restore this backup, use:"
    print_info "  mongorestore --uri=\"$MONGO_URI\" --gzip \"$BACKUP_DIR\""
    echo ""
    
    # Zapisz informację o backupie
    cat > "$BACKUP_DIR/BACKUP_INFO.txt" << EOF
Proxeon MongoDB Backup
Created: $(date)
Database: $DB_NAME
Host: $DB_HOST
Size: $BACKUP_SIZE
Files: $FILE_COUNT

Restore command:
mongorestore --uri="MONGO_URI_HERE" --gzip "$BACKUP_DIR"
EOF
    
    print_success "Backup info saved to: $BACKUP_DIR/BACKUP_INFO.txt"
    
else
    echo ""
    print_error "Backup failed!"
    exit 1
fi

# Czyszczenie starych backupów (zachowaj ostatnie 10)
echo ""
print_info "Cleaning old backups (keeping last 10)..."
cd "$HOME/mongodb-backups" 2>/dev/null || exit 0
ls -t | grep "proxeon_" | tail -n +11 | xargs -r rm -rf
print_success "Old backups cleaned"

echo ""


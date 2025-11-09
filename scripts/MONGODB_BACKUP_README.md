# 💾 MongoDB Backup & Restore

Dokumentacja tworzenia i przywracania backupów MongoDB dla Proxeon.

---

## 🎯 Szybkie użycie

### Backup

```bash
# Z katalogu głównego Proxeon
bash scripts/mongodb-backup.sh proxeon-srv

# Lub z dowolnego miejsca
bash mongodb-backup.sh /path/to/proxeon-srv
```

### Restore

```bash
# Przywróć backup do tej samej bazy
mongorestore \
  --uri="mongodb://user:pass@host/database" \
  --gzip \
  "/path/to/backup/folder"

# Przywróć do innej bazy (zmień nazwę)
mongorestore \
  --uri="mongodb://user:pass@host/new_database" \
  --nsFrom="old_database.*" \
  --nsTo="new_database.*" \
  --gzip \
  "/path/to/backup/folder"
```

---

## 📋 Co robi skrypt backup?

1. **Odczytuje config.json** - Wyciąga connection string
2. **Tworzy backup z mongodump** - Pełny dump wszystkich kolekcji
3. **Kompresuje gzip** - Oszczędność miejsca
4. **Zapisuje metadata** - BACKUP_INFO.txt z informacjami
5. **Czyści stare backupy** - Zachowuje ostatnie 10

---

## 📁 Struktura backupu

```
/Users/xq/mongodb-backups/
└── proxeon_20251109_181950/
    ├── BACKUP_INFO.txt                    # Informacje o backupie
    └── mo1493_proxeon/                    # Nazwa bazy
        ├── accounts.bson.gz               # Użytkownicy (26)
        ├── accounts.metadata.json.gz
        ├── meetings.bson.gz               # Spotkania (2,366)
        ├── meetings.metadata.json.gz
        ├── rooms.bson.gz                  # Pokoje (199)
        ├── rooms.metadata.json.gz
        ├── slides.bson.gz                 # Slajdy (334)
        ├── slides.metadata.json.gz
        ├── refreshtokens.bson.gz          # Tokeny (4,611)
        └── refreshtokens.metadata.json.gz
```

---

## 🔧 Instalacja MongoDB Tools

### macOS (Homebrew)

```bash
brew tap mongodb/brew
brew install mongodb-database-tools
```

### Ubuntu/Debian

```bash
sudo apt-get install mongodb-database-tools
```

### Manual Download

https://www.mongodb.com/try/download/database-tools

---

## 📚 Scenariusze użycia

### 1. Backup przed deploymentem

```bash
# Przed pierwszym CI/CD deployment
bash scripts/mongodb-backup.sh proxeon-srv

# Backup zostanie zapisany lokalnie
# Możesz przywrócić w razie problemów
```

### 2. Migracja do nowej bazy

```bash
# 1. Backup ze starej bazy (już zrobione!)
ls ~/mongodb-backups/

# 2. Przywróć do nowej bazy na mydevil.net
mongorestore \
  --uri="mongodb://mo1493_proxeon:PASSWORD@mongo10.mydevil.net/mo1493_proxeon" \
  --gzip \
  "~/mongodb-backups/proxeon_20251109_181950"
```

### 3. Backup regularny (cron)

```bash
# Dodaj do crontab (backup co tydzień w niedzielę o 2:00)
0 2 * * 0 cd /path/to/proxeon && bash scripts/mongodb-backup.sh proxeon-srv

# Backup codziennie o północy
0 0 * * * cd /path/to/proxeon && bash scripts/mongodb-backup.sh proxeon-srv
```

### 4. Backup przed update aplikacji

```bash
# Zawsze przed większym update
bash scripts/mongodb-backup.sh proxeon-srv

# Potem deploy
git push origin main
```

---

## 🔄 Restore - Szczegółowe opcje

### Restore całej bazy

```bash
mongorestore --uri="MONGO_URI" --gzip "/path/to/backup"
```

### Restore tylko wybranych kolekcji

```bash
# Tylko użytkownicy
mongorestore --uri="MONGO_URI" \
  --gzip \
  --nsInclude="database.accounts" \
  "/path/to/backup"

# Tylko spotkania i pokoje
mongorestore --uri="MONGO_URI" \
  --gzip \
  --nsInclude="database.meetings" \
  --nsInclude="database.rooms" \
  "/path/to/backup"
```

### Restore z nadpisaniem (drop existing)

```bash
# UWAGA: To usunie istniejące dane!
mongorestore --uri="MONGO_URI" \
  --gzip \
  --drop \
  "/path/to/backup"
```

### Restore do innej bazy (zmiana nazwy)

```bash
mongorestore --uri="mongodb://host/new_database" \
  --gzip \
  --nsFrom="old_database.*" \
  --nsTo="new_database.*" \
  "/path/to/backup"
```

---

## 🔍 Weryfikacja backupu

### Sprawdź zawartość backupu (bez restore)

```bash
# Lista kolekcji w backupie
ls -lh ~/mongodb-backups/proxeon_20251109_181950/mo1493_proxeon/

# Odczytaj info
cat ~/mongodb-backups/proxeon_20251109_181950/BACKUP_INFO.txt

# Policz dokumenty w backupie (wymaga mongorestore)
mongorestore --uri="mongodb://localhost/temp_verify" \
  --gzip \
  --dryRun \
  "~/mongodb-backups/proxeon_20251109_181950"
```

### Sprawdź rozmiar kolekcji

```bash
# Policz pliki
find ~/mongodb-backups/proxeon_20251109_181950 -name "*.bson.gz" -exec du -h {} \;

# Największe kolekcje
du -sh ~/mongodb-backups/proxeon_20251109_181950/mo1493_proxeon/*.bson.gz | sort -h
```

---

## 🛠️ Troubleshooting

### Problem: "mongodump: command not found"

**Rozwiązanie:**
```bash
# macOS
brew install mongodb-database-tools

# Ubuntu
sudo apt-get install mongodb-database-tools
```

### Problem: "authentication failed"

**Rozwiązanie:**
- Sprawdź connection string w config.json
- Sprawdź czy user/password są poprawne
- Sprawdź czy baza istnieje

### Problem: "connection refused"

**Rozwiązanie:**
- Sprawdź czy host jest dostępny: `ping mongo10.mydevil.net`
- Sprawdź czy port 27017 jest otwarty
- Sprawdź firewall

### Problem: "no space left on device"

**Rozwiązanie:**
```bash
# Sprawdź miejsce
df -h

# Usuń stare backupy
rm -rf ~/mongodb-backups/proxeon_OLD_TIMESTAMP
```

---

## 💡 Best Practices

### 1. Backup przed każdym deploymentem
```bash
bash scripts/mongodb-backup.sh proxeon-srv
git push origin main
```

### 2. Trzymaj backupy w bezpiecznym miejscu
```bash
# Skopiuj backup do cloud storage
rsync -av ~/mongodb-backups/ /path/to/external/drive/
# Lub
rclone sync ~/mongodb-backups/ remote:proxeon-backups/
```

### 3. Testuj restore regularnie
```bash
# Co miesiąc przetestuj restore na test database
mongorestore --uri="mongodb://localhost/test_restore" \
  --gzip \
  "~/mongodb-backups/proxeon_LATEST"
```

### 4. Dokumentuj ważne backupy
```bash
# Dodaj notatkę do BACKUP_INFO.txt
echo "Backup przed deploymentem v2.1.0" >> ~/mongodb-backups/proxeon_DATE/BACKUP_INFO.txt
```

### 5. Automatyzuj backupy (cron)
```bash
# Backup codziennie o 2:00
0 2 * * * cd /path/to/proxeon && bash scripts/mongodb-backup.sh proxeon-srv > /tmp/backup.log 2>&1
```

---

## 📊 Przykładowe statystyki backupu

**Ostatni backup (2025-11-09):**
- Użytkownicy: 26
- Spotkania: 2,366
- Pokoje: 199
- Slajdy: 334
- Tokeny: 4,611
- **Całkowity rozmiar:** 552 KB (compressed)

**Szacowany czas:**
- Backup: ~1 sekunda
- Restore: ~2-3 sekundy

---

## 🔐 Bezpieczeństwo

### ⚠️ WAŻNE:

1. **Backupy zawierają:**
   - Hasła użytkowników (zahashowane)
   - Tokeny sesji
   - Dane spotkań
   - Metadata

2. **Przechowuj bezpiecznie:**
   - Nie commituj do Git!
   - Nie udostępniaj publicznie
   - Szyfruj jeśli przechowujesz w cloud

3. **Connection string:**
   - Zawiera hasło do bazy
   - Nie udostępniaj config.json
   - Używaj zmiennych środowiskowych

### Szyfrowanie backupu (opcjonalnie)

```bash
# Zaszyfruj backup
tar -czf - ~/mongodb-backups/proxeon_DATE | \
  openssl enc -aes-256-cbc -pbkdf2 -out backup.tar.gz.enc

# Odszyfruj
openssl enc -d -aes-256-cbc -pbkdf2 -in backup.tar.gz.enc | \
  tar -xzf -
```

---

## 📞 Wsparcie

W razie problemów:
1. Sprawdź logi: `~/mongodb-backups/backup.log`
2. Test connection: `mongosh "MONGO_URI"`
3. Sprawdź dokumentację: `man mongodump`

---

**Utworzono:** 2025-11-09
**Wersja:** 1.0
**Ostatni backup:** proxeon_20251109_181950


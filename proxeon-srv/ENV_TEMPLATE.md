# 🔧 Environment Configuration Template

Przykładowa konfiguracja pliku `.env` dla Proxeon Backend.

## 📋 Jak używać:

1. Skopiuj `env.local` do `.env`:
   ```bash
   cp env.local .env
   ```

2. Edytuj `.env` i ustaw produkcyjne wartości:
   ```bash
   nano .env
   ```

3. **NIGDY nie commituj `.env` do Git!** (jest w `.gitignore`)

---

## 🔐 Produkcyjna konfiguracja `.env`

```env
# ============================================
# Server Configuration
# ============================================
# PORT_API - Port API dla produkcji (MyDevil.net meet.sqx.pl)
# Domyślnie: 55984 (jeśli nie ustawione, użyje tej wartości)
PORT_API=55984

# PORT_API_DEV - Port API dla development (MyDevil.net 4meet.sqx.pl)
# Domyślnie: 1234 (jeśli nie ustawione, użyje tej wartości)
PORT_API_DEV=1234

# PORT - Fallback port (używany tylko jeśli PORT_API/PORT_API_DEV nie są ustawione)
# Dla produkcji: 55984, dla development: 1234
PORT=55984

NODE_ENV=production
DOMAIN=meet.sqx.pl

# ============================================
# MongoDB Configuration
# ============================================
# WAŻNE: To będzie użyte zamiast config.json!
# Ustaw connection string do TWOJEJ nowej pustej bazy produkcyjnej
MONGO_URI=mongodb://twoj-user:twoje-haslo@host/twoja-baza

# Przykład dla mydevil.net:
# MONGO_URI=mongodb://mo1493_proxeon:PASSWORD@mongo10.mydevil.net/mo1493_proxeon

# ============================================
# BigBlueButton Configuration
# ============================================
BBB_URL=https://twoj-serwer-bbb.pl/bigbluebutton/
BBB_SECRET=twoj-bbb-secret
BBB_DOWNLOAD_URL=https://twoj-serwer-bbb.pl/download/presentation/
BBB_CHECKSUM_ALGORITHM=sha1

# ============================================
# Security
# ============================================
# JWT Secret - wygeneruj silny losowy string (min 64 znaki)
# Komenda: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=WYGENERUJ_TUTAJ_LOSOWY_STRING_MIN_64_ZNAKI

# ============================================
# Email Configuration (opcjonalnie)
# ============================================
EMAIL_FROM=noreply@proxeon.pl
EMAIL_HOST=smtp.twoj-serwer.pl
EMAIL_PORT=587
EMAIL_USER=twoj-email@example.com
EMAIL_PASSWORD=twoje-haslo-email
```

---

## 🎯 Dla Twojej nowej pustej bazy produkcyjnej:

**NA SERWERZE PRODUKCYJNYM** (`~/domains/meet.sqx.pl/.env`):

```env
PORT_API=55984
NODE_ENV=production
DOMAIN=proxeon

# NOWA PUSTA BAZA PRODUKCYJNA
MONGO_URI=mongodb://TWOJ_USER:TWOJE_HASLO@TWOJ_HOST/TWOJA_BAZA

# Twoje dane BBB
BBB_URL=https://h9.sqx.pl/bigbluebutton/
BBB_SECRET=bfP1B1nXCSu75PcDsnBbcqWnfcKvJQs5OIGHYTGRcyw
BBB_DOWNLOAD_URL=https://h9.sqx.pl/download/presentation/
BBB_CHECKSUM_ALGORITHM=sha1

# Silny JWT Secret (wygeneruj nowy!)
JWT_SECRET=wygeneruj-nowy-dla-produkcji-min-64-znaki
```

---

## ⚡ Jak to działa:

### Priority order (dla wszystkich zmiennych):
1. **Jeśli zmienna jest w `.env`** → użyje tej wartości ✅ (PRODUKCJA)
2. **Jeśli brak w `.env`** → użyje `config.json` jako fallback (DEVELOPMENT)

### Zmienne które można ustawić w `.env`:
- `PORT_API` - Port API dla produkcji (domyślnie: 55984)
- `PORT_API_DEV` - Port API dla development (domyślnie: 1234)
- `PORT` - Fallback port (używany tylko jeśli PORT_API/PORT_API_DEV nie są ustawione)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `EMAIL_FROM` - Email nadawcy
- `EMAIL_HOST` - SMTP host
- `EMAIL_PORT` - SMTP port
- `EMAIL_USER` - SMTP username
- `EMAIL_PASSWORD` - SMTP password

### Development (lokalnie):
```bash
# Opcja 1: Użyj config.json (jak teraz)
# Nie ustawiaj MONGO_URI w .env

# Opcja 2: Użyj .env
# Ustaw MONGO_URI w .env
```

### Production (serwer):
```bash
# ZAWSZE użyj .env
# Ustaw MONGO_URI w .env na serwerze
```

---

## 🔒 Bezpieczeństwo:

### ✅ DOBRZE:
- `.env` na serwerze z production credentials (NIE w repo)
- `env.local` w repo jako template (bez prawdziwych haseł)
- `config.json` w repo dla development (bez production credentials)
- Wszystkie production credentials w `.env` na serwerze

### ❌ ŹLE:
- Commitowanie `.env` z hasłami do Git
- Production credentials w `config.json` w repo
- Używanie tych samych credentials dla dev i prod
- Brak `.env` na serwerze (aplikacja nie zadziała)

### ⚠️ WAŻNE:
- **Na produkcji:** Wszystkie zmienne MUSZĄ być w `.env` (config.json jest opcjonalny jako fallback)
- **Przy deploy:** `.env` NIE jest deployowany (jest wykluczony w rsync)
- **Po deploy:** Musisz ręcznie skonfigurować `.env` na serwerze

---

## 📝 Wygeneruj silny JWT_SECRET:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64

# Python
python3 -c "import secrets; print(secrets.token_hex(64))"
```

Przykładowy output:
```
a8f5f167f44f4964e6c998dee827110c03e1b5e1d7f5f5c5d5c5d5c5d5c5d5c5d5c5d5c5d5c5d5c5d5c5d5c5d5c5d5c5d5c5d5c5d5c5
```

---

## 🚀 Po skonfigurowaniu:

1. **Test połączenia:**
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.MONGO_URI)"
   ```

2. **Start aplikacji:**
   ```bash
   node app.js
   # Powinno wyświetlić:
   # 📊 MongoDB: mongodb://user:****@host/database
   ```

3. **Sprawdź logi:**
   - Hasło jest zamaskowane w logach (****) dla bezpieczeństwa
   - Jeśli połączenie nie działa, sprawdź credentials

---

## 📞 Troubleshooting:

### "MongoDB connection string not found"
→ Ustaw `MONGO_URI` w `.env` lub sprawdź `config.json`

### "Authentication failed"
→ Sprawdź user/password w MONGO_URI

### "Connection refused"
→ Sprawdź czy host jest dostępny i port poprawny

---

**Ostatnia aktualizacja:** 2025-11-09


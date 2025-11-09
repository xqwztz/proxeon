# 🚀 CI/CD Documentation - Proxeon

Kompletna dokumentacja CI/CD dla automatycznego deploymentu Proxeon na serwer mydevil.net przez GitHub Actions.

---

## 📋 Spis treści

1. [Przegląd](#przegląd)
2. [Architektura](#architektura)
3. [Konfiguracja początkowa](#konfiguracja-początkowa)
4. [GitHub Actions Workflows](#github-actions-workflows)
5. [Skrypty deploymentowe](#skrypty-deploymentowe)
6. [Jak wykonać deployment](#jak-wykonać-deployment)
7. [Rollback](#rollback)
8. [Monitoring i Health Checks](#monitoring-i-health-checks)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## 🎯 Przegląd

System CI/CD dla Proxeon automatyzuje proces budowania i wdrażania aplikacji na serwer produkcyjny mydevil.net.

### Kluczowe funkcje:
- ✅ **Automatyczny deployment** przy push do `main`
- ✅ **Manualny deployment** z wyborem opcji
- ✅ **Automatyczne backupy** przed każdym deploymentem
- ✅ **Zero-downtime deployment** przez PM2 reload
- ✅ **Health checks** po deploymencie
- ✅ **Rollback** do poprzedniej wersji
- ✅ **Bezpieczne zarządzanie sekretami** przez GitHub Secrets

---

## 🏗️ Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│  (push to main / manual trigger)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Actions Runner                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Build        │  │ Build        │  │ Deploy       │      │
│  │ Backend      │  │ Frontend     │  │ to Server    │      │
│  │              │  │              │  │              │      │
│  │ npm ci       │  │ npm run      │  │ rsync via    │      │
│  │              │  │ build        │  │ SSH          │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ SSH/rsync
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    mydevil.net Server                        │
│                                                              │
│  ┌──────────────────────┐  ┌───────────────────────┐       │
│  │ Backend              │  │ Frontend              │       │
│  │ /domains/api.prox... │  │ /domains/prox.../html │       │
│  │                      │  │                       │       │
│  │ • npm ci             │  │ • Static files        │       │
│  │ • PM2 reload         │  │ • Nginx serves        │       │
│  │ • Health check       │  │                       │       │
│  └──────────────────────┘  └───────────────────────┘       │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │ Backups: ~/backups/proxeon_TIMESTAMP         │           │
│  │ • Przechowywane: ostatnie 5 wersji          │           │
│  │ • Rollback: bash scripts/rollback.sh         │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Konfiguracja początkowa

### 1. Przygotowanie klucza SSH

Szczegółowa instrukcja: [`.github/SECRETS_SETUP.md`](.github/SECRETS_SETUP.md)

```bash
# Wygeneruj klucz SSH
ssh-keygen -t ed25519 -C "github-actions-proxeon" -f ~/.ssh/github_actions_proxeon

# Skopiuj klucz publiczny na serwer
cat ~/.ssh/github_actions_proxeon.pub
# Dodaj do ~/.ssh/authorized_keys na serwerze mydevil.net

# Test połączenia
ssh -i ~/.ssh/github_actions_proxeon user@s1.mydevil.net
```

### 2. Konfiguracja GitHub Secrets

Przejdź do: **Repository Settings** → **Secrets and variables** → **Actions**

#### Wymagane Secrets:

| Secret | Opis | Przykład |
|--------|------|----------|
| `SSH_PRIVATE_KEY` | Klucz prywatny SSH (całość) | `-----BEGIN OPENSSH...` |
| `SSH_HOST` | Host serwera | `s1.mydevil.net` |
| `SSH_USER` | Login SSH | `twoj-login` |
| `SSH_PORT` | Port SSH | `22` |
| `DEPLOY_PATH_BACKEND` | Ścieżka backendu | `/home/user/domains/api.meet.sqx.pl` |
| `DEPLOY_PATH_FRONTEND` | Ścieżka frontendu | `/home/user/domains/meet.sqx.pl/public_html` |

#### Opcjonalne Secrets:

| Secret | Opis |
|--------|------|
| `REACT_APP_SERVER_URL` | URL do API dla frontendu |
| `HEALTH_CHECK_URL` | URL do health check |

### 3. Przygotowanie serwera mydevil.net

```bash
# Zaloguj się na serwer
ssh user@s1.mydevil.net

# Utwórz katalogi
mkdir -p ~/domains/api.meet.sqx.pl
mkdir -p ~/domains/meet.sqx.pl/public_html

# Dla development (w przyszłości):
# mkdir -p ~/domains/api.4meet.sqx.pl
# mkdir -p ~/domains/4meet.sqx.pl/public_html
mkdir -p ~/backups

# Skopiuj skrypty (pierwszy raz ręcznie)
scp scripts/*.sh user@s1.mydevil.net:~/scripts/
ssh user@s1.mydevil.net "chmod +x ~/scripts/*.sh"

# Upewnij się że PM2 jest zainstalowany
npm install -g pm2

# Upewnij się że .env jest skonfigurowany w katalogu backendu
cd ~/domains/api.meet.sqx.pl
cp env.local .env
nano .env  # Skonfiguruj zmienne
```

### 4. Konfiguracja .env na serwerze

Plik `/home/user/domains/api.meet.sqx.pl/.env`:

```env
# Port zarezerwowany w MyDevil.net dla meet.sqx.pl
PORT=55984
NODE_ENV=production
DOMAIN=meet.sqx.pl

# BigBlueButton
BBB_URL=https://twoj-serwer-bbb.pl/bigbluebutton/
BBB_SECRET=twoj-secret
BBB_DOWNLOAD_URL=https://twoj-serwer-bbb.pl/download/presentation/
BBB_CHECKSUM_ALGORITHM=sha1

# MongoDB
MONGO_URI=mongodb://localhost:27017/proxeon

# JWT
JWT_SECRET=silny-losowy-string-min-64-znaki

# Email (opcjonalnie)
EMAIL_FROM=noreply@meet.sqx.pl
EMAIL_HOST=smtp.twoj-serwer.pl
EMAIL_PORT=587
EMAIL_USER=twoj-email
EMAIL_PASSWORD=twoje-haslo
```

**⚠️ WAŻNE:** Plik `.env` NIE JEST deployowany przez CI/CD - musisz go skonfigurować ręcznie na serwerze!

---

## 🔄 GitHub Actions Workflows

### 1. deploy-production.yml

**Trigger:** Automatyczny przy push do branch `main`

**Workflow:**
```
1. build-backend
   - Checkout kodu
   - Setup Node.js 20.x
   - npm ci --production
   - Upload artifacts

2. build-frontend
   - Checkout kodu
   - Setup Node.js 20.x
   - npm ci
   - npm run build
   - Upload artifacts

3. deploy
   - Download artifacts
   - Setup SSH
   - Backup na serwerze
   - rsync backend
   - rsync frontend
   - npm ci na serwerze
   - PM2 reload
   - Health check
```

**Kiedy używać:**
- Automatycznie po merge do `main`
- Deployment produkcyjny

### 2. manual-deploy.yml

**Trigger:** Manualny (workflow_dispatch)

**Opcje:**
- **Environment:** production / staging
- **Deploy backend:** tak / nie
- **Deploy frontend:** tak / nie
- **Skip backup:** tak / nie
- **Restart PM2:** tak / nie

**Kiedy używać:**
- Hotfix bez pełnego deploymentu
- Deploy tylko frontendu lub backendu
- Testing deploymentu
- Deploy na staging

**Jak uruchomić:**
1. Przejdź do **Actions** w repozytorium
2. Wybierz **Manual Deploy**
3. Kliknij **Run workflow**
4. Wybierz opcje
5. Kliknij **Run workflow**

---

## 📜 Skrypty deploymentowe

### 1. server-deploy.sh

Główny skrypt deploymentowy wykonywany na serwerze.

**Użycie:**
```bash
bash scripts/server-deploy.sh [backend|frontend|all] [skip_backup]
```

**Funkcje:**
- Backup obecnej wersji
- Deploy backend i/lub frontend
- Instalacja dependencies
- Restart PM2
- Health check

**Przykłady:**
```bash
# Deploy wszystkiego
bash scripts/server-deploy.sh all

# Deploy tylko backendu
bash scripts/server-deploy.sh backend

# Deploy bez backupu
bash scripts/server-deploy.sh all skip_backup
```

### 2. rollback.sh

Przywraca poprzednią wersję z backupu.

**Użycie:**
```bash
bash scripts/rollback.sh [backup_name]
```

**Funkcje:**
- Lista dostępnych backupów
- Wybór backupu (interaktywny lub przez parametr)
- Pre-rollback backup
- Restore plików
- Restart PM2
- Health check

**Przykłady:**
```bash
# Interaktywny wybór
bash scripts/rollback.sh

# Rollback do najnowszego
bash scripts/rollback.sh latest

# Rollback do konkretnego backupu
bash scripts/rollback.sh proxeon_20250109_150000
```

### 3. health-check.sh

Sprawdza stan aplikacji.

**Użycie:**
```bash
bash scripts/health-check.sh [--verbose]
```

**Sprawdza:**
- ✅ PM2 process (status, uptime, restarts)
- ✅ Port listening
- ✅ Pliki aplikacji (app.js, package.json, .env)
- ✅ MongoDB connection
- ✅ API endpoint response
- ✅ Logi PM2 (w verbose mode)
- ✅ Disk space

**Exit codes:**
- `0` - Wszystko OK lub tylko warnings
- `1` - Są błędy krytyczne

**Przykłady:**
```bash
# Podstawowy check
bash scripts/health-check.sh

# Z verbose output i logami
bash scripts/health-check.sh --verbose

# W cron (silent)
bash scripts/health-check.sh > /dev/null 2>&1 || echo "Health check failed!" | mail -s "Proxeon Alert" admin@example.com
```

---

## 🚀 Jak wykonać deployment

### Deployment automatyczny (Production)

1. **Merge do main:**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

2. **GitHub Actions:**
   - Automatycznie uruchomi się workflow `deploy-production.yml`
   - Możesz śledzić postęp w zakładce **Actions**

3. **Weryfikacja:**
   ```bash
   # Na serwerze
   ssh user@s1.mydevil.net
   bash ~/scripts/health-check.sh
   ```

### Deployment manualny

1. **Przejdź do Actions** w GitHub
2. **Wybierz Manual Deploy**
3. **Kliknij Run workflow**
4. **Wybierz opcje:**
   - Environment: production
   - Deploy backend: ✓
   - Deploy frontend: ✓
   - Skip backup: (zostaw unchecked)
   - Restart PM2: ✓
5. **Kliknij Run workflow**
6. **Monitoruj logi** w czasie rzeczywistym

### Deployment tylko frontendu

```bash
# Przez Manual Deploy w GitHub Actions
Environment: production
Deploy backend: ✗
Deploy frontend: ✓
```

Lub ręcznie:
```bash
# Lokalnie zbuduj frontend
cd proxeon-client
npm run build

# Wgraj na serwer
rsync -avz --delete build/ user@s1.mydevil.net:~/domains/meet.sqx.pl/public_html/
```

---

## ⏮️ Rollback

### Kiedy wykonać rollback?

- ❌ Deployment wprowadził błędy
- ❌ Aplikacja nie działa po update
- ❌ Chcesz wrócić do poprzedniej wersji

### Jak wykonać rollback?

#### Metoda 1: Skrypt rollback.sh

```bash
# Zaloguj się na serwer
ssh user@s1.mydevil.net

# Lista backupów
ls -lt ~/backups/

# Rollback (interaktywny)
bash scripts/rollback.sh

# Rollback do najnowszego
bash scripts/rollback.sh latest

# Rollback do konkretnego
bash scripts/rollback.sh proxeon_20250109_150000
```

#### Metoda 2: Manualny rollback

```bash
# Znajdź backup
cd ~/backups
ls -lt | grep proxeon_

# Przywróć pliki
BACKUP_DIR="proxeon_20250109_150000"
rsync -av "$BACKUP_DIR/backend/" ~/domains/api.proxeon.pl/
rsync -av "$BACKUP_DIR/frontend/" ~/domains/proxeon.pl/public_html/

# Restart PM2
cd ~/domains/api.meet.sqx.pl
npm ci --production
pm2 restart proxeon-backend
```

### Weryfikacja po rollback

```bash
bash scripts/health-check.sh --verbose
pm2 logs proxeon-backend --lines 50
```

---

## 📊 Monitoring i Health Checks

### Automatyczne health checks w CI/CD

Po każdym deploymencie, GitHub Actions wykonuje:
1. Czeka 10 sekund na start aplikacji
2. Sprawdza endpoint API (5 prób)
3. Nie failuje deploymentu jeśli health check nie przejdzie

### Manualny health check

```bash
# Na serwerze
bash scripts/health-check.sh

# Output przykładowy:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🏥 Proxeon Health Check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# 1. PM2 Process Check
# ✓ PM2 is installed
# ✓ PM2 process is online
#   Uptime: 2h
#   Restarts: 0
#
# 2. Port Check
# ✓ Port 1234 is listening
#
# ...
```

### PM2 Monitoring

```bash
# Status wszystkich procesów
pm2 status

# Logi w czasie rzeczywistym
pm2 logs proxeon-backend

# Monitoring (dashboard)
pm2 monit

# Informacje o procesie
pm2 info proxeon-backend

# Restart count i uptime
pm2 list
```

### Monitoring external (opcjonalnie)

Możesz skonfigurować zewnętrzny monitoring:

1. **UptimeRobot** - darmowy monitoring uptime
2. **Sentry** - tracking błędów
3. **PM2 Plus** - monitoring PM2 w chmurze
4. **Cronitor** - monitoring health checks

---

## 🔧 Troubleshooting

### Problem: Deployment failuje przy SSH connection

**Symptom:**
```
Permission denied (publickey)
```

**Rozwiązanie:**
1. Sprawdź czy klucz publiczny jest w `~/.ssh/authorized_keys` na serwerze
2. Sprawdź `SSH_PRIVATE_KEY` w GitHub Secrets
3. Sprawdź uprawnienia: `chmod 600 ~/.ssh/authorized_keys`
4. Test lokalny: `ssh -i ~/.ssh/deploy_key user@server`

### Problem: PM2 process nie restartuje się

**Symptom:**
```
PM2 process 'proxeon-backend' not found
```

**Rozwiązanie:**
```bash
# Na serwerze
cd ~/domains/api.meet.sqx.pl
pm2 start app.js --name proxeon-backend
pm2 save
pm2 startup  # Konfiguruj autostart
```

### Problem: Health check failuje

**Symptom:**
```
⚠️ Health check failed
```

**Debug:**
```bash
# Sprawdź logi PM2
pm2 logs proxeon-backend --lines 100

# Sprawdź czy port nasłuchuje
netstat -tuln | grep 1234

# Sprawdź .env
cat .env | grep PORT

# Test lokalny
curl http://localhost:1234
```

### Problem: Frontend pokazuje stare pliki

**Symptom:**
Zmiany nie są widoczne po deploymencie

**Rozwiązanie:**
```bash
# Wyczyść cache przeglądarki
# Ctrl+Shift+R (hard refresh)

# Sprawdź czy pliki zostały wgrane
ssh user@server
ls -lt ~/domains/proxeon.pl/public_html/

# Sprawdź datę modyfikacji index.html
stat ~/domains/proxeon.pl/public_html/index.html
```

### Problem: MongoDB connection failed

**Symptom:**
```
MongoDB connection failed
```

**Rozwiązanie:**
```bash
# Sprawdź MONGO_URI w .env
cat ~/domains/api.proxeon.pl/.env | grep MONGO_URI

# Test połączenia
mongosh "mongodb://localhost:27017/proxeon" --eval "db.adminCommand('ping')"

# Sprawdź czy MongoDB działa
systemctl status mongod  # Lub:
pm2 list | grep mongo
```

### Problem: node_modules są stare

**Symptom:**
```
Error: Cannot find module 'xyz'
```

**Rozwiązanie:**
```bash
cd ~/domains/api.meet.sqx.pl
rm -rf node_modules package-lock.json
npm ci --production
pm2 restart proxeon-backend
```

### Problem: Backup failed

**Symptom:**
```
rsync: failed to set times
```

**Rozwiązanie:**
```bash
# Sprawdź uprawnienia katalogu backups
chmod 755 ~/backups

# Sprawdź miejsce na dysku
df -h

# Ręczny backup
mkdir -p ~/backups/manual_$(date +%Y%m%d)
rsync -a ~/domains/api.proxeon.pl/ ~/backups/manual_$(date +%Y%m%d)/backend/
```

---

## ✅ Best Practices

### 1. Zawsze testuj na staging przed produkcją

```bash
# Utwórz branch staging
git checkout -b staging

# Deploy na staging
# (użyj Manual Deploy z environment: staging)

# Test na staging
# Po zatwierdzeniu → merge do main
```

### 2. Używaj semantic versioning

```bash
# Tag przed ważnymi deploymentami
git tag -a v2.1.0 -m "Release 2.1.0"
git push origin v2.1.0
```

### 3. Backupy przed ręcznymi zmianami

```bash
# Przed ręczną edycją na serwerze
bash scripts/server-deploy.sh all  # To utworzy backup
```

### 4. Regularne health checks

```bash
# Dodaj do cron (sprawdzanie co godzinę)
0 * * * * bash ~/scripts/health-check.sh || echo "Health check failed" | mail -s "Alert" admin@example.com
```

### 5. Monitoring PM2 restarts

```bash
# Jeśli PM2 restartuje się często (>5 razy), coś jest nie tak
pm2 list  # Sprawdź kolumnę "restart"
pm2 logs proxeon-backend --lines 200  # Znajdź przyczynę
```

### 6. Czyszczenie starych backupów

```bash
# Skrypt automatycznie trzyma 5 ostatnich
# Możesz zmienić w server-deploy.sh:
MAX_BACKUPS=10
```

### 7. Dokumentuj zmiany

```bash
# Zawsze dobre commit messages
git commit -m "feat: Add user authentication"
git commit -m "fix: Resolve memory leak in PM2"
git commit -m "docs: Update deployment guide"
```

### 8. Zero-downtime deployments

```bash
# PM2 reload zamiast restart
pm2 reload proxeon-backend  # Zero downtime
# vs
pm2 restart proxeon-backend  # Krótka przerwa
```

### 9. Environment variables

```bash
# NIGDY nie commituj .env do repo
# Używaj .env.example jako template
cp .env.example .env
# Dodaj .env do .gitignore (już dodane)
```

### 10. Security

```bash
# Regularnie rotuj SSH keys (co 6 miesięcy)
# Używaj silnych JWT_SECRET (min 64 znaki)
# Regularnie aktualizuj dependencies
npm audit
npm audit fix
```

---

## 📚 Dodatkowe zasoby

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [mydevil.net Documentation](https://www.mydevil.net/docs/)
- [Proxeon DEPLOYMENT.md](DEPLOYMENT.md)
- [Proxeon README.md](README.md)

---

## 🆘 Wsparcie

Jeśli masz problemy:

1. Sprawdź logi: `pm2 logs proxeon-backend`
2. Uruchom health check: `bash scripts/health-check.sh --verbose`
3. Sprawdź GitHub Actions logs
4. Sprawdź ten dokument w sekcji Troubleshooting

---

**Ostatnia aktualizacja:** 2025-01-09

**Wersja dokumentacji:** 1.0

**Autor:** Proxeon CI/CD Team


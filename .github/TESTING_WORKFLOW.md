# 🧪 Testing CI/CD Workflow

Instrukcje testowania GitHub Actions workflow przed deploymentem na produkcję.

---

## 📋 Checklist przed pierwszym użyciem

### 1. Konfiguracja GitHub Secrets ✅

Sprawdź czy wszystkie wymagane secrets są skonfigurowane:

```bash
# W GitHub Repository → Settings → Secrets and variables → Actions
# Powinny być widoczne (ale nie wartości):
```

- [ ] `SSH_PRIVATE_KEY`
- [ ] `SSH_HOST`
- [ ] `SSH_USER`
- [ ] `SSH_PORT`
- [ ] `DEPLOY_PATH_BACKEND`
- [ ] `DEPLOY_PATH_FRONTEND`
- [ ] `REACT_APP_SERVER_URL` (opcjonalnie)

### 2. Weryfikacja plików workflow ✅

```bash
# Sprawdź czy pliki workflow istnieją
ls -la .github/workflows/

# Powinny być:
# - deploy-production.yml
# - manual-deploy.yml
```

### 3. Weryfikacja skryptów ✅

```bash
# Sprawdź czy skrypty są executable
ls -la scripts/

# Powinny być:
# - server-deploy.sh (rwxr-xr-x)
# - rollback.sh (rwxr-xr-x)
# - health-check.sh (rwxr-xr-x)
```

---

## 🧪 Test 1: Dry-run lokalny

### SSH Connection Test

```bash
# Test połączenia SSH z lokalnego komputera
ssh -i ~/.ssh/github_actions_proxeon $SSH_USER@$SSH_HOST

# Test rsync (dry-run)
rsync -avz --dry-run -e "ssh -i ~/.ssh/github_actions_proxeon" \
  ./proxeon-srv/ \
  $SSH_USER@$SSH_HOST:/home/$SSH_USER/test-deploy/
```

### Health Check Test

```bash
# Skopiuj skrypt na serwer
scp scripts/health-check.sh $SSH_USER@$SSH_HOST:~/scripts/

# Uruchom na serwerze
ssh $SSH_USER@$SSH_HOST "bash ~/scripts/health-check.sh"
```

---

## 🧪 Test 2: Manual Deploy (Dry-run)

### Przygotowanie

1. **Utwórz branch testowy:**
   ```bash
   git checkout -b test-cicd
   git push origin test-cicd
   ```

2. **Dostosuj workflow do testów** (tymczasowo):
   
   Edytuj `.github/workflows/manual-deploy.yml`:
   ```yaml
   # Dodaj na początku sekcji deploy:
   - name: DRY RUN - Show what would be deployed
     run: |
       echo "=== DRY RUN MODE ==="
       echo "Backend files to deploy:"
       ls -lah ./deploy/backend/ || echo "No backend"
       echo ""
       echo "Frontend files to deploy:"
       ls -lah ./deploy/frontend/ || echo "No frontend"
   
   # W sekcji rsync dodaj --dry-run:
   rsync -avz --dry-run --delete \
   ```

3. **Commit i push:**
   ```bash
   git add .github/workflows/manual-deploy.yml
   git commit -m "test: Add dry-run mode to manual deploy"
   git push origin test-cicd
   ```

### Wykonanie testu

1. **Przejdź do GitHub Actions**
2. **Wybierz Manual Deploy**
3. **Kliknij Run workflow**
4. **Ustaw parametry:**
   - Branch: `test-cicd`
   - Environment: `production` (ale to dry-run)
   - Deploy backend: ✓
   - Deploy frontend: ✓
   - Skip backup: ✓ (to dry-run)
   - Restart PM2: ✗ (to dry-run)
5. **Uruchom i obserwuj logi**

### Weryfikacja

Sprawdź w logach:
- ✅ Build backend przebiegł pomyślnie
- ✅ Build frontend przebiegł pomyślnie
- ✅ Artifacts zostały utworzone
- ✅ SSH connection działa
- ✅ rsync pokazuje co zostałoby przesłane (dry-run)

---

## 🧪 Test 3: Deploy na środowisko testowe

Jeśli masz dostęp do oddzielnego katalogu na serwerze:

### Przygotowanie środowiska testowego

```bash
# Na serwerze mydevil.net
ssh $SSH_USER@$SSH_HOST

# Utwórz katalogi testowe
mkdir -p ~/test-deploy/backend
mkdir -p ~/test-deploy/frontend
```

### Modyfikacja secrets dla testu

Utwórz **osobny Environment** w GitHub:

1. **Settings** → **Environments** → **New environment**
2. Nazwa: `staging`
3. Dodaj secrets specyficzne dla staging:
   - `DEPLOY_PATH_BACKEND` = `/home/user/test-deploy/backend`
   - `DEPLOY_PATH_FRONTEND` = `/home/user/test-deploy/frontend`

### Wykonanie testu

```bash
# Uruchom Manual Deploy z environment: staging
# To wdroży na katalogi testowe, nie dotykając produkcji
```

### Weryfikacja

```bash
# Na serwerze
ssh $SSH_USER@$SSH_HOST

# Sprawdź czy pliki zostały wgrane
ls -la ~/test-deploy/backend/
ls -la ~/test-deploy/frontend/

# Test uruchomienia
cd ~/test-deploy/backend
PORT=9999 node app.js  # Inny port niż produkcja

# Health check
bash ~/scripts/health-check.sh
```

---

## 🧪 Test 4: Rollback

### Przygotowanie

```bash
# Na serwerze utwórz fake backup
ssh $SSH_USER@$SSH_HOST

mkdir -p ~/backups/proxeon_test_backup/backend
mkdir -p ~/backups/proxeon_test_backup/frontend

# Skopiuj aktualne pliki jako test backup
rsync -a ~/test-deploy/backend/ ~/backups/proxeon_test_backup/backend/
rsync -a ~/test-deploy/frontend/ ~/backups/proxeon_test_backup/frontend/
```

### Wykonanie testu

```bash
# Test rollback
ssh $SSH_USER@$SSH_HOST
bash ~/scripts/rollback.sh proxeon_test_backup
```

### Weryfikacja

- ✅ Lista backupów się wyświetla
- ✅ Wybór backupu działa
- ✅ Pre-rollback backup został utworzony
- ✅ Pliki zostały przywrócone
- ✅ PM2 został zrestartowany (jeśli był uruchomiony)

---

## 🧪 Test 5: Full deployment (staging)

Po pomyślnych testach dry-run:

### 1. Usuń `--dry-run` z workflow

```bash
git checkout test-cicd

# Edytuj .github/workflows/manual-deploy.yml
# Usuń --dry-run z rsync
# Usuń sekcję DRY RUN

git add .
git commit -m "test: Remove dry-run mode"
git push origin test-cicd
```

### 2. Pełny deployment na staging

```bash
# GitHub Actions → Manual Deploy
Environment: staging
Deploy backend: ✓
Deploy frontend: ✓
Skip backup: ✗
Restart PM2: ✓
```

### 3. Weryfikacja aplikacji

```bash
# Na serwerze
ssh $SSH_USER@$SSH_HOST

# Sprawdź PM2
pm2 list

# Health check
bash ~/scripts/health-check.sh --verbose

# Test API
curl http://localhost:PORT

# Sprawdź logi
pm2 logs proxeon-backend --lines 50
```

---

## 🧪 Test 6: Production deployment

**⚠️ UWAGA: To już prawdziwy deployment na produkcję!**

### Pre-deployment checklist

- [ ] Wszystkie testy dry-run przeszły pomyślnie
- [ ] Deployment na staging działa
- [ ] Backup mechanizm działa
- [ ] Rollback mechanizm działa
- [ ] Health checks działają
- [ ] .env jest skonfigurowany na produkcji
- [ ] PM2 jest gotowy na produkcji
- [ ] MongoDB działa
- [ ] BBB server jest dostępny

### Wykonanie pierwszego production deployment

```bash
# Opcja 1: Manual Deploy
GitHub Actions → Manual Deploy
Environment: production
Deploy backend: ✓
Deploy frontend: ✓
Skip backup: ✗  # WAŻNE: backup!
Restart PM2: ✓

# Opcja 2: Push do main
git checkout main
git merge test-cicd
git push origin main
# → Automatyczny deployment
```

### Post-deployment verification

```bash
# 1. Sprawdź GitHub Actions logs
# - Czy wszystkie steps przeszły OK?
# - Czy health check passed?

# 2. Sprawdź aplikację
ssh $SSH_USER@$SSH_HOST

# PM2 status
pm2 list
pm2 logs proxeon-backend --lines 100

# Health check
bash ~/scripts/health-check.sh --verbose

# 3. Test w przeglądarce
# - Frontend: https://proxeon.pl
# - Backend API: https://api.proxeon.pl

# 4. Sprawdź backup
ls -lt ~/backups/
```

### W razie problemów - rollback

```bash
# Jeśli coś poszło nie tak:
ssh $SSH_USER@$SSH_HOST
bash ~/scripts/rollback.sh latest

# Health check po rollback
bash ~/scripts/health-check.sh
```

---

## 📊 Monitoring po pierwszym deployment

### 1. PM2 Monitoring

```bash
# Na serwerze
pm2 monit  # Live monitoring

# Sprawdzaj regularnie:
pm2 list   # Restart count nie powinien rosnąć
pm2 logs   # Brak errors
```

### 2. Disk Space

```bash
df -h
# Upewnij się że jest dość miejsca
```

### 3. Backups

```bash
ls -lh ~/backups/
# Sprawdź czy backupy się tworzą
# Czy stare są czyszczone (max 5)
```

### 4. GitHub Actions History

```bash
# W GitHub → Actions
# Sprawdzaj historię deploymentów
# Czy są failures?
```

---

## ✅ Success Criteria

Deployment można uznać za sukces jeśli:

- ✅ GitHub Actions workflow kończy się sukcesem
- ✅ PM2 process jest `online`
- ✅ Health check przechodzi (exit code 0)
- ✅ Frontend jest dostępny w przeglądarce
- ✅ Backend API odpowiada
- ✅ MongoDB connection działa
- ✅ BBB integration działa
- ✅ Backup został utworzony
- ✅ Brak errors w PM2 logs
- ✅ Application jest stabilna (brak restartów)

---

## 🔄 Continuous Testing

Po pierwszym deployment, testuj regularnie:

### Weekly

```bash
# Health check
ssh $SSH_USER@$SSH_HOST bash ~/scripts/health-check.sh

# Backups
ssh $SSH_USER@$SSH_HOST ls -l ~/backups/
```

### Monthly

```bash
# Test rollback procedure (na staging)
# Update dependencies
npm audit
npm audit fix
# Test deployment po update
```

### Quarterly

```bash
# Rotate SSH keys
# Review GitHub Actions logs
# Review disk space usage
# Review PM2 restart counts
```

---

## 📝 Test Log Template

Użyj tego template do dokumentowania testów:

```markdown
# CI/CD Test Log

**Data:** YYYY-MM-DD
**Tester:** [Imię]
**Branch:** [test-cicd/main]
**Environment:** [staging/production]

## Tests Performed

- [ ] Test 1: Dry-run lokalny
  - SSH connection: [OK/FAIL]
  - rsync dry-run: [OK/FAIL]
  - Notes: ___

- [ ] Test 2: Manual Deploy (dry-run)
  - Build backend: [OK/FAIL]
  - Build frontend: [OK/FAIL]
  - SSH connection: [OK/FAIL]
  - Notes: ___

- [ ] Test 3: Deploy na staging
  - Full deployment: [OK/FAIL]
  - Health check: [OK/FAIL]
  - Application works: [OK/FAIL]
  - Notes: ___

- [ ] Test 4: Rollback
  - Rollback execution: [OK/FAIL]
  - Application restored: [OK/FAIL]
  - Notes: ___

- [ ] Test 5: Production deployment
  - Deployment: [OK/FAIL]
  - Health check: [OK/FAIL]
  - Application works: [OK/FAIL]
  - Notes: ___

## Issues Found

1. [Issue description]
   - Severity: [High/Medium/Low]
   - Resolution: [How it was fixed]

## Conclusion

[OK to proceed / Needs fixes]

**Signed:** ___________
```

---

**Powodzenia z testami! 🚀**


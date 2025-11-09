# 🔐 Konfiguracja GitHub Secrets dla CI/CD

## Wymagane kroki

### 1. Wygeneruj klucz SSH na swoim komputerze

```bash
# Wygeneruj nowy klucz SSH dedykowany dla GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-proxeon" -f ~/.ssh/github_actions_proxeon

# To utworzy dwa pliki:
# ~/.ssh/github_actions_proxeon (klucz prywatny)
# ~/.ssh/github_actions_proxeon.pub (klucz publiczny)
```

### 2. Dodaj klucz publiczny na serwer mydevil.net

```bash
# Skopiuj zawartość klucza publicznego
cat ~/.ssh/github_actions_proxeon.pub

# Zaloguj się na serwer mydevil.net i dodaj klucz do authorized_keys
ssh twoj-user@s1.mydevil.net

# Na serwerze:
echo "WKLEJ_TUTAJ_KLUCZ_PUBLICZNY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Dodaj Secrets w GitHub Repository

Przejdź do: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### Wymagane Secrets (Production - main branch):

| Secret Name | Opis | Przykład |
|-------------|------|----------|
| `SSH_PRIVATE_KEY` | Klucz prywatny SSH (cała zawartość pliku) | `-----BEGIN OPENSSH PRIVATE KEY-----`<br/>`...`<br/>`-----END OPENSSH PRIVATE KEY-----` |
| `SSH_HOST` | Host serwera mydevil.net | `s1.mydevil.net` |
| `SSH_USER` | Nazwa użytkownika SSH | `twoj-login` |
| `SSH_PORT` | Port SSH | `22` |
| `DEPLOY_PATH_BACKEND` | Ścieżka do katalogu backendu (production) | `/home/twoj-login/domains/meet.sqx.pl` |
| `DEPLOY_PATH_FRONTEND` | Ścieżka do katalogu frontendu (production) | `/home/twoj-login/domains/meet.sqx.pl/public_html` |

#### Wymagane Secrets (Development - develop branch):

| Secret Name | Opis | Przykład |
|-------------|------|----------|
| `DEPLOY_PATH_BACKEND_DEV` | Ścieżka do katalogu backendu (development) | `/home/twoj-login/domains/4meet.sqx.pl` |
| `DEPLOY_PATH_FRONTEND_DEV` | Ścieżka do katalogu frontendu (development) | `/home/twoj-login/domains/4meet.sqx.pl/public_html` |

**Uwaga:** Secrets SSH (`SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`, `SSH_PORT`) są współdzielone między production i development.

#### Opcjonalne Secrets (dla konfiguracji środowiska):

| Secret Name | Opis | Uwagi |
|-------------|------|-------|
| `BBB_URL` | URL do serwera BigBlueButton | Jeśli chcesz zarządzać przez CI/CD |
| `BBB_SECRET` | Secret do BBB | Jeśli chcesz zarządzać przez CI/CD |
| `MONGO_URI` | MongoDB connection string | Jeśli chcesz zarządzać przez CI/CD |
| `JWT_SECRET` | JWT secret dla produkcji | Jeśli chcesz zarządzać przez CI/CD |
| `NODE_ENV` | Environment | `production` |

### 4. Jak dodać Secret krok po kroku:

1. **Otwórz repozytorium** na GitHub
2. Kliknij **Settings** (ikona zębatki)
3. W menu po lewej kliknij **Secrets and variables** → **Actions**
4. Kliknij przycisk **New repository secret**
5. Wpisz **Name** (np. `SSH_PRIVATE_KEY`)
6. Wklej **Value** (zawartość klucza)
7. Kliknij **Add secret**

### 5. Testowanie połączenia SSH

```bash
# Na swoim komputerze przetestuj klucz
ssh -i ~/.ssh/github_actions_proxeon twoj-user@s1.mydevil.net

# Jeśli działa, GitHub Actions też będzie działać
```

### 6. Skopiuj klucz prywatny do GitHub Secret

```bash
# Wyświetl cały klucz prywatny (UWAGA: to wrażliwe dane!)
cat ~/.ssh/github_actions_proxeon

# Skopiuj CAŁĄ zawartość (włącznie z nagłówkami BEGIN/END)
# i wklej jako Secret SSH_PRIVATE_KEY w GitHub
```

## Bezpieczeństwo

⚠️ **WAŻNE:**
- **NIGDY** nie commituj klucza prywatnego do repozytorium
- Klucz prywatny trzymaj tylko w GitHub Secrets
- Po dodaniu do GitHub, możesz usunąć lokalny klucz (opcjonalnie)
- Regularnie rotuj klucze SSH (np. co 6 miesięcy)
- Używaj oddzielnych kluczy dla różnych środowisk (staging, production)

## Weryfikacja konfiguracji

Po dodaniu wszystkich secrets:

1. Przejdź do **Actions** w repozytorium
2. Uruchom workflow `manual-deploy.yml` (jeśli został utworzony)
3. Sprawdź czy workflow ma dostęp do wszystkich secrets
4. W logach GitHub Actions NIE zobaczysz wartości secrets (są zamaskowane)

## Troubleshooting

### "Permission denied (publickey)"
- Sprawdź czy klucz publiczny został dodany do `~/.ssh/authorized_keys` na serwerze
- Sprawdź uprawnienia: `chmod 600 ~/.ssh/authorized_keys`

### "Could not resolve hostname"
- Sprawdź czy `SSH_HOST` jest poprawny
- Sprawdź czy `SSH_PORT` jest ustawiony (domyślnie 22)

### "Connection timeout"
- Sprawdź czy firewall na serwerze pozwala na połączenia SSH
- Sprawdź czy GitHub Actions ma dostęp do Internetu (zazwyczaj tak)

## Komendy pomocnicze

```bash
# Sprawdź fingerprint klucza publicznego
ssh-keygen -lf ~/.ssh/github_actions_proxeon.pub

# Sprawdź czy klucz jest załadowany w ssh-agent
ssh-add -l

# Testuj połączenie z verbose output
ssh -vvv -i ~/.ssh/github_actions_proxeon twoj-user@s1.mydevil.net
```

## Następne kroki

Po skonfigurowaniu secrets:
1. ✅ Secrets są gotowe
2. ➡️ Uruchom workflow w GitHub Actions
3. ➡️ Zobacz logi deploymentu
4. ➡️ Sprawdź czy aplikacja działa na serwerze

---

**💡 Tip:** Przechowuj klucze SSH w bezpiecznym miejscu (np. 1Password, Bitwarden) jako backup!


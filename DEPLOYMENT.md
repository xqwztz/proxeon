# 🚀 Proxeon - Instrukcja Instalacji na Serwerze

## 📋 Spis treści
1. [Wymagania systemowe](#wymagania-systemowe)
2. [Instalacja zależności](#instalacja-zależności)
3. [Instalacja backendu](#instalacja-backendu)
4. [Instalacja frontendu](#instalacja-frontendu)
5. [Konfiguracja Nginx](#konfiguracja-nginx)
6. [Konfiguracja SSL](#konfiguracja-ssl)
7. [Uruchomienie jako usługa systemd](#uruchomienie-jako-usługa-systemd)
8. [Zarządzanie aplikacją](#zarządzanie-aplikacją)

---

## 🖥️ Wymagania systemowe

### Minimalne:
- **OS**: Ubuntu 20.04 LTS lub nowszy (lub inny Linux)
- **RAM**: 2 GB
- **CPU**: 2 rdzenie
- **Dysk**: 10 GB wolnego miejsca
- **Node.js**: 18.x lub nowszy
- **MongoDB**: 4.4 lub nowszy

### Zalecane:
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 4 GB
- **CPU**: 4 rdzenie
- **Dysk**: 20 GB SSD
- **Node.js**: 20.x
- **MongoDB**: 5.0+

---

## 📦 Instalacja zależności

### 1. Aktualizacja systemu

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Instalacja Node.js 20.x

```bash
# Dodaj repozytorium NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Zainstaluj Node.js i npm
sudo apt-get install -y nodejs

# Weryfikacja
node --version  # powinno pokazać v20.x.x
npm --version   # powinno pokazać 10.x.x
```

### 3. Instalacja MongoDB

```bash
# Import klucza GPG
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg \
   --dearmor

# Dodaj repozytorium MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Zainstaluj MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Uruchom MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Weryfikacja
sudo systemctl status mongod
```

### 4. Instalacja Nginx

```bash
sudo apt-get install -y nginx

# Uruchom Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. Instalacja PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Weryfikacja
pm2 --version
```

---

## 🔧 Instalacja backendu

### 1. Przygotowanie katalogu

```bash
# Utwórz katalog dla aplikacji
sudo mkdir -p /var/www/proxeon
cd /var/www/proxeon

# Sklonuj repozytorium (lub prześlij pliki przez SCP/FTP)
git clone https://github.com/xqwztz/proxeon.git .
# LUB jeśli masz już pliki lokalnie:
# scp -r /ścieżka/do/Proxeon user@serwer:/var/www/proxeon
```

### 2. Konfiguracja backendu

```bash
cd /var/www/proxeon/proxeon-srv

# Skopiuj plik konfiguracyjny
cp env.local .env

# Edytuj konfigurację
nano .env
```

**Przykładowa konfiguracja `.env`:**

```env
PORT=1234
NODE_ENV=production
DOMAIN=proxeon

# MongoDB
MONGO_URI=mongodb://localhost:27017/proxeon

# BigBlueButton
BBB_URL=https://twoj-bbb-serwer.pl/bigbluebutton/
BBB_SECRET=twoj-bbb-secret
BBB_DOWNLOAD_URL=https://twoj-bbb-serwer.pl/download/presentation/
BBB_CHECKSUM_ALGORITHM=sha1

# Email (opcjonalnie - do resetowania haseł)
EMAIL_FROM=noreply@meet.sqx.pl
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=twoj-email@gmail.com
EMAIL_PASSWORD=twoje-haslo-aplikacji

# JWT Secret (wygeneruj silny losowy string)
JWT_SECRET=wygeneruj-silny-losowy-string-tutaj-min-64-znaki
```

**Generowanie JWT_SECRET:**

```bash
# Wygeneruj silny losowy string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Instalacja zależności backendu

```bash
cd /var/www/proxeon/proxeon-srv

# Zainstaluj zależności
npm install --production

# Utwórz katalog dla logo
mkdir -p public/logos
```

### 4. Inicjalizacja bazy danych

```bash
# Połącz się z MongoDB
mongosh

# Utwórz bazę danych i pierwszego użytkownika admin
use proxeon

db.accounts.insertOne({
  email: "admin@meet.sqx.pl",
  passwordHash: "$2a$10$yourHashedPasswordHere",  // Musisz zahashować hasło
  firstName: "Admin",
  lastName: "Proxeon",
  role: "Admin",
  isVerified: true,
  created: new Date()
})

exit
```

**Alternatywnie - użyj skryptu do utworzenia admina:**

```bash
# Utwórz skrypt create-admin.js
cat > /var/www/proxeon/proxeon-srv/create-admin.js << 'EOF'
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const dbConfig = require('./_helpers/db');

async function createAdmin() {
  const Account = require('./accounts/account.model');
  
  const password = 'Admin123!'; // Zmień to hasło!
  const passwordHash = await bcrypt.hash(password, 10);
  
  const admin = new Account({
    email: 'admin@meet.sqx.pl',
    passwordHash: passwordHash,
    firstName: 'Admin',
    lastName: 'Proxeon',
    role: 'Admin',
    isVerified: true,
    created: Date.now()
  });
  
  await admin.save();
  console.log('Admin created successfully!');
  console.log('Email: admin@meet.sqx.pl');
  console.log('Password: Admin123!');
  console.log('CHANGE THIS PASSWORD AFTER FIRST LOGIN!');
  
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('Error creating admin:', err);
  process.exit(1);
});
EOF

# Uruchom skrypt
node create-admin.js

# Usuń skrypt po użyciu (ze względów bezpieczeństwa)
rm create-admin.js
```

### 5. Test backendu

```bash
# Testowe uruchomienie
node app.js

# Sprawdź w przeglądarce lub curl:
curl http://localhost:1234
```

---

## 🎨 Instalacja frontendu

### 1. Konfiguracja frontendu

```bash
cd /var/www/proxeon/proxeon-client

# Skopiuj plik konfiguracyjny
cp env.local .env.local

# Edytuj konfigurację
nano .env.local
```

**Przykładowa konfiguracja `.env.local`:**

```env
REACT_APP_SERVER_URL=https://api.meet.sqx.pl
REACT_APP_DOMAIN=proxeon
PORT=3000
```

### 2. Instalacja zależności i build

```bash
cd /var/www/proxeon/proxeon-client

# Zainstaluj zależności
npm install

# Zbuduj wersję produkcyjną
npm run build

# Build zostanie utworzony w katalogu: build/
```

### 3. Opcja: Serwowanie frontendu przez Nginx (zalecane)

Frontend zostanie zbudowany jako statyczne pliki i serwowany przez Nginx (konfiguracja poniżej).

### 4. Opcja: Serwowanie przez Node.js

Jeśli chcesz serwować React przez Node.js:

```bash
# Zainstaluj serve
sudo npm install -g serve

# Testowe uruchomienie
serve -s build -l 3000
```

---

## 🌐 Konfiguracja Nginx

### 1. Backend (API)

Utwórz konfigurację dla API:

```bash
sudo nano /etc/nginx/sites-available/proxeon-api
```

**Zawartość pliku:**

```nginx
server {
    listen 80;
    server_name api.meet.sqx.pl;

    # Przekierowanie na HTTPS (po skonfigurowaniu SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:1234;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts dla długich requestów
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Zwiększenie limitu uploadowanych plików
    client_max_body_size 100M;
}
```

### 2. Frontend

Utwórz konfigurację dla frontendu:

```bash
sudo nano /etc/nginx/sites-available/proxeon-frontend
```

**Zawartość pliku:**

```nginx
server {
    listen 80;
    server_name meet.sqx.pl www.meet.sqx.pl;

    # Przekierowanie na HTTPS (po skonfigurowaniu SSL)
    # return 301 https://$server_name$request_uri;

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
```

### 3. Aktywacja konfiguracji

```bash
# Utwórz symlinki
sudo ln -s /etc/nginx/sites-available/proxeon-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/proxeon-frontend /etc/nginx/sites-enabled/

# Usuń domyślną konfigurację
sudo rm /etc/nginx/sites-enabled/default

# Test konfiguracji
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 Konfiguracja SSL (Let's Encrypt)

### 1. Instalacja Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. Uzyskanie certyfikatów SSL

```bash
# Dla API
sudo certbot --nginx -d api.meet.sqx.pl

# Dla frontendu
sudo certbot --nginx -d meet.sqx.pl -d www.meet.sqx.pl
```

### 3. Auto-renewal

```bash
# Certbot automatycznie konfiguruje odnowienie
# Sprawdź czy działa:
sudo certbot renew --dry-run
```

### 4. Aktualizacja konfiguracji Nginx

Po uzyskaniu certyfikatów, odkomentuj linię z `return 301 https://...` w plikach konfiguracyjnych:

```bash
sudo nano /etc/nginx/sites-available/proxeon-api
sudo nano /etc/nginx/sites-available/proxeon-frontend

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔄 Uruchomienie jako usługa systemd

### Opcja 1: PM2 (zalecane)

```bash
cd /var/www/proxeon/proxeon-srv

# Uruchom backend przez PM2
pm2 start app.js --name proxeon-backend

# Zapisz konfigurację PM2
pm2 save

# Ustaw PM2 aby startowało przy restarcie systemu
pm2 startup systemd
# Wykonaj polecenie, które wyświetli PM2

# Sprawdź status
pm2 status
pm2 logs proxeon-backend
```

### Opcja 2: Systemd Service (alternatywa)

Utwórz plik usługi:

```bash
sudo nano /etc/systemd/system/proxeon-backend.service
```

**Zawartość:**

```ini
[Unit]
Description=Proxeon Backend API
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/proxeon/proxeon-srv
Environment=NODE_ENV=production
ExecStart=/usr/bin/node app.js
Restart=on-failure
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=proxeon-backend

[Install]
WantedBy=multi-user.target
```

**Uruchomienie:**

```bash
# Przeładuj konfigurację systemd
sudo systemctl daemon-reload

# Uruchom usługę
sudo systemctl start proxeon-backend

# Włącz autostart
sudo systemctl enable proxeon-backend

# Sprawdź status
sudo systemctl status proxeon-backend

# Zobacz logi
sudo journalctl -u proxeon-backend -f
```

---

## 📊 Zarządzanie aplikacją

### Komendy PM2

```bash
# Status
pm2 status

# Logi
pm2 logs proxeon-backend
pm2 logs proxeon-backend --lines 100

# Restart
pm2 restart proxeon-backend

# Stop
pm2 stop proxeon-backend

# Start
pm2 start proxeon-backend

# Monitoring
pm2 monit

# Info
pm2 info proxeon-backend
```

### Komendy systemd

```bash
# Status
sudo systemctl status proxeon-backend

# Restart
sudo systemctl restart proxeon-backend

# Stop
sudo systemctl stop proxeon-backend

# Start
sudo systemctl start proxeon-backend

# Logi
sudo journalctl -u proxeon-backend -f
sudo journalctl -u proxeon-backend --since "1 hour ago"
```

### Update aplikacji

```bash
# Przejdź do katalogu
cd /var/www/proxeon

# Pobierz zmiany
git pull origin main

# Backend
cd proxeon-srv
npm install --production
pm2 restart proxeon-backend

# Frontend
cd ../proxeon-client
npm install
npm run build

# Restart Nginx (jeśli używasz do serwowania frontendu)
sudo systemctl restart nginx
```

---

## 🔍 Monitoring i troubleshooting

### Sprawdzanie logów

```bash
# Logi backendu (PM2)
pm2 logs proxeon-backend

# Logi Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logi MongoDB
sudo tail -f /var/log/mongodb/mongod.log

# Logi systemowe
sudo journalctl -xe
```

### Sprawdzanie portów

```bash
# Sprawdź czy backend działa na porcie 1234
sudo netstat -tulpn | grep 1234

# Sprawdź czy Nginx działa
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

### Restart wszystkich usług

```bash
sudo systemctl restart mongodb
pm2 restart proxeon-backend
sudo systemctl restart nginx
```

---

## 🔐 Bezpieczeństwo

### Firewall (UFW)

```bash
# Aktywuj firewall
sudo ufw enable

# Zezwól na SSH
sudo ufw allow 22/tcp

# Zezwól na HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Sprawdź status
sudo ufw status
```

### Zmiana uprawnień

```bash
# Ustaw właściciela plików
sudo chown -R www-data:www-data /var/www/proxeon

# Ustaw uprawnienia
sudo find /var/www/proxeon -type d -exec chmod 755 {} \;
sudo find /var/www/proxeon -type f -exec chmod 644 {} \;

# Uprawnienia dla .env (tylko odczyt dla właściciela)
sudo chmod 600 /var/www/proxeon/proxeon-srv/.env
```

---

## 📝 Checklist instalacji

- [ ] Node.js zainstalowany
- [ ] MongoDB zainstalowany i uruchomiony
- [ ] Nginx zainstalowany i uruchomiony
- [ ] PM2 zainstalowany
- [ ] Pliki aplikacji na serwerze
- [ ] Backend skonfigurowany (.env)
- [ ] Frontend zbudowany (npm run build)
- [ ] Użytkownik admin utworzony w bazie
- [ ] Nginx skonfigurowany (API + Frontend)
- [ ] SSL certyfikaty zainstalowane
- [ ] Backend uruchomiony przez PM2
- [ ] Firewall skonfigurowany
- [ ] Domeny wskazują na serwer (DNS)
- [ ] Testy: API działa, Frontend działa, BBB połączenie OK

---

## 📞 Wsparcie

Jeśli masz problemy z instalacją:

1. Sprawdź logi: `pm2 logs`, `sudo journalctl -xe`
2. Sprawdź porty: `sudo netstat -tulpn`
3. Sprawdź konfigurację Nginx: `sudo nginx -t`
4. Sprawdź status usług: `sudo systemctl status mongodb nginx`

---

**Gratulacje! Proxeon jest zainstalowany na serwerze produkcyjnym! 🎉**


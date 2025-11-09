# 🎯 Proxeon

**Proxeon** to nowoczesna platforma do zarządzania wideokonferencjami opartymi na **BigBlueButton 3.0**.

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![React](https://img.shields.io/badge/React-16.x-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-brightgreen)
![BBB](https://img.shields.io/badge/BigBlueButton-3.0-orange)

---

## ✨ Funkcje

### 🎥 Zarządzanie spotkaniami
- ✅ Tworzenie i zarządzanie pokojami wideokonferencyjnymi
- ✅ Nagrywanie spotkań (HTML5 + MP4)
- ✅ Wsparcie dla BigBlueButton 2.x i 3.0
- ✅ Automatyczna detekcja wersji BBB
- ✅ Różne poziomy uprawnień (Admin/User)

### 📊 Panel administracyjny
- ✅ Lista aktywnych spotkań w czasie rzeczywistym
- ✅ Przeglądanie i zarządzanie nagraństami
- ✅ Wyszukiwarka nagrań (nazwa, ID, status)
- ✅ Sortowanie po nazwie, dacie, statusie
- ✅ Monitoring statusu serwera BBB
- ✅ Zarządzanie użytkownikami

### 🎨 Interfejs użytkownika
- ✅ Nowoczesny, responsywny design
- ✅ Ciemny i jasny motyw
- ✅ Wielojęzyczność (PL/EN)
- ✅ Dostosowywalne logo

### 🔧 Technologia
- **Frontend**: React 16, Redux, Bootstrap, SCSS
- **Backend**: Node.js, Express, Socket.IO
- **Baza danych**: MongoDB
- **API**: BigBlueButton 3.0 (kompatybilny z 2.x)

---

## 🚀 Szybki start

### Rozwój lokalny

```bash
# Sklonuj repozytorium
git clone https://github.com/xqwztz/proxeon.git
cd proxeon

# Zobacz instrukcję uruchomienia
cat URUCHOM.md
```

📖 **Szczegółowa instrukcja**: [URUCHOM.md](URUCHOM.md)

### Instalacja na serwerze

```bash
# Prześlij pliki na serwer
scp -r proxeon user@serwer:/var/www/

# Uruchom skrypty instalacyjne
cd /var/www/proxeon
sudo bash deploy-backend.sh
sudo bash deploy-frontend.sh

# Utwórz użytkownika admin
bash create-admin.sh
```

📖 **Pełna instrukcja**: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📋 Wymagania

### Minimalne
- **Node.js**: 18.x lub nowszy
- **MongoDB**: 4.4 lub nowszy
- **BigBlueButton**: 2.0 lub nowszy
- **RAM**: 2 GB
- **Dysk**: 10 GB

### Zalecane
- **Node.js**: 20.x
- **MongoDB**: 5.0+
- **BigBlueButton**: 3.0
- **RAM**: 4 GB
- **Dysk**: 20 GB SSD

---

## 📚 Dokumentacja

| Dokument | Opis |
|----------|------|
| [URUCHOM.md](URUCHOM.md) | Uruchomienie lokalne (development) |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Instalacja na serwerze produkcyjnym |
| [BBB_3.0_CHANGES.md](BBB_3.0_CHANGES.md) | Zmiany w BigBlueButton 3.0 |
| [BBB_MP4_SETUP.md](BBB_MP4_SETUP.md) | Konfiguracja nagrań MP4 |
| [BBB_MIGRATION_README.md](BBB_MIGRATION_README.md) | Migracja z BBB 2.x do 3.0 |

---

## 🛠️ Skrypty pomocnicze

### Na serwerze produkcyjnym

```bash
# Instalacja backendu
sudo bash deploy-backend.sh

# Instalacja frontendu
sudo bash deploy-frontend.sh

# Utworzenie użytkownika admin
bash create-admin.sh
```

### Na serwerze BBB (diagnostyka MP4)

```bash
# Sprawdzenie statusu przetwarzania MP4
bash check-mp4-processing.sh

# Monitorowanie generowania MP4 w czasie rzeczywistym
bash monitor-mp4-generation.sh
```

---

## 🔧 Konfiguracja

### Backend (`proxeon-srv/.env`)

```env
PORT=1234
NODE_ENV=production
DOMAIN=proxeon

# BigBlueButton
BBB_URL=https://twoj-serwer-bbb.pl/bigbluebutton/
BBB_SECRET=twoj-secret
BBB_DOWNLOAD_URL=https://twoj-serwer-bbb.pl/download/presentation/
BBB_CHECKSUM_ALGORITHM=sha1

# MongoDB
MONGO_URI=mongodb://localhost:27017/proxeon

# JWT
JWT_SECRET=wygeneruj-silny-losowy-string-min-64-znaki
```

### Frontend (`proxeon-client/.env.local`)

```env
REACT_APP_SERVER_URL=https://api.proxeon.pl
REACT_APP_DOMAIN=proxeon
PORT=3000
```

---

## 🎯 Architektura

```
┌─────────────────┐
│  React Frontend │  ← Użytkownik
│   (Port 3000)   │
└────────┬────────┘
         │
         │ HTTP/WebSocket
         ▼
┌─────────────────┐
│  Node.js Backend│
│   (Port 1234)   │  ← API, Socket.IO
└────┬───────┬────┘
     │       │
     │       └──────────┐
     │                  │
     ▼                  ▼
┌─────────┐    ┌────────────────┐
│ MongoDB │    │ BigBlueButton  │
│  (27017)│    │   Server       │
└─────────┘    └────────────────┘
```

---

## 🔐 Bezpieczeństwo

- ✅ JWT authentication
- ✅ Haszowanie haseł (bcrypt)
- ✅ Role-based access control (Admin/User)
- ✅ HTTPS/SSL support
- ✅ Environment variables dla wrażliwych danych
- ✅ Input validation (Joi)

---

## 🚦 Status projektu

### Gotowe funkcje ✅
- [x] Integracja z BBB 2.x i 3.0
- [x] Automatyczna detekcja wersji BBB
- [x] Panel administracyjny
- [x] Wyszukiwarka i sortowanie nagrań
- [x] Monitoring statusu BBB
- [x] Nagrania MP4 (z konfiguracją BBB)
- [x] Zarządzanie użytkownikami
- [x] Wielojęzyczność (PL/EN)
- [x] Skrypty instalacyjne

### W planach 🚧
- [ ] Dashboard z analityką
- [ ] Eksport raportów
- [ ] Webhook notifications
- [ ] API REST documentation (OpenAPI/Swagger)
- [ ] Docker support

---

## 🤝 Wkład w projekt

Zgłaszanie błędów i pull requesty są mile widziane!

1. Fork projektu
2. Utwórz branch funkcji (`git checkout -b feature/AmazingFeature`)
3. Commit zmian (`git commit -m 'Add some AmazingFeature'`)
4. Push do brancha (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

---

## 📝 Licencja

MIT License

---

## 👥 Autorzy

- **Projekt Proxeon** - System zarządzania BigBlueButton

---

## 🙏 Podziękowania

- [BigBlueButton](https://bigbluebutton.org/) - Platforma wideokonferencyjna
- [React](https://reactjs.org/) - Frontend framework
- [Node.js](https://nodejs.org/) - Backend runtime

---

## 📞 Wsparcie

Masz pytania? Sprawdź dokumentację:

- [URUCHOM.md](URUCHOM.md) - Instrukcja uruchomienia
- [DEPLOYMENT.md](DEPLOYMENT.md) - Instalacja na serwerze
- [BBB_3.0_CHANGES.md](BBB_3.0_CHANGES.md) - BBB 3.0 changes

---

**Zbudowano z ❤️ dla społeczności BigBlueButton**


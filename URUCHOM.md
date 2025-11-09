# 🚀 Uruchomienie aplikacji Proxeon

## ⚡ Szybkie uruchomienie

### Krok 1: Przygotuj pliki .env

```bash
# Backend
cd /Users/xq/Documents/CODE/Proxeon/proxeon-srv
cp env.local .env

# Frontend
cd /Users/xq/Documents/CODE/Proxeon/proxeon-client
cp env.local .env
```

### Krok 2: Utwórz folder dla logo (backend)

```bash
cd /Users/xq/Documents/CODE/Proxeon/proxeon-srv
mkdir -p public/logos
```

### Krok 3: Zainstaluj zależności (jeśli potrzeba)

```bash
# Backend
cd /Users/xq/Documents/CODE/Proxeon/proxeon-srv
npm install

# Frontend
cd /Users/xq/Documents/CODE/Proxeon/proxeon-client
npm install
```

### Krok 4: Uruchom aplikację

**Terminal 1 - Backend:**
```bash
cd /Users/xq/Documents/CODE/Proxeon/proxeon-srv
node app.js
```

Powinieneś zobaczyć:
```
Server listening on port 1234
```

**Terminal 2 - Frontend:**
```bash
cd /Users/xq/Documents/CODE/Proxeon/proxeon-client
npm start
```

Aplikacja otworzy się automatycznie w przeglądarce na: `http://localhost:3000`

---

## ✅ Co już jest skonfigurowane:

- ✅ **Backend config.json** - połączenie z MongoDB (zewnętrzne)
- ✅ **env.local** - pliki konfiguracyjne gotowe do skopiowania
- ✅ **package.json** - zależności określone

---

## 🔧 Konfiguracja

### Backend (.env):
```env
PORT=1234
NODE_ENV=development
DOMAIN=proxeon
BBB_URL=https://demo.bigbluebutton.org/bigbluebutton/
BBB_SECRET=8cd8ef52e8e101574e400365b55e11a6
BBB_DOWNLOAD_URL=https://demo.bigbluebutton.org/playback/presentation/2.3/
```

### Frontend (.env):
```env
REACT_APP_SERVER_URL=http://localhost:1234
REACT_APP_DOMAIN=proxeon
PORT=3000
```

---

## 🌐 Dostęp do aplikacji:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:1234
- **API Docs:** http://localhost:1234/api-docs

---

## ⚠️ Typowe problemy:

### "Cannot find module 'config.json'"
→ Plik istnieje, upewnij się że jesteś w folderze `proxeon-srv`

### "connect ECONNREFUSED 127.0.0.1:1234"
→ Backend nie działa - uruchom `node app.js` w folderze backend

### "Port 3000 already in use"
→ Port zajęty, zmień w `.env` frontendu lub zabij proces:
```bash
lsof -i :3000
kill -9 PID
```

### MongoDB connection error
→ Sprawdź czy zewnętrzna baza MongoDB jest dostępna (jest skonfigurowana w `config.json`)

---

## 📋 Checklist uruchomienia:

- [ ] Skopiować `env.local` → `.env` (backend)
- [ ] Skopiować `env.local` → `.env` (frontend)
- [ ] Utworzyć folder `public/logos` (backend)
- [ ] Zainstalować zależności: `npm install` (oba projekty)
- [ ] Uruchomić backend: `node app.js`
- [ ] Uruchomić frontend: `npm start`
- [ ] Otworzyć http://localhost:3000

---

**Gotowe! Możesz teraz uruchomić aplikację! 🎉**


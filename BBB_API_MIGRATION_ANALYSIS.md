# Analiza Migracji BigBlueButton API - Proxeon

## Obecny Stan

### Używane Wersje:
- **bigbluebutton-js**: `^0.1.0` (bardzo stara biblioteka z 2019 roku)
- **BigBlueButton API**: Wersja 2.x (prawdopodobnie 2.0-2.2)
- **BBB URL**: `https://h8.sqx.pl/bigbluebutton/`

### Pliki Wymagające Aktualizacji:
1. `proxeon-srv/services/meeting.service.js` - główna logika spotkań
2. `proxeon-srv/services/room.service.js` - zarządzanie pokojami
3. `proxeon-srv/app.js` - inicjalizacja BBB
4. `proxeon-srv/package.json` - wersja biblioteki
5. `proxeon-client/package.json` - wersja biblioteki klienta

---

## Różnice między BBB API 2.0 a Najnowszymi Wersjami (2.6/2.7)

### ⚠️ UWAGA: BBB 3.0 
BigBlueButton 3.0 **nie został jeszcze oficjalnie wydany** (stan: listopad 2024).
Najnowsza stabilna wersja to **2.7.x**.

---

## KRYTYCZNE ZMIANY WYMAGAJĄCE UWAGI

### 1. ❌ Żądania POST do endpointu `join` (od 2.6.18/2.7.8)

**Problem:**
```javascript
// OBECNIE W KODZIE - linie 76-98, 150-184 w room.service.js
// Budowanie URL do join bez wyraźnego określenia metody
let url = process.env.BBB_URL + "api/join?meetingID=" + meeting.meetingID + ...
```

**Zmiana:** 
- ⛔ Żądania POST do `/api/join` **NIE SĄ JUŻ DOZWOLONE**
- ✅ Używaj **tylko GET** dla endpointu `join`

**Status w kodzie:** ✅ **Już prawidłowo** - kod używa tylko GET (zwraca URL)

---

### 2. 📝 Wymagany nagłówek Content-Type dla POST (od 2.6.18/2.7.8)

**Problem:**
```javascript
// meeting.service.js linia 97-102
await axios({
  method: "post",
  url: meetingCreateUrl,
  headers: { "Content-Type": "text/xml" },  // ✅ JUŻ JEST!
  data: xml,
})
```

**Status:** ✅ **Już prawidłowo zaimplementowane**

**Obsługiwane Content-Types:**
- `text/xml` ✅ (używane w kodzie)
- `application/xml`
- `application/x-www-form-urlencoded`
- `multipart/form-data`

---

### 3. 🔐 Algorytmy SHA dla sum kontrolnych (od 2.6.17)

**Problem:**
```javascript
// Obecnie używany SHA1 w wielu miejscach:
// meeting.service.js: linia 5, 139, 211, 246, 300, 326
const sha1 = require("sha1");
sha = sha1(sha);
```

**Zmiana:**
- 🔄 BBB 2.6+ preferuje **SHA256** lub **SHA512**
- ⚠️ SHA1 jest wciąż obsługiwane, ale **przestarzałe** ze względów bezpieczeństwa

**Wymagane działanie:**
```javascript
// ZALECANE:
const crypto = require('crypto');
const sha = crypto.createHash('sha256')
  .update(request + process.env.BBB_SECRET)
  .digest('hex');
```

---

### 4. 📚 Przestarzała Biblioteka bigbluebutton-js

**Problem:**
```json
// package.json
"bigbluebutton-js": "^0.1.0"  // Ostatnia aktualizacja: 2019
```

**Stan:**
- ⚠️ Biblioteka **NIE JEST AKTYWNIE ROZWIJANA**
- ❌ Nie obsługuje nowych funkcji BBB 2.6+
- 🔴 Może nie działać z BBB 2.7+

**Rozwiązanie:**
Istnieją dwie opcje:

**OPCJA A: Aktualizacja do `bigbluebutton-api-js`** (zalecane)
```json
"dependencies": {
  "bbb-api-js": "^1.0.0"  // Nowocześniejsza biblioteka
}
```

**OPCJA B: Bezpośrednie wywołania API** (większa kontrola)
- Samodzielne budowanie URL i wywołań HTTP
- Pełna kontrola nad parametrami
- Brak zależności od przestarzałych bibliotek

---

## NOWE FUNKCJE BBB 2.6/2.7 DO ROZWAŻENIA

### 1. Auto-zakończenie spotkań
```javascript
// Nowe parametry w create():
{
  meetingExpireIfNoUserJoinedInMinutes: 5,  // Koniec jeśli nikt nie dołączył
  meetingExpireWhenLastUserLeftInMinutes: 1  // Koniec po wyjściu ostatniego
}
```

### 2. Grupy w Breakout Rooms
```javascript
// Parametr groups w create():
{
  groups: JSON.stringify([
    { name: "Grupa 1", users: ["user1", "user2"] },
    { name: "Grupa 2", users: ["user3", "user4"] }
  ])
}
```

### 3. Ulepszone Ankiety
- Wielokrotny wybór w ankietach
- Lepsze zarządzanie wynikami

---

## PLAN MIGRACJI

### FAZA 1: Przygotowanie (Bez Zmian w Produkcji) ✅
- [x] Analiza obecnego kodu
- [x] Identyfikacja używanych endpointów API
- [ ] Backup bazy danych i kodu

### FAZA 2: Aktualizacja Algorytmu Szyfrowania 🔄
1. Zamień SHA1 na SHA256
2. Dodaj zmienną środowiskową dla wyboru algorytmu
3. Testuj na środowisku deweloperskim

```javascript
// Dodaj do .env
BBB_CHECKSUM_ALGORITHM=sha256  // lub sha512
```

### FAZA 3: Aktualizacja Biblioteki 📦
**OPCJA A: Pozostań z bigbluebutton-js**
- Kod już działa
- Dodaj walidację API dla kompatybilności
- Monitoruj deprecation warnings

**OPCJA B: Migracja do bbb-api-js**
- Zaktualizuj wszystkie wywołania API
- Testy integracyjne
- Pełna kompatybilność z BBB 2.7+

### FAZA 4: Nowe Funkcje (Opcjonalne) 🚀
- Auto-zakończenie spotkań
- Grupy w breakout rooms
- Ulepszone ankiety

### FAZA 5: Aktualizacja Serwera BBB 🖥️
- Aktualizuj serwer BBB do wersji 2.7.x
- Testy E2E
- Deployment na produkcję

---

## REKOMENDACJE

### Natychmiastowe (Priorytet: 🔴 WYSOKI)
1. ✅ **Dodaj monitorowanie wersji API** - sprawdzaj wersję BBB serwera przy starcie
2. 🔄 **Zaktualizuj SHA1 → SHA256** - zwiększ bezpieczeństwo
3. 📝 **Dodaj testy integracyjne** - dla wywołań BBB API

### Krótkoterminowe (Priorytet: 🟡 ŚREDNI)
1. **Oceń bibliotekę bigbluebutton-js** - czy potrzebujesz migracji?
2. **Dodaj obsługę błędów** - lepsze logowanie błędów API
3. **Wersjonowanie API** - przygotuj kod na przyszłe zmiany

### Długoterminowe (Priorytet: 🟢 NISKI)
1. **Implementuj nowe funkcje** - auto-zakończenie, grupy
2. **Przejdź na TypeScript** - lepsza typizacja API
3. **Dokumentacja** - opisz integrację z BBB

---

## KOD DO NATYCHMIASTOWEJ IMPLEMENTACJI

### 1. Funkcja pomocnicza do SHA256

```javascript
// _helpers/bbb-checksum.js (NOWY PLIK)
const crypto = require('crypto');

function generateChecksum(queryString, secret, algorithm = 'sha256') {
  return crypto
    .createHash(algorithm)
    .update(queryString + secret)
    .digest('hex');
}

module.exports = { generateChecksum };
```

### 2. Walidacja wersji API

```javascript
// services/bbb-version-check.js (NOWY PLIK)
const fetch = require("node-fetch");

async function checkBBBVersion() {
  try {
    const response = await fetch(`${process.env.BBB_URL}api`);
    const text = await response.text();
    
    // Parse version from XML response
    const versionMatch = text.match(/<version>([\d.]+)<\/version>/);
    const version = versionMatch ? versionMatch[1] : 'unknown';
    
    console.log(`🔵 BigBlueButton Server Version: ${version}`);
    
    // Ostrzeżenia dla starych wersji
    const [major, minor] = version.split('.').map(Number);
    if (major < 2 || (major === 2 && minor < 6)) {
      console.warn(`⚠️  BBB version ${version} is outdated. Consider upgrading to 2.7+`);
    }
    
    return version;
  } catch (error) {
    console.error('❌ Failed to check BBB version:', error.message);
    return null;
  }
}

module.exports = { checkBBBVersion };
```

### 3. Dodaj do app.js

```javascript
// app.js - dodaj po linii 18
const { checkBBBVersion } = require('./services/bbb-version-check');

// Sprawdź wersję przy starcie
checkBBBVersion().then(version => {
  console.log(`✅ Connected to BBB API version: ${version}`);
});
```

---

## PODSUMOWANIE

### ✅ Co Już Działa Dobrze:
- Żądania GET do `/api/join`
- Content-Type dla POST do `/api/create`
- Podstawowa struktura API jest kompatybilna

### ⚠️ Co Wymaga Uwagi:
- SHA1 → SHA256 (bezpieczeństwo)
- Przestarzała biblioteka `bigbluebutton-js`
- Brak walidacji wersji API
- Brak obsługi nowych funkcji BBB 2.6+

### 🎯 Następne Kroki:
1. Zaktualizuj algorytm checksum do SHA256
2. Dodaj monitorowanie wersji BBB
3. Przetestuj z BBB 2.7
4. Rozważ migrację biblioteki (opcjonalne)
5. Dodaj nowe funkcje (opcjonalne)

---

## RYZYKO I ZGODNOŚĆ

### Obecna Zgodność:
- ✅ **BBB 2.0-2.5**: Pełna kompatybilność
- ⚠️ **BBB 2.6-2.7**: Działa, ale SHA1 przestarzały
- ❓ **BBB 2.8+**: Wymaga testów
- ❌ **BBB 3.0**: Nie istnieje jeszcze (listopad 2024)

### Poziom Ryzyka Migracji:
- **SHA256 Update**: 🟢 NISKIE ryzyko - wsteczna kompatybilność
- **Biblioteka Update**: 🟡 ŚREDNIE ryzyko - wymaga testów
- **Nowe Funkcje**: 🟢 NISKIE ryzyko - opcjonalne, nie złamią istniejącego kodu

---

**Data analizy:** Listopad 2024  
**Analizowana wersja Proxeon:** 2.0.1  
**Rekomendowana wersja BBB:** 2.7.x


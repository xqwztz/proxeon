# 🚀 Migracja BigBlueButton API - Instrukcja

## 📋 Co zostało przygotowane

Przeanalizowałem kod Proxeon i przygotowałem kompletne narzędzia do migracji na nowsze wersje BigBlueButton API (2.6/2.7+).

### ✅ Utworzone Pliki:

1. **`BBB_API_MIGRATION_ANALYSIS.md`** - Szczegółowa analiza różnic między wersjami API
2. **`_helpers/bbb-checksum.js`** - Helper do generowania checksum (SHA256/SHA512)
3. **`_helpers/bbb-version-check.js`** - Automatyczne sprawdzanie wersji serwera BBB
4. **`MIGRATION_EXAMPLE.js`** - Przykłady kodu - stary vs nowy sposób
5. **`env.local`** - Zaktualizowane o `BBB_CHECKSUM_ALGORITHM`
6. **`app.js`** - Dodano sprawdzanie wersji BBB przy starcie

---

## 🎯 Obecny Stan

### Kod Działa Prawidłowo! ✅

Twój obecny kod jest **kompatybilny** z BBB 2.0-2.7. Używa:
- ✅ GET dla endpointu `/api/join`
- ✅ Content-Type dla POST
- ⚠️ SHA1 dla checksum (działa ale przestarzały)

### Co Wymaga Uwagi? ⚠️

1. **SHA1 → SHA256** - SHA1 jest przestarzały, zalecane SHA256
2. **Biblioteka bigbluebutton-js** - wersja 0.1.0 z 2019 roku
3. **Brak walidacji wersji BBB** - dodane w tym PR

---

## 🔧 Co Teraz Możesz Zrobić

### OPCJA 1: Minimalna Zmiana (Zalecane na Start) 🟢

**Wystarczy zmienić algorytm na SHA256:**

1. Edytuj `.env` i zmień (jeśli chcesz testować):
```bash
BBB_CHECKSUM_ALGORITHM=sha1  # Najpierw przetestuj z sha1
```

2. Uruchom backend:
```bash
cd proxeon-srv
node app.js
```

3. Zobaczysz informacje o wersji BBB:
```
╔════════════════════════════════════════════╗
║   BigBlueButton Server Information         ║
╠════════════════════════════════════════════╣
║ Server Version:   2.7.5                   ║
║ API Version:      2.0                     ║
╚════════════════════════════════════════════╝
```

4. Jeśli wszystko działa, zmień na SHA256:
```bash
BBB_CHECKSUM_ALGORITHM=sha256
```

### OPCJA 2: Pełna Migracja (Zalecane Długoterminowo) 🟡

Stopniowo zastępuj stary kod nowym używając helperów:

1. Czytaj `MIGRATION_EXAMPLE.js` - pokazuje jak zmieniać kod
2. Zastępuj funkcje jedna po drugiej
3. Testuj każdą zmianę
4. Zobacz sekcję "PLAN MIGRACJI" w `BBB_API_MIGRATION_ANALYSIS.md`

### OPCJA 3: Zostaw Jak Jest (Też OK) 🟢

Jeśli wszystko działa i nie planujesz aktualizacji BBB:
- **Nic nie musisz robić!**
- Kod będzie działał z BBB 2.0-2.7
- SHA1 jest wspierany (choć przestarzały)

---

## 📝 Szybki Start - Test Nowych Narzędzi

### 1. Sprawdź wersję BBB

Uruchom backend i zobacz informacje o serwerze:

```bash
cd proxeon-srv
node app.js
```

Przy starcie zobaczysz:
- Wersję serwera BBB
- Wersję API
- Ostrzeżenia (jeśli są)

### 2. Przetestuj nowy helper (opcjonalnie)

Możesz przetestować nowy sposób generowania URL:

```javascript
// W Node REPL lub osobnym pliku testowym:
const { buildApiUrl } = require('./_helpers/bbb-checksum');

const url = buildApiUrl(
  'https://demo.bigbluebutton.org/bigbluebutton/',
  'isMeetingRunning',
  { meetingID: 'test123' },
  'twój_secret',
  'sha256'  // lub 'sha1'
);

console.log(url);
// Zobaczysz pełny URL z checksum
```

---

## 🔍 Główne Różnice BBB API 2.0 vs 2.6/2.7

### 1. Checksum Algorithm
- **Stary (2.0-2.5)**: SHA1 (wciąż działa)
- **Nowy (2.6+)**: SHA256 lub SHA512 (zalecane)

### 2. POST do `/api/join`
- **Stary**: POST dozwolony
- **Nowy (2.6.18+)**: Tylko GET ✅ (już masz w kodzie!)

### 3. Content-Type dla POST
- **Stary**: Opcjonalny
- **Nowy (2.6.18+)**: Wymagany ✅ (już masz w kodzie!)

### 4. Nowe Parametry w `create`
```javascript
// Teraz możesz dodać:
meetingExpireIfNoUserJoinedInMinutes: 5,
meetingExpireWhenLastUserLeftInMinutes: 1,
groups: JSON.stringify([...])  // dla breakout rooms
```

---

## 📚 Dokumentacja

### Pliki do przeczytania (w kolejności):

1. **`BBB_MIGRATION_README.md`** (ten plik) - Start tutaj
2. **`BBB_API_MIGRATION_ANALYSIS.md`** - Szczegółowa analiza
3. **`MIGRATION_EXAMPLE.js`** - Przykłady kodu
4. **`_helpers/bbb-checksum.js`** - Kod helpera
5. **`_helpers/bbb-version-check.js`** - Kod sprawdzania wersji

### Oficjalna Dokumentacja BBB:

- BBB 2.6: https://docs.bigbluebutton.org/2.6/development/api/
- BBB 2.7: https://docs.bigbluebutton.org/development/api/

---

## ⚙️ Konfiguracja

### Zmienne Środowiskowe (env.local)

```bash
# BigBlueButton
BBB_URL=https://twoj-serwer.com/bigbluebutton/
BBB_SECRET=twoj_secret
BBB_DOWNLOAD_URL=https://twoj-serwer.com/download/presentation/

# Algorytm checksum (nowa zmienna)
BBB_CHECKSUM_ALGORITHM=sha256  # sha1, sha256, lub sha512
```

---

## 🧪 Testowanie

### Test 1: Sprawdź wersję BBB
```bash
cd proxeon-srv
node app.js
# Powinieneś zobaczyć informacje o wersji BBB
```

### Test 2: Utwórz pokój
1. Zaloguj się do frontendu
2. Utwórz pokój
3. Wejdź do pokoju
4. Sprawdź czy wszystko działa

### Test 3: Nagrywanie
1. Rozpocznij spotkanie
2. Nagraj spotkanie
3. Zakończ spotkanie
4. Sprawdź czy nagranie jest dostępne

---

## 🐛 Rozwiązywanie Problemów

### Problem: Backend nie łączy się z BBB

**Rozwiązanie:**
1. Sprawdź `BBB_URL` w `.env`
2. Sprawdź `BBB_SECRET` w `.env`
3. Upewnij się że serwer BBB działa:
   ```bash
   curl https://twoj-serwer.com/bigbluebutton/api
   ```

### Problem: Checksum error

**Rozwiązanie:**
1. Zmień `BBB_CHECKSUM_ALGORITHM` na `sha1`
2. Sprawdź jaką wersję BBB masz
3. BBB 2.0-2.5: użyj `sha1`
4. BBB 2.6+: użyj `sha256`

### Problem: "unsupportedContentType" error

**Rozwiązanie:**
- Dodaj header `Content-Type: text/xml` do POST (już jest w kodzie)
- To dotyczy BBB 2.6.18+ 

### Problem: Join nie działa

**Rozwiązanie:**
- BBB 2.6.18+ nie akceptuje POST do `/api/join`
- Użyj tylko GET (już jest w kodzie)

---

## 📊 Kompatybilność

| Wersja BBB | Obecny Kod | Po Migracji | Uwagi |
|------------|------------|-------------|-------|
| 2.0-2.4    | ✅ Działa  | ✅ Działa   | EOL - zaktualizuj BBB |
| 2.5        | ✅ Działa  | ✅ Działa   | EOL (Sept 2023) |
| 2.6        | ✅ Działa  | ✅ Lepsze   | SHA256 zalecane |
| 2.7        | ✅ Działa  | ✅ Lepsze   | Najnowsza stabilna |
| 2.8+       | ⚠️ Test    | ✅ Powinno  | Wymaga testów |
| 3.0        | ❌ Nie ma  | ❌ Nie ma   | Nie wydane (Nov 2024) |

---

## 🎓 FAQ

### Q: Czy muszę coś zmienić w kodzie?
**A:** Nie! Obecny kod działa. Zmiany są opcjonalne i zalecane dla lepszej kompatybilności.

### Q: Czy SHA256 złamie mój kod?
**A:** Nie, jeśli masz BBB 2.6+. Dla starszych wersji zostaw SHA1.

### Q: Kiedy powinienem migrować?
**A:** Gdy planujesz aktualizację serwera BBB do 2.6+ lub gdy chcesz używać nowych funkcji.

### Q: Czy bigbluebutton-js jest przestarzały?
**A:** Wersja 0.1.0 tak, ale wciąż działa. Możesz pozostać z nią lub przejść na bezpośrednie wywołania API.

### Q: Co to jest BBB 3.0?
**A:** Wersja 3.0 nie została jeszcze oficjalnie wydana (stan: listopad 2024). Najnowsza to 2.7.x.

---

## 📞 Wsparcie

- Dokumentacja BBB: https://docs.bigbluebutton.org/
- Forum BBB: https://groups.google.com/g/bigbluebutton-dev
- GitHub BBB: https://github.com/bigbluebutton/bigbluebutton

---

## 📝 Historia Zmian

### 2024-11-09 - Przygotowanie Migracji
- ✅ Analiza obecnego kodu
- ✅ Utworzenie helperów (checksum, version-check)
- ✅ Dokumentacja migracji
- ✅ Przykłady kodu
- ✅ Dodano sprawdzanie wersji BBB przy starcie

---

## 🚀 Następne Kroki

1. **TERAZ**: Uruchom backend i zobacz wersję BBB
2. **Za tydzień**: Przeczytaj szczegółową analizę
3. **Za miesiąc**: Rozważ migrację na SHA256
4. **Za 3 miesiące**: Zaktualizuj serwer BBB do 2.7+ (jeśli nie masz)
5. **Za 6 miesięcy**: Pełna migracja kodu (opcjonalnie)

---

**Autor:** AI Assistant  
**Data:** Listopad 2024  
**Projekt:** Proxeon v2.0.1


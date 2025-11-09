# BigBlueButton 3.0 - Zmiany API

**Data:** Listopad 2024  
**Status:** ✅ Proxeon jest kompatybilny z BBB 3.0!  
**Dokumentacja:** https://docs.bigbluebutton.org/development/api/

---

## 🎉 Gratulacje!

Twój serwer BBB został zaktualizowany do wersji **3.0**! Proxeon automatycznie wykrywa wersję i dostosowuje API.

---

## 🔍 Automatyczne Wykrywanie Wersji

Aplikacja Proxeon teraz:
- ✅ Automatycznie wykrywa wersję BBB przy starcie
- ✅ Dostosowuje parametry API do wersji 2.x lub 3.0
- ✅ Usuwa przestarzałe parametry dla BBB 3.0
- ✅ Ostrzega o niekompatybilnych funkcjach
- ✅ Loguje dostępne funkcje API

---

## 📋 Główne Zmiany w BBB 3.0

### 🔴 Usunięte Parametry z `create`

Te parametry **NIE DZIAŁAJĄ** w BBB 3.0:

```javascript
// ❌ Usunięte - będą automatycznie usuwane przez Proxeon
{
  breakoutRoomsEnabled: true,           // Funkcja breakout rooms jest teraz zawsze włączona
  learningDashboardEnabled: true,        // Learning dashboard jest teraz domyślny
  virtualBackgroundsDisabled: false      // Wirtualne tła są zarządzane inaczej
}
```

**Co robi Proxeon?**
- Adapter automatycznie usuwa te parametry przy wysyłaniu do BBB 3.0
- Loguje ostrzeżenie jeśli te parametry są używane
- W BBB 2.x parametry działają normalnie

---

### 🟢 Nowe Parametry w `create` (BBB 3.0)

```javascript
{
  // Plugin system
  allowOverrideClientSettingsOnCreateCall: true,  // Pozwala override ustawień klienta
  pluginManifests: [                              // Lista manifestów pluginów
    {
      "url": "https://example.com/plugin.js",
      "checksum": "sha256..."
    }
  ],
  pluginManifestsFetchUrl: "https://...",         // URL do pobierania manifestów
  
  // Prezentacje
  presentationConversionCacheEnabled: true,       // Cache konwersji prezentacji
  maxNumPages: 200,                               // Max liczba stron w prezentacji
  
  // Autentykacja
  loginURL: "https://example.com/login",          // URL logowania zewnętrznego
}
```

---

### 🔄 Zmiany w `meetingLayout` (BBB 3.0)

**Nowe opcje layoutu:**

```javascript
{
  meetingLayout: "CAMERAS_ONLY"            // Tylko kamery (nowe w 3.0)
  meetingLayout: "PARTICIPANTS_CHAT_ONLY"  // Tylko lista uczestników i chat (nowe w 3.0)
  meetingLayout: "PRESENTATION_ONLY"       // Tylko prezentacja (nowe w 3.0)
  meetingLayout: "MEDIA_ONLY"              // Tylko media (nowe w 3.0)
  
  // Stare opcje wciąż działają:
  meetingLayout: "CUSTOM_LAYOUT"
  meetingLayout: "SMART_LAYOUT"
  meetingLayout: "PRESENTATION_FOCUS"
  meetingLayout: "VIDEO_FOCUS"
}
```

---

### 🔴 Zmiany w `join` (BBB 3.0)

**Usunięte:**

```javascript
// ❌ NIE DZIAŁA w BBB 3.0
{
  defaultLayout: "PRESENTATION_FOCUS"  // Usunięty!
}

// ✅ NOWY SPOSÓB w BBB 3.0:
{
  "userdata-bbb_default_layout": "PRESENTATION_FOCUS"  // Używaj tego zamiast
}
```

**Proxeon automatycznie konwertuje:**
- `defaultLayout` → `userdata-bbb_default_layout` dla BBB 3.0
- W BBB 2.x używa starego parametru

**Usunięto także:**
```javascript
{
  "userdata-bbb_ask_for_feedback_on_logout": true  // Nie istnieje w 3.0
}
```

---

### 🟢 Nowe Parametry w `join` (BBB 3.0)

```javascript
{
  bot: true,                                    // Oznacz jako bot
  enforceLayout: "PRESENTATION_ONLY",           // Wymuś layout dla użytkownika
  logoutURL: "https://example.com/logout",      // URL wylogowania
  firstName: "Jan",                             // Imię (opcjonalne)
  lastName: "Kowalski",                         // Nazwisko (opcjonalne)
  
  // Nowe userdata parametry:
  "userdata-bbb_skip_echotest_if_previous_device": true,  // Pomiń test dźwięku
  "userdata-bbb_prefer_dark_theme": true,                 // Preferuj ciemny motyw
  "userdata-bbb_hide_notifications": true,                // Ukryj powiadomienia
  "userdata-bbb_hide_controls": true,                     // Ukryj kontrolki
  "userdata-bbb_initial_selected_tool": "pen",            // Początkowe narzędzie
}
```

---

### ✨ Nowe Endpointy w BBB 3.0

#### 1. `sendChatMessage` - Wyślij wiadomość na chat

```javascript
// Nowy endpoint w BBB 3.0
GET /api/sendChatMessage

Parametry:
- meetingID: string (wymagane)
- message: string (wymagane)
- checksum: string (wymagane)

// Proxeon może to wykorzystać do wysyłania powiadomień na chat
```

#### 2. `getJoinUrl` - Wygeneruj dodatkowy URL join

```javascript
// Nowy endpoint w BBB 3.0
GET /api/getJoinUrl

Parametry:
- sessionToken: string (wymagane)
- sessionName: string (opcjonalne)
- enforceLayout: string (opcjonalne)
- replaceSession: boolean (opcjonalne)
- userdata-*: various (opcjonalne)

// Pozwala wygenerować kolejny URL join dla tego samego użytkownika
// Przydatne dla wielu urządzeń
```

---

### 🔴 Usunięte Endpointy w BBB 3.0

```
❌ /api/enter              - usunięty (był tylko wewnętrzny)
❌ /html5client/check      - usunięty (sprawdzanie zdrowia serwera)
```

**Zastąpione przez:**
```
✅ /api/feedback            - nowy endpoint dla feedback (zastąpił /html5client/feedback)
```

---

### 🎨 Nowe Opcje `disabledFeatures` (BBB 3.0)

W parametrze `disabledFeatures` można teraz wyłączyć więcej funkcji:

```javascript
{
  disabledFeatures: [
    // Stare opcje (działają w 2.x i 3.0):
    "liveTranscription",
    "presentation",
    "chat",
    "sharedNotes",
    "captions",
    "externalVideos",
    "layouts",
    "webcams",
    "polls",
    
    // NOWE w BBB 3.0:
    "infiniteWhiteboard",        // Nieskończona tablica
    "deleteChatMessage",         // Usuwanie wiadomości chat
    "editChatMessage",           // Edycja wiadomości chat
    "replyChatMessage",          // Odpowiadanie na wiadomości
    "chatMessageReactions",      // Reakcje na wiadomości
    "raiseHand",                 // Podnoszenie ręki
    "userReactions",             // Reakcje użytkowników (emoji)
    "chatEmojiPicker",           // Picker emoji w chacie
    "quizzes",                   // Quizy
  ]
}
```

---

## 🔧 Jak Proxeon Obsługuje BBB 3.0

### 1. Automatyczne Wykrywanie

```javascript
// proxeon-srv/app.js - przy starcie
const { checkBBBVersion } = require("_helpers/bbb-version-check");
const { logAPIChanges } = require("_helpers/bbb-api-adapter");

checkBBBVersion()
  .then(() => logAPIChanges())  // Pokazuje dostępne funkcje API
  .catch(error => console.error('Failed to check BBB version:', error));
```

**Wyjście w konsoli:**
```
╔════════════════════════════════════════════╗
║   BigBlueButton Server Information         ║
╠════════════════════════════════════════════╣
║ Server Version:   3.0.0                   ║
║ API Version:      2.0                     ║
║ Build:            2024-11-01              ║
║ URL:              https://h9.sqx.pl/      ║
╚════════════════════════════════════════════╝

🎉 BBB 3.0.0 - Latest version with new features!
   ✅ Full API 3.0 support enabled

╔════════════════════════════════════════════╗
║   BBB API Compatibility Layer              ║
╠════════════════════════════════════════════╣
║ Detected Version: BBB 3.x                 ║
╚════════════════════════════════════════════╝

✅ BBB 3.0 Features Enabled:
   • New endpoints: sendChatMessage, getJoinUrl
   • Advanced meeting layouts support
   • Extended disabledFeatures options
   • Plugin manifests support
   • Presentation caching

⚠️  Deprecated (auto-removed from create):
   • breakoutRoomsEnabled
   • learningDashboardEnabled
   • virtualBackgroundsDisabled

⚠️  Deprecated in join:
   • defaultLayout → userdata-bbb_default_layout
```

---

### 2. Adapter Parametrów

```javascript
// proxeon-srv/_helpers/bbb-api-adapter.js

const { adaptCreateParameters } = require("_helpers/bbb-api-adapter");

// Przed wysłaniem do BBB API:
let params = {
  record: true,
  breakoutRoomsEnabled: true,  // To zostanie usunięte dla BBB 3.0
  muteOnStart: true
};

// Adapter dostosowuje parametry:
params = await adaptCreateParameters(params);

// W BBB 3.0: breakoutRoomsEnabled jest usunięty
// W BBB 2.x: wszystkie parametry pozostają
```

---

### 3. Walidacja Parametrów

```javascript
const { validateCreateParameters } = require("_helpers/bbb-api-adapter");

const validation = await validateCreateParameters(params);

if (validation.warnings.length > 0) {
  console.log('⚠️  BBB API Warnings:');
  validation.warnings.forEach(w => console.log(`   ${w}`));
}

// Przykładowe ostrzeżenia:
// ⚠️  BBB API Warnings:
//    breakoutRoomsEnabled is deprecated in BBB 3.0 (will be removed automatically)
```

---

## 📊 Tabela Kompatybilności

| Funkcja | BBB 2.x | BBB 3.0 | Proxeon |
|---------|---------|---------|---------|
| **create** - record | ✅ | ✅ | ✅ Auto |
| **create** - breakoutRoomsEnabled | ✅ | ❌ | ✅ Auto-usuwany |
| **create** - pluginManifests | ❌ | ✅ | ✅ Gdy BBB 3.0 |
| **join** - defaultLayout | ✅ | ❌ | ✅ Auto-konwertowany |
| **join** - enforceLayout | ❌ | ✅ | ✅ Gdy BBB 3.0 |
| **sendChatMessage** endpoint | ❌ | ✅ | ✅ Wykrywany |
| **getJoinUrl** endpoint | ❌ | ✅ | ✅ Wykrywany |
| SHA256 checksum | ✅ | ✅ | ✅ Zawsze |

---

## 🚀 Nowe Możliwości dla Proxeon

### 1. System Pluginów

Możemy teraz dodawać własne pluginy do BBB:

```javascript
// W createMeeting:
createParams.pluginManifests = [
  {
    url: `https://${process.env.DOMAIN}.pl/plugins/proxeon-branding.js`,
    checksum: "sha256:..."
  }
];
```

### 2. Wysyłanie Wiadomości na Chat

```javascript
// Nowa funkcja w meeting.service.js
async function sendChatMessage(meetingID, message) {
  const url = buildApiUrl(
    process.env.BBB_URL,
    'sendChatMessage',
    { meetingID, message },
    process.env.BBB_SECRET
  );
  
  const response = await fetch(url);
  return response;
}

// Użycie:
await sendChatMessage(meetingID, "Witamy w Proxeon!");
```

### 3. Zaawansowane Layouty

```javascript
// Można teraz wymusić konkretny layout dla użytkownika:
{
  enforceLayout: "PRESENTATION_ONLY",  // Tylko prezentacja
  enforceLayout: "CAMERAS_ONLY",       // Tylko kamery
  enforceLayout: "MEDIA_ONLY",         // Tylko media
}
```

### 4. Wyłączanie Funkcji

```javascript
// Więcej kontroli nad tym co użytkownicy mogą robić:
disabledFeatures: [
  "editChatMessage",      // Nie można edytować wiadomości
  "deleteChatMessage",    // Nie można usuwać wiadomości
  "chatMessageReactions", // Brak reakcji emoji
  "quizzes"              // Brak quizów
]
```

---

## 🧪 Testowanie

### Test 1: Sprawdź Wykrywanie Wersji

```bash
cd /Users/xq/Documents/CODE/Proxeon/proxeon-srv
node app.js
```

Powinieneś zobaczyć:
```
🎉 BBB 3.0.0 - Latest version with new features!
   ✅ Full API 3.0 support enabled
```

### Test 2: Utwórz Spotkanie

1. Zaloguj się do Proxeon
2. Utwórz nowy pokój
3. Rozpocznij spotkanie
4. Sprawdź w logach backendu:
```
🔄 Using BBB 3.0 API parameters (removed deprecated fields)
```

### Test 3: Sprawdź Join URL

1. Wejdź do spotkania
2. URL powinien zawierać `userdata-bbb_default_layout` zamiast `defaultLayout`

---

## 🐛 Rozwiązywanie Problemów

### Problem: "breakoutRoomsEnabled is not working"

**Rozwiązanie:**
- W BBB 3.0 breakout rooms są zawsze włączone
- Parametr `breakoutRoomsEnabled` nie istnieje
- Proxeon automatycznie go usuwa

### Problem: "defaultLayout parameter ignored"

**Rozwiązanie:**
- BBB 3.0 używa `userdata-bbb_default_layout`
- Proxeon automatycznie konwertuje
- Jeśli nie działa, sprawdź logi - może być problem z adapterem

### Problem: "sendChatMessage endpoint not found"

**Rozwiązanie:**
- Ten endpoint istnieje tylko w BBB 3.0
- Sprawdź wersję BBB: `await getBBBMajorVersion()`
- Użyj `isEndpointAvailable('sendChatMessage')` przed wywołaniem

---

## 📝 Aktualizacja Kodu (Opcjonalnie)

Jeśli chcesz wykorzystać nowe funkcje BBB 3.0:

### 1. Dodaj Wysyłanie Wiadomości

```javascript
// W meeting.service.js dodaj:

async function sendWelcomeMessage(meetingID) {
  const bbbVersion = await getBBBMajorVersion();
  
  if (bbbVersion >= 3) {
    const url = buildApiUrl(
      process.env.BBB_URL,
      'sendChatMessage',
      { 
        meetingID, 
        message: "Witamy w spotkaniu Proxeon!" 
      },
      process.env.BBB_SECRET
    );
    
    await fetch(url);
  }
}

// Wywołaj po utworzeniu spotkania:
await sendWelcomeMessage(meeting.meetingID);
```

### 2. Dodaj Obsługę Pluginów

```javascript
// W createMeeting dodaj:

if (bbbVersion >= 3) {
  createParams.pluginManifests = [
    {
      url: `https://${process.env.DOMAIN}.pl/bbb-plugins/branding.js`,
      checksum: "sha256:..."
    }
  ];
}
```

---

## 🎯 Podsumowanie

### ✅ Co Działa Automatycznie:

1. **Wykrywanie wersji** - przy starcie aplikacji
2. **Usuwanie przestarzałych parametrów** - dla BBB 3.0
3. **Konwersja defaultLayout** - na userdata-bbb_default_layout
4. **Walidacja parametrów** - z ostrzeżeniami
5. **Kompatybilność wsteczna** - z BBB 2.x

### 🎁 Nowe Możliwości:

1. **sendChatMessage** - wysyłanie wiadomości programowo
2. **getJoinUrl** - dodatkowe URL dla tego samego użytkownika
3. **Zaawansowane layouty** - CAMERAS_ONLY, PRESENTATION_ONLY, etc.
4. **System pluginów** - własne rozszerzenia BBB
5. **Więcej opcji disabledFeatures** - precyzyjna kontrola funkcji

### 📚 Dokumentacja:

- **Oficjalna:** https://docs.bigbluebutton.org/development/api/
- **Kod adaptera:** `proxeon-srv/_helpers/bbb-api-adapter.js`
- **Wykrywanie wersji:** `proxeon-srv/_helpers/bbb-version-check.js`

---

**Proxeon jest w pełni kompatybilny z BigBlueButton 3.0!** 🎉

Wszystkie zmiany są obsługiwane automatycznie. Możesz spokojnie korzystać z BBB 3.0 bez żadnych zmian w kodzie.


# 🎥 Konfiguracja MP4 dla BigBlueButton 3.0

## 📊 Aktualny Status

- **Serwer BBB:** https://h9.sqx.pl/bigbluebutton/
- **Wersja:** BBB 3.0
- **Format nagrań:** `presentation` (HTML5 playback) ✅
- **Format MP4:** ❌ NIE włączony (wymaga konfiguracji)
- **Proxeon:** ✅ Gotowy do obsługi MP4

---

## 🎬 Formaty Nagrań BBB

### 1. **Presentation** (HTML5 Playback) - AKTUALNIE AKTYWNY
- ✅ Interaktywny odtwarzacz w przeglądarce
- ✅ Zawiera: wideo, audio, slajdy, chat, współdzielenie ekranu
- ✅ Timeline ze wszystkimi aktywnościami
- ❌ Nie można pobrać jako pojedynczy plik
- ❌ Wymaga dostępu do serwera BBB

**URL:** `https://h9.sqx.pl/playback/presentation/2.3/{recordID}`

### 2. **Video** (MP4) - DO WŁĄCZENIA
- ✅ Pojedynczy plik MP4 (H.264 + AAC)
- ✅ Można pobrać i odtworzyć offline
- ✅ Kompatybilność z wszystkimi urządzeniami
- ✅ Można udostępnić przez CDN
- ❌ Brak interaktywności (tylko wideo)
- ❌ Większy rozmiar pliku

**URL:** `https://h9.sqx.pl/download/presentation/{recordID}/{recordID}.mp4`

---

## 🔧 Jak Włączyć MP4 na Serwerze BBB

### Wymagania:
- Dostęp SSH do serwera BBB
- Uprawnienia root/sudo
- BBB 2.6+ lub 3.0

### Krok 1: Edycja konfiguracji `presentation.yml`

```bash
# Zaloguj się do serwera BBB przez SSH
ssh user@h9.sqx.pl

# Edytuj plik konfiguracji
sudo nano /usr/local/bigbluebutton/core/scripts/presentation.yml
```

**Znajdź sekcję `video_formats:` i dodaj `mp4`:**

```yaml
video_formats:
  - webm      # Format domyślny (lekki, szybki)
  - mp4       # Dodaj tę linię! (kompatybilny z wszystkim)
```

### Krok 2: Edycja konfiguracji `video.yml` (opcjonalne dla video)

```bash
sudo nano /usr/local/bigbluebutton/core/scripts/video.yml
```

**Odkomentuj linię MP4:**

```yaml
formats:
  - format: 'webm'
    extension: 'webm'
    mimetype: 'video/webm'
  - format: 'mp4'        # Odkomentuj
    extension: 'mp4'     # Odkomentuj
    mimetype: 'video/mp4' # Odkomentuj
```

### Krok 3: Edycja konfiguracji `screenshare.yml` (dla współdzielenia ekranu)

```bash
sudo nano /usr/local/bigbluebutton/core/scripts/screenshare.yml
```

**Dodaj MP4:**

```yaml
:formats:
  - :mimetype: 'video/webm'
    :extension: webm
  - :mimetype: 'video/mp4'   # Dodaj
    :extension: mp4          # Dodaj
```

### Krok 4: Restart usługi przetwarzania nagrań

```bash
# Restart usługi
sudo systemctl restart bbb-rap-process-worker.service

# Sprawdź status
sudo systemctl status bbb-rap-process-worker.service
```

### Krok 5: Test - Przetwórz ponownie istniejące nagranie (opcjonalne)

```bash
# Lista nagrań
sudo bbb-record --list

# Przetwórz ponownie wybrane nagranie
sudo bbb-record --rebuild <recordID>
```

---

## 🧪 Weryfikacja - Czy MP4 działa?

### Test 1: Utwórz nowe spotkanie z nagrywaniem

1. Zaloguj się do Proxeon
2. Utwórz nowy pokój z nagrywaniem
3. Uruchom spotkanie
4. Nagraj krótką sesję (2-3 minuty)
5. Zakończ spotkanie
6. Poczekaj 5-15 minut na przetworzenie

### Test 2: Sprawdź formaty nagrań przez API

```bash
cd /Users/xq/Documents/CODE/Proxeon/proxeon-srv

node -e "
const sha1 = require('sha1');
const fetch = require('node-fetch');
const convert = require('xml-js');

const request = 'getRecordings';
const checksum = sha1(request + 'bfP1B1nXCSu75PcDsnBbcqWnfcKvJQs5OIGHYTGRcyw');
const url = 'https://h9.sqx.pl/bigbluebutton/api/getRecordings?checksum=' + checksum;

fetch(url)
  .then(r => r.text())
  .then(xml => {
    const result = JSON.parse(convert.xml2json(xml, { compact: true }));
    const recordings = result.response.recordings.recording;
    
    console.log('Formaty dostępne:', recordings[0].playback.format);
  });
"
```

**Powinieneś zobaczyć:**
```
✅ presentation (HTML5)
✅ video (MP4)  ← To oznacza że MP4 działa!
```

### Test 3: Sprawdź bezpośredni link do MP4

```
https://h9.sqx.pl/download/presentation/<recordID>/<recordID>.mp4
```

---

## 📝 Konfiguracja Proxeon (już gotowa!)

Proxeon **już obsługuje MP4** - żadnych zmian nie trzeba:

### Backend (`proxeon-srv/services/meeting.service.js`):

```javascript
// Linia 199-204: Automatyczne zapisywanie linku do MP4
recordingLink: process.env.BBB_DOWNLOAD_URL + 
               decoded.record_id + "/" + 
               decoded.record_id + ".mp4"
```

### Endpoint API:

```
GET /api/meetings/getRecordings
```

**Odpowiedź zawiera:**
```json
{
  "recordings": [
    {
      "recordID": "abc123...",
      "recordingLink": "https://h9.sqx.pl/download/presentation/abc123.../abc123....mp4"
    }
  ]
}
```

---

## ⚠️ Ważne Uwagi

### 1. **Rozmiar plików**
- MP4 zajmuje **2-3x więcej miejsca** niż WebM
- 1 godzina nagrania ≈ 500-800 MB (MP4) vs 200-300 MB (WebM)
- Upewnij się że serwer ma dość miejsca

### 2. **Czas przetwarzania**
- Generowanie MP4 trwa **dłużej** niż WebM
- 1 godzina nagrania = ~10-30 minut przetwarzania
- Zależy od wydajności serwera

### 3. **Kodeki**
- **Video:** H.264 (MP4) / VP9 (WebM)
- **Audio:** AAC (MP4) / Opus (WebM)
- MP4 jest bardziej kompatybilny z urządzeniami mobilnymi

### 4. **Dostęp do plików**
- HTML5 playback: wymaga serwera BBB
- MP4: można pobrać i udostępnić przez CDN
- Rozważ użycie storage (S3, Google Cloud) dla MP4

---

## 🚀 Alternatywy (bez dostępu do serwera BBB)

### Jeśli NIE masz dostępu SSH do h9.sqx.pl:

#### Opcja 1: Poproś administratora serwera
Wyślij mu ten dokument i poproś o włączenie MP4.

#### Opcja 2: Użyj HTML5 Playback
- Proxeon może używać linków do HTML5 playback
- Użytkownicy oglądają nagrania w przeglądarce
- Nie trzeba nic konfigurować

#### Opcja 3: Konwersja post-processing
- Pobierz nagranie w formacie WebM
- Użyj FFmpeg do konwersji na MP4:
```bash
ffmpeg -i recording.webm -c:v libx264 -c:a aac recording.mp4
```

---

## 📚 Dokumentacja

- **BBB 3.0 Recording:** https://docs.bigbluebutton.org/development/recording/
- **BBB API getRecordings:** https://docs.bigbluebutton.org/development/api/#getrecordings
- **BBB Format Configuration:** https://docs.bigbluebutton.org/admin/customize/

---

## ✅ Checklist

- [ ] Dostęp SSH do serwera BBB
- [ ] Edycja `presentation.yml` - dodanie MP4
- [ ] Edycja `video.yml` - odkomentowanie MP4
- [ ] Edycja `screenshare.yml` - dodanie MP4
- [ ] Restart `bbb-rap-process-worker`
- [ ] Test - nowe nagranie
- [ ] Weryfikacja formatu przez API
- [ ] Test pobrania MP4
- [ ] Sprawdzenie rozmiaru plików
- [ ] Monitoring miejsca na dysku

---

**Autor:** AI Assistant  
**Data:** 9 listopada 2025  
**Wersja:** 1.0


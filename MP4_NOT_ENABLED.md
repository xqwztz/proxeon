# ⚠️ MP4 nie jest włączony na serwerze BBB

## 🔍 Problem

Przycisk "Zobacz mp4" w raportach administratora zwraca **404 Not Found**, ponieważ:

1. **MP4 nie jest włączony** na serwerze BBB h9.sqx.pl
2. BBB generuje tylko format **HTML5 Playback** (`presentation`)
3. Format **video (MP4)** nie jest skonfigurowany

## 📊 Przykład

**Nagranie dostępne:**
- ✅ HTML5: https://h9.sqx.pl/playback/presentation/2.3/0a6fdf1ff00406cd8acfac83b6208ae75a3a69b3-1762701527177

**MP4 niedostępny:**
- ❌ MP4: https://h9.sqx.pl/download/presentation/0a6fdf1ff00406cd8acfac83b6208ae75a3a69b3-1762701527177/0a6fdf1ff00406cd8acfac83b6208ae75a3a69b3-1762701527177.mp4
- **Error:** 404 Not Found

## ✅ Co zostało naprawione w Proxeon

### Frontend (`dataReportsTable.jsx`):

1. **Poprawiono ID** - teraz używa `recordID` zamiast `internalMeetingID`
2. **Sprawdzanie dostępności MP4** - przed pokazaniem przycisku
3. **Warunkowe wyświetlanie**:
   - Jeśli MP4 dostępny → pokazuje przycisk "Zobacz mp4"
   - Jeśli MP4 niedostępny → pokazuje "(MP4 niedostępny)"

### Kod:
```javascript
// Check if MP4 format is available
let hasMp4 = false;
if (props.recording.playback && props.recording.playback.format) {
    const formats = Array.isArray(props.recording.playback.format) 
        ? props.recording.playback.format 
        : [props.recording.playback.format];
    hasMp4 = formats.some(f => f.type === 'video' || f.type === 'mp4');
}

// Show button only if MP4 is available
{hasMp4 ? (
    <a href={mp4Url}>Zobacz mp4</a>
) : (
    <span>(MP4 niedostępny)</span>
)}
```

## 🔧 Jak włączyć MP4 na serwerze BBB

**Szczegółowa instrukcja:** Zobacz `BBB_MP4_SETUP.md`

### Szybki przewodnik:

1. **Zaloguj się do serwera BBB przez SSH:**
   ```bash
   ssh user@h9.sqx.pl
   ```

2. **Edytuj konfigurację:**
   ```bash
   sudo nano /usr/local/bigbluebutton/core/scripts/presentation.yml
   ```

3. **Dodaj MP4 do formatów wideo:**
   ```yaml
   video_formats:
     - webm
     - mp4    # ← Dodaj tę linię
   ```

4. **Restart usługi:**
   ```bash
   sudo systemctl restart bbb-rap-process-worker.service
   ```

5. **Przetestuj na nowym nagraniu:**
   - Utwórz nowe spotkanie z nagrywaniem
   - Zakończ spotkanie
   - Poczekaj 10-15 minut na przetworzenie
   - Sprawdź w raportach czy pojawił się przycisk "Zobacz mp4"

## 📝 Weryfikacja

### Sprawdź formaty nagrań przez API:

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
    const recording = result.response.recordings.recording[0];
    console.log('Dostępne formaty:', recording.playback.format);
  });
"
```

**Oczekiwany wynik po włączeniu MP4:**
```javascript
{
  type: 'presentation',  // HTML5 Playback ✅
  url: 'https://h9.sqx.pl/playback/...'
},
{
  type: 'video',         // MP4 ✅
  url: 'https://h9.sqx.pl/download/...'
}
```

**Aktualny wynik (bez MP4):**
```javascript
{
  type: 'presentation',  // Tylko HTML5 ✅
  url: 'https://h9.sqx.pl/playback/...'
}
// Brak formatu 'video' ❌
```

## 🎯 Aktualny Stan

### Proxeon:
- ✅ Kod naprawiony - nie pokazuje przycisku jeśli MP4 niedostępny
- ✅ Poprawny recordID w linkach
- ✅ Elegancka informacja "(MP4 niedostępny)"

### Serwer BBB h9.sqx.pl:
- ✅ BBB 3.0 działa
- ✅ HTML5 Playback działa
- ❌ MP4 nie jest włączony (wymaga konfiguracji serwera)

## 💡 Rekomendacje

1. **Dla użytkowników bez dostępu SSH:**
   - Korzystaj z HTML5 Playback (przycisk "Zobacz nagranie")
   - Działa na wszystkich urządzeniach w przeglądarce

2. **Dla administratorów serwera:**
   - Włącz MP4 zgodnie z instrukcją `BBB_MP4_SETUP.md`
   - Pozwoli to pobierać nagrania offline
   - Zwiększy kompatybilność z urządzeniami mobilnymi

3. **Rozważania:**
   - MP4 zajmuje 2-3x więcej miejsca niż WebM
   - Przetwarzanie trwa dłużej
   - Upewnij się że serwer ma wystarczająco miejsca

## 📚 Dokumentacja

- **BBB 3.0 API:** https://docs.bigbluebutton.org/development/api/
- **Recording Formats:** https://docs.bigbluebutton.org/development/recording/
- **Setup Guide:** `BBB_MP4_SETUP.md`

---

**Data:** 9 listopada 2025  
**Status:** Proxeon naprawiony ✅ | MP4 serwer BBB wymaga konfiguracji ⚠️


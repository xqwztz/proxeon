/**
 * PRZYKŁAD MIGRACJI - Jak zaktualizować kod do BBB API 2.6+
 * 
 * Ten plik pokazuje jak zrefaktoryzować obecny kod aby używał nowych helperów
 * i był kompatybilny z BBB 2.6/2.7+
 */

// ============================================================================
// STARY SPOSÓB (obecnie w kodzie)
// ============================================================================

const sha1 = require("sha1");
const bbb = require("bigbluebutton-js");

async function oldWay_checkMeeting(id, roomID) {
  // Ręczne budowanie URL i checksumu
  let url = process.env.BBB_URL + "api/isMeetingRunning?meetingID=" + id;
  let request = "isMeetingRunningmeetingID=" + id;
  let sha = request + process.env.BBB_SECRET;
  sha = sha1(sha);  // ⚠️ SHA1 jest przestarzały!
  url += "&checksum=" + sha;
  
  let http = bbb.http;
  await http(url).then(async (res) => {
    if (!res.running) {
      // ... logika
    }
  });
}

// ============================================================================
// NOWY SPOSÓB (zalecany)
// ============================================================================

const { buildApiUrl } = require('./_helpers/bbb-checksum');
const fetch = require('node-fetch');
const convert = require('xml-js');

async function newWay_checkMeeting(id, roomID) {
  // Użyj helpera do budowania URL - automatycznie użyje SHA256
  const url = buildApiUrl(
    process.env.BBB_URL,
    'isMeetingRunning',
    { meetingID: id },
    process.env.BBB_SECRET
    // algorytm jest brany z BBB_CHECKSUM_ALGORITHM env
  );

  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    const result = JSON.parse(convert.xml2json(xmlText, { compact: true }));
    
    if (!result.response?.running?._text === 'true') {
      const room = await db.Room.findOne({ id: roomID });
      room.meetingID = null;
      await room.save();
    }
    
    return true;
  } catch (error) {
    console.error('Error checking meeting:', error);
    throw error;
  }
}

// ============================================================================
// PRZYKŁAD 2: Tworzenie linku JOIN
// ============================================================================

// STARY SPOSÓB
async function oldWay_createJoinUrl(meetingID, password, fullName, isModerator) {
  let url = process.env.BBB_URL + "api/join?meetingID=" + meetingID +
            "&password=" + password + "&fullName=" + encodeURIComponent(fullName);
  
  let request = "joinmeetingID=" + meetingID + "&password=" + password + 
                "&fullName=" + encodeURIComponent(fullName);
  
  if (!isModerator) {
    url += "&guest=true";
    request += "&guest=true";
  }
  
  let sha = request + process.env.BBB_SECRET;
  sha = sha1(sha);
  url += "&checksum=" + sha;
  
  return url;
}

// NOWY SPOSÓB
async function newWay_createJoinUrl(meetingID, password, fullName, isModerator) {
  const params = {
    meetingID,
    password,
    fullName,  // buildApiUrl automatycznie zakoduje
  };
  
  if (!isModerator) {
    params.guest = 'true';
  }
  
  return buildApiUrl(
    process.env.BBB_URL,
    'join',
    params,
    process.env.BBB_SECRET
  );
}

// ============================================================================
// PRZYKŁAD 3: Tworzenie spotkania z nowymi parametrami BBB 2.6+
// ============================================================================

async function newWay_createMeeting(params) {
  const axios = require('axios');
  
  // Przygotuj XML z prezentacjami (jak dotychczas)
  let xml = "<?xml version='1.0' encoding='UTF-8'?><modules><module name='presentation'>";
  // ... dodaj slajdy
  xml += "</module></modules>";

  // Nowe parametry BBB 2.6+
  const meetingParams = {
    name: params.name,
    meetingID: params.id,
    attendeePW: params.user_passw,
    moderatorPW: params.admin_passw,
    record: true,
    allowStartStopRecording: true,
    muteOnStart: params.mute_on_start,
    guestPolicy: params.ask_moderator ? 'ASK_MODERATOR' : 'ALWAYS_ACCEPT',
    
    // ✨ NOWE parametry BBB 2.6+
    meetingExpireIfNoUserJoinedInMinutes: 5,  // Auto-koniec jeśli nikt nie dołączył przez 5 min
    meetingExpireWhenLastUserLeftInMinutes: 1, // Auto-koniec 1 min po wyjściu ostatniego
    
    // Callbacks
    'meta_endCallbackUrl': `https://${process.env.DOMAIN}.pl/meetings/meetingEnded?id=${params.roomID}`,
    'meta_bbb-recording-ready-url': `https://${process.env.DOMAIN}.pl/meetings/recordingReady`,
    
    // Opcjonalnie: logo, welcome message
    // 'logo': 'https://example.com/logo.png',
    // 'welcome': 'Witamy w spotkaniu!',
  };

  // Buduj URL dla create
  const createUrl = buildApiUrl(
    process.env.BBB_URL,
    'create',
    meetingParams,
    process.env.BBB_SECRET
  );

  try {
    const response = await axios({
      method: 'post',
      url: createUrl,
      headers: { 'Content-Type': 'text/xml' },  // ✅ WYMAGANE dla BBB 2.6+
      data: xml,
    });

    const obj = JSON.parse(convert.xml2json(response.data, { compact: true }));
    const meetingID = obj.response.meetingID._text;
    
    return { meetingID };
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
}

// ============================================================================
// PRZYKŁAD 4: Pobieranie nagrań
// ============================================================================

// STARY SPOSÓB
async function oldWay_getRecordings(meetingID) {
  let url = process.env.BBB_URL + "api/getRecordings?meetingID=" + meetingID;
  let request = "getRecordingsmeetingID=" + meetingID;
  let sha = request + process.env.BBB_SECRET;
  sha = sha1(sha);
  url += "&checksum=" + sha;
  
  let http = bbb.http;
  const res = await http(url);
  return res.recordings;
}

// NOWY SPOSÓB
async function newWay_getRecordings(meetingID) {
  const url = buildApiUrl(
    process.env.BBB_URL,
    'getRecordings',
    { meetingID, state: 'any' },  // state: 'any' pokaże wszystkie nagrania
    process.env.BBB_SECRET
  );

  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    const result = JSON.parse(convert.xml2json(xmlText, { compact: true }));
    
    if (result.response?.returncode?._text !== 'SUCCESS') {
      return { recordings: [] };
    }
    
    return {
      recordings: result.response.recordings?.recording || [],
      messageKey: result.response.messageKey?._text
    };
  } catch (error) {
    console.error('Error fetching recordings:', error);
    throw error;
  }
}

// ============================================================================
// PRZYKŁAD 5: Inicjalizacja w app.js
// ============================================================================

// Dodaj to do app.js po require dotenv
const { checkBBBVersion } = require('./_helpers/bbb-version-check');

// Sprawdź wersję BBB przy starcie aplikacji
checkBBBVersion().then(versionInfo => {
  if (versionInfo.success) {
    if (versionInfo.warnings.length > 0) {
      console.log('⚠️  Please review BBB compatibility warnings above');
    }
    
    // Opcjonalnie: zablokuj start jeśli wersja jest zbyt stara
    // if (versionInfo.version.startsWith('2.0') || versionInfo.version.startsWith('2.1')) {
    //   console.error('❌ BBB version too old. Please upgrade to 2.6+');
    //   process.exit(1);
    // }
  } else {
    console.error('⚠️  Could not verify BBB server version. App will continue but may have compatibility issues.');
  }
}).catch(error => {
  console.error('Error checking BBB version:', error);
});

// ============================================================================
// MIGRACJA KROK PO KROKU
// ============================================================================

/*
PLAN WDROŻENIA:

1. ✅ Dodaj nowe pliki helper (już zrobione):
   - _helpers/bbb-checksum.js
   - _helpers/bbb-version-check.js

2. ✅ Zaktualizuj env.local (już zrobione):
   - Dodano BBB_CHECKSUM_ALGORITHM=sha256

3. 📝 Zaktualizuj services/meeting.service.js:
   - Zastąp wszystkie sha1() wywołaniami helperem buildApiUrl()
   - Dodaj obsługę błędów
   - Opcjonalnie: dodaj nowe parametry BBB 2.6+

4. 📝 Zaktualizuj services/room.service.js:
   - Zastąp sha1() helperem buildApiUrl()
   - Zachowaj logikę biznesową bez zmian

5. 📝 Zaktualizuj app.js:
   - Dodaj checkBBBVersion() przy starcie

6. 🧪 TESTY:
   - Przetestuj na środowisku developerskim
   - Sprawdź wszystkie endpointy: create, join, getMeetings, getRecordings
   - Zweryfikuj działanie z BBB 2.6+

7. 🚀 DEPLOYMENT:
   - Backup bazy danych
   - Wdrożenie na produkcję
   - Monitorowanie logów

WAŻNE UWAGI:
- Kod jest WSTECZNIE KOMPATYBILNY - działa z BBB 2.0-2.7+
- Możesz zmienić BBB_CHECKSUM_ALGORITHM na 'sha1' jeśli potrzebujesz
- bigbluebutton-js może pozostać w package.json (dla http helpera)
- Wszystkie zmiany są opcjonalne - obecny kod działa, ale SHA256 jest zalecane
*/

module.exports = {
  newWay_checkMeeting,
  newWay_createJoinUrl,
  newWay_createMeeting,
  newWay_getRecordings
};


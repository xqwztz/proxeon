/**
 * BigBlueButton API Adapter
 * 
 * Automatycznie dostosowuje parametry API do wersji BBB (2.x vs 3.0)
 * Zapewnia kompatybilność wsteczną i obsługę nowych funkcji
 * 
 * Dokumentacja BBB 3.0: https://docs.bigbluebutton.org/development/api/
 */

const { getBBBMajorVersion } = require('./bbb-version-check');

/**
 * Dostosowuje parametry create() do wersji BBB
 * 
 * BBB 3.0 usunęło:
 * - breakoutRoomsEnabled
 * - learningDashboardEnabled  
 * - virtualBackgroundsDisabled
 * 
 * BBB 3.0 dodało:
 * - allowOverrideClientSettingsOnCreateCall
 * - loginURL
 * - pluginManifests
 * - presentationConversionCacheEnabled
 * - maxNumPages
 * 
 * @param {object} params - Parametry create
 * @returns {Promise<object>} Dostosowane parametry
 */
async function adaptCreateParameters(params) {
  const bbbVersion = await getBBBMajorVersion();
  const adapted = { ...params };

  if (bbbVersion >= 3) {
    // BBB 3.0 - usuń przestarzałe parametry
    delete adapted.breakoutRoomsEnabled;
    delete adapted.learningDashboardEnabled;
    delete adapted.virtualBackgroundsDisabled;

    // Opcjonalnie: dodaj nowe parametry BBB 3.0 (jeśli są potrzebne)
    // adapted.presentationConversionCacheEnabled = true;
    // adapted.maxNumPages = 200;

    console.log('🔄 Using BBB 3.0 API parameters (removed deprecated fields)');
  } else {
    // BBB 2.x - zachowaj wszystkie parametry
    console.log('🔄 Using BBB 2.x API parameters');
  }

  return adapted;
}

/**
 * Dostosowuje parametry join() do wersji BBB
 * 
 * BBB 3.0 usunęło:
 * - defaultLayout (zastąpione przez userdata-bbb_default_layout)
 * - userdata-bbb_ask_for_feedback_on_logout
 * 
 * BBB 3.0 dodało:
 * - bot
 * - enforceLayout
 * - logoutURL
 * - firstName, lastName
 * - userdata-bbb_default_layout
 * - userdata-bbb_skip_echotest_if_previous_device
 * - userdata-bbb_prefer_dark_theme
 * 
 * @param {object} params - Parametry join
 * @returns {Promise<object>} Dostosowane parametry
 */
async function adaptJoinParameters(params) {
  const bbbVersion = await getBBBMajorVersion();
  const adapted = { ...params };

  if (bbbVersion >= 3) {
    // BBB 3.0 - przekształć defaultLayout na userdata-bbb_default_layout
    if (adapted.defaultLayout) {
      adapted['userdata-bbb_default_layout'] = adapted.defaultLayout;
      delete adapted.defaultLayout;
    }

    // Usuń przestarzałe parametry
    delete adapted['userdata-bbb_ask_for_feedback_on_logout'];

    console.log('🔄 Using BBB 3.0 join parameters');
  }

  return adapted;
}

/**
 * Sprawdza czy endpoint jest dostępny w danej wersji BBB
 * 
 * BBB 3.0 dodało:
 * - sendChatMessage
 * - getJoinUrl
 * 
 * BBB 3.0 usunęło:
 * - enter (używany tylko wewnętrznie)
 * - html5client/check
 * 
 * @param {string} endpoint - Nazwa endpointu
 * @returns {Promise<boolean>} true jeśli endpoint jest dostępny
 */
async function isEndpointAvailable(endpoint) {
  const bbbVersion = await getBBBMajorVersion();

  // Endpointy nowe w BBB 3.0
  const v3Endpoints = ['sendChatMessage', 'getJoinUrl'];
  
  // Endpointy usunięte w BBB 3.0
  const removedInV3 = ['enter', 'html5client/check'];

  if (bbbVersion >= 3) {
    // BBB 3.0
    if (removedInV3.includes(endpoint)) {
      return false;
    }
    return true; // Wszystkie inne endpointy + nowe są dostępne
  } else {
    // BBB 2.x
    if (v3Endpoints.includes(endpoint)) {
      return false; // Nowe endpointy nie są dostępne w 2.x
    }
    return true;
  }
}

/**
 * Pobiera listę dostępnych funkcji dla danej wersji BBB
 * 
 * @returns {Promise<object>} Obiekt z dostępnymi funkcjami
 */
async function getAvailableFeatures() {
  const bbbVersion = await getBBBMajorVersion();

  const features = {
    version: bbbVersion,
    endpoints: {
      sendChatMessage: bbbVersion >= 3,
      getJoinUrl: bbbVersion >= 3,
      enter: bbbVersion < 3,
    },
    parameters: {
      create: {
        // Parametry usunięte w 3.0
        breakoutRoomsEnabled: bbbVersion < 3,
        learningDashboardEnabled: bbbVersion < 3,
        virtualBackgroundsDisabled: bbbVersion < 3,
        
        // Parametry nowe w 3.0
        allowOverrideClientSettingsOnCreateCall: bbbVersion >= 3,
        loginURL: bbbVersion >= 3,
        pluginManifests: bbbVersion >= 3,
        presentationConversionCacheEnabled: bbbVersion >= 3,
        maxNumPages: bbbVersion >= 3,
        
        // Nowe opcje layoutu w 3.0
        advancedLayouts: bbbVersion >= 3, // CAMERAS_ONLY, PARTICIPANTS_CHAT_ONLY, etc.
      },
      join: {
        // Parametry usunięte w 3.0
        defaultLayout: bbbVersion < 3,
        
        // Parametry nowe w 3.0
        bot: bbbVersion >= 3,
        enforceLayout: bbbVersion >= 3,
        logoutURL: bbbVersion >= 3,
        firstName: bbbVersion >= 3,
        lastName: bbbVersion >= 3,
      }
    },
    disabledFeatures: {
      // Opcje dla disabledFeatures w create
      // BBB 3.0 dodało więcej opcji
      infiniteWhiteboard: bbbVersion >= 3,
      deleteChatMessage: bbbVersion >= 3,
      editChatMessage: bbbVersion >= 3,
      replyChatMessage: bbbVersion >= 3,
      chatMessageReactions: bbbVersion >= 3,
      raiseHand: bbbVersion >= 3,
      userReactions: bbbVersion >= 3,
      chatEmojiPicker: bbbVersion >= 3,
      quizzes: bbbVersion >= 3,
    }
  };

  return features;
}

/**
 * Loguje różnice API między wersjami (dla debugowania)
 */
async function logAPIChanges() {
  const bbbVersion = await getBBBMajorVersion();
  
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   BBB API Compatibility Layer              ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║ Detected Version: BBB ${bbbVersion}.x${' '.repeat(19)}║`);
  console.log('╚════════════════════════════════════════════╝');

  if (bbbVersion >= 3) {
    console.log('\n✅ BBB 3.0 Features Enabled:');
    console.log('   • New endpoints: sendChatMessage, getJoinUrl');
    console.log('   • Advanced meeting layouts support');
    console.log('   • Extended disabledFeatures options');
    console.log('   • Plugin manifests support');
    console.log('   • Presentation caching');
    
    console.log('\n⚠️  Deprecated (auto-removed from create):');
    console.log('   • breakoutRoomsEnabled');
    console.log('   • learningDashboardEnabled');
    console.log('   • virtualBackgroundsDisabled');
    
    console.log('\n⚠️  Deprecated in join:');
    console.log('   • defaultLayout → userdata-bbb_default_layout\n');
  } else {
    console.log('\n✅ BBB 2.x Compatibility Mode:');
    console.log('   • All BBB 2.x parameters supported');
    console.log('   • Legacy endpoints available');
    console.log('   • SHA1/SHA256 checksums supported\n');
  }
}

/**
 * Waliduje parametry create przed wysłaniem do API
 * Ostrzega o przestarzałych parametrach
 * 
 * @param {object} params - Parametry do walidacji
 * @returns {Promise<object>} Wynik walidacji { valid: boolean, warnings: [] }
 */
async function validateCreateParameters(params) {
  const bbbVersion = await getBBBMajorVersion();
  const warnings = [];
  let valid = true;

  if (bbbVersion >= 3) {
    // Sprawdź przestarzałe parametry
    if (params.breakoutRoomsEnabled !== undefined) {
      warnings.push('breakoutRoomsEnabled is deprecated in BBB 3.0 (will be removed automatically)');
    }
    if (params.learningDashboardEnabled !== undefined) {
      warnings.push('learningDashboardEnabled is deprecated in BBB 3.0 (will be removed automatically)');
    }
    if (params.virtualBackgroundsDisabled !== undefined) {
      warnings.push('virtualBackgroundsDisabled is deprecated in BBB 3.0 (will be removed automatically)');
    }

    // Sprawdź nowe layout opcje
    if (params.meetingLayout) {
      const validLayouts = [
        'CUSTOM_LAYOUT',
        'SMART_LAYOUT', 
        'PRESENTATION_FOCUS',
        'VIDEO_FOCUS',
        'CAMERAS_ONLY',           // Nowe w 3.0
        'PARTICIPANTS_CHAT_ONLY',  // Nowe w 3.0
        'PRESENTATION_ONLY',       // Nowe w 3.0
        'MEDIA_ONLY'              // Nowe w 3.0
      ];
      
      if (!validLayouts.includes(params.meetingLayout)) {
        warnings.push(`meetingLayout "${params.meetingLayout}" may not be supported`);
      }
    }
  }

  return { valid, warnings };
}

module.exports = {
  adaptCreateParameters,
  adaptJoinParameters,
  isEndpointAvailable,
  getAvailableFeatures,
  logAPIChanges,
  validateCreateParameters
};


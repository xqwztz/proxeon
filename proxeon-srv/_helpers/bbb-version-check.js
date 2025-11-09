/**
 * BigBlueButton Version Check Helper
 * 
 * Sprawdza wersję serwera BBB i wyświetla ostrzeżenia o kompatybilności
 */

const fetch = require("node-fetch");
const convert = require("xml-js");

/**
 * Sprawdza wersję serwera BigBlueButton
 * 
 * @param {string} bbbUrl - URL serwera BBB (opcjonalne, domyślnie z env)
 * @returns {Promise<object>} Obiekt z informacjami o wersji
 */
async function checkBBBVersion(bbbUrl = null) {
  bbbUrl = bbbUrl || process.env.BBB_URL;
  
  if (!bbbUrl) {
    console.error('❌ BBB_URL is not configured');
    return { success: false, error: 'BBB_URL not configured' };
  }

  // Usuń trailing slash
  bbbUrl = bbbUrl.replace(/\/$/, '');

  try {
    const response = await fetch(`${bbbUrl}/api`, {
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // Parse XML response
    const result = JSON.parse(convert.xml2json(xmlText, { compact: true }));
    const version = result.response?.version?._text || 'unknown';
    const apiVersion = result.response?.apiVersion?._text || 'unknown';
    const build = result.response?.build?._text || 'unknown';

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   BigBlueButton Server Information         ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║ Server Version:   ${version.padEnd(24)}║`);
    console.log(`║ API Version:      ${apiVersion.padEnd(24)}║`);
    console.log(`║ Build:            ${build.padEnd(24)}║`);
    console.log(`║ URL:              ${bbbUrl.substring(0, 24).padEnd(24)}║`);
    console.log('╚════════════════════════════════════════════╝\n');

    // Analiza wersji i ostrzeżenia
    const warnings = analyzeVersion(version);
    if (warnings.length > 0) {
      console.log('⚠️  Warnings:');
      warnings.forEach(warning => console.log(`   ${warning}`));
      console.log('');
    } else {
      console.log('✅ BBB version is up to date and compatible\n');
    }

    return {
      success: true,
      version,
      apiVersion,
      build,
      url: bbbUrl,
      warnings,
      isSupported: warnings.length === 0
    };

  } catch (error) {
    console.error('╔════════════════════════════════════════════╗');
    console.error('║   ❌ Failed to connect to BBB Server      ║');
    console.error('╚════════════════════════════════════════════╝');
    console.error(`Error: ${error.message}`);
    console.error(`URL: ${bbbUrl}\n`);

    return {
      success: false,
      error: error.message,
      url: bbbUrl
    };
  }
}

/**
 * Analizuje wersję BBB i zwraca ostrzeżenia
 * 
 * @param {string} version - Wersja BBB (np. "2.7.5")
 * @returns {string[]} Tablica ostrzeżeń
 */
function analyzeVersion(version) {
  const warnings = [];

  if (version === 'unknown') {
    warnings.push('Unable to determine BBB version');
    return warnings;
  }

  try {
    const parts = version.split('.');
    const major = parseInt(parts[0]);
    const minor = parseInt(parts[1]);
    const patch = parseInt(parts[2] || 0);

    // Sprawdź czy to bardzo stara wersja
    if (major < 2) {
      warnings.push(`⛔ BBB ${version} is EXTREMELY outdated (EOL). Upgrade IMMEDIATELY!`);
      warnings.push('   Minimum supported version: 2.6');
      return warnings;
    }

    // BBB 2.0-2.4
    if (major === 2 && minor < 5) {
      warnings.push(`🔴 BBB ${version} is no longer supported (EOL since Sept 2023)`);
      warnings.push('   Recommended: Upgrade to 2.7+ as soon as possible');
      warnings.push('   Your API calls using SHA1 will work but are deprecated');
    }
    // BBB 2.5
    else if (major === 2 && minor === 5) {
      warnings.push(`🟠 BBB ${version} is EOL (End of Life)`);
      warnings.push('   Recommended: Upgrade to 2.7+');
      warnings.push('   SHA256 is recommended for checksums');
    }
    // BBB 2.6
    else if (major === 2 && minor === 6) {
      if (patch < 17) {
        warnings.push(`🟡 BBB ${version} lacks latest security features`);
        warnings.push('   Consider upgrading to 2.6.17+ or 2.7+');
      } else {
        warnings.push(`🟢 BBB ${version} is supported but 2.7+ is recommended`);
      }
      warnings.push('   Make sure to use SHA256 for checksums (not SHA1)');
    }
    // BBB 2.7+
    else if (major === 2 && minor >= 7) {
      // Wszystko OK - najnowsza wersja
    }
    // Przyszłe wersje (2.8+, 3.0)
    else if (major >= 3 || (major === 2 && minor >= 8)) {
      warnings.push(`ℹ️  BBB ${version} is newer than tested version`);
      warnings.push('   API compatibility should be maintained');
      warnings.push('   Test thoroughly before production use');
    }

  } catch (error) {
    warnings.push(`Unable to parse version: ${version}`);
  }

  return warnings;
}

/**
 * Sprawdza czy serwer BBB jest dostępny
 * 
 * @param {string} bbbUrl - URL serwera BBB (opcjonalne)
 * @returns {Promise<boolean>} true jeśli serwer odpowiada
 */
async function isBBBServerAlive(bbbUrl = null) {
  bbbUrl = bbbUrl || process.env.BBB_URL;
  
  try {
    const response = await fetch(`${bbbUrl}/api`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

module.exports = {
  checkBBBVersion,
  analyzeVersion,
  isBBBServerAlive
};


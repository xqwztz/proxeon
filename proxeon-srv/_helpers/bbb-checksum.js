/**
 * BigBlueButton Checksum Helper
 * 
 * Obsługuje generowanie checksum dla BBB API z różnymi algorytmami
 * Kompatybilny z BBB 2.0-2.7+
 */

const crypto = require('crypto');

/**
 * Generuje checksum dla wywołania BBB API
 * 
 * @param {string} queryString - String zapytania (np. "joinmeetingID=abc&password=xyz")
 * @param {string} secret - BBB_SECRET
 * @param {string} algorithm - Algorytm: 'sha1', 'sha256', 'sha512' (domyślnie sha256)
 * @returns {string} Checksum w formacie hex
 */
function generateChecksum(queryString, secret, algorithm = 'sha256') {
  if (!queryString || !secret) {
    throw new Error('Query string and secret are required');
  }

  const supportedAlgorithms = ['sha1', 'sha256', 'sha512'];
  if (!supportedAlgorithms.includes(algorithm)) {
    throw new Error(`Unsupported algorithm: ${algorithm}. Use: ${supportedAlgorithms.join(', ')}`);
  }

  return crypto
    .createHash(algorithm)
    .update(queryString + secret)
    .digest('hex');
}

/**
 * Buduje pełny URL z checksum dla BBB API
 * 
 * @param {string} baseUrl - URL bazowy BBB (np. "https://bbb.example.com/bigbluebutton/")
 * @param {string} endpoint - Endpoint API (np. "join", "create")
 * @param {object} params - Parametry zapytania
 * @param {string} secret - BBB_SECRET
 * @param {string} algorithm - Algorytm checksumu (domyślnie z env lub sha256)
 * @returns {string} Pełny URL z checksum
 */
function buildApiUrl(baseUrl, endpoint, params, secret, algorithm = null) {
  // Użyj algorytmu z env jeśli nie podano
  algorithm = algorithm || process.env.BBB_CHECKSUM_ALGORITHM || 'sha256';

  // Usuń trailing slash z baseUrl
  baseUrl = baseUrl.replace(/\/$/, '');

  // Buduj query string
  const queryParts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      queryParts.push(`${key}=${encodeURIComponent(value)}`);
    }
  }
  const queryString = queryParts.join('&');

  // Generuj checksum (bez znaku zapytania, tylko endpoint + query string)
  const checksumInput = endpoint + (queryString ? queryString : '');
  const checksum = generateChecksum(checksumInput, secret, algorithm);

  // Buduj pełny URL
  const fullUrl = `${baseUrl}/api/${endpoint}${queryString ? '?' + queryString : ''}${queryString ? '&' : '?'}checksum=${checksum}`;

  return fullUrl;
}

module.exports = {
  generateChecksum,
  buildApiUrl
};


const crypto = require("crypto");

// Encryption functions for API keys
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-encryption-key-32-characters";
const IV_LENGTH = 16; // For AES, this is always 16

// Create a 32-byte key from any length input using SHA-256
function getKey(password) {
  return crypto.createHash("sha256").update(String(password)).digest();
}

/**
 * Encrypt text using AES-256-CBC
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text in format "iv:encrypted"
 */
function encrypt(text) {
  // Get a 32-byte key from our variable length password
  const key = getKey(ENCRYPTION_KEY);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Decrypt text using AES-256-CBC
 * @param {string} text - Encrypted text in format "iv:encrypted"
 * @returns {string} - Decrypted text
 */
function decrypt(text) {
  // Get a 32-byte key from our variable length password
  const key = getKey(ENCRYPTION_KEY);
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/**
 * Mask API key for display
 * @param {string} apiKey - API key to mask
 * @returns {string} - Masked API key
 */
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length <= 8) {
    return "****";
  }
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
}

module.exports = {
  encrypt,
  decrypt,
  maskApiKey,
};

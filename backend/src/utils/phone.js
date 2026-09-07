/**
 * Normalizes phone numbers by stripping country codes (+91), trunk prefixes (0),
 * and all formatting characters (spaces, dashes, parens).
 * @param {string|null|undefined} phone
 * @returns {string} Normalized 10-digit or raw numeric string
 */
export function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // If 12 digits starting with 91 (India country code), remove 91
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // Leading trunk 0
    cleaned = cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Checks if two phone numbers are equivalent after normalization.
 * @param {string|null|undefined} phone1
 * @param {string|null|undefined} phone2
 * @returns {boolean}
 */
export function arePhonesEqual(phone1, phone2) {
  const n1 = normalizePhone(phone1);
  const n2 = normalizePhone(phone2);
  if (!n1 || !n2) return false;
  return n1 === n2;
}

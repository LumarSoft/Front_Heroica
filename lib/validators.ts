// ── CUIT / CUIL ───────────────────────────────────────────────────────────────

/** Strips everything except digits from a CUIT/CUIL string. */
export function cuitToDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Returns true when the value contains exactly 11 digits (ignores hyphens/spaces). */
export function isValidCuit(value: string): boolean {
  return cuitToDigits(value).length === 11
}

/**
 * Formats up to 11 digits as XX-XXXXXXXX-X.
 * Pass only the raw digit string (no hyphens).
 */
export function formatCuit(digits: string): string {
  const d = digits.slice(0, 11)
  if (d.length > 10) return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`
  if (d.length > 2) return `${d.slice(0, 2)}-${d.slice(2)}`
  return d
}

/**
 * For use in onChange handlers of CUIT/CUIL inputs.
 * Strips non-digits, enforces the 11-digit cap, and returns the formatted value.
 * Returns null when the input would exceed 11 digits (caller should ignore the event).
 */
export function handleCuitChange(raw: string): string | null {
  const digits = cuitToDigits(raw)
  if (digits.length > 11) return null
  return formatCuit(digits)
}

// ── DNI ───────────────────────────────────────────────────────────────────────

/** Strips everything except digits from a DNI string. */
export function dniToDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Returns true when the value contains exactly 8 digits. */
export function isValidDni(value: string): boolean {
  return dniToDigits(value).length === 8
}

/**
 * For use in onChange handlers of DNI inputs.
 * Strips non-digits and enforces the 8-digit cap.
 * Returns null when the input would exceed 8 digits (caller should ignore the event).
 */
export function handleDniChange(raw: string): string | null {
  const digits = dniToDigits(raw)
  if (digits.length > 8) return null
  return digits
}

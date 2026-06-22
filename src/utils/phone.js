/**
 * Valida teléfono opcional (mismas reglas que el API).
 * @returns {{ ok: boolean, value: string|null, message: string }}
 */
export function validateOptionalPhone(raw) {
  const text = String(raw ?? '').trim()
  if (!text) {
    return { ok: true, value: null, message: '' }
  }
  if (text.length > 50) {
    return { ok: false, value: null, message: 'El teléfono no puede superar 50 caracteres.' }
  }
  if (!/^[\d\s+\-().]+$/.test(text)) {
    return {
      ok: false,
      value: null,
      message: 'El teléfono solo puede contener números, espacios y los símbolos + - ( ).',
    }
  }
  const digits = text.replace(/\D/g, '')
  if (digits.length < 8) {
    return { ok: false, value: null, message: 'El teléfono debe tener al menos 8 dígitos.' }
  }
  if (digits.length > 15) {
    return { ok: false, value: null, message: 'El teléfono no puede tener más de 15 dígitos.' }
  }
  return { ok: true, value: text, message: '' }
}

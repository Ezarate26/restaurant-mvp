const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 15;

export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d+()\-\s]/g, '');
}

export function phoneDigitCount(phone: string): number {
  return phone.replace(/\D/g, '').length;
}

export function isValidPhoneNumber(phone: string): boolean {
  const digits = phoneDigitCount(phone);
  return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS;
}

export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\s+/g, ' ').trim();
}

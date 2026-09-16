/** Normalise email to lowercase trimmed form. */
export function normaliseEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const value = email.trim().toLowerCase();
  return value || null;
}

/** Strip non-digits for comparison; keep leading + for international. */
export function normalisePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, "");
  // UK mobile starting 07 → +447...
  if (/^07\d{9}$/.test(digits.replace(/\D/g, ""))) {
    return `+44${digits.replace(/\D/g, "").slice(1)}`;
  }
  if (digits.startsWith("+")) {
    return `+${digits.slice(1).replace(/\D/g, "")}`;
  }
  const onlyDigits = digits.replace(/\D/g, "");
  return onlyDigits || null;
}

export function displayPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const n = phone.replace(/\D/g, "");
  if (n.startsWith("44") && n.length === 12) {
    return `0${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
  }
  if (n.length === 11 && n.startsWith("07")) {
    return `${n.slice(0, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
  }
  return phone;
}

export function fullName(first: string, last: string): string {
  return `${first} ${last}`.trim();
}

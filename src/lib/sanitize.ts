import DOMPurify from "dompurify";

// Strips ALL HTML/SVG markup, trims surrounding whitespace, and removes null bytes.
export function sanitize(value: string): string {
  return sanitizeInput(value).trim();
}

// Strips ALL HTML/SVG markup and null bytes while preserving user spacing.
export function sanitizeInput(value: string): string {
  const clean = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  return clean.replace(/\0/g, "");
}

export function formatSSN(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

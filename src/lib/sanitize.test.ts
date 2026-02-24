import { formatSSN, formatPhone, sanitize } from "./sanitize";

// ─── formatSSN ────────────────────────────────────────────────────────────────

describe("formatSSN", () => {
  it("returns digits-only for 1–3 digits", () => {
    expect(formatSSN("1")).toBe("1");
    expect(formatSSN("12")).toBe("12");
    expect(formatSSN("123")).toBe("123");
  });

  it("inserts first dash after 3 digits", () => {
    expect(formatSSN("1234")).toBe("123-4");
    expect(formatSSN("12345")).toBe("123-45");
  });

  it("inserts second dash after 5 digits", () => {
    expect(formatSSN("123456")).toBe("123-45-6");
    expect(formatSSN("123456789")).toBe("123-45-6789");
  });

  it("caps at 9 digits (ignores extra input)", () => {
    expect(formatSSN("1234567890")).toBe("123-45-6789");
    expect(formatSSN("12345678901234")).toBe("123-45-6789");
  });

  it("strips non-digit characters before formatting", () => {
    expect(formatSSN("abc123def45xyz6789")).toBe("123-45-6789");
  });

  it("handles already-formatted SSN input", () => {
    expect(formatSSN("123-45-6789")).toBe("123-45-6789");
  });

  it("returns empty string for empty input", () => {
    expect(formatSSN("")).toBe("");
  });

  it("formatSSN extracts only digits — XSS tags are stripped but digits within are kept", () => {
    // '<script>alert(1)</script>' contains the digit '1'
    // formatSSN strips all non-digits, so only '1' remains
    expect(formatSSN("<script>alert(1)</script>")).toBe("1");
  });

  it("strips SQL injection characters", () => {
    expect(formatSSN("'; DROP TABLE--")).toBe("");
  });
});

// ─── formatPhone ─────────────────────────────────────────────────────────────

describe("formatPhone", () => {
  it("returns digits-only for 1–3 digits", () => {
    expect(formatPhone("8")).toBe("8");
    expect(formatPhone("80")).toBe("80");
    expect(formatPhone("801")).toBe("801");
  });

  it("inserts first dash after 3 digits", () => {
    expect(formatPhone("8015")).toBe("801-5");
    expect(formatPhone("801555")).toBe("801-555");
  });

  it("inserts second dash after 6 digits", () => {
    expect(formatPhone("8015551")).toBe("801-555-1");
    expect(formatPhone("8015551234")).toBe("801-555-1234");
  });

  it("caps at 10 digits", () => {
    expect(formatPhone("80155512345")).toBe("801-555-1234");
  });

  it("strips non-digit characters (e.g. parentheses, spaces)", () => {
    expect(formatPhone("(801) 555-1234")).toBe("801-555-1234");
  });

  it("returns empty string for empty input", () => {
    expect(formatPhone("")).toBe("");
  });

  it("strips XSS", () => {
    expect(formatPhone("<b>8015551234</b>")).toBe("801-555-1234");
  });
});

// ─── sanitize ─────────────────────────────────────────────────────────────────

describe("sanitize", () => {
  it("trims leading and trailing whitespace", () => {
    expect(sanitize("  hello  ")).toBe("hello");
  });

  it("trims tabs and newlines", () => {
    expect(sanitize("\t  Jane Doe\n")).toBe("Jane Doe");
  });

  it("strips script tags (XSS)", () => {
    expect(sanitize('<script>alert("xss")</script>')).toBe("");
  });

  it("strips inline event handlers — img tag itself is also removed (ALLOWED_TAGS: [])", () => {
    expect(sanitize("<img src=x onerror=alert(1)>")).toBe("");
  });

  it("strips javascript: URI", () => {
    const result = sanitize('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain("javascript:");
  });

  it("strips data: URI in attributes", () => {
    const result = sanitize(
      '<a href="data:text/html,<script>alert(1)</script>">x</a>',
    );
    expect(result).not.toContain("data:");
  });

  it("strips ALL HTML tags including safe ones (plain-text fields only)", () => {
    expect(sanitize("<b>John</b>")).toBe("John");
  });

  it("preserves plain alphanumeric text", () => {
    expect(sanitize("Jane Doe")).toBe("Jane Doe");
  });

  it("preserves numbers and hyphens (needed for SSN/phone after format)", () => {
    expect(sanitize("123 Main St")).toBe("123 Main St");
  });

  it("returns empty string for empty input", () => {
    expect(sanitize("")).toBe("");
  });

  it("handles null-byte injection gracefully", () => {
    const result = sanitize("hello\x00world");
    expect(result).not.toContain("\x00");
  });
});

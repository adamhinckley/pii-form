# Frontend PII Form with mocked backend

No data is actauly being sent to a database in this app, but either way don't ever sumbit your own PII data on a form unless you know and trust the source and they have a good reason to collect it.

Production-style React form for collecting personally identifiable information (PII) with strong client-side safeguards, accessibility support, and defensive validation.

## Why this form is ideal for frontend PII collection

Handling PII in the browser is mostly about reducing risk before data ever leaves the user’s device. This form is ideal because it combines layered validation, strict sanitization, secure UX defaults, and thorough testing into one flow.

### 1) Defense in depth against bad input

- **Sanitization on input:** Every typed value is sanitized with DOMPurify to strip HTML/SVG markup and null bytes before being stored in form state.
- **Schema validation with Zod:** Inputs are validated with a strict schema (required fields, format checks, and consent requirement).
- **Validation at multiple moments:** Validation runs on both blur and submit, preventing accidental bypasses.
- **Final submit guard:** Form values are parsed again with Zod at submit time before the API mutation runs.

### 2) Safer handling of sensitive fields

- **SSN masking UX:** SSN displays masked by default (`***-**-1234`) and can be temporarily revealed with an eye toggle.
- **Sensitive-field branding:** SSN, DOB, and driver’s license values use branded TypeScript types to reduce accidental misuse.
- **No browser autofill for SSN:** SSN field uses `autocomplete="off"` and mobile-friendly `inputMode="numeric"`.

### 3) Privacy-aware defaults and explicit consent

- **Explicit required consent:** Submission requires a checked consent checkbox (`z.literal(true)`) and starts unchecked by default.
- **No local/session storage usage:** Data is kept in memory during form interaction and sent only on explicit submit.
- **No PII logging behavior:** Test coverage includes checks that sensitive values are not emitted through console logging paths.

### 4) Accessible, trustworthy error handling

- **Inline field errors:** Error messages are attached to inputs with `aria-describedby` and `aria-invalid` states.
- **First invalid field focus:** On invalid submit, focus moves to the first errored input for fast correction.
- **API and field error surfacing:** Global API failures and field-level backend validation errors are displayed clearly.

### 5) Hardened by tests

- **Happy path coverage:** Valid form submission and reset flows are tested.
- **Invalid submit blocking:** Tests verify invalid/missing values do not reach the API.
- **Attack-minded cases:** XSS/injection attempts are tested to confirm sanitization and submit blocking behavior.

## How the form accomplishes the task

1. **Collects PII with controlled inputs** using TanStack Form and typed defaults.
2. **Sanitizes values as users type** with DOMPurify-based helpers.
3. **Validates format + business rules** with Zod (name, address, SSN, phone, DOB, license, consent).
4. **Runs validation on blur and submit** for immediate feedback and secure final checks.
5. **Prevents duplicate submits** by disabling controls and showing pending UI during mutation.
6. **Submits only validated payloads** through TanStack Query mutation to `/api/v1/identity`.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- `@tanstack/react-form`
- `@tanstack/react-query`
- `zod`
- `dompurify`
- Vitest + React Testing Library + MSW

## Scripts

```bash
pnpm dev
pnpm test
pnpm lint
pnpm build
```

## Security notes

- Frontend protections reduce risk but do **not** replace backend validation.
- Backend endpoints must still enforce schema validation, authorization, and audit controls.
- Transport security (HTTPS/TLS) and secure server-side data handling remain mandatory.

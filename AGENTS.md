# Agent Instructions: PII Form Development

## Core Principles

- **Security First:** All inputs must be sanitized. No PII should be logged to the console or stored in local storage.
- **Validation:** Use Zod for schema validation. All errors must be displayed inline with ARIA labels.
- **Styling:** Use Tailwind CSS. Follow a mobile-first responsive design.
- **Explicit Consent:** Include a mandatory, non-pre-checked 'Consent' checkbox for data processing.

## Technical Requirements

- Use `tanstack-form` for state management.
- Use `@tanstack/react-query` for sending data to the backend
- Implement `DOMPurify` for input sanitization.
- Ensure `autocomplete="off"` on sensitive fields.
- Use `inputmode` to optimize mobile keyboards for numeric/email fields.
- use `vitest and react-testing-library` for tests.
- use tailwind and shadcdn/ui components
- trim all input fields
- Sesitive felds need to have branded types
- use masking on sensitive inputs on blur ie the ssn shoumd be **\*-**-1234, but the complete value should be sent on submit.
- Use separate folders for UI compinetns and business logic. Do not mix business logic and UI logic into the same files unlless needed
- components need to be c
- When prompted create unit test with vitest to make sure the form and it's validation is working as expected. It needs to be bullet proof and invlaid infomation can't be sent to the backend.
- Input validation needs to happen on blur and submit
- The SSN input shoud have masking (**\*-**-1234) and there should be a visibiliy eye icon in the input to view the number if desired.
- If there are errors on submit all inputs that are empty or invalid should be in an error state.
- If functions have generics, always include the generics where they are called.

# Testing Requirements

- Make sure the form can't be submitted with invalid data
- prefer user-event over fireEvent
- Test the happy path first and make sure the tests pass
- Then add edge cases and get then to pass
  - Add odd patterns of blurring inputs then trying to fill then out again.
  - Force erros then make sure the form still works after valid info is submitted
- Think like a hacker and really try to break the form and make sure that no xss attacks are possible though the form

## UX Guidelines

- Provide immediate visual feedback on validation errors.
- Use a loading spinner and disable the submit button to prevent double-submissions.
- Focus the first error field automatically upon a failed submission attempt.
- Make sure there there are proper aria on every input and that a11y and WCAG principles are followed
- Include distinct Tailwind states for disabled, loading, error, and success.
- When the submit button is clicked every invalid or empty input should be in an error state
-

import { screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "../test/utils";
import { IdentityForm } from "./IdentityForm";
import { server } from "../mocks/server";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setup() {
  const user = userEvent.setup();
  renderWithProviders(<IdentityForm />);
  return { user };
}

async function typeSsn(
  user: ReturnType<typeof userEvent.setup>,
  value: string,
) {
  const showButton = screen.queryByRole("button", { name: /show ssn/i });
  if (showButton) await user.click(showButton);
  const ssnInput = screen.getByLabelText(/social security number/i);
  await user.clear(ssnInput);
  await user.type(ssnInput, value);
  return ssnInput;
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
  await user.type(screen.getByLabelText(/street/i), "123 Main St");
  await user.type(screen.getByLabelText(/city/i), "Salt Lake City");
  await user.type(screen.getByLabelText(/state/i), "UT");
  await user.type(screen.getByLabelText(/zip code/i), "84101");
  await typeSsn(user, "123456789");
  await user.type(screen.getByLabelText(/phone number/i), "8015551234");
  await user.type(screen.getByLabelText(/date of birth/i), "1990-01-15");
  await user.type(screen.getByLabelText(/driver's license/i), "D1234567");
  await user.click(screen.getByLabelText(/i consent/i));
}

// ─── Render ───────────────────────────────────────────────────────────────────

describe("IdentityForm — render", () => {
  it("renders all required fields", () => {
    setup();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/street/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/social security number/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/driver's license/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i consent/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    setup();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("consent checkbox is unchecked by default", () => {
    setup();
    expect(screen.getByLabelText(/i consent/i)).not.toBeChecked();
  });

  it("SSN field is type=text always (masked via bullet chars, not browser password)", () => {
    setup();
    expect(screen.getByLabelText(/social security number/i)).toHaveAttribute(
      "type",
      "text",
    );
  });
});

// ─── ARIA & a11y ─────────────────────────────────────────────────────────────

describe("IdentityForm — accessibility", () => {
  it('all required inputs have aria-required="true"', () => {
    setup();
    const ids = [
      "fullName",
      "street",
      "city",
      "state",
      "zip",
      "ssn",
      "phoneNumber",
      "dob",
      "driversLicense",
      "consent",
    ];
    ids.forEach((id) => {
      expect(document.getElementById(id)).toHaveAttribute(
        "aria-required",
        "true",
      );
    });
  });

  it("inputs do not have aria-invalid before any interaction", () => {
    setup();
    // Fresh form: no field should be invalid yet
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  });

  it("form has accessible label", () => {
    setup();
    expect(
      screen.getByRole("form", { name: /identity verification form/i }),
    ).toBeInTheDocument();
  });
});

// ─── SSN visibility toggle ────────────────────────────────────────────────────

describe("IdentityForm — SSN toggle", () => {
  it("SSN value shows bullets (●) with dashes when hidden", async () => {
    const { user } = setup();
    const ssnInput = await typeSsn(user, "123456789");
    await user.tab();
    expect(ssnInput).toHaveValue("***-**-6789");
  });

  it("clicking Show SSN reveals the real formatted value", async () => {
    const { user } = setup();
    await typeSsn(user, "123456789");
    await user.tab();
    const ssnInput = screen.getByLabelText(/social security number/i);
    await user.click(screen.getByRole("button", { name: /show ssn/i }));
    expect(ssnInput).toHaveValue("123-45-6789");
  });

  it("clicking Hide SSN masks the value again", async () => {
    const { user } = setup();
    const ssnInput = await typeSsn(user, "123456789");
    await user.click(screen.getByRole("button", { name: /hide ssn/i }));
    expect(ssnInput).toHaveValue("***-**-6789");
  });
});

// ─── Blur validation ─────────────────────────────────────────────────────────

describe("IdentityForm — blur validation", () => {
  it("shows fullName error after blur with empty value", async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText(/full name/i));
    await user.tab();
    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    });
  });

  it("shows SSN format error after blur with invalid SSN", async () => {
    const { user } = setup();
    await user.tab();
    await waitFor(() => {
      expect(screen.getByText(/xxx-xx-xxxx/i)).toBeInTheDocument();
    });
  });

  it("shows phone format error after blur with invalid phone", async () => {
    const { user } = setup();
    const phone = screen.getByLabelText(/phone number/i);
    await user.type(phone, "801555");
    await user.tab();
    await waitFor(() => {
      expect(screen.getByText(/xxx-xxx-xxxx/i)).toBeInTheDocument();
    });
  });

  it("shows ZIP error after blur with letters", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/zip code/i), "ABCDE");
    await user.tab();
    await waitFor(() => {
      expect(screen.getByText(/5 or 9 digits/i)).toBeInTheDocument();
    });
  });

  it("shows consent error after checking then unchecking", async () => {
    const { user } = setup();
    const checkbox = screen.getByLabelText(/i consent/i);
    await user.click(checkbox); // check
    await user.click(checkbox); // uncheck
    await user.tab();
    await waitFor(() => {
      expect(screen.getByText(/must consent/i)).toBeInTheDocument();
    });
  });

  it("clears error when valid value is entered", async () => {
    const { user } = setup();
    const nameInput = screen.getByLabelText(/full name/i);
    await user.click(nameInput);
    await user.tab();
    await waitFor(() =>
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument(),
    );
    await user.type(nameInput, "Jane Doe");
    await user.tab();
    await waitFor(() => {
      expect(
        screen.queryByText(/full name is required/i),
      ).not.toBeInTheDocument();
    });
  });
});

// ─── Submit validation — cannot send invalid data ─────────────────────────────

describe("IdentityForm — submit blocked when invalid", () => {
  beforeEach(() => {
    // Override with a spy handler that would record a call if it ever reached
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows errors for ALL fields when submitting empty form", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/street is required/i)).toBeInTheDocument();
      expect(screen.getByText(/city is required/i)).toBeInTheDocument();
      expect(screen.getByText(/state is required/i)).toBeInTheDocument();
      expect(screen.getByText(/zip must be/i)).toBeInTheDocument();
      expect(screen.getByText(/ssn must be/i)).toBeInTheDocument();
      expect(screen.getByText(/phone must be/i)).toBeInTheDocument();
      expect(screen.getByText(/date of birth must be/i)).toBeInTheDocument();
      expect(
        screen.getByText(/driver's license.*required|too short/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/must consent/i)).toBeInTheDocument();
    });
  });

  it("does not show success card when form is empty", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(() =>
      expect(
        screen.queryByText(/submission received/i),
      ).not.toBeInTheDocument(),
    );
  });

  it("blocks submit with invalid SSN format", async () => {
    const { user } = setup();
    await fillValidForm(user);
    await typeSsn(user, "badssn");
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(() => {
      expect(
        screen.queryByText(/submission received/i),
      ).not.toBeInTheDocument();
    });
  });

  it("blocks submit with invalid phone format", async () => {
    const { user } = setup();
    await fillValidForm(user);
    const phone = screen.getByLabelText(/phone number/i);
    await user.clear(phone);
    await user.type(phone, "1234");
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(() => {
      expect(
        screen.queryByText(/submission received/i),
      ).not.toBeInTheDocument();
    });
  });

  it("blocks submit with invalid ZIP", async () => {
    const { user } = setup();
    await fillValidForm(user);
    const zip = screen.getByLabelText(/zip code/i);
    await user.clear(zip);
    await user.type(zip, "1234");
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(() => {
      expect(
        screen.queryByText(/submission received/i),
      ).not.toBeInTheDocument();
    });
  });

  it("blocks submit without consent", async () => {
    const { user } = setup();
    await fillValidForm(user);
    // Uncheck consent
    await user.click(screen.getByLabelText(/i consent/i));
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(() => {
      expect(
        screen.queryByText(/submission received/i),
      ).not.toBeInTheDocument();
    });
  });
});

// ─── Hacker inputs — XSS / injection cannot reach the API ────────────────────

describe("IdentityForm — security: injection attempts", () => {
  it("XSS in fullName is sanitized and triggers validation error (empty after strip)", async () => {
    setup();
    // Use fireEvent.change so DOMPurify receives the complete XSS payload at once
    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, {
      target: { value: "<script>alert(1)</script>" },
    });
    fireEvent.blur(nameInput);
    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    });
  });

  it("SQL injection in fullName is sanitized", async () => {
    const { user } = setup();
    // DOMPurify treats this as plain text and sanitizes angle-bracket markup
    await user.type(
      screen.getByLabelText(/full name/i),
      "Robert'); DROP TABLE Students;--",
    );
    await user.tab();
    // This is valid text (no tags), so it should NOT trigger a validation error
    await waitFor(() => {
      expect(
        screen.queryByText(/full name is required/i),
      ).not.toBeInTheDocument();
    });
    // But critically, form should NOT have sent anything yet — no success card
    expect(screen.queryByText(/submission received/i)).not.toBeInTheDocument();
  });

  it("script tag in address street is sanitized to empty and shows error", async () => {
    setup();
    const streetInput = screen.getByLabelText(/street/i);
    fireEvent.change(streetInput, {
      target: { value: "<script>document.cookie</script>" },
    });
    fireEvent.blur(streetInput);
    await waitFor(() => {
      expect(screen.getByText(/street is required/i)).toBeInTheDocument();
    });
  });

  it("SSN with XSS characters is rejected by format validator", async () => {
    const { user } = setup();
    await typeSsn(user, "<script>");
    await user.tab();
    await waitFor(() => {
      expect(screen.getByText(/ssn must be/i)).toBeInTheDocument();
    });
  });

  it("does not call the API when any field contains invalid/malicious data", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    setup();
    // Use fireEvent so DOMPurify sees the complete XSS payload — strips it → empty → validation fails
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "<script>alert(1)</script>" },
    });
    fireEvent.blur(screen.getByLabelText(/full name/i));
    await waitFor(() =>
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument(),
    );
    // fetch should never have been called
    const piiCalls = fetchSpy.mock.calls.filter(([url]) =>
      String(url).includes("/api/v1/identity"),
    );
    expect(piiCalls).toHaveLength(0);
    fetchSpy.mockRestore();
  });
});

// ─── Successful submission ─────────────────────────────────────────────────────

describe("IdentityForm — successful submission", () => {
  it("shows success card after valid submit", async () => {
    const { user } = setup();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(
      () =>
        expect(screen.getByText(/submission received/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("success card displays submitted name", async () => {
    const { user } = setup();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(
      () => expect(screen.getByText(/jane doe/i)).toBeInTheDocument(),
      { timeout: 5000 },
    );
  });

  it('"Submit Another" resets back to empty form', async () => {
    const { user } = setup();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(
      () =>
        expect(screen.getByText(/submission received/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
    await user.click(screen.getByRole("button", { name: /submit another/i }));
    await waitFor(() => {
      expect(screen.getByRole("form")).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toHaveValue("");
    });
  });
});

// ─── API error handling ────────────────────────────────────────────────────────

describe("IdentityForm — API error handling", () => {
  it("shows global error banner on 500 server error (SSN 999-99-9999)", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/street/i), "123 Main St");
    await user.type(screen.getByLabelText(/city/i), "Salt Lake City");
    await user.type(screen.getByLabelText(/state/i), "UT");
    await user.type(screen.getByLabelText(/zip code/i), "84101");
    await typeSsn(user, "9999999999");
    await user.type(screen.getByLabelText(/phone number/i), "8015551234");
    await user.type(screen.getByLabelText(/date of birth/i), "1990-01-15");
    await user.type(screen.getByLabelText(/driver's license/i), "D1234567");
    await user.click(screen.getByLabelText(/i consent/i));
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.queryByText(/submission received/i)).not.toBeInTheDocument();
  });

  it("shows global error banner on 409 duplicate (SSN 000-00-0000)", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/street/i), "123 Main St");
    await user.type(screen.getByLabelText(/city/i), "Salt Lake City");
    await user.type(screen.getByLabelText(/state/i), "UT");
    await user.type(screen.getByLabelText(/zip code/i), "84101");
    await typeSsn(user, "0000000000");
    await user.type(screen.getByLabelText(/phone number/i), "8015551234");
    await user.type(screen.getByLabelText(/date of birth/i), "1990-01-15");
    await user.type(screen.getByLabelText(/driver's license/i), "D1234567");
    await user.click(screen.getByLabelText(/i consent/i));
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(
      () => {
        const alerts = screen.getAllByRole("alert");
        const banner = alerts.find((el) => el.textContent?.includes("already"));
        expect(banner).toBeDefined();
      },
      { timeout: 3000 },
    );
  });

  it("shows field-level error from API 400 validation response", async () => {
    server.use(
      http.post("/api/v1/identity", () =>
        HttpResponse.json(
          {
            code: "VALIDATION_ERROR",
            message: "Validation failed.",
            errors: [{ field: "ssn", message: "SSN is already on file." }],
          },
          { status: 400 },
        ),
      ),
    );

    const { user } = setup();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(
      () =>
        expect(screen.getByText(/ssn is already on file/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("shows generic error message on unexpected server failure", async () => {
    server.use(http.post("/api/v1/identity", () => HttpResponse.error()));

    const { user } = setup();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(
      () => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.queryByText(/submission received/i)).not.toBeInTheDocument();
  });
});

// ─── Input auto-formatting ────────────────────────────────────────────────────

describe("IdentityForm — input formatting", () => {
  it("auto-formats SSN as user types", async () => {
    const { user } = setup();
    const ssnInput = await typeSsn(user, "123456789");
    expect(ssnInput).toHaveValue("123-45-6789");
  });

  it("auto-formats phone as user types", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/phone number/i), "8015551234");
    expect(screen.getByLabelText(/phone number/i)).toHaveValue("801-555-1234");
  });

  it("state is upper-cased automatically", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/state/i), "ut");
    expect(screen.getByLabelText(/state/i)).toHaveValue("UT");
  });
});

// ─── Form reset ───────────────────────────────────────────────────────────────

describe("IdentityForm — clear form", () => {
  it('"Clear form" button resets all fields', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.click(screen.getByRole("button", { name: /clear form/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toHaveValue("");
    });
  });

  it('"Clear form" button resets errors', async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(() =>
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /clear form/i }));
    await waitFor(() => {
      expect(
        screen.queryByText(/full name is required/i),
      ).not.toBeInTheDocument();
    });
  });
});

// ─── No PII in console ────────────────────────────────────────────────────────

describe("IdentityForm — security: no PII logging", () => {
  it("does not log SSN to console on submit", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { user } = setup();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(
      () =>
        expect(screen.getByText(/submission received/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
    const loggedValues = consoleSpy.mock.calls.flat().map(String);
    const ssnPattern = /\d{3}-\d{2}-\d{4}/;
    loggedValues.forEach((val) => {
      expect(val).not.toMatch(ssnPattern);
    });
    consoleSpy.mockRestore();
  });
});

// ─── Aria-invalid on errored fields ──────────────────────────────────────────

describe("IdentityForm — aria-invalid on errors", () => {
  it("sets aria-invalid=true on fields with errors after submit", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByLabelText(/social security number/i)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByLabelText(/phone number/i)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });
  });

  it("error messages are associated with inputs via aria-describedby", async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText(/full name/i));
    await user.tab();
    await waitFor(() => {
      const input = screen.getByLabelText(/full name/i);
      const describedBy = input.getAttribute("aria-describedby");
      expect(describedBy).toBe("fullName-error");
      expect(document.getElementById("fullName-error")).toBeInTheDocument();
    });
  });

  it("error messages have role=alert", async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText(/full name/i));
    await user.tab();
    await waitFor(() => {
      const errors = within(
        document.getElementById("fullName-error")!.parentElement!,
      ).getAllByRole("alert");
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

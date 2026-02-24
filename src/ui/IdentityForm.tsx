import { useRef } from "react";
import { useForm } from "@tanstack/react-form";
import { identitySchema, type IdentityFormValues } from "../lib/schema";
import { sanitize, sanitizeInput, formatPhone } from "../lib/sanitize";
import { useSubmitIdentity } from "../lib/useSubmitIdentity";
import { ApiRequestError } from "../api/piiForm";
import { FormField } from "../ui/FormField";
import { SuccessCard } from "../ui/SuccessCard";
import { SSNInput } from "../ui/SSNInput";

const base =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-400 " +
  "focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 " +
  "disabled:bg-gray-100 disabled:cursor-not-allowed";

const errored =
  "w-full rounded-md border border-red-400 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-400 " +
  "focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

function inputClass(hasError: boolean) {
  return hasError ? errored : base;
}

// Runs the same fn on both blur and submit so validation fires at both times.
function fieldValidate<T>(fn: (v: T) => string | undefined) {
  const handler = ({ value }: { value: T }) => fn(value);
  return { onBlur: handler, onSubmit: handler };
}

const DEFAULTS: IdentityFormValues = {
  fullName: "",
  address: { street: "", city: "", state: "", zip: "" },
  ssn: "",
  phoneNumber: "",
  dob: "",
  driversLicense: "",
  consent: false as unknown as true,
};

export function IdentityForm() {
  const mutation = useSubmitIdentity();
  const formRef = useRef<HTMLFormElement>(null);

  function focusFirstError() {
    const first = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );
    first?.focus();
  }

  const form = useForm({
    defaultValues: DEFAULTS,
    onSubmitInvalid: () => {
      focusFirstError();
    },
    onSubmit: async ({ value }) => {
      // Final Zod guard — defence-in-depth even if a field validator is bypassed
      const parsed = identitySchema.safeParse(value);
      if (!parsed.success) return;

      const { consent: _consent, ...payload } = parsed.data;
      void _consent;

      try {
        await mutation.mutateAsync(payload);
      } catch {
        // Error surfaced via mutation.error in render
      }
    },
  });

  if (mutation.isSuccess && mutation.data) {
    return (
      <SuccessCard
        record={mutation.data.data}
        onReset={() => {
          mutation.reset();
          form.reset();
        }}
      />
    );
  }

  const globalError =
    mutation.isError && mutation.error instanceof ApiRequestError
      ? mutation.error.error.message
      : mutation.isError
        ? "An unexpected error occurred. Please try again."
        : null;

  const apiFieldErrors: Record<string, string> =
    mutation.isError && mutation.error instanceof ApiRequestError
      ? Object.fromEntries(
          (mutation.error.error.errors ?? []).map((e) => [e.field, e.message]),
        )
      : {};
  const isSubmitting = mutation.isPending;

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Identity Verification
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Fields marked <span aria-hidden="true">*</span>
          <span className="sr-only">with an asterisk</span> are required. Your
          information is encrypted in transit.
        </p>
      </div>

      {globalError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4"
        >
          <svg
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"
            />
          </svg>
          <p className="text-sm text-red-700">{globalError}</p>
        </div>
      )}

      <form
        ref={formRef}
        noValidate
        aria-label="Identity verification form"
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        {/* Full Name */}
        <form.Field
          name="fullName"
          validators={fieldValidate<string>((value) => {
            const r = identitySchema.shape.fullName.safeParse(sanitize(value));
            return r.success ? undefined : r.error.issues[0].message;
          })}
        >
          {(field) => {
            const err =
              field.state.meta.errors[0] ?? apiFieldErrors["fullName"];
            return (
              <FormField label="Full Name" id="fullName" required error={err}>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  aria-required="true"
                  aria-invalid={!!err}
                  aria-describedby={err ? "fullName-error" : undefined}
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(sanitizeInput(e.target.value))
                  }
                  onBlur={field.handleBlur}
                  disabled={isSubmitting}
                  className={inputClass(!!err)}
                />
              </FormField>
            );
          }}
        </form.Field>

        {/* Address */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-gray-700">
            Address{" "}
            <span aria-hidden="true" className="text-red-500">
              *
            </span>
          </legend>

          <form.Field
            name="address.street"
            validators={fieldValidate<string>((value) => {
              const r = identitySchema.shape.address.shape.street.safeParse(
                sanitize(value).trim(),
              );
              return r.success ? undefined : r.error.issues[0].message;
            })}
          >
            {(field) => {
              const err =
                field.state.meta.errors[0] ?? apiFieldErrors["address.street"];
              return (
                <FormField label="Street" id="street" required error={err}>
                  <input
                    id="street"
                    type="text"
                    autoComplete="street-address"
                    placeholder="123 Main St"
                    aria-required="true"
                    aria-invalid={!!err}
                    aria-describedby={err ? "street-error" : undefined}
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(sanitizeInput(e.target.value))
                    }
                    onBlur={field.handleBlur}
                    disabled={isSubmitting}
                    className={inputClass(!!err)}
                  />
                </FormField>
              );
            }}
          </form.Field>

          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-3">
              <form.Field
                name="address.city"
                validators={fieldValidate<string>((value) => {
                  const r = identitySchema.shape.address.shape.city.safeParse(
                    sanitize(value).trim(),
                  );
                  return r.success ? undefined : r.error.issues[0].message;
                })}
              >
                {(field) => {
                  const err =
                    field.state.meta.errors[0] ??
                    apiFieldErrors["address.city"];
                  return (
                    <FormField label="City" id="city" required error={err}>
                      <input
                        id="city"
                        type="text"
                        autoComplete="address-level2"
                        placeholder="Salt Lake City"
                        aria-required="true"
                        aria-invalid={!!err}
                        aria-describedby={err ? "city-error" : undefined}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(sanitizeInput(e.target.value))
                        }
                        onBlur={field.handleBlur}
                        disabled={isSubmitting}
                        className={inputClass(!!err)}
                      />
                    </FormField>
                  );
                }}
              </form.Field>
            </div>

            <div className="col-span-1">
              <form.Field
                name="address.state"
                validators={fieldValidate<string>((value) => {
                  const r = identitySchema.shape.address.shape.state.safeParse(
                    sanitize(value).trim(),
                  );
                  return r.success ? undefined : r.error.issues[0].message;
                })}
              >
                {(field) => {
                  const err =
                    field.state.meta.errors[0] ??
                    apiFieldErrors["address.state"];
                  return (
                    <FormField label="State" id="state" required error={err}>
                      <input
                        id="state"
                        type="text"
                        autoComplete="address-level1"
                        placeholder="UT"
                        maxLength={2}
                        aria-required="true"
                        aria-invalid={!!err}
                        aria-describedby={err ? "state-error" : undefined}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(
                            sanitizeInput(e.target.value.toUpperCase()),
                          )
                        }
                        onBlur={field.handleBlur}
                        disabled={isSubmitting}
                        className={inputClass(!!err)}
                      />
                    </FormField>
                  );
                }}
              </form.Field>
            </div>

            <div className="col-span-2">
              <form.Field
                name="address.zip"
                validators={fieldValidate<string>((value) => {
                  const r = identitySchema.shape.address.shape.zip.safeParse(
                    sanitize(value).trim(),
                  );
                  return r.success ? undefined : r.error.issues[0].message;
                })}
              >
                {(field) => {
                  const err =
                    field.state.meta.errors[0] ?? apiFieldErrors["address.zip"];
                  return (
                    <FormField label="ZIP Code" id="zip" required error={err}>
                      <input
                        id="zip"
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="84101"
                        maxLength={10}
                        aria-required="true"
                        aria-invalid={!!err}
                        aria-describedby={err ? "zip-error" : undefined}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(sanitizeInput(e.target.value))
                        }
                        onBlur={field.handleBlur}
                        disabled={isSubmitting}
                        className={inputClass(!!err)}
                      />
                    </FormField>
                  );
                }}
              </form.Field>
            </div>
          </div>
        </fieldset>

        {/* SSN + Phone */}
        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="ssn"
            validators={fieldValidate<string>((value) => {
              const r = identitySchema.shape.ssn.safeParse(value);
              return r.success ? undefined : r.error.issues[0].message;
            })}
          >
            {(field) => {
              const err = field.state.meta.errors[0] ?? apiFieldErrors["ssn"];
              return (
                <FormField
                  label="Social Security Number"
                  id="ssn"
                  required
                  error={err}
                  hint="Format: XXX-XX-XXXX"
                >
                  <SSNInput
                    id="ssn"
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    onBlur={field.handleBlur}
                    disabled={isSubmitting}
                    hasError={!!err}
                    ariaDescribedBy={err ? "ssn-error" : "ssn-hint"}
                  />
                </FormField>
              );
            }}
          </form.Field>

          <form.Field
            name="phoneNumber"
            validators={fieldValidate<string>((value) => {
              const r = identitySchema.shape.phoneNumber.safeParse(value);
              return r.success ? undefined : r.error.issues[0].message;
            })}
          >
            {(field) => {
              const err =
                field.state.meta.errors[0] ?? apiFieldErrors["phoneNumber"];
              return (
                <FormField
                  label="Phone Number"
                  id="phoneNumber"
                  required
                  error={err}
                  hint="Format: XXX-XXX-XXXX"
                >
                  <input
                    id="phoneNumber"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="XXX-XXX-XXXX"
                    maxLength={12}
                    aria-required="true"
                    aria-invalid={!!err}
                    aria-describedby={
                      err ? "phoneNumber-error" : "phoneNumber-hint"
                    }
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(formatPhone(e.target.value))
                    }
                    onBlur={field.handleBlur}
                    disabled={isSubmitting}
                    className={inputClass(!!err)}
                  />
                </FormField>
              );
            }}
          </form.Field>
        </div>

        {/* DOB + License */}
        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="dob"
            validators={fieldValidate<string>((value) => {
              const r = identitySchema.shape.dob.safeParse(value);
              return r.success ? undefined : r.error.issues[0].message;
            })}
          >
            {(field) => {
              const err = field.state.meta.errors[0] ?? apiFieldErrors["dob"];
              return (
                <FormField label="Date of Birth" id="dob" required error={err}>
                  <input
                    id="dob"
                    type="date"
                    autoComplete="off"
                    aria-required="true"
                    aria-invalid={!!err}
                    aria-describedby={err ? "dob-error" : undefined}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={isSubmitting}
                    className={inputClass(!!err)}
                  />
                </FormField>
              );
            }}
          </form.Field>

          <form.Field
            name="driversLicense"
            validators={fieldValidate<string>((value) => {
              const r = identitySchema.shape.driversLicense.safeParse(
                sanitize(value).trim(),
              );
              return r.success ? undefined : r.error.issues[0].message;
            })}
          >
            {(field) => {
              const err =
                field.state.meta.errors[0] ?? apiFieldErrors["driversLicense"];
              return (
                <FormField
                  label="Driver's License Number"
                  id="driversLicense"
                  required
                  error={err}
                >
                  <input
                    id="driversLicense"
                    type="text"
                    autoComplete="off"
                    placeholder="D1234567"
                    aria-required="true"
                    aria-invalid={!!err}
                    aria-describedby={err ? "driversLicense-error" : undefined}
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(
                        sanitizeInput(e.target.value.toUpperCase()),
                      )
                    }
                    onBlur={field.handleBlur}
                    disabled={isSubmitting}
                    className={inputClass(!!err)}
                  />
                </FormField>
              );
            }}
          </form.Field>
        </div>

        {/* Consent */}
        <form.Field
          name="consent"
          validators={fieldValidate<boolean>((value) => {
            if (!value)
              return "You must consent to data processing to continue.";
          })}
        >
          {(field) => {
            const err = field.state.meta.errors[0] as string | undefined;
            return (
              <div className="space-y-1">
                <div className="flex items-start gap-3">
                  <input
                    id="consent"
                    type="checkbox"
                    aria-required="true"
                    aria-invalid={!!err}
                    aria-describedby={err ? "consent-error" : undefined}
                    checked={field.state.value as unknown as boolean}
                    onChange={(e) =>
                      field.handleChange(e.target.checked as unknown as true)
                    }
                    onBlur={field.handleBlur}
                    disabled={isSubmitting}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="consent" className="text-sm text-gray-700">
                    I consent to the collection and processing of my personal
                    information for identity verification purposes.{" "}
                    <span aria-hidden="true" className="text-red-500">
                      *
                    </span>
                  </label>
                </div>
                {err && (
                  <p
                    id="consent-error"
                    role="alert"
                    className="text-xs text-red-500"
                  >
                    {err}
                  </p>
                )}
              </div>
            );
          }}
        </form.Field>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={() => {
              form.reset();
              mutation.reset();
            }}
            disabled={isSubmitting}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear form
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && (
              <svg
                aria-hidden="true"
                className="h-4 w-4 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                />
              </svg>
            )}
            {isSubmitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

import { z } from "zod";

// Branded types for sensitive fields
type Brand<T, B extends string> = T & { readonly __brand: B };
type SSNFormat = `${number}-${number}-${number}`;

type PhoneNumberFormat = `${number}-${number}-${number}`;

type DateOfBirthFormat = `${number}-${number}-${number}`;

/** @example 123-45-6789 */
export type SSN = Brand<SSNFormat, "SSN">;

/** @example 801-555-1234 */
export type PhoneNumber = Brand<PhoneNumberFormat, "PhoneNumber">;

/** @example D1234567 */
export type DriversLicense = Brand<string, "DriversLicense">;

/** @example 1990-01-15 */
export type DateOfBirth = Brand<DateOfBirthFormat, "DateOfBirth">;

const ssnSchema = z
  .string()
  .regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in XXX-XX-XXXX format.")
  .transform((v) => v as SSN);

const phoneSchema = z
  .string()
  .regex(/^\d{3}-\d{3}-\d{4}$/, "Phone must be in XXX-XXX-XXXX format.")
  .transform((v) => v as PhoneNumber);

const dobSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be a valid date.")
  .refine((v) => !isNaN(new Date(v).getTime()), "Date of birth is not valid.")
  .transform((v) => v as DateOfBirth);

const licenseSchema = z
  .string()
  .min(4, "Driver's license number is too short.")
  .transform((v) => v as DriversLicense);

export const identitySchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(100),
  address: z.object({
    street: z.string().trim().min(1, "Street is required."),
    city: z.string().trim().min(1, "City is required."),
    state: z
      .string()
      .trim()
      .min(2, "State is required.")
      .max(2, "Use 2-letter state abbreviation."),
    zip: z
      .string()
      .trim()
      .regex(
        /^\d{5}(-\d{4})?$/,
        "ZIP must be 5 or 9 digits (e.g. 84101 or 84101-1234).",
      ),
  }),
  ssn: ssnSchema,
  phoneNumber: phoneSchema,
  dob: dobSchema,
  driversLicense: licenseSchema,
  consent: z.literal(true, {
    error: "You must consent to data processing to continue.",
  }),
});

export type IdentityFormValues = z.input<typeof identitySchema>;
export type IdentityFormOutput = z.output<typeof identitySchema>;

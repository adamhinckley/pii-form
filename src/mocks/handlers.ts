import { http, HttpResponse, delay } from "msw";
import type {
  IdentityFormData,
  IdentityRecord,
  ApiError,
  FieldError,
} from "../api/types";

const store = new Map<string, IdentityRecord>();

// Use shorter delays in test/node environment so tests run fast
const IS_TEST = import.meta.env.MODE === "test";
const SUBMIT_DELAY = IS_TEST ? 0 : 800;
const GET_DELAY = IS_TEST ? 0 : 400;
const HEALTH_DELAY = IS_TEST ? 0 : 100;

function uuid() {
  return crypto.randomUUID();
}

function validateIdentity(data: Partial<IdentityFormData>): FieldError[] {
  const errors: FieldError[] = [];

  if (!data.fullName?.trim()) {
    errors.push({ field: "fullName", message: "Full name is required." });
  }

  if (!data.address?.street?.trim()) {
    errors.push({ field: "address.street", message: "Street is required." });
  }
  if (!data.address?.city?.trim()) {
    errors.push({ field: "address.city", message: "City is required." });
  }
  if (!data.address?.state?.trim()) {
    errors.push({ field: "address.state", message: "State is required." });
  }
  if (!data.address?.zip?.trim()) {
    errors.push({ field: "address.zip", message: "ZIP code is required." });
  } else if (!/^\d{5}(-\d{4})?$/.test(data.address.zip)) {
    errors.push({
      field: "address.zip",
      message: "ZIP must be 5 or 9 digits (e.g. 84101 or 84101-1234).",
    });
  }

  if (!data.ssn?.trim()) {
    errors.push({ field: "ssn", message: "SSN is required." });
  } else if (!/^\d{3}-\d{2}-\d{4}$/.test(data.ssn)) {
    errors.push({
      field: "ssn",
      message: "SSN must be in XXX-XX-XXXX format.",
    });
  }

  if (!data.phoneNumber?.trim()) {
    errors.push({ field: "phoneNumber", message: "Phone number is required." });
  } else if (!/^\d{3}-\d{3}-\d{4}$/.test(data.phoneNumber)) {
    errors.push({
      field: "phoneNumber",
      message: "Phone must be in XXX-XXX-XXXX format.",
    });
  }

  if (!data.dob?.trim()) {
    errors.push({ field: "dob", message: "Date of birth is required." });
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dob)) {
    errors.push({
      field: "dob",
      message: "Date of birth must be in YYYY-MM-DD format.",
    });
  } else {
    const parsed = new Date(data.dob);
    if (isNaN(parsed.getTime())) {
      errors.push({
        field: "dob",
        message: "Date of birth is not a valid date.",
      });
    }
  }

  if (!data.driversLicense?.trim()) {
    errors.push({
      field: "driversLicense",
      message: "Driver's license number is required.",
    });
  } else if (data.driversLicense.trim().length < 4) {
    errors.push({
      field: "driversLicense",
      message: "Driver's license number is too short.",
    });
  }

  return errors;
}

export const handlers = [
  // Health check
  http.get("/api/v1/health", async () => {
    await delay(HEALTH_DELAY);
    return HttpResponse.json({
      data: { status: "ok" },
      message: "Service is healthy.",
    });
  }),

  // Submit identity form
  http.post("/api/v1/identity", async ({ request }) => {
    await delay(SUBMIT_DELAY);

    // Simulate intermittent 500 server error (~10% of the time)
    // Use SSN "999-99-9999" to reliably trigger a server error for testing
    let body: Partial<IdentityFormData>;
    try {
      body = (await request.json()) as Partial<IdentityFormData>;
    } catch {
      const err: ApiError = {
        code: "BAD_REQUEST",
        message: "Invalid JSON body.",
      };
      return HttpResponse.json(err, { status: 400 });
    }

    if (body.ssn === "999-99-9999") {
      const err: ApiError = {
        code: "INTERNAL_ERROR",
        message: "An unexpected server error occurred. Please try again.",
      };
      return HttpResponse.json(err, { status: 500 });
    }

    // Use SSN "000-00-0000" to trigger a duplicate submission error for testing
    if (body.ssn === "000-00-0000") {
      const err: ApiError = {
        code: "DUPLICATE_SUBMISSION",
        message: "A record with this SSN already exists.",
        errors: [{ field: "ssn", message: "This SSN is already on file." }],
      };
      return HttpResponse.json(err, { status: 409 });
    }

    const fieldErrors = validateIdentity(body);
    if (fieldErrors.length > 0) {
      const err: ApiError = {
        code: "VALIDATION_ERROR",
        message: "Validation failed. Please correct the highlighted fields.",
        errors: fieldErrors,
      };
      return HttpResponse.json(err, { status: 400 });
    }

    const record: IdentityRecord = {
      id: uuid(),
      submittedAt: new Date().toISOString(),
      status: "pending",
      ...(body as IdentityFormData),
    };
    store.set(record.id, record);

    return HttpResponse.json(
      { data: record, message: "Identity record submitted successfully." },
      { status: 201 },
    );
  }),

  // Get identity record by ID
  http.get("/api/v1/identity/:id", async ({ params }) => {
    await delay(GET_DELAY);
    const id = params.id as string;
    const record = store.get(id);

    if (!record) {
      const err: ApiError = {
        code: "NOT_FOUND",
        message: `No record found with id "${id}".`,
      };
      return HttpResponse.json(err, { status: 404 });
    }

    return HttpResponse.json({ data: record, message: "Record retrieved." });
  }),
];

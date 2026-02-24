import type {
  DateOfBirth,
  DriversLicense,
  PhoneNumber,
  SSN,
} from "../lib/schema";

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface IdentityFormData {
  fullName: string;
  address: Address;
  ssn: SSN; // format: XXX-XX-XXXX
  phoneNumber: PhoneNumber; // format: XXX-XXX-XXXX
  dob: DateOfBirth; // format: YYYY-MM-DD
  driversLicense: DriversLicense;
}

export interface IdentityRecord extends IdentityFormData {
  id: string;
  submittedAt: string;
  status: "pending" | "verified" | "failed";
}

export interface ApiSuccess<T> {
  data: T;
  message: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  errors?: FieldError[];
}

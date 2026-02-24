import { useEffect, useState } from "react";
import { formatSSN } from "../lib/sanitize";

const base =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 shadow-sm placeholder-gray-400 " +
  "focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 " +
  "disabled:bg-gray-100 disabled:cursor-not-allowed";

const errored =
  "w-full rounded-md border border-red-400 bg-white px-3 py-2 pr-10 text-sm text-gray-900 shadow-sm placeholder-gray-400 " +
  "focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

function formatMaskedSSN(raw: string): string {
  if (raw.length <= 3) return raw;
  if (raw.length <= 5) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
  return `${raw.slice(0, 3)}-${raw.slice(3, 5)}-${raw.slice(5)}`;
}

function getHiddenDisplayValue(normalizedValue: string): string {
  const digits = normalizedValue.replace(/\D/g, "");
  const maskedPrefixLength = Math.min(5, digits.length);
  const maskedDigits = `${"*".repeat(maskedPrefixLength)}${digits.slice(maskedPrefixLength)}`;

  return formatMaskedSSN(maskedDigits);
}

interface SSNInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
  hasError: boolean;
  ariaDescribedBy?: string;
}

export function SSNInput({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  hasError,
  ariaDescribedBy,
}: SSNInputProps) {
  const [visible, setVisible] = useState(false);
  const normalizedValue = formatSSN(value);

  useEffect(() => {
    if (value !== normalizedValue) {
      onChange(normalizedValue);
    }
  }, [value, normalizedValue, onChange]);

  // When hidden, mask all but the last 4 digits while preserving dashes
  const displayValue = visible
    ? normalizedValue
    : getHiddenDisplayValue(normalizedValue);

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="XXX-XX-XXXX"
        maxLength={11}
        aria-required="true"
        aria-invalid={hasError}
        aria-describedby={ariaDescribedBy}
        value={displayValue}
        onChange={(e) => {
          if (visible) {
            onChange(formatSSN(e.target.value));
            return;
          }

          const inputEvent = e.nativeEvent as InputEvent;
          const prevDigits = normalizedValue.replace(/\D/g, "");
          const insertedDigits = (inputEvent.data ?? "").replace(/\D/g, "");

          if (inputEvent.inputType?.startsWith("delete")) {
            const nextDigits = prevDigits.slice(
              0,
              Math.max(0, prevDigits.length - 1),
            );
            onChange(formatSSN(nextDigits));
            return;
          }

          if (insertedDigits.length > 0) {
            onChange(formatSSN((prevDigits + insertedDigits).slice(0, 9)));
          }
        }}
        onPaste={(e) => {
          if (visible) {
            return;
          }

          e.preventDefault();
          const prevDigits = normalizedValue.replace(/\D/g, "");
          const pastedDigits = e.clipboardData
            .getData("text")
            .replace(/\D/g, "");

          if (pastedDigits.length > 0) {
            onChange(formatSSN((prevDigits + pastedDigits).slice(0, 9)));
          }
        }}
        onBlur={() => {
          setVisible(false);
          onBlur();
        }}
        disabled={disabled}
        className={hasError ? errored : base}
      />
      <button
        type="button"
        aria-label={visible ? "Hide SSN" : "Show SSN"}
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()} // prevent blur firing before click
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
      >
        {visible ? (
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

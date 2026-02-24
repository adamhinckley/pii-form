import type { IdentityRecord } from '../api/types';

interface SuccessCardProps {
  record: IdentityRecord;
  onReset: () => void;
}

export function SuccessCard({ record, onReset }: SuccessCardProps) {
  return (
    <section
      aria-labelledby="success-heading"
      className="mx-auto max-w-lg rounded-xl border border-green-200 bg-green-50 p-8 text-center shadow-sm"
    >
      <div className="mb-4 flex justify-center" aria-hidden="true">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      </div>
      <h2 id="success-heading" className="mb-2 text-xl font-semibold text-green-800">
        Submission Received
      </h2>
      <p className="mb-1 text-sm text-green-700">
        Your identity record has been submitted successfully.
      </p>
      <p className="mb-6 font-mono text-xs text-green-600">Record ID: {record.id}</p>
      <dl className="mb-6 rounded-lg border border-green-200 bg-white p-4 text-left text-sm text-gray-700 space-y-1">
        <div className="flex gap-2">
          <dt className="font-medium">Name:</dt>
          <dd>{record.fullName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">DOB:</dt>
          <dd>{record.dob}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Phone:</dt>
          <dd>{record.phoneNumber}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Status:</dt>
          <dd>
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              {record.status}
            </span>
          </dd>
        </div>
      </dl>
      <button
        onClick={onReset}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Submit Another
      </button>
    </section>
  );
}

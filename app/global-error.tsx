'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center p-6 font-sans text-center bg-gray-50 text-gray-900">
        <div className="max-w-md w-full space-y-4">
          <h1 className="text-3xl font-bold">Application Error</h1>
          <p className="text-gray-600 text-sm">
            A critical system error occurred. Please refresh the page or try again.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

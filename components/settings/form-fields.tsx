import type { ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/components/ui/utils";

export const fieldInputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 aria-[invalid=true]:border-red-400";

export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-800">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      )}
    </div>
  );
}

export function SettingsSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <header className="mb-5">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
      </header>
      {children}
    </section>
  );
}

export function FormActions({ isDirty, isSaving, onReset }: { isDirty: boolean; isSaving: boolean; onReset: () => void }) {
  return (
    <div className="flex flex-col-reverse items-stretch gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
      {isDirty && <span className="text-xs text-amber-700 sm:mr-auto">You have unsaved changes</span>}
      <button
        type="button"
        onClick={onReset}
        disabled={!isDirty || isSaving}
        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
      >
        Discard
      </button>
      <button
        type="submit"
        disabled={!isDirty || isSaving}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#000F24] px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </button>
    </div>
  );
}

export function SettingsLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading settings">
      <div className="h-6 w-48 animate-pulse rounded bg-zinc-100" />
      <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
    </div>
  );
}

export function SettingsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center">
      <AlertCircle className="h-6 w-6 text-red-500" />
      <p className="text-sm font-medium text-zinc-900">Couldn&apos;t load these settings</p>
      <p className="text-xs text-zinc-500">{message}</p>
      <button type="button" onClick={onRetry} className="mt-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50">
        Try again
      </button>
    </div>
  );
}

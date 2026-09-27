"use client";

import { type SelectHTMLAttributes } from "react";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SelectProps<T extends string = string>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  /** Shows a small dot or indicator before the label — useful for status selects */
  icon?: React.ReactNode;
}

export function Select<T extends string = string>({
  options,
  value,
  onChange,
  placeholder,
  label,
  icon,
  className = "",
  id,
  ...rest
}: SelectProps<T>) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium text-zinc-500 uppercase tracking-wide"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="pointer-events-none absolute left-3 text-zinc-400">
            {icon}
          </span>
        )}
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={`
            w-full h-9 appearance-none rounded-xl border border-zinc-200 bg-white
            pr-8 text-sm text-zinc-800
            focus:outline-none focus:ring-2 focus:ring-[#55C2FF] focus:border-transparent
            transition-shadow cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? "pl-9" : "pl-3"}
          `}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled={false}>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom chevron */}
        <span className="pointer-events-none absolute right-2.5 text-zinc-400">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}

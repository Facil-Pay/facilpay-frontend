"use client";

interface DateRangeInputProps {
  label?: string;
  fromValue: string;
  toValue: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  className?: string;
}

export function DateRangeInput({
  label,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  className = "",
}: DateRangeInputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          aria-label="Date from"
          value={fromValue}
          max={toValue || undefined}
          onChange={(e) => onFromChange(e.target.value)}
          className="
            h-9 flex-1 min-w-0 rounded-xl border border-zinc-200 bg-white px-3
            text-sm text-zinc-800 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-[#55C2FF] focus:border-transparent
            transition-shadow
          "
        />
        <span className="text-xs text-zinc-400 shrink-0">to</span>
        <input
          type="date"
          aria-label="Date to"
          value={toValue}
          min={fromValue || undefined}
          onChange={(e) => onToChange(e.target.value)}
          className="
            h-9 flex-1 min-w-0 rounded-xl border border-zinc-200 bg-white px-3
            text-sm text-zinc-800 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-[#55C2FF] focus:border-transparent
            transition-shadow
          "
        />
      </div>
    </div>
  );
}

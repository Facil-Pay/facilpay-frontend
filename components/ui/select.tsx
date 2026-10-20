"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "./utils";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      {...props}
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children}
      <SelectPrimitive.Icon asChild><ChevronDown className="size-4 text-muted" aria-hidden="true" /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = "popper", ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        {...props}
        ref={ref}
        position={position}
        className={cn("z-50 max-h-80 min-w-32 overflow-hidden rounded-md border border-border bg-card text-foreground shadow-lg", className)}
      >
        <SelectPrimitive.ScrollUpButton className="flex justify-center py-1 text-muted"><ChevronUp className="size-4" /></SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex justify-center py-1 text-muted"><ChevronDown className="size-4" /></SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      {...props}
      ref={ref}
      className={cn("relative flex cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-primary/15 data-[disabled]:opacity-50", className)}
    >
      <span className="absolute left-2 flex size-4 items-center justify-center"><SelectPrimitive.ItemIndicator><Check className="size-4" /></SelectPrimitive.ItemIndicator></span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export function SimpleSelect<T extends string = string>({
  options,
  value,
  onChange,
  placeholder,
  label,
  icon,
  className = "",
  id,
  ...rest
}: {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("flex flex-col gap-1", className)}>
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
          className="w-full h-9 appearance-none rounded-xl border border-zinc-200 bg-white pr-8 pl-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#55C2FF] focus:border-transparent transition-shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 text-zinc-400">
          <ChevronDown className="size-4" />
        </span>
      </div>
    </div>
  );
}
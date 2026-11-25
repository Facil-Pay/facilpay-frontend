"use client";

/**
 * CheckoutFieldsForm.tsx
 *
 * Lets merchants configure extra data-collection fields that appear on the
 * hosted checkout and payment-link pages (issue #125).
 */

import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { CheckoutField, CheckoutFieldType } from "@/lib/types/settings";
import {
  SettingsSection,
  FormActions,
  SettingsLoading,
} from "./form-fields";
import { CheckoutPreviewWithFields } from "./CheckoutPreview";

// ─── Types ────────────────────────────────────────────────────────────────────

const FIELD_TYPE_LABELS: Record<CheckoutFieldType, string> = {
  text: "Text",
  email: "Email",
  phone: "Phone",
  address: "Address",
  dropdown: "Dropdown",
};

const DEFAULT_FIELDS: CheckoutField[] = [
  { id: "field_email", type: "email", label: "Email address", placeholder: "you@example.com", required: true },
  { id: "field_phone", type: "phone", label: "Phone number", placeholder: "+1 555 000 0000", required: false },
];

// ─── Single field editor ──────────────────────────────────────────────────────

function FieldEditor({
  field,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  field: CheckoutField;
  index: number;
  total: number;
  onChange: (f: CheckoutField) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 shrink-0 text-zinc-400 cursor-grab" aria-hidden="true" />
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Field {index + 1}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label="Move field up"
            className="rounded p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label="Move field down"
            className="rounded p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove field"
            className="rounded p-1 text-rose-400 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Label */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Label</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
            placeholder="e.g. Customer email"
            className={inputClass}
          />
        </div>

        {/* Type */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Type</label>
          <select
            value={field.type}
            onChange={(e) => onChange({ ...field, type: e.target.value as CheckoutFieldType })}
            className={inputClass}
          >
            {(Object.keys(FIELD_TYPE_LABELS) as CheckoutFieldType[]).map((t) => (
              <option key={t} value={t}>
                {FIELD_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {/* Placeholder */}
        {field.type !== "address" && field.type !== "dropdown" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">Placeholder (optional)</label>
            <input
              type="text"
              value={field.placeholder ?? ""}
              onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
              placeholder="e.g. Enter your email"
              className={inputClass}
            />
          </div>
        )}

        {/* Dropdown options */}
        {field.type === "dropdown" && (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Options (one per line, format: value|Label)
            </label>
            <textarea
              rows={3}
              value={(field.options ?? []).map((o) => `${o.value}|${o.label}`).join("\n")}
              onChange={(e) => {
                const options = e.target.value
                  .split("\n")
                  .map((line) => {
                    const [value, ...rest] = line.split("|");
                    return { value: value.trim(), label: rest.join("|").trim() || value.trim() };
                  })
                  .filter((o) => o.value);
                onChange({ ...field, options });
              }}
              placeholder={"us|United States\nuk|United Kingdom"}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Required toggle */}
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
        <span
          role="checkbox"
          aria-checked={field.required}
          tabIndex={0}
          onClick={() => onChange({ ...field, required: !field.required })}
          onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") onChange({ ...field, required: !field.required }); }}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${field.required ? "bg-sky-500" : "bg-zinc-300"}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 translate-x-1 transform rounded-full bg-white shadow transition-transform ${field.required ? "translate-x-4" : ""}`}
          />
        </span>
        Required
      </label>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function CheckoutFieldsForm({ initial }: { initial: CheckoutField[] }) {
  const [fields, setFields] = useState<CheckoutField[]>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const toast = useToast();

  const update = (newFields: CheckoutField[]) => {
    setFields(newFields);
    setIsDirty(true);
  };

  const addField = () => {
    const id = `field_${Date.now().toString(36)}`;
    update([...fields, { id, type: "text", label: "", placeholder: "", required: false }]);
  };

  const removeField = (idx: number) => update(fields.filter((_, i) => i !== idx));

  const changeField = (idx: number, f: CheckoutField) =>
    update(fields.map((existing, i) => (i === idx ? f : existing)));

  const moveField = (idx: number, direction: "up" | "down") => {
    const arr = [...fields];
    const target = direction === "up" ? idx - 1 : idx + 1;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    update(arr);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation: each field must have a label
    const invalid = fields.find((f) => !f.label.trim());
    if (invalid) {
      toast("Every field needs a label before saving.", "error");
      return;
    }
    setIsSaving(true);
    // Simulate API PATCH /merchant/checkout-fields
    await new Promise((r) => setTimeout(r, 600));
    setIsSaving(false);
    setIsDirty(false);
    toast("Checkout fields saved", "success");
  };

  return (
    <form onSubmit={handleSave} noValidate>
      <SettingsSection
        title="Custom checkout fields"
        description="Collect additional customer information during checkout. Fields appear on hosted checkout and payment link pages."
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* Field list */}
          <div className="space-y-3">
            {fields.length === 0 && (
              <p className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-sm text-zinc-400">
                No fields configured. Add one below.
              </p>
            )}

            {fields.map((f, idx) => (
              <FieldEditor
                key={f.id}
                field={f}
                index={idx}
                total={fields.length}
                onChange={(updated) => changeField(idx, updated)}
                onRemove={() => removeField(idx)}
                onMoveUp={() => moveField(idx, "up")}
                onMoveDown={() => moveField(idx, "down")}
              />
            ))}

            <button
              type="button"
              onClick={addField}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:border-sky-400 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-400"
            >
              <Plus className="h-4 w-4" />
              Add field
            </button>
          </div>

          {/* Preview */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-zinc-800">Live preview</p>
            <CheckoutPreviewWithFields fields={fields} />
          </div>
        </div>

        <FormActions isDirty={isDirty} isSaving={isSaving} onReset={() => { setFields(initial); setIsDirty(false); }} />
      </SettingsSection>
    </form>
  );
}

export function CheckoutFieldsSettings() {
  // In a real app this would use a TanStack Query hook; here we render with fixtures.
  return <CheckoutFieldsForm initial={DEFAULT_FIELDS} />;
}

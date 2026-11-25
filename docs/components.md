# UI component reference

All reusable primitives live in `components/ui/`. Import them from the barrel:

```ts
import { Button, Badge, Input, Dialog, useToast } from "@/components/ui";
```

The interactive showcase at `/dev/components` (development only) lets you see every component rendered live.

---

## Table of contents

- [Button](#button)
- [Badge](#badge)
- [Input and Textarea](#input-and-textarea)
- [Select and SimpleSelect](#select-and-simpleselect)
- [Dialog](#dialog)
- [Toast](#toast)
- [Card](#card)
- [Checkbox, Switch, RadioGroup](#checkbox-switch-radiogroup)
- [Tooltip](#tooltip)
- [Skeleton](#skeleton)
- [Spinner](#spinner)
- [EmptyState](#emptystate)
- [CopyButton](#copybutton)
- [AddressDisplay](#addressdisplay)
- [DateRangeInput](#daterangeinput)
- [DropdownMenu](#dropdownmenu)
- [Utilities — cn](#utilities--cn)

---

## Button

**File:** `components/ui/button.tsx`  
**Export:** `Button`, `ButtonProps`, `ButtonVariant`, `ButtonSize`

```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Save changes
</Button>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `"primary" \| "secondary" \| "outline" \| "ghost" \| "danger"` | `"primary"` | Visual style |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Height and padding |
| `loading` | `boolean` | `false` | Shows a spinning loader and disables the button |
| `disabled` | `boolean` | `false` | Disables clicks and greys out the button |
| `asChild` | `boolean` | `false` | Merges props onto the first child via Radix Slot (use for `<a>` or `<Link>`) |
| `icon` | `ReactNode` | — | Icon to show alongside the label |
| `iconPosition` | `"left" \| "right"` | `"left"` | Which side the icon appears on |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | Native button type |

Accepts all standard `<button>` attributes except `onClick`, which is re-typed to `React.MouseEventHandler<HTMLElement>` to support `asChild`.

### Variants

| Variant | Background | Foreground | Use for |
|---|---|---|---|
| `primary` | `bg-primary` (#55C2FF) | White | Primary actions |
| `secondary` | `bg-secondary` | `text-secondary-foreground` | Secondary actions |
| `outline` | Transparent with border | `text-foreground` | Less prominent actions |
| `ghost` | Transparent | `text-foreground` | Tertiary / icon buttons |
| `danger` | `bg-danger` | White | Destructive actions (delete, revoke) |

### Loading state

When `loading={true}`, a `LoaderCircle` spinner replaces icons, the button is `disabled`, and `aria-busy="true"` is set.

### `asChild` — render as a link

```tsx
import { Button } from "@/components/ui";
import Link from "next/link";

<Button asChild variant="outline">
  <Link href="/payments">View payments</Link>
</Button>
```

### Accessibility

- Native `<button>` with explicit `type="button"` to avoid accidental form submission.
- `disabled` and `loading` both set `disabled` or `aria-disabled` on the element.
- Focus ring uses `ring-primary` with 2 px offset against the page background.

---

## Badge

**File:** `components/ui/badge.tsx`  
**Exports:** `Badge`, `BadgeProps`, `BadgeStatus`, `BadgeVariant`, `BadgeSize`

```tsx
<Badge status="completed" />
<Badge variant="warning" dot>Expiring soon</Badge>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `status` | `"pending" \| "completed" \| "failed" \| "refunded" \| "expired"` | — | Applies a semantic colour tied to payment lifecycle states. Overrides `variant`. |
| `variant` | `"default" \| "success" \| "warning" \| "danger" \| "info" \| "neutral"` | `"default"` | Used when `status` is not set |
| `size` | `"sm" \| "md"` | `"sm"` | Font size and padding |
| `dot` | `boolean` | `false` | Shows a coloured circle indicator before the label |

When `status` is provided and `children` is omitted, the badge renders the `status` string as its label.

### Status colour map

| Status | Colour |
|---|---|
| `pending` | Amber — `bg-warning/10 text-warning` |
| `completed` | Emerald — `bg-success/10 text-success` |
| `failed` | Red — `bg-danger/10 text-danger` |
| `refunded` | Blue — `bg-info/10 text-info` |
| `expired` | Grey — `bg-muted/10 text-muted` |

### Accessibility

`Badge` is a `<span>` — purely visual. Screen readers read the text content. If used without children, the `status` value is capitalised by the `capitalize` Tailwind class.

---

## Input and Textarea

**File:** `components/ui/input.tsx`  
**Exports:** `Input`, `Textarea`, `InputProps`, `TextareaProps`

Both are field wrappers with built-in label, helper text, and error message.

```tsx
<Input
  label="Settlement address"
  placeholder="G…"
  helperText="Your Stellar public key"
/>

<Input
  label="Amount"
  error="Must be greater than 0"
  leftIcon={<DollarSign className="size-4" />}
/>

<Textarea
  label="Description"
  helperText="Max 500 characters"
  rows={4}
/>
```

### Input props

| Prop | Type | Description |
|---|---|---|
| `label` | `string` | Renders a `<label>` linked to the input via `htmlFor` |
| `helperText` | `string` | Muted hint text shown below the input |
| `error` | `string` | Red error message shown below the input. Also sets `aria-invalid` on the input element |
| `leftIcon` | `ReactNode` | Icon inside the left edge of the input field. Adds `pl-10` automatically |
| `rightIcon` | `ReactNode` | Icon inside the right edge of the input field. Adds `pr-10` automatically |

All standard `<input>` props are forwarded (except `size`, which is omitted to avoid ambiguity).

### Accessibility

- `label` renders as a `<label htmlFor={id}>` — clicking it focuses the input.
- `error` sets `aria-invalid="true"` and `aria-describedby` pointing to the error message element.
- `helperText` also uses `aria-describedby` so screen readers announce it after the field label.
- Error text uses `text-danger` and the border shifts to `border-danger`.

---

## Select and SimpleSelect

**File:** `components/ui/select.tsx`  
**Exports:** `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectValue`, `SimpleSelect`, `SelectOption`

### Radix Select — full keyboard navigation

Use for forms where accessibility and keyboard navigation matter.

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger aria-label="Asset">
    <SelectValue placeholder="Select asset" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="USDC">USDC</SelectItem>
    <SelectItem value="EURC">EURC</SelectItem>
    <SelectItem value="XLM">XLM</SelectItem>
  </SelectContent>
</Select>
```

The trigger renders a `ChevronDown` icon automatically. The content portals to `document.body` and scrolls when overflowing. Selected items show a `Check` mark.

### SimpleSelect — compact filter UI

Use for lightweight filter dropdowns where a native `<select>` is acceptable.

```tsx
<SimpleSelect
  label="Status"
  options={[
    { value: "all", label: "All" },
    { value: "completed", label: "Completed" },
    { value: "pending", label: "Pending" },
  ]}
  value={status}
  onChange={setStatus}
/>
```

### Props — `SimpleSelect`

| Prop | Type | Description |
|---|---|---|
| `options` | `SelectOption<T>[]` | Array of `{ value, label, disabled? }` |
| `value` | `T` | Controlled value |
| `onChange` | `(value: T) => void` | Called on selection change |
| `placeholder` | `string` | Optional first empty option |
| `label` | `string` | Rendered above the select as a small label |
| `icon` | `ReactNode` | Leading icon inside the select box |

### Accessibility

Radix Select uses `role="combobox"` and `role="listbox"` with full keyboard support (Arrow keys, Enter, Escape). `aria-label` can be passed to `SelectTrigger` when no visible label exists. `SimpleSelect` is a native `<select>` with an associated `<label>` via `htmlFor`.

---

## Dialog

**File:** `components/ui/dialog.tsx`  
**Exports:** `Dialog`, `DialogTrigger`, `DialogClose`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm refund</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button variant="danger" onClick={handleConfirm}>Refund</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Composition

| Component | Purpose |
|---|---|
| `Dialog` | Radix state root (controlled or uncontrolled via `open` / `onOpenChange`) |
| `DialogTrigger` | Wraps the element that opens the dialog |
| `DialogContent` | Overlay + modal panel. Renders a close button (X) top-right automatically |
| `DialogHeader` | Wraps title and description with correct spacing |
| `DialogTitle` | `font-heading` heading — required for accessibility |
| `DialogDescription` | Muted subtitle |
| `DialogFooter` | Column-reverse on mobile, right-aligned row on desktop |
| `DialogClose` | Wraps a button to close the dialog |

### Accessibility

- `aria-modal="true"` is set on the content.
- Focus is trapped inside the dialog while open.
- Pressing Escape closes the dialog.
- `DialogTitle` and `DialogDescription` are linked to the dialog root via Radix's internal `aria-labelledby` / `aria-describedby`.

---

## Toast

**File:** `components/ui/toast.tsx`  
**Exports:** `ToastProvider`, `useToast`, `ToastVariant`

Wrap your page (or root layout) in `ToastProvider`, then call `useToast()` to imperatively show notifications.

```tsx
// In layout or page
<ToastProvider>
  {children}
</ToastProvider>

// In a component
const toast = useToast();
toast("Payment submitted", "success");
toast("Failed to connect", "error");
toast("Processing…", "info");
```

### `ToastProvider` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `duration` | `number` | `4000` | Auto-dismiss delay in milliseconds |

### `ToastVariant`

| Variant | Icon | Colour |
|---|---|---|
| `"success"` | `CheckCircle2` | `text-success` (green) |
| `"error"` | `AlertCircle` | `text-danger` (red) |
| `"info"` | `Info` | `text-info` (blue) |

### Accessibility

Each toast is a Radix Toast primitive with `role="status"` (for info/success) or `role="alert"` (for errors, via Radix's default). The close button has `aria-label="Dismiss notification"`. The viewport is `fixed` top-right at `z-[100]`.

---

## Card

**File:** `components/ui/card.tsx`  
**Exports:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardDivider`, `DetailRow`

```tsx
<Card>
  <CardHeader title="Total revenue" subtitle="Last 30 days" />
  <CardContent>
    <p className="text-2xl font-heading">$12,340.00</p>
  </CardContent>
  <CardDivider />
  <CardFooter>
    <span className="text-sm text-muted">Updated just now</span>
  </CardFooter>
</Card>
```

### `CardHeader` props

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Card heading |
| `subtitle` | `string` | Muted sub-heading |
| `icon` | `ReactNode` | Icon shown in an accent container to the left of the title |
| `action` | `ReactNode` | Slot for a button or link placed to the right of the title |

When none of these props are passed, `CardHeader` is a plain `<div>` wrapper.

### `DetailRow`

Renders a label–value pair in a responsive grid. Use for structured data displays like payment details.

```tsx
<DetailRow label="Transaction ID" value="pay_abc123" mono />
<DetailRow label="Status" value={<Badge status="completed" />} />
```

| Prop | Type | Description |
|---|---|---|
| `label` | `string` | Left column |
| `value` | `ReactNode` | Right column |
| `mono` | `boolean` | Applies `font-mono` to the value (for hashes and addresses) |

---

## Checkbox, Switch, RadioGroup

**File:** `components/ui/checkbox.tsx` and `components/ui/radio-group.tsx`  
**Exports:** `Checkbox`, `CheckboxField`, `Switch`, `RadioGroup`, `RadioGroupItem`

### Checkbox

```tsx
<Checkbox
  checked={agreed}
  onCheckedChange={setAgreed}
  aria-label="I agree to the terms"
/>
```

### CheckboxField

Combines a checkbox with a label and optional description.

```tsx
<CheckboxField
  id="email-notifications"
  label="Email notifications"
  description="Receive an email for each new payment"
  checked={emailEnabled}
  onCheckedChange={setEmailEnabled}
/>
```

### Switch

Toggle pill for enabling/disabling settings.

```tsx
<Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Enable webhooks" />
```

### RadioGroup and RadioGroupItem

```tsx
<RadioGroup value={selected} onValueChange={setSelected}>
  <RadioGroupItem value="usdc" id="usdc" />
  <label htmlFor="usdc">USDC</label>
  <RadioGroupItem value="xlm" id="xlm" />
  <label htmlFor="xlm">XLM</label>
</RadioGroup>
```

### Accessibility

- `Checkbox`: Radix manages `aria-checked` states including the indeterminate state.
- `Switch`: `role="switch"` with `aria-checked`.
- `RadioGroup`: `role="radiogroup"` with `aria-label` on the group and `role="radio"` on each item.

---

## Tooltip

**File:** `components/ui/tooltip.tsx`  
**Exports:** `Tooltip`, `TooltipProvider`

```tsx
<Tooltip content="Copied to clipboard" side="top">
  <Button variant="ghost" size="sm">Copy</Button>
</Tooltip>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `content` | `ReactNode` | — | Tooltip content |
| `side` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Preferred placement |
| `children` | `ReactElement` | — | The trigger element (rendered via `asChild`) |

Each `Tooltip` creates its own `TooltipProvider` with a 250 ms open delay. Import `TooltipProvider` only if you need a shared delay across multiple tooltips in a subtree.

### Accessibility

Radix Tooltip renders `role="tooltip"` and links it to the trigger via `aria-describedby`. Tooltips open on focus as well as hover, satisfying WCAG 1.4.13.

---

## Skeleton

**File:** `components/ui/skeleton.tsx`  
**Export:** `Skeleton`

Animated placeholder for content that is loading.

```tsx
<Skeleton className="h-4 w-48" />
<Skeleton className="h-10 w-full rounded-lg" />
```

Renders a `<div>` with `animate-pulse` and `bg-muted/15`. `aria-hidden="true"` hides it from screen readers. Accepts any `<div>` props including `className`.

---

## Spinner

**File:** `components/ui/spinner.tsx`  
**Exports:** `Spinner`, `SpinnerSize`

```tsx
<Spinner />
<Spinner size="lg" />
```

### Props

| Prop | Type | Default |
|---|---|---|
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` |

Size to height: `xs` → 12px, `sm` → 16px, `md` → 24px, `lg` → 32px. The spinner is `role="status"` with `aria-label="Loading"`. The brand colour `text-[#55C2FF]` is applied.

`PageSpinner` centres a `lg` spinner in `min-h-[40vh]` — use it for full-page loading states.

---

## EmptyState

**File:** `components/ui/empty-state.tsx`  
**Export:** `EmptyState`

```tsx
<EmptyState
  icon={<InboxIcon />}
  title="No payments yet"
  description="Payments will appear here once a customer completes a checkout."
  action={<Button variant="outline">Create payment link</Button>}
/>
```

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Main heading (`font-heading`) |
| `description` | `string` | Yes | Explanatory body copy |
| `icon` | `ReactNode` | No | Icon above the title (sized to `size-8` automatically) |
| `action` | `ReactNode` | No | Slot for a CTA button |

Renders as a `<section>` centred in `min-h-56`. The icon is wrapped in `aria-hidden="true"`.

### Accessibility

The `<section>` does not carry an `aria-label` by default. If multiple empty states appear on one page, pass `aria-label` through the spread props to distinguish them.

---

## CopyButton

**File:** `components/ui/copy-button.tsx`  
**Export:** `CopyButton`

```tsx
<CopyButton value="GABCD...WXYZ" label="Copy address" />
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | — | String written to the clipboard |
| `label` | `string` | `"Copy to clipboard"` | Visible label and accessible name |

**States:** idle → copied (green `Check`, 1.8 s) → idle. On clipboard error: red `AlertCircle` icon.

Uses `navigator.clipboard.writeText`. In environments without clipboard access the error state is shown silently.

---

## AddressDisplay

**File:** `components/ui/address-display.tsx`  
**Exports:** `AddressDisplay`, `truncateAddress`

Combines a `Tooltip` (showing the full address) with a `CopyButton`.

```tsx
<AddressDisplay address="GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWX" />
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `address` | `string` | — | Full Stellar public key or other long string |
| `start` | `number` | `4` | Characters shown at the start |
| `end` | `number` | `4` | Characters shown at the end |

### `truncateAddress(address, start?, end?)`

Standalone utility — `truncateAddress("GABCD...WXYZ")` → `"GABC…WXYZ"`.

### Accessibility

The `<code>` element has `tabIndex={0}` and `aria-label="Address {full address}"` so keyboard users can read it and trigger the tooltip on focus.

---

## DateRangeInput

**File:** `components/ui/date-range-input.tsx`  
**Export:** `DateRangeInput`

Two native `<input type="date">` fields with from/to labels.

```tsx
<DateRangeInput
  fromValue={from}
  toValue={to}
  onFromChange={setFrom}
  onToChange={setTo}
/>
```

### Props

| Prop | Type | Description |
|---|---|---|
| `fromValue` | `string` | ISO date string for the start date |
| `toValue` | `string` | ISO date string for the end date |
| `onFromChange` | `(v: string) => void` | Called when start date changes |
| `onToChange` | `(v: string) => void` | Called when end date changes |

Automatically sets the `min` on the end date to equal the start date, preventing impossible ranges.

### Accessibility

Each input has an associated `<label>` with text "From" and "To". Date inputs are keyboard-operable in all major browsers. The brand blue focus ring (`focus:ring-[#55C2FF]`) is applied.

---

## DropdownMenu

**File:** `components/ui/dropdown-menu.tsx`  
**Exports:** `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuPortal`, `DropdownMenuGroup`

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Payment</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={handleView}>View details</DropdownMenuItem>
    <DropdownMenuItem onSelect={handleRefund}>Refund</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={handleCancel} className="text-danger">
      Cancel
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Content portals to `document.body`, is `z-50`, and uses `focus:bg-primary/15` for item highlight. `DropdownMenuSubTrigger` automatically shows a `ChevronRight` icon.

### Accessibility

Radix DropdownMenu provides `role="menu"` / `role="menuitem"` with full keyboard navigation (Arrow keys, Enter, Escape, Tab closes). Focus returns to the trigger on close.

---

## Utilities — `cn`

**File:** `components/ui/utils.ts`  
**Export:** `cn`

Merges Tailwind class strings, resolving conflicts correctly.

```ts
import { cn } from "@/components/ui";

cn("px-4 py-2", isActive && "bg-primary", className)
```

Internally runs `clsx` then `tailwind-merge`, so `cn("p-4", "px-2")` produces `"py-4 px-2"` rather than both declarations competing.

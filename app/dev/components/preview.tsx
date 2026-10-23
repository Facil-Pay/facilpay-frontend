"use client";

import * as React from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  CreditCard,
  Ellipsis,
  Inbox,
  Search,
  Wallet,
} from "lucide-react";
import {
  AddressDisplay,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  CheckboxField,
  CopyButton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Spinner,
  DateRangeInput,
  Switch,
  Textarea,
  ToastProvider,
  Tooltip,
  useToast,
} from "@/components/ui";

const statuses = ["pending", "completed", "failed", "refunded", "expired"] as const;

function PreviewContent() {
  const [checked, setChecked] = React.useState(false);
  const [enabled, setEnabled] = React.useState(true);
  const [paymentMethod, setPaymentMethod] = React.useState("card");
  const notify = useToast();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 text-foreground">
      <header className="mb-10 border-b border-border pb-6">
        <p className="mb-2 text-xs font-semibold uppercase text-muted">FacilPay UI</p>
        <h1 className="font-heading text-3xl font-semibold">Component library</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">Shared interface primitives for the merchant dashboard.</p>
      </header>

      <section className="space-y-4 border-b border-border py-8">
        <h2 className="font-heading text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button loading>Processing</Button>
          <Button disabled variant="outline">Disabled</Button>
          <Button variant="outline" asChild><a href="#inputs">Link support <ArrowUpRight className="size-4" /></a></Button>
        </div>
      </section>

      <section id="inputs" className="grid gap-8 border-b border-border py-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-semibold">Inputs</h2>
          <Input label="Search payments" placeholder="Payment ID or customer" leftIcon={<Search className="size-4" />} />
          <Input label="Wallet address" helperText="Stellar public key" rightIcon={<Wallet className="size-4" />} />
          <Input label="API key" error="This key is invalid." defaultValue="sk_live_example" />
          <Textarea label="Description" helperText="Shown in the payment receipt." placeholder="Add an optional note" />
        </div>
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-semibold">Select and choices</h2>
          <Select defaultValue="all">
            <SelectTrigger aria-label="Payment status filter"><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <CheckboxField label="Email me about completed payments" description="You can change this preference later." defaultChecked />
          <div className="flex items-center gap-3">
            <Checkbox checked={checked} onCheckedChange={(value) => setChecked(value === true)} aria-label="Controlled checkbox" />
            <span className="text-sm">Controlled checkbox: {checked ? "checked" : "unchecked"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Payment notifications" />
            <span className="text-sm">Payment notifications</span>
            <Switch defaultChecked aria-label="Uncontrolled switch" />
          </div>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} aria-label="Payment method" className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="card" />Card</label>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="wallet" />Wallet</label>
          </RadioGroup>
          <RadioGroup defaultValue="weekly" aria-label="Uncontrolled report frequency" className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="daily" />Daily</label>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="weekly" />Weekly</label>
          </RadioGroup>
        </div>
      </section>

      <section className="space-y-4 border-b border-border py-8">
        <h2 className="font-heading text-xl font-semibold">Cards and statuses</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment volume</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent><p className="font-heading text-2xl font-semibold">$24,580.00</p></CardContent>
            <CardFooter><Activity className="size-4 text-success" /><span className="text-sm text-muted">Up 12.4% from last month</span></CardFooter>
          </Card>
          <div className="flex flex-wrap content-start items-center gap-2">
            {statuses.map((status) => <Badge key={status} status={status} />)}
          </div>
        </div>
      </section>

      <section className="space-y-4 border-b border-border py-8">
        <h2 className="font-heading text-xl font-semibold">Overlays and menus</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild><Button variant="outline">Open dialog</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refund payment?</DialogTitle>
                <DialogDescription>This action will return the funds to the customer.</DialogDescription>
              </DialogHeader>
              <DialogFooter><Button variant="outline">Cancel</Button><Button variant="danger">Confirm refund</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline">More actions <Ellipsis className="size-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Payment</DropdownMenuLabel>
              <DropdownMenuItem><CreditCard className="mr-2 size-4" />View details</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Download receipt</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip content="Create a new payment link"><Button variant="ghost" aria-label="Help"><span aria-hidden="true">?</span></Button></Tooltip>
        </div>
      </section>

      <section className="space-y-4 border-b border-border py-8">
        <h2 className="font-heading text-xl font-semibold">Feedback and loading</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => notify("Payment saved successfully.", "success")}>Success toast</Button>
          <Button variant="outline" onClick={() => notify("Unable to process the payment.", "error")}>Error toast</Button>
          <Button variant="secondary" onClick={() => notify("Your report is being prepared.", "info")}>Info toast</Button>
          <Skeleton className="h-10 w-36" />
          <div className="grid w-full max-w-xs gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="flex items-center gap-3">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>
        </div>
        <div className="max-w-xs pt-3">
          <DateRangeInput
            label="Date Range Picker"
            fromValue="2026-01-01"
            toValue="2026-01-31"
            onFromChange={() => {}}
            onToChange={() => {}}
          />
        </div>
      </section>

      <section className="space-y-4 border-b border-border py-8">
        <h2 className="font-heading text-xl font-semibold">Empty state</h2>
        <EmptyState
          icon={<Inbox />}
          title="No payments yet"
          description="Payments will appear here as soon as customers check out."
          action={<Button>Create payment link</Button>}
        />
      </section>

      <section className="space-y-4 py-8">
        <h2 className="font-heading text-xl font-semibold">Copyable identifiers</h2>
        <div className="flex flex-wrap items-center gap-6">
          <AddressDisplay address="GABCDEF0123456789XYZWVU0123456789ABCDEF0123456789XYZWVU0123456789" />
          <div className="flex items-center gap-2"><code className="font-mono text-sm">tx_7f83b1657ff1fc53</code><CopyButton value="tx_7f83b1657ff1fc53" label="Copy transaction hash" /></div>
          <div className="flex items-center gap-2 text-sm"><Check className="size-4 text-success" />Copy feedback available</div>
        </div>
      </section>
    </main>
  );
}

export default function ComponentsPreview() {
  return <ToastProvider><PreviewContent /></ToastProvider>;
}
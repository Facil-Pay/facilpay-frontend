"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "./utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  closeLabel?: string;
};

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent({ className, children, closeLabel = "Close dialog", ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-accent/60 data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <DialogPrimitive.Content
        {...props}
        ref={ref}
        aria-modal="true"
        className={cn("fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-border bg-card p-6 text-foreground shadow-lg outline-none", className)}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm p-1 text-muted opacity-70 outline-none transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-primary" aria-label={closeLabel}>
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export function DialogHeader({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cn("grid gap-1.5 pr-7", className)} />;
}

export function DialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title {...props} className={cn("font-heading text-lg font-semibold", className)} />;
}

export function DialogDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description {...props} className={cn("text-sm text-muted", className)} />;
}

export function DialogFooter({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} />;
}
"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "./utils";

export function TooltipProvider({ children, delayDuration = 300 }: { children: React.ReactNode; delayDuration?: number }) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({
  children,
  content,
  side = "top",
  className,
}: {
  children: React.ReactElement;
  content: React.ReactNode;
  side?: TooltipPrimitive.TooltipContentProps["side"];
  className?: string;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content side={side} sideOffset={5} className={cn("z-50 max-w-xs rounded-md bg-accent px-3 py-1.5 text-xs text-accent-foreground shadow-md", className)}>
            {content}
            <TooltipPrimitive.Arrow className="fill-accent" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
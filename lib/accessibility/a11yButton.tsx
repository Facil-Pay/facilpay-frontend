/**
 * lib/accessibility/a11yButton.tsx
 *
 * Accessible button component with proper keyboard support and labeling.
 * Automatically includes aria attributes for icon-only buttons.
 */

import React from "react";
import { isActivationKey } from "./wcag";

interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon or icon component to display */
  icon?: React.ReactNode;
  /** Required for icon-only buttons */
  ariaLabel?: string;
  /** Visually hidden text alternative for icon-only buttons */
  srText?: string;
  /** Loading state with accessible announcement */
  isLoading?: boolean;
  /** Disabled state with reason for accessibility */
  isDisabled?: boolean;
  disabledReason?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Color variant */
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      icon,
      ariaLabel,
      srText,
      isLoading = false,
      isDisabled = false,
      disabledReason,
      size = "md",
      variant = "primary",
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const isIconOnly = icon && !children;

    const sizeClasses = {
      sm: "px-2 py-1 text-sm",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base",
    };

    const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100",
      danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
      ghost: "text-gray-700 hover:bg-gray-100 disabled:text-gray-400",
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled || isLoading}
        className={`
          inline-flex items-center gap-2 rounded-md font-medium
          transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        aria-label={ariaLabel || (isIconOnly ? srText : undefined)}
        aria-disabled={isDisabled || isLoading}
        aria-describedby={disabledReason ? `${props.id}-disabled-reason` : undefined}
        {...props}
        onKeyDown={(e) => {
          if (isActivationKey(e)) {
            e.preventDefault();
            e.currentTarget.click();
          }
          props.onKeyDown?.(e);
        }}
      >
        {isLoading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="sr-only">Loading...</span>
          </>
        ) : (
          icon
        )}
        {children && <span>{children}</span>}
        {srText && isIconOnly && <span className="sr-only">{srText}</span>}
      </button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

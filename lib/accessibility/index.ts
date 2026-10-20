/**
 * lib/accessibility/index.ts
 *
 * Accessibility utilities and components for WCAG 2.1 AA compliance.
 */

export { AccessibleButton } from "./a11yButton";
export {
  validateContrast,
  A11Y_STATUS_COLORS,
  KEYBOARD_CODES,
  isActivationKey,
  focusElement,
  announceToScreenReader,
  isKeyboardAccessible,
  getErrorDescriberId,
  type ValidateContrastResult,
} from "./wcag";

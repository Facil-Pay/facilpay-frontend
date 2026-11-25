import type { CSSProperties } from 'react';

export type PaymentButtonSize = 'small' | 'medium' | 'large';
export type PaymentButtonTheme = 'dark' | 'light' | 'brand';

export interface PaymentButtonOptions {
  url: string;
  label: string;
  size: PaymentButtonSize;
  theme: PaymentButtonTheme;
}

export function getSafePaymentUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getPaymentButtonStyle(
  size: PaymentButtonSize,
  theme: PaymentButtonTheme
): CSSProperties {
  const colors = {
    dark: { backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #0f172a' },
    light: { backgroundColor: '#ffffff', color: '#18181b', border: '1px solid #d4d4d8' },
    brand: { backgroundColor: '#0088ff', color: '#ffffff', border: '1px solid #0088ff' },
  }[theme];
  const sizing = {
    small: { padding: '8px 14px', fontSize: '12px' },
    medium: { padding: '11px 18px', fontSize: '14px' },
    large: { padding: '14px 22px', fontSize: '16px' },
  }[size];

  return {
    ...colors,
    ...sizing,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 600,
    lineHeight: 1.25,
    textDecoration: 'none',
    cursor: 'pointer',
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toCssProperty(property: string): string {
  return property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function createHtmlPaymentButton(options: PaymentButtonOptions): string {
  const style = getPaymentButtonStyle(options.size, options.theme);
  const declarations = Object.entries(style)
    .map(([property, value]) => `${toCssProperty(property)}:${value}`)
    .join(';');

  return `<a href="${escapeHtml(options.url)}" style="${declarations}">${escapeHtml(options.label)}</a>`;
}

export function createReactPaymentButton(options: PaymentButtonOptions): string {
  const style = getPaymentButtonStyle(options.size, options.theme);
  const styleLines = Object.entries(style)
    .map(([property, value]) => `    ${property}: ${JSON.stringify(value)},`)
    .join('\n');

  return `<a
  href={${JSON.stringify(options.url)}}
  style={{
${styleLines}
  }}
>
  {${JSON.stringify(options.label)}}
</a>`;
}

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const messagesDir = path.resolve(__dirname, "../messages");
const defaultLocale = "en";
const targetLocales = ["es", "pt", "fr"];

function loadJson(locale: string) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function getDeepKeys(obj: Record<string, any>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys = keys.concat(getDeepKeys(value, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

describe("next-intl localization key parity", () => {
  const defaultMessages = loadJson(defaultLocale);
  const defaultKeys = getDeepKeys(defaultMessages).sort();

  it("should have valid non-empty default english messages", () => {
    expect(defaultKeys.length).toBeGreaterThan(50);
  });

  targetLocales.forEach((locale) => {
    it(`should have 100% key parity for locale "${locale}"`, () => {
      const messages = loadJson(locale);
      const keys = getDeepKeys(messages).sort();

      const missingFromLocale = defaultKeys.filter((k) => !keys.includes(k));
      const extraInLocale = keys.filter((k) => !defaultKeys.includes(k));

      expect(
        missingFromLocale,
        `Locale "${locale}" is missing keys: ${missingFromLocale.join(", ")}`
      ).toEqual([]);

      expect(
        extraInLocale,
        `Locale "${locale}" has unexpected extra keys: ${extraInLocale.join(", ")}`
      ).toEqual([]);

      expect(keys.length).toBe(defaultKeys.length);
    });
  });
});

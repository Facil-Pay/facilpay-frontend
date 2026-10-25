import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { routing } from "../i18n/routing";

/**
 * Every locale declared in i18n/routing.ts must ship a message file with
 * exactly the same keys and ICU placeholders as English, so no locale ever
 * falls back to a raw key or logs a missing-message warning.
 */

type Messages = { [key: string]: string | Messages };

const MESSAGES_DIR = join(__dirname, "..", "messages");
const SOURCE_LOCALE = routing.defaultLocale;

function load(locale: string): Messages {
  return JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), "utf8")) as Messages;
}

function flatten(messages: Messages, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else for (const [k, v] of flatten(value, path)) out.set(k, v);
  }
  return out;
}

function placeholders(message: string): string[] {
  return [...message.matchAll(/\{\s*(\w+)/g)].map((m) => m[1]).sort();
}

const source = flatten(load(SOURCE_LOCALE));
const translated = routing.locales.filter((locale) => locale !== SOURCE_LOCALE);

describe("i18n messages", () => {
  it("has a message file for every routed locale and no orphans", () => {
    const files = readdirSync(MESSAGES_DIR)
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(/\.json$/, ""))
      .sort();
    expect(files).toEqual([...routing.locales].sort());
  });

  it("has no empty messages in the source locale", () => {
    const empty = [...source].filter(([, value]) => value.trim() === "").map(([key]) => key);
    expect(empty).toEqual([]);
  });

  describe.each(translated)("%s", (locale) => {
    const messages = flatten(load(locale));

    it("defines every key from the source locale", () => {
      const missing = [...source.keys()].filter((key) => !messages.has(key));
      expect(missing, `${locale}.json is missing keys`).toEqual([]);
    });

    it("has no keys that the source locale lacks", () => {
      const extra = [...messages.keys()].filter((key) => !source.has(key));
      expect(extra, `${locale}.json has unknown keys`).toEqual([]);
    });

    it("has no empty translations", () => {
      const empty = [...messages].filter(([, value]) => value.trim() === "").map(([key]) => key);
      expect(empty).toEqual([]);
    });

    it("keeps the same placeholders as the source locale", () => {
      const mismatched = [...source]
        .filter(([key]) => messages.has(key))
        .filter(([key, value]) => placeholders(value).join() !== placeholders(messages.get(key)!).join())
        .map(([key]) => key);
      expect(mismatched).toEqual([]);
    });
  });
});

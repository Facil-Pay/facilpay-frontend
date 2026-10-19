import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const messagesDir = path.join(rootDir, "messages");
const defaultLocale = "en";
const targetLocales = ["es", "pt", "fr"];

function loadJson(locale) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing translation file for locale "${locale}": ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function getDeepKeys(obj, prefix = "") {
  let keys = [];
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

const defaultMessages = loadJson(defaultLocale);
const defaultKeys = new Set(getDeepKeys(defaultMessages));
console.log(`[i18n-check] Base locale "${defaultLocale}" has ${defaultKeys.size} translation keys.`);

let hasError = false;

for (const locale of targetLocales) {
  const messages = loadJson(locale);
  const keys = new Set(getDeepKeys(messages));
  
  const missing = [];
  for (const key of defaultKeys) {
    if (!keys.has(key)) {
      missing.push(key);
    }
  }

  const extra = [];
  for (const key of keys) {
    if (!defaultKeys.has(key)) {
      extra.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(`[i18n-check] FAIL: Locale "${locale}" is missing ${missing.length} keys:`);
    missing.slice(0, 10).forEach((k) => console.error(`  - ${k}`));
    if (missing.length > 10) console.error(`  ...and ${missing.length - 10} more`);
    hasError = true;
  } else {
    console.log(`[i18n-check] PASS: Locale "${locale}" has 100% key parity (${keys.size}/${defaultKeys.size}).`);
  }

  if (extra.length > 0) {
    console.warn(`[i18n-check] WARN: Locale "${locale}" has ${extra.length} extraneous keys.`);
  }
}

if (hasError) {
  console.error("\n[i18n-check] Translation key parity verification failed.");
  process.exit(1);
} else {
  console.log("\n[i18n-check] All locales have 100% key parity with default locale!");
}

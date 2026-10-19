import { describe, expect, it } from "vitest";
import { StrKey } from "./strkey";

describe("StrKey Utility", () => {
  const VALID_G_ADDRESS = "GA5XIGA5C7QTPTWXQHY6MCJRMTRZDOSHR6QVIBHSNDMS6NOSTIQS5KDU";
  const ANOTHER_VALID_G_ADDRESS = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

  describe("isValidEd25519PublicKey", () => {
    it("accepts valid 56-character Ed25519 G-addresses with valid checksums", () => {
      expect(StrKey.isValidEd25519PublicKey(VALID_G_ADDRESS)).toBe(true);
      expect(StrKey.isValidEd25519PublicKey(ANOTHER_VALID_G_ADDRESS)).toBe(true);
    });

    it("rejects non-string inputs", () => {
      expect(StrKey.isValidEd25519PublicKey(null)).toBe(false);
      expect(StrKey.isValidEd25519PublicKey(undefined)).toBe(false);
      expect(StrKey.isValidEd25519PublicKey(12345)).toBe(false);
      expect(StrKey.isValidEd25519PublicKey({})).toBe(false);
    });

    it("rejects empty strings or short inputs", () => {
      expect(StrKey.isValidEd25519PublicKey("")).toBe(false);
      expect(StrKey.isValidEd25519PublicKey("   ")).toBe(false);
      expect(StrKey.isValidEd25519PublicKey("GA5XIGA5C7QTPTWXQHY6MCJRMTRZDOSHR6QVIBHSNDMS6NOSTIQS")).toBe(false);
    });

    it("rejects strings not starting with 'G' (including S-keys, C-contracts, M-muxed)", () => {
      // Secret key starting with S
      expect(StrKey.isValidEd25519PublicKey("SBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5")).toBe(false);
      // Contract address starting with C
      expect(StrKey.isValidEd25519PublicKey("CBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5")).toBe(false);
      // Muxed address starting with M
      expect(StrKey.isValidEd25519PublicKey("MA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAAAAAAAAAAAAJLK")).toBe(false);
    });

    it("rejects invalid Base32 characters (e.g., 0, 1, 8, 9)", () => {
      const invalidCharsAddress = "G" + "0".repeat(55);
      expect(StrKey.isValidEd25519PublicKey(invalidCharsAddress)).toBe(false);
      const invalidCharsAddress2 = "G" + "1".repeat(55);
      expect(StrKey.isValidEd25519PublicKey(invalidCharsAddress2)).toBe(false);
    });

    it("rejects addresses with corrupted CRC16 checksum bytes", () => {
      // Corrupt the last character
      const lastChar = VALID_G_ADDRESS[VALID_G_ADDRESS.length - 1];
      const alteredChar = lastChar === "A" ? "B" : "A";
      const corrupted = VALID_G_ADDRESS.slice(0, -1) + alteredChar;
      expect(StrKey.isValidEd25519PublicKey(corrupted)).toBe(false);
    });

    it("trims surrounding whitespace before validating", () => {
      expect(StrKey.isValidEd25519PublicKey(`  ${VALID_G_ADDRESS}  `)).toBe(true);
    });
  });

  describe("truncateAddress", () => {
    it("truncates standard addresses with default slice sizes", () => {
      expect(StrKey.truncateAddress(VALID_G_ADDRESS)).toBe("GA5X...5KDU");
    });

    it("respects custom prefix and suffix lengths", () => {
      expect(StrKey.truncateAddress(VALID_G_ADDRESS, 6, 6)).toBe("GA5XIG...STIQS5KDU".slice(0, 6) + "..." + VALID_G_ADDRESS.slice(-6));
    });

    it("returns short inputs as-is without crashing", () => {
      expect(StrKey.truncateAddress("GABC")).toBe("GABC");
      expect(StrKey.truncateAddress("")).toBe("");
    });
  });
});

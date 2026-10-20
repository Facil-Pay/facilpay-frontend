/**
 * Pure TypeScript implementation of Stellar StrKey validation.
 * Specifically validates Ed25519 Public Keys (56 characters starting with 'G').
 * Implements Base32 decoding and CRC16-XModem checksum verification per Stellar specs.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ED25519_PUBLIC_KEY_VERSION_BYTE = 6 << 3; // 48 (0x30), character 'G'

/**
 * Calculates CRC16-XModem checksum (little-endian in Stellar StrKey).
 */
function crc16XModem(data: Uint8Array): number {
  let crc = 0x0000;
  for (let i = 0; i < data.length; i++) {
    let byte = data[i];
    let code = (crc >>> 8) & 0xff;
    code ^= byte & 0xff;
    code ^= code >>> 4;
    crc = (crc << 8) & 0xffff;
    crc ^= code;
    code = (code << 5) & 0xffff;
    crc ^= code;
    code = (code << 7) & 0xffff;
    crc ^= code;
  }
  return crc;
}

/**
 * Decodes an RFC 4648 Base32 string into Uint8Array.
 */
function decodeBase32(input: string): Uint8Array | null {
  const cleanInput = input.toUpperCase().trim();
  const bits: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleanInput[i]);
    if (val === -1) return null;
    for (let b = 4; b >= 0; b--) {
      bits.push((val >> b) & 1);
    }
  }

  // Length must be a multiple of 8
  const byteCount = Math.floor(bits.length / 8);
  const bytes = new Uint8Array(byteCount);

  for (let i = 0; i < byteCount; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bits[i * 8 + b];
    }
    bytes[i] = byteVal;
  }

  return bytes;
}

export const StrKey = {
  /**
   * Validates if a string is a valid Stellar Ed25519 Public Key.
   * Checks:
   * 1. String length is exactly 56 characters.
   * 2. Starts with 'G'.
   * 3. Uses valid Base32 characters.
   * 4. Version byte is 0x30 (Ed25519 public key).
   * 5. CRC16 checksum matches the 32-byte payload + version byte.
   */
  isValidEd25519PublicKey(address: unknown): boolean {
    if (typeof address !== 'string') return false;
    const trimmed = address.trim();

    // Check basic length and leading character
    if (trimmed.length !== 56 || trimmed[0] !== 'G') {
      return false;
    }

    // Decode Base32
    const decoded = decodeBase32(trimmed);
    if (!decoded || decoded.length !== 35) {
      return false;
    }

    // Check version byte
    const versionByte = decoded[0];
    if (versionByte !== ED25519_PUBLIC_KEY_VERSION_BYTE) {
      return false;
    }

    // Check CRC16 (last 2 bytes, little-endian)
    const payload = decoded.slice(0, 33); // version + 32-byte public key
    const expectedChecksum = crc16XModem(payload);
    const actualChecksum = decoded[33] | (decoded[34] << 8);

    return expectedChecksum === actualChecksum;
  },

  /**
   * Validates if a string is a valid Stellar M-address (muxed account).
   */
  isValidMuxedAccount(address: unknown): boolean {
    if (typeof address !== 'string') return false;
    const trimmed = address.trim();
    if (trimmed.length !== 69 || trimmed[0] !== 'M') {
      return false;
    }
    const decoded = decodeBase32(trimmed);
    if (!decoded || decoded.length !== 43) {
      return false;
    }
    const versionByte = decoded[0];
    if (versionByte !== (12 << 3)) {
      return false;
    }
    const payload = decoded.slice(0, 41);
    const expectedChecksum = crc16XModem(payload);
    const actualChecksum = decoded[41] | (decoded[42] << 8);
    return expectedChecksum === actualChecksum;
  },

  /**
   * Validates either a G-address or an M-address.
   */
  isValidAddress(address: unknown): boolean {
    return this.isValidEd25519PublicKey(address) || this.isValidMuxedAccount(address);
  },

  /**
   * Truncates a Stellar address for UI display (e.g. G...ABCD).
   */
  truncateAddress(address: string, start = 4, end = 4): string {
    if (!address) return '';
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  },
};

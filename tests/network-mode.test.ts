import { isFriendbotAvailable } from '../lib/network-mode';

describe('Network mode — Friendbot availability', () => {
  test('Friendbot is available in testnet mode', () => {
    expect(isFriendbotAvailable('testnet')).toBe(true);
  });

  test('Friendbot is hidden in mainnet mode', () => {
    expect(isFriendbotAvailable('mainnet')).toBe(false);
  });

  test('Friendbot is hidden while the mode is still unresolved', () => {
    expect(isFriendbotAvailable(null)).toBe(false);
    expect(isFriendbotAvailable(undefined)).toBe(false);
  });
});

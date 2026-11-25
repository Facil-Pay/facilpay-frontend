import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_ENDPOINT,
  getEndpointById,
  rollEndpointSecret,
  STORAGE_KEYS,
} from '../lib/webhook-data';

afterEach(() => {
  localStorage.removeItem(STORAGE_KEYS.WEBHOOK_ENDPOINTS);
});

describe('webhook signing secret rotation', () => {
  it('keeps the previous secret through the selected overlap period', () => {
    const currentSecret = getEndpointById(DEFAULT_ENDPOINT.id)!.secret;
    const before = Date.now();
    const result = rollEndpointSecret(DEFAULT_ENDPOINT.id, '1h');

    expect(result.endpoint?.secret).toBe(result.newSecret);
    expect(result.endpoint?.secretRevealDisabled).toBe(true);
    expect(result.endpoint?.previousSecrets).toEqual([
      expect.objectContaining({
        secret: currentSecret,
        expiresAt: expect.any(String),
      }),
    ]);
    expect(Date.parse(result.endpoint!.previousSecrets![0].expiresAt)).toBeGreaterThan(before);
  });

  it('does not retain the just-replaced secret when rotation is immediate', () => {
    const result = rollEndpointSecret(DEFAULT_ENDPOINT.id, 'now');

    expect(result.endpoint?.previousSecrets).toBeUndefined();
  });
});

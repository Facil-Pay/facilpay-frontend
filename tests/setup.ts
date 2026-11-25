/**
 * tests/setup.ts
 *
 * Global test setup for React Testing Library and MSW.
 * Imported by vitest.config.ts via `setupFiles`.
 */

import "@testing-library/jest-dom";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";

/**
 * Shared MSW server for Node tests. Requests nobody mocked fail instead of
 * reaching the network. Add per-test handlers with `server.use(...)`; they are
 * removed again after each test by `resetHandlers`.
 */
export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

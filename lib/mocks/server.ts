/**
 * lib/mocks/server.ts
 *
 * MSW Node.js server entry-point.
 * Used by test runners (Jest, Vitest) running in Node, and by Next.js
 * server-side code paths that need mocked fetch responses.
 *
 * Do NOT import this file in browser bundles.
 */

import { setupServer } from "msw/node";
import { handlers }    from "./handlers";

export const server = setupServer(...handlers);

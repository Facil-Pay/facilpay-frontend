/**
 * types/svg.d.ts
 *
 * Module declaration for SVG files imported as Next.js static assets.
 * When Next.js imports an SVG with `import logo from "./logo.svg"` the
 * result is a StaticImageData-compatible object (src string + width/height).
 */

declare module "*.svg" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

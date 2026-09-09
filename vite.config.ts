// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

// Server-side code (server routes, server functions) reads process.env, which
// Vite does not populate on its own. Load every variable — not just VITE_ ones —
// into process.env. These are never exposed to the browser bundle.
const serverEnv = loadEnv(process.env['NODE_ENV'] ?? "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

/*
 * The browser build needs the backend address and the publishable key, and a
 * deploy that only received the server-side names used to compile them out
 * entirely — the admin sign-in then rendered "not configured" on a perfectly
 * healthy site. Mirror the server names onto the VITE_ names when they are
 * absent, and fall back to the address derived from the project id.
 *
 * Only public values are mirrored: the publishable key is the same key every
 * visitor already downloads. The service role key is never touched.
 */
const projectId =
  process.env['VITE_SUPABASE_PROJECT_ID'] ??
  process.env['SUPABASE_PROJECT_ID'] ??
  "mfzcsjydwchikmgsqaex";

/* The last resort, and safe to write down: the publishable key is the one every
 * visitor already downloads, and it is useless without the row-level rules the
 * database enforces. The service role key is never touched. */
const PUBLISHABLE_KEY_FALLBACK = "sb_publishable_sbe1Q819W-Hc5fgTrHAMiA_yTdFh2O8";

/* Assigning `undefined` to process.env stores the string "undefined", which is
 * worse than absent: it looks configured and then fails as an invalid URL. */
function mirrorEnv(name: string, value: string | undefined): void {
  const current = process.env[name];
  if (current && current !== "undefined") return;
  if (!value || value === "undefined") {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

mirrorEnv(
  "VITE_SUPABASE_URL",
  process.env['SUPABASE_URL'] ?? `https://${projectId}.supabase.co`,
);
mirrorEnv(
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  process.env['SUPABASE_PUBLISHABLE_KEY'] ??
    process.env['VITE_SUPABASE_ANON_KEY'] ??
    PUBLISHABLE_KEY_FALLBACK,
);
mirrorEnv("VITE_SUPABASE_PROJECT_ID", projectId);




export default defineConfig({
  vite: {
    plugins: [mcpPlugin()],
    resolve: {
      alias: {
        "entities/lib/decode.js": path.resolve(import.meta.dirname, "node_modules/entities/lib/decode.js"),
        "entities/lib/encode.js": path.resolve(import.meta.dirname, "node_modules/entities/lib/encode.js"),
        entities: path.resolve(import.meta.dirname, "node_modules/entities"),
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

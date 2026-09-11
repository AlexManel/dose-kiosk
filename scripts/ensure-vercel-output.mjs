#!/usr/bin/env node
/**
 * Nitro's Vercel preset writes Build Output API files in the `compiled` hook.
 * If that hook is skipped, Vercel looks for `dist` and fails. This script
 * fills in the missing config so Git deployments pick up `.vercel/output`.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const outputDir = join(root, ".vercel/output");
const funcDir = join(outputDir, "functions/__server.func");
const configPath = join(outputDir, "config.json");
const vcConfigPath = join(funcDir, ".vc-config.json");

if (!existsSync(funcDir)) {
  console.error("[vercel] missing .vercel/output/functions/__server.func — vite build did not emit the server");
  process.exit(1);
}

if (!existsSync(configPath)) {
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(
    configPath,
    JSON.stringify(
      {
        version: 3,
        routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/__server" }],
      },
      null,
      2,
    ),
  );
  console.log("[vercel] wrote .vercel/output/config.json");
}

if (!existsSync(vcConfigPath)) {
  writeFileSync(
    vcConfigPath,
    JSON.stringify(
      {
        runtime: "nodejs22.x",
        handler: "index.mjs",
        launcherType: "Nodejs",
        shouldAddHelpers: false,
        supportsResponseStreaming: true,
      },
      null,
      2,
    ),
  );
  console.log("[vercel] wrote __server.func/.vc-config.json");
}

console.log("[vercel] Build Output API ready");

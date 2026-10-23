#!/usr/bin/env node
// Generates UPLOAD-CHECKLIST.md from the files git is tracking.
const fs = require("fs");
const { execSync } = require("child_process");

const files = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const critical = new Set([
  "package.json", "package-lock.json", "index.html", "vite.config.ts", "tsconfig.json",
  "src/main.ts", "src/App.vue", "src/store.ts",
  "src-tauri/Cargo.toml", "src-tauri/Cargo.lock", "src-tauri/build.rs",
  "src-tauri/tauri.conf.json", "src-tauri/src/main.rs",
  "src-tauri/capabilities/default.json",
  "src-tauri/icons/AppIcon.png", "src-tauri/icons/AppIcon.icns",
  "src-tauri/icons/icon.ico", "src-tauri/icons/app-icon.svg",
  ".github/workflows/release.yml",
  "scripts/expected-files.txt",
]);

const groups = new Map();
for (const f of files) {
  const top = f.includes("/") ? f.split("/")[0] : "(repository root)";
  if (!groups.has(top)) groups.set(top, []);
  groups.get(top).push(f);
}

const order = ["(repository root)", ".github", "src-tauri", "src"];
const names = [...order, ...[...groups.keys()].filter((k) => !order.includes(k))];

const L = [];
L.push("# Upload checklist — ECPL Cheque Writer");
L.push("");
L.push(`Every file the build needs. Total: **${files.length} files**.`);
L.push("");
L.push("Files marked **CRITICAL** stop the build outright if missing. Everything");
L.push("else is app source; a missing one shows up as a TypeScript error.");
L.push("");

for (const g of names) {
  if (!groups.has(g)) continue;
  L.push(`## ${g} (${groups.get(g).length})`);
  L.push("");
  for (const f of groups.get(g)) {
    L.push(`- [ ] \`${f}\`${critical.has(f) ? " **CRITICAL**" : ""}`);
  }
  L.push("");
}

L.push("## Verify before pushing");
L.push("");
L.push("`scripts/expected-files.txt` is the machine-readable version of this list:");
L.push("one path per line, 108 entries. GitHub Actions compares the repository");
L.push("against it in its first step (`Verify project layout`) and prints every");
L.push("missing path by name, so a bad upload is named instead of surfacing later");
L.push("as a TypeScript or bundling error.");
L.push("");
L.push("To check a local copy, from its root:");
L.push("");
L.push("```sh");
L.push('while read -r f; do [ -e "$f" ] || echo "MISSING: $f"; done < scripts/expected-files.txt');
L.push("```");
L.push("");

fs.writeFileSync("UPLOAD-CHECKLIST.md", L.join("\n"));
console.log(`wrote UPLOAD-CHECKLIST.md — ${files.length} files listed`);

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
  ".github/workflows/release.yml",
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
L.push("From the repository root, this must print **Project layout OK**:");
L.push("");
L.push("```sh");
L.push('node -e \'const fs=require("fs");');
L.push('const req=["package.json","index.html","vite.config.ts","tsconfig.json",');
L.push('  "src/main.ts","src/App.vue","src-tauri/Cargo.toml","src-tauri/build.rs",');
L.push('  "src-tauri/tauri.conf.json","src-tauri/src/main.rs"];');
L.push('const miss=req.filter(f=>!fs.existsSync(f));');
L.push('if(miss.length){console.error("MISSING:",miss);process.exit(1);}');
L.push('console.log("Project layout OK");\'');
L.push("```");
L.push("");
L.push("GitHub Actions runs this same check as its first step, so a missing file is");
L.push("named in the log instead of surfacing later as a config error.");
L.push("");

fs.writeFileSync("UPLOAD-CHECKLIST.md", L.join("\n"));
console.log(`wrote UPLOAD-CHECKLIST.md — ${files.length} files listed`);

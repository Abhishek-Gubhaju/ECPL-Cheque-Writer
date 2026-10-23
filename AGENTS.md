# ECPL Cheque Writer — agent notes

This is the canonical source of truth for the app.

The full session harness lives one level up, in the workspace root:

- [`../AGENTS.md`](../AGENTS.md) — conventions, gates, known failure classes
- [`../HANDOFF.md`](../HANDOFF.md) — current status and next actions
- [`../upload-ready/`](../upload-ready) — generated, flat, upload-ready export

Quick gates before claiming a release build works:

```bash
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

`tsconfig.json` must **not** reference `./tsconfig.node.json`, and that file must not
exist. An upload must include the hidden `.github/` folder.

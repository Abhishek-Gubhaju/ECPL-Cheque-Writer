# ECPL Cheque Writer v1.0.0

## 🎉 Initial Release

ECPL Cheque Writer is a desktop application for writing and printing cheques at exact 1:1 size onto A4 paper. Built with **Vue 3 + Tauri 2** (Vite, TypeScript, Rust).

### ✨ Features

- **Cheque design**: Position fields (date, payee, amount in figures/words, A/C Payee crossing) to match your bank's pre-printed cheque layout
- **WYSIWYG printing**: Prints at true physical size on A4 — 1 cm on screen = 1 cm on paper
- **Printer settings**: Place and rotate the cheque in the Printer Settings tab; output matches placement exactly
- **Multiple bank layouts**: Save and select different layout configurations
- **Printer profile management**: Save printer-specific positioning profiles

### 📦 Download & Install

Grab the installer for your machine from the **Releases** page:

| Platform | Installer | Notes |
|---|---|---|
| **macOS** | `.dmg` (universal binary: Apple Silicon + Intel) | First run: Right-click → Open → Open again, or run `xattr -dr com.apple.quarantine` |
| **Windows** | `-setup.exe` | SmartScreen warning: click "More info" → "Run anyway" (publisher is unknown for unsigned builds) |
| **Linux** | `.AppImage` / `.deb` / `.rpm` | Make executable before running |

> **Important**: These warnings are expected for free, unsigned builds. The app is safe to use.

### 🔧 Build from Source

You need **Node.js 20+** and **Rust** (https://rustup.rs):

```sh
npm ci
npm run tauri:build
```

The installer lands in `src-tauri/target/release/bundle/`.

### 🛠 Run in Development

```sh
npm run tauri:dev
```

### 🏗 All Build Targets

Run `npm run tauri:build` to build for the host platform, or consult the GitHub Actions workflow for all targets:

| Runner | Target | Artifact |
|---|---|---|
| macOS (Apple Silicon) | `universal-apple-darwin` | `.dmg` |
| Windows | `x86_64-pc-windows-msvc` | `-setup.exe`, `.msi` |
| Windows | `aarch64-pc-windows-msvc` | `-setup.exe`, `.msi` |
| Linux | `x86_64-unknown-linux-gnu` | `.AppImage`, `.deb`, `.rpm` |

### 🏷 Release Process

To cut a release and trigger automatic builds:

```sh
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will build installers for every architecture and attach them to the Release.

### 📄 License

Released under the **GNU General Public License v2.0** — see [LICENSE](LICENSE).

You're free to use, study, share and modify this software. Any modified version you distribute must also be released under GPL v2 with its source code made available — so the app can never be turned into a closed-source paid product.

### 🖨 Printing Notes

- Printing happens at **true physical size** on **A4**, one page, zero margins
- Place and rotate the cheque in the **Printer Settings** tab; the printed output matches that placement exactly
- 1 cm on screen is 1 cm on paper

---

*Tag `v1.0.0` and push to GitHub to trigger the builds!*
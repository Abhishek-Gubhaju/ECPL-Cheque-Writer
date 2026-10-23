# ECPL Cheque Writer

A desktop app for writing and printing cheques. Built with **Vue 3 + Tauri 2**
(Vite, TypeScript). Positions each field (date, payee, amount in figures/words,
A/C PayEE crossing) to your bank's pre-printed cheque layout, and prints it at
exact 1:1 size onto A4.

---

## Download & install

Grab the installer for your machine from the **Releases** page, then:

### macOS

Apple Silicon (M1/M2/M3/M4) and Intel both use the **`.dmg`**.

Because the app isn't signed with a paid Apple certificate, macOS will warn that
it's from an unidentified developer. To open it the first time:

- **Right-click** the app in Applications → **Open** → **Open** again, **or**
- Run this once in Terminal (replaces the quarantine flag):
  ```sh
  xattr -dr com.apple.quarantine "/Applications/ECPL Cheque Writer.app"
  ```

### Windows

Use the **`-setup.exe`** installer. Windows SmartScreen will warn that the
publisher is unknown. To install anyway:

- On the blue **"Windows protected your PC"** screen click **More info** → **Run anyway**, **or**
- Right-click the `.exe` → **Properties** → check **Unblock** → **Apply**, then run it.

> These warnings appear because the builds are unsigned (free distribution).
> They are not a sign that anything is wrong with the app.

### Linux

Install the **`.AppImage`** (runnable directly) or the **`.deb`** (Debian/Ubuntu).

---

## Build from source

You need **Node.js 20+** and **Rust** (https://rustup.rs).

| Platform | Extra prerequisites |
|---|---|
| macOS | Xcode Command Line Tools (`xcode-select --install`) |
| Windows | Visual Studio 2022 Build Tools, **"Desktop development with C++"** workload + a Windows SDK |
| Linux | `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev` |

Then:

```sh
npm ci
npm run tauri:build
```

The installer lands in `src-tauri/target/release/bundle/`.

### Run in development (hot reload)

```sh
npm run tauri:dev
```

### All build targets

```sh
npm run tauri:build                 # bundle for the host platform
npm run build                       # web build only (vue-tsc + vite build)
```

---

## Automatic builds (GitHub Actions)

Pushing a tag like `v1.0.0` triggers `.github/workflows/build.yml`, which builds
installers for every architecture and attaches them to a GitHub Release:

| Runner | Target | Artifact |
|---|---|---|
| macOS (Apple Silicon) | `universal-apple-darwin` | `.dmg` (runs on Apple Silicon **and** Intel) |
| Windows | `x86_64-pc-windows-msvc` | `-setup.exe`, `.msi` |
| Windows | `aarch64-pc-windows-msvc` | `-setup.exe`, `.msi` |
| Linux | `x86_64-unknown-linux-gnu` | `.AppImage`, `.deb`, `.rpm` |

The macOS build is a **universal binary**, so one `.dmg` covers both Apple
Silicon and Intel Macs. To cut a release:

```sh
git tag v1.0.0
git push origin v1.0.0
```

---

## Project structure

```
src/                    Vue app (components, store, styles, utils)
src-tauri/              Rust / Tauri shell
  src/main.rs           window, native menu, print command
  tauri.conf.json       window size, bundle icons, build command
  icons/                app icons (.icns for macOS, .ico for Windows, .png for Linux)
```

## License

Released under the **GNU General Public License v2.0** — see [LICENSE](LICENSE).

You're free to use, study, share and modify this software. Any modified version
you distribute must also be released under GPL v2 with its source code made
available — so the app can never be turned into a closed-source paid product.

## Printing notes

Printing happens at **true physical size** on **A4**, one page, zero margins —
so 1 cm on screen is 1 cm on paper. Place and rotate the cheque in the
**Printer Settings** tab; the printed output matches that placement exactly.

# Upload checklist — ECPL Cheque Writer

Every file the build needs. Total: **109 files**.

Files marked **CRITICAL** stop the build outright if missing. Everything
else is app source; a missing one shows up as a TypeScript error.

## (repository root) (11)

- [ ] `.gitignore`
- [ ] `AGENTS.md`
- [ ] `LICENSE`
- [ ] `README.md`
- [ ] `RELEASE_NOTES.md`
- [ ] `UPLOAD-CHECKLIST.md`
- [ ] `index.html` **CRITICAL**
- [ ] `package-lock.json` **CRITICAL**
- [ ] `package.json` **CRITICAL**
- [ ] `tsconfig.json` **CRITICAL**
- [ ] `vite.config.ts` **CRITICAL**

## .github (1)

- [ ] `.github/workflows/release.yml` **CRITICAL**

## src-tauri (62)

- [ ] `src-tauri/Cargo.lock` **CRITICAL**
- [ ] `src-tauri/Cargo.toml` **CRITICAL**
- [ ] `src-tauri/build.rs` **CRITICAL**
- [ ] `src-tauri/capabilities/default.json` **CRITICAL**
- [ ] `src-tauri/icons/128x128.png`
- [ ] `src-tauri/icons/128x128@2x.png`
- [ ] `src-tauri/icons/32x32.png`
- [ ] `src-tauri/icons/64x64.png`
- [ ] `src-tauri/icons/AppIcon.icns` **CRITICAL**
- [ ] `src-tauri/icons/AppIcon.ico`
- [ ] `src-tauri/icons/AppIcon.png` **CRITICAL**
- [ ] `src-tauri/icons/Square107x107Logo.png`
- [ ] `src-tauri/icons/Square142x142Logo.png`
- [ ] `src-tauri/icons/Square150x150Logo.png`
- [ ] `src-tauri/icons/Square284x284Logo.png`
- [ ] `src-tauri/icons/Square30x30Logo.png`
- [ ] `src-tauri/icons/Square310x310Logo.png`
- [ ] `src-tauri/icons/Square44x44Logo.png`
- [ ] `src-tauri/icons/Square71x71Logo.png`
- [ ] `src-tauri/icons/Square89x89Logo.png`
- [ ] `src-tauri/icons/StoreLogo.png`
- [ ] `src-tauri/icons/android/mipmap-anydpi-v26/ic_launcher.xml`
- [ ] `src-tauri/icons/android/mipmap-hdpi/ic_launcher.png`
- [ ] `src-tauri/icons/android/mipmap-hdpi/ic_launcher_foreground.png`
- [ ] `src-tauri/icons/android/mipmap-hdpi/ic_launcher_round.png`
- [ ] `src-tauri/icons/android/mipmap-mdpi/ic_launcher.png`
- [ ] `src-tauri/icons/android/mipmap-mdpi/ic_launcher_foreground.png`
- [ ] `src-tauri/icons/android/mipmap-mdpi/ic_launcher_round.png`
- [ ] `src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png`
- [ ] `src-tauri/icons/android/mipmap-xhdpi/ic_launcher_foreground.png`
- [ ] `src-tauri/icons/android/mipmap-xhdpi/ic_launcher_round.png`
- [ ] `src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png`
- [ ] `src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_foreground.png`
- [ ] `src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_round.png`
- [ ] `src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png`
- [ ] `src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png`
- [ ] `src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_round.png`
- [ ] `src-tauri/icons/android/values/ic_launcher_background.xml`
- [ ] `src-tauri/icons/app-icon.svg` **CRITICAL**
- [ ] `src-tauri/icons/icon.icns`
- [ ] `src-tauri/icons/icon.ico` **CRITICAL**
- [ ] `src-tauri/icons/icon.png`
- [ ] `src-tauri/icons/ios/AppIcon-20x20@1x.png`
- [ ] `src-tauri/icons/ios/AppIcon-20x20@2x-1.png`
- [ ] `src-tauri/icons/ios/AppIcon-20x20@2x.png`
- [ ] `src-tauri/icons/ios/AppIcon-20x20@3x.png`
- [ ] `src-tauri/icons/ios/AppIcon-29x29@1x.png`
- [ ] `src-tauri/icons/ios/AppIcon-29x29@2x-1.png`
- [ ] `src-tauri/icons/ios/AppIcon-29x29@2x.png`
- [ ] `src-tauri/icons/ios/AppIcon-29x29@3x.png`
- [ ] `src-tauri/icons/ios/AppIcon-40x40@1x.png`
- [ ] `src-tauri/icons/ios/AppIcon-40x40@2x-1.png`
- [ ] `src-tauri/icons/ios/AppIcon-40x40@2x.png`
- [ ] `src-tauri/icons/ios/AppIcon-40x40@3x.png`
- [ ] `src-tauri/icons/ios/AppIcon-512@2x.png`
- [ ] `src-tauri/icons/ios/AppIcon-60x60@2x.png`
- [ ] `src-tauri/icons/ios/AppIcon-60x60@3x.png`
- [ ] `src-tauri/icons/ios/AppIcon-76x76@1x.png`
- [ ] `src-tauri/icons/ios/AppIcon-76x76@2x.png`
- [ ] `src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png`
- [ ] `src-tauri/src/main.rs` **CRITICAL**
- [ ] `src-tauri/tauri.conf.json` **CRITICAL**

## src (33)

- [ ] `src/App.vue` **CRITICAL**
- [ ] `src/components/ChequeCanvas.vue`
- [ ] `src/components/ChequeOverlay.vue`
- [ ] `src/components/DateCells.vue`
- [ ] `src/components/EditorWorkspace.vue`
- [ ] `src/components/LdPanel.vue`
- [ ] `src/components/PrintPreview.vue`
- [ ] `src/components/PrinterPanel.vue`
- [ ] `src/components/PrinterWorkspace.vue`
- [ ] `src/components/ui/Button.vue`
- [ ] `src/components/ui/Checkbox.vue`
- [ ] `src/components/ui/Icon.vue`
- [ ] `src/components/ui/Input.vue`
- [ ] `src/components/ui/Modal.vue`
- [ ] `src/components/ui/PromptModal.vue`
- [ ] `src/components/ui/Section.vue`
- [ ] `src/components/ui/Segmented.vue`
- [ ] `src/components/ui/Select.vue`
- [ ] `src/components/ui/Toast.vue`
- [ ] `src/components/ui/index.ts`
- [ ] `src/hooks/index.ts`
- [ ] `src/hooks/usePrompt.ts`
- [ ] `src/main.ts` **CRITICAL**
- [ ] `src/store.ts` **CRITICAL**
- [ ] `src/styles/global.css`
- [ ] `src/styles/variables.css`
- [ ] `src/types/cheque.ts`
- [ ] `src/utils/image.ts`
- [ ] `src/utils/index.ts`
- [ ] `src/utils/print.ts`
- [ ] `src/utils/rupees.ts`
- [ ] `src/utils/units.ts`
- [ ] `src/vite-env.d.ts`

## scripts (2)

- [ ] `scripts/expected-files.txt` **CRITICAL**
- [ ] `scripts/make-upload-checklist.cjs`

## Verify before pushing

`scripts/expected-files.txt` is the machine-readable version of this list:
one path per line, 108 entries. GitHub Actions compares the repository
against it in its first step (`Verify project layout`) and prints every
missing path by name, so a bad upload is named instead of surfacing later
as a TypeScript or bundling error.

To check a local copy, from its root:

```sh
while read -r f; do [ -e "$f" ] || echo "MISSING: $f"; done < scripts/expected-files.txt
```

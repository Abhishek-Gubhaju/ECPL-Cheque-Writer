/**
 * Which OS the UI is running on.
 *
 * User-agent based on purpose, rather than `@tauri-apps/plugin-os`:
 *
 *  - the store picks its default field coordinates at module-init time,
 *    before any async IPC call could resolve;
 *  - it works in plain `npm run dev` (browser) as well as the packaged app;
 *  - it adds no npm dependency, no Rust crate and no capability to the bundle.
 *
 * WebView2 on Windows reports "Windows NT"; WKWebView on macOS reports
 * "Macintosh" / "Mac OS X". Both are stable across versions.
 */
const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent

export const isWindows = /Windows NT/i.test(ua)
export const isMacOS = /Macintosh|Mac OS X/i.test(ua)

/** Compact shortcut label, e.g. "⌘P" on macOS and "Ctrl+P" on Windows. */
export function shortcut(key: string): string {
  return isMacOS ? `⌘${key}` : `Ctrl+${key}`
}

/**
 * Stamp the platform on <html> once at startup so CSS can carry the
 * Windows-only chrome adjustments without a JS branch in every component.
 *
 * Values: "windows" | "macos" | "other".
 */
export function applyPlatformAttribute(): void {
  const root = document.documentElement
  root.dataset.platform = isWindows ? 'windows' : isMacOS ? 'macos' : 'other'
}

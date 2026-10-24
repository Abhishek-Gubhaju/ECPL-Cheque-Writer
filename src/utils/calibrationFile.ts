/**
 * Read/write the calibration JSON file.
 *
 * In the packaged app this goes through the native Save/Open dialog
 * (`@tauri-apps/plugin-dialog`) and two small Rust commands, so the file
 * lands wherever the user picks on either Windows or macOS. In plain
 * `npm run dev` (no Tauri) it falls back to a browser download and a file
 * input, which is enough to exercise the same code path.
 */
import { invoke } from '@tauri-apps/api/core'

const FILTERS = [{ name: 'JSON', extensions: ['json'] }]

function inTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/** Returns false when the user cancels the save dialog. */
export async function saveCalibrationFile(name: string, text: string): Promise<boolean> {
  if (inTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const path = await save({ defaultPath: name, filters: FILTERS })
    if (!path) return false
    await invoke('write_text_file', { path, contents: text })
    return true
  }

  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}

/** Returns null when the user cancels the open dialog. */
export async function openCalibrationFile(): Promise<string | null> {
  if (inTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const picked = await open({ multiple: false, directory: false, filters: FILTERS })
    if (!picked || Array.isArray(picked)) return null
    return await invoke<string>('read_text_file', { path: picked })
  }

  return await new Promise<string | null>((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      file.text().then(resolve, reject)
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

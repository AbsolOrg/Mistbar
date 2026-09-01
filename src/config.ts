import GLib from "gi://GLib?version=2.0"
import Gio from "gi://Gio?version=2.0"

export type MistbarTheme = "dark" | "light"
export type MistbarStyle = "glassy" | "transparent" | "solid"
export type MistbarLook = "pill" | "attached"

export interface MistbarConfig {
  theme: MistbarTheme
  style: MistbarStyle
  look: MistbarLook
  autoHide: boolean
  barHeight: number
  barMargin: number
  borderRadius: number
  showAppMenu: boolean
  showWorkspaces: boolean
  showTray: boolean
  showBattery: boolean
  showBrightness: boolean
  showVolume: boolean
  showNetwork: boolean
  showBluetooth: boolean
  showControlCenter: boolean
  showSpotlight: boolean
}

export const defaultConfig: MistbarConfig = {
  theme: "dark",
  style: "glassy",
  look: "pill",
  autoHide: false,
  barHeight: 28,
  barMargin: 6,
  borderRadius: 16,
  showAppMenu: true,
  showWorkspaces: true,
  showTray: true,
  showBattery: true,
  showBrightness: true,
  showVolume: true,
  showNetwork: true,
  showBluetooth: true,
  showControlCenter: true,
  showSpotlight: true,
}

const configDirPath = `${GLib.get_user_config_dir()}/mistbar`
const configFilePath = `${configDirPath}/config.json`

export function loadConfig(): MistbarConfig {
  try {
    if (GLib.file_test(configFilePath, GLib.FileTest.EXISTS)) {
      const file = Gio.File.new_for_path(configFilePath)
      const [, contents] = file.load_contents(null)
      const decoder = new TextDecoder("utf-8")
      const parsed = JSON.parse(decoder.decode(contents))
      return { ...defaultConfig, ...parsed }
    } else {
      saveDefaultConfig()
    }
  } catch (err) {
    console.error(`Error loading config from ${configFilePath}:`, err)
  }
  return { ...defaultConfig }
}

export function saveConfig(newConfig: Partial<MistbarConfig>): void {
  try {
    if (!GLib.file_test(configDirPath, GLib.FileTest.IS_DIR)) {
      GLib.mkdir_with_parents(configDirPath, 0o755)
    }
    const current = loadConfig()
    const merged = { ...current, ...newConfig }
    const file = Gio.File.new_for_path(configFilePath)
    const jsonStr = JSON.stringify(merged, null, 2)
    file.replace_contents(
      jsonStr,
      null,
      false,
      Gio.FileCreateFlags.REPLACE_DESTINATION,
      null
    )
  } catch (err) {
    console.error(`Error saving config to ${configFilePath}:`, err)
  }
}

export function saveDefaultConfig(): void {
  try {
    if (!GLib.file_test(configDirPath, GLib.FileTest.IS_DIR)) {
      GLib.mkdir_with_parents(configDirPath, 0o755)
    }
    const file = Gio.File.new_for_path(configFilePath)
    const jsonStr = JSON.stringify(defaultConfig, null, 2)
    file.replace_contents(
      jsonStr,
      null,
      false,
      Gio.FileCreateFlags.REPLACE_DESTINATION,
      null
    )
  } catch (err) {
    console.error(`Error saving default config to ${configFilePath}:`, err)
  }
}

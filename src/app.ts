import app from "ags/gtk4/app"
import style from "./styles/style.scss"
import Bar, {
  setBarAutohide,
  getBarAutohide,
  getBarWindows,
  getBarWindow,
  setBarManuallyHidden,
  toggleBarManuallyHidden,
  isBarManuallyHidden,
} from "./bar/Bar"
import { loadConfig, saveConfig, MistbarStyle, MistbarLook, MistbarTheme } from "./config"

const config = loadConfig()

function getWindows(): any[] {
  const wins: any[] = []
  const barWins = getBarWindows()
  if (barWins && barWins.length > 0) {
    wins.push(...barWins)
  }
  try {
    const appWins = (app as any).get_windows ? (app as any).get_windows() : []
    if (appWins && appWins.length > 0) {
      for (const w of appWins) {
        if (!wins.includes(w) && (w.name === "mistbar" || w.namespace === "mistbar")) {
          wins.push(w)
        }
      }
    }
  } catch {}
  return wins
}

function applyStyleClass(newStyle: MistbarStyle, fontColor?: string) {
  config.style = newStyle
  if (fontColor === "dark" || fontColor === "white") {
    config.glassyTextColor = fontColor
  }
  const effectiveFontColor = config.glassyTextColor || "white"

  for (const win of getWindows()) {
    try {
      win.remove_css_class("style-glassy")
      win.remove_css_class("style-transparent")
      win.remove_css_class("style-solid")
      win.remove_css_class("glassy-dark")
      win.remove_css_class("glassy-white")

      win.add_css_class(`style-${newStyle}`)
      if (newStyle === "glassy") {
        win.add_css_class(`glassy-${effectiveFontColor}`)
      }
    } catch (err) {
      console.error("Error applying style class:", err)
    }
  }
}

function applyLookClass(newLook: MistbarLook) {
  config.look = newLook
  for (const win of getWindows()) {
    try {
      win.remove_css_class("look-pill")
      win.remove_css_class("look-attached")
      win.add_css_class(`look-${newLook}`)
      if (newLook === "pill") {
        win.margin_top = config.barMargin ?? 6
        win.margin_left = 12
        win.margin_right = 12
        win.margin_bottom = 0
      } else {
        win.margin_top = 0
        win.margin_left = 0
        win.margin_right = 0
        win.margin_bottom = 0
      }
    } catch (err) {
      console.error("Error applying look class:", err)
    }
  }
}

function applyThemeClass(newTheme: MistbarTheme) {
  config.theme = newTheme
  for (const win of getWindows()) {
    try {
      if (newTheme === "light") {
        win.add_css_class("light-theme")
      } else {
        win.remove_css_class("light-theme")
      }
    } catch (err) {
      console.error("Error applying theme class:", err)
    }
  }
}

app.start({
  instanceName: "mistbar",
  css: style,
  requestHandler(args: string[], res: (response: string) => void) {
    const cmd = (Array.isArray(args) ? args.join(" ") : String(args)).trim()
    if (cmd === "hide") {
      setBarManuallyHidden(true)
      res("hidden completely (disabled cursor toggles)")
    } else if (cmd === "show") {
      setBarManuallyHidden(false)
      setBarAutohide(false)
      config.autoHide = false
      saveConfig({ autoHide: false })
      res("shown (always visible)")
    } else if (cmd === "autohide:on" || cmd === "auto-hide on" || cmd === "autohide on") {
      setBarManuallyHidden(false)
      setBarAutohide(true)
      config.autoHide = true
      saveConfig({ autoHide: true })
      res("autohide on (reveals on hover)")
    } else if (cmd === "autohide:off" || cmd === "auto-hide off" || cmd === "autohide off") {
      setBarManuallyHidden(false)
      setBarAutohide(false)
      config.autoHide = false
      saveConfig({ autoHide: false })
      res("autohide off (always visible)")
    } else if (cmd === "toggle" || cmd === "autohide:toggle" || cmd === "auto-hide toggle" || cmd === "autohide toggle") {
      if (isBarManuallyHidden()) {
        setBarManuallyHidden(false)
        res(config.autoHide ? "autohide on (reveals on hover)" : "autohide off (always visible)")
      } else {
        const next = !config.autoHide
        setBarManuallyHidden(false)
        setBarAutohide(next)
        config.autoHide = next
        saveConfig({ autoHide: next })
        res(next ? "autohide on (reveals on hover)" : "autohide off (always visible)")
      }
    } else if (cmd.startsWith("autohide:") || cmd.startsWith("auto-hide:")) {
      const val = cmd.replace(/^auto-?hide:/, "").trim()
      const enabled = val === "on" || val === "true" || val === "1"
      setBarManuallyHidden(false)
      setBarAutohide(enabled)
      config.autoHide = enabled
      saveConfig({ autoHide: enabled })
      res(enabled ? "autohide on (reveals on hover)" : "autohide off (always visible)")
    } else if (cmd.startsWith("theme:")) {
      const theme = cmd.replace("theme:", "").trim() as MistbarTheme
      applyThemeClass(theme)
      saveConfig({ theme })
      res(`theme set to ${theme}`)
    } else if (cmd.startsWith("style:")) {
      const parts = cmd.replace("style:", "").trim().split(/[:\s]+/)
      const styleName = parts[0] as MistbarStyle
      let fontColor: string | undefined = parts[1]?.toLowerCase()
      if (fontColor === "light") fontColor = "white"
      if (fontColor === "black") fontColor = "dark"

      applyStyleClass(styleName, fontColor)
      const saveObj: Partial<MistbarConfig> = { style: styleName }
      if (fontColor === "dark" || fontColor === "white") {
        saveObj.glassyTextColor = fontColor
      }
      saveConfig(saveObj)
      const colorMsg = (styleName === "glassy" && fontColor) ? ` (${fontColor} fonts & logos)` : ""
      res(`style set to ${styleName}${colorMsg}`)
    } else if (cmd.startsWith("look:")) {
      const lookName = cmd.replace("look:", "").trim() as MistbarLook
      applyLookClass(lookName)
      saveConfig({ look: lookName })
      res(`look set to ${lookName}`)
    } else if (cmd === "status") {
      const isVis = !isBarManuallyHidden()
      const glassyInfo = config.style === "glassy" ? ` (fonts: ${config.glassyTextColor || "white"})` : ""
      res(`running (theme: ${config.theme || "dark"}, style: ${config.style || "glassy"}${glassyInfo}, look: ${config.look || "pill"}, autohide: ${config.autoHide ? "on" : "off"}, manually_hidden: ${isBarManuallyHidden() ? "yes" : "no"})`)
    } else {
      res(`unknown command: ${cmd}`)
    }
  },
  main() {
    const monitors = app.get_monitors()
    if (monitors.length > 0) {
      for (const m of monitors) {
        Bar(m, config)
      }
    }

    applyThemeClass(config.theme || "dark")
    applyStyleClass(config.style || "glassy", config.glassyTextColor)
    applyLookClass(config.look || "pill")
  },
})

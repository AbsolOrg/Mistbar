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
        if (!wins.includes(w)) wins.push(w)
      }
    }
  } catch {}
  return wins
}

function applyStyleClass(newStyle: MistbarStyle) {
  config.style = newStyle
  for (const win of getWindows()) {
    try {
      win.remove_css_class("style-glassy")
      win.remove_css_class("style-transparent")
      win.remove_css_class("style-solid")
      win.add_css_class(`style-${newStyle}`)
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
    const cmd = args.join(" ").trim()

    if (cmd === "toggle") {
      const hidden = toggleBarManuallyHidden()
      res(hidden ? "hidden" : "shown")
    } else if (cmd === "hide") {
      setBarManuallyHidden(true)
      res("hidden")
    } else if (cmd === "show") {
      setBarManuallyHidden(false)
      res("shown")
    } else if (cmd.startsWith("autohide:") || cmd === "autohide") {
      const mode = cmd.replace("autohide:", "").trim()
      let enabled = true
      if (mode === "off" || mode === "false" || mode === "disable") {
        enabled = false
      } else if (mode === "toggle" || mode === "autohide") {
        enabled = !getBarAutohide()
      }
      setBarManuallyHidden(false)
      setBarAutohide(enabled)
      config.autoHide = enabled
      saveConfig({ autoHide: enabled })
      res(`autohide set to ${enabled ? "on" : "off"}`)
    } else if (cmd.startsWith("theme:")) {
      const theme = cmd.replace("theme:", "").trim() as MistbarTheme
      applyThemeClass(theme)
      saveConfig({ theme })
      res(`theme set to ${theme}`)
    } else if (cmd.startsWith("style:")) {
      const styleName = cmd.replace("style:", "").trim() as MistbarStyle
      applyStyleClass(styleName)
      saveConfig({ style: styleName })
      res(`style set to ${styleName}`)
    } else if (cmd.startsWith("look:")) {
      const lookName = cmd.replace("look:", "").trim() as MistbarLook
      applyLookClass(lookName)
      saveConfig({ look: lookName })
      res(`look set to ${lookName}`)
    } else if (cmd === "status") {
      const isVis = !isBarManuallyHidden()
      res(`running (theme: ${config.theme || "dark"}, style: ${config.style || "glassy"}, look: ${config.look || "pill"}, autohide: ${config.autoHide ? "on" : "off"}, visible: ${isVis ? "yes" : "no"})`)
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
    applyStyleClass(config.style || "glassy")
    applyLookClass(config.look || "pill")
  },
})

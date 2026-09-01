import app from "ags/gtk4/app"
import style from "./styles/style.scss"
import Bar, { setBarAutohide, getBarAutohide, getBarWindow } from "./bar/Bar"
import { loadConfig, saveConfig, MistbarStyle, MistbarLook, MistbarTheme } from "./config"

const config = loadConfig()

function getWindow(): any {
  return getBarWindow() || app.get_window("mistbar")
}

function applyStyleClass(win: any, newStyle: MistbarStyle) {
  if (!win) return
  try {
    win.remove_css_class("style-glassy")
    win.remove_css_class("style-transparent")
    win.remove_css_class("style-solid")
    win.add_css_class(`style-${newStyle}`)
  } catch (err) {
    console.error("Error applying style class:", err)
  }
}

function applyLookClass(win: any, newLook: MistbarLook) {
  if (!win) return
  try {
    win.remove_css_class("look-pill")
    win.remove_css_class("look-attached")
    win.add_css_class(`look-${newLook}`)
  } catch (err) {
    console.error("Error applying look class:", err)
  }
}

function applyThemeClass(win: any, newTheme: MistbarTheme) {
  if (!win) return
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

app.start({
  instanceName: "mistbar",
  css: style,
  requestHandler(args: string[], res: (response: string) => void) {
    const cmd = args.join(" ").trim()
    const win = getWindow()

    if (cmd === "toggle") {
      if (win) {
        win.visible = !win.visible
        res("toggled")
      } else {
        res("error: window not found")
      }
    } else if (cmd === "hide") {
      if (win) {
        win.visible = false
        res("hidden")
      } else {
        res("error: window not found")
      }
    } else if (cmd === "show") {
      if (win) {
        win.visible = true
        setBarAutohide(false)
        res("shown")
      } else {
        res("error: window not found")
      }
    } else if (cmd.startsWith("autohide:") || cmd === "autohide") {
      const mode = cmd.replace("autohide:", "").trim()
      let enabled = true
      if (mode === "off" || mode === "false" || mode === "disable") {
        enabled = false
      } else if (mode === "toggle" || mode === "autohide") {
        enabled = !getBarAutohide()
      }
      if (win) {
        win.visible = true
      }
      setBarAutohide(enabled)
      saveConfig({ autoHide: enabled })
      res(`autohide set to ${enabled ? "on" : "off"}`)
    } else if (cmd.startsWith("theme:")) {
      const theme = cmd.replace("theme:", "").trim() as MistbarTheme
      if (win) {
        applyThemeClass(win, theme)
        saveConfig({ theme })
        res(`theme set to ${theme}`)
      } else {
        res("error: window not found")
      }
    } else if (cmd.startsWith("style:")) {
      const styleName = cmd.replace("style:", "").trim() as MistbarStyle
      if (win) {
        applyStyleClass(win, styleName)
        saveConfig({ style: styleName })
        res(`style set to ${styleName}`)
      } else {
        res("error: window not found")
      }
    } else if (cmd.startsWith("look:")) {
      const lookName = cmd.replace("look:", "").trim() as MistbarLook
      if (win) {
        applyLookClass(win, lookName)
        saveConfig({ look: lookName })
        res(`look set to ${lookName}`)
      } else {
        res("error: window not found")
      }
    } else if (cmd === "status") {
      const isVisible = win && (typeof win.get_visible === "function" ? win.get_visible() : win.visible)
      res(isVisible ? "running (visible)" : "running (hidden)")
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

    const win = getWindow()
    if (win) {
      applyThemeClass(win, config.theme || "dark")
      applyStyleClass(win, config.style || "glassy")
      applyLookClass(win, config.look || "pill")
    }
  },
})

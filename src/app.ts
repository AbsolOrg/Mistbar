import app from "ags/gtk4/app"
import style from "./styles/style.scss"
import Bar from "./bar/Bar"
import { loadConfig, saveConfig, MistbarStyle, MistbarLook, MistbarTheme } from "./config"

const config = loadConfig()

function applyStyleClass(win: any, newStyle: MistbarStyle) {
  win.remove_css_class("style-glassy")
  win.remove_css_class("style-transparent")
  win.remove_css_class("style-solid")
  win.add_css_class(`style-${newStyle}`)
}

function applyLookClass(win: any, newLook: MistbarLook) {
  win.remove_css_class("look-pill")
  win.remove_css_class("look-attached")
  win.add_css_class(`look-${newLook}`)
}

function applyThemeClass(win: any, newTheme: MistbarTheme) {
  if (newTheme === "light") {
    win.add_css_class("light-theme")
  } else {
    win.remove_css_class("light-theme")
  }
}

app.start({
  instanceName: "mistbar",
  css: style,
  requestHandler(args: string[], res: (response: string) => void) {
    const cmd = args.join(" ").trim()

    if (cmd === "toggle") {
      try {
        app.toggle_window("mistbar")
        res("toggled")
      } catch {
        res("error: window not found")
      }
    } else if (cmd === "hide") {
      const win = app.get_window("mistbar")
      if (win) {
        win.visible = false
        res("hidden")
      } else {
        res("error: window not found")
      }
    } else if (cmd === "show") {
      const win = app.get_window("mistbar")
      if (win) {
        win.visible = true
        res("shown")
      } else {
        res("error: window not found")
      }
    } else if (cmd.startsWith("theme:")) {
      const theme = cmd.replace("theme:", "").trim() as MistbarTheme
      const win = app.get_window("mistbar")
      if (win) {
        applyThemeClass(win, theme)
        saveConfig({ theme })
        res(`theme set to ${theme}`)
      } else {
        res("error: window not found")
      }
    } else if (cmd.startsWith("style:")) {
      const styleName = cmd.replace("style:", "").trim() as MistbarStyle
      const win = app.get_window("mistbar")
      if (win) {
        applyStyleClass(win, styleName)
        saveConfig({ style: styleName })
        res(`style set to ${styleName}`)
      } else {
        res("error: window not found")
      }
    } else if (cmd.startsWith("look:")) {
      const lookName = cmd.replace("look:", "").trim() as MistbarLook
      const win = app.get_window("mistbar")
      if (win) {
        applyLookClass(win, lookName)
        saveConfig({ look: lookName })
        res(`look set to ${lookName}`)
      } else {
        res("error: window not found")
      }
    } else if (cmd === "status") {
      const win = app.get_window("mistbar")
      res(win && win.visible ? "running (visible)" : "running (hidden)")
    } else {
      res(`unknown command: ${cmd}`)
    }
  },
  main() {
    const monitors = app.get_monitors()
    if (monitors.length > 0) {
      const win = Bar(monitors[0], config)
      if (win) {
        applyThemeClass(win, config.theme || "dark")
        applyStyleClass(win, config.style || "glassy")
        applyLookClass(win, config.look || "pill")
      }
    }
  },
})

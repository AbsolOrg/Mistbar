import app from "ags/gtk4/app"
import style from "./styles/style.scss"
import Bar from "./bar/Bar"
import { loadConfig } from "./config"

const config = loadConfig()

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
      const theme = cmd.replace("theme:", "").trim()
      const win = app.get_window("mistbar")
      if (win) {
        if (theme === "light") {
          win.add_css_class("light-theme")
        } else {
          win.remove_css_class("light-theme")
        }
        res(`theme set to ${theme}`)
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
      if (config.theme === "light" && win) {
        win.add_css_class("light-theme")
      }
    }
  },
})

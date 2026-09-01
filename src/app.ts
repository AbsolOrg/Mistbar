import app from "ags/gtk4/app"
import style from "./styles/style.scss"
import Bar from "./bar/Bar"

app.start({
  instanceName: "mistbar",
  css: style,
  main() {
    const monitors = app.get_monitors()
    if (monitors.length > 0) {
      Bar(monitors[0])
    }
  },
})

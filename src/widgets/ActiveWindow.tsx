import { createPoll } from "ags/time"

// Poll niri for the focused window title
const focusedTitle = createPoll(
  "Desktop",
  500,
  ["bash", "-c", "niri msg --json focused-window 2>/dev/null || echo '{}'"],
  (out: string) => {
    try {
      const data = JSON.parse(out)
      if (data && data.app_id) {
        // Format app_id nicely: e.g. "org.mozilla.firefox" -> "Firefox"
        const parts = data.app_id.split(".")
        let name = parts[parts.length - 1] || "Desktop"
        name = name.charAt(0).toUpperCase() + name.slice(1)
        if (name.length > 25) {
          name = name.slice(0, 24) + "…"
        }
        return name
      }
      return "Desktop"
    } catch {
      return "Desktop"
    }
  }
)

export default function ActiveWindow() {
  return (
    <label
      class="active-window"
      label={focusedTitle}
    />
  )
}

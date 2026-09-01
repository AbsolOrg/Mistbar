import Gtk from "gi://Gtk?version=4.0"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

// Poll brightnessctl for brightness level
const brightnessIcon = createPoll(
  "󰃠",
  2000,
  ["bash", "-c", "brightnessctl -m 2>/dev/null || echo ',,,100%'"],
  (out: string) => {
    const parts = out.split(",")
    const percentStr = parts[3] || "100%"
    const percent = parseInt(percentStr.replace("%", "")) || 100

    if (percent >= 75) return "󰃠"
    if (percent >= 50) return "󰃟"
    if (percent >= 25) return "󰃞"
    return "󰃝"
  }
)

const brightnessTooltip = createPoll(
  "Brightness: 100%",
  2000,
  ["bash", "-c", "brightnessctl -m 2>/dev/null || echo ',,,100%'"],
  (out: string) => {
    const parts = out.split(",")
    const percentStr = parts[3] || "100%"
    const percent = parseInt(percentStr.replace("%", "")) || 100
    return `Brightness: ${percent}%`
  }
)

export default function Brightness() {
  return (
    <button
      class="status-icon brightness"
      $={(self: Gtk.Button) => {
        const scroll = new Gtk.EventControllerScroll({
          flags: Gtk.EventControllerScrollFlags.VERTICAL,
        })
        scroll.connect("scroll", (_c, _dx, dy) => {
          const cmd = dy < 0 ? "5%+" : "5%-"
          execAsync(["brightnessctl", "set", cmd]).catch(console.error)
          return true
        })
        self.add_controller(scroll)
      }}
      tooltipText={brightnessTooltip}
    >
      <label
        class="status-icon-label"
        label={brightnessIcon}
      />
    </button>
  )
}

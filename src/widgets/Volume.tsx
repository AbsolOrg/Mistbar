import Gtk from "gi://Gtk?version=4.0"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

// Poll wpctl for volume status
const volumeIcon = createPoll(
  "󰕾",
  1000,
  ["bash", "-c", "wpctl get-volume @DEFAULT_AUDIO_SINK@ 2>/dev/null || echo 'Volume: 0.00'"],
  (out: string) => {
    const muted = out.includes("[MUTED]")
    const match = out.match(/Volume:\s+([\d.]+)/)
    const volume = match ? Math.round(parseFloat(match[1]) * 100) : 0

    if (muted || volume === 0) return "󰝟"
    if (volume < 33) return "󰕿"
    if (volume < 66) return "󰖀"
    return "󰕾"
  }
)

const volumeTooltip = createPoll(
  "Volume: 100%",
  1000,
  ["bash", "-c", "wpctl get-volume @DEFAULT_AUDIO_SINK@ 2>/dev/null || echo 'Volume: 0.00'"],
  (out: string) => {
    const muted = out.includes("[MUTED]")
    const match = out.match(/Volume:\s+([\d.]+)/)
    const volume = match ? Math.round(parseFloat(match[1]) * 100) : 0
    return `Volume: ${volume}%${muted ? " (Muted)" : ""}`
  }
)

export default function Volume() {
  return (
    <button
      class="status-icon volume"
      onClicked={() => execAsync(["wpctl", "set-mute", "@DEFAULT_AUDIO_SINK@", "toggle"]).catch(console.error)}
      $={(self: Gtk.Button) => {
        const scroll = new Gtk.EventControllerScroll({
          flags: Gtk.EventControllerScrollFlags.VERTICAL,
        })
        scroll.connect("scroll", (_c, _dx, dy) => {
          const step = dy < 0 ? "5%+" : "5%-"
          execAsync(["wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", step]).catch(console.error)
          return true
        })
        self.add_controller(scroll)
      }}
      tooltipText={volumeTooltip}
    >
      <label class="status-icon-label" label={volumeIcon} />
    </button>
  )
}

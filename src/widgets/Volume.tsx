import Gtk from "gi://Gtk?version=4.0"
import Astal from "gi://Astal?version=4.0"
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

const volumePercent = createPoll(
  "100%",
  1000,
  ["bash", "-c", "wpctl get-volume @DEFAULT_AUDIO_SINK@ 2>/dev/null || echo 'Volume: 0.00'"],
  (out: string) => {
    const muted = out.includes("[MUTED]")
    const match = out.match(/Volume:\s+([\d.]+)/)
    const volume = match ? Math.round(parseFloat(match[1]) * 100) : 0
    return `${volume}%${muted ? " (Muted)" : ""}`
  }
)

const sinkName = createPoll(
  "Default Audio",
  5000,
  ["bash", "-c", "wpctl status 2>/dev/null | grep -A 2 'Sinks:' | grep -E '\\*' | sed 's/.*\\*\\s*[0-9]*\\.\\s*//;s/\\[.*\\]//' | tr -d '\\n'"],
  (out: string) => out.trim() || "Built-in Audio"
)

export default function Volume() {
  return (
    <menubutton
      class="status-icon volume"
      tooltipText={volumePercent}
      $={(self: Gtk.MenuButton) => {
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
    >
      <label class="status-icon-label" label={volumeIcon} />

      <popover class="control-popover volume-popover">
        <box orientation={Gtk.Orientation.VERTICAL} spacing={10} class="popover-container">
          <box class="popover-header" spacing={8}>
            <label class="popover-title" label="Sound" hexpand halign={Gtk.Align.START} />
            <label class="popover-subtitle" label={volumePercent} />
          </box>

          <box class="control-slider-box" spacing={8}>
            <label class="slider-icon" label="󰕿" />
            <slider
              class="control-slider"
              hexpand
              min={0}
              max={100}
              step={1}
              value={100}
              $={(self: Astal.Slider) => {
                // Initialize value from system
                execAsync(["bash", "-c", "wpctl get-volume @DEFAULT_AUDIO_SINK@ 2>/dev/null"]).then((out) => {
                  const match = out.match(/Volume:\s+([\d.]+)/)
                  if (match) self.set_value(Math.round(parseFloat(match[1]) * 100))
                }).catch(console.error)

                // Update system volume on slider drag
                self.connect("notify::value", () => {
                  const val = (self.get_value() / 100).toFixed(2)
                  execAsync(["wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", val]).catch(console.error)
                })
              }}
            />
            <label class="slider-icon" label="󰕾" />
          </box>

          <Gtk.Separator />

          <box class="popover-card" spacing={8}>
            <label class="card-icon" label="󰓃" />
            <box orientation={Gtk.Orientation.VERTICAL} hexpand>
              <label class="card-title" label="Output Device" halign={Gtk.Align.START} />
              <label class="card-subtitle" label={sinkName} halign={Gtk.Align.START} />
            </box>
            <button
              class="popover-toggle-btn"
              onClicked={() => execAsync(["wpctl", "set-mute", "@DEFAULT_AUDIO_SINK@", "toggle"]).catch(console.error)}
              tooltipText="Toggle Mute"
            >
              <label label="Mute" />
            </button>
          </box>
        </box>
      </popover>
    </menubutton>
  )
}

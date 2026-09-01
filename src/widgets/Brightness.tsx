import Gtk from "gi://Gtk?version=4.0"
import Astal from "gi://Astal?version=4.0"
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

const brightnessPercent = createPoll(
  "100%",
  2000,
  ["bash", "-c", "brightnessctl -m 2>/dev/null || echo ',,,100%'"],
  (out: string) => {
    const parts = out.split(",")
    const percentStr = parts[3] || "100%"
    return percentStr
  }
)

export default function Brightness() {
  return (
    <menubutton
      class="status-icon brightness"
      tooltipText={brightnessPercent}
      $={(self: Gtk.MenuButton) => {
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
    >
      <label class="status-icon-label" label={brightnessIcon} />

      <popover class="control-popover brightness-popover">
        <box orientation={Gtk.Orientation.VERTICAL} spacing={10} class="popover-container">
          <box class="popover-header" spacing={8}>
            <label class="popover-title" label="Display" hexpand halign={Gtk.Align.START} />
            <label class="popover-subtitle" label={brightnessPercent} />
          </box>

          <box class="control-slider-box" spacing={8}>
            <label class="slider-icon" label="󰃝" />
            <slider
              class="control-slider"
              hexpand
              min={5}
              max={100}
              step={1}
              value={100}
              $={(self: Astal.Slider) => {
                // Initialize value
                execAsync(["bash", "-c", "brightnessctl -m 2>/dev/null"]).then((out) => {
                  const parts = out.split(",")
                  const pct = parseInt(parts[3]?.replace("%", "") || "100")
                  if (!isNaN(pct)) self.set_value(pct)
                }).catch(console.error)

                // Update on slider drag
                self.connect("notify::value", () => {
                  const val = Math.round(self.get_value())
                  execAsync(["brightnessctl", "set", `${val}%`]).catch(console.error)
                })
              }}
            />
            <label class="slider-icon" label="󰃠" />
          </box>

          <Gtk.Separator />

          <box class="preset-box" spacing={6} halign={Gtk.Align.CENTER}>
            <button
              class="preset-btn"
              onClicked={() => execAsync(["brightnessctl", "set", "25%"]).catch(console.error)}
            >
              <label label="25%" />
            </button>
            <button
              class="preset-btn"
              onClicked={() => execAsync(["brightnessctl", "set", "50%"]).catch(console.error)}
            >
              <label label="50%" />
            </button>
            <button
              class="preset-btn"
              onClicked={() => execAsync(["brightnessctl", "set", "75%"]).catch(console.error)}
            >
              <label label="75%" />
            </button>
            <button
              class="preset-btn"
              onClicked={() => execAsync(["brightnessctl", "set", "100%"]).catch(console.error)}
            >
              <label label="100%" />
            </button>
          </box>
        </box>
      </popover>
    </menubutton>
  )
}

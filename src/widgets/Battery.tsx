import Gtk from "gi://Gtk?version=4.0"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

const batteryIcon = createPoll(
  "󰁹",
  5000,
  ["bash", "-c", "cat /sys/class/power_supply/BAT*/capacity 2>/dev/null | head -1; echo '|'; cat /sys/class/power_supply/BAT*/status 2>/dev/null | head -1"],
  (out: string) => {
    const parts = out.split("|")
    const percent = parseInt(parts[0]?.trim() || "100")
    const status = parts[1]?.trim() || "Full"
    const charging = status === "Charging"

    if (charging) return "󰂄"
    if (percent >= 90) return "󰁹"
    if (percent >= 70) return "󰂀"
    if (percent >= 50) return "󰁾"
    if (percent >= 30) return "󰁼"
    if (percent >= 15) return "󰁻"
    return "󰂃"
  }
)

const batteryPercent = createPoll(
  "100%",
  5000,
  ["bash", "-c", "cat /sys/class/power_supply/BAT*/capacity 2>/dev/null | head -1"],
  (out: string) => {
    const val = out.trim()
    return val ? `${val}%` : "100%"
  }
)

const batteryStatus = createPoll(
  "Full",
  5000,
  ["bash", "-c", "cat /sys/class/power_supply/BAT*/status 2>/dev/null | head -1"],
  (out: string) => out.trim() || "Full"
)

const powerProfile = createPoll(
  "balanced",
  5000,
  ["bash", "-c", "powerprofilesctl get 2>/dev/null || echo 'balanced'"],
  (out: string) => out.trim()
)

export default function Battery() {
  return (
    <menubutton
      class="status-icon battery"
      tooltipText={batteryPercent((p) => `Battery: ${p}`)}
    >
      <label
        class="status-icon-label"
        label={batteryIcon}
      />

      <popover class="control-popover battery-popover">
        <box orientation={Gtk.Orientation.VERTICAL} spacing={10} class="popover-container">
          <box class="popover-header" spacing={8}>
            <label class="popover-title" label="Battery" hexpand halign={Gtk.Align.START} />
            <label class="popover-subtitle" label={batteryPercent} />
          </box>

          <box class="popover-card" spacing={8}>
            <label class="card-icon" label={batteryIcon} />
            <box orientation={Gtk.Orientation.VERTICAL} hexpand>
              <label class="card-title" label="Power Source" halign={Gtk.Align.START} />
              <label class="card-subtitle" label={batteryStatus((s) => `State: ${s}`)} halign={Gtk.Align.START} />
            </box>
          </box>

          <Gtk.Separator />

          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <label class="section-subtitle" label="Power Mode" halign={Gtk.Align.START} />
            <box class="preset-box" spacing={6} halign={Gtk.Align.CENTER}>
              <button
                class={powerProfile((p) => `preset-btn ${p === "power-saver" ? "active" : ""}`)}
                onClicked={() => execAsync(["powerprofilesctl", "set", "power-saver"]).catch(console.error)}
              >
                <label label="Saver" />
              </button>
              <button
                class={powerProfile((p) => `preset-btn ${p === "balanced" ? "active" : ""}`)}
                onClicked={() => execAsync(["powerprofilesctl", "set", "balanced"]).catch(console.error)}
              >
                <label label="Balanced" />
              </button>
              <button
                class={powerProfile((p) => `preset-btn ${p === "performance" ? "active" : ""}`)}
                onClicked={() => execAsync(["powerprofilesctl", "set", "performance"]).catch(console.error)}
              >
                <label label="Performance" />
              </button>
            </box>
          </box>
        </box>
      </popover>
    </menubutton>
  )
}

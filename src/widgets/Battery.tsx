import { createPoll } from "ags/time"

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
    return val ? `${val}%` : ""
  }
)

const batteryTooltip = createPoll(
  "Battery: 100%",
  5000,
  ["bash", "-c", "cat /sys/class/power_supply/BAT*/capacity 2>/dev/null | head -1; echo '|'; cat /sys/class/power_supply/BAT*/status 2>/dev/null | head -1"],
  (out: string) => {
    const parts = out.split("|")
    const percent = parseInt(parts[0]?.trim() || "100")
    const status = parts[1]?.trim() || "Full"
    return `Battery: ${percent}% (${status})`
  }
)

export default function Battery() {
  return (
    <box class="battery-widget">
      <button
        class="status-icon battery"
        tooltipText={batteryTooltip}
      >
        <box spacing={4}>
          <label
            class="status-icon-label"
            label={batteryIcon}
          />
          <label
            class="battery-percent"
            label={batteryPercent}
          />
        </box>
      </button>
    </box>
  )
}

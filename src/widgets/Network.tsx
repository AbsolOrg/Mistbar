import { createPoll } from "ags/time"

// Poll nmcli for Wi-Fi status
const networkIcon = createPoll(
  "󰤭",
  3000,
  ["bash", "-c", "nmcli -t -f GENERAL.STATE,GENERAL.CONNECTION device show 2>/dev/null | head -4"],
  (out: string) => {
    const lines = out.trim().split("\n")
    let connected = false
    let ssid = ""

    for (const line of lines) {
      if (line.includes("GENERAL.STATE") && line.includes("connected")) {
        connected = true
      }
      if (line.includes("GENERAL.CONNECTION")) {
        ssid = line.split(":").slice(1).join(":").trim()
        if (ssid === "--") ssid = ""
      }
    }

    if (connected && ssid) {
      return "󰤨" // wifi connected
    } else if (connected) {
      return "󰤡" // wired connected
    }
    return "󰤭" // disconnected
  }
)

const networkTooltip = createPoll(
  "Wi-Fi: Disconnected",
  3000,
  ["bash", "-c", "nmcli -t -f GENERAL.STATE,GENERAL.CONNECTION device show 2>/dev/null | head -4"],
  (out: string) => {
    const lines = out.trim().split("\n")
    let connected = false
    let ssid = ""

    for (const line of lines) {
      if (line.includes("GENERAL.STATE") && line.includes("connected")) {
        connected = true
      }
      if (line.includes("GENERAL.CONNECTION")) {
        ssid = line.split(":").slice(1).join(":").trim()
        if (ssid === "--") ssid = ""
      }
    }

    if (connected && ssid) {
      return `Wi-Fi: ${ssid}`
    } else if (connected) {
      return "Network: Connected (Wired)"
    }
    return "Wi-Fi: Disconnected"
  }
)

export default function Network() {
  return (
    <button
      class="status-icon network"
      tooltipText={networkTooltip}
    >
      <label
        class="status-icon-label"
        label={networkIcon}
      />
    </button>
  )
}

import Gtk from "gi://Gtk?version=4.0"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

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

const wifiStatusText = createPoll(
  "Disconnected",
  4000,
  ["bash", "-c", "nmcli -t -f ACTIVE,SSID dev wifi 2>/dev/null | grep -E '^yes:' | cut -d: -f2 || echo 'Not Connected'"],
  (out: string) => out.trim() || "Not Connected"
)

const wifiRadioState = createPoll(
  "enabled",
  4000,
  ["bash", "-c", "nmcli radio wifi 2>/dev/null || echo 'enabled'"],
  (out: string) => out.trim()
)

const nearbyNetworks = createPoll(
  "No networks found",
  8000,
  ["bash", "-c", "nmcli -t -f SSID,SIGNAL,SECURITY dev wifi list 2>/dev/null | grep -v -E '^:' | head -5"],
  (out: string) => {
    const lines = out.trim().split("\n").filter(Boolean)
    if (lines.length === 0) return "No networks in range"
    return lines.map((l) => {
      const parts = l.split(":")
      const name = parts[0] || "Hidden"
      const sig = parts[1] || "0"
      const sec = parts[2] ? "󰌾" : ""
      return `${name} (${sig}%) ${sec}`.trim()
    }).join("\n")
  }
)

export default function Network() {
  return (
    <menubutton
      class="status-icon network"
      tooltipText={networkTooltip}
    >
      <label
        class="status-icon-label"
        label={networkIcon}
      />

      <popover class="control-popover network-popover">
        <box orientation={Gtk.Orientation.VERTICAL} spacing={10} class="popover-container">
          <box class="popover-header" spacing={8}>
            <label class="popover-title" label="Wi-Fi" hexpand halign={Gtk.Align.START} />
            <button
              class="popover-toggle-btn"
              onClicked={() => {
                execAsync(["bash", "-c", "if [ $(nmcli radio wifi) = 'enabled' ]; then nmcli radio wifi off; else nmcli radio wifi on; fi"]).catch(console.error)
              }}
            >
              <label label={wifiRadioState((s) => s === "enabled" ? "On" : "Off")} />
            </button>
          </box>

          <box class="popover-card" spacing={8}>
            <label class="card-icon" label="󰤨" />
            <box orientation={Gtk.Orientation.VERTICAL} hexpand>
              <label class="card-title" label="Connected Network" halign={Gtk.Align.START} />
              <label class="card-subtitle" label={wifiStatusText} halign={Gtk.Align.START} />
            </box>
          </box>

          <Gtk.Separator />

          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <label class="section-subtitle" label="Nearby Networks" halign={Gtk.Align.START} />
            <box class="popover-card-list" orientation={Gtk.Orientation.VERTICAL} spacing={4}>
              <label
                class="network-list-text"
                label={nearbyNetworks}
                halign={Gtk.Align.START}
              />
            </box>
          </box>

          <Gtk.Separator />

          <button
            class="action-button"
            onClicked={() => execAsync(["bash", "-c", "nm-connection-editor 2>/dev/null || cachyos-settings 2>/dev/null || true"]).catch(console.error)}
          >
            <box spacing={8} halign={Gtk.Align.CENTER}>
              <label class="action-icon" label="󰒓" />
              <label label="Network Settings..." />
            </box>
          </button>
        </box>
      </popover>
    </menubutton>
  )
}

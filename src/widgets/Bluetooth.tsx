import Gtk from "gi://Gtk?version=4.0"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

// Poll bluetoothctl for status
const btIcon = createPoll(
  "󰂲",
  3000,
  ["bash", "-c", "bluetoothctl show 2>/dev/null | grep -E 'Powered|Name'; bluetoothctl devices Connected 2>/dev/null | head -1"],
  (out: string) => {
    const powered = out.includes("Powered: yes")
    const connLine = out.split("\n").find((l) => l.startsWith("Device"))
    const connected = !!connLine

    if (!powered) return "󰂲"    // off
    if (connected) return "󰂱"   // connected
    return "󰂯"                   // on, not connected
  }
)

const btTooltip = createPoll(
  "Bluetooth: Off",
  3000,
  ["bash", "-c", "bluetoothctl show 2>/dev/null | grep -E 'Powered|Name'; bluetoothctl devices Connected 2>/dev/null | head -1"],
  (out: string) => {
    const powered = out.includes("Powered: yes")
    const connLine = out.split("\n").find((l) => l.startsWith("Device"))
    const connected = !!connLine
    const device = connLine ? connLine.replace(/Device\s+\S+\s+/, "").trim() : ""

    if (!powered) return "Bluetooth: Off"
    if (connected) return `Bluetooth: ${device}`
    return "Bluetooth: On"
  }
)

const btPowerState = createPoll(
  "off",
  3000,
  ["bash", "-c", "bluetoothctl show 2>/dev/null | grep -q 'Powered: yes' && echo 'on' || echo 'off'"],
  (out: string) => out.trim()
)

const btDevicesList = createPoll(
  "No paired devices",
  5000,
  ["bash", "-c", "bluetoothctl devices 2>/dev/null | head -5"],
  (out: string) => {
    const lines = out.trim().split("\n").filter(Boolean)
    if (lines.length === 0) return "No paired devices found"
    return lines.map((l) => {
      const name = l.replace(/^Device\s+\S+\s+/, "").trim()
      return `󰂯  ${name}`
    }).join("\n")
  }
)

export default function Bluetooth() {
  return (
    <menubutton
      class="status-icon bluetooth"
      tooltipText={btTooltip}
    >
      <label
        class="status-icon-label"
        label={btIcon}
      />

      <popover class="control-popover bluetooth-popover">
        <box orientation={Gtk.Orientation.VERTICAL} spacing={10} class="popover-container">
          <box class="popover-header" spacing={8}>
            <label class="popover-title" label="Bluetooth" hexpand halign={Gtk.Align.START} />
            <button
              class="popover-toggle-btn"
              onClicked={() => {
                execAsync(["bash", "-c", "if bluetoothctl show 2>/dev/null | grep -q 'Powered: yes'; then bluetoothctl power off; else bluetoothctl power on; fi"]).catch(console.error)
              }}
            >
              <label label={btPowerState((s) => s === "on" ? "On" : "Off")} />
            </button>
          </box>

          <box class="popover-card" spacing={8}>
            <label class="card-icon" label="󰂱" />
            <box orientation={Gtk.Orientation.VERTICAL} hexpand>
              <label class="card-title" label="Status" halign={Gtk.Align.START} />
              <label class="card-subtitle" label={btTooltip} halign={Gtk.Align.START} />
            </box>
          </box>

          <Gtk.Separator />

          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <label class="section-subtitle" label="Devices" halign={Gtk.Align.START} />
            <box class="popover-card-list" orientation={Gtk.Orientation.VERTICAL} spacing={4}>
              <label
                class="device-list-text"
                label={btDevicesList}
                halign={Gtk.Align.START}
              />
            </box>
          </box>

          <Gtk.Separator />

          <button
            class="action-button"
            onClicked={() => execAsync(["bash", "-c", "blueman-manager 2>/dev/null || cachyos-settings 2>/dev/null || true"]).catch(console.error)}
          >
            <box spacing={8} halign={Gtk.Align.CENTER}>
              <label class="action-icon" label="󰒓" />
              <label label="Bluetooth Settings..." />
            </box>
          </button>
        </box>
      </popover>
    </menubutton>
  )
}

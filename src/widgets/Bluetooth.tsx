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

interface BtDevice {
  mac: string
  name: string
  connected: boolean
}

const btDevicesJson = createPoll(
  "[]",
  4000,
  ["bash", "-c", `python3 -c '
import subprocess, json
try:
    paired = subprocess.check_output(["bluetoothctl", "devices"], text=True, timeout=2).strip().splitlines()
    connected_raw = subprocess.check_output(["bluetoothctl", "devices", "Connected"], text=True, timeout=2).strip().splitlines()
    connected_macs = set()
    for line in connected_raw:
        parts = line.split()
        if len(parts) >= 2 and parts[0] == "Device":
            connected_macs.add(parts[1])
    devices = []
    for line in paired:
        parts = line.split()
        if len(parts) >= 3 and parts[0] == "Device":
            mac = parts[1]
            name = " ".join(parts[2:])
            is_conn = mac in connected_macs
            devices.append({"mac": mac, "name": name, "connected": is_conn})
    print(json.dumps(devices))
except:
    print("[]")
' 2>/dev/null || echo '[]'`],
)

function getBtDeviceIcon(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes("headphone") || lower.includes("airpod") || lower.includes("buds") || lower.includes("wh-") || lower.includes("wf-") || lower.includes("audio") || lower.includes("sound") || lower.includes("ear")) {
    return "󰋋"
  }
  if (lower.includes("mouse")) return "󰍽"
  if (lower.includes("keyboard") || lower.includes("keychron")) return "󰌌"
  if (lower.includes("phone") || lower.includes("pixel") || lower.includes("iphone") || lower.includes("galaxy")) return "󰏲"
  return "󰂯"
}

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
        <box orientation={Gtk.Orientation.VERTICAL} spacing={10} class="popover-container bluetooth-container">
          {/* Header */}
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

          {/* Status Card */}
          <box class="popover-card" spacing={8}>
            <label class="card-icon" label="󰂱" />
            <box orientation={Gtk.Orientation.VERTICAL} hexpand>
              <label class="card-title" label="Bluetooth Status" halign={Gtk.Align.START} />
              <label class="card-subtitle" label={btTooltip} halign={Gtk.Align.START} />
            </box>
          </box>

          <Gtk.Separator />

          {/* Devices List */}
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <label class="section-subtitle" label="Paired Devices" halign={Gtk.Align.START} />
            <box
              class="popover-card-list"
              orientation={Gtk.Orientation.VERTICAL}
              spacing={2}
              $={(self: Gtk.Box) => {
                btDevicesJson.subscribe(() => {
                  try {
                    const list = JSON.parse(btDevicesJson.peek()) as BtDevice[]

                    // Clear old items
                    let child = self.get_first_child()
                    while (child) {
                      const next = child.get_next_sibling()
                      self.remove(child)
                      child = next
                    }

                    if (list.length === 0) {
                      const emptyLbl = new Gtk.Label({
                        label: "No paired devices found",
                        css_classes: ["popover-empty-text"],
                        halign: Gtk.Align.START,
                      })
                      self.append(emptyLbl)
                      return
                    }

                    for (const dev of list) {
                      const btn = new Gtk.Button({
                        css_classes: ["popover-item-row", dev.connected ? "active" : ""],
                      })

                      const rowBox = new Gtk.Box({
                        spacing: 8,
                      })

                      const iconLbl = new Gtk.Label({
                        label: getBtDeviceIcon(dev.name),
                        css_classes: ["item-icon"],
                      })
                      rowBox.append(iconLbl)

                      const nameLbl = new Gtk.Label({
                        label: dev.name,
                        hexpand: true,
                        halign: Gtk.Align.START,
                        css_classes: ["item-title"],
                      })
                      rowBox.append(nameLbl)

                      const statusBadge = new Gtk.Label({
                        label: dev.connected ? "Connected" : "Connect",
                        css_classes: [dev.connected ? "item-badge" : "item-action-hint"],
                      })
                      rowBox.append(statusBadge)

                      btn.set_child(rowBox)

                      btn.connect("clicked", () => {
                        if (dev.connected) {
                          execAsync(["bluetoothctl", "disconnect", dev.mac]).catch(console.error)
                        } else {
                          execAsync(["bluetoothctl", "connect", dev.mac]).catch(console.error)
                        }
                      })

                      self.append(btn)
                    }
                  } catch (e) {
                    console.error("Error rendering bluetooth devices:", e)
                  }
                })
              }}
            />
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

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

interface WifiNetwork {
  inUse: boolean
  ssid: string
  signal: number
  security: string
}

const wifiStatusText = createPoll(
  "Disconnected",
  3000,
  ["bash", "-c", "nmcli -t -f ACTIVE,SSID dev wifi 2>/dev/null | grep -E '^yes:' | cut -d: -f2 || echo 'Not Connected'"],
  (out: string) => out.trim() || "Not Connected"
)

const wifiRadioState = createPoll(
  "enabled",
  3000,
  ["bash", "-c", "nmcli radio wifi 2>/dev/null || echo 'enabled'"],
  (out: string) => out.trim()
)

const wifiNetworksJson = createPoll(
  "[]",
  6000,
  ["bash", "-c", `python3 -c '
import subprocess, json
try:
    out = subprocess.check_output(["nmcli", "-t", "-f", "IN-USE,SSID,SIGNAL,SECURITY", "dev", "wifi", "list"], text=True, timeout=4)
    networks = []
    seen = set()
    for line in out.strip().splitlines():
        if not line.strip(): continue
        parts = line.split(":")
        in_use = parts[0].strip() == "*"
        ssid = parts[1].strip() if len(parts) > 1 else ""
        if not ssid or ssid == "--" or ssid in seen:
            continue
        seen.add(ssid)
        signal = int(parts[2].strip()) if len(parts) > 2 and parts[2].strip().isdigit() else 0
        security = parts[3].strip() if len(parts) > 3 else ""
        networks.append({"inUse": in_use, "ssid": ssid, "signal": signal, "security": security})
    print(json.dumps(networks[:6]))
except:
    print("[]")
' 2>/dev/null || echo '[]'`],
)

function getSignalIcon(signal: number): string {
  if (signal >= 75) return "󰤨"
  if (signal >= 50) return "󰤥"
  if (signal >= 25) return "󰤢"
  return "󰤟"
}

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
        <box orientation={Gtk.Orientation.VERTICAL} spacing={10} class="popover-container network-container">
          {/* Header */}
          <box class="popover-header" spacing={8}>
            <label class="popover-title" label="Wi-Fi" hexpand halign={Gtk.Align.START} />
            <button
              class="popover-action-icon-btn"
              tooltipText="Rescan Networks"
              onClicked={() => execAsync(["bash", "-c", "nmcli dev wifi rescan 2>/dev/null || true"]).catch(console.error)}
            >
              <label label="󰑐" />
            </button>
            <button
              class="popover-toggle-btn"
              onClicked={() => {
                execAsync(["bash", "-c", "if [ $(nmcli radio wifi) = 'enabled' ]; then nmcli radio wifi off; else nmcli radio wifi on; fi"]).catch(console.error)
              }}
            >
              <label label={wifiRadioState((s) => s === "enabled" ? "On" : "Off")} />
            </button>
          </box>

          {/* Connected Network Card */}
          <box class="popover-card" spacing={8}>
            <label class="card-icon" label="󰤨" />
            <box orientation={Gtk.Orientation.VERTICAL} hexpand>
              <label class="card-title" label="Connected Network" halign={Gtk.Align.START} />
              <label class="card-subtitle" label={wifiStatusText} halign={Gtk.Align.START} />
            </box>
            <button
              class="card-action-btn"
              visible={wifiStatusText((s) => s !== "Not Connected" && s !== "Disconnected")}
              onClicked={() => {
                execAsync(["bash", "-c", "ssid=$(nmcli -t -f ACTIVE,SSID dev wifi 2>/dev/null | grep -E '^yes:' | cut -d: -f2); if [ -n \"$ssid\" ]; then nmcli connection down \"$ssid\" 2>/dev/null || nmcli dev disconnect wlan0 2>/dev/null || true; fi"]).catch(console.error)
              }}
            >
              <label label="Disconnect" />
            </button>
          </box>

          <Gtk.Separator />

          {/* Nearby Networks List */}
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <box spacing={8}>
              <label class="section-subtitle" label="Nearby Networks" hexpand halign={Gtk.Align.START} />
            </box>

            <box
              class="popover-card-list"
              orientation={Gtk.Orientation.VERTICAL}
              spacing={2}
              $={(self: Gtk.Box) => {
                wifiNetworksJson.subscribe(() => {
                  try {
                    const list = JSON.parse(wifiNetworksJson.peek()) as WifiNetwork[]

                    // Clear old entries
                    let child = self.get_first_child()
                    while (child) {
                      const next = child.get_next_sibling()
                      self.remove(child)
                      child = next
                    }

                    if (list.length === 0) {
                      const emptyLbl = new Gtk.Label({
                        label: "No networks in range",
                        css_classes: ["popover-empty-text"],
                        halign: Gtk.Align.START,
                      })
                      self.append(emptyLbl)
                      return
                    }

                    for (const net of list) {
                      const btn = new Gtk.Button({
                        css_classes: ["popover-item-row", net.inUse ? "active" : ""],
                      })

                      const rowBox = new Gtk.Box({
                        spacing: 8,
                      })

                      const iconLbl = new Gtk.Label({
                        label: getSignalIcon(net.signal),
                        css_classes: ["item-icon"],
                      })
                      rowBox.append(iconLbl)

                      const nameLbl = new Gtk.Label({
                        label: net.ssid,
                        hexpand: true,
                        halign: Gtk.Align.START,
                        css_classes: ["item-title"],
                      })
                      rowBox.append(nameLbl)

                      if (net.security) {
                        const lockLbl = new Gtk.Label({
                          label: "󰌾",
                          css_classes: ["item-lock-icon"],
                        })
                        rowBox.append(lockLbl)
                      }

                      if (net.inUse) {
                        const badgeLbl = new Gtk.Label({
                          label: "Connected",
                          css_classes: ["item-badge"],
                        })
                        rowBox.append(badgeLbl)
                      }

                      btn.set_child(rowBox)

                      btn.connect("clicked", () => {
                        if (net.inUse) return
                        execAsync([
                          "bash",
                          "-c",
                          `if nmcli -t -f NAME connection show | grep -Fxq "${net.ssid}"; then
                            nmcli connection up "${net.ssid}" 2>/dev/null || true
                          else
                            pass=$(fuzzel -d -p "Password for ${net.ssid}: " --password 2>/dev/null)
                            if [ -n "$pass" ]; then
                              nmcli dev wifi connect "${net.ssid}" password "$pass" 2>/dev/null || true
                            else
                              nmcli dev wifi connect "${net.ssid}" 2>/dev/null || true
                            fi
                          fi`
                        ]).catch(console.error)
                      })

                      self.append(btn)
                    }
                  } catch (e) {
                    console.error("Error rendering wifi networks:", e)
                  }
                })
              }}
            />
          </box>

          <Gtk.Separator />

          {/* Network Settings Button */}
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

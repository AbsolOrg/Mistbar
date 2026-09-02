import Gtk from "gi://Gtk?version=4.0"
import Astal from "gi://Astal?version=4.0"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

// ── Polled States ──
const wifiConnected = createPoll(
  false,
  3000,
  ["bash", "-c", "nmcli -t -f GENERAL.STATE device show 2>/dev/null | grep -q 'connected' && echo 'true' || echo 'false'"],
  (out: string) => out.trim() === "true"
)

const wifiSsid = createPoll(
  "Not Connected",
  3000,
  ["bash", "-c", "nmcli -t -f ACTIVE,SSID dev wifi 2>/dev/null | grep -E '^yes:' | cut -d: -f2 || echo 'Not Connected'"],
  (out: string) => out.trim() || "Not Connected"
)

const btConnected = createPoll(
  false,
  3000,
  ["bash", "-c", "bluetoothctl devices Connected 2>/dev/null | head -1"],
  (out: string) => out.trim().length > 0
)

const btName = createPoll(
  "Off",
  3000,
  ["bash", "-c", "if bluetoothctl show 2>/dev/null | grep -q 'Powered: yes'; then dev=$(bluetoothctl devices Connected 2>/dev/null | head -1 | sed 's/Device [^ ]* //'); echo \"${dev:-On}\"; else echo 'Off'; fi"],
  (out: string) => out.trim() || "Off"
)

const volumePercent = createPoll(
  50,
  1000,
  ["bash", "-c", "wpctl get-volume @DEFAULT_AUDIO_SINK@ 2>/dev/null || echo 'Volume: 0.50'"],
  (out: string) => {
    const match = out.match(/Volume:\s+([\d.]+)/)
    return match ? Math.round(parseFloat(match[1]) * 100) : 50
  }
)

const brightnessPercent = createPoll(
  100,
  2000,
  ["bash", "-c", "brightnessctl -m 2>/dev/null || echo ',,,100%'"],
  (out: string) => {
    const parts = out.split(",")
    const pct = parseInt(parts[3]?.replace("%", "") || "100")
    return isNaN(pct) ? 100 : pct
  }
)

const mediaTitle = createPoll(
  "",
  2000,
  ["bash", "-c", "playerctl metadata --format '{{title}} - {{artist}}' 2>/dev/null || echo ''"],
  (out: string) => out.trim()
)

const mediaStatus = createPoll(
  "Stopped",
  2000,
  ["bash", "-c", "playerctl status 2>/dev/null || echo 'Stopped'"],
  (out: string) => out.trim()
)

export default function ControlCenter() {
  return (
    <menubutton
      class="status-icon control-center-btn"
      tooltipText="Control Center"
    >
      <label class="status-icon-label" label="󰕮" />

      <popover class="control-popover control-center-popover">
        <box orientation={Gtk.Orientation.VERTICAL} spacing={8} class="control-center-container">
          {/* Header */}
          <box class="cc-header" spacing={8}>
            <label class="cc-header-title" label="Control Center" hexpand halign={Gtk.Align.START} />
          </box>

          {/* Quick Toggles Grid (Wi-Fi & Bluetooth) */}
          <box spacing={8} homogeneous>
            {/* Wi-Fi Tile */}
            <button
              class={wifiConnected((c) => `cc-tile ${c ? "active" : ""}`)}
              onClicked={() => {
                execAsync(["bash", "-c", "if [ $(nmcli radio wifi) = 'enabled' ]; then nmcli radio wifi off; else nmcli radio wifi on; fi"]).catch(console.error)
              }}
            >
              <box spacing={8} class="cc-tile-content">
                <label class="cc-tile-icon" label="󰤨" />
                <box orientation={Gtk.Orientation.VERTICAL} halign={Gtk.Align.START} hexpand>
                  <label class="cc-tile-title" label="Wi-Fi" halign={Gtk.Align.START} />
                  <label class="cc-tile-subtitle" label={wifiSsid} halign={Gtk.Align.START} />
                </box>
              </box>
            </button>

            {/* Bluetooth Tile */}
            <button
              class={btConnected((c) => `cc-tile ${c ? "active" : ""}`)}
              onClicked={() => {
                execAsync(["bash", "-c", "if bluetoothctl show 2>/dev/null | grep -q 'Powered: yes'; then bluetoothctl power off; else bluetoothctl power on; fi"]).catch(console.error)
              }}
            >
              <box spacing={8} class="cc-tile-content">
                <label class="cc-tile-icon" label="󰂯" />
                <box orientation={Gtk.Orientation.VERTICAL} halign={Gtk.Align.START} hexpand>
                  <label class="cc-tile-title" label="Bluetooth" halign={Gtk.Align.START} />
                  <label class="cc-tile-subtitle" label={btName} halign={Gtk.Align.START} />
                </box>
              </box>
            </button>
          </box>

          {/* Display Slider Card */}
          <box orientation={Gtk.Orientation.VERTICAL} spacing={4} class="cc-slider-card">
            <box spacing={8} class="cc-card-header">
              <label class="cc-slider-title" label="Display" hexpand halign={Gtk.Align.START} />
              <label class="cc-slider-value" label={brightnessPercent((b) => `${b}%`)} />
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
                  execAsync(["bash", "-c", "brightnessctl -m 2>/dev/null"]).then((out) => {
                    const parts = out.split(",")
                    const pct = parseInt(parts[3]?.replace("%", "") || "100")
                    if (!isNaN(pct)) self.set_value(pct)
                  }).catch(console.error)

                  self.connect("notify::value", () => {
                    const val = Math.round(self.get_value())
                    execAsync(["brightnessctl", "set", `${val}%`]).catch(console.error)
                  })
                }}
              />
              <label class="slider-icon" label="󰃠" />
            </box>
          </box>

          {/* Sound Slider Card */}
          <box orientation={Gtk.Orientation.VERTICAL} spacing={4} class="cc-slider-card">
            <box spacing={8} class="cc-card-header">
              <label class="cc-slider-title" label="Sound" hexpand halign={Gtk.Align.START} />
              <label class="cc-slider-value" label={volumePercent((v) => `${v}%`)} />
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
                  execAsync(["bash", "-c", "wpctl get-volume @DEFAULT_AUDIO_SINK@ 2>/dev/null"]).then((out) => {
                    const match = out.match(/Volume:\s+([\d.]+)/)
                    if (match) self.set_value(Math.round(parseFloat(match[1]) * 100))
                  }).catch(console.error)

                  self.connect("notify::value", () => {
                    const val = (self.get_value() / 100).toFixed(2)
                    execAsync(["wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", val]).catch(console.error)
                  })
                }}
              />
              <label class="slider-icon" label="󰕾" />
            </box>
          </box>

          {/* Now Playing Card (Optional) */}
          <box
            orientation={Gtk.Orientation.VERTICAL}
            spacing={6}
            class="cc-media-card"
            visible={mediaTitle((t) => t.length > 0)}
          >
            <box spacing={8}>
              <label class="cc-media-icon" label="󰎆" />
              <label class="cc-media-title" label={mediaTitle} hexpand halign={Gtk.Align.START} />
            </box>
            <box spacing={8} halign={Gtk.Align.CENTER}>
              <button
                class="cc-media-btn"
                onClicked={() => execAsync(["playerctl", "previous"]).catch(console.error)}
              >
                <label label="󰒮" />
              </button>
              <button
                class="cc-media-btn play-btn"
                onClicked={() => execAsync(["playerctl", "play-pause"]).catch(console.error)}
              >
                <label label={mediaStatus((s) => s === "Playing" ? "󰏤" : "󰐊")} />
              </button>
              <button
                class="cc-media-btn"
                onClicked={() => execAsync(["playerctl", "next"]).catch(console.error)}
              >
                <label label="󰒭" />
              </button>
            </box>
          </box>
        </box>
      </popover>
    </menubutton>
  )
}

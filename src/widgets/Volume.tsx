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

interface AudioSink {
  id: string
  name: string
  isDefault: boolean
}

const audioSinksJson = createPoll(
  "[]",
  3000,
  ["bash", "-c", `python3 -c '
import subprocess, re, json
try:
    out = subprocess.check_output(["wpctl", "status"], text=True, timeout=2)
    sinks = []
    in_sinks = False
    for line in out.splitlines():
        if "Sinks:" in line:
            in_sinks = True
            continue
        if in_sinks:
            if line.strip() == "" or "Sources:" in line or "Filters:" in line or "Streams:" in line:
                break
            m = re.search(r"(\*?)\s*(\d+)\.\s+([^\[]+)", line)
            if m:
                is_default = m.group(1) == "*"
                sink_id = m.group(2)
                name = m.group(3).strip()
                sinks.append({"id": sink_id, "name": name, "isDefault": is_default})
    print(json.dumps(sinks))
except:
    print("[]")
' 2>/dev/null || echo '[]'`],
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
        <box orientation={Gtk.Orientation.VERTICAL} spacing={10} class="popover-container volume-container">
          <box class="popover-header" spacing={8}>
            <label class="popover-title" label="Sound" hexpand halign={Gtk.Align.START} />
            <label class="popover-subtitle" label={volumePercent} />
            <button
              class="popover-toggle-btn"
              onClicked={() => execAsync(["wpctl", "set-mute", "@DEFAULT_AUDIO_SINK@", "toggle"]).catch(console.error)}
              tooltipText="Toggle Mute"
            >
              <label label={volumePercent((p) => p.includes("Muted") ? "Unmute" : "Mute")} />
            </button>
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

          {/* Output Devices List */}
          <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <label class="section-subtitle" label="Output Devices" halign={Gtk.Align.START} />
            <box
              class="popover-card-list"
              orientation={Gtk.Orientation.VERTICAL}
              spacing={2}
              $={(self: Gtk.Box) => {
                audioSinksJson.subscribe(() => {
                  try {
                    const list = JSON.parse(audioSinksJson.peek()) as AudioSink[]

                    let child = self.get_first_child()
                    while (child) {
                      const next = child.get_next_sibling()
                      self.remove(child)
                      child = next
                    }

                    if (list.length === 0) {
                      const emptyLbl = new Gtk.Label({
                        label: sinkName.peek() || "Default Audio Output",
                        css_classes: ["popover-empty-text"],
                        halign: Gtk.Align.START,
                      })
                      self.append(emptyLbl)
                      return
                    }

                    for (const sink of list) {
                      const btn = new Gtk.Button({
                        css_classes: ["popover-item-row", sink.isDefault ? "active" : ""],
                      })

                      const rowBox = new Gtk.Box({
                        spacing: 8,
                      })

                      const iconLbl = new Gtk.Label({
                        label: sink.name.toLowerCase().includes("headphone") ? "󰋋" : (sink.name.toLowerCase().includes("hdmi") ? "󰡁" : "󰓃"),
                        css_classes: ["item-icon"],
                      })
                      rowBox.append(iconLbl)

                      const nameLbl = new Gtk.Label({
                        label: sink.name,
                        hexpand: true,
                        halign: Gtk.Align.START,
                        css_classes: ["item-title"],
                      })
                      rowBox.append(nameLbl)

                      if (sink.isDefault) {
                        const checkLbl = new Gtk.Label({
                          label: "✓",
                          css_classes: ["item-badge"],
                        })
                        rowBox.append(checkLbl)
                      }

                      btn.set_child(rowBox)

                      btn.connect("clicked", () => {
                        execAsync(["wpctl", "set-default", sink.id]).catch(console.error)
                      })

                      self.append(btn)
                    }
                  } catch (e) {
                    console.error("Error rendering audio sinks:", e)
                  }
                })
              }}
            />
          </box>
        </box>
      </popover>
    </menubutton>
  )
}

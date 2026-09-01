import Gtk from "gi://Gtk?version=4.0"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

interface TrayItem {
  service: string
  path: string
  title: string
  icon: string
}

const trayItemsJson = createPoll(
  "[]",
  3000,
  ["bash", "-c", `python3 -c '
import subprocess, json

def get_tray():
    items = []
    try:
        out = subprocess.check_output([
            "gdbus", "call", "--session",
            "--dest", "org.kde.StatusNotifierWatcher",
            "--object-path", "/StatusNotifierWatcher",
            "--method", "org.freedesktop.DBus.Properties.Get",
            "org.kde.StatusNotifierWatcher", "RegisteredStatusNotifierItems"
        ], text=True, timeout=2)
        raw = out.strip()
        if "[" in raw:
            content = raw[raw.index("[")+1:raw.index("]")]
            entries = [x.strip().strip("\\x27\\"") for x in content.split(",") if x.strip()]
            for e in entries:
                if "/" in e:
                    service = e[:e.index("/")]
                    path = e[e.index("/"):]
                else:
                    service = e
                    path = "/StatusNotifierItem"
                
                try:
                    icon_out = subprocess.check_output([
                        "gdbus", "call", "--session",
                        "--dest", service,
                        "--object-path", path,
                        "--method", "org.freedesktop.DBus.Properties.Get",
                        "org.kde.StatusNotifierItem", "IconName"
                    ], text=True, timeout=1).strip()
                    icon = icon_out.replace("(<", "").replace(">,)", "").strip("\x27\\" ")
                except:
                    icon = ""

                try:
                    title_out = subprocess.check_output([
                        "gdbus", "call", "--session",
                        "--dest", service,
                        "--object-path", path,
                        "--method", "org.freedesktop.DBus.Properties.Get",
                        "org.kde.StatusNotifierItem", "Title"
                    ], text=True, timeout=1).strip()
                    title = title_out.replace("(<", "").replace(">,)", "").strip("\x27\\" ")
                except:
                    title = service
                
                items.append({"service": service, "path": path, "title": title, "icon": icon})
    except:
        pass
    print(json.dumps(items))

get_tray()
' 2>/dev/null || echo '[]'`],
)

export default function SystemTray() {
  return (
    <box
      class="system-tray"
      spacing={4}
    >
      {/* We subscribe to trayItemsJson and render icons when available */}
      <box
        spacing={4}
        $={(self: Gtk.Box) => {
          trayItemsJson.subscribe(() => {
            try {
              const list = JSON.parse(trayItemsJson.peek()) as TrayItem[]
              // Remove old children
              let child = self.get_first_child()
              while (child) {
                const next = child.get_next_sibling()
                self.remove(child)
                child = next
              }

              // Add new tray items
              for (const item of list) {
                const btn = new Gtk.Button({
                  css_classes: ["status-icon", "tray-item-btn"],
                  tooltip_text: item.title || item.service,
                })

                if (item.icon) {
                  const img = new Gtk.Image({
                    icon_name: item.icon,
                    pixel_size: 16,
                  })
                  btn.set_child(img)
                } else {
                  const lbl = new Gtk.Label({
                    label: (item.title || "T").charAt(0).toUpperCase(),
                  })
                  btn.set_child(lbl)
                }

                btn.connect("clicked", () => {
                  execAsync([
                    "gdbus", "call", "--session",
                    "--dest", item.service,
                    "--object-path", item.path,
                    "--method", "org.kde.StatusNotifierItem.Activate", "0", "0"
                  ]).catch(console.error)
                })

                self.append(btn)
              }
            } catch (e) {
              console.error(e)
            }
          })
        }}
      />
    </box>
  )
}

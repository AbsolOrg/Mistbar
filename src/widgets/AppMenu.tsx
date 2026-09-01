import Gtk from "gi://Gtk?version=4.0"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

// Poll niri to check if an application window is currently active
const hasActiveWindow = createPoll(
  false,
  500,
  ["bash", "-c", "niri msg --json focused-window 2>/dev/null || echo '{}'"],
  (out: string) => {
    try {
      const data = JSON.parse(out)
      return !!(data && data.app_id)
    } catch {
      return false
    }
  }
)

export default function AppMenu() {
  return (
    <box
      class="app-menu-bar"
      spacing={2}
      visible={hasActiveWindow}
    >
      {/* File Menu */}
      <menubutton class="menu-item-btn">
        <label label="File" />
        <popover class="control-popover appmenu-popover">
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2} class="appmenu-content">
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "wtype -M ctrl -k n -m ctrl 2>/dev/null || ydotool key 29:1 49:1 49:0 29:0 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="New Window" hexpand halign={Gtk.Align.START} />
                <label class="menu-shortcut" label="Ctrl+N" />
              </box>
            </button>
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "niri msg action close-window 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Close Window" hexpand halign={Gtk.Align.START} />
                <label class="menu-shortcut" label="Ctrl+W" />
              </box>
            </button>
            <Gtk.Separator />
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "niri msg action close-window 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Quit" hexpand halign={Gtk.Align.START} />
                <label class="menu-shortcut" label="Ctrl+Q" />
              </box>
            </button>
          </box>
        </popover>
      </menubutton>

      {/* Edit Menu */}
      <menubutton class="menu-item-btn">
        <label label="Edit" />
        <popover class="control-popover appmenu-popover">
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2} class="appmenu-content">
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "wtype -M ctrl -k z -m ctrl 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Undo" hexpand halign={Gtk.Align.START} />
                <label class="menu-shortcut" label="Ctrl+Z" />
              </box>
            </button>
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "wtype -M ctrl -M shift -k z -m shift -m ctrl 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Redo" hexpand halign={Gtk.Align.START} />
                <label class="menu-shortcut" label="Ctrl+Shift+Z" />
              </box>
            </button>
            <Gtk.Separator />
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "wtype -M ctrl -k x -m ctrl 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Cut" hexpand halign={Gtk.Align.START} />
                <label class="menu-shortcut" label="Ctrl+X" />
              </box>
            </button>
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "wtype -M ctrl -k c -m ctrl 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Copy" hexpand halign={Gtk.Align.START} />
                <label class="menu-shortcut" label="Ctrl+C" />
              </box>
            </button>
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "wtype -M ctrl -k v -m ctrl 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Paste" hexpand halign={Gtk.Align.START} />
                <label class="menu-shortcut" label="Ctrl+V" />
              </box>
            </button>
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "wtype -M ctrl -k a -m ctrl 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Select All" hexpand halign={Gtk.Align.START} />
                <label class="menu-shortcut" label="Ctrl+A" />
              </box>
            </button>
          </box>
        </popover>
      </menubutton>

      {/* View Menu */}
      <menubutton class="menu-item-btn">
        <label label="View" />
        <popover class="control-popover appmenu-popover">
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2} class="appmenu-content">
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "niri msg action fullscreen-window 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Toggle Fullscreen" hexpand halign={Gtk.Align.START} />
                <label class="menu-shortcut" label="F11" />
              </box>
            </button>
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "niri msg action center-column 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Center Column" hexpand halign={Gtk.Align.START} />
              </box>
            </button>
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "niri msg action expand-column-to-available-width 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Expand Column" hexpand halign={Gtk.Align.START} />
              </box>
            </button>
          </box>
        </popover>
      </menubutton>

      {/* Window Menu */}
      <menubutton class="menu-item-btn">
        <label label="Window" />
        <popover class="control-popover appmenu-popover">
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2} class="appmenu-content">
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "niri msg action focus-workspace-down 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Next Workspace" hexpand halign={Gtk.Align.START} />
              </box>
            </button>
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "niri msg action focus-workspace-up 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Previous Workspace" hexpand halign={Gtk.Align.START} />
              </box>
            </button>
            <Gtk.Separator />
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "niri msg action move-column-to-workspace-down 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Move to Next Workspace" hexpand halign={Gtk.Align.START} />
              </box>
            </button>
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "niri msg action move-column-to-workspace-up 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Move to Prev Workspace" hexpand halign={Gtk.Align.START} />
              </box>
            </button>
          </box>
        </popover>
      </menubutton>

      {/* Help Menu */}
      <menubutton class="menu-item-btn">
        <label label="Help" />
        <popover class="control-popover appmenu-popover">
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2} class="appmenu-content">
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "fuzzel 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Search Commands..." hexpand halign={Gtk.Align.START} />
              </box>
            </button>
            <button
              class="menu-option-btn"
              onClicked={() => execAsync(["bash", "-c", "xdg-open 'https://github.com/AbsolOrg/Mistbar' 2>/dev/null || true"]).catch(console.error)}
            >
              <box spacing={16}>
                <label class="menu-option-label" label="Mistbar Documentation" hexpand halign={Gtk.Align.START} />
              </box>
            </button>
          </box>
        </popover>
      </menubutton>
    </box>
  )
}

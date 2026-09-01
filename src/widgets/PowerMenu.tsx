import Gtk from "gi://Gtk?version=4.0"
import { execAsync } from "ags/process"

export default function PowerMenu() {
  return (
    <menubutton class="status-icon power-menu" tooltipText="Power">
      <label class="status-icon-label power-icon" label="⏻" />
      <popover class="power-popover">
        <box orientation={Gtk.Orientation.VERTICAL} spacing={4} class="power-popover-content">
          <button
            class="power-option"
            onClicked={() => execAsync(["bash", "-c", "systemctl suspend"]).catch(console.error)}
          >
            <box spacing={8}>
              <label class="power-option-icon" label="󰤄" />
              <label label="Sleep" />
            </box>
          </button>
          <button
            class="power-option"
            onClicked={() => execAsync(["bash", "-c", "systemctl reboot"]).catch(console.error)}
          >
            <box spacing={8}>
              <label class="power-option-icon" label="󰜉" />
              <label label="Restart" />
            </box>
          </button>
          <button
            class="power-option"
            onClicked={() => execAsync(["bash", "-c", "systemctl poweroff"]).catch(console.error)}
          >
            <box spacing={8}>
              <label class="power-option-icon" label="󰐥" />
              <label label="Shut Down" />
            </box>
          </button>
          <Gtk.Separator />
          <button
            class="power-option"
            onClicked={() => execAsync(["bash", "-c", "niri msg action quit -s"]).catch(console.error)}
          >
            <box spacing={8}>
              <label class="power-option-icon" label="󰍃" />
              <label label="Log Out" />
            </box>
          </button>
        </box>
      </popover>
    </menubutton>
  )
}

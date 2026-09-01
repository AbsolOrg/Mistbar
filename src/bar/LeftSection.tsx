import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import ActiveWindow from "../widgets/ActiveWindow"

export default function LeftSection() {
  return (
    <box class="left-section" spacing={4}>
      <button
        class="logo-button"
        onClicked={() => execAsync("fuzzel").catch(console.error)}
        tooltipText="App Launcher"
      >
        <label class="logo-icon" label="󰀵" />
      </button>

      <box class="separator-dot">
        <label label="·" />
      </box>

      <ActiveWindow />
    </box>
  )
}

import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import ActiveWindow from "../widgets/ActiveWindow"
import AppMenu from "../widgets/AppMenu"

export default function LeftSection() {
  return (
    <box class="left-section" spacing={6}>
      <button
        class="logo-button"
        onClicked={() => execAsync(["bash", "-c", "fuzzel 2>/dev/null || rofi -show drun 2>/dev/null || true"]).catch(console.error)}
        tooltipText="Apple Menu"
      >
        <label class="logo-icon" label="󰀵" />
      </button>

      <ActiveWindow />

      <AppMenu />
    </box>
  )
}

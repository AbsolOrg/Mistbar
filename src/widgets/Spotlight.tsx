import Gtk from "gi://Gtk?version=4.0"
import { execAsync } from "ags/process"

export default function Spotlight() {
  return (
    <button
      class="status-icon spotlight-btn"
      tooltipText="Spotlight Search"
      onClicked={() => execAsync(["bash", "-c", "fuzzel 2>/dev/null || rofi -show drun 2>/dev/null || true"]).catch(console.error)}
    >
      <label class="status-icon-label" label="󰍉" />
    </button>
  )
}

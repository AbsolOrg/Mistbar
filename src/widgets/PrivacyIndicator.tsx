import Gtk from "gi://Gtk?version=4.0"
import { createPoll } from "ags/time"

// Poll PipeWire / PulseAudio source outputs to check if microphone is active
const isMicActive = createPoll(
  false,
  2000,
  ["bash", "-c", "pactl list source-outputs 2>/dev/null | grep -q 'state: RUNNING' && echo 'true' || echo 'false'"],
  (out: string) => out.trim() === "true"
)

export default function PrivacyIndicator() {
  return (
    <box
      class="privacy-pill"
      visible={isMicActive}
      spacing={4}
      tooltipText="Microphone in use"
    >
      <label class="privacy-icon" label="󰍬" />
    </box>
  )
}

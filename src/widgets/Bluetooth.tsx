import { createPoll } from "ags/time"

// Poll bluetoothctl for status
const btIcon = createPoll(
  "󰂲",
  3000,
  ["bash", "-c", "bluetoothctl show 2>/dev/null | grep -E 'Powered|Name'; bluetoothctl devices Connected 2>/dev/null | head -1"],
  (out: string) => {
    const powered = out.includes("Powered: yes")
    const connLine = out.split("\n").find((l) => l.startsWith("Device"))
    const connected = !!connLine

    if (!powered) return "󰂲"    // off
    if (connected) return "󰂱"   // connected
    return "󰂯"                   // on, not connected
  }
)

const btTooltip = createPoll(
  "Bluetooth: Off",
  3000,
  ["bash", "-c", "bluetoothctl show 2>/dev/null | grep -E 'Powered|Name'; bluetoothctl devices Connected 2>/dev/null | head -1"],
  (out: string) => {
    const powered = out.includes("Powered: yes")
    const connLine = out.split("\n").find((l) => l.startsWith("Device"))
    const connected = !connLine
    const device = connLine ? connLine.replace(/Device\s+\S+\s+/, "").trim() : ""

    if (!powered) return "Bluetooth: Off"
    if (connected) return `Bluetooth: ${device}`
    return "Bluetooth: On"
  }
)

export default function Bluetooth() {
  return (
    <button
      class="status-icon bluetooth"
      tooltipText={btTooltip}
    >
      <label
        class="status-icon-label"
        label={btIcon}
      />
    </button>
  )
}

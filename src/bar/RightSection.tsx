import SystemTray from "../widgets/SystemTray"
import Volume from "../widgets/Volume"
import Network from "../widgets/Network"
import Bluetooth from "../widgets/Bluetooth"
import Battery from "../widgets/Battery"
import Brightness from "../widgets/Brightness"
import PowerMenu from "../widgets/PowerMenu"

export default function RightSection() {
  return (
    <box class="right-section" spacing={2}>
      <SystemTray />
      <Brightness />
      <Volume />
      <Network />
      <Bluetooth />
      <Battery />
      <PowerMenu />
    </box>
  )
}

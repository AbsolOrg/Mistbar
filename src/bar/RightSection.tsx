import SystemTray from "../widgets/SystemTray"
import Volume from "../widgets/Volume"
import Network from "../widgets/Network"
import Bluetooth from "../widgets/Bluetooth"
import Battery from "../widgets/Battery"
import Brightness from "../widgets/Brightness"
import ControlCenter from "../widgets/ControlCenter"
import Clock from "../widgets/Clock"
import PowerMenu from "../widgets/PowerMenu"

export default function RightSection() {
  return (
    <box class="right-section" spacing={1}>
      <SystemTray />
      <Brightness />
      <Volume />
      <Network />
      <Bluetooth />
      <Battery />
      <ControlCenter />
      <Clock />
      <PowerMenu />
    </box>
  )
}

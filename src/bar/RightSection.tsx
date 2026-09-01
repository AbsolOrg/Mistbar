import PrivacyIndicator from "../widgets/PrivacyIndicator"
import SystemTray from "../widgets/SystemTray"
import Brightness from "../widgets/Brightness"
import Volume from "../widgets/Volume"
import Network from "../widgets/Network"
import Bluetooth from "../widgets/Bluetooth"
import Battery from "../widgets/Battery"
import Spotlight from "../widgets/Spotlight"
import ControlCenter from "../widgets/ControlCenter"
import Clock from "../widgets/Clock"
import PowerMenu from "../widgets/PowerMenu"

export default function RightSection() {
  return (
    <box class="right-section" spacing={3}>
      <PrivacyIndicator />
      <SystemTray />
      <Brightness />
      <Volume />
      <Network />
      <Bluetooth />
      <Battery />
      <Spotlight />
      <ControlCenter />
      <Clock />
      <PowerMenu />
    </box>
  )
}

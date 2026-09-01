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
    <box class="right-section" spacing={12}>
      <PrivacyIndicator />

      {/* System Status Indicators Group */}
      <box class="status-group" spacing={10}>
        <SystemTray />
        <Brightness />
        <Volume />
        <Network />
        <Bluetooth />
        <Battery />
      </box>

      {/* Spotlight Search */}
      <Spotlight />

      {/* Control Center */}
      <ControlCenter />

      {/* Date & Time (Notification Center) */}
      <Clock />

      {/* Power Menu */}
      <PowerMenu />
    </box>
  )
}

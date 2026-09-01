import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import LeftSection from "./LeftSection"
import CenterSection from "./CenterSection"
import RightSection from "./RightSection"

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  return (
    <window
      visible
      name="mistbar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox cssName="bar-inner">
        <box $type="start" class="bar-left">
          <LeftSection />
        </box>
        <box $type="center" class="bar-center">
          <CenterSection />
        </box>
        <box $type="end" class="bar-right">
          <RightSection />
        </box>
      </centerbox>
    </window>
  )
}

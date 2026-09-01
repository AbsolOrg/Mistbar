import Workspaces from "../widgets/Workspaces"
import Clock from "../widgets/Clock"

export default function CenterSection() {
  return (
    <box class="center-section" spacing={12}>
      <Workspaces />
      <Clock />
    </box>
  )
}

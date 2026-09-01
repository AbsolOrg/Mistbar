import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import LeftSection from "./LeftSection"
import CenterSection from "./CenterSection"
import RightSection from "./RightSection"
import { MistbarConfig, defaultConfig } from "../config"
import { createPoll } from "ags/time"

const hasActiveWindow = createPoll(
  false,
  600,
  ["bash", "-c", `python3 -c "
import subprocess, json
try:
  ws = json.loads(subprocess.check_output(['niri', 'msg', '-j', 'workspaces'], stderr=subprocess.DEVNULL))
  act = next((w['id'] for w in ws if w.get('is_active')), None)
  if act is not None:
    wins = json.loads(subprocess.check_output(['niri', 'msg', '-j', 'windows'], stderr=subprocess.DEVNULL))
    has_w = any(w.get('workspace_id') == act for w in wins)
    print('true' if has_w else 'false')
    exit(0)
except: pass
try:
  act = json.loads(subprocess.check_output(['hyprctl', 'activewindow', '-j'], stderr=subprocess.DEVNULL))
  print('true' if (act.get('title') or act.get('class')) else 'false')
  exit(0)
except: pass
print('false')
"`],
  (out: string) => out.trim() === "true"
)

let winRef: any = null
let isHovered = false
let hasWindow = false
let autoHide = false

export function getBarWindow() {
  return winRef
}

export function setBarAutohide(enabled: boolean) {
  autoHide = enabled
  if (winRef) {
    winRef.visible = true
    winRef.exclusivity = enabled ? Astal.Exclusivity.IGNORE : Astal.Exclusivity.EXCLUSIVE
  }
  updateVisibility()
}

export function getBarAutohide(): boolean {
  return autoHide
}

function updateVisibility() {
  if (!winRef) return
  if (!autoHide) {
    winRef.remove_css_class("bar-hidden")
    winRef.exclusivity = Astal.Exclusivity.EXCLUSIVE
  } else {
    // Intelligent Auto-Hide:
    // Visible when desktop is clean/empty or hovered
    // Hidden when windows occupy active workspace and mouse is away
    const shouldShow = !hasWindow || isHovered
    if (shouldShow) {
      winRef.remove_css_class("bar-hidden")
    } else {
      winRef.add_css_class("bar-hidden")
    }
    winRef.exclusivity = Astal.Exclusivity.IGNORE
  }
}

export default function Bar(gdkmonitor: Gdk.Monitor, config: MistbarConfig = defaultConfig) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
  autoHide = Boolean(config.autoHide)

  hasActiveWindow.subscribe((val) => {
    hasWindow = val
    updateVisibility()
  })

  const win = (
    <window
      visible
      name="mistbar"
      namespace="mistbar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={config.autoHide ? Astal.Exclusivity.IGNORE : Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox class="bar-inner">
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

  winRef = win

  const motion = new Gtk.EventControllerMotion()
  motion.connect("enter", () => {
    isHovered = true
    updateVisibility()
  })
  motion.connect("leave", () => {
    isHovered = false
    updateVisibility()
  })
  win.add_controller(motion)

  updateVisibility()

  return win
}

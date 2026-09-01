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

let setAutohideFn: ((enabled: boolean) => void) | null = null
let getAutohideFn: (() => boolean) | null = null

export function setBarAutohide(enabled: boolean) {
  if (setAutohideFn) {
    setAutohideFn(enabled)
  }
}

export function getBarAutohide(): boolean {
  return getAutohideFn ? getAutohideFn() : false
}

export default function Bar(gdkmonitor: Gdk.Monitor, config: MistbarConfig = defaultConfig) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  let winRef: any = null
  let revealerWidget: Gtk.Revealer | null = null
  let isHovered = false
  let hasWindow = false
  let autoHide = Boolean(config.autoHide)

  function updateVisibility() {
    if (!revealerWidget) return
    if (!autoHide) {
      revealerWidget.set_reveal_child(true)
    } else {
      // Intelligent Auto-Hide (Intellihide):
      // Visible when desktop is clean/empty, or when mouse is hovered at the top
      // Hidden when windows occupy the active workspace and mouse is away
      if (!hasWindow || isHovered) {
        revealerWidget.set_reveal_child(true)
      } else {
        revealerWidget.set_reveal_child(false)
      }
    }
  }

  setAutohideFn = (enabled: boolean) => {
    autoHide = enabled
    if (winRef) {
      winRef.exclusivity = enabled ? Astal.Exclusivity.IGNORE : Astal.Exclusivity.EXCLUSIVE
    }
    updateVisibility()
  }

  getAutohideFn = () => autoHide

  hasActiveWindow.subscribe((val) => {
    hasWindow = val
    updateVisibility()
  })

  return (
    <window
      visible
      name="mistbar"
      namespace="mistbar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={config.autoHide ? Astal.Exclusivity.IGNORE : Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
      setup={(win: any) => {
        winRef = win
        updateVisibility()
      }}
    >
      <box
        orientation={Gtk.Orientation.VERTICAL}
        setup={(self) => {
          const motion = new Gtk.EventControllerMotion()
          motion.connect("enter", () => {
            isHovered = true
            updateVisibility()
          })
          motion.connect("leave", () => {
            isHovered = false
            updateVisibility()
          })
          self.add_controller(motion)
        }}
      >
        {/* 2px top hover trigger strip */}
        <box class="hover-trigger-zone" />

        <revealer
          transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
          transitionDuration={200}
          revealChild={true}
          setup={(self) => {
            revealerWidget = self
            updateVisibility()
          }}
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
        </revealer>
      </box>
    </window>
  )
}

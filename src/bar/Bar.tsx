import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import GLib from "gi://GLib?version=2.0"
import LeftSection from "./LeftSection"
import CenterSection from "./CenterSection"
import RightSection from "./RightSection"
import { MistbarConfig, defaultConfig } from "../config"
import { execAsync } from "ags/process"

let winRef: any = null
let revealerRef: Gtk.Revealer | null = null
let isHovered = false
let hasWindow = false
let autoHide = false
let watcherStarted = false

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
  if (!revealerRef) return
  if (!autoHide) {
    revealerRef.set_reveal_child(true)
    if (winRef) {
      winRef.visible = true
      winRef.exclusivity = Astal.Exclusivity.EXCLUSIVE
    }
  } else {
    // Intelligent Auto-Hide (Intellihide):
    // If desktop has NO windows on active workspace OR mouse is hovered -> slide down / reveal
    // If windows are active AND mouse is not hovered -> slide up / hide smoothly
    const shouldShow = !hasWindow || isHovered
    revealerRef.set_reveal_child(shouldShow)
    if (winRef) {
      winRef.visible = true
      winRef.exclusivity = Astal.Exclusivity.IGNORE
    }
  }
}

function startWindowWatcher() {
  if (watcherStarted) return
  watcherStarted = true

  GLib.timeout_add(GLib.PRIORITY_DEFAULT, 400, () => {
    execAsync([
      "python3",
      "-c",
      `
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
`
    ])
      .then((out: string) => {
        const has = out.trim() === "true"
        if (has !== hasWindow) {
          hasWindow = has
          updateVisibility()
        }
      })
      .catch(() => {})

    return GLib.SOURCE_CONTINUE
  })
}

export default function Bar(gdkmonitor: Gdk.Monitor, config: MistbarConfig = defaultConfig) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
  autoHide = Boolean(config.autoHide)

  // 1. Build the inner floating bar
  const innerBar = (
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
  )

  // 2. Wrap in native GTK4 Revealer for smooth hardware-accelerated slide up / down animation
  const revealer = new Gtk.Revealer({
    transition_type: Gtk.RevealerTransitionType.SLIDE_DOWN,
    transition_duration: 250,
    reveal_child: !config.autoHide,
  })
  revealer.set_child(innerBar)
  revealerRef = revealer

  // 3. Top hover trigger zone & outer container
  const triggerZone = new Gtk.Box({
    css_classes: ["hover-trigger-zone"],
  })

  const outerBox = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    css_classes: ["bar-outer-container"],
  })
  outerBox.append(triggerZone)
  outerBox.append(revealer)

  // 4. Attach mouse motion controller to outerBox for hover detection
  const motion = new Gtk.EventControllerMotion()
  motion.connect("enter", () => {
    isHovered = true
    updateVisibility()
  })
  motion.connect("leave", () => {
    isHovered = false
    updateVisibility()
  })
  outerBox.add_controller(motion)

  // 5. Build the layer-shell window
  const isPill = (config.look || "pill") === "pill"
  const win = (
    <window
      visible
      name="mistbar"
      namespace="mistbar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={config.autoHide ? Astal.Exclusivity.IGNORE : Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      margin_top={isPill ? (config.barMargin ?? 6) : 0}
      margin_left={isPill ? 12 : 0}
      margin_right={isPill ? 12 : 0}
      margin_bottom={0}
      application={app}
    >
      {outerBox}
    </window>
  )

  winRef = win
  try {
    win.remove_css_class("background")
  } catch {}

  try {
    if (isPill) {
      win.margin_top = config.barMargin ?? 6
      win.margin_left = 12
      win.margin_right = 12
      win.margin_bottom = 0
    } else {
      win.margin_top = 0
      win.margin_left = 0
      win.margin_right = 0
      win.margin_bottom = 0
    }
  } catch (err) {
    console.error("Error setting layer surface margins:", err)
  }

  win.visible = true

  startWindowWatcher()
  updateVisibility()

  return win
}

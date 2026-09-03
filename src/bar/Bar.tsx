import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import GLib from "gi://GLib?version=2.0"
import LeftSection from "./LeftSection"
import CenterSection from "./CenterSection"
import RightSection from "./RightSection"
import { MistbarConfig, defaultConfig } from "../config"
import { execAsync } from "ags/process"

export interface BarEntry {
  win: any
  revealer: Gtk.Revealer
  outerBox: Gtk.Box
}

const barEntries: BarEntry[] = []
let isHovered = false
let hasWindow = false
let autoHide = false
let manuallyHidden = false
let watcherStarted = false

export function getBarWindows(): any[] {
  return barEntries.map(e => e.win)
}

export function getBarWindow(): any {
  return barEntries[0]?.win || null
}

export function isBarManuallyHidden(): boolean {
  return manuallyHidden
}

export function setBarManuallyHidden(hidden: boolean) {
  manuallyHidden = hidden
  updateVisibility()
}

export function toggleBarManuallyHidden(): boolean {
  manuallyHidden = !manuallyHidden
  updateVisibility()
  return manuallyHidden
}

export function setBarAutohide(enabled: boolean) {
  autoHide = enabled
  updateVisibility()
}

export function getBarAutohide(): boolean {
  return autoHide
}

export function updateVisibility() {
  for (const { win, revealer } of barEntries) {
    if (manuallyHidden) {
      revealer.set_reveal_child(false)
      win.visible = false
      continue
    }

    win.visible = true
    if (!autoHide) {
      revealer.set_reveal_child(true)
      win.exclusivity = Astal.Exclusivity.EXCLUSIVE
    } else {
      // Intelligent Auto-Hide (Intellihide):
      // If desktop has NO windows on active workspace OR mouse is hovered -> slide down / reveal
      // If windows are active AND mouse is not hovered -> slide up / hide smoothly
      const shouldShow = !hasWindow || isHovered
      revealer.set_reveal_child(shouldShow)
      win.exclusivity = Astal.Exclusivity.IGNORE
    }
  }
}

function checkWindowStatus() {
  execAsync(["niri", "msg", "-j", "workspaces"])
    .then((out: string) => {
      try {
        const ws = JSON.parse(out)
        const act = ws.find((w: any) => w.is_active || w.is_focused)
        const has = Boolean(act && act.active_window_id !== null)
        if (has !== hasWindow) {
          hasWindow = has
          updateVisibility()
        }
      } catch {}
    })
    .catch(() => {
      // Fallback for Hyprland
      execAsync(["hyprctl", "activewindow", "-j"])
        .then((out: string) => {
          try {
            const act = JSON.parse(out)
            const has = Boolean(act && (act.title || act.class))
            if (has !== hasWindow) {
              hasWindow = has
              updateVisibility()
            }
          } catch {}
        })
        .catch(() => {})
    })
}

function startWindowWatcher() {
  if (watcherStarted) return
  watcherStarted = true

  checkWindowStatus()

  // Lightweight check every 600ms without spawning python subprocesses
  GLib.timeout_add(GLib.PRIORITY_DEFAULT, 600, () => {
    if (autoHide && !manuallyHidden) {
      checkWindowStatus()
    }
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

  try {
    win.remove_css_class("background")
  } catch {}

  // Apply initial classes
  try {
    const styleName = config.style || "glassy"
    win.add_css_class(`style-${styleName}`)
    if (styleName === "glassy") {
      win.add_css_class(`glassy-${config.glassyTextColor || "white"}`)
    }
    win.add_css_class(`look-${config.look || "pill"}`)
    if (config.theme === "light") {
      win.add_css_class("light-theme")
    }
  } catch (err) {
    console.error("Error setting initial bar CSS classes:", err)
  }

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

  const entry: BarEntry = { win, revealer, outerBox }
  barEntries.push(entry)
  win.connect("destroy", () => {
    const idx = barEntries.indexOf(entry)
    if (idx !== -1) barEntries.splice(idx, 1)
  })

  win.visible = true

  startWindowWatcher()
  updateVisibility()

  return win
}

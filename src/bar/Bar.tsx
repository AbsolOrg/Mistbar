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
  triggerWin: any
  revealer: Gtk.Revealer
  outerBox: Gtk.Box
  monitor: Gdk.Monitor
  hasWindow: boolean
  isHovered: boolean
  isTriggerHovered: boolean
  graceTimerId: number
  slideTimerId: number
}

const barEntries: BarEntry[] = []
let autoHide = false
let manuallyHidden = false
let watcherStarted = false
const openMenus = new Set<any>()

export function isAnyMenuOpen(): boolean {
  return openMenus.size > 0
}

export function registerMenuButton(btn: Gtk.MenuButton) {
  try {
    btn.connect("notify::active", (b: Gtk.MenuButton) => {
      if (b.active) {
        openMenus.add(b)
      } else {
        openMenus.delete(b)
      }
      updateVisibility()
    })

    const pop = btn.get_popover()
    if (pop) {
      pop.connect("notify::visible", (p: Gtk.Popover) => {
        if (p.visible) {
          openMenus.add(p)
        } else {
          openMenus.delete(p)
        }
        updateVisibility()
      })
      pop.connect("closed", () => {
        openMenus.delete(pop)
        openMenus.delete(btn)
        updateVisibility()
      })
    }
  } catch (err) {
    console.error("Error registering menu button:", err)
  }
}

export function bindMenuButtons(widget: Gtk.Widget) {
  if (!widget) return
  if (widget instanceof Gtk.MenuButton) {
    registerMenuButton(widget)
  }
  let child = widget.get_first_child()
  while (child) {
    bindMenuButtons(child)
    child = child.get_next_sibling()
  }
}

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
  for (const entry of barEntries) {
    cancelGraceTimer(entry)
    if (hidden) {
      entry.revealer.set_reveal_child(false)
      entry.win.visible = false
      if (entry.triggerWin) entry.triggerWin.visible = false
    } else {
      updateEntryVisibility(entry)
    }
  }
}

export function toggleBarManuallyHidden(): boolean {
  manuallyHidden = !manuallyHidden
  setBarManuallyHidden(manuallyHidden)
  return manuallyHidden
}

export function setBarAutohide(enabled: boolean) {
  autoHide = enabled
  for (const entry of barEntries) {
    cancelGraceTimer(entry)
    entry.win.exclusivity = enabled ? Astal.Exclusivity.IGNORE : Astal.Exclusivity.EXCLUSIVE
    updateEntryVisibility(entry)
  }
}

export function getBarAutohide(): boolean {
  return autoHide
}

function cancelGraceTimer(entry: BarEntry) {
  if (entry.graceTimerId) {
    GLib.source_remove(entry.graceTimerId)
    entry.graceTimerId = 0
  }
}

function scheduleGraceHide(entry: BarEntry) {
  if (entry.graceTimerId) return

  entry.graceTimerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
    entry.graceTimerId = 0

    if (!autoHide || manuallyHidden) return GLib.SOURCE_REMOVE
    if (entry.isHovered || entry.isTriggerHovered || isAnyMenuOpen() || !entry.hasWindow) {
      return GLib.SOURCE_REMOVE
    }

    // Smoothly slide up into top edge
    entry.revealer.set_reveal_child(false)
    return GLib.SOURCE_REMOVE
  })
}

function updateEntryVisibility(entry: BarEntry) {
  const { win, triggerWin, revealer } = entry

  if (manuallyHidden) {
    cancelGraceTimer(entry)
    revealer.set_reveal_child(false)
    win.visible = false
    if (triggerWin) triggerWin.visible = false
    return
  }

  if (!autoHide) {
    cancelGraceTimer(entry)
    win.exclusivity = Astal.Exclusivity.EXCLUSIVE
    win.visible = true
    revealer.set_reveal_child(true)
    if (triggerWin) triggerWin.visible = false
    return
  }

  // Auto-hide mode is ON
  win.exclusivity = Astal.Exclusivity.IGNORE

  // Reveal conditions (Intelligent Auto-Hide):
  // 1. Desktop has NO windows on active workspace (!entry.hasWindow)
  // 2. OR cursor is hovering the bar or top trigger edge
  // 3. OR a popover menu / control center is open
  const shouldReveal = !entry.hasWindow || entry.isHovered || entry.isTriggerHovered || isAnyMenuOpen()

  if (shouldReveal) {
    cancelGraceTimer(entry)
    win.visible = true
    revealer.set_reveal_child(true)
    if (!entry.hasWindow && triggerWin) {
      triggerWin.visible = false
    }
  } else {
    if (triggerWin) triggerWin.visible = true
    scheduleGraceHide(entry)
  }
}

export function updateVisibility() {
  for (const entry of barEntries) {
    updateEntryVisibility(entry)
  }
}

function checkWindowStatus() {
  execAsync(["niri", "msg", "-j", "workspaces"])
    .then((out: string) => {
      try {
        const ws = JSON.parse(out)
        for (const entry of barEntries) {
          const conn = entry.monitor.get_connector ? entry.monitor.get_connector() : (entry.monitor as any).connector
          const act = ws.find((w: any) =>
            w.is_active && (!conn || !w.output || w.output === conn)
          ) || ws.find((w: any) => w.is_active || w.is_focused)

          const has = Boolean(act && act.active_window_id !== null)
          if (has !== entry.hasWindow) {
            entry.hasWindow = has
            updateEntryVisibility(entry)
          }
        }
      } catch {}
    })
    .catch(() => {
      // Hyprland check
      execAsync(["hyprctl", "workspaces", "-j"])
        .then((out: string) => {
          try {
            const ws = JSON.parse(out)
            execAsync(["hyprctl", "monitors", "-j"])
              .then((mOut: string) => {
                const monitors = JSON.parse(mOut)
                for (const entry of barEntries) {
                  const conn = entry.monitor.get_connector ? entry.monitor.get_connector() : (entry.monitor as any).connector
                  const mon = monitors.find((m: any) => m.name === conn) || monitors.find((m: any) => m.focused)
                  const actWsName = mon?.activeWorkspace?.name ?? mon?.activeWorkspace?.id
                  const wObj = ws.find((w: any) => w.name === actWsName || w.id === actWsName)
                  const has = Boolean(wObj && wObj.windows > 0)
                  if (has !== entry.hasWindow) {
                    entry.hasWindow = has
                    updateEntryVisibility(entry)
                  }
                }
              })
              .catch(() => {
                execAsync(["hyprctl", "activewindow", "-j"])
                  .then((actOut: string) => {
                    const act = JSON.parse(actOut)
                    const has = Boolean(act && (act.title || act.class))
                    for (const entry of barEntries) {
                      if (has !== entry.hasWindow) {
                        entry.hasWindow = has
                        updateEntryVisibility(entry)
                      }
                    }
                  })
                  .catch(() => {})
              })
          } catch {}
        })
        .catch(() => {
          // Sway check
          execAsync(["swaymsg", "-t", "get_workspaces"])
            .then((sOut: string) => {
              try {
                const sWs = JSON.parse(sOut)
                for (const entry of barEntries) {
                  const conn = entry.monitor.get_connector ? entry.monitor.get_connector() : (entry.monitor as any).connector
                  const focused = sWs.find((w: any) => (!conn || w.output === conn) && w.focused) || sWs.find((w: any) => w.focused)
                  const has = Boolean(focused && (focused.representation !== null || focused.windows > 0))
                  if (has !== entry.hasWindow) {
                    entry.hasWindow = has
                    updateEntryVisibility(entry)
                  }
                }
              } catch {}
            })
            .catch(() => {})
        })
    })
}

function startWindowWatcher() {
  if (watcherStarted) return
  watcherStarted = true

  checkWindowStatus()

  // Responsive check every 400ms
  GLib.timeout_add(GLib.PRIORITY_DEFAULT, 400, () => {
    if (autoHide && !manuallyHidden) {
      checkWindowStatus()
    }
    return GLib.SOURCE_CONTINUE
  })
}

function createTriggerWindow(
  gdkmonitor: Gdk.Monitor,
  onEnter: () => void,
  onLeave: () => void
): any {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  const triggerBox = new Gtk.Box({
    css_classes: ["mistbar-hot-edge"],
  })
  triggerBox.set_size_request(-1, 2)

  const motion = new Gtk.EventControllerMotion()
  motion.connect("enter", () => {
    onEnter()
  })
  motion.connect("leave", () => {
    onLeave()
  })
  triggerBox.add_controller(motion)

  const win = (
    <window
      visible={autoHide}
      name="mistbar-trigger"
      namespace="mistbar-trigger"
      class="MistbarTrigger"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.IGNORE}
      layer={Astal.Layer.TOP}
      anchor={TOP | LEFT | RIGHT}
      margin_top={0}
      margin_left={0}
      margin_right={0}
      margin_bottom={0}
      application={app}
    >
      {triggerBox}
    </window>
  )

  try {
    win.remove_css_class("background")
  } catch {}

  return win
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
    transition_duration: 200,
    reveal_child: !config.autoHide,
  })
  revealer.set_child(innerBar)

  // 3. Outer container with mouse motion detection
  const outerBox = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    css_classes: ["bar-outer-container"],
  })
  outerBox.append(revealer)

  // 4. Build the layer-shell main bar window
  const isPill = (config.look || "pill") === "pill"
  const win = (
    <window
      visible={!config.autoHide}
      name="mistbar"
      namespace="mistbar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={config.autoHide ? Astal.Exclusivity.IGNORE : Astal.Exclusivity.EXCLUSIVE}
      layer={Astal.Layer.TOP}
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

  // 5. Create the entry and trigger window
  const entry: BarEntry = {
    win,
    triggerWin: null,
    revealer,
    outerBox,
    monitor: gdkmonitor,
    hasWindow: false,
    isHovered: false,
    isTriggerHovered: false,
    graceTimerId: 0,
    slideTimerId: 0,
  }

  const triggerWin = createTriggerWindow(
    gdkmonitor,
    () => {
      entry.isTriggerHovered = true
      updateEntryVisibility(entry)
    },
    () => {
      entry.isTriggerHovered = false
      updateEntryVisibility(entry)
    }
  )
  entry.triggerWin = triggerWin

  // 6. Connect motion controller to outerBox
  const motion = new Gtk.EventControllerMotion()
  motion.connect("enter", () => {
    entry.isHovered = true
    updateEntryVisibility(entry)
  })
  motion.connect("leave", () => {
    entry.isHovered = false
    updateEntryVisibility(entry)
  })
  outerBox.add_controller(motion)

  // 7. Bind menu buttons and popovers
  bindMenuButtons(innerBar)
  GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
    bindMenuButtons(innerBar)
    return GLib.SOURCE_REMOVE
  })

  // 8. Connect revealer transition finished signal to completely unmap window when hidden
  revealer.connect("notify::child-revealed", (r: Gtk.Revealer) => {
    if (!r.get_child_revealed()) {
      if ((autoHide && entry.hasWindow && !entry.isHovered && !entry.isTriggerHovered && !isAnyMenuOpen()) || manuallyHidden) {
        win.visible = false
        if (autoHide && !manuallyHidden && entry.triggerWin) {
          entry.triggerWin.visible = true
        }
      }
    }
  })

  barEntries.push(entry)

  win.connect("destroy", () => {
    cancelGraceTimer(entry)
    if (entry.triggerWin) {
      try {
        entry.triggerWin.destroy()
      } catch {}
    }
    const idx = barEntries.indexOf(entry)
    if (idx !== -1) barEntries.splice(idx, 1)
  })

  win.visible = !config.autoHide

  startWindowWatcher()
  updateEntryVisibility(entry)

  return win
}

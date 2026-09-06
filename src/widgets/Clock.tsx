import Gtk from "gi://Gtk?version=4.0"
import { createPoll } from "ags/time"

export default function Clock() {
  // Exact macOS format as in Apple docs: "Tue Apr 1  9:41 AM"
  const time = createPoll(
    "",
    1000,
    ["date", "+%a %b %-d  %-I:%M %p"]
  )

  const fullDate = createPoll(
    "",
    60000,
    ["date", "+%A, %B %-d, %Y"]
  )

  return (
    <menubutton class="status-icon clock-btn" tooltipText="Calendar & Time">
      <label class="clock" label={time} />

      <popover class="control-popover calendar-popover">
        <box orientation={Gtk.Orientation.VERTICAL} spacing={8} class="popover-container calendar-container">
          <box class="popover-header" spacing={8}>
            <label class="popover-title" label={fullDate} hexpand halign={Gtk.Align.START} />
          </box>
          <Gtk.Calendar class="glass-calendar" />
        </box>
      </popover>
    </menubutton>
  )
}


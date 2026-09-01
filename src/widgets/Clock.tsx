import { createPoll } from "ags/time"

export default function Clock() {
  // macOS Tahoe format: "Tue 1 Sep 8:41 PM"
  const time = createPoll(
    "",
    1000,
    ["date", "+%a %-d %b %-I:%M %p"]
  )

  return (
    <label class="clock" label={time} />
  )
}

import { createPoll } from "ags/time"

export default function Clock() {
  // Exact macOS format as in Apple docs: "Tue Apr 1  9:41 AM"
  const time = createPoll(
    "",
    1000,
    ["date", "+%a %b %-d  %-I:%M %p"]
  )

  return (
    <label class="clock" label={time} />
  )
}

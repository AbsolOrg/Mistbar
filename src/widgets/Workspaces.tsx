import { createPoll } from "ags/time"

interface NiriWorkspace {
  id: number
  idx: number
  name: string | null
  output: string
  is_active: boolean
  is_focused: boolean
  active_window_id: number | null
}

function parseWorkspaces(json: string): NiriWorkspace[] {
  try {
    const data = JSON.parse(json) as NiriWorkspace[]
    return data.sort((a, b) => a.idx - b.idx)
  } catch {
    return []
  }
}

function formatDots(json: string): string {
  const ws = parseWorkspaces(json)
  if (ws.length === 0) return "●"
  return ws.map(w => {
    if (w.is_focused) return "●"
    if (w.active_window_id !== null) return "●"
    return "○"
  }).join("  ")
}

// Poll niri for workspace state
const workspacesDots = createPoll(
  "●",
  500,
  ["bash", "-c", "niri msg --json workspaces 2>/dev/null || echo '[]'"],
  formatDots
)

export default function Workspaces() {
  return (
    <box class="workspaces">
      <label
        class="workspace-dots"
        label={workspacesDots}
      />
    </box>
  )
}

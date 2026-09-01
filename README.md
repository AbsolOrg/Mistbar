# Mistbar

**macOS Tahoe Liquid Glass Top Bar for Linux (Wayland)**

A faithful macOS Tahoe-inspired floating menu bar built with [AGS 3](https://github.com/Aylur/ags) (Astal + GTK4 + TypeScript) for the [Niri](https://github.com/YaLTeR/niri) compositor on Wayland.

## Features

- **Liquid Glass Design** -- Frosted glass effect with semi-transparent dark background, subtle inner glow, and drop shadows
- **Floating Bar** -- Hovering with gaps from screen edges, rounded pill-like corners
- **macOS Layout** -- Three-section layout: App menu (left), Clock + Workspaces (center), System icons (right)
- **System Status Icons** -- Wi-Fi, Bluetooth, Volume, Battery, Brightness with Nerd Font icons
- **Workspace Dots** -- macOS Mission Control-style dot indicators for Niri workspaces
- **Power Menu** -- Sleep, Restart, Shut Down, Log Out dropdown
- **CLI Interface** -- `mistbar start/stop/restart/status` with colored output
- **Scroll Controls** -- Scroll on volume/brightness icons to adjust levels

## Dependencies

| Package | Purpose |
|---|---|
| [AGS 3](https://github.com/Aylur/ags) (ags) | Shell framework |
| gtk4-layer-shell | Wayland layer shell |
| libastal (libastal-4-git) | Astal GTK4 bindings |
| [Niri](https://github.com/YaLTeR/niri) | Wayland compositor |
| fuzzel | App launcher |
| Inter font | UI font (macOS SF Pro alternative) |
| A Nerd Font | Status icons |
| NetworkManager | Wi-Fi status |
| WirePlumber | Audio control |
| BlueZ | Bluetooth |
| brightnessctl | Brightness control |

## Live Preview (Try Without Installing)

You can try Mistbar live without downloading or installing anything permanently:

```bash
# One-liner remote preview:
curl -sSL https://raw.githubusercontent.com/AbsolOrg/Mistbar/main/view.sh | bash

# Or from local clone:
./view.sh
```

Press `Ctrl+C` at any time to close the preview and clean up.

## Installation & Updates

```bash
# Clone
git clone https://github.com/AbsolOrg/Mistbar.git
cd Mistbar

# Install (or update if already installed)
./install.sh

# Install system dependencies (Arch/CachyOS)
mistbar install-deps
```

> **Note:** Running `./install.sh` when Mistbar is already installed automatically switches to **Update mode**, refreshing links, permissions, and restarting any active bar instances.

## Uninstallation

```bash
./uninstall.sh
```

## Usage

```bash
mistbar start             # Start the bar
mistbar stop              # Stop the bar
mistbar restart           # Restart the bar
mistbar toggle            # Toggle bar visibility (hide/show)
mistbar theme light       # Switch to Light liquid glass theme
mistbar theme dark        # Switch to Dark liquid glass theme
mistbar status            # Check if running and visibility state
mistbar config            # View or edit ~/.config/mistbar/config.json
mistbar inspect           # Open GTK Inspector for live CSS inspection
mistbar install-deps      # Install dependencies
mistbar --help            # Show all commands and options
mistbar --version         # Show version
```

## Configuration & Themes

Mistbar can be customized by editing `~/.config/mistbar/config.json` (or via `mistbar config`):

```json
{
  "theme": "dark",
  "autoHide": false,
  "barHeight": 24,
  "barMargin": 0,
  "borderRadius": 0,
  "showAppMenu": true,
  "showWorkspaces": true,
  "showTray": true,
  "showBattery": true,
  "showBrightness": true,
  "showVolume": true,
  "showNetwork": true,
  "showBluetooth": true,
  "showControlCenter": true,
  "showSpotlight": true
}
```

- **Theme Switching**: Switch between Dark and Light frosted glass modes at any time with `mistbar theme dark` and `mistbar theme light`.
- **Styling**: Fine-tune colors, blur, margins, and borders directly in `src/styles/style.scss`.

## Project Structure

```
Mistbar/
├── mistbar              # CLI launcher & manager
├── install.sh           # Smart installer & updater
├── uninstall.sh         # Clean uninstaller
├── view.sh              # Live preview script
├── README.md
└── src/
    ├── app.ts           # AGS 3 entry point & IPC request handler
    ├── config.ts        # Configuration manager & JSON parser
    ├── bar/
    │   ├── Bar.tsx      # Main layer-shell floating bar
    │   ├── LeftSection.tsx
    │   ├── CenterSection.tsx
    │   └── RightSection.tsx
    ├── widgets/
    │   ├── ActiveWindow.tsx
    │   ├── AppMenu.tsx
    │   ├── Battery.tsx
    │   ├── Bluetooth.tsx
    │   ├── Brightness.tsx
    │   ├── Clock.tsx
    │   ├── ControlCenter.tsx
    │   ├── Network.tsx
    │   ├── PowerMenu.tsx
    │   ├── Spotlight.tsx
    │   ├── SystemTray.tsx
    │   ├── Volume.tsx
    │   └── Workspaces.tsx
    └── styles/
        └── style.scss
```

> *Not affiliated with Apple Inc. macOS is a trademark of Apple Inc.*

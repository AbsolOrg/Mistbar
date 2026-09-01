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
mistbar start          # Start the bar
mistbar stop           # Stop the bar
mistbar restart        # Restart the bar
mistbar status         # Check if running
mistbar inspect        # Open GTK Inspector
mistbar install-deps   # Install dependencies
mistbar --help         # Show help
mistbar --version      # Show version
```

## Customization

Edit `src/styles/style.scss` to adjust:
- Glass background opacity/color
- Bar height and margins
- Corner radius
- Font sizes
- Color scheme

## Project Structure

```
Mistbar/
├── mistbar              # CLI launcher
├── install.sh           # Installer
├── uninstall.sh         # Uninstaller
├── view.sh              # Live preview script
├── README.md
└── src/
    ├── app.ts           # Entry point
    ├── bar/
    │   ├── Bar.tsx      # Main bar
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
    │   ├── Network.tsx
    │   ├── PowerMenu.tsx
    │   ├── SystemTray.tsx
    │   ├── Volume.tsx
    │   └── Workspaces.tsx
    └── styles/
        └── style.scss
```

## Roadmap

- [x] Phase 1: Core bar (layout, glass effect, clock, workspaces, system icons)
- [x] Phase 2: Dropdown popovers (volume slider, Wi-Fi list, Bluetooth manager, brightness slider, battery/power profile, power menu)
- [x] Phase 3: Global app menu (macOS-style contextual File/Edit/View/Window/Help menus)
- [x] Phase 4: System tray (DBus StatusNotifierItem integration)
- [ ] Phase 5: Polish, auto-hide, themes

## License

MIT

---

> *Not affiliated with Apple Inc. macOS is a trademark of Apple Inc.*

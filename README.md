# Mistbar

**macOS Tahoe Liquid Glass Top Bar for Linux (Wayland)**
- A faithful macOS Tahoe-inspired floating menu bar built with [AGS 3](https://github.com/Aylur/ags) (Astal + GTK4 + TypeScript) for the [Niri](https://github.com/YaLTeR/niri) compositor on Wayland.

<img width="1361" height="41" alt="bar" src="https://github.com/user-attachments/assets/c00213bb-c705-40ba-b789-558eaeba2c9e" />
<img width="1352" height="40" alt="glass" src="https://github.com/user-attachments/assets/d35bd5cb-e3e3-46b2-9856-ffe23173c9eb" />
<img width="1365" height="40" alt="glasss" src="https://github.com/user-attachments/assets/f2d739d0-7f9d-4fd9-af03-ac0b35a7b3b4" />

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

### Quick Install (Recommended)

Run this one-liner in your terminal to install Mistbar directly:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/AbsolOrg/Mistbar/main/install.sh)"
```

The installer will:
- Install Mistbar into `~/.mistbar`
- Prompt you to select your installation channel:
  - **1) Latest Release** *(Recommended - stable releases)*
  - **2) Main Branch** *(Bleeding edge - latest features)*
- Symlink `mistbar` CLI into `~/.local/bin/mistbar`
- Configure Wayland blur rules and autostart

### Updating Mistbar

If Mistbar is already installed, update anytime with:

```bash
mistbar update
```

*(Or simply re-run the one-liner installer above).* The updater automatically detects your existing installation in `~/.mistbar`, prompts for release or main branch (defaulting to the latest release), updates files, and restarts your active bar smoothly.

### Manual Installation (From Local Clone)

```bash
git clone https://github.com/AbsolOrg/Mistbar.git
cd Mistbar
./install.sh
```

### System Dependencies

```bash
# On Arch Linux / CachyOS:
mistbar install-deps
```

## Uninstallation

To remove Mistbar, run:

```bash
mistbar uninstall
# or:
~/.mistbar/uninstall.sh
```

The uninstaller removes CLI symlinks, compositor autostart rules, and optionally prompts whether to delete the `~/.mistbar` installation and configuration files.

## Usage

```bash
mistbar start             # Start the bar
mistbar stop              # Stop the bar
mistbar restart           # Restart the bar
mistbar update            # Update Mistbar to latest release or main
mistbar uninstall         # Uninstall Mistbar from system
mistbar toggle            # Toggle bar visibility (hide/show)
mistbar auto-hide on      # Enable intelligent auto-hide (or mistbar --auto-hide)
mistbar auto-hide off     # Disable auto-hide (or mistbar --always-visible)
mistbar auto-hide toggle  # Toggle auto-hide state
mistbar style glassy            # Switch to Frosted Liquid Glass (default)
mistbar style glassy dark       # Frosted Liquid Glass with Dark Fonts & Logos
mistbar style glassy white      # Frosted Liquid Glass with White Fonts & Logos
mistbar style transparent       # Switch to 100% Transparent See-Through
mistbar style solid             # Switch to Solid Opaque Color (deep black/white)
mistbar look pill         # Switch to Floating Rounded Pill capsule (default)
mistbar look attached     # Switch to Edge-to-Edge Full-Width Top Bar
mistbar theme light       # Switch to Light theme
mistbar theme dark        # Switch to Dark theme
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
  "style": "glassy",
  "look": "pill",
  "autoHide": false,
  "barHeight": 28,
  "barMargin": 6,
  "borderRadius": 16,
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

- **Dynamic Look & Shape**: Switch between floating capsule and attached top bar on-the-fly (`mistbar look pill` and `mistbar look attached`).
- **Dynamic Background Styles**: Switch between frosted glass, transparent, and solid modes (`mistbar style glassy`, `mistbar style transparent`, `mistbar style solid`).
- **Theme Switching**: Switch between Dark and Light modes (`mistbar theme dark` and `mistbar theme light`).
- **Styling**: Fine-tune colors, blur, margins, and borders directly in `src/styles/style.scss`.

> *Not affiliated with Apple Inc. macOS is a trademark of Apple Inc.*

#!/usr/bin/env bash
# ============================================================================
# Mistbar Installation & Update Script
# ============================================================================

set -euo pipefail

SCRIPT_SOURCE="$(readlink -f "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_SOURCE")" && pwd)"
BIN_TARGET="$HOME/.local/bin/mistbar"
INSTANCE_NAME="mistbar"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

IS_UPDATE=false
if [ -L "$BIN_TARGET" ] || [ -f "$BIN_TARGET" ]; then
    IS_UPDATE=true
fi

echo -e "${CYAN}${BOLD}"
echo "  ========================================"
if [ "$IS_UPDATE" = true ]; then
    echo "              Mistbar Updater             "
else
    echo "             Mistbar Installer            "
fi
echo "  ========================================"
echo -e "${NC}"

if [ "$IS_UPDATE" = true ]; then
    echo -e "${BLUE}Detected existing installation. Updating Mistbar...${NC}"
else
    echo -e "${BLUE}Setting up new Mistbar installation...${NC}"
fi
echo ""

# 1. Ensure scripts are executable
echo -e "${BLUE}[1/6] Setting file permissions...${NC}"
chmod +x "$SCRIPT_DIR/mistbar" "$SCRIPT_DIR/install.sh" "$SCRIPT_DIR/uninstall.sh" "$SCRIPT_DIR/view.sh"
echo -e "${GREEN}  ✓ Scripts are executable${NC}"

# 2. Setup / Refresh symlink in ~/.local/bin
echo -e "${BLUE}[2/6] Linking binary to ~/.local/bin/mistbar...${NC}"
mkdir -p "$HOME/.local/bin"
ln -sf "$SCRIPT_DIR/mistbar" "$BIN_TARGET"
echo -e "${GREEN}  ✓ Symlink configured: $BIN_TARGET -> $SCRIPT_DIR/mistbar${NC}"

# 3. Ensure TypeScript type declarations are present
echo -e "${BLUE}[3/6] Checking TypeScript types...${NC}"
if [ ! -d "$SCRIPT_DIR/src/@girs" ]; then
    echo -e "  Generating TypeScript types with AGS..."
    ags types -d "$SCRIPT_DIR/src" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Types generated${NC}"
else
    echo -e "${GREEN}  ✓ Types are up to date${NC}"
fi

# 4. Check & Configure Niri Compositor Layer Blur Rule
echo -e "${BLUE}[4/6] Checking Niri compositor blur integration...${NC}"
NIRI_CONFIG="$HOME/.config/niri/config.kdl"
if [ -f "$NIRI_CONFIG" ]; then
    if ! grep -q 'namespace="mistbar"' "$NIRI_CONFIG"; then
        python3 -c "
kdl_path = '$NIRI_CONFIG'
with open(kdl_path, 'r') as f:
    content = f.read()

rule = '''
layer-rule {
    match namespace=\"mistbar\"
    geometry-corner-radius 16
    background-effect {
        blur true
    }
}
'''
if 'match namespace=\"mistbar\"' not in content:
    idx = content.find('input {')
    if idx != -1:
        new_content = content[:idx] + rule + '\n' + content[idx:]
    else:
        new_content = content + '\n' + rule
    with open(kdl_path, 'w') as f:
        f.write(new_content)
" 2>/dev/null || true
        echo -e "${GREEN}  ✓ Added mistbar background-effect blur rule to Niri config${NC}"
        if command -v niri &>/dev/null; then
            niri msg action load-config-file 2>/dev/null || true
        fi
    else
        echo -e "${GREEN}  ✓ Niri blur layer-rule already configured${NC}"
    fi
else
    echo -e "${DIM}  Niri config not detected, skipping layer-rule setup${NC}"
fi

# 5. Configure default auto-start on login
echo -e "${BLUE}[5/6] Configuring default auto-start on login...${NC}"

# 5a. Universal XDG Autostart (.desktop file)
AUTOSTART_DIR="$HOME/.config/autostart"
mkdir -p "$AUTOSTART_DIR"
cat << 'EOF' > "$AUTOSTART_DIR/mistbar.desktop"
[Desktop Entry]
Type=Application
Name=Mistbar
Comment=macOS Tahoe Liquid Glass Top Bar
Exec=mistbar start
Terminal=false
Categories=Utility;
X-GNOME-Autostart-enabled=true
EOF
echo -e "${GREEN}  ✓ Configured universal XDG autostart (~/.config/autostart/mistbar.desktop)${NC}"

# 5b. Niri compositor autostart & conflict handling
if [ -f "$NIRI_CONFIG" ]; then
    python3 -c "
kdl_path = '$NIRI_CONFIG'
with open(kdl_path, 'r') as f:
    lines = f.readlines()

new_lines = []
modified = False
has_mistbar_startup = False

for line in lines:
    stripped = line.strip()
    if stripped.startswith('spawn-at-startup') and 'mistbar' in stripped:
        has_mistbar_startup = True
        new_lines.append(line)
    elif stripped.startswith('spawn-at-startup') and 'waybar' in stripped:
        # Disable conflicting waybar startup
        new_lines.append('// spawn-at-startup \"waybar\" // Disabled by Mistbar installer\n')
        modified = True
    else:
        new_lines.append(line)

if not has_mistbar_startup:
    new_lines.append('\n// Start Mistbar on desktop launch\nspawn-at-startup \"mistbar\" \"start\"\n')
    modified = True

if modified:
    with open(kdl_path, 'w') as f:
        f.writelines(new_lines)
" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Configured Mistbar as default bar in Niri config (disabled conflicting bars)${NC}"

    # Stop conflicting waybar if running
    if pgrep -x waybar &>/dev/null; then
        echo -e "${BLUE}  Stopping currently running Waybar...${NC}"
        pkill -x waybar 2>/dev/null || true
    fi

    if command -v niri &>/dev/null; then
        niri msg action load-config-file 2>/dev/null || true
    fi
else
    echo -e "${DIM}  Niri config not detected, skipping Niri-specific autostart${NC}"
fi

# 5c. Hyprland compositor autostart (if present)
HYPR_CONFIG="$HOME/.config/hypr/hyprland.conf"
if [ -f "$HYPR_CONFIG" ]; then
    python3 -c "
conf_path = '$HYPR_CONFIG'
with open(conf_path, 'r') as f:
    lines = f.readlines()

new_lines = []
modified = False
has_mistbar = False

for line in lines:
    stripped = line.strip()
    if 'mistbar' in stripped and ('exec-once' in stripped or 'exec' in stripped):
        has_mistbar = True
        new_lines.append(line)
    elif stripped.startswith('exec-once') and 'waybar' in stripped:
        new_lines.append('# exec-once = waybar # Disabled by Mistbar installer\n')
        modified = True
    else:
        new_lines.append(line)

if not has_mistbar:
    new_lines.append('\n# Start Mistbar on desktop launch\nexec-once = mistbar start\n')
    modified = True

if modified:
    with open(conf_path, 'w') as f:
        f.writelines(new_lines)
" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Configured Mistbar in Hyprland config${NC}"
fi

# 6. PATH check
echo -e "${BLUE}[6/6] Verifying PATH...${NC}"
if echo "$PATH" | grep -q "$HOME/.local/bin"; then
    echo -e "${GREEN}  ✓ ~/.local/bin is in your PATH${NC}"
else
    echo -e "${RED}  ⚠ ~/.local/bin is NOT in your PATH${NC}"
    echo "  Add this to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
    echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

# If updating and bar is currently active, restart it smoothly
if [ "$IS_UPDATE" = true ]; then
    if command -v ags &>/dev/null && ags list 2>/dev/null | grep -q "$INSTANCE_NAME"; then
        echo ""
        echo -e "${BLUE}Restarting active Mistbar instance to apply updates...${NC}"
        "$BIN_TARGET" restart
    fi
fi

echo ""
if [ "$IS_UPDATE" = true ]; then
    echo -e "${GREEN}${BOLD}✓ Mistbar successfully updated!${NC}"
else
    echo -e "${GREEN}${BOLD}✓ Mistbar installation complete!${NC}"
fi

echo ""
echo "Usage:"
echo -e "  ${CYAN}mistbar start${NC}        Start the bar"
echo -e "  ${CYAN}mistbar stop${NC}         Stop the bar"
echo -e "  ${CYAN}mistbar restart${NC}      Restart the bar"
echo -e "  ${CYAN}mistbar status${NC}       Check status"
echo -e "  ${CYAN}mistbar --help${NC}       Show all commands"
echo ""
echo -e "To uninstall anytime, run:"
echo -e "  ${CYAN}./uninstall.sh${NC}"

#!/usr/bin/env bash
# ============================================================================
# Mistbar Uninstallation Script
# ============================================================================

set -euo pipefail

BIN_TARGET="$HOME/.local/bin/mistbar"
INSTANCE_NAME="mistbar"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "  ========================================"
echo "            Mistbar Uninstaller           "
echo "  ========================================"
echo -e "${NC}"

# 1. Stop Mistbar if running
echo -e "${BLUE}[1/4] Checking running instances...${NC}"
if command -v ags &>/dev/null && ags list 2>/dev/null | grep -q "$INSTANCE_NAME"; then
    echo -e "  Stopping active Mistbar instance..."
    ags quit -i "$INSTANCE_NAME" 2>/dev/null || true
    sleep 0.3
    echo -e "${GREEN}  ✓ Mistbar stopped${NC}"
else
    echo -e "${DIM}  No active Mistbar instance found.${NC}"
fi
pkill -f "ags run -d.*Mistbar" 2>/dev/null || true

# 2. Remove CLI symlink/binary
echo -e "${BLUE}[2/4] Removing binary from ~/.local/bin...${NC}"
if [ -L "$BIN_TARGET" ] || [ -f "$BIN_TARGET" ]; then
    rm -f "$BIN_TARGET"
    echo -e "${GREEN}  ✓ Removed $BIN_TARGET${NC}"
else
    echo -e "${DIM}  $BIN_TARGET was not found.${NC}"
fi

# 3. Remove universal XDG autostart
echo -e "${BLUE}[3/4] Removing XDG autostart desktop entry...${NC}"
AUTOSTART_FILE="$HOME/.config/autostart/mistbar.desktop"
if [ -f "$AUTOSTART_FILE" ]; then
    rm -f "$AUTOSTART_FILE"
    echo -e "${GREEN}  ✓ Removed $AUTOSTART_FILE${NC}"
else
    echo -e "${DIM}  XDG autostart file was not present.${NC}"
fi

# 4. Clean up compositor configs & restore previous bars
echo -e "${BLUE}[4/4] Cleaning compositor autostart configs...${NC}"

# 4a. Niri config cleanup
NIRI_CONFIG="$HOME/.config/niri/config.kdl"
if [ -f "$NIRI_CONFIG" ]; then
    python3 -c "
import re

kdl_path = '$NIRI_CONFIG'
with open(kdl_path, 'r') as f:
    content = f.read()

# Restore waybar if disabled by Mistbar
content = re.sub(r'//\s*spawn-at-startup\s+\"waybar\"\s+//\s*Disabled by Mistbar installer', 'spawn-at-startup \"waybar\"', content)

# Remove mistbar spawn-at-startup
content = re.sub(r'\n?// Start Mistbar on desktop launch\n?spawn-at-startup\s+\"mistbar\"\s+\"start\"\n?', '\n', content)
content = re.sub(r'spawn-at-startup\s+\"mistbar\"\s+\"start\"\n?', '', content)

# Remove mistbar layer-rule
layer_rule_pattern = r'\n?layer-rule\s*\{\s*match\s+namespace=\"mistbar\"[\s\S]*?\}\n?'
content = re.sub(layer_rule_pattern, '\n', content)

with open(kdl_path, 'w') as f:
    f.write(content)
" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Cleaned Niri configuration and restored previous bar defaults${NC}"
    if command -v niri &>/dev/null; then
        niri msg action load-config-file 2>/dev/null || true
    fi
fi

# 4b. Hyprland config cleanup
HYPR_CONFIG="$HOME/.config/hypr/hyprland.conf"
if [ -f "$HYPR_CONFIG" ]; then
    python3 -c "
import re
conf_path = '$HYPR_CONFIG'
with open(conf_path, 'r') as f:
    content = f.read()

content = re.sub(r'#\s*exec-once\s*=\s*waybar\s*#\s*Disabled by Mistbar installer', 'exec-once = waybar', content)
content = re.sub(r'\n?# Start Mistbar on desktop launch\n?exec-once\s*=\s*mistbar\s+start\n?', '\n', content)

with open(conf_path, 'w') as f:
    f.write(content)
" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Cleaned Hyprland configuration${NC}"
fi

echo ""
echo -e "${GREEN}${BOLD}✓ Mistbar has been successfully uninstalled.${NC}"
echo -e "${DIM}Note: Repository source files in this directory remain intact.${NC}"
echo -e "${DIM}To reinstall anytime, run: ./install.sh${NC}"

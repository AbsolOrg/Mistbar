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
echo "  ╔══════════════════════════════════════╗"
echo "  ║         🍏 Mistbar Uninstaller       ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# 1. Stop Mistbar if running
echo -e "${BLUE}[1/2] Checking running instances...${NC}"
if command -v ags &>/dev/null && ags list 2>/dev/null | grep -q "$INSTANCE_NAME"; then
    echo -e "  Stopping active Mistbar instance..."
    ags quit -i "$INSTANCE_NAME" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Mistbar stopped${NC}"
else
    echo -e "${DIM}  No active Mistbar instance found.${NC}"
fi

# 2. Remove CLI symlink/binary
echo -e "${BLUE}[2/2] Removing binary from ~/.local/bin...${NC}"
if [ -L "$BIN_TARGET" ] || [ -f "$BIN_TARGET" ]; then
    rm -f "$BIN_TARGET"
    echo -e "${GREEN}  ✓ Removed $BIN_TARGET${NC}"
else
    echo -e "${DIM}  $BIN_TARGET was not found.${NC}"
fi

echo ""
echo -e "${GREEN}${BOLD}✓ Mistbar has been successfully uninstalled.${NC}"
echo -e "${DIM}Note: Repository source files in this directory remain intact.${NC}"
echo -e "${DIM}To reinstall anytime, run: ./install.sh${NC}"

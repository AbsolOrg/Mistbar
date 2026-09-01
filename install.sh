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
echo -e "${BLUE}[1/4] Setting file permissions...${NC}"
chmod +x "$SCRIPT_DIR/mistbar" "$SCRIPT_DIR/install.sh" "$SCRIPT_DIR/uninstall.sh"
echo -e "${GREEN}  ✓ Scripts are executable${NC}"

# 2. Setup / Refresh symlink in ~/.local/bin
echo -e "${BLUE}[2/4] Linking binary to ~/.local/bin/mistbar...${NC}"
mkdir -p "$HOME/.local/bin"
ln -sf "$SCRIPT_DIR/mistbar" "$BIN_TARGET"
echo -e "${GREEN}  ✓ Symlink configured: $BIN_TARGET -> $SCRIPT_DIR/mistbar${NC}"

# 3. Ensure TypeScript type declarations are present
echo -e "${BLUE}[3/4] Checking TypeScript types...${NC}"
if [ ! -d "$SCRIPT_DIR/src/@girs" ]; then
    echo -e "  Generating TypeScript types with AGS..."
    ags types -d "$SCRIPT_DIR/src" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Types generated${NC}"
else
    echo -e "${GREEN}  ✓ Types are up to date${NC}"
fi

# 4. PATH check
echo -e "${BLUE}[4/4] Verifying PATH...${NC}"
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

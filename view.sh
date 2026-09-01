#!/usr/bin/env bash
# ============================================================================
# Mistbar Live Preview Script
# Run Mistbar temporarily without installing or modifying your system
# ============================================================================

set -euo pipefail

INSTANCE_NAME="mistbar"
CLEANUP_DIR=""

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

cleanup() {
    echo ""
    echo -e "${BLUE}Closing Mistbar preview...${NC}"
    if command -v ags &>/dev/null; then
        ags quit -i "$INSTANCE_NAME" 2>/dev/null || true
    fi

    if [ -n "$CLEANUP_DIR" ] && [ -d "$CLEANUP_DIR" ]; then
        rm -rf "$CLEANUP_DIR"
    fi
    echo -e "${GREEN}Preview session ended.${NC}"
}

trap cleanup EXIT INT TERM

echo -e "${CYAN}${BOLD}"
echo "  ========================================"
echo "          Mistbar Live Preview            "
echo "  ========================================"
echo -e "${NC}"

# Check for AGS 3
if ! command -v ags &>/dev/null; then
    echo -e "${RED}Error: AGS 3 (ags) is required to run Mistbar.${NC}"
    echo "Please install AGS 3 and try again."
    exit 1
fi

# Check for Wayland session
if [ "${XDG_SESSION_TYPE:-}" != "wayland" ]; then
    echo -e "${RED}Warning: Mistbar is designed for Wayland compositors.${NC}"
fi

# Determine source directory
SRC_DIR=""

if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
    SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
    SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"
    if [ -d "$SCRIPT_DIR/src" ]; then
        SRC_DIR="$SCRIPT_DIR/src"
    fi
fi

# If piped through curl/wget or not run from repo root
if [ -z "$SRC_DIR" ]; then
    echo -e "${BLUE}Fetching Mistbar for live preview...${NC}"
    CLEANUP_DIR="$(mktemp -d /tmp/mistbar-preview.XXXXXX)"
    git clone --depth 1 https://github.com/AbsolOrg/Mistbar.git "$CLEANUP_DIR" >/dev/null 2>&1
    SRC_DIR="$CLEANUP_DIR/src"
fi

# Generate types if missing in target
if [ ! -d "$SRC_DIR/@girs" ]; then
    echo -e "${BLUE}Generating types for preview...${NC}"
    ags types -d "$SRC_DIR" >/dev/null 2>&1 || true
fi

echo -e "${GREEN}Starting live preview...${NC}"
echo -e "${CYAN}Press Ctrl+C at any time to close the preview and exit.${NC}"
echo ""

# Run AGS in foreground
ags run -d "$SRC_DIR"

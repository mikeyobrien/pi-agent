#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
PI_DIR="$HOME/.pi/agent"

echo "Installing pi-agent configuration..."

# Create pi directory if needed
mkdir -p "$PI_DIR"

# Remove existing and create symlinks
rm -rf "$PI_DIR/extensions" "$PI_DIR/skills"
ln -sf "$REPO_DIR/extensions" "$PI_DIR/extensions"
ln -sf "$REPO_DIR/skills" "$PI_DIR/skills"

echo "✓ Symlinked extensions -> $PI_DIR/extensions"
echo "✓ Symlinked skills -> $PI_DIR/skills"

# Check for API keys
if [ -z "$BRAVE_API_KEY" ]; then
  echo ""
  echo "⚠ BRAVE_API_KEY not set. Add to ~/.bashrc:"
  echo '  export BRAVE_API_KEY="your-key"'
fi

echo ""
echo "Done! Run /reload in pi to load extensions."

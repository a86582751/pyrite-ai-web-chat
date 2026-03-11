#!/bin/bash
set -e

echo "🚀 Installing Pyrite AI Web Chat..."

# Configuration
REPO="a86582751/pyrite-ai-web-chat"
INSTALL_DIR="/opt/chat-tree"
SERVICE_NAME="chat-tree"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install Bun if not exists
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Get latest release
echo "⬇️  Downloading latest release..."
LATEST_URL=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep "browser_download_url.*chat-tree.zip" | cut -d '"' -f 4)

if [ -z "$LATEST_URL" ]; then
    echo "❌ Could not find release package"
    exit 1
fi

# Download and extract
cd /tmp
curl -L -o chat-tree.zip "$LATEST_URL"
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
unzip -o chat-tree.zip -d /opt/

# Install dependencies
cd "$INSTALL_DIR"
bun install --production

# Create data directory
mkdir -p "$INSTALL_DIR/data"
mkdir -p "$INSTALL_DIR/uploads"
chown -R admin:admin "$INSTALL_DIR"

# Install systemd service
cp "$INSTALL_DIR/deploy/chat-tree.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"

# Prompt for password
read -sp "Enter chat password (default: a86582751): " PASSWORD
echo
PASSWORD=${PASSWORD:-a86582751}

# Update service with password
sed -i "s/CHAT_PASSWORD=.*/CHAT_PASSWORD=$PASSWORD/" /etc/systemd/system/chat-tree.service
systemctl daemon-reload

# Start service
systemctl start "$SERVICE_NAME"

echo ""
echo "✅ Installation complete!"
echo "📍 URL: http://localhost:3333"
echo "🔑 Password: $PASSWORD"
echo ""
echo "Commands:"
echo "  sudo systemctl status $SERVICE_NAME"
echo "  sudo systemctl restart $SERVICE_NAME"
echo "  sudo systemctl stop $SERVICE_NAME"

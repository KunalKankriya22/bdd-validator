#!/bin/bash

# BC_Agents Production Deployment Script
# This script creates a production-ready package excluding development files

echo "=== BC_Agents Production Deployment Script ==="
echo "Creating production package..."

# Set variables
PROD_DIR="bc_agents_production"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="bc_agents_prod_${TIMESTAMP}.tar.gz"

# Clean up any existing production directory
if [ -d "$PROD_DIR" ]; then
    echo "Removing existing production directory..."
    rm -rf "$PROD_DIR"
fi

# Create production directory structure
echo "Creating production directory structure..."
mkdir -p "$PROD_DIR"
mkdir -p "$PROD_DIR/settings"
mkdir -p "$PROD_DIR/shared"
mkdir -p "$PROD_DIR/bconsiteagentapp"
mkdir -p "$PROD_DIR/bcoracleagentapp"
mkdir -p "$PROD_DIR/logs"
mkdir -p "$PROD_DIR/tmp"

# Copy essential files
echo "Copying production files..."

# Root level files
cp .env.prod "$PROD_DIR/"
cp .htaccess "$PROD_DIR/"
cp README.md "$PROD_DIR/"

# Application directories
cp -r settings/ "$PROD_DIR/"
cp -r shared/ "$PROD_DIR/"
cp -r bconsiteagentapp/ "$PROD_DIR/"
cp -r bcoracleagentapp/ "$PROD_DIR/"

# Set production environment in .htaccess
echo "Configuring production environment..."
sed -i 's/SetEnv APP_ENV .*/SetEnv APP_ENV prod/' "$PROD_DIR/.htaccess"

# Create .gitignore for production (if using git deployment)
cat > "$PROD_DIR/.gitignore" << 'EOF'
# Production .gitignore
logs/*.log
tmp/*
!logs/.gitkeep
!tmp/.gitkeep
.env.dev
.env.qa
docs/
tests/
apache_php_config/
EOF

# Create placeholder files to ensure directories exist
touch "$PROD_DIR/logs/.gitkeep"
touch "$PROD_DIR/tmp/.gitkeep"

# Set proper permissions
echo "Setting file permissions..."
chmod 644 "$PROD_DIR"/*.php 2>/dev/null || true
chmod 644 "$PROD_DIR"/.htaccess
chmod 600 "$PROD_DIR/.env.prod"
chmod 644 "$PROD_DIR/settings/app.ini.php"
chmod 644 "$PROD_DIR/shared/BCAgentCore.php"
chmod 644 "$PROD_DIR/bconsiteagentapp/index.php"
chmod 644 "$PROD_DIR/bcoracleagentapp/index.php"
chmod 755 "$PROD_DIR/logs"
chmod 755 "$PROD_DIR/tmp"

# Create deployment archive
echo "Creating deployment archive..."
tar -czf "$BACKUP_NAME" "$PROD_DIR"

# Display summary
echo ""
echo "=== Production Package Created ==="
echo "Directory: $PROD_DIR"
echo "Archive: $BACKUP_NAME"
echo ""
echo "Files included:"
find "$PROD_DIR" -type f | sort
echo ""
echo "Files excluded (not in production):"
echo "  - docs/ (documentation)"
echo "  - tests/ (test scripts)"
echo "  - .env.dev, .env.qa (development environments)"
echo "  - apache_php_config/ (server configuration)"
echo ""
echo "=== Deployment Instructions ==="
echo "1. Upload $BACKUP_NAME to your production server"
echo "2. Extract: tar -xzf $BACKUP_NAME"
echo "3. Move to web directory: sudo mv $PROD_DIR /var/www/html/cac"
echo "4. Set ownership: sudo chown -R www-data:www-data /var/www/html/cac"
echo "5. Update database credentials in /var/www/html/cac/.env.prod"
echo "6. Test the deployment"
echo ""
echo "Production package ready for deployment!"

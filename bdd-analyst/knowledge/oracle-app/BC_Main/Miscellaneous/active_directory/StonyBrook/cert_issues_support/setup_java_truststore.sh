#!/bin/bash
#
# Java Truststore Setup for Stony Brook LDAPS
# Imports SSL certificate into Java's cacerts truststore
#
# Prerequisites:
#   - Java JDK/JRE installed
#   - Certificate extracted (run setup_ldap_certificates.sh first)
#   - Administrator/root privileges (for modifying Java truststore)
#

set -e

# Configuration
LDAP_SERVER="ldaps.uhmc.sbuh.stonybrook.edu"
LDAP_PORT="636"
CERT_DIR="./certificates"
CERT_FILE="${CERT_DIR}/stonybrook-ldap-server.crt"
CERT_ALIAS="stonybrook-ldaps"

echo "=== Java Truststore Setup for LDAPS ==="
echo ""

# Find Java installation
if [ -n "$JAVA_HOME" ]; then
    JAVA_BIN="$JAVA_HOME/bin/java"
    KEYTOOL="$JAVA_HOME/bin/keytool"
    CACERTS="$JAVA_HOME/lib/security/cacerts"

    # Try jre/lib/security/cacerts for older Java versions
    if [ ! -f "$CACERTS" ]; then
        CACERTS="$JAVA_HOME/jre/lib/security/cacerts"
    fi
else
    # Try to find Java
    JAVA_BIN=$(which java 2>/dev/null || echo "")
    if [ -z "$JAVA_BIN" ]; then
        echo "ERROR: Java not found. Please install Java or set JAVA_HOME"
        exit 1
    fi

    # Find JAVA_HOME from java binary
    JAVA_HOME=$(dirname $(dirname $(readlink -f $JAVA_BIN 2>/dev/null || echo $JAVA_BIN)))
    KEYTOOL="$JAVA_HOME/bin/keytool"
    CACERTS="$JAVA_HOME/lib/security/cacerts"

    if [ ! -f "$CACERTS" ]; then
        CACERTS="$JAVA_HOME/jre/lib/security/cacerts"
    fi
fi

if [ ! -f "$KEYTOOL" ]; then
    echo "ERROR: keytool not found at: $KEYTOOL"
    exit 1
fi

if [ ! -f "$CACERTS" ]; then
    echo "ERROR: Java cacerts file not found"
    echo "Searched: $JAVA_HOME/lib/security/cacerts"
    echo "     and: $JAVA_HOME/jre/lib/security/cacerts"
    exit 1
fi

echo "Java Home: $JAVA_HOME"
echo "Keytool: $KEYTOOL"
echo "Cacerts: $CACERTS"
echo ""

# Create certificate directory if needed
mkdir -p "$CERT_DIR"

# Step 1: Download certificate from server
echo "[1/5] Downloading certificate from ${LDAP_SERVER}:${LDAP_PORT}..."

# Get the server certificate (not the full chain, just the server cert)
echo | openssl s_client -connect ${LDAP_SERVER}:${LDAP_PORT} 2>/dev/null | \
    openssl x509 -outform PEM > "${CERT_FILE}"

if [ ! -s "$CERT_FILE" ]; then
    echo "ERROR: Failed to download certificate"
    exit 1
fi

echo "   Certificate saved to: ${CERT_FILE}"

# Step 2: Display certificate information
echo ""
echo "[2/5] Certificate Details:"
openssl x509 -in "${CERT_FILE}" -noout -subject -issuer -dates
echo ""

# Step 3: Check if certificate already exists in truststore
echo "[3/5] Checking if certificate already exists in truststore..."

# Default password for Java cacerts is 'changeit'
KEYSTORE_PASS="${JAVA_KEYSTORE_PASSWORD:-changeit}"

if "$KEYTOOL" -list -keystore "$CACERTS" -storepass "$KEYSTORE_PASS" -alias "$CERT_ALIAS" >/dev/null 2>&1; then
    echo "   Certificate already exists with alias: $CERT_ALIAS"
    read -p "   Do you want to delete and re-import? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   Deleting existing certificate..."
        "$KEYTOOL" -delete -keystore "$CACERTS" -storepass "$KEYSTORE_PASS" -alias "$CERT_ALIAS"
    else
        echo "   Keeping existing certificate. Exiting."
        exit 0
    fi
fi

# Step 4: Backup cacerts
echo ""
echo "[4/5] Backing up cacerts..."
BACKUP_FILE="${CACERTS}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CACERTS" "$BACKUP_FILE"
echo "   Backup saved to: $BACKUP_FILE"

# Step 5: Import certificate
echo ""
echo "[5/5] Importing certificate into Java truststore..."
echo ""

# Import with -noprompt to avoid interactive confirmation
"$KEYTOOL" -import \
    -trustcacerts \
    -keystore "$CACERTS" \
    -storepass "$KEYSTORE_PASS" \
    -alias "$CERT_ALIAS" \
    -file "$CERT_FILE" \
    -noprompt

if [ $? -eq 0 ]; then
    echo ""
    echo "=== Import Successful ==="
else
    echo ""
    echo "=== Import Failed ==="
    echo "You may need to run this script with administrator/root privileges:"
    echo "  sudo ./setup_java_truststore.sh"
    exit 1
fi

# Verify import
echo ""
echo "Verifying certificate was imported..."
if "$KEYTOOL" -list -keystore "$CACERTS" -storepass "$KEYSTORE_PASS" -alias "$CERT_ALIAS" >/dev/null 2>&1; then
    echo "   ✓ Certificate verified in truststore"
else
    echo "   ✗ Certificate not found in truststore"
    exit 1
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Certificate imported with alias: $CERT_ALIAS"
echo "Truststore location: $CACERTS"
echo ""
echo "To verify the certificate:"
echo "  $KEYTOOL -list -keystore $CACERTS -storepass $KEYSTORE_PASS -alias $CERT_ALIAS"
echo ""
echo "To remove the certificate (if needed):"
echo "  $KEYTOOL -delete -keystore $CACERTS -storepass $KEYSTORE_PASS -alias $CERT_ALIAS"
echo ""
echo "Note: You may need to restart your Java application for changes to take effect."
echo ""

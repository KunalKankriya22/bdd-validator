#!/bin/bash
#
# Create Custom TrustStore for Oracle Java LDAPS
# This is the RECOMMENDED approach - more reliable than modifying system cacerts
#

set -e

# Configuration
LDAP_SERVER="ldaps.uhmc.sbuh.stonybrook.edu"
LDAP_PORT="636"
TRUSTSTORE_PASSWORD="oracle123"
CERT_ALIAS="stonybrook_ldaps"

echo "=== Creating Custom TrustStore for Oracle Java ==="
echo ""

# Validation
if [ -z "$ORACLE_HOME" ]; then
    echo "ERROR: ORACLE_HOME environment variable not set"
    exit 1
fi

echo "Oracle Home: $ORACLE_HOME"
echo ""

# Create truststore directory
TRUSTSTORE_DIR="$ORACLE_HOME/network/admin/truststore"
mkdir -p "$TRUSTSTORE_DIR"

echo "[1/4] TrustStore directory created: $TRUSTSTORE_DIR"
echo ""

# Download certificate
echo "[2/4] Downloading certificate from ${LDAP_SERVER}:${LDAP_PORT}..."
CERT_FILE="$TRUSTSTORE_DIR/stonybrook-ldaps.crt"

echo | openssl s_client -connect ${LDAP_SERVER}:${LDAP_PORT} 2>/dev/null | \
    openssl x509 -outform PEM > "$CERT_FILE"

if [ ! -s "$CERT_FILE" ]; then
    echo "ERROR: Failed to download certificate"
    exit 1
fi

echo "   Certificate saved to: $CERT_FILE"
echo ""
echo "   Certificate details:"
openssl x509 -in "$CERT_FILE" -noout -subject -issuer -dates | sed 's/^/   /'
echo ""

# Create custom truststore
echo "[3/4] Creating custom truststore..."
TRUSTSTORE_FILE="$TRUSTSTORE_DIR/custom_truststore.jks"

# Remove existing truststore if it exists
if [ -f "$TRUSTSTORE_FILE" ]; then
    BACKUP_FILE="${TRUSTSTORE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "   Backing up existing truststore to: $BACKUP_FILE"
    cp "$TRUSTSTORE_FILE" "$BACKUP_FILE"
    rm -f "$TRUSTSTORE_FILE"
fi

# Import certificate into new truststore
keytool -import \
    -trustcacerts \
    -keystore "$TRUSTSTORE_FILE" \
    -storepass "$TRUSTSTORE_PASSWORD" \
    -alias "$CERT_ALIAS" \
    -file "$CERT_FILE" \
    -noprompt

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create truststore"
    exit 1
fi

echo "   ✓ TrustStore created: $TRUSTSTORE_FILE"
echo ""

# Set permissions
chmod 644 "$TRUSTSTORE_FILE"
chmod 644 "$CERT_FILE"

echo "[4/4] Verifying truststore..."
keytool -list \
    -keystore "$TRUSTSTORE_FILE" \
    -storepass "$TRUSTSTORE_PASSWORD" \
    -alias "$CERT_ALIAS" | grep -A 3 "Alias name:"

echo ""
echo "=== TrustStore Creation Complete ==="
echo ""
echo "TrustStore File: $TRUSTSTORE_FILE"
echo "TrustStore Password: $TRUSTSTORE_PASSWORD"
echo "Certificate Alias: $CERT_ALIAS"
echo ""
echo "=== Next Steps ==="
echo ""
echo "1. Grant Java permissions in Oracle:"
echo "   sqlplus / as sysdba @fix_java_ssl_complete.sql"
echo ""
echo "2. Test the connection:"
echo "   Edit test_java_with_custom_truststore.sql and update:"
echo "     - Truststore path: $TRUSTSTORE_FILE"
echo "     - Truststore password: $TRUSTSTORE_PASSWORD"
echo "     - LDAP password: YOUR_ACTUAL_PASSWORD"
echo ""
echo "   Then run:"
echo "   sqlplus / as sysdba @test_java_with_custom_truststore.sql"
echo ""
echo "3. Update your Java stored procedure to use this truststore:"
echo ""
echo "   System.setProperty(\"javax.net.ssl.trustStore\", \"$TRUSTSTORE_FILE\");"
echo "   System.setProperty(\"javax.net.ssl.trustStorePassword\", \"$TRUSTSTORE_PASSWORD\");"
echo ""
echo "=== TrustStore Information ==="
echo ""
echo "To list all certificates in truststore:"
echo "  keytool -list -keystore $TRUSTSTORE_FILE -storepass $TRUSTSTORE_PASSWORD"
echo ""
echo "To delete the certificate (if needed):"
echo "  keytool -delete -keystore $TRUSTSTORE_FILE -storepass $TRUSTSTORE_PASSWORD -alias $CERT_ALIAS"
echo ""
echo "To add more certificates:"
echo "  keytool -import -trustcacerts -keystore $TRUSTSTORE_FILE -storepass $TRUSTSTORE_PASSWORD \\"
echo "    -alias new_alias -file /path/to/cert.crt -noprompt"
echo ""

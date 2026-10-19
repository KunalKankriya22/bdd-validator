#!/bin/bash
#
# LDAP Certificate Setup Script for Stony Brook LDAPS Connection
# This script extracts and configures SSL certificates for production LDAP access
#

set -e  # Exit on error

# Configuration
LDAP_SERVER="ldaps.uhmc.sbuh.stonybrook.edu"
LDAP_PORT="636"
CERT_DIR="./certificates"
CA_CERT_FILE="${CERT_DIR}/stonybrook-ldap-ca.pem"
FULL_CHAIN_FILE="${CERT_DIR}/stonybrook-ldap-fullchain.pem"

echo "=== LDAP Certificate Setup for ${LDAP_SERVER} ==="
echo ""

# Create certificate directory
mkdir -p "${CERT_DIR}"

# Step 1: Extract the full certificate chain
echo "[1/5] Extracting certificate chain from ${LDAP_SERVER}:${LDAP_PORT}..."
openssl s_client -connect ${LDAP_SERVER}:${LDAP_PORT} -showcerts </dev/null 2>/dev/null > "${CERT_DIR}/server_output.txt"

# Step 2: Extract individual certificates
echo "[2/5] Parsing certificates..."
csplit -s -z -f "${CERT_DIR}/cert-" -b "%02d.pem" "${CERT_DIR}/server_output.txt" '/-----BEGIN CERTIFICATE-----/' '{*}'

# Step 3: Find the root CA certificate (last in chain)
CERT_COUNT=$(ls ${CERT_DIR}/cert-*.pem 2>/dev/null | wc -l)
if [ $CERT_COUNT -eq 0 ]; then
    echo "ERROR: No certificates found!"
    exit 1
fi

echo "   Found ${CERT_COUNT} certificate(s) in chain"

# The last certificate is typically the root CA
LAST_CERT=$(ls ${CERT_DIR}/cert-*.pem | tail -1)
cp "${LAST_CERT}" "${CA_CERT_FILE}"

# Create full chain file (all certificates)
cat ${CERT_DIR}/cert-*.pem > "${FULL_CHAIN_FILE}"

# Step 4: Display certificate information
echo "[3/5] Certificate Details:"
echo ""
openssl x509 -in "${CA_CERT_FILE}" -noout -subject -issuer -dates
echo ""

# Step 5: Verify certificate
echo "[4/5] Verifying certificate..."
if openssl x509 -in "${CA_CERT_FILE}" -noout -text >/dev/null 2>&1; then
    echo "   Certificate is valid"
else
    echo "   WARNING: Certificate validation failed"
fi

# Step 6: Test LDAP connection with certificate
echo "[5/5] Testing LDAPS connection with certificate..."
echo ""

# Create temporary ldap.conf for testing
cat > "${CERT_DIR}/test_ldap.conf" <<EOF
TLS_CACERT ${PWD}/${CA_CERT_FILE}
TLS_REQCERT demand
EOF

echo "Test command (run this to verify):"
echo ""
echo "LDAPCONF=${PWD}/${CERT_DIR}/test_ldap.conf ldapsearch \\"
echo "  -H ldaps://${LDAP_SERVER}:${LDAP_PORT} \\"
echo "  -D \"CN=svc_bcldaps,OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu\" \\"
echo "  -W \\"
echo "  -b \"OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu\" \\"
echo "  -s sub \\"
echo "  \"(sAMAccountName=svc_bcldaps)\" \\"
echo "  dn"
echo ""

# Cleanup temporary files
rm -f ${CERT_DIR}/cert-*.pem ${CERT_DIR}/server_output.txt

echo "=== Setup Complete ==="
echo ""
echo "Certificate files created:"
echo "  - CA Certificate: ${CA_CERT_FILE}"
echo "  - Full Chain:     ${FULL_CHAIN_FILE}"
echo ""
echo "Next steps:"
echo "  1. Test the connection using the command above"
echo "  2. If successful, run setup_oracle_wallet.sh for Oracle integration"
echo "  3. Deploy ldap.conf to production systems"
echo ""

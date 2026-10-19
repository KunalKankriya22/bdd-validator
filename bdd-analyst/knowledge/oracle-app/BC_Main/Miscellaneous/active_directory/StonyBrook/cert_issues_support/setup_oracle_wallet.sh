#!/bin/bash
#
# Oracle Wallet Setup for LDAPS Integration
# Configures Oracle Database to trust Stony Brook LDAP server certificates
#
# Prerequisites:
#   - Oracle Database installed
#   - ORACLE_HOME environment variable set
#   - Certificate files extracted (run setup_ldap_certificates.sh first)
#

set -e

# Configuration
CERT_DIR="./certificates"
CA_CERT_FILE="${CERT_DIR}/stonybrook-ldap-ca.pem"
WALLET_DIR="${ORACLE_HOME}/network/admin/wallet"
WALLET_PASSWORD=""  # Auto-login wallet doesn't need password

echo "=== Oracle Wallet Setup for LDAPS ==="
echo ""

# Validation
if [ -z "$ORACLE_HOME" ]; then
    echo "ERROR: ORACLE_HOME environment variable not set"
    echo "Please set ORACLE_HOME to your Oracle installation directory"
    exit 1
fi

if [ ! -f "$CA_CERT_FILE" ]; then
    echo "ERROR: Certificate file not found: $CA_CERT_FILE"
    echo "Please run setup_ldap_certificates.sh first"
    exit 1
fi

echo "Oracle Home: $ORACLE_HOME"
echo "Wallet Location: $WALLET_DIR"
echo "Certificate: $CA_CERT_FILE"
echo ""

# Create wallet directory
echo "[1/6] Creating wallet directory..."
mkdir -p "$WALLET_DIR"
chmod 700 "$WALLET_DIR"

# Backup existing wallet if it exists
if [ -f "$WALLET_DIR/ewallet.p12" ]; then
    BACKUP_DIR="${WALLET_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "   Backing up existing wallet to: $BACKUP_DIR"
    cp -r "$WALLET_DIR" "$BACKUP_DIR"
fi

# Create auto-login wallet
echo "[2/6] Creating Oracle Wallet (auto-login)..."
orapki wallet create -wallet "$WALLET_DIR" -auto_login -pwd WalletPasswd123

# Add the CA certificate to wallet
echo "[3/6] Adding CA certificate to wallet..."
orapki wallet add -wallet "$WALLET_DIR" \
    -trusted_cert \
    -cert "$CA_CERT_FILE" \
    -pwd WalletPasswd123 \
    -auto_login

# Display wallet contents
echo "[4/6] Wallet contents:"
orapki wallet display -wallet "$WALLET_DIR"

# Create/Update sqlnet.ora
SQLNET_FILE="${ORACLE_HOME}/network/admin/sqlnet.ora"
SQLNET_BACKUP="${SQLNET_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo "[5/6] Configuring sqlnet.ora..."

if [ -f "$SQLNET_FILE" ]; then
    echo "   Backing up existing sqlnet.ora to: $SQLNET_BACKUP"
    cp "$SQLNET_FILE" "$SQLNET_BACKUP"
fi

# Check if WALLET_LOCATION already exists
if grep -q "WALLET_LOCATION" "$SQLNET_FILE" 2>/dev/null; then
    echo "   WARNING: WALLET_LOCATION already exists in sqlnet.ora"
    echo "   Please manually update the file at: $SQLNET_FILE"
    echo ""
    echo "   Add or update these lines:"
    cat <<EOF
WALLET_LOCATION =
  (SOURCE =
    (METHOD = FILE)
    (METHOD_DATA =
      (DIRECTORY = $WALLET_DIR)
    )
  )

SSL_CLIENT_AUTHENTICATION = FALSE
SSL_VERSION = 1.2
SSL_CIPHER_SUITES = (TLS_RSA_WITH_AES_256_CBC_SHA, TLS_RSA_WITH_AES_128_CBC_SHA)
EOF
else
    echo "   Adding WALLET_LOCATION to sqlnet.ora"
    cat >> "$SQLNET_FILE" <<EOF

# LDAPS Wallet Configuration - Added $(date)
WALLET_LOCATION =
  (SOURCE =
    (METHOD = FILE)
    (METHOD_DATA =
      (DIRECTORY = $WALLET_DIR)
    )
  )

SSL_CLIENT_AUTHENTICATION = FALSE
SSL_VERSION = 1.2
SSL_CIPHER_SUITES = (TLS_RSA_WITH_AES_256_CBC_SHA, TLS_RSA_WITH_AES_128_CBC_SHA)
EOF
fi

# Create test PL/SQL script
echo "[6/6] Creating test script..."
cat > "${PWD}/test_oracle_ldaps.sql" <<'EOF'
SET SERVEROUTPUT ON SIZE 1000000

DECLARE
    l_session       DBMS_LDAP.session;
    l_retval        PLS_INTEGER;
    l_attrs         DBMS_LDAP.STRING_COLLECTION;
    l_message       DBMS_LDAP.message;
    l_entry         DBMS_LDAP.message;
    l_attr_name     VARCHAR2(256);
    l_ber_element   DBMS_LDAP.ber_element;
    l_vals          DBMS_LDAP.STRING_COLLECTION;

    l_ldap_host     VARCHAR2(256) := 'ldaps.uhmc.sbuh.stonybrook.edu';
    l_ldap_port     PLS_INTEGER := 636;
    l_ldap_user     VARCHAR2(256) := 'CN=svc_bcldaps,OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu';
    l_ldap_passwd   VARCHAR2(256) := 'YOUR_PASSWORD_HERE';
    l_base          VARCHAR2(256) := 'OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu';
    l_filter        VARCHAR2(256) := '(sAMAccountName=svc_bcldaps)';
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== Testing LDAPS Connection ===');
    DBMS_OUTPUT.PUT_LINE('Server: ' || l_ldap_host || ':' || l_ldap_port);
    DBMS_OUTPUT.PUT_LINE('');

    -- Enable exceptions
    DBMS_LDAP.USE_EXCEPTION := TRUE;

    -- Initialize LDAP session (use 1 for LDAPS)
    DBMS_OUTPUT.PUT_LINE('[1/4] Initializing LDAPS session...');
    l_session := DBMS_LDAP.init(l_ldap_host, l_ldap_port);

    IF l_session IS NULL THEN
        RAISE_APPLICATION_ERROR(-20001, 'Failed to initialize LDAP session');
    END IF;
    DBMS_OUTPUT.PUT_LINE('   Session ID: ' || l_session);

    -- Open SSL connection
    DBMS_OUTPUT.PUT_LINE('[2/4] Opening SSL connection...');
    l_retval := DBMS_LDAP.open_ssl(
        ld       => l_session,
        sslwrl   => 'file:' || DBMS_LDAP.GET_WALLET_LOCATION,
        sslwalletpasswd => '',
        sslauth  => 1  -- 1-way SSL
    );

    IF l_retval != DBMS_LDAP.SUCCESS THEN
        RAISE_APPLICATION_ERROR(-20002, 'SSL connection failed: ' || l_retval);
    END IF;
    DBMS_OUTPUT.PUT_LINE('   SSL connection established');

    -- Bind to LDAP
    DBMS_OUTPUT.PUT_LINE('[3/4] Binding to LDAP server...');
    l_retval := DBMS_LDAP.simple_bind_s(l_session, l_ldap_user, l_ldap_passwd);

    IF l_retval != DBMS_LDAP.SUCCESS THEN
        RAISE_APPLICATION_ERROR(-20003, 'LDAP bind failed: ' || l_retval);
    END IF;
    DBMS_OUTPUT.PUT_LINE('   Bind successful');

    -- Search LDAP
    DBMS_OUTPUT.PUT_LINE('[4/4] Searching LDAP...');
    l_attrs(1) := 'dn';
    l_attrs(2) := 'sAMAccountName';
    l_attrs(3) := 'mail';

    l_retval := DBMS_LDAP.search_s(
        ld       => l_session,
        base     => l_base,
        scope    => DBMS_LDAP.SCOPE_SUBTREE,
        filter   => l_filter,
        attrs    => l_attrs,
        attronly => 0,
        res      => l_message
    );

    IF l_retval != DBMS_LDAP.SUCCESS THEN
        RAISE_APPLICATION_ERROR(-20004, 'LDAP search failed: ' || l_retval);
    END IF;

    DBMS_OUTPUT.PUT_LINE('   Search successful');
    DBMS_OUTPUT.PUT_LINE('   Entries found: ' || DBMS_LDAP.count_entries(l_session, l_message));
    DBMS_OUTPUT.PUT_LINE('');

    -- Process results
    l_entry := DBMS_LDAP.first_entry(l_session, l_message);

    WHILE l_entry IS NOT NULL LOOP
        DBMS_OUTPUT.PUT_LINE('Entry: ' || DBMS_LDAP.get_dn(l_session, l_entry));

        l_attr_name := DBMS_LDAP.first_attribute(l_session, l_entry, l_ber_element);

        WHILE l_attr_name IS NOT NULL LOOP
            l_vals := DBMS_LDAP.get_values(l_session, l_entry, l_attr_name);

            IF l_vals.COUNT > 0 THEN
                FOR i IN l_vals.FIRST .. l_vals.LAST LOOP
                    DBMS_OUTPUT.PUT_LINE('  ' || l_attr_name || ': ' || l_vals(i));
                END LOOP;
            END IF;

            l_attr_name := DBMS_LDAP.next_attribute(l_session, l_entry, l_ber_element);
        END LOOP;

        l_entry := DBMS_LDAP.next_entry(l_session, l_entry);
    END LOOP;

    -- Cleanup
    l_retval := DBMS_LDAP.unbind_s(l_session);

    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('=== Test Complete - SUCCESS ===');

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('');
        DBMS_OUTPUT.PUT_LINE('=== Test FAILED ===');
        DBMS_OUTPUT.PUT_LINE('Error Code: ' || SQLCODE);
        DBMS_OUTPUT.PUT_LINE('Error Message: ' || SQLERRM);
        DBMS_OUTPUT.PUT_LINE('Error Stack: ' || DBMS_UTILITY.FORMAT_ERROR_STACK);
        DBMS_OUTPUT.PUT_LINE('Error Backtrace: ' || DBMS_UTILITY.FORMAT_ERROR_BACKTRACE);

        -- Try to unbind
        BEGIN
            l_retval := DBMS_LDAP.unbind_s(l_session);
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END;

        RAISE;
END;
/
EOF

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Wallet created at: $WALLET_DIR"
echo "sqlnet.ora updated: $SQLNET_FILE"
echo ""
echo "Next steps:"
echo "  1. Restart Oracle listener and database (if needed)"
echo "  2. Edit test_oracle_ldaps.sql and set the password"
echo "  3. Run the test script:"
echo "     sqlplus / as sysdba @test_oracle_ldaps.sql"
echo ""
echo "To verify wallet contents:"
echo "  orapki wallet display -wallet $WALLET_DIR"
echo ""

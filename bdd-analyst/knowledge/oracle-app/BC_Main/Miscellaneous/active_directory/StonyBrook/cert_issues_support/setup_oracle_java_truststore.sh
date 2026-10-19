#!/bin/bash
#
# Oracle JVM Truststore Setup for LDAPS
# Imports SSL certificate into Oracle Database JVM for Java Stored Procedures
#
# Prerequisites:
#   - Oracle Database installed with Java enabled
#   - DBA privileges
#   - ORACLE_HOME environment variable set
#

set -e

# Configuration
LDAP_SERVER="ldaps.uhmc.sbuh.stonybrook.edu"
LDAP_PORT="636"
CERT_DIR="./certificates"
CERT_FILE="${CERT_DIR}/stonybrook-ldaps-oracle.crt"
CERT_ALIAS="stonybrook_ldaps"

echo "=== Oracle JVM Truststore Setup for LDAPS ==="
echo ""

# Validation
if [ -z "$ORACLE_HOME" ]; then
    echo "ERROR: ORACLE_HOME environment variable not set"
    echo "Please set ORACLE_HOME to your Oracle installation directory"
    exit 1
fi

if [ ! -d "$ORACLE_HOME" ]; then
    echo "ERROR: ORACLE_HOME directory does not exist: $ORACLE_HOME"
    exit 1
fi

echo "Oracle Home: $ORACLE_HOME"
echo ""

# Create certificate directory
mkdir -p "$CERT_DIR"

# Step 1: Download certificate
echo "[1/3] Downloading certificate from ${LDAP_SERVER}:${LDAP_PORT}..."

echo | openssl s_client -connect ${LDAP_SERVER}:${LDAP_PORT} -showcerts 2>/dev/null | \
    sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' > "${CERT_FILE}"

if [ ! -s "$CERT_FILE" ]; then
    echo "ERROR: Failed to download certificate"
    exit 1
fi

echo "   Certificate saved to: ${CERT_FILE}"
echo ""

# Step 2: Display certificate information
echo "[2/3] Certificate Details:"
openssl x509 -in "${CERT_FILE}" -noout -subject -issuer -dates
echo ""

# Step 3: Create SQL script to import certificate
echo "[3/3] Creating SQL import script..."

IMPORT_SCRIPT="${PWD}/import_cert_to_oracle_jvm.sql"

cat > "$IMPORT_SCRIPT" <<'EOSQL'
-- Import SSL Certificate into Oracle JVM Truststore
-- This script imports the LDAPS certificate for Java stored procedures

SET SERVEROUTPUT ON SIZE 1000000
SET FEEDBACK ON

DECLARE
    -- Certificate file path (will be replaced)
    l_cert_file     VARCHAR2(500) := 'CERT_FILE_PATH';
    l_cert_alias    VARCHAR2(100) := 'CERT_ALIAS_VALUE';

    l_cert_text     CLOB;
    l_bfile         BFILE;
    l_dest_offset   INTEGER := 1;
    l_src_offset    INTEGER := 1;
    l_lang_context  INTEGER := DBMS_LOB.DEFAULT_LANG_CTX;
    l_warning       INTEGER;

    -- For parsing certificate
    l_cert_start    INTEGER;
    l_cert_end      INTEGER;
    l_cert_data     VARCHAR2(32767);

BEGIN
    DBMS_OUTPUT.PUT_LINE('=== Importing Certificate into Oracle JVM ===');
    DBMS_OUTPUT.PUT_LINE('Certificate File: ' || l_cert_file);
    DBMS_OUTPUT.PUT_LINE('Certificate Alias: ' || l_cert_alias);
    DBMS_OUTPUT.PUT_LINE('');

    -- Method 1: Using DBMS_JAVA for Oracle 11g+
    BEGIN
        DBMS_OUTPUT.PUT_LINE('[Method 1] Attempting import using DBMS_JAVA...');

        -- Note: This requires the certificate to be accessible to Oracle
        -- You may need to create a directory object

        -- For this to work, we'll use an alternative method below
        DBMS_OUTPUT.PUT_LINE('   Using alternative SQL-based method...');

    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('   Method 1 not available: ' || SQLERRM);
    END;

    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('=== Manual Import Instructions ===');
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('Since Oracle JVM truststore requires OS-level access,');
    DBMS_OUTPUT.PUT_LINE('please run the following commands at the OS level:');
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('-- Using loadjava utility:');
    DBMS_OUTPUT.PUT_LINE('loadjava -user SYS@DBNAME -resolve -synonym -grant PUBLIC ' || l_cert_file);
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('-- Or import using keytool into Oracle JVM cacerts:');
    DBMS_OUTPUT.PUT_LINE('cd $ORACLE_HOME/javavm/lib/security');
    DBMS_OUTPUT.PUT_LINE('keytool -import -trustcacerts -keystore cacerts -storepass changeit \');
    DBMS_OUTPUT.PUT_LINE('  -alias ' || l_cert_alias || ' -file ' || l_cert_file || ' -noprompt');

END;
/

PROMPT
PROMPT Certificate import preparation complete.
PROMPT Please follow the manual import instructions above.
PROMPT
EOSQL

# Replace placeholders in SQL script
sed -i "s|CERT_FILE_PATH|${PWD}/${CERT_FILE}|g" "$IMPORT_SCRIPT"
sed -i "s|CERT_ALIAS_VALUE|${CERT_ALIAS}|g" "$IMPORT_SCRIPT"

echo ""
echo "=== SQL Script Created ==="
echo "Script location: $IMPORT_SCRIPT"
echo ""
echo "=== Next Steps ==="
echo ""
echo "Choose ONE of the following methods:"
echo ""
echo "Method 1: Using keytool (Recommended)"
echo "========================================="
echo "cd \$ORACLE_HOME/javavm/lib/security"
echo ""
echo "# Backup existing cacerts"
echo "cp cacerts cacerts.backup.\$(date +%Y%m%d)"
echo ""
echo "# Import certificate (default password is 'changeit')"
echo "keytool -import -trustcacerts -keystore cacerts -storepass changeit \\"
echo "  -alias ${CERT_ALIAS} \\"
echo "  -file ${PWD}/${CERT_FILE} \\"
echo "  -noprompt"
echo ""
echo "# Verify import"
echo "keytool -list -keystore cacerts -storepass changeit -alias ${CERT_ALIAS}"
echo ""
echo ""
echo "Method 2: Using Oracle Wallet (Alternative)"
echo "============================================="
echo "See setup_oracle_wallet.sh for wallet-based approach"
echo ""
echo ""
echo "Method 3: Grant permissions in database"
echo "========================================="
echo "After importing the certificate, grant permissions in SQL*Plus:"
echo ""
echo "sqlplus / as sysdba @grant_ssl_permissions.sql"
echo ""

# Create permissions grant script
GRANT_SCRIPT="${PWD}/grant_ssl_permissions.sql"

cat > "$GRANT_SCRIPT" <<'EOSQL'
-- Grant SSL/Socket permissions for Java stored procedures
-- Run as SYS or DBA

SET SERVEROUTPUT ON

BEGIN
    DBMS_OUTPUT.PUT_LINE('Granting Java permissions for LDAPS connection...');

    -- Grant socket permissions
    DBMS_JAVA.GRANT_PERMISSION(
        grantee      => 'PUBLIC',
        permission_type => 'SYS:java.net.SocketPermission',
        permission_name => 'ldaps.uhmc.sbuh.stonybrook.edu:636',
        permission_action => 'connect,resolve'
    );

    -- Grant SSL permissions
    DBMS_JAVA.GRANT_PERMISSION(
        grantee      => 'PUBLIC',
        permission_type => 'SYS:javax.net.ssl.SSLPermission',
        permission_name => 'setHostnameVerifier',
        permission_action => ''
    );

    -- Grant file read permission for truststore
    DBMS_JAVA.GRANT_PERMISSION(
        grantee      => 'PUBLIC',
        permission_type => 'SYS:java.io.FilePermission',
        permission_name => '<<ALL FILES>>',
        permission_action => 'read'
    );

    -- Grant property read permissions
    DBMS_JAVA.GRANT_PERMISSION(
        grantee      => 'PUBLIC',
        permission_type => 'SYS:java.util.PropertyPermission',
        permission_name => '*',
        permission_action => 'read,write'
    );

    COMMIT;

    DBMS_OUTPUT.PUT_LINE('Permissions granted successfully.');
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('To verify permissions:');
    DBMS_OUTPUT.PUT_LINE('SELECT * FROM USER_JAVA_POLICY WHERE grantee = ''PUBLIC'';');

END;
/

-- Display granted permissions
SELECT
    grantee,
    type_name,
    name,
    action,
    enabled
FROM DBA_JAVA_POLICY
WHERE grantee = 'PUBLIC'
ORDER BY type_name, name;

PROMPT
PROMPT Java permissions granted.
PROMPT You may need to restart your database for changes to take effect.
PROMPT
EOSQL

echo "Permission grant script created: $GRANT_SCRIPT"
echo ""
echo "=== Important Notes ==="
echo ""
echo "1. After importing the certificate, you MUST grant Java permissions"
echo "2. You may need to restart the Oracle database"
echo "3. Test your Java stored procedure after all changes"
echo ""

# Create test Java stored procedure
TEST_JAVA="${PWD}/test_java_ldaps.sql"

cat > "$TEST_JAVA" <<'EOSQL'
-- Test Java Stored Procedure for LDAPS Connection
-- This creates and tests a simple Java stored procedure

SET SERVEROUTPUT ON SIZE 1000000

-- Create Java source
CREATE OR REPLACE AND COMPILE JAVA SOURCE NAMED "LDAPSTest" AS
import java.util.*;
import javax.naming.*;
import javax.naming.directory.*;

public class LDAPSTest {
    public static String testConnection(
        String ldapUrl,
        String userDN,
        String password,
        String baseDN,
        String searchFilter
    ) {
        StringBuilder result = new StringBuilder();

        try {
            result.append("Connecting to: ").append(ldapUrl).append("\n");

            Hashtable<String, String> env = new Hashtable<>();
            env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
            env.put(Context.PROVIDER_URL, ldapUrl);
            env.put(Context.SECURITY_AUTHENTICATION, "simple");
            env.put(Context.SECURITY_PRINCIPAL, userDN);
            env.put(Context.SECURITY_CREDENTIALS, password);

            // SSL settings
            env.put(Context.SECURITY_PROTOCOL, "ssl");

            result.append("Initializing context...\n");
            DirContext ctx = new InitialDirContext(env);

            result.append("Connected successfully!\n");

            // Perform search
            result.append("Searching: ").append(searchFilter).append("\n");
            SearchControls searchControls = new SearchControls();
            searchControls.setSearchScope(SearchControls.SUBTREE_SCOPE);

            NamingEnumeration<SearchResult> results =
                ctx.search(baseDN, searchFilter, searchControls);

            int count = 0;
            while (results.hasMore()) {
                SearchResult searchResult = results.next();
                result.append("Found: ").append(searchResult.getName()).append("\n");
                count++;
            }

            result.append("Total entries found: ").append(count).append("\n");

            ctx.close();
            result.append("Connection closed.\n");

        } catch (Exception e) {
            result.append("ERROR: ").append(e.getClass().getName()).append("\n");
            result.append("Message: ").append(e.getMessage()).append("\n");

            Throwable cause = e.getCause();
            while (cause != null) {
                result.append("Caused by: ").append(cause.getClass().getName()).append("\n");
                result.append("  ").append(cause.getMessage()).append("\n");
                cause = cause.getCause();
            }

            // Print stack trace
            java.io.StringWriter sw = new java.io.StringWriter();
            java.io.PrintWriter pw = new java.io.PrintWriter(sw);
            e.printStackTrace(pw);
            result.append("\nStack trace:\n").append(sw.toString());
        }

        return result.toString();
    }
}
/

-- Create PL/SQL wrapper
CREATE OR REPLACE FUNCTION test_ldaps_connection(
    p_ldap_url      VARCHAR2,
    p_user_dn       VARCHAR2,
    p_password      VARCHAR2,
    p_base_dn       VARCHAR2,
    p_search_filter VARCHAR2
) RETURN VARCHAR2
AS LANGUAGE JAVA
NAME 'LDAPSTest.testConnection(java.lang.String, java.lang.String, java.lang.String, java.lang.String, java.lang.String) return java.lang.String';
/

-- Test the function
SET LONG 100000
SET PAGESIZE 0

SELECT test_ldaps_connection(
    'ldaps://ldaps.uhmc.sbuh.stonybrook.edu:636',
    'CN=svc_bcldaps,OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu',
    'YOUR_PASSWORD_HERE',
    'OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu',
    '(sAMAccountName=svc_bcldaps)'
) FROM DUAL;

PROMPT
PROMPT Test complete. Review output above for results.
PROMPT
EOSQL

echo "Test Java stored procedure created: $TEST_JAVA"
echo ""
echo "To test after setup:"
echo "1. Edit $TEST_JAVA and set the password"
echo "2. Run: sqlplus / as sysdba @$TEST_JAVA"
echo ""
echo "=== Setup Complete ==="

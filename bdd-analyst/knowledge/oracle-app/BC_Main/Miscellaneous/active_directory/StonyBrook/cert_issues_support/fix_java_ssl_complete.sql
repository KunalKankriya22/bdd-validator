-- Complete fix for Java SSL certificate issues in Oracle
-- This script uses a custom truststore approach which is more reliable

SET SERVEROUTPUT ON SIZE 1000000

DECLARE
    l_cert_data VARCHAR2(32767);
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== Setting up custom TrustStore for Java ===');
    DBMS_OUTPUT.PUT_LINE('');

    -- Method: Use DBMS_JAVA to set system properties
    -- This tells Java where to find the truststore

    DBMS_OUTPUT.PUT_LINE('[1/2] Setting Java system properties for custom truststore...');

    -- Note: You'll need to create the truststore first using keytool
    -- See instructions below

    DBMS_JAVA.set_output(2000);

    DBMS_OUTPUT.PUT_LINE('   Properties will be set in Java code');
    DBMS_OUTPUT.PUT_LINE('');

    DBMS_OUTPUT.PUT_LINE('[2/2] Granting necessary permissions...');

    -- Grant socket permission for LDAPS
    BEGIN
        DBMS_JAVA.GRANT_PERMISSION(
            grantee         => 'PUBLIC',
            permission_type => 'SYS:java.net.SocketPermission',
            permission_name => 'ldaps.uhmc.sbuh.stonybrook.edu:636',
            permission_action => 'connect,resolve'
        );
        DBMS_OUTPUT.PUT_LINE('   ✓ Socket permission granted');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -29532 THEN
                DBMS_OUTPUT.PUT_LINE('   ✓ Socket permission already exists');
            ELSE
                RAISE;
            END IF;
    END;

    -- Grant SSL permission
    BEGIN
        DBMS_JAVA.GRANT_PERMISSION(
            grantee         => 'PUBLIC',
            permission_type => 'SYS:javax.net.ssl.SSLPermission',
            permission_name => 'setHostnameVerifier',
            permission_action => ''
        );
        DBMS_OUTPUT.PUT_LINE('   ✓ SSL permission granted');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -29532 THEN
                DBMS_OUTPUT.PUT_LINE('   ✓ SSL permission already exists');
            ELSE
                RAISE;
            END IF;
    END;

    -- Grant property permissions (needed to set trustStore properties)
    BEGIN
        DBMS_JAVA.GRANT_PERMISSION(
            grantee         => 'PUBLIC',
            permission_type => 'SYS:java.util.PropertyPermission',
            permission_name => 'javax.net.ssl.trustStore',
            permission_action => 'read,write'
        );
        DBMS_OUTPUT.PUT_LINE('   ✓ Property permission (trustStore) granted');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -29532 THEN
                DBMS_OUTPUT.PUT_LINE('   ✓ Property permission already exists');
            ELSE
                RAISE;
            END IF;
    END;

    BEGIN
        DBMS_JAVA.GRANT_PERMISSION(
            grantee         => 'PUBLIC',
            permission_type => 'SYS:java.util.PropertyPermission',
            permission_name => 'javax.net.ssl.trustStorePassword',
            permission_action => 'read,write'
        );
        DBMS_OUTPUT.PUT_LINE('   ✓ Property permission (trustStorePassword) granted');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -29532 THEN
                DBMS_OUTPUT.PUT_LINE('   ✓ Property permission already exists');
            ELSE
                RAISE;
            END IF;
    END;

    BEGIN
        DBMS_JAVA.GRANT_PERMISSION(
            grantee         => 'PUBLIC',
            permission_type => 'SYS:java.util.PropertyPermission',
            permission_name => 'javax.net.ssl.trustStoreType',
            permission_action => 'read,write'
        );
        DBMS_OUTPUT.PUT_LINE('   ✓ Property permission (trustStoreType) granted');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -29532 THEN
                DBMS_OUTPUT.PUT_LINE('   ✓ Property permission already exists');
            ELSE
                RAISE;
            END IF;
    END;

    -- Grant file permission to read truststore
    BEGIN
        DBMS_JAVA.GRANT_PERMISSION(
            grantee         => 'PUBLIC',
            permission_type => 'SYS:java.io.FilePermission',
            permission_name => '<<ALL FILES>>',
            permission_action => 'read'
        );
        DBMS_OUTPUT.PUT_LINE('   ✓ File read permission granted');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -29532 THEN
                DBMS_OUTPUT.PUT_LINE('   ✓ File permission already exists');
            ELSE
                RAISE;
            END IF;
    END;

    COMMIT;

    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('=== Permissions Setup Complete ===');
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('Next steps:');
    DBMS_OUTPUT.PUT_LINE('1. Create custom truststore using the bash script provided');
    DBMS_OUTPUT.PUT_LINE('2. Update your Java stored procedure to use the custom truststore');
    DBMS_OUTPUT.PUT_LINE('3. Test the connection');

END;
/

PROMPT
PROMPT === Instructions for Custom TrustStore ===
PROMPT
PROMPT Run these OS commands:
PROMPT
PROMPT # Create directory for truststore
PROMPT mkdir -p $ORACLE_HOME/network/admin/truststore
PROMPT
PROMPT # Download certificate
PROMPT cd $ORACLE_HOME/network/admin/truststore
PROMPT echo | openssl s_client -connect ldaps.uhmc.sbuh.stonybrook.edu:636 2>/dev/null | \
PROMPT   openssl x509 -outform PEM > stonybrook-ldaps.crt
PROMPT
PROMPT # Create custom truststore
PROMPT keytool -import -trustcacerts \
PROMPT   -keystore custom_truststore.jks \
PROMPT   -storepass oracle123 \
PROMPT   -alias stonybrook_ldaps \
PROMPT   -file stonybrook-ldaps.crt \
PROMPT   -noprompt
PROMPT
PROMPT # Set permissions
PROMPT chmod 644 custom_truststore.jks
PROMPT
PROMPT Then update your Java code to use this truststore.
PROMPT See test_java_with_custom_truststore.sql for example.
PROMPT

-- Diagnostic script to identify Java SSL issues in Oracle
SET SERVEROUTPUT ON SIZE 1000000

BEGIN
    DBMS_OUTPUT.PUT_LINE('=== Oracle Java SSL Diagnostics ===');
    DBMS_OUTPUT.PUT_LINE('');

    -- Check Java version
    DBMS_OUTPUT.PUT_LINE('Java Version:');
    DBMS_OUTPUT.PUT_LINE(DBMS_JAVA.get_ojvm_property('java.version'));
    DBMS_OUTPUT.PUT_LINE('');

    -- Check Java home
    DBMS_OUTPUT.PUT_LINE('Java Home:');
    DBMS_OUTPUT.PUT_LINE(DBMS_JAVA.get_ojvm_property('java.home'));
    DBMS_OUTPUT.PUT_LINE('');

    -- Check trustStore location
    DBMS_OUTPUT.PUT_LINE('Default TrustStore:');
    DBMS_OUTPUT.PUT_LINE(NVL(DBMS_JAVA.get_ojvm_property('javax.net.ssl.trustStore'), 'Not set (using default)'));
    DBMS_OUTPUT.PUT_LINE('');

    -- Check trustStoreType
    DBMS_OUTPUT.PUT_LINE('TrustStore Type:');
    DBMS_OUTPUT.PUT_LINE(NVL(DBMS_JAVA.get_ojvm_property('javax.net.ssl.trustStoreType'), 'JKS (default)'));
    DBMS_OUTPUT.PUT_LINE('');

    DBMS_OUTPUT.PUT_LINE('=== Java Permissions Check ===');
    DBMS_OUTPUT.PUT_LINE('');

    -- This will be in next section

END;
/

-- Check granted permissions
SELECT
    grantee,
    type_name,
    name,
    action,
    enabled
FROM DBA_JAVA_POLICY
WHERE grantee IN ('PUBLIC', USER)
  AND (type_name LIKE '%Socket%'
       OR type_name LIKE '%SSL%'
       OR type_name LIKE '%File%'
       OR type_name LIKE '%Property%')
ORDER BY type_name, name;

PROMPT
PROMPT === Recommendations ===
PROMPT
PROMPT 1. Verify the cacerts file you modified matches the Java home shown above
PROMPT 2. Check if permissions are granted (see query results)
PROMPT 3. If using custom truststore, ensure path is absolute and accessible
PROMPT

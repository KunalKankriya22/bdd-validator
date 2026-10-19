-- Test Java LDAPS with Custom TrustStore
-- This approach is more reliable than modifying system cacerts

SET SERVEROUTPUT ON SIZE 1000000

CREATE OR REPLACE AND COMPILE JAVA SOURCE NAMED "LDAPSCustomTrustStore" AS
import java.util.*;
import javax.naming.*;
import javax.naming.directory.*;

public class LDAPSCustomTrustStore {

    public static String testConnection(
        String trustStorePath,
        String trustStorePassword,
        String ldapUrl,
        String userDN,
        String password,
        String baseDN,
        String searchFilter
    ) {
        StringBuilder result = new StringBuilder();

        try {
            result.append("=== LDAPS Connection Test with Custom TrustStore ===\n");
            result.append("TrustStore: ").append(trustStorePath).append("\n");
            result.append("LDAP URL: ").append(ldapUrl).append("\n\n");

            // Set custom truststore
            if (trustStorePath != null && !trustStorePath.isEmpty()) {
                System.setProperty("javax.net.ssl.trustStore", trustStorePath);
                System.setProperty("javax.net.ssl.trustStorePassword", trustStorePassword);
                System.setProperty("javax.net.ssl.trustStoreType", "JKS");
                result.append("[1/4] Custom truststore configured\n");
            } else {
                result.append("[1/4] Using default truststore\n");
            }

            // Enable SSL debugging (comment out in production)
            // System.setProperty("javax.net.debug", "ssl,handshake");

            result.append("[2/4] Initializing LDAP context...\n");

            Hashtable<String, String> env = new Hashtable<>();
            env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
            env.put(Context.PROVIDER_URL, ldapUrl);
            env.put(Context.SECURITY_AUTHENTICATION, "simple");
            env.put(Context.SECURITY_PRINCIPAL, userDN);
            env.put(Context.SECURITY_CREDENTIALS, password);
            env.put(Context.SECURITY_PROTOCOL, "ssl");

            // Connection timeout (5 seconds)
            env.put("com.sun.jndi.ldap.connect.timeout", "5000");
            env.put("com.sun.jndi.ldap.read.timeout", "10000");

            DirContext ctx = new InitialDirContext(env);
            result.append("   ✓ Context created successfully\n\n");

            result.append("[3/4] Binding to LDAP server...\n");
            result.append("   ✓ Bind successful\n\n");

            result.append("[4/4] Performing search: ").append(searchFilter).append("\n");

            SearchControls searchControls = new SearchControls();
            searchControls.setSearchScope(SearchControls.SUBTREE_SCOPE);
            searchControls.setReturningAttributes(new String[]{"dn", "sAMAccountName", "mail", "cn"});
            searchControls.setCountLimit(10);

            NamingEnumeration<SearchResult> results =
                ctx.search(baseDN, searchFilter, searchControls);

            int count = 0;
            while (results.hasMore()) {
                SearchResult searchResult = results.next();
                result.append("\n  Entry ").append(++count).append(":\n");
                result.append("    DN: ").append(searchResult.getNameInNamespace()).append("\n");

                Attributes attrs = searchResult.getAttributes();
                NamingEnumeration<? extends Attribute> allAttrs = attrs.getAll();

                while (allAttrs.hasMore()) {
                    Attribute attr = allAttrs.next();
                    result.append("    ").append(attr.getID()).append(": ");
                    result.append(attr.get()).append("\n");
                }
            }

            result.append("\n   ✓ Search complete. Total entries found: ").append(count).append("\n");

            ctx.close();
            result.append("\n=== Test SUCCESSFUL ===\n");

        } catch (NamingException e) {
            result.append("\n=== Test FAILED ===\n");
            result.append("Error Type: ").append(e.getClass().getName()).append("\n");
            result.append("Error Message: ").append(e.getMessage()).append("\n\n");

            if (e.getRootCause() != null) {
                result.append("Root Cause: ").append(e.getRootCause().getClass().getName()).append("\n");
                result.append("Root Message: ").append(e.getRootCause().getMessage()).append("\n\n");

                // Check for SSL-specific errors
                if (e.getRootCause() instanceof javax.net.ssl.SSLHandshakeException) {
                    result.append("\n*** SSL HANDSHAKE ERROR ***\n");
                    result.append("This usually means:\n");
                    result.append("1. Certificate not in truststore\n");
                    result.append("2. TrustStore path is incorrect\n");
                    result.append("3. TrustStore password is incorrect\n");
                    result.append("4. Certificate has expired\n\n");

                    // Get more details from cause chain
                    Throwable cause = e.getRootCause().getCause();
                    while (cause != null) {
                        result.append("Caused by: ").append(cause.getClass().getName()).append("\n");
                        result.append("  ").append(cause.getMessage()).append("\n");
                        cause = cause.getCause();
                    }
                }
            }

            // Print stack trace for debugging
            java.io.StringWriter sw = new java.io.StringWriter();
            java.io.PrintWriter pw = new java.io.PrintWriter(sw);
            e.printStackTrace(pw);
            result.append("\nFull Stack Trace:\n").append(sw.toString());

        } catch (Exception e) {
            result.append("\n=== Unexpected Error ===\n");
            result.append("Error: ").append(e.getClass().getName()).append("\n");
            result.append("Message: ").append(e.getMessage()).append("\n");

            java.io.StringWriter sw = new java.io.StringWriter();
            java.io.PrintWriter pw = new java.io.PrintWriter(sw);
            e.printStackTrace(pw);
            result.append("\nStack Trace:\n").append(sw.toString());
        }

        return result.toString();
    }
}
/

-- Create PL/SQL wrapper
CREATE OR REPLACE FUNCTION test_ldaps_custom_truststore(
    p_truststore_path   VARCHAR2,
    p_truststore_pwd    VARCHAR2,
    p_ldap_url          VARCHAR2,
    p_user_dn           VARCHAR2,
    p_password          VARCHAR2,
    p_base_dn           VARCHAR2,
    p_search_filter     VARCHAR2
) RETURN VARCHAR2
AS LANGUAGE JAVA
NAME 'LDAPSCustomTrustStore.testConnection(
    java.lang.String,
    java.lang.String,
    java.lang.String,
    java.lang.String,
    java.lang.String,
    java.lang.String,
    java.lang.String
) return java.lang.String';
/

-- Test with custom truststore
SET LONG 100000
SET PAGESIZE 0
SET LINESIZE 200

PROMPT
PROMPT === Testing LDAPS with Custom TrustStore ===
PROMPT
PROMPT UPDATE THE FOLLOWING VALUES BEFORE RUNNING:
PROMPT   - Truststore path
PROMPT   - Password for service account
PROMPT

SELECT test_ldaps_custom_truststore(
    '/path/to/oracle/home/network/admin/truststore/custom_truststore.jks',  -- Update this path
    'oracle123',                                                              -- Truststore password
    'ldaps://ldaps.uhmc.sbuh.stonybrook.edu:636',
    'CN=svc_bcldaps,OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu',
    'YOUR_PASSWORD_HERE',                                                     -- Update this password
    'OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu',
    '(sAMAccountName=svc_bcldaps)'
) AS test_result
FROM DUAL;

PROMPT
PROMPT === Test Complete ===
PROMPT
PROMPT If you see "Test SUCCESSFUL", the certificate and truststore are working correctly.
PROMPT If you see "SSL HANDSHAKE ERROR", check:
PROMPT   1. Truststore path is absolute and accessible to Oracle
PROMPT   2. Truststore password is correct
PROMPT   3. Certificate was imported successfully
PROMPT

-- Alternative test without custom truststore (uses default)
PROMPT
PROMPT To test with default Oracle JVM truststore, run:
PROMPT
PROMPT SELECT test_ldaps_custom_truststore(
PROMPT     NULL,  -- Use default truststore
PROMPT     NULL,
PROMPT     'ldaps://ldaps.uhmc.sbuh.stonybrook.edu:636',
PROMPT     'CN=svc_bcldaps,OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu',
PROMPT     'YOUR_PASSWORD_HERE',
PROMPT     'OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu',
PROMPT     '(sAMAccountName=svc_bcldaps)'
PROMPT ) FROM DUAL;
PROMPT

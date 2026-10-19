CREATE OR REPLACE AND COMPILE JAVA SOURCE NAMED JLdap AS

import javax.naming.*;
import javax.naming.directory.*;
import java.util.Hashtable;
import java.util.Properties;
/**
 * Java LDAP Package 
 * 01/09/2024
 */
class JLdap {

    public static String performAuthentication(String serviceUserDN,
                                               String serviceUserPassword,
                                               String userIdentifier,
                                               String userPassword,
                                               String identifyingAttribute,
                                               String userBase,
                                               String ldapUrl) {

        // first create the service context
        DirContext serviceCtx = null;
        DirContext authCtx = null;

        String returnMsg = null;

        try {
            // Configure custom truststore for SSL/TLS certificate validation
            // Update this path to match your Oracle installation
            String trustStorePath = System.getenv("ORACLE_HOME") + "/network/admin/truststore/custom_truststore.jks";
            System.setProperty("javax.net.ssl.trustStore", trustStorePath);
            System.setProperty("javax.net.ssl.trustStorePassword", "oracle123");
            System.setProperty("javax.net.ssl.trustStoreType", "JKS");

            // use service user to authenticate.
            Properties serviceEnv = new Properties();
            serviceEnv.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
            serviceEnv.put(Context.PROVIDER_URL, ldapUrl);
            serviceEnv.put(Context.SECURITY_PROTOCOL, "ssl");
            serviceEnv.put(Context.SECURITY_AUTHENTICATION, "simple");
            serviceEnv.put(Context.SECURITY_PRINCIPAL, serviceUserDN);
            serviceEnv.put(Context.SECURITY_CREDENTIALS, serviceUserPassword);
            
            serviceCtx = new InitialDirContext(serviceEnv);

            // we don't need all attributes, just let it get the identifying one
            String[] attributeFilter = { identifyingAttribute };
            SearchControls sc = new SearchControls();
            sc.setReturningAttributes(attributeFilter);
            sc.setSearchScope(SearchControls.SUBTREE_SCOPE);
    
            // use a search filter to find only the user we want to authenticate
            String searchFilter = "(" + identifyingAttribute + "=" + userIdentifier + ")";            
            NamingEnumeration<SearchResult> results = serviceCtx.search(userBase, searchFilter, sc);            
            returnMsg = "NOTFOUND";
            if (results.hasMore()) {
                // get the users DN (distinguishedName) from the result
                SearchResult result = results.next();
                String distinguishedName = result.getNameInNamespace();
    
                // attempt another authentication, now with the user
                Properties authEnv = new Properties();
                authEnv.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
                authEnv.put(Context.PROVIDER_URL, ldapUrl);
                authEnv.put(Context.SECURITY_PROTOCOL, "ssl");
                authEnv.put(Context.SECURITY_AUTHENTICATION, "simple");
                authEnv.put(Context.SECURITY_PRINCIPAL, distinguishedName);
                authEnv.put(Context.SECURITY_CREDENTIALS, userPassword);
                authCtx = new InitialDirContext(authEnv);
    
                System.out.println("Authentication successful");
                returnMsg = "SUCCESS";
            }            
        } catch (Exception e ) {
            System.out.println ( "LDAP Connection: FAILED" );
            System.out.println (e.toString());
            e.printStackTrace ( );
            returnMsg = e.toString();
        } finally {
            if (serviceCtx != null) {
                try {
                    serviceCtx.close();
                    System.out.println("Closed Service Ctx");
                } catch (NamingException e) {
                    e.printStackTrace();
                }
            }
            
            if (authCtx != null) {
                try {
                    authCtx.close();
                    System.out.println("Closed Auth ctx");
                } catch (NamingException e) {
                    e.printStackTrace();
                }
            }
            
            return returnMsg;            
        }   
    }
};


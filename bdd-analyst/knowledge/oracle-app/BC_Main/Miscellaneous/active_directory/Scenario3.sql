DECLARE
    l_encrypted_raw RAW(2048);
BEGIN
    /**
    * Update the configuration settings for the Active Directory connection.
    * 
    * 
    * Parameters:
    * - ad_host: The hostname or IP address of the Active Directory server.
    * - ad_port: The port number for the Active Directory server.
    * - ad_user_domain: The domain name for the Active Directory user.
    * - ad_use_svc_acct: Flag indicating whether to use a service account for authentication.
    * - ad_use_ssl: Flag indicating whether to use SSL for the connection.
    * - ad_svc_userdn: The distinguished name (DN) of the service account user.
    * - ad_svc_pwd: The password for the service account user.
    * - ad_search_filter: The search filter to use when querying the Active Directory.
    * - ad_search_base: The base DN for the search operation.
    * - ad_userid_attrib: The attribute name for the user ID in the Active Directory.
    */    
    UPDATE active_directory_config
    SET
        ad_host             = 'ldaps://bbak-dc3.bbak.org:686', -- Modify based on client's environment.
        ad_port             = NULL,
        ad_user_domain      = 'bbak', -- Modify based on client's environment. Can be NULL or a domain name.
        ad_use_svc_acct     = 'Y',
        ad_use_ssl          = 'Y',
        ad_svc_userdn       = 'CN=Wellsky LDAP,OU=Service and Vendor Accounts,OU=Users,OU=BBAK Anchorage,DC=BBAK,DC=ORG', -- Modify based on client's environment.
        ad_search_filter    = '&(objectCategory=user)(sAMAccountName=<ADUSERID>)',
        ad_search_base      = 'OU=Users,OU=BBAK Anchorage,DC=BBAK,DC=ORG',  -- Modify based on client's environment.
        ad_userid_attrib    = 'CN';

    l_encrypted_raw := dbms_crypto.encrypt(
                        src => utl_raw.cast_to_raw('password'), -- Modify based on client's password.
                        typ => dbms_crypto.des_cbc_pkcs5, 
                        key => utl_raw.cast_to_raw('idemeraw'));

    UPDATE active_directory_config
    SET
        ad_svc_pwd = l_encrypted_raw;

    UPDATE lt_application_config
    SET
        ad_enabled = 'Y',
        ad_server = NULL,
        ad_port = NULL,
        ad_domain = NULL;
END;


BEGIN
    /**
     * Grants permission to the specified users to establish a socket connection and resolve the hostname 'bbak-dc3.bbak.org' on port 686.
     * 
     * @param user1 The first user to grant permission to.
     * @param user2 The second user to grant permission to.
     */
    dbms_java.grant_permission( 'UTIL', 'SYS:java.net.SocketPermission', 'bbak-dc3.bbak.org:686', 'connect,resolve' ); -- Modify host name and port number based on client's environment.
    dbms_java.grant_permission( 'DBADMN', 'SYS:java.net.SocketPermission', 'bbak-dc3.bbak.org:686', 'connect,resolve' ); -- Modify host name and port number based on client's environment.
END;
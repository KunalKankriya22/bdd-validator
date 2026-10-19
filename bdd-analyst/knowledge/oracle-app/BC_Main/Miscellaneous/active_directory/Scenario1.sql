    
/**
 * This code snippet appends a host access control entry (ACE) to the network access control list (ACL) in the Oracle database.
 * The ACE allows the 'util' principal to have privileges for the 'http' and 'connect' services.
 * The ACE is added for the host 'bbak-dc3.bbak.org' with no port restrictions.
 */
BEGIN
    dbms_network_acl_admin.append_host_ace(
                    host => 'bbak-dc3.bbak.org',  -- Modify based on client's environment.
                    lower_port => NULL, 
                    upper_port => NULL, 
                    ace => xs$ace_type(privilege_list => xs$name_list('http', 'connect'), 
                    principal_name => 'util', 
                    principal_type => xs_acl.ptype_db));
END;


/**
 * This code snippet appends a host access control entry (ACE) to the network access control list (ACL) in the Oracle database.
 * The ACE allows the 'DBADMN' principal to have privileges for the 'http' and 'connect' services.
 * The ACE is added for the host 'bbak-dc3.bbak.org' with no port restrictions.
 */
BEGIN
    dbms_network_acl_admin.append_host_ace(
                    host => 'bbak-dc3.bbak.org',  -- Modify based on client's environment.
                    lower_port => NULL, 
                    upper_port => NULL, 
                    ace => xs$ace_type(privilege_list => xs$name_list('http', 'connect'), 
                    principal_name => 'dbadmn', 
                    principal_type => xs_acl.ptype_db));
END;



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
    ad_host             = 'bbak-dc3.bbak.org',  -- Modify based on client's environment.
    ad_port             = '389',
    ad_user_domain      = 'bbak',               -- Modify based on client's environment. Can be NULL or a domain name.
    ad_use_svc_acct     = 'N',
    ad_use_ssl          = 'N',
    ad_svc_user         = NULL,
    ad_svc_userdn       = NULL,
    ad_svc_pwd          = NULL,
    ad_search_filter    = NULL,
    ad_search_base      = NULL,
    ad_userid_attrib    = NULL;
    
/*
    Description:
    This SQL script updates the lt_application_config table by setting the ad_enabled column to 'Y'
    and resetting the ad_server, ad_port, and ad_domain columns to NULL.
*/
UPDATE lt_application_config
SET
    ad_enabled = 'Y',
    ad_server = NULL,
    ad_port = NULL,
    ad_domain = NULL;    
SELECT ad_enabled, ad_server, ad_port, ad_domain FROM lt_application_config;

SELECT * FROM active_directory_config;


-- For ldapsearch realated - check ldapsearch.txt

-- To check java socket permissions if SSL is used.
SELECT * FROM user_java_policy where type_name like '%Socket%';

-- To check NETWORK ACL Permissions.
SELECT HOST,
       LOWER_PORT,
       UPPER_PORT,
       ACL,
       ACLID,
       ACL_OWNER
FROM   dba_host_acls
ORDER BY host;
 

SELECT host,
       lower_port,
       upper_port,
       ace_order,
       TO_CHAR(start_date, 'DD-MON-YYYY') AS start_date,
       TO_CHAR(end_date, 'DD-MON-YYYY') AS end_date,
       grant_type,
       inverted_principal,
       principal,
       principal_type,
       privilege
FROM   dba_host_aces
ORDER BY host, ace_order;


BEGIN
    dbms_java.grant_permission( 'UTIL', 'SYS:java.net.SocketPermission', 'ldap://sflmdc6.sanfordhealth.org:389', 'connect,resolve' );
    dbms_java.grant_permission( 'UTIL', 'SYS:java.net.SocketPermission', 'ldap://sflmdc6.sanfordhealth.org:389', 'connect,resolve' ); 
    dbms_java.grant_permission( 'DBADMN', 'SYS:java.net.SocketPermission', 'ldap://sflmdc6.sanfordhealth.org:389', 'connect,resolve' );
    dbms_java.grant_permission( 'DBADMN', 'SYS:java.net.SocketPermission', 'ldap://sflmdc6.sanfordhealth.org:389', 'connect,resolve' );        
END;



--------------- Create below NETWORK ACL's, update Database Server's IP & HOSTNAME
 
BEGIN
DBMS_NETWORK_ACL_ADMIN.append_host_ace (
host       => '10.10.10.10',
lower_port => null,
upper_port => null,
ace        => xs$ace_type(privilege_list => xs$name_list('http', 'connect'),
principal_name => 'util',
principal_type => xs_acl.ptype_db));
END;
/
 
BEGIN
DBMS_NETWORK_ACL_ADMIN.append_host_ace (
host       => 'ltrndol8401',
lower_port => null,
upper_port => null,
ace        => xs$ace_type(privilege_list => xs$name_list('http', 'connect'),
principal_name => 'util',
principal_type => xs_acl.ptype_db));
END;
/

-- To remove NETWORK ACL Permissions.
BEGIN
  DBMS_NETWORK_ACL_ADMIN.remove_host_ace (
    host             => 'bbak-dc3.bbak.org',
    lower_port       => null,
    upper_port       => null,
    ace              => xs$ace_type(privilege_list => xs$name_list('http',  'connect'),
                                    principal_name => 'util',
                                    principal_type => xs_acl.ptype_db),
    remove_empty_acl => TRUE);
END;
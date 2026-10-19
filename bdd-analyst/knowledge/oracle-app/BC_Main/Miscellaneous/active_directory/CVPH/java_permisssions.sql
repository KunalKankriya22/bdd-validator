BEGIN
    /**
     * Grants permission to the specified users to establish a socket connection and resolve the hostname ON port.
     * 
     * @param user1 The first user to grant permission to.
     * @param user2 The second user to grant permission to.
     */
    dbms_java.grant_permission( 'UTIL', 'SYS:java.net.SocketPermission', 'ldaps.aaddsuvmhealth.org:636', 'connect,resolve' ); -- Modify host name and port number based on client's environment.
    dbms_java.grant_permission( 'DBADMN', 'SYS:java.net.SocketPermission', 'ldaps.aaddsuvmhealth.org:636', 'connect,resolve' ); -- Modify host name and port number based on client's environment.     
    dbms_java.grant_permission( 'UTIL', 'SYS:java.net.SocketPermission', '52.151.244.90:636', 'connect,resolve' ); -- Modify host name and port number based on client's environment.
    dbms_java.grant_permission( 'DBADMN', 'SYS:java.net.SocketPermission', '52.151.244.90:636', 'connect,resolve' ); -- Modify host name and port number based on client's environment.
END;

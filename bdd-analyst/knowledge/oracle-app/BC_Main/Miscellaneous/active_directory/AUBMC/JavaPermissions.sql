BEGIN
    dbms_java.grant_permission( 'UTIL', 'SYS:java.io.FilePermission', '/usr/bin/ldapsearch', 'execute' );
END;

BEGIN
    dbms_java.grant_permission( 'DBADMN', 'SYS:java.io.FilePermission', '/usr/bin/ldapsearch', 'execute' );
END;


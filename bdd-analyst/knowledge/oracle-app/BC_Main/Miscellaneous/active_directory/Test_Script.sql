/**
 * This code block is a PL/SQL script that performs LDAP authentication using the lt_ldap_interface package.
 */
set serveroutput on;
DECLARE
    lv_user_in VARCHAR2(1000) := 'wellskylap'; -- Modify based on client's environment.
    lv_pwd_in  VARCHAR2(1000) := 'password';   -- Modify based on client's environment.
    lv_status  VARCHAR2(2000);
BEGIN
    lv_status := lt_ldap_interface.ad_authenticate( ad_user_in => lv_user_in, 
                                                    ad_passwd_in => lv_pwd_in, 
                                                    ad_debug_in => TRUE);

    dbms_output.put_line('Status ' || lv_status);
END;
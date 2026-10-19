SET SERVEROUTPUT ON;
SET DEFINE OFF;
DECLARE
    l_status VARCHAR2(2000);   
    lv_userdn VARCHAR2(200) := 'CN=svc_wellskybb001,OU=AADDC Users,DC=aaddsuvmhealth,DC=org';
    lv_userpwd VARCHAR2(200) := 'DUMMYPASSWORD';
    lv_userid VARCHAR2(100) := 'svc_wellskybb001';
    lv_searchbase VARCHAR2(200) := 'OU=AADDC Users,DC=aaddsuvmhealth,DC=org';
    lv_ldapurl VARCHAR2(200) := 'ldaps://ldaps.aaddsuvmhealth.org';
    lv_userattrib   VARCHAR2(100) := 'CN';
BEGIN


        l_status := LT_LDAP_INTERFACE.perform_ldap_auth(
                                      svc_userDn_IN     => lv_userdn,
                                      svc_userPwd_IN    => lv_userpwd,
                                      userId_IN         => lv_userid,
                                      userPwd_IN        => lv_userpwd,
                                      UserIdAttrib_IN   => lv_userattrib,
                                      searchUserBase_IN => lv_searchbase,
                                      ldapUrl_IN        => lv_ldapurl
                                    );
    DBMS_OUTPUT.PUT_LINE('STATUS ' || l_status);
END;
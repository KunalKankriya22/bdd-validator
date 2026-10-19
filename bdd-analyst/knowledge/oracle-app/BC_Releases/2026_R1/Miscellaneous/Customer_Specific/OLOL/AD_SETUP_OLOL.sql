SET SERVEROUTPUT ON;
DECLARE
    
    ad_config_rec ACTIVE_DIRECTORY_CONFIG%ROWTYPE;
    
    
    l_ad_svc_acct_pwd VARCHAR2(100);
    l_pwd_raw RAW(128) ;
    l_key               RAW(128) := UTL_RAW.cast_to_raw('idemeraw');
    l_encrypted_raw RAW(2048);  
    nCnt NUMBER;
BEGIN
    
    ad_config_rec.AD_HOST           := 'ldap.fmol-hs.local'; 
    ad_config_rec.AD_PORT           := 389;
    
    ad_config_rec.AD_USE_SSL        := 'N';
    -- Below required only if SSL is enabled with AUTH as 3
    ad_config_rec.AD_SSL_WALLET_PWD := NULL;
    ad_config_rec.AD_SSL_AUTH       := NULL;
    --------------------------------------------
    
    ad_config_rec.AD_USE_SVC_ACCT   := 'Y';   
    -- Below required only if SVC acct is required.
    ad_config_rec.AD_SVC_USER       := 'svc_bloodcenters';
    ad_config_rec.AD_SVC_USERDN     := 'CN=svc_bloodcenters,OU=FMOLHS,OU=Service Accounts,DC=FMOL-HS,DC=LOCAL';
    ad_config_rec.AD_SVC_PWD        := NULL;
    l_ad_svc_acct_pwd               := 'NOTREALPWD'; -- Enter service acct password. Encrypted and stored. 
    ad_config_rec.AD_SEARCH_BASE    := 'DC=FMOL-HS,DC=LOCAL';
    ------------------
    
    ad_config_rec.AD_USER_DOMAIN    := NULL;    
    
    -- Do not change this unless required.
    ad_config_rec.AD_SEARCH_FILTER  := '&(objectCategory=user)(sAMAccountName=<ADUSERID>)';
    
    SELECT COUNT(1) INTO nCnt
      FROM active_directory_config;
      
    IF nCnt <> 0 THEN
        DELETE FROM active_directory_config;
    END IF;
    
    INSERT INTO active_directory_config VALUES ad_config_rec;
    
    l_pwd_raw := UTL_RAW.CAST_TO_RAW(l_ad_svc_acct_pwd);
    l_encrypted_raw := DBMS_CRYPTO.encrypt(src => l_pwd_raw, 
                                         typ => DBMS_CRYPTO.des_cbc_pkcs5, 
                                         key => l_key);    

  UPDATE active_directory_Config
    SET ad_svc_pwd = l_encrypted_raw;
    
  COMMIT;

END;

DECLARE
    ad_config_rec ACTIVE_DIRECTORY_CONFIG%ROWTYPE;    
    
    l_ad_svc_acct_pwd VARCHAR2(100);
    l_pwd_raw RAW(128) ;
    l_key               RAW(128) := UTL_RAW.cast_to_raw('tttt');
    l_encrypted_raw RAW(2048);  
    nCnt NUMBER;
BEGIN
    l_pwd_raw := UTL_RAW.CAST_TO_RAW(l_ad_svc_acct_pwd);
    l_encrypted_raw := DBMS_CRYPTO.encrypt(src => l_pwd_raw, 
                                         typ => DBMS_CRYPTO.des_cbc_pkcs5, 
                                         key => l_key);    

  UPDATE active_directory_Config
    SET ad_svc_pwd = l_encrypted_raw;

END;
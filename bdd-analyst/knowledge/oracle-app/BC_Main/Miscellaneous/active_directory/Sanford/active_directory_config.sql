-- V01
REM INSERTING into ACTIVE_DIRECTORY_CONFIG
SET DEFINE OFF;


INSERT INTO active_directory_config (
    ad_host,
    ad_port,
    ad_use_ssl,
    ad_ssl_wallet_pwd,
    ad_ssl_auth,
    ad_svc_user,
    ad_svc_userdn,
    ad_svc_pwd,
    ad_use_svc_acct,
    ad_search_filter,
    ad_search_base,
    ad_user_domain,
    ad_userid_attrib,
    offline_auth
) VALUES (
    'sflmdc1.sanfordhealth.org',
    389,
    'N',
    NULL,
    NULL,
    'SANFORDHEALTH\srvHCLL_ADMINDEV',
    'CN=srvHCLL_ADMINDEV,OU=Service Accounts,OU=Sioux Falls,DC=SanfordHealth,DC=org',
    'F9CAE80454FFFABA3F12F7C7FB4DC2B9CEEE76FCE4A575D4FF97459E97623F2E',
    'Y',
    '&(objectCategory=user)(sAMAccountName=<ADUSERID>)',
    'DC=SanfordHealth,DC=org',
    NULL,
    'CN',
    NULL
);

-- V02

REM INSERTING into ACTIVE_DIRECTORY_CONFIG
SET DEFINE OFF;

INSERT INTO active_directory_config (
    ad_host,
    ad_port,
    ad_use_ssl,
    ad_ssl_wallet_pwd,
    ad_ssl_auth,
    ad_svc_user,
    ad_svc_userdn,
    ad_svc_pwd,
    ad_use_svc_acct,
    ad_search_filter,
    ad_search_base,
    ad_user_domain,
    ad_userid_attrib,
    offline_auth
) VALUES (
    'sflmdc6.sanfordhealth.org',
    389,
    'N',
    NULL,
    NULL,
    NULL,
    'CN=SERVICE ACCOUNT\,srvBloodCntr_AD,OU=Service Accounts,OU=Sioux Falls,DC=SanfordHealth,DC=org',
    '4014BE4133975656A183B4C56D528E778E81DFB478B57CB7',
    'Y',
    '&(objectCategory=user)(sAMAccountName=<ADUSERID>)',
    'DC=SanfordHealth,DC=org',
    NULL,
    'cn',
    NULL
);
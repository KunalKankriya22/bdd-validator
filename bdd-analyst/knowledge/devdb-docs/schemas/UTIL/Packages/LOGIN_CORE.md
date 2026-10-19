---
tags:
  - package
  - UTIL
---
# LOGIN_CORE

**Schema**: [[schemas/UTIL/UTIL|UTIL]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE LOGIN_CORE IS
    
    -- Constants for authentication types
    C_AUTH_TYPE_SIMPLE  CONSTANT VARCHAR2(10) := 'SIMPLE';
    C_AUTH_TYPE_CAC     CONSTANT VARCHAR2(10) := 'CAC';
    C_AUTH_TYPE_AD      CONSTANT VARCHAR2(10) := 'AD';
    C_AUTH_TYPE_OKTA    CONSTANT VARCHAR2(10) := 'OKTA';

    C_SUCCESS           CONSTANT  VARCHAR2(10) := 'SUCCESS';
    C_FAIL              CONSTANT  VARCHAR2(10) := 'FAIL';

    -- Constants for boolean flags
    C_YES               CONSTANT VARCHAR2(1) := 'Y';
    C_NO                CONSTANT VARCHAR2(1) := 'N';

    -- Maximum length for auth type
    C_AUTH_TYPE_LENGTH  CONSTANT NUMBER := 200;

    -- Log directory constant
    C_LOG_DIR           CONSTANT VARCHAR2(50) := 'LOGDR';

    -- Package version constant
    C_PACKAGE_VERSION   CONSTANT VARCHAR2(10) := '01';

    -- State.
    B_PWD_UPDATED BOOLEAN := FALSE;

    -- Record type for authentication configuration
    TYPE typ_auth_config IS RECORD (
        external_auth   VARCHAR2(1),
        okta_auth       VARCHAR2(1),
        ad_enabled      VARCHAR2(1)
    );

    -- Record type for application configuration
    TYPE typ_app_config IS RECORD (
        strong_pwd_enabled  VARCHAR2(1),
        default_dbase       VARCHAR2(1),
        single_user         VARCHAR2(1),
        time_zone_enabled   VARCHAR2(1)
    );


    -- Exception for configuration conflicts
    ex_config_conflict EXCEPTION;
    PRAGMA EXCEPTION_INIT(ex_config_conflict, -20001);

    -- Exception for invalid configuration
    ex_invalid_config EXCEPTION;
    PRAGMA EXCEPTION_INIT(ex_invalid_config, -20002);

    -- Public procedures and functions
    FUNCTION get_pwd_updated_status RETURN BOOLEAN;
    PROCEDURE set_pwd_updated_status(p_status IN BOOLEAN);
    FUNCTION get_package_version RETURN VARCHAR2;
    PROCEDURE initialise(status_out OUT VARCHAR2);
    PROCEDURE validate_configuration;
    FUNCTION get_auth_type RETURN VARCHAR2;
    FUNCTION get_auth_config RETURN typ_auth_config;
    FUNCTION get_app_config RETURN typ_app_config;
    FUNCTION is_external_auth_enabled RETURN BOOLEAN;
    FUNCTION is_strong_password_enabled RETURN BOOLEAN;
    FUNCTION is_user_expired(userid_in IN VARCHAR2) RETURN BOOLEAN;
    FUNCTION is_user_locked(userid_in IN VARCHAR2)  RETURN BOOLEAN;
    FUNCTION is_user_reset_request(userid_in IN VARCHAR2)  RETURN BOOLEAN;
    PROCEDURE reset_configuration;
    PROCEDURE log_login_event(
        app_user     IN VARCHAR2,
        workstation  IN VARCHAR2,
        audit_event  IN VARCHAR2,
        audit_msg   IN VARCHAR2 DEFAULT NULL);
    PROCEDURE handle_simple_authentication( userid_in       IN VARCHAR2, 
                                            pwd_in          IN VARCHAR2,
                                            workstation_in  IN VARCHAR2,
                                            status_out      OUT VARCHAR2,
                                            status_msg      OUT VARCHAR2);

    PROCEDURE handle_ad_authentication( userid_in       IN VARCHAR2, 
                                        pwd_in          IN VARCHAR2,
                                        workstation_in  IN VARCHAR2,
                                        status_out      OUT VARCHAR2,
                                        status_msg      OUT VARCHAR2,
                                        app_user        OUT VARCHAR2);    
    PROCEDURE cac_auth_user_type(
        uid_in      IN VARCHAR2, 
        status_out  OUT VARCHAR2,
        status_msg  OUT VARCHAR2);     

    PROCEDURE okta_auth_user_type(
        uid_in      IN VARCHAR2, 
        status_out  OUT VARCHAR2,
        status_msg  OUT VARCHAR2);                                               
END LOGIN_CORE;


```

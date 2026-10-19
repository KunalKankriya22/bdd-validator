---
tags:
  - package
  - UTIL
---
# LT_PASSWORD_POLICY

**Schema**: [[schemas/UTIL/UTIL|UTIL]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE lt_password_policy
AS
/*********************************************************************************
Description		:	This package contain routines for checking strong password
                        policy requirements and storing, retrieving strong password
                        as a hashed value. which related to Lifetrack Applications.

Created by		:	Hussein Abbas

Created on		:	March 25, 2011

Version			:	1.0 (Initial)
Version   	: 2.0 Modifed by Hussein on 08-12-11; added code to check for
                        excluded special characters.
Version     : 3.0  check_password_history routine modified.
Version     : 4.0  created another function called DOTNET_SAVE_HASH - Edwin 011619
Version     : 5.0  created ons_check_strong_password for dotnet app. Ashok -- 02/21/2019
Version     : 6.0  ons_check_strong_password routine modified to add user id as paramter. 10/07/2019 -- MLT 2558
Version     : 7.0  PWD_LOCKOUT_LIMIT_REACHED, ONS_CHECK_HASH, ONS_CHECK_PASSWORD_AGE ROUTINES ADDED; -- 10/11/2019 -- MLT 2559
Version     : 8.0  11/20/2019 -- ONS_CHECK_PASSWORD_AGE modified to pass
Version     : 9.0  11/24/2020 -- ONS_CHECK_STRONG_PASSWORD routine modified to ONS_CHECK_STRONG_PWD_RESET and new routine ONS_CHECK_STRONG_PASSWORD created.
Version     : 10.0 05/19/2021 -- RESET_PASSWORD routine added.
            : 11 05/21/21 -- error msg updated in check_normal_password --V11
Version     : 12 06/30/20025 -- pwd_lockout_limit_reached routine modified to add ad_user parameter. -- MLT 7851
*********************************************************************************/


PROCEDURE check_strong_password (
                                              user_password in  VARCHAR2
                                              ,error_code   out VARCHAR2
                                              ,msg          out VARCHAR2
                                   );

PROCEDURE ONS_CHECK_STRONG_PASSWORD     (  user_password in varchar2,
                                           ERROR_CODE    OUT VARCHAR2,
                                           MSG           OUT VARCHAR2);

PROCEDURE ONS_CHECK_STRONG_PWD_RESET(  user_id IN VARCHAR2,
                                            user_password in varchar2,
                                            old_password in varchar2,
                                            ERROR_CODE    OUT VARCHAR2,
                                            MSG           OUT VARCHAR2);


 FUNCTION IS_SINGLE_USER_MODE
 RETURN BOOLEAN
 ;

 FUNCTION is_strong_password
 RETURN BOOLEAN
 ;

 FUNCTION PASSWORD_HISTORY
 RETURN number
 ;

 FUNCTION PASSWORD_MIN_CHAR_CHANGED
 RETURN number
 ;

 FUNCTION password_min_length
 RETURN number
 ;

 FUNCTION PASSWORD_MIN_LOWER_CASE
 RETURN number
 ;

 FUNCTION PASSWORD_MIN_NUMBER
 RETURN number
 ;

 FUNCTION PASSWORD_MIN_SPECIAL
 RETURN number
 ;

 FUNCTION password_min_upper_case
 RETURN number
 ;

FUNCTION CHECK_MIN_CHAR_CHANGED(
                                                 OLD_PASS       IN VARCHAR2
                                                 ,NEW_PASS      IN VARCHAR2
                                         )
RETURN boolean
;

FUNCTION CHECK_PASSWORD_HISTORY(
                                                  APP_USER      IN VARCHAR2
                                                  ,NEW_PASSWORD IN VARCHAR2
                                          )
RETURN BOOLEAN
;

FUNCTION SAVE_HASH(
                                                  NEW_PASSWORD IN VARCHAR2
                                          )
RETURN RAW
;

FUNCTION DOTNET_SAVE_HASH(   P_USER_ID  IN VARCHAR2,
                             P_NEW_PASSWORD IN VARCHAR2
                          )
RETURN BOOLEAN
;


FUNCTION CHECK_HASH(
                                                  APP_USER      IN VARCHAR2
                                                  ,NEW_PASSWORD IN VARCHAR2
                                          )
RETURN BOOLEAN;

  FUNCTION PWD_LOCKOUT_LIMIT_REACHED(app_user IN VARCHAR2, ad_user IN VARCHAR2 DEFAULT NULL) RETURN BOOLEAN;

  FUNCTION ONS_CHECK_HASH(APP_USER     IN VARCHAR2,
                           NEW_PASSWORD IN VARCHAR2,
                           WORK_STATION IN VARCHAR2,
                           LOG_EVENT    IN BOOLEAN) RETURN BOOLEAN;

  PROCEDURE ONS_CHECK_PASSWORD_AGE(APP_USER IN VARCHAR2, PWD_STATUS OUT VARCHAR2, PWD_EXPIRE_WARNING OUT NUMBER);

    /*
    ** Called from Onsite reset page.  Moved UTIOPSWD(Reset password) oracle form
    ** logic to this routine.
    ** Returns 'OK' or error message.
    ** MLT 4292
    */
    PROCEDURE RESET_PASSWORD(user_id_in IN VARCHAR2,
                             pwd_in IN VARCHAR2,
                             status_out OUT VARCHAR2);
END lt_password_policy;
```

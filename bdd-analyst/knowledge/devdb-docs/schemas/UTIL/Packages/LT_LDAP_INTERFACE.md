---
tags:
  - package
  - UTIL
---
# LT_LDAP_INTERFACE

**Schema**: [[schemas/UTIL/UTIL|UTIL]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE lt_ldap_interface AUTHID CURRENT_USER IS
/* ----------------------------------------
*
||    Program Name                : lt_ldap_interface
||    Date Creation               : 01-01-2013 (LT 2013 Release)
||    Current Version             : 01 -- Ashok. SCR 19807. This package is used to interface with active directory.
||                                     -- Same pkg used in both Donor and Lab/Distribution. (checked in same code at both places)
||                                  02 -- 05/05/2014 - LT2013 R2 and LT2013SP2 - Ashok.
||                                     -- SCR 20552.  Increased ad_domain and ad_user variable size in ad_authenticate.
||                                  03 -- MLT 2559 -- ONS_AD_AUTHENTICATE wrapper procedure added..
||                                  04 -- MLT 5167 -- V04 -- Added support for LDAP over SSL.
||                                  05 -- ACTIVE_DIRECTORY_CONFIGURATION used
||                                  06 -- LDAPS intergration using Java Stored Procedure 01/09/2024 - MLT-6522.
||                                     -- non ssl, without service account issue fixed. 
||                                  07 -- Offline Auth added.
*/
-------------------------------------------- */


    PROCEDURE ONS_AD_AUTHENTICATE(ad_user_in IN VARCHAR2, ad_passwd_in IN VARCHAR2, status_out OUT VARCHAR2);
  /* ad_authenticate function
     Usage: To authenticate the user credentials against Active Directory.
     Returns:
        1) 'OK' - for succesful validation;
        2) 'Invalid Credentials' - for Invalid credentials.
        3) 'LDAP Referral Error' - for LDAP error. (Check Base DN.  This is for future use.)
        4) 'INIT failed' - for INIT error.(Check AD domain address).
        5)  errmsg - for any error messges.
  */

    FUNCTION perform_ldap_auth(  svc_userDn_IN     IN VARCHAR2,
                                  svc_userPwd_IN    IN VARCHAR2,
                                  userId_IN         IN VARCHAR2,
                                  userPwd_IN        IN VARCHAR2,
                                  UserIdAttrib_IN   IN VARCHAR2,
                                  searchUserBase_IN IN VARCHAR2,
                                  ldapUrl_IN        IN VARCHAR2)
        RETURN VARCHAR2;

  FUNCTION ad_authenticate(ad_user_in IN VARCHAR2, ad_passwd_in IN VARCHAR2, ad_debug_in IN BOOLEAN DEFAULT FALSE) RETURN VARCHAR2;
  /* Get_LT_User Function
     Usage: Find the LT User ID associated with the AD user ID in system_users table.
      -- returns 'OK' and output parameter contains the associated LT User ID.
      -- returns error message and outptut parameter is null;
  */
  FUNCTION get_LT_User(ad_user_in IN VARCHAR2, lt_user_out OUT VARCHAR2) RETURN VARCHAR2;
END lt_ldap_interface;


```

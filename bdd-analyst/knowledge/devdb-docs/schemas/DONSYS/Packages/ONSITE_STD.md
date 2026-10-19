---
tags:
  - package
  - DONSYS
---
# ONSITE_STD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
package ONSITE_STD is

  -- Author  : ASHOKV
  -- Created : 2/26/2019 8:07:26 PM
  -- Purpose : All the standard routines for ONSITE web app module are located here.
  /*
  Modification History
  ----------------------------------------------------------------------------
  Modified by   |     on       |     Version    |  Remarks
  ----------------------------------------------------------------------------
  Ashok        |  02/26/2019  | 01 |  MLT - 1264
  Edwin        |  04/18/2019  | 02 |  MLT - 1932  (creating a routine to check the user access)
  Ashok        |  06/20/2019  | 03 |  MLT - 2235
  Ashok        |  09/30/2019  | 04 |  MLT - 2583 consent_check routine modified.
  Ashok        |  03/15/2021  | 05 |  MLT-4127 | consent_check routine modified to add chapter id to vdpc table.
  Ashok        |  09/16/2021  | 06 |  MLT-4591 | Check_super_user_access updated to add timezone check.
  Ashok        |  01/29/2024  | 07 |  MLT-6567 | Consent_check issue (DONOR_ID also used to check consents instead of just checking TRANSACTION_ID)
  */
  PROCEDURE consent_check(transaction_id_in IN VARCHAR2,
                          chapter_id_in     IN VARCHAR2,
                          status_out        OUT VARCHAR2);

  PROCEDURE check_super_user_access(p_user_id      IN VARCHAR2,
                                    p_password     in varchar2,
                                    p_access_class in varchar2,
                                    p_access_flag  OUT VARCHAR2);

  PROCEDURE validate_deferral(p_def_id        in varchar2,
                              p_deferral_flag out varchar2);

  PROCEDURE remove_DNELG_holds(trn_id_in  IN VARCHAR2,
                               user_id_in IN VARCHAR2,
                               program_in IN VARCHAR2,
                               status_out OUT VARCHAR2);

  PROCEDURE place_DNELG_hold(trn_id_IN      IN VARCHAR2,
                             user_id_IN     in varchar2,
                             program_IN     IN VARCHAR2,
                             reason_code_IN IN VARCHAR2,
                             comments_IN    IN VARCHAR2,
                             status_OUT     OUT VARCHAR2);                        
end ONSITE_STD;

```

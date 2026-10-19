---
tags:
  - package
  - DONSYS
---
# DON_LIST_BROWSER

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "DON_LIST_BROWSER" IS


/************************************************************************************
Developed By :
Create Date  :
Purpose      :
Date Mod     : 04/15/2011
Version	 : 02	Modified By: Hussein  replace user by lt_sesseion_user.get_user_id
*************************************************************************************/

PROCEDURE LOCK_RETURN_DONOR
 (PL_STATUS IN varchar2
 ,PL_CLAUSE_1 IN varchar2
 ,PL_CLAUSE_2 IN varchar2
 ,PL_ORDER_CLAUSE IN varchar2
 ,PL_LIST_ID IN varchar2
 ,PL_NXT_ROWNUM IN number
 ,PL_DONOR_ID OUT varchar2
 );
PROCEDURE NO_STATUS_CHANGE
 (PL_STATUS IN varchar2
 ,PL_CLAUSE_1 IN varchar2
 ,PL_CLAUSE_2 IN varchar2
 ,PL_ORDER_CLAUSE IN varchar2
 ,PL_LIST_ID IN varchar2
 ,PL_PRE_ROWNUM IN number
 ,PL_DONOR_ID OUT varchar2
 ,PL_NXT_ROWNUM OUT number
 );
PROCEDURE LOCK_RELEASE_DONOR
 (PL_LIST_ID IN varchar2
 ,PL_DONOR_ID IN varchar2
 );
END DON_LIST_BROWSER;

```

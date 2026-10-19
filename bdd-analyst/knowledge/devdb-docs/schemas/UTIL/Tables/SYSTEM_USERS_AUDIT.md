---
tags:
  - table
  - UTIL
---
# SYSTEM_USERS_AUDIT

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 59429
**Last Analyzed**: 2025-09-16 03:16:48
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | USER_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | STAFF_NO | VARCHAR2(6) | Yes |  |  |
| 4 | USER_FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 5 | USER_LAST_NAME | VARCHAR2(30) | Yes |  |  |
| 6 | USER_INITIALS | VARCHAR2(3) | Yes |  |  |
| 7 | TESTING_LAB_CODE | VARCHAR2(2) | Yes |  |  |
| 8 | PRINT_ID | VARCHAR2(40) | Yes |  |  |
| 9 | EFF_DATE | DATE | Yes |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | CUSTOMER_ID | VARCHAR2(10) | Yes |  |  |
| 12 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |
| 13 | APPL_PASSWORD | VARCHAR2(8) | Yes |  |  |
| 14 | AUDIT_KEY | NUMBER | Yes |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 16 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 17 | INSERT_DATE | DATE | Yes |  |  |
| 18 | USER_CLASS | VARCHAR2(5) | Yes |  |  |
| 19 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 20 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 21 | PASSWORD_MODIFIED_DATE | DATE | Yes |  |  |
| 22 | PASS_THRU | VARCHAR2(5) | Yes |  |  |
| 23 | LIFETRAK_PASSWORD | RAW(50) | Yes |  |  |
| 24 | EDI_PN_ID | VARCHAR2(50) | Yes |  |  |
| 25 | IS_PASSWORD_LOCKED | VARCHAR2(1) | Yes |  |  |
| 26 | RESET_REQUEST | VARCHAR2(1) | Yes |  |  |
| 27 | LOCKOUT_DATE | DATE | Yes |  |  |
| 28 | KT_USER_ID | VARCHAR2(50) | Yes |  |  |
| 29 | AD_USER_ID | VARCHAR2(50) | Yes |  |  |
| 30 | PIN_NO | VARCHAR2(20) | Yes |  |  |
| 31 | SKIP_AD | VARCHAR2(1) | Yes |  |  |
| 32 | DEPARTMENT | VARCHAR2(50) | Yes |  |  |
| 33 | PHONE | VARCHAR2(10) | Yes |  |  |
| 34 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 35 | REFRESH_TOKEN | VARCHAR2(200) | Yes |  |  |
| 36 | ISSUED_DATE | DATE | Yes |  |  |
| 37 | EXPIRES_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

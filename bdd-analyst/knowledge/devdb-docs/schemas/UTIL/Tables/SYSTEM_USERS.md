---
tags:
  - table
  - UTIL
---
# SYSTEM_USERS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 148
**Last Analyzed**: 2026-05-23 15:07:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | USER_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | STAFF_NO | VARCHAR2(6) | No |  |  |
| 4 | USER_FIRST_NAME | VARCHAR2(25) | No |  |  |
| 5 | USER_LAST_NAME | VARCHAR2(30) | No |  |  |
| 6 | USER_INITIALS | VARCHAR2(3) | Yes |  |  |
| 7 | TESTING_LAB_CODE | VARCHAR2(2) | Yes |  |  |
| 8 | PRINT_ID | VARCHAR2(40) | Yes |  |  |
| 9 | EFF_DATE | DATE | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | CUSTOMER_ID | VARCHAR2(10) | Yes |  |  |
| 12 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |
| 13 | APPL_PASSWORD | VARCHAR2(8) | Yes |  |  |
| 14 | AUDIT_KEY | NUMBER | Yes |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 16 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 17 | INSERT_DATE | DATE | Yes |  |  |
| 18 | USER_CLASS | VARCHAR2(5) | Yes |  |  |
| 19 | PASSWORD_MODIFIED_DATE | DATE | Yes |  |  |
| 20 | PASS_THRU | VARCHAR2(5) | Yes |  |  |
| 21 | LIFETRAK_PASSWORD | RAW(50) | Yes |  |  |
| 22 | EDI_PN_ID | VARCHAR2(50) | Yes |  |  |
| 23 | IS_PASSWORD_LOCKED | VARCHAR2(1) | Yes |  |  |
| 24 | RESET_REQUEST | VARCHAR2(1) | Yes |  |  |
| 25 | LOCKOUT_DATE | DATE | Yes |  |  |
| 26 | KT_USER_ID | VARCHAR2(50) | Yes |  |  |
| 27 | AD_USER_ID | VARCHAR2(50) | Yes |  |  |
| 28 | PIN_NO | VARCHAR2(20) | Yes |  |  |
| 29 | SKIP_AD | VARCHAR2(1) | Yes |  |  |
| 30 | DEPARTMENT | VARCHAR2(50) | Yes |  |  |
| 31 | PHONE | VARCHAR2(10) | Yes |  |  |
| 32 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 33 | REFRESH_TOKEN | VARCHAR2(200) | Yes |  |  |
| 34 | ISSUED_DATE | DATE | Yes |  |  |
| 35 | EXPIRES_DATE | DATE | Yes |  |  |
| 36 | LOCKOUT_UNTIL | DATE | Yes |  |  |
| 37 | USER_EMAIL | VARCHAR2(128) | Yes |  |  |

## Primary Key

**SYSTEM_USERS_PK**: `USER_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/UTIL/Tables/VALID_WAREHOUSE_USERS\|UTIL.VALID_WAREHOUSE_USERS]] | USER_WAREHOUSE_USER_FK | USER_ID → USER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SYSTEM_USERS_PK | NORMAL | UNIQUE | USER_ID | VALID |

## Triggers

- [[schemas/UTIL/Triggers/SYSTEM_USERS_BEFORE_DELETE|SYSTEM_USERS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/UTIL/Triggers/SYSTEM_USERS_BEFORE_INSERT|SYSTEM_USERS_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/UTIL/Triggers/SYSTEM_USERS_BEFORE_UPDATE|SYSTEM_USERS_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

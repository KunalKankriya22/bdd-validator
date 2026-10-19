---
tags:
  - table
  - LTAPI
---
# API_EMPLOYEES

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | STAFF_NO | VARCHAR2(6) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | FIRST_NAME | VARCHAR2(25) | No |  |  |
| 4 | LAST_NAME | VARCHAR2(30) | No |  |  |
| 5 | INITIALS | VARCHAR2(3) | Yes |  |  |
| 6 | DEPT_ID | VARCHAR2(5) | Yes |  |  |
| 7 | STAFF_TYPE | VARCHAR2(5) | Yes |  |  |
| 8 | EXT_STAFF_NO | VARCHAR2(30) | Yes |  |  |
| 9 | EMP_CLASS | VARCHAR2(5) | Yes |  |  |
| 10 | COST_PER_HOUR | NUMBER(6,2) | Yes |  |  |
| 11 | ADDRESS_ID | VARCHAR2(10) | Yes |  |  |
| 12 | OTHER_PHONE_NO | VARCHAR2(14) | Yes |  |  |
| 13 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 14 | SSN | NUMBER(9) | Yes |  |  |
| 15 | HIRE_DATE | DATE | Yes |  |  |
| 16 | SCHEDULE_FROM_DATE | DATE | Yes |  |  |
| 17 | EM_CONTACT_NAME | VARCHAR2(30) | Yes |  |  |
| 18 | EM_CONTACT_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 19 | EM_CONTACT_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 20 | EFF_DATE | DATE | No |  |  |
| 21 | TERM_DATE | DATE | Yes |  |  |
| 22 | INSERT_DATE | DATE | No |  |  |
| 23 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 24 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 25 | AUDIT_KEY | NUMBER | Yes |  |  |
| 26 | MIDDLE_NAME | VARCHAR2(25) | Yes |  |  |
| 27 | EXT_APPL_ID | VARCHAR2(15) | No |  |  |
| 28 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 29 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 30 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |

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

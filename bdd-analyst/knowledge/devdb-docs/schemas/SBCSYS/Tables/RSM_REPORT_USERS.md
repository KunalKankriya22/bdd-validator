---
tags:
  - table
  - SBCSYS
---
# RSM_REPORT_USERS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 5
**Last Analyzed**: 2025-09-16 03:14:38
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | USER_ID | VARCHAR2(30) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | USER_FIRST_NAME | VARCHAR2(30) | Yes |  |  |
| 5 | USER_LAST_NAME | VARCHAR2(20) | Yes |  |  |
| 6 | STAFF_NO | VARCHAR2(20) | Yes |  |  |
| 7 | DEPT_ID | VARCHAR2(10) | Yes |  |  |
| 8 | PASSWORD_RESET_DATE | DATE | Yes |  |  |
| 9 | INSERT_DATE | DATE | Yes |  |  |
| 10 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 11 | EFF_DATE | DATE | No |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |

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

---
tags:
  - table
  - DONSYS
---
# VALID_WINDOWS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 8
**Last Analyzed**: 2025-09-16 03:14:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | WINDOW_NAME | VARCHAR2(10) | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | TITLE | VARCHAR2(50) | Yes |  |  |
| 8 | APPL_ID | VARCHAR2(4) | Yes |  |  |
| 9 | PARM_1 | VARCHAR2(30) | Yes |  |  |
| 10 | PARM_2 | VARCHAR2(30) | Yes |  |  |
| 11 | PARM_3 | VARCHAR2(30) | Yes |  |  |
| 12 | PARM_4 | VARCHAR2(30) | Yes |  |  |
| 13 | X_POS | NUMBER(3) | Yes |  |  |
| 14 | Y_POS | NUMBER(3) | Yes |  |  |
| 15 | EFF_DATE | DATE | Yes |  |  |
| 16 | TERM_DATE | DATE | Yes |  |  |

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

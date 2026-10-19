---
tags:
  - table
  - DONSYS
---
# VALID_PROGRAM_WINDOWS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 422
**Last Analyzed**: 2025-09-16 03:14:16
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
| 7 | APPL_ID | VARCHAR2(4) | Yes |  |  |
| 8 | PARM1_VALUE | VARCHAR2(30) | Yes |  |  |
| 9 | PARM2_VALUE | VARCHAR2(30) | Yes |  |  |
| 10 | PARM3_VALUE | VARCHAR2(30) | Yes |  |  |
| 11 | PARM4_VALUE | VARCHAR2(30) | Yes |  |  |
| 12 | QUERY_ONLY | VARCHAR2(1) | Yes |  |  |
| 13 | EFF_DATE | DATE | Yes |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |

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

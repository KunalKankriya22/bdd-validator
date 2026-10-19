---
tags:
  - table
  - DONSYS
---
# FIND_DONOR_PROGRAMS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 452
**Last Analyzed**: 2026-04-18 11:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | PROGRAM_NAME | VARCHAR2(10) | Yes |  |  |
| 6 | ALLOW_CREATE | VARCHAR2(1) | Yes |  |  |
| 7 | MULTIPLE_SELECTION | VARCHAR2(1) | Yes |  |  |
| 8 | GRADING_LEVEL | VARCHAR2(2) | Yes |  |  |
| 9 | UPDATE_KEY_INFO | VARCHAR2(1) | Yes |  |  |
| 10 | ALLOW_NEW | VARCHAR2(1) | Yes |  |  |
| 11 | ALLOW_SELECT | VARCHAR2(1) | Yes |  |  |
| 12 | ALLOW_HOLD | VARCHAR2(1) | Yes |  |  |
| 13 | SELECT_ALLOWED_LEVELS | NUMBER(2) | Yes |  |  |
| 14 | NEW_ALLOWED_LEVEL | NUMBER(2) | Yes |  |  |
| 15 | SELECT_ALLOWED_MULTILEVEL | NUMBER(2) | Yes |  |  |
| 16 | EFF_DATE | DATE | Yes |  |  |
| 17 | TERM_DATE | DATE | Yes |  |  |

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

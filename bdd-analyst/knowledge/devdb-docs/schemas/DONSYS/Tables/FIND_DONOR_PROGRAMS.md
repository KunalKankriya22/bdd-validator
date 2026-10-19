---
tags:
  - table
  - DONSYS
---
# FIND_DONOR_PROGRAMS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 40
**Last Analyzed**: 2026-04-21 03:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROGRAM_NAME | VARCHAR2(10) | No |  |  |
| 2 | ALLOW_CREATE | VARCHAR2(1) | No |  |  |
| 3 | MULTIPLE_SELECTION | VARCHAR2(1) | Yes |  |  |
| 4 | GRADING_LEVEL | VARCHAR2(2) | Yes |  |  |
| 5 | UPDATE_KEY_INFO | VARCHAR2(1) | Yes |  |  |
| 6 | ALLOW_NEW | VARCHAR2(1) | Yes |  |  |
| 7 | ALLOW_SELECT | VARCHAR2(1) | Yes |  |  |
| 8 | ALLOW_HOLD | VARCHAR2(1) | Yes |  |  |
| 9 | SELECT_ALLOWED_LEVELS | NUMBER(2) | Yes |  |  |
| 10 | NEW_ALLOWED_LEVEL | NUMBER(2) | Yes |  |  |
| 11 | SELECT_ALLOWED_MULTILEVEL | NUMBER(2) | Yes |  |  |
| 12 | EFF_DATE | DATE | No |  |  |
| 13 | TERM_DATE | DATE | Yes |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 15 | INSERT_DATE | DATE | No |  |  |
| 16 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 17 | AUDIT_KEY | NUMBER | No |  |  |
| 18 | ENFORCE_PASSWORD | VARCHAR2(1) | Yes |  |  |
| 19 | FLAG1 | VARCHAR2(1) | Yes |  |  |
| 20 | FLAG2 | VARCHAR2(1) | Yes |  |  |
| 21 | FLAG3 | VARCHAR2(1) | Yes |  |  |
| 22 | FLAG4 | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/FIND_DONOR_PROGRAMS_BD|FIND_DONOR_PROGRAMS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/FIND_DONOR_PROGRAMS_BI|FIND_DONOR_PROGRAMS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/FIND_DONOR_PROGRAMS_BU|FIND_DONOR_PROGRAMS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

---
tags:
  - table
  - DONSYS
---
# VALID_PROGRAM_WINDOWS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 83
**Last Analyzed**: 2025-09-16 03:14:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | WINDOW_NAME | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | APPL_ID | VARCHAR2(4) | No |  |  |
| 4 | PARM1_VALUE | VARCHAR2(30) | Yes |  |  |
| 5 | PARM2_VALUE | VARCHAR2(30) | Yes |  |  |
| 6 | PARM3_VALUE | VARCHAR2(30) | Yes |  |  |
| 7 | PARM4_VALUE | VARCHAR2(30) | Yes |  |  |
| 8 | QUERY_ONLY | VARCHAR2(1) | Yes |  |  |
| 9 | EFF_DATE | DATE | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |
| 15 | PROGRAM_NAME | VARCHAR2(10) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/VALID_PROGRAM_WINDOWS_BD|VALID_PROGRAM_WINDOWS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_PROGRAM_WINDOWS_BI|VALID_PROGRAM_WINDOWS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_PROGRAM_WINDOWS_BU|VALID_PROGRAM_WINDOWS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

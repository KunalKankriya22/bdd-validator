---
tags:
  - table
  - DONSYS
---
# VALID_ELIG_PROCS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1047
**Last Analyzed**: 2026-02-12 04:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROCEDURE_CODE | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CURR_DONATION_TYPE | VARCHAR2(5) | No |  |  |
| 4 | PREV_PROCEDURE_CODE | VARCHAR2(5) | No |  |  |
| 5 | DAYS_BETWEEN | NUMBER(4) | No |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_ELIG_PROCS_PK**: `PROCEDURE_CODE, CHAPTER_ID, CURR_DONATION_TYPE, PREV_PROCEDURE_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_ELIG_PROCS_PK | NORMAL | UNIQUE | PROCEDURE_CODE, CHAPTER_ID, CURR_DONATION_TYPE, PREV_PROCEDURE_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_ELIG_PROCS_BD|VALID_ELIG_PROCS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_ELIG_PROCS_BI|VALID_ELIG_PROCS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_ELIG_PROCS_BU|VALID_ELIG_PROCS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

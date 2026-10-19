---
tags:
  - table
  - DONSYS
---
# VALID_PROC_CODES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 46
**Last Analyzed**: 2026-04-30 03:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROCEDURE_CODE | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DESCRIPTION | VARCHAR2(50) | No |  |  |
| 4 | DURATION | NUMBER(3) | No |  |  |
| 5 | CREDIT_COUNT | NUMBER(3) | No |  |  |
| 6 | SORT_SEQUENCE | NUMBER(3) | Yes |  |  |
| 7 | SCH_VIEW_INTERVAL | NUMBER(3) | Yes |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |
| 12 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |
| 14 | STANDARD_RBC_LOSS | NUMBER(6) | Yes |  |  |
| 15 | STANDARD_PLASMA_LOSS | NUMBER(6) | Yes |  |  |
| 16 | ECV_RBC_LOSS | NUMBER(6) | Yes |  |  |
| 17 | ECV_PLASMA_LOSS | NUMBER(6) | Yes |  |  |

## Primary Key

**VALID_PROC_CODES_PK**: `PROCEDURE_CODE, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_PROC_CODES_PK | NORMAL | UNIQUE | PROCEDURE_CODE, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_PROC_CODES_BD|VALID_PROC_CODES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_PROC_CODES_BI|VALID_PROC_CODES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_PROC_CODES_BU|VALID_PROC_CODES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| DON_STD | PACKAGE | DONSYS |

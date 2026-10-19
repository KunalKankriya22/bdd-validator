---
tags:
  - table
  - DONSYS
---
# VALID_PROC_GROUPS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 57
**Last Analyzed**: 2026-05-06 03:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROCEDURE_CODE | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PROCEDURE_GROUP | VARCHAR2(5) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | ELIG_CREDIT_COUNT | NUMBER | Yes |  |  |

## Primary Key

**VALID_PROC_GROUPS_PK**: `PROCEDURE_CODE, CHAPTER_ID, PROCEDURE_GROUP`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_PROC_GROUPS_PK | NORMAL | UNIQUE | PROCEDURE_CODE, CHAPTER_ID, PROCEDURE_GROUP | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_PROC_GROUPS_BD|VALID_PROC_GROUPS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_PROC_GROUPS_BI|VALID_PROC_GROUPS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_PROC_GROUPS_BU|VALID_PROC_GROUPS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

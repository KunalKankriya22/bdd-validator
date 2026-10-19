---
tags:
  - table
  - DONSYS
---
# TERRITORY_ASSIGNMENTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 130
**Last Analyzed**: 2025-09-16 03:14:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | RECRUITER_ID | VARCHAR2(6) | No |  |  |
| 3 | TERRITORY_ID | VARCHAR2(10) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**TERRITORY_ASSIGNMENTS_PK**: `CHAPTER_ID, RECRUITER_ID, TERRITORY_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TERRITORY_ASSIGNMENTS_PK | NORMAL | UNIQUE | CHAPTER_ID, RECRUITER_ID, TERRITORY_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/TERRITORY_ASSIGNMENTS_BD|TERRITORY_ASSIGNMENTS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/TERRITORY_ASSIGNMENTS_BI|TERRITORY_ASSIGNMENTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/TERRITORY_ASSIGNMENTS_BU|TERRITORY_ASSIGNMENTS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

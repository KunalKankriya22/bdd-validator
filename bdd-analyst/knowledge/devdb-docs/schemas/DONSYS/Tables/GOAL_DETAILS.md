---
tags:
  - table
  - DONSYS
---
# GOAL_DETAILS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:13:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | GOAL_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | BLOOD_TYPE | VARCHAR2(5) | Yes |  |  |
| 4 | PROCEDURE_TYPE | VARCHAR2(5) | Yes |  |  |
| 5 | GOAL_COUNT | NUMBER(7) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| GOAL_DETAILS_IDX1 | NORMAL | NONUNIQUE | GOAL_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/GOAL_DETAILS_BD|GOAL_DETAILS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/GOAL_DETAILS_BI|GOAL_DETAILS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/GOAL_DETAILS_BU|GOAL_DETAILS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

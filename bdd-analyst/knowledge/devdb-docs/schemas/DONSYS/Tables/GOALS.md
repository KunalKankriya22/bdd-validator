---
tags:
  - table
  - DONSYS
---
# GOALS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 19808
**Last Analyzed**: 2026-03-06 04:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | GOAL_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | GOAL_TYPE | VARCHAR2(5) | No |  |  |
| 4 | GOAL_CUSTODIAN | VARCHAR2(10) | No |  |  |
| 5 | GOAL_START_DATE | DATE | Yes |  |  |
| 6 | GOAL_END_DATE | DATE | Yes |  |  |
| 7 | GOAL_MMYY | VARCHAR2(6) | Yes |  |  |
| 8 | DONATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 9 | PROCEDURE_CODE | VARCHAR2(5) | Yes |  |  |
| 10 | BLOOD_TYPE | VARCHAR2(5) | Yes |  |  |
| 11 | GOAL_COUNT | NUMBER(7) | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | INSERT_DATE | DATE | No |  |  |
| 14 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 15 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**GOALS_PK**: `GOAL_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| GOALS_PK | NORMAL | UNIQUE | GOAL_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/GOALS_BD|GOALS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/GOALS_BI|GOALS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/GOALS_BU|GOALS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

---
tags:
  - table
  - DONSYS
---
# STAFF_OFF_DAY

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 22836
**Last Analyzed**: 2025-09-16 03:14:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | STAFF_NO | VARCHAR2(6) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | UNAVAIL_DATE | DATE | No |  |  |
| 4 | FROM_TIME | DATE | Yes |  |  |
| 5 | TO_TIME | DATE | Yes |  |  |
| 6 | REASON | VARCHAR2(5) | No |  |  |
| 7 | ASSIGNMENT_TYPE | VARCHAR2(5) | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 11 | COMMENTS | VARCHAR2(200) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| STAFF_OFF_DAY_IDX1 | NORMAL | UNIQUE | STAFF_NO, CHAPTER_ID, UNAVAIL_DATE, FROM_TIME, TO_TIME | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/STAFF_OFF_DAY_BI|STAFF_OFF_DAY_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

---
tags:
  - table
  - DONSYS
---
# STAFF_SCHEDULE_DETAILS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 24867
**Last Analyzed**: 2025-09-16 03:14:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SCHEDULE_ID | VARCHAR2(20) | No |  |  |
| 2 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | STAFF_NO | VARCHAR2(6) | No |  |  |
| 5 | JOB_CODE | VARCHAR2(5) | No |  |  |
| 6 | ASSIGN_MODE | VARCHAR2(5) | No |  |  |
| 7 | SPECIAL_JOB_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 11 | COMMENTS | VARCHAR2(200) | Yes |  |  |
| 12 | ACTUAL_BOD | DATE | Yes |  |  |
| 13 | SAVE_BOD | DATE | Yes |  |  |
| 14 | ACTUAL_EOD | DATE | Yes |  |  |
| 15 | SAVE_EOD | DATE | Yes |  |  |

## Primary Key

**STAFF_SCHEDULE_DETAILS_PK**: `SCHEDULE_ID, DRIVE_ID, CHAPTER_ID, STAFF_NO`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| STAFF_SCHEDULE_DETAILS_PK | NORMAL | UNIQUE | SCHEDULE_ID, DRIVE_ID, CHAPTER_ID, STAFF_NO | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/STAFF_SCHEDULE_DETAILS_BD|STAFF_SCHEDULE_DETAILS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/STAFF_SCHEDULE_DETAILS_BI|STAFF_SCHEDULE_DETAILS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/STAFF_SCHEDULE_DETAILS_BU|STAFF_SCHEDULE_DETAILS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

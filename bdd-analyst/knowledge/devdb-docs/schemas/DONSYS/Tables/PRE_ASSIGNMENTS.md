---
tags:
  - table
  - DONSYS
---
# PRE_ASSIGNMENTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2709
**Last Analyzed**: 2025-09-16 03:14:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | STAFF_NO | VARCHAR2(6) | No |  |  |
| 4 | PRE_ASIGN_STATUS | VARCHAR2(1) | Yes |  |  |
| 5 | JOB_CODE | VARCHAR2(5) | Yes |  |  |
| 6 | SPECIAL_JOB_CODE | VARCHAR2(5) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | SYS_BOD | DATE | Yes |  |  |
| 11 | SYS_EOD | DATE | Yes |  |  |
| 12 | COMMENTS | VARCHAR2(500) | Yes |  |  |
| 13 | ACTUAL_BOD | DATE | Yes |  |  |
| 14 | ACTUAL_EOD | DATE | Yes |  |  |

## Primary Key

**PRE_ASSIGNMENTS_PK**: `DRIVE_ID, CHAPTER_ID, STAFF_NO`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PRE_ASSIGNMENTS_D1 | NORMAL | NONUNIQUE | STAFF_NO | VALID |
| PRE_ASSIGNMENTS_PK | NORMAL | UNIQUE | DRIVE_ID, CHAPTER_ID, STAFF_NO | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/PRE_ASSIGNMENTS_BI|PRE_ASSIGNMENTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

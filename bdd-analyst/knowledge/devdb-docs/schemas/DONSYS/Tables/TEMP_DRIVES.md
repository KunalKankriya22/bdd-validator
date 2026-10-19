---
tags:
  - table
  - DONSYS
---
# TEMP_DRIVES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 583
**Last Analyzed**: 2026-04-07 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEMPDR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | RECRUITER_ID | VARCHAR2(6) | No |  |  |
| 4 | PENDING_REASON | VARCHAR2(5) | No |  |  |
| 5 | LOCATION_ID | VARCHAR2(10) | Yes |  |  |
| 6 | DRIVE_DATE | DATE | Yes |  |  |
| 7 | DRIVE_TYPE | VARCHAR2(5) | Yes |  |  |
| 8 | SCHEDULE_START_TIME | DATE | Yes |  |  |
| 9 | SCHEDULE_END_TIME | DATE | Yes |  |  |
| 10 | DRIVE_CATEGORY | VARCHAR2(5) | Yes |  |  |
| 11 | TERRITORY_ID | VARCHAR2(10) | Yes |  |  |
| 12 | STAFF_REQD | NUMBER(4) | Yes |  |  |
| 13 | VAN_REQD | NUMBER(4) | Yes |  |  |
| 14 | COACH_REQD | NUMBER(4) | Yes |  |  |
| 15 | BED_REQD | NUMBER(4) | Yes |  |  |
| 16 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 17 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 18 | INSERT_DATE | DATE | No |  |  |
| 19 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 20 | STATUS | VARCHAR2(1) | Yes |  |  |
| 21 | DELETE_USER | VARCHAR2(6) | Yes |  |  |
| 22 | DELETE_DATE | DATE | Yes |  |  |

## Primary Key

**TEMP_DRIVES_PK**: `TEMPDR_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEMP_DRIVES_PK | NORMAL | UNIQUE | TEMPDR_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/TEMP_DRIVES_BI|TEMP_DRIVES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

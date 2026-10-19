---
tags:
  - table
  - DONSYS
---
# PICKUP_SCHEDULE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 8343
**Last Analyzed**: 2026-04-04 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | PICKUP_ID | VARCHAR2(10) | No |  |  |
| 3 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 4 | PICK_UP_TIME | DATE | No |  |  |
| 5 | CARRIER_ID | VARCHAR2(10) | Yes |  |  |
| 6 | DRIVER_CODE | VARCHAR2(6) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | COMMENTS | VARCHAR2(200) | Yes |  |  |
| 11 | DISPATCH_TIME | DATE | Yes |  |  |
| 12 | RETURN_TIME | DATE | Yes |  |  |
| 13 | DISPATCHER_ID | VARCHAR2(6) | Yes |  |  |
| 14 | DELAY_REASON | VARCHAR2(5) | Yes |  |  |
| 15 | DELAY_COMMENTS | VARCHAR2(200) | Yes |  |  |
| 16 | VEHICLE_ID | VARCHAR2(10) | Yes |  |  |
| 17 | START_MILEAGE | NUMBER(7) | Yes |  |  |
| 18 | END_MILEAGE | NUMBER(7) | Yes |  |  |
| 19 | ACTUAL_PICKUP_TIME | DATE | Yes |  |  |
| 20 | ZONE | VARCHAR2(5) | Yes |  |  |
| 21 | DATA_GROUP_1 | VARCHAR2(20) | Yes |  |  |
| 22 | DATA_GROUP_2 | VARCHAR2(20) | Yes |  |  |
| 23 | DATA_GROUP_3 | VARCHAR2(20) | Yes |  |  |
| 24 | DATA_GROUP_4 | VARCHAR2(20) | Yes |  |  |

## Primary Key

**PICKUP_SCHEDULE_PK**: `DRIVE_ID, PICKUP_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PICKUP_SCHEDULE_PK | NORMAL | UNIQUE | DRIVE_ID, PICKUP_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/PICKUP_SCHEDULE_BI|PICKUP_SCHEDULE_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

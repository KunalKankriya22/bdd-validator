---
tags:
  - table
  - LTAPI
---
# API_DRIVES

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DRIVE_DATE | DATE | No |  |  |
| 4 | DRIVE_TYPE | VARCHAR2(5) | No |  |  |
| 5 | SCHEDULE_START_TIME | DATE | No |  |  |
| 6 | SCHEDULE_END_TIME | DATE | No |  |  |
| 7 | RECRUITER_ID | VARCHAR2(6) | No |  |  |
| 8 | LOCATION_ID | VARCHAR2(10) | No |  |  |
| 9 | STATUS | VARCHAR2(5) | No |  |  |
| 10 | CAMPAIGN_ID | VARCHAR2(10) | Yes |  |  |
| 11 | EVENT_ID | VARCHAR2(10) | Yes |  |  |
| 12 | CANCEL_DATE | DATE | Yes |  |  |
| 13 | CANCEL_USER | VARCHAR2(6) | Yes |  |  |
| 14 | CANCEL_REASON | VARCHAR2(100) | Yes |  |  |
| 15 | SCHEDULE_ID | VARCHAR2(20) | Yes |  |  |
| 16 | ESTIMATED_CPU | NUMBER(8,2) | Yes |  |  |
| 17 | PROJECTED_DRAW | NUMBER(6) | Yes |  |  |
| 18 | PROJECTED_SHOW | NUMBER(6) | Yes |  |  |
| 19 | ACTUAL_START_TIME | DATE | Yes |  |  |
| 20 | ACTUAL_END_TIME | DATE | Yes |  |  |
| 21 | ACTUAL_LEAVE_TIME | DATE | Yes |  |  |
| 22 | ACTUAL_RETURN_TIME | DATE | Yes |  |  |
| 23 | ACTUAL_TRAVEL_TIME | NUMBER(3) | Yes |  |  |
| 24 | ACTUAL_CPU | NUMBER(8,2) | Yes |  |  |
| 25 | ACTUAL_STUP_BKDOWN_TIME | NUMBER(3) | Yes |  |  |
| 26 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 27 | OPEN_DRIVE_IND | VARCHAR2(5) | Yes |  |  |
| 28 | DRIVE_CATEGORY | VARCHAR2(5) | Yes |  |  |
| 29 | TERRITORY_ID | VARCHAR2(10) | Yes |  |  |
| 30 | SCHEDULE_STUP_BKDOWN_TIME | NUMBER(3) | Yes |  |  |
| 31 | CANCEL_REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 32 | HOLD_REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 33 | ROLLOVER_STATUS | VARCHAR2(1) | Yes |  |  |
| 34 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 35 | LAST_MODIFIED_USER | VARCHAR2(6) | Yes |  |  |
| 36 | DRIVE_SHEET_DATE | DATE | Yes |  |  |
| 37 | MIN_SKILL_RATING | NUMBER(2) | Yes |  |  |
| 38 | SCHEDULE_REMARKS | VARCHAR2(50) | Yes |  |  |
| 39 | OS_OK_FLAG | VARCHAR2(1) | Yes |  |  |
| 40 | CONV_DRIVE_ID | VARCHAR2(10) | Yes |  |  |
| 41 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 42 | INSERT_DATE | DATE | No |  |  |
| 43 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 44 | AUDIT_KEY | NUMBER | No |  |  |
| 45 | SIGNOFF_USER | VARCHAR2(6) | Yes |  |  |
| 46 | SIGNOFF_DATE | DATE | Yes |  |  |
| 47 | SCH_TRAVEL_TIME | NUMBER(3) | Yes |  |  |
| 48 | STAFF_REVIEW_DATE | DATE | Yes |  |  |
| 49 | STAFF_REVIEW_USER | VARCHAR2(6) | Yes |  |  |
| 50 | ACTIVE_STATUS | VARCHAR2(1) | Yes |  |  |
| 51 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 52 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 53 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 54 | EXT_APPL_ID | VARCHAR2(15) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

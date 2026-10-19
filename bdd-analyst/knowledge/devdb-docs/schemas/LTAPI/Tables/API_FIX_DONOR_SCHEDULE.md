---
tags:
  - table
  - LTAPI
---
# API_FIX_DONOR_SCHEDULE

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EVENT_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | SITE_ID | VARCHAR2(10) | No |  |  |
| 4 | SCH_DATE | DATE | No |  |  |
| 5 | DONATION_TYPE | VARCHAR2(5) | No |  |  |
| 6 | PROC_CODE | VARCHAR2(5) | No |  |  |
| 7 | STATUS | VARCHAR2(5) | Yes |  |  |
| 8 | LAST_NAME | VARCHAR2(30) | No |  |  |
| 9 | HOME_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 10 | HOME_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 11 | SCH_FROM_TIME | DATE | Yes |  |  |
| 12 | SCH_TO_TIME | DATE | Yes |  |  |
| 13 | WORK_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 14 | WORK_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 15 | EXTENSION | NUMBER(6) | Yes |  |  |
| 16 | FIRST_NAME | VARCHAR2(25) | No |  |  |
| 17 | MIDDLE_NAME | VARCHAR2(25) | Yes |  |  |
| 18 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 19 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 20 | REMIND_DATE | DATE | Yes |  |  |
| 21 | REMIND_USER | VARCHAR2(6) | Yes |  |  |
| 22 | DATE_OF_BIRTH | DATE | Yes |  |  |
| 23 | CANCEL_CODE | VARCHAR2(5) | Yes |  |  |
| 24 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 25 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 26 | INSERT_DATE | DATE | No |  |  |
| 27 | PREV_SCHD_DATE | DATE | Yes |  |  |
| 28 | AUDIT_KEY | NUMBER | Yes |  |  |
| 29 | EXT_APPL_ID | VARCHAR2(30) | No |  |  |
| 30 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 31 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |

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

---
tags:
  - table
  - LTAPI
---
# API_MOBILE_SCHEDULE

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SCHEDULE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 4 | SITE_ID | VARCHAR2(10) | No |  |  |
| 5 | SCH_DATE | DATE | No |  |  |
| 6 | SCH_TIME | DATE | No |  |  |
| 7 | DONATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 8 | PROCEDURE_GROUP | VARCHAR2(5) | Yes |  |  |
| 9 | STATUS | VARCHAR2(5) | Yes |  |  |
| 10 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 11 | LAST_NAME | VARCHAR2(30) | Yes |  |  |
| 12 | FIRST_NAME | VARCHAR2(30) | Yes |  |  |
| 13 | MIDDLE_NAME | VARCHAR2(25) | Yes |  |  |
| 14 | GENDER | VARCHAR2(1) | Yes |  |  |
| 15 | DATE_OF_BIRTH | DATE | Yes |  |  |
| 16 | HOME_PHONE_NO | VARCHAR2(15) | Yes |  |  |
| 17 | WORK_PHONE_NO | VARCHAR2(15) | Yes |  |  |
| 18 | EXTENSION | NUMBER(6) | Yes |  |  |
| 19 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 20 | REMIND_DATE | DATE | Yes |  |  |
| 21 | REMIND_USER | VARCHAR2(30) | Yes |  |  |
| 22 | CANCEL_CODE | VARCHAR2(5) | Yes |  |  |
| 23 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 24 | INSERT_DATE | DATE | No |  |  |
| 25 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 26 | AUDIT_KEY | NUMBER | Yes |  |  |
| 27 | EXT_APPL_ID | VARCHAR2(15) | No |  |  |
| 28 | TRANSACTION_MODE | VARCHAR2(2) | Yes |  |  |
| 29 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 30 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |

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

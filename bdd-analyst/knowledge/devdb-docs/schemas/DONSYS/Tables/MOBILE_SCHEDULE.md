---
tags:
  - table
  - DONSYS
---
# MOBILE_SCHEDULE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 96
**Last Analyzed**: 2025-09-16 03:13:59
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
| 14 | DATE_OF_BIRTH | DATE | Yes |  |  |
| 15 | HOME_PHONE_NO | VARCHAR2(15) | Yes |  |  |
| 16 | WORK_PHONE_NO | VARCHAR2(15) | Yes |  |  |
| 17 | EXTENSION | NUMBER(6) | Yes |  |  |
| 18 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 19 | REMIND_DATE | DATE | Yes |  |  |
| 20 | REMIND_USER | VARCHAR2(30) | Yes |  |  |
| 21 | CANCEL_CODE | VARCHAR2(5) | Yes |  |  |
| 22 | SEQ_NO | NUMBER | Yes |  |  |
| 23 | SP_CODE | VARCHAR2(5) | Yes |  |  |
| 24 | LAST_MOD_DATE | DATE | Yes |  |  |
| 25 | LST_MOD_USER | VARCHAR2(30) | Yes |  |  |
| 26 | PREV_SCH_DATE | DATE | Yes |  |  |
| 27 | OVER_BOOKED_FLAG | VARCHAR2(1) | Yes |  |  |
| 28 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 29 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 30 | INSERT_DATE | DATE | No |  |  |
| 31 | GENDER | VARCHAR2(1) | Yes |  |  |
| 32 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

**MOBILE_SCHEDULE_PK**: `SCHEDULE_ID, CHAPTER_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| MOBILE_SCHEDULE_DONOR_FK | CHAPTER_ID, DONOR_ID | [[schemas/DONSYS/Tables/DONORS\|DONSYS.DONORS]] (CHAPTER_ID, DONOR_ID) | NO ACTION |
| MOBILE_SCHEDULE_DRIVE_FK | DRIVE_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/DRIVES\|DONSYS.DRIVES]] (DRIVE_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| MOBILE_SCHEDULE_PK | NORMAL | UNIQUE | SCHEDULE_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/MOBILE_SCHEDULE_BI|MOBILE_SCHEDULE_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

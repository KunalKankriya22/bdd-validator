---
tags:
  - table
  - DONSYS
---
# DONOR_SCHEDULE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 10467
**Last Analyzed**: 2025-09-16 03:13:06
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
| 7 | STATUS | VARCHAR2(5) | No |  |  |
| 8 | LAST_NAME | VARCHAR2(30) | No |  |  |
| 9 | EXTENSION | NUMBER(6) | Yes |  |  |
| 10 | HOME_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 11 | HOME_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 12 | SCH_FROM_TIME | DATE | Yes |  |  |
| 13 | SCH_TO_TIME | DATE | Yes |  |  |
| 14 | SURGERY_ID | VARCHAR2(10) | Yes |  |  |
| 15 | WORK_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 16 | WORK_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 17 | FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 18 | MIDDLE_NAME | VARCHAR2(25) | Yes |  |  |
| 19 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 20 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 21 | REMIND_DATE | DATE | Yes |  |  |
| 22 | REMIND_USER | VARCHAR2(6) | Yes |  |  |
| 23 | DATE_OF_BIRTH | DATE | Yes |  |  |
| 24 | CANCEL_CODE | VARCHAR2(5) | Yes |  |  |
| 25 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 26 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 27 | INSERT_DATE | DATE | No |  |  |
| 28 | SEQ_NO | NUMBER | Yes |  |  |
| 29 | SP_CODE | VARCHAR2(5) | Yes |  |  |
| 30 | LAST_MOD_DATE | DATE | Yes |  |  |
| 31 | LAST_MOD_USER | VARCHAR2(6) | Yes |  |  |
| 32 | PREV_SCHD_DATE | DATE | Yes |  |  |
| 33 | CREDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 34 | AUDIT_KEY | NUMBER | Yes |  |  |
| 35 | INTL_HOME_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 36 | INTL_WORK_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 37 | INTL_WORK_PHONE_EXT | VARCHAR2(8) | Yes |  |  |
| 38 | INTL_ADDR_FLAG | VARCHAR2(1) | Yes |  |  |
| 39 | M_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 40 | M_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 41 | PREFERRED_CONTACT_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

**DONOR_SCHEDULE_PK**: `EVENT_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_SCHEDULE_IDX1 | NORMAL | NONUNIQUE | SITE_ID | VALID |
| DONOR_SCHEDULE_IDX2 | NORMAL | NONUNIQUE | LAST_NAME, FIRST_NAME | VALID |
| DONOR_SCHEDULE_IDX3 | NORMAL | NONUNIQUE | SCH_DATE | VALID |
| DONOR_SCHEDULE_N4 | NORMAL | NONUNIQUE | INSERT_USER | VALID |
| DONOR_SCHEDULE_PK | NORMAL | UNIQUE | EVENT_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_SCHEDULE_BI|DONOR_SCHEDULE_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

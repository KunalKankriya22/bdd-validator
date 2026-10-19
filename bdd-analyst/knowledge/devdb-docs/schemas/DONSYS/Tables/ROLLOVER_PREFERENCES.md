---
tags:
  - table
  - DONSYS
---
# ROLLOVER_PREFERENCES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 62
**Last Analyzed**: 2025-09-16 03:14:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SPONSOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | PREF_TYPE | VARCHAR2(5) | Yes |  |  |
| 5 | FAR_OUT_MONTHS | NUMBER(2) | Yes |  |  |
| 6 | PREF_PROJ_DRAW | NUMBER(6) | Yes |  |  |
| 7 | PREF_START_TIME | VARCHAR2(5) | Yes |  |  |
| 8 | PREF_END_TIME | VARCHAR2(5) | Yes |  |  |
| 9 | PREF_DRIVE_TYPE | VARCHAR2(5) | Yes |  |  |
| 10 | PREF_OPEN_DRIVE_IND | VARCHAR2(5) | Yes |  |  |
| 11 | DRIVE_INTERVAL_MONTHS | NUMBER(2) | Yes |  |  |
| 12 | OVERALL_PREF | VARCHAR2(14) | Yes |  |  |
| 13 | MONTH_PREF1 | VARCHAR2(100) | Yes |  |  |
| 14 | MONTH_PREF2 | VARCHAR2(100) | Yes |  |  |
| 15 | MONTH_PREF3 | VARCHAR2(100) | Yes |  |  |
| 16 | MONTH_PREF4 | VARCHAR2(100) | Yes |  |  |
| 17 | MONTH_PREF5 | VARCHAR2(100) | Yes |  |  |
| 18 | MONTH_PREF6 | VARCHAR2(100) | Yes |  |  |
| 19 | MONTH_PREF7 | VARCHAR2(100) | Yes |  |  |
| 20 | MONTH_PREF8 | VARCHAR2(100) | Yes |  |  |
| 21 | MONTH_PREF9 | VARCHAR2(100) | Yes |  |  |
| 22 | MONTH_PREF10 | VARCHAR2(100) | Yes |  |  |
| 23 | MONTH_PREF11 | VARCHAR2(100) | Yes |  |  |
| 24 | MONTH_PREF12 | VARCHAR2(100) | Yes |  |  |
| 25 | NOT_ON_DAY1 | VARCHAR2(3) | Yes |  |  |
| 26 | NOT_ON_DAY2 | VARCHAR2(3) | Yes |  |  |
| 27 | NOT_ON_DAY3 | VARCHAR2(3) | Yes |  |  |
| 28 | NOT_ON_DAY4 | VARCHAR2(3) | Yes |  |  |
| 29 | NOT_ON_DAY5 | VARCHAR2(3) | Yes |  |  |
| 30 | NOT_ON_DAY6 | VARCHAR2(3) | Yes |  |  |
| 31 | NOT_ON_DAY7 | VARCHAR2(3) | Yes |  |  |
| 32 | PREF_FROM_DATE | NUMBER(2) | Yes |  |  |
| 33 | PREF_TO_DATE | NUMBER(2) | Yes |  |  |
| 34 | PREF_PROJ_SHOW | NUMBER(6) | Yes |  |  |
| 35 | PREF_LOCATION_ID | VARCHAR2(10) | Yes |  |  |
| 36 | TERM_DATE | DATE | Yes |  |  |
| 37 | INSERT_DATE | DATE | No |  |  |
| 38 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**ROLLOVER_PREFERENCES_PK**: `SPONSOR_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ROLLOVER_PREFERENCES_PK | NORMAL | UNIQUE | SPONSOR_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/ROLLOVER_PREFERENCES_BI|ROLLOVER_PREFERENCES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

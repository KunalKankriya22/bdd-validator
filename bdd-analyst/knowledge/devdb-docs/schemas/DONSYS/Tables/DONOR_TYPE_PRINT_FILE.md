---
tags:
  - table
  - DONSYS
---
# DONOR_TYPE_PRINT_FILE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:13:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BATCH_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 4 | LAST_NAME | VARCHAR2(30) | No |  |  |
| 5 | FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 6 | MIDDLE_NAME | VARCHAR2(25) | Yes |  |  |
| 7 | STREET_NAME | VARCHAR2(50) | Yes |  |  |
| 8 | SUITE_APT | VARCHAR2(10) | Yes |  |  |
| 9 | CITY | VARCHAR2(40) | Yes |  |  |
| 10 | STATE | VARCHAR2(2) | Yes |  |  |
| 11 | ZIP | VARCHAR2(5) | Yes |  |  |
| 12 | BLOOD_TYPE | VARCHAR2(5) | Yes |  |  |
| 13 | NEXT_ELIG_DATE | DATE | Yes |  |  |
| 14 | NEXT_ELIG_PROC | VARCHAR2(5) | Yes |  |  |
| 15 | DONATION_1 | VARCHAR2(15) | Yes |  |  |
| 16 | COLL_DATE_1 | DATE | Yes |  |  |
| 17 | BP_PULSE_1 | VARCHAR2(15) | Yes |  |  |
| 18 | CHOL_LEVEL_1 | VARCHAR2(5) | Yes |  |  |
| 19 | DONATION_2 | VARCHAR2(15) | Yes |  |  |
| 20 | COLL_DATE_2 | DATE | Yes |  |  |
| 21 | BP_PULSE_2 | VARCHAR2(15) | Yes |  |  |
| 22 | CHOL_LEVEL_2 | VARCHAR2(5) | Yes |  |  |
| 23 | DONATION_3 | VARCHAR2(15) | Yes |  |  |
| 24 | COLL_DATE_3 | DATE | Yes |  |  |
| 25 | BP_PULSE_3 | VARCHAR2(15) | Yes |  |  |
| 26 | CHOL_LEVEL_3 | VARCHAR2(5) | Yes |  |  |
| 27 | DONATION_4 | VARCHAR2(15) | Yes |  |  |
| 28 | COLL_DATE_4 | DATE | Yes |  |  |
| 29 | BP_PULSE_4 | VARCHAR2(15) | Yes |  |  |
| 30 | CHOL_LEVEL_4 | VARCHAR2(5) | Yes |  |  |
| 31 | DONATION_5 | VARCHAR2(15) | Yes |  |  |
| 32 | COLL_DATE_5 | DATE | Yes |  |  |
| 33 | BP_PULSE_5 | VARCHAR2(15) | Yes |  |  |
| 34 | CHOL_LEVEL_5 | VARCHAR2(5) | Yes |  |  |
| 35 | NEXT_WB_DATE | DATE | Yes |  |  |
| 36 | PRINT_DATE | DATE | Yes |  |  |
| 37 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 38 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 39 | INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_TYPE_PRINT_FILE_IDX1 | NORMAL | NONUNIQUE | BATCH_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

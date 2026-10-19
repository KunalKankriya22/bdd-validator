---
tags:
  - table
  - SBCSYS
---
# REMOTE_TEST_BATCH

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 7
**Last Analyzed**: 2025-09-16 03:14:34
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BATCH_ID | VARCHAR2(15) | No |  |  |
| 2 | USER_ID | VARCHAR2(15) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | FROM_COLLECTION_DATE | DATE | Yes |  |  |
| 5 | TO_COLLECTION_DATE | DATE | Yes |  |  |
| 6 | CREATION_DATE | DATE | Yes |  |  |
| 7 | DESTINATION_CODE | VARCHAR2(5) | No |  |  |
| 8 | UNIT_COUNT | NUMBER(6) | Yes |  |  |
| 9 | FILE_NAME | VARCHAR2(60) | Yes |  |  |
| 10 | BATCH_STATUS | VARCHAR2(2) | Yes |  |  |
| 11 | SUBMIT_DATE | DATE | Yes |  |  |
| 12 | PROFILE_TEST | CHAR(1) | Yes |  |  |
| 13 | STAT_TEST | CHAR(1) | Yes |  |  |
| 14 | ADDITIONAL_TEST | CHAR(1) | Yes |  |  |
| 15 | BATCH_TYPE | CHAR(1) | Yes |  |  |
| 16 | RTC_CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

**REMOTE_TEST_BATCH_PK**: `BATCH_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/REMOTE_TEST_UNITS\|SBCSYS.REMOTE_TEST_UNITS]] | BATCH_REMOTE_TEST_UNITS_FK | BATCH_ID → BATCH_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| REMOTE_TEST_BATCH_IDX_1 | NORMAL | UNIQUE | BATCH_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

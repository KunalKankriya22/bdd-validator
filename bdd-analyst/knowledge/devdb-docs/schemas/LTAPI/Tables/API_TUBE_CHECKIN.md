---
tags:
  - table
  - LTAPI
---
# API_TUBE_CHECKIN

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-08-14 03:00:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONTRACT_ID | VARCHAR2(15) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | EXTERNAL_BATCH_ID | VARCHAR2(20) | No |  |  |
| 4 | RECEIVED_DATE | DATE | No |  |  |
| 5 | OS_RED_TUBE | VARCHAR2(16) | Yes |  |  |
| 6 | INT_RED_TUBE | VARCHAR2(16) | Yes |  |  |
| 7 | OS_PURPLE_1 | VARCHAR2(16) | Yes |  |  |
| 8 | INT_PURPLE_1 | VARCHAR2(16) | Yes |  |  |
| 9 | OS_PURPLE_2 | VARCHAR2(16) | Yes |  |  |
| 10 | INT_PURPLE_2 | VARCHAR2(16) | Yes |  |  |
| 11 | COLL_DATE | DATE | No |  |  |
| 12 | INSERT_DATE | DATE | Yes |  |  |
| 13 | PROCESS_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | PROCESSED_DATE | DATE | Yes |  |  |
| 15 | OS_RED_TUBE_2 | VARCHAR2(16) | Yes |  |  |
| 16 | INT_RED_TUBE_2 | VARCHAR2(16) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/LTAPI/Triggers/API_TUBE_CHECKIN_BI|API_TUBE_CHECKIN_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

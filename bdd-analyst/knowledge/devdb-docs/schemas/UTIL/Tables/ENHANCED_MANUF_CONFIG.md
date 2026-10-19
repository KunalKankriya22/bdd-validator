---
tags:
  - table
  - UTIL
---
# ENHANCED_MANUF_CONFIG

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:17
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | PROCESS_START_LOCATION | VARCHAR2(5) | No |  |  |
| 3 | PROCESS_CODE | VARCHAR2(10) | No |  |  |
| 4 | PROCESS_SEQ | NUMBER(2) | No |  |  |
| 5 | DATA_TABLE_NAME_1 | VARCHAR2(30) | No |  |  |
| 6 | DATA_SOURCE_1 | VARCHAR2(30) | Yes |  |  |
| 7 | OPERATOR_1 | VARCHAR2(30) | Yes |  |  |
| 8 | RESPONSE_1 | VARCHAR2(100) | Yes |  |  |
| 9 | DATA_TABLE_NAME_2 | VARCHAR2(30) | Yes |  |  |
| 10 | DATA_SOURCE_2 | VARCHAR2(30) | Yes |  |  |
| 11 | OPERATOR_2 | VARCHAR2(30) | Yes |  |  |
| 12 | RESPONSE_2 | VARCHAR2(100) | Yes |  |  |
| 13 | TARGET_LOC | VARCHAR2(5) | Yes |  |  |
| 14 | TARGET_ACTION | VARCHAR2(30) | No |  |  |
| 15 | TARGET_ACTION_ON | VARCHAR2(30) | Yes |  |  |
| 16 | TARGET_ACTION_VALUE | VARCHAR2(30) | Yes |  |  |
| 17 | TARGET_DATA_TABLE | VARCHAR2(30) | Yes |  |  |
| 18 | TARGET_DATA_SOURCE | VARCHAR2(30) | Yes |  |  |
| 19 | TARGET_OPERATOR | VARCHAR2(10) | Yes |  |  |
| 20 | TARGET_RESPONSE | VARCHAR2(100) | Yes |  |  |
| 21 | ACTION_FUNCTIONS | VARCHAR2(100) | Yes |  |  |
| 22 | INSERT_DATE | DATE | No |  |  |
| 23 | INSERT_USER | VARCHAR2(100) | No |  |  |
| 24 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 25 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/UTIL/Triggers/ENHANCED_MANUF_CONFIG_BU|ENHANCED_MANUF_CONFIG_BU]] — BEFORE EACH ROW UPDATE (ENABLED)
- [[schemas/UTIL/Triggers/UTILENHANCED_MANUF_CONFIG_BD|UTILENHANCED_MANUF_CONFIG_BD]] — BEFORE EACH ROW DELETE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

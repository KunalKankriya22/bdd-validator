---
tags:
  - table
  - DONSYS
---
# RESULT_HOLDING_AREA

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SET_ID | VARCHAR2(14) | No |  |  |
| 2 | TEST_ID | VARCHAR2(10) | No |  |  |
| 3 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 4 | COLL_DATE | DATE | No |  |  |
| 5 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 6 | RESULT_CODE_1 | VARCHAR2(5) | Yes |  |  |
| 7 | RESULT_CODE_2 | VARCHAR2(5) | Yes |  |  |
| 8 | FIRST_TECH | VARCHAR2(6) | Yes |  |  |
| 9 | SECOND_TECH | VARCHAR2(6) | Yes |  |  |
| 10 | RECON_RESULT | VARCHAR2(5) | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**RESULT_HOLDING_AREA_PK**: `SET_ID, TEST_ID, UNIT_ID, COLL_DATE, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RESULT_HOLDING_AREA_PK | NORMAL | UNIQUE | SET_ID, TEST_ID, UNIT_ID, COLL_DATE, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/RESULT_HOLDING_AREA_BI|RESULT_HOLDING_AREA_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

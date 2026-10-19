---
tags:
  - table
  - DONSYS
---
# UNIT_TEST_RESULTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 728494
**Last Analyzed**: 2026-05-17 11:00:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | RESULT_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | ABSORBANCE | VARCHAR2(12) | Yes |  |  |
| 6 | EDIT_VOID_REASON | VARCHAR2(5) | Yes |  |  |
| 7 | SECOND_TECH | VARCHAR2(6) | Yes |  |  |
| 8 | SECOND_DATE | DATE | Yes |  |  |
| 9 | CUT_OFF | VARCHAR2(6) | Yes |  |  |
| 10 | SEGMENT_OD | VARCHAR2(6) | Yes |  |  |
| 11 | SEGMENT_CUT_OFF | VARCHAR2(6) | Yes |  |  |
| 12 | TUBE_OD | VARCHAR2(6) | Yes |  |  |
| 13 | TUBE_CUT_OFF | VARCHAR2(6) | Yes |  |  |
| 14 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 15 | TECH1_INTERPRETATION | VARCHAR2(5) | Yes |  |  |
| 16 | TECH2_INTERPRETATION | VARCHAR2(5) | Yes |  |  |
| 17 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 18 | INSERT_DATE | DATE | No |  |  |
| 19 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 20 | COLL_DATE | DATE | No |  |  |
| 21 | TEST_SEQ_NO | NUMBER(2) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| UNIT_TEST_RESULTS_PK | NORMAL | NONUNIQUE | UNIT_ID, TEST_ID, COLL_DATE, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/UNIT_TEST_RESULTS_BI|UNIT_TEST_RESULTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

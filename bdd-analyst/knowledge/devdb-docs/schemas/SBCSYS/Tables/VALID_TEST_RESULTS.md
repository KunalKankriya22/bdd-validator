---
tags:
  - table
  - SBCSYS
---
# VALID_TEST_RESULTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 974
**Last Analyzed**: 2026-04-24 03:00:09
**Partitioned**: NO

> [!quote] Created from Entity VALID TEST RESULT by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_ID | VARCHAR2(10) | No |  |  |
| 2 | RESULT_STATUS | VARCHAR2(4) | No |  |  |
| 3 | PLATE_SEQ | VARCHAR2(1) | Yes |  |  |
| 4 | INTER_CODE | VARCHAR2(4) | Yes |  |  |
| 5 | VERIFY_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | NUMBER_OF_REPEATS | NUMBER(1) | No |  |  |
| 7 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 8 | ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 9 | CONFIRM_TEST_ID_1 | VARCHAR2(10) | Yes |  |  |
| 10 | CONFIRM_TEST_ID_2 | VARCHAR2(10) | Yes |  |  |
| 11 | EFF_DATE | DATE | No |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |
| 13 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 16 | SECOND_TECH | VARCHAR2(1) | Yes |  |  |
| 17 | AUTO_ONLY | VARCHAR2(1) | Yes |  |  |
| 18 | CONFIRM_TEST_ID_3 | VARCHAR2(10) | Yes |  |  |
| 19 | CONFIRM_TEST_ID_4 | VARCHAR2(10) | Yes |  |  |
| 20 | CONFIRM_TEST_ID_5 | VARCHAR2(10) | Yes |  |  |
| 21 | CONFIRM_TEST_ID_6 | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_TEST_RESULTS_IDX_1 | NORMAL | UNIQUE | TEST_ID, RESULT_STATUS, PLATE_SEQ | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VTEST_RESULTS_BEFORE_DELETE|VTEST_RESULTS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VTEST_RESULTS_INSERT_UPDATE|VTEST_RESULTS_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

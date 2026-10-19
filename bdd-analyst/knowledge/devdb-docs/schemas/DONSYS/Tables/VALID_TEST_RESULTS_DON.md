---
tags:
  - table
  - DONSYS
---
# VALID_TEST_RESULTS_DON

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 286
**Last Analyzed**: 2026-04-25 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | RESULT_CODE | VARCHAR2(5) | No |  |  |
| 4 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | NOTIFICATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 6 | ATTRIB_TABLE | VARCHAR2(30) | Yes |  |  |
| 7 | ATTRIB_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | CONFIRM_TEST1 | VARCHAR2(10) | Yes |  |  |
| 9 | CONFIRM_TEST2 | VARCHAR2(10) | Yes |  |  |
| 10 | CONFIRM_TEST3 | VARCHAR2(10) | Yes |  |  |
| 11 | EFF_DATE | DATE | No |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 14 | INSERT_DATE | DATE | No |  |  |
| 15 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |
| 17 | INTER_CODE_1 | VARCHAR2(5) | Yes |  |  |
| 18 | INTER_CODE_2 | VARCHAR2(5) | Yes |  |  |

## Primary Key

**VALID_TEST_RESULTS_PK**: `TEST_ID, CHAPTER_ID, RESULT_CODE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| RESULTS_VALID_TEST_FK | TEST_ID | [[schemas/DONSYS/Tables/VALID_TESTS_DON\|DONSYS.VALID_TESTS_DON]] (TEST_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_TEST_RESULTS_PK | NORMAL | UNIQUE | TEST_ID, CHAPTER_ID, RESULT_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_TEST_RESULTS_DON_BD|VALID_TEST_RESULTS_DON_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_TEST_RESULTS_DON_BI|VALID_TEST_RESULTS_DON_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_TEST_RESULTS_DON_BU|VALID_TEST_RESULTS_DON_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

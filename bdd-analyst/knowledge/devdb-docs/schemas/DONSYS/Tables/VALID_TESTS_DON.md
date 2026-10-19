---
tags:
  - table
  - DONSYS
---
# VALID_TESTS_DON

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 161
**Last Analyzed**: 2026-03-25 03:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_ID | VARCHAR2(10) | No |  |  |
| 2 | TEST_DESC | VARCHAR2(50) | No |  |  |
| 3 | TEST_SHORT_ID | VARCHAR2(6) | No |  |  |
| 4 | TEST_GROUP | VARCHAR2(5) | Yes |  |  |
| 5 | ANTIGEN_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | ANTIGEN_GROUP | VARCHAR2(1) | Yes |  |  |
| 7 | EDIT_RESULT_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | DISCREPANCY_FLAG | VARCHAR2(1) | Yes |  |  |
| 9 | SERVICE_CODE | VARCHAR2(12) | Yes |  |  |
| 10 | TESTING_CHARGES_CURR | NUMBER(6,2) | Yes |  |  |
| 11 | TESTING_CHARGES_NEW | NUMBER(6,2) | Yes |  |  |
| 12 | IMPLEMENT_DATS | DATE | Yes |  |  |
| 13 | VIEW_LEVEL | NUMBER(4) | Yes |  |  |
| 14 | MANUAL_ENTRY_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | EFF_DATE | DATE | No |  |  |
| 16 | TERM_DATE | DATE | Yes |  |  |
| 17 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 18 | INSERT_DATE | DATE | No |  |  |
| 19 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 20 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_TESTS_PK**: `TEST_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/DONSYS/Tables/VALID_TEST_RESULTS_DON\|DONSYS.VALID_TEST_RESULTS_DON]] | RESULTS_VALID_TEST_FK | TEST_ID → TEST_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_TESTS_PK | NORMAL | UNIQUE | TEST_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_TESTS_DON_BD|VALID_TESTS_DON_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_TESTS_DON_BI|VALID_TESTS_DON_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_TESTS_DON_BU|VALID_TESTS_DON_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

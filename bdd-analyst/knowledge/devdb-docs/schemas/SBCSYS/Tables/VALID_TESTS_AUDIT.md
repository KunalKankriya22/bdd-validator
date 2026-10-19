---
tags:
  - table
  - SBCSYS
---
# VALID_TESTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1634
**Last Analyzed**: 2025-09-16 03:16:02
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 2 | TEST_DESC | VARCHAR2(50) | Yes |  |  |
| 3 | TEST_SHORT_ID | VARCHAR2(6) | Yes |  |  |
| 4 | TEST_GROUP | VARCHAR2(5) | Yes |  |  |
| 5 | ANTIGEN_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | EDIT_RESULT_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | DISCREPANCY_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | EFF_DATE | DATE | Yes |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 14 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 15 | SERVICE_CODE | VARCHAR2(12) | Yes |  |  |
| 16 | TESTING_CHARGES_CURR | NUMBER(6,2) | Yes |  |  |
| 17 | TESTING_CHARGES_NEW | NUMBER(6,2) | Yes |  |  |
| 18 | IMPLEMENT_DATS | DATE | Yes |  |  |
| 19 | NO_OF_TECH | NUMBER(1) | Yes |  |  |
| 20 | FULL_TECH_2 | VARCHAR2(1) | Yes |  |  |
| 21 | AUTO_SCHEDULE | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_TESTS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

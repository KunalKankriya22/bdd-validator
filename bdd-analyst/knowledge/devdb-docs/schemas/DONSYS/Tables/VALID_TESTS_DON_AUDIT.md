---
tags:
  - table
  - DONSYS
---
# VALID_TESTS_DON_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1431
**Last Analyzed**: 2025-09-16 03:14:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 6 | TEST_DESC | VARCHAR2(50) | Yes |  |  |
| 7 | TEST_SHORT_ID | VARCHAR2(6) | Yes |  |  |
| 8 | TEST_GROUP | VARCHAR2(5) | Yes |  |  |
| 9 | ANTIGEN_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | EDIT_RESULT_FLAG | VARCHAR2(1) | Yes |  |  |
| 11 | DISCREPANCY_FLAG | VARCHAR2(1) | Yes |  |  |
| 12 | SERVICE_CODE | VARCHAR2(12) | Yes |  |  |
| 13 | TESTING_CHARGES_CURR | NUMBER(6,2) | Yes |  |  |
| 14 | TESTING_CHARGES_NEW | NUMBER(6,2) | Yes |  |  |
| 15 | IMPLEMENT_DATS | DATE | Yes |  |  |
| 16 | VIEW_LEVEL | NUMBER(4) | Yes |  |  |
| 17 | MANUAL_ENTRY_FLAG | VARCHAR2(1) | Yes |  |  |
| 18 | EFF_DATE | DATE | Yes |  |  |
| 19 | TERM_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

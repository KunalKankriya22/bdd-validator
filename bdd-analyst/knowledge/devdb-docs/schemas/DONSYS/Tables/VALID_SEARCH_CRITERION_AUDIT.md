---
tags:
  - table
  - DONSYS
---
# VALID_SEARCH_CRITERION_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1251
**Last Analyzed**: 2025-09-16 03:14:17
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | CRITERION_NAME | VARCHAR2(25) | Yes |  |  |
| 6 | V_TABLE_NAME | VARCHAR2(32) | Yes |  |  |
| 7 | V_COLUMN_NAME | VARCHAR2(32) | Yes |  |  |
| 8 | DEFAULT_OP | VARCHAR2(10) | Yes |  |  |
| 9 | ENLISTMENT_TYPE | VARCHAR2(5) | Yes |  |  |
| 10 | CRITERION_DATATYPE | VARCHAR2(1) | Yes |  |  |
| 11 | LOV_TITLE | VARCHAR2(30) | Yes |  |  |
| 12 | LOV_SQL | VARCHAR2(2000) | Yes |  |  |
| 13 | DESC_HINT_TEXT | VARCHAR2(100) | Yes |  |  |
| 14 | EFF_DATE | DATE | Yes |  |  |
| 15 | TERM_DATE | DATE | Yes |  |  |

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

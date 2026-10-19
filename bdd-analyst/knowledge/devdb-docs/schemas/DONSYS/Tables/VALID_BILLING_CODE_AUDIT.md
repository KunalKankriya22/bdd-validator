---
tags:
  - table
  - DONSYS
---
# VALID_BILLING_CODE_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | CODE | VARCHAR2(10) | Yes |  |  |
| 6 | CODE_TYPE | VARCHAR2(5) | Yes |  |  |
| 7 | DESCRIPTION | VARCHAR2(50) | Yes |  |  |
| 8 | CHARGES | NUMBER(8,2) | Yes |  |  |
| 9 | SORT_SEQ_1 | NUMBER(3) | Yes |  |  |
| 10 | SORT_SEQ_2 | NUMBER(3) | Yes |  |  |
| 11 | BILLING_CODE | VARCHAR2(10) | Yes |  |  |
| 12 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 13 | EFF_DATE | DATE | Yes |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |

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

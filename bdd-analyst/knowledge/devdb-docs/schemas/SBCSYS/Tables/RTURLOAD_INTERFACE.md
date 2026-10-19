---
tags:
  - table
  - SBCSYS
---
# RTURLOAD_INTERFACE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3127331
**Last Analyzed**: 2025-09-16 03:14:38
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RUN_ID | VARCHAR2(500) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | OS_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 4 | TEST_ID | VARCHAR2(15) | Yes |  |  |
| 5 | TEST_SEQ_NO | VARCHAR2(1) | Yes |  |  |
| 6 | RESULT_STATUS | VARCHAR2(10) | Yes |  |  |
| 7 | RESULT_STATUS_1 | VARCHAR2(10) | Yes |  |  |
| 8 | RESULT_STATUS_2 | VARCHAR2(10) | Yes |  |  |
| 9 | RESULT_STATUS_3 | VARCHAR2(10) | Yes |  |  |
| 10 | UPLOADED_FLAG | VARCHAR2(1) | Yes |  |  |
| 11 | UPLOADED_DATE | DATE | Yes |  |  |

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

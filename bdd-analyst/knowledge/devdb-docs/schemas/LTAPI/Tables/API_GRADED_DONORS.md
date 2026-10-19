---
tags:
  - table
  - LTAPI
---
# API_GRADED_DONORS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 20
**Last Analyzed**: 2025-10-21 03:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 4 | DGM_ID | NUMBER(4) | No |  |  |
| 5 | POTENTIAL_DUPLICATE_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 10 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 11 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 12 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 13 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 14 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 15 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |
| 16 | AUDIT_KEY | NUMBER | Yes |  |  |

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

---
tags:
  - table
  - LTAPI
---
# API_DONOR_HHQ_HISTORY

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 208
**Last Analyzed**: 2025-10-25 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 2 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 3 | CALC_AF_QTYPE | VARCHAR2(1) | Yes |  |  |
| 4 | ACTUAL_AF_QTYPE | VARCHAR2(1) | Yes |  |  |
| 5 | RESET_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | COMMENTS | VARCHAR2(500) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 8 | INSERT_DATE | DATE | Yes |  |  |
| 9 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | ONLINE_ID | VARCHAR2(15) | Yes |  |  |
| 12 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 13 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 14 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 15 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 16 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 17 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 18 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONOR_HHQ_HISTORY_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

---
tags:
  - table
  - LTAPI
---
# API_DONATION_INTERDICTIONS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 103
**Last Analyzed**: 2025-10-25 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 4 | INTER_TYPE | VARCHAR2(5) | Yes |  |  |
| 5 | SOURCE_CODE | VARCHAR2(10) | Yes |  |  |
| 6 | RELEASE_USER | VARCHAR2(6) | Yes |  |  |
| 7 | RELEASE_DATE | DATE | Yes |  |  |
| 8 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 9 | TERM_REASON | VARCHAR2(5) | Yes |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | GROUP_ID | VARCHAR2(15) | Yes |  |  |
| 12 | ORIGINATED_FROM | VARCHAR2(10) | Yes |  |  |
| 13 | REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 14 | GROUP_MODE | VARCHAR2(5) | Yes |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 16 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 17 | INSERT_DATE | DATE | Yes |  |  |
| 18 | COLL_DATE | DATE | Yes |  |  |
| 19 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 20 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 21 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 22 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 23 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 24 | AUDIT_KEY | NUMBER | Yes |  |  |
| 25 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 26 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 27 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONATION_INTERDICTIONS_I1 | NORMAL | NONUNIQUE | TRANSACTION_ID | VALID |
| API_DONATION_INTERDICTIONS_I2 | NORMAL | NONUNIQUE | UNIT_ID | VALID |
| API_DONATION_INTERDICTIONS_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

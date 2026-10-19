---
tags:
  - table
  - LTAPI
---
# API_DONOR_COMMUNICATIONS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | COM_CODE | VARCHAR2(5) | No |  |  |
| 4 | COM_DATE | DATE | No |  |  |
| 5 | COM_TYPE | VARCHAR2(5) | No |  |  |
| 6 | COM_DESC | VARCHAR2(2000) | Yes |  |  |
| 7 | ACTION_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | TARGET_DATE | DATE | Yes |  |  |
| 9 | ACTION_DATE | DATE | Yes |  |  |
| 10 | REQUEST_CODE | VARCHAR2(5) | Yes |  |  |
| 11 | LETTER_ID | VARCHAR2(10) | Yes |  |  |
| 12 | STAFF_NO | VARCHAR2(6) | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 14 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 15 | INSERT_DATE | DATE | No |  |  |
| 16 | AUDIT_KEY | NUMBER | Yes |  |  |
| 17 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 18 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 19 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 20 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 21 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 22 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 23 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONOR_COMMUNICATIONS_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

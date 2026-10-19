---
tags:
  - table
  - LTAPI
---
# API_DONOR_SURVEY_RESP_HDR

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 26
**Last Analyzed**: 2025-05-03 03:01:00
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SURVEY_ID | VARCHAR2(30) | No |  |  |
| 2 | TEMPLATE_ID | VARCHAR2(10) | No |  |  |
| 3 | SURVEY_START | DATE | Yes |  |  |
| 4 | SURVEY_END | DATE | Yes |  |  |
| 5 | INSERT_DATE | DATE | No |  |  |
| 6 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 10 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 11 | DRIVE_ID | VARCHAR2(10) | Yes |  |  |
| 12 | TRANSACTION_MODE | VARCHAR2(2) | Yes |  |  |
| 13 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 14 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 15 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 16 | TYPE_OF_SURVEY | VARCHAR2(5) | Yes |  |  |
| 17 | SURVEY_DATE | DATE | Yes |  |  |
| 18 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 19 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 20 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |
| 21 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONOR_SURVEY_RESP_HDR_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

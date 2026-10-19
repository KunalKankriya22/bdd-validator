---
tags:
  - table
  - LTAPI
---
# API_DONOR_SURVEY_RESP_DET

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 303
**Last Analyzed**: 2025-05-03 03:01:01
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SURVEY_ID | VARCHAR2(30) | No |  |  |
| 2 | QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 3 | ANSWER_CODE | VARCHAR2(10) | No |  |  |
| 4 | ANSWER_COMMENTS | VARCHAR2(500) | Yes |  |  |
| 5 | RESPONSE_TYPE | VARCHAR2(1) | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | RANK_CODE | VARCHAR2(5) | Yes |  |  |
| 11 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 12 | TRANSACTION_MODE | VARCHAR2(2) | Yes |  |  |
| 13 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 14 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 15 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 16 | TEMPLATE_ID | VARCHAR2(10) | Yes |  |  |
| 17 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 18 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 19 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONOR_SURVEY_RESP_DET_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

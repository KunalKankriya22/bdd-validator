---
tags:
  - table
  - LTAPI
---
# API_HEALTH_HISTORY

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4858
**Last Analyzed**: 2025-10-21 03:00:21
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | QUESTION_CODE | VARCHAR2(10) | Yes |  |  |
| 4 | ANSWER_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | RESPONSE | VARCHAR2(1) | Yes |  |  |
| 6 | TEMPLATE_ID | VARCHAR2(10) | Yes |  |  |
| 7 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | DEFERRAL_PERIOD | NUMBER(4) | Yes |  |  |
| 9 | PERIOD_TYPE | VARCHAR2(8) | Yes |  |  |
| 10 | INCIDENT_DATE | DATE | Yes |  |  |
| 11 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 12 | DEF_THRU_DATE | DATE | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 14 | INSERT_DATE | DATE | Yes |  |  |
| 15 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 16 | AUDIT_KEY | NUMBER | Yes |  |  |
| 17 | DONOR_RESP_LANG | VARCHAR2(2) | Yes |  |  |
| 18 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 19 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 20 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 21 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 22 | GROUP_CODE | VARCHAR2(30) | Yes |  |  |
| 23 | START_DATE | DATE | Yes |  |  |
| 24 | END_DATE | DATE | Yes |  |  |
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
| API_HEALTH_HISTORY_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

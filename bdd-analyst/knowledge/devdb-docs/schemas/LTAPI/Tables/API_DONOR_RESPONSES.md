---
tags:
  - table
  - LTAPI
---
# API_DONOR_RESPONSES

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 2 | QUESTION_CODE | VARCHAR2(10) | Yes |  |  |
| 3 | DONOR_RESPONSE | VARCHAR2(1) | Yes |  |  |
| 4 | CHECK_REQD | VARCHAR2(1) | Yes |  |  |
| 5 | RES_CNG_FLG | VARCHAR2(1) | Yes |  |  |
| 6 | SIGNOFF_USERID | VARCHAR2(30) | Yes |  |  |
| 7 | RESP_COMPLETED_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | DONOR_RESP_LANG | VARCHAR2(2) | Yes |  |  |
| 9 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 10 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 11 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 12 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |

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

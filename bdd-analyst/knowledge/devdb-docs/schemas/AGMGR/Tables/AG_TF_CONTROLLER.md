---
tags:
  - table
  - AGMGR
---
# AG_TF_CONTROLLER

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 7
**Last Analyzed**: 2025-10-01 03:00:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | JOB_DATE | DATE | Yes |  |  |
| 2 | JOB_ID | NUMBER | No |  |  |
| 3 | ERROR_CNT | NUMBER | Yes |  |  |
| 4 | SUCCESS_CNT | NUMBER | Yes |  |  |
| 5 | UNTIL_DATE | DATE | Yes |  |  |
| 6 | TF_FROM_DATE | DATE | Yes |  |  |
| 7 | TF_TO_DATE | DATE | Yes |  |  |
| 8 | TF_ADD_RECORDS_CNT | NUMBER | Yes |  |  |
| 9 | TF_CANCEL_RECORDS_CNT | NUMBER | Yes |  |  |
| 10 | JOB_ERROR | VARCHAR2(2000) | Yes |  |  |
| 11 | EXTRACT_STATUS | VARCHAR2(1) | Yes |  |  |
| 12 | UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |

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

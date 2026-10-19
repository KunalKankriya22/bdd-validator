---
tags:
  - table
  - DONSYS
---
# DONOR_RESPONSES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 64065
**Last Analyzed**: 2025-09-16 03:13:06
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 3 | DONOR_RESPONSE | VARCHAR2(1) | Yes |  |  |
| 4 | CHECK_REQD | VARCHAR2(1) | Yes |  |  |
| 5 | RES_CNG_FLG | VARCHAR2(1) | Yes |  |  |
| 6 | SIGNOFF_USERID | VARCHAR2(30) | Yes |  |  |
| 7 | RESP_COMPLETED_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | DONOR_RESP_LANG | VARCHAR2(2) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_RESPONSES_IDX1 | NORMAL | NONUNIQUE | TRANSACTION_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

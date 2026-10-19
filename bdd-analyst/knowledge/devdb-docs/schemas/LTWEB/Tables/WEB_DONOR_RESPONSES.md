---
tags:
  - table
  - LTWEB
---
# WEB_DONOR_RESPONSES

**Schema**: [[schemas/LTWEB/LTWEB|LTWEB]]
**Tablespace**: BC_DATA
**Estimated Rows**: 742
**Last Analyzed**: 2025-10-21 03:00:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ONLINE_ID | VARCHAR2(15) | Yes |  |  |
| 2 | QUESTION_CODE | VARCHAR2(10) | Yes |  |  |
| 3 | DONOR_RESPONSE | VARCHAR2(1) | Yes |  |  |
| 4 | CHECK_REQD | VARCHAR2(1) | Yes |  |  |
| 5 | RES_CNG_FLG | VARCHAR2(1) | Yes |  |  |
| 6 | RESP_COMPLETED_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | INSERT_DATE | DATE | Yes |  |  |
| 8 | SORT_SEQUENCE | VARCHAR2(5) | Yes |  |  |
| 9 | QUESTION_DESCRIPTION | VARCHAR2(1000) | Yes |  |  |
| 10 | DISPLAY | VARCHAR2(1) | Yes |  |  |
| 11 | PARENT_QUESTION_CODE | VARCHAR2(10) | Yes |  |  |
| 12 | SUB_QUESTION_FLAG | VARCHAR2(1) | Yes |  |  |
| 13 | GENDER | VARCHAR2(1) | Yes |  |  |
| 14 | TEMPLATE_ID | VARCHAR2(10) | Yes |  |  |
| 15 | READ_MORE_DESC | VARCHAR2(1000) | Yes |  |  |
| 16 | READ_MORE_FLAG | VARCHAR2(1) | Yes |  |  |
| 17 | PARENT_RESP_FLAG | VARCHAR2(1) | Yes |  |  |

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

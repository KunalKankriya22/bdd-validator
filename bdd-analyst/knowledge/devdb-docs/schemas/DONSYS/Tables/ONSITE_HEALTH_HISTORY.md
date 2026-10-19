---
tags:
  - table
  - DONSYS
---
# ONSITE_HEALTH_HISTORY

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 191924
**Last Analyzed**: 2025-11-14 04:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(20) | Yes |  |  |
| 2 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | DONATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 5 | QUES_CODE | VARCHAR2(10) | Yes |  |  |
| 6 | QUES_DESC | VARCHAR2(1000) | Yes |  |  |
| 7 | QUES_DESC_ABBR | VARCHAR2(1000) | Yes |  |  |
| 8 | DISPLAY_ORDER | NUMBER | Yes |  |  |
| 9 | SUB_QUESTION_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | PARENT_QUESTION_CODE | VARCHAR2(10) | Yes |  |  |
| 11 | EXCEPTIONS_FLAG | VARCHAR2(1) | Yes |  |  |
| 12 | ABBR_FLAG | VARCHAR2(1) | Yes |  |  |
| 13 | NEW_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | RESP_CHANGE_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | SHOW_PREV_ANSWERS | VARCHAR2(1) | Yes |  |  |
| 16 | INSERT_DATE | DATE | Yes |  |  |
| 17 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 18 | TEMPLATE_ID | VARCHAR2(10) | Yes |  |  |
| 19 | PARENT_RESP_FLAG | VARCHAR2(1) | Yes |  |  |
| 20 | ABBR_DISPLAY_ORDER | NUMBER | Yes |  |  |

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

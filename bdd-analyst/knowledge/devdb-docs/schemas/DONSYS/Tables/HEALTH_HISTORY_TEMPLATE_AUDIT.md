---
tags:
  - table
  - DONSYS
---
# HEALTH_HISTORY_TEMPLATE_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 23116
**Last Analyzed**: 2025-09-16 03:13:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | TEMPLATE_ID | VARCHAR2(10) | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | QUESTION_CODE | VARCHAR2(10) | Yes |  |  |
| 8 | DONATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 9 | GENDER | VARCHAR2(1) | Yes |  |  |
| 10 | QUESTION_DESCRIPTION | VARCHAR2(1000) | Yes |  |  |
| 11 | VALID_CODE_TYPE | VARCHAR2(5) | Yes |  |  |
| 12 | SORT_SEQUENCE | VARCHAR2(7) | Yes |  |  |
| 13 | EFF_DATE | DATE | Yes |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |
| 15 | SCREENER_ASK | VARCHAR2(1) | Yes |  |  |
| 16 | SUB_QUESTION_FLAG | VARCHAR2(1) | Yes |  |  |
| 17 | PARENT_QUESTION_CODE | VARCHAR2(10) | Yes |  |  |
| 18 | DISPLAY_ORDER | NUMBER | Yes |  |  |
| 19 | REPEAT_HH_FLAG | VARCHAR2(1) | Yes |  |  |
| 20 | RANDOMIZATION_FLAG | VARCHAR2(1) | Yes |  |  |
| 21 | ABBR_FLAG | VARCHAR2(1) | Yes |  |  |
| 22 | PARENT_RESP_FLAG | VARCHAR2(1) | Yes |  |  |
| 23 | GOTO_NOTES | VARCHAR2(100) | Yes |  |  |
| 24 | ABBR_DISP_SEQ | NUMBER | Yes |  |  |

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

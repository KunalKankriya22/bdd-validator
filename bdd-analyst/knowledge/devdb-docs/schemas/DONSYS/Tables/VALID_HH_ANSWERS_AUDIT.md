---
tags:
  - table
  - DONSYS
---
# VALID_HH_ANSWERS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 115948
**Last Analyzed**: 2025-09-16 03:14:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 6 | QUESTION_CODE | VARCHAR2(10) | Yes |  |  |
| 7 | ANSWER_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | RESPONSE | VARCHAR2(1) | Yes |  |  |
| 9 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 10 | DEFERRAL_PERIOD | NUMBER(4) | Yes |  |  |
| 11 | PERIOD_TYPE | VARCHAR2(8) | Yes |  |  |
| 12 | MINIMUM_PERIOD | NUMBER(4) | Yes |  |  |
| 13 | ANSWER_DESC | VARCHAR2(1000) | Yes |  |  |
| 14 | EFF_DATE | DATE | Yes |  |  |
| 15 | TERM_DATE | DATE | Yes |  |  |
| 16 | COMMENT_REQ | VARCHAR2(1) | Yes |  |  |
| 17 | MANUAL_AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 18 | GROUP_CODE | VARCHAR2(30) | Yes |  |  |
| 19 | ADDITIONAL_DATE_FLAG | VARCHAR2(1) | Yes |  |  |
| 20 | VARIABLE_DATE | VARCHAR2(1) | Yes |  |  |
| 21 | DATE_PERIOD_TYPE | VARCHAR2(10) | Yes |  |  |
| 22 | DATE_PERIOD_NUMBER | NUMBER | Yes |  |  |

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

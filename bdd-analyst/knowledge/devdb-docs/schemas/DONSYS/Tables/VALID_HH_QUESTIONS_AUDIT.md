---
tags:
  - table
  - DONSYS
---
# VALID_HH_QUESTIONS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2328
**Last Analyzed**: 2025-09-16 03:14:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | QUESTION_CODE | VARCHAR2(10) | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | GENDER | VARCHAR2(1) | Yes |  |  |
| 8 | QUESTION_DESCRIPTION | VARCHAR2(1000) | Yes |  |  |
| 9 | EFF_DATE | DATE | Yes |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | REF_CODE | VARCHAR2(10) | Yes |  |  |
| 12 | READ_MORE_FLAG | VARCHAR2(1) | Yes |  |  |
| 13 | MANUAL_AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | MANUAL_AUDIT_HIST_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | VARIABLE_DATE | VARCHAR2(1) | Yes |  |  |
| 16 | DATE_PERIOD_TYPE | VARCHAR2(10) | Yes |  |  |
| 17 | DATE_PERIOD_NUMBER | NUMBER | Yes |  |  |

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

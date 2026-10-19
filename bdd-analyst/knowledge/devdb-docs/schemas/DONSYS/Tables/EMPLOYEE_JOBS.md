---
tags:
  - table
  - DONSYS
---
# EMPLOYEE_JOBS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 971
**Last Analyzed**: 2025-09-16 03:13:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | STAFF_NO | VARCHAR2(6) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | JOB_CODE | VARCHAR2(5) | No |  |  |
| 4 | SKILL_RATING | NUMBER(2) | Yes |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**EMPLOYEE_JOBS_PK**: `STAFF_NO, CHAPTER_ID, JOB_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EMPLOYEE_JOBS_PK | NORMAL | UNIQUE | STAFF_NO, CHAPTER_ID, JOB_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/EMPLOYEE_JOBS_BI|EMPLOYEE_JOBS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

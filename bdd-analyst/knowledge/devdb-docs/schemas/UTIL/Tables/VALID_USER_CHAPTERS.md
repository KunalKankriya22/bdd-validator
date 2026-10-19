---
tags:
  - table
  - UTIL
---
# VALID_USER_CHAPTERS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 328
**Last Analyzed**: 2026-05-14 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | USER_ID | VARCHAR2(10) | Yes |  |  |
| 3 | EFF_DATE | DATE | Yes |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 6 | INSERT_DATE | DATE | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 8 | DEFAULT_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/UTIL/Triggers/VALID_USER_CHAPTERS_BI|VALID_USER_CHAPTERS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

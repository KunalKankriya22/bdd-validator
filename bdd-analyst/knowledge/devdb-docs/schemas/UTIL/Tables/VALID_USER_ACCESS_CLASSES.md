---
tags:
  - table
  - UTIL
---
# VALID_USER_ACCESS_CLASSES

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1636
**Last Analyzed**: 2026-02-05 04:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | USER_ID | VARCHAR2(6) | No |  |  |
| 2 | ACCESS_CLASS | VARCHAR2(5) | No |  |  |
| 3 | INSERT_DATE | DATE | No |  |  |
| 4 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 5 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 6 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | INTER_LEVEL | NUMBER | Yes |  |  |

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

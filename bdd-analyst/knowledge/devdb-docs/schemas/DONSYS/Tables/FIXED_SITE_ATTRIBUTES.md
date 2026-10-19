---
tags:
  - table
  - DONSYS
---
# FIXED_SITE_ATTRIBUTES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 145
**Last Analyzed**: 2025-09-16 03:13:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SITE_ID | VARCHAR2(10) | No |  |  |
| 2 | SP_CODE | VARCHAR2(5) | Yes |  |  |
| 3 | SP_VALUE | NUMBER(5) | Yes |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | DESCRIPTION | VARCHAR2(50) | No |  |  |

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

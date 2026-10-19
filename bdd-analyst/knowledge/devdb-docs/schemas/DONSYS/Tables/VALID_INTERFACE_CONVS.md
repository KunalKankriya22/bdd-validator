---
tags:
  - table
  - DONSYS
---
# VALID_INTERFACE_CONVS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 7
**Last Analyzed**: 2025-09-16 03:14:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | CODE_TYPE | VARCHAR2(5) | Yes |  |  |
| 3 | LT_CODE | VARCHAR2(50) | Yes |  |  |
| 4 | LT_CODE_LEN | NUMBER | Yes |  |  |
| 5 | ST_CODE | VARCHAR2(50) | Yes |  |  |
| 6 | ST_CODE_LEN | NUMBER | Yes |  |  |
| 7 | EFF_DATE | DATE | Yes |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 10 | MODIFIED_BY | VARCHAR2(6) | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | Yes |  |  |

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

---
tags:
  - table
  - DONSYS
---
# VALID_ACL_CODES_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 16282
**Last Analyzed**: 2025-09-16 03:14:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | ACCESS_CLASS | VARCHAR2(5) | Yes |  |  |
| 6 | ACCESS_CODE_TYPE | VARCHAR2(5) | Yes |  |  |
| 7 | ACCESS_CODE_VALUE | VARCHAR2(10) | Yes |  |  |
| 8 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 9 | EFF_DATE | DATE | Yes |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |

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

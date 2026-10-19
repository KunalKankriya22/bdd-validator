---
tags:
  - table
  - DONSYS
---
# VALID_TERRITORIES_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 510
**Last Analyzed**: 2025-09-16 03:14:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | TERRITORY_ID | VARCHAR2(10) | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | TERRITORY_NAME | VARCHAR2(150) | Yes |  |  |
| 8 | TERRITORY_GROUP | VARCHAR2(5) | Yes |  |  |
| 9 | TERRITORY_TYPE | VARCHAR2(5) | Yes |  |  |
| 10 | TERRITORY_SHORT_NAME | VARCHAR2(10) | Yes |  |  |
| 11 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 12 | EFF_DATE | DATE | Yes |  |  |
| 13 | TERM_DATE | DATE | Yes |  |  |

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

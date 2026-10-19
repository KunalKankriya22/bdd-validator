---
tags:
  - table
  - SBCSYS
---
# ARC_PARMS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1
**Last Analyzed**: 2025-09-16 03:14:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | EXT_CONF | VARCHAR2(1) | Yes |  |  |
| 3 | EXT_ANTIGEN_PEND | VARCHAR2(1) | Yes |  |  |
| 4 | EXT_CMV | VARCHAR2(1) | Yes |  |  |
| 5 | SHIP_MIN_DAYS | NUMBER | Yes |  |  |
| 6 | EXT_ALL | VARCHAR2(1) | Yes |  |  |
| 7 | SERV_RETN_PERIOD | NUMBER(4) | Yes |  |  |

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

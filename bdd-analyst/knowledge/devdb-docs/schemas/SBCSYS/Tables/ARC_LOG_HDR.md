---
tags:
  - table
  - SBCSYS
---
# ARC_LOG_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | SESSION_ID | VARCHAR2(11) | Yes |  |  |
| 3 | START_DATE | DATE | Yes |  |  |
| 4 | END_DATE | DATE | Yes |  |  |
| 5 | RECS_IN_SESSION | NUMBER | Yes |  |  |
| 6 | SESSION_USER | VARCHAR2(6) | Yes |  |  |
| 7 | VERIF_STATUS | VARCHAR2(1) | Yes |  |  |
| 8 | VERIF_DATE | DATE | Yes |  |  |
| 9 | VERIF_USER | VARCHAR2(6) | Yes |  |  |
| 10 | ACTUAL_RECS | NUMBER | Yes |  |  |
| 11 | DELETE_DATE | DATE | Yes |  |  |
| 12 | RECS_DELETED | NUMBER | Yes |  |  |
| 13 | DELETE_USER | VARCHAR2(6) | Yes |  |  |
| 14 | EXT_CONF | VARCHAR2(1) | Yes |  |  |
| 15 | EXT_ANTIGEN_PEND | VARCHAR2(1) | Yes |  |  |
| 16 | EXT_CMV | VARCHAR2(1) | Yes |  |  |
| 17 | SHIP_MIN_DAYS | NUMBER | Yes |  |  |
| 18 | EXT_ALL | VARCHAR2(1) | Yes |  |  |

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

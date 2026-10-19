---
tags:
  - table
  - SBCSYS
---
# ARC_TIME_DEPENDANT_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | START_DATE | DATE | Yes |  |  |
| 2 | END_DATE | DATE | Yes |  |  |
| 3 | ARCHIVED_UPTO | DATE | Yes |  |  |
| 4 | ARCHIVED_USER | VARCHAR2(6) | Yes |  |  |
| 5 | DELETED_UPTO | DATE | Yes |  |  |
| 6 | DELETED_USER | VARCHAR2(6) | Yes |  |  |
| 7 | VERIF_USER | VARCHAR2(6) | Yes |  |  |
| 8 | VERIF_STATUS | VARCHAR2(1) | Yes |  |  |
| 9 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 10 | SESSION_ID | VARCHAR2(11) | Yes |  |  |

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

---
tags:
  - table
  - SRVSYS
---
# SERV_ARC_LOG_HDR

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(11) | No |  |  |
| 2 | START_DATE | DATE | No |  |  |
| 3 | END_DATE | DATE | No |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 5 | RECS_IN_SESSION | NUMBER | Yes |  |  |
| 6 | SESSION_USER | VARCHAR2(6) | Yes |  |  |
| 7 | VERIF_STATUS | VARCHAR2(1) | Yes |  |  |
| 8 | VERIF_DATS | DATE | Yes |  |  |
| 9 | VERIF_USER | VARCHAR2(6) | Yes |  |  |
| 10 | ACTUAL_RECS | NUMBER | Yes |  |  |
| 11 | DELETE_DATE | DATE | Yes |  |  |
| 12 | RECS_DELETED | NUMBER | Yes |  |  |
| 13 | DELETE_USER | VARCHAR2(6) | Yes |  |  |
| 14 | TIME_DEPEND_ARCHIVE_UPTO | DATE | Yes |  |  |
| 15 | TIME_DEPEND_DELETE_UPTO | DATE | Yes |  |  |

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

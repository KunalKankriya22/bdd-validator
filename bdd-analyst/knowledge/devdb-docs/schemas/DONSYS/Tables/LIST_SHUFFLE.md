---
tags:
  - table
  - DONSYS
---
# LIST_SHUFFLE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:13:57
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | LIST_ID | VARCHAR2(10) | Yes |  |  |
| 4 | CALL_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | CALLED_USER | VARCHAR2(6) | Yes |  |  |
| 6 | CALL_DATE | DATE | Yes |  |  |
| 7 | SCHED_USER | VARCHAR2(6) | Yes |  |  |
| 8 | SCHED_DATE | DATE | Yes |  |  |
| 9 | LOCKED_BY | VARCHAR2(6) | Yes |  |  |
| 10 | CALL_AFTER | DATE | Yes |  |  |
| 11 | CONTACT_FLAG | VARCHAR2(1) | Yes |  |  |
| 12 | LAST_BROWSE | DATE | Yes |  |  |
| 13 | CALL_FLAG1 | VARCHAR2(10) | Yes |  |  |
| 14 | CALL_FLAG2 | VARCHAR2(10) | Yes |  |  |
| 15 | LROWNUM | NUMBER | Yes |  |  |

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

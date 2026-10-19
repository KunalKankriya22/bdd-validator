---
tags:
  - table
  - DONSYS
---
# REP_SNAP_STATUS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SNAPSITE_ID | VARCHAR2(30) | No |  |  |
| 2 | SNAPSITE_DESC | VARCHAR2(50) | Yes |  |  |
| 3 | SNAP_SID | VARCHAR2(30) | No |  |  |
| 4 | MAST_SID | VARCHAR2(30) | No |  |  |
| 5 | CREATE_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED_USER | VARCHAR2(10) | Yes |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 8 | STATUS | VARCHAR2(10) | Yes |  |  |
| 9 | SNAP_SITE_SEQ | NUMBER | Yes |  |  |
| 10 | SNAP_PWD | VARCHAR2(30) | Yes |  |  |
| 11 | DONSYS_PWD | VARCHAR2(30) | Yes |  |  |
| 12 | UTIL_PWD | VARCHAR2(30) | Yes |  |  |

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

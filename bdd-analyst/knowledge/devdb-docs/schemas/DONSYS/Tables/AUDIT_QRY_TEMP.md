---
tags:
  - table
  - DONSYS
---
# AUDIT_QRY_TEMP

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 6110
**Last Analyzed**: 2026-05-24 15:07:47
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | REC_NUM | NUMBER | Yes |  |  |
| 2 | INSERT_DATE | VARCHAR2(20) | Yes |  |  |
| 3 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 4 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 5 | TABLE_NAME | VARCHAR2(30) | Yes |  |  |
| 6 | DATA_DETAILS | VARCHAR2(300) | Yes |  |  |
| 7 | SELECTION | VARCHAR2(1) | Yes |  |  |
| 8 | COL_NUM | NUMBER | Yes |  |  |
| 9 | DETAILS_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | LT_USER_ID | VARCHAR2(10) | Yes |  |  |

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

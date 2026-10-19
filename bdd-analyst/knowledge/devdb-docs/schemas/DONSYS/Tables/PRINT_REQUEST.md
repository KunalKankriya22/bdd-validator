---
tags:
  - table
  - DONSYS
---
# PRINT_REQUEST

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3
**Last Analyzed**: 2025-09-16 03:14:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | USER_NAME | VARCHAR2(30) | No |  |  |
| 3 | REPORT_NAME | VARCHAR2(8) | No |  |  |
| 4 | PARM_ID | VARCHAR2(20) | No |  |  |
| 5 | REQUEST_DATE | DATE | No |  |  |
| 6 | PRINTED_FLAG | VARCHAR2(1) | Yes |  |  |

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

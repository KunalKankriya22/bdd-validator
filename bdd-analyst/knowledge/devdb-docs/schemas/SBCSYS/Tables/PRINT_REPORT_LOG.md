---
tags:
  - table
  - SBCSYS
---
# PRINT_REPORT_LOG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 120
**Last Analyzed**: 2025-09-24 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | REPORT_NAME | VARCHAR2(30) | Yes |  |  |
| 2 | PARM_ID | VARCHAR2(50) | Yes |  |  |
| 3 | FILE_NAME | VARCHAR2(200) | Yes |  |  |
| 4 | REPORT_LOG | VARCHAR2(500) | Yes |  |  |
| 5 | LINE_NO | NUMBER | Yes |  |  |

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

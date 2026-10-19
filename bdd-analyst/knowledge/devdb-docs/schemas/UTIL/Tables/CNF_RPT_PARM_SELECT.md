---
tags:
  - table
  - UTIL
---
# CNF_RPT_PARM_SELECT

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | USER_NAME | VARCHAR2(30) | No |  |  |
| 3 | REPORT_NAME | VARCHAR2(8) | No |  |  |
| 4 | PARM_ID | VARCHAR2(20) | No |  |  |
| 5 | PARM_NO | NUMBER(2) | No |  |  |
| 6 | PARM_SELECT | VARCHAR2(50) | No |  |  |
| 7 | PARM_CODE | VARCHAR2(5) | No |  |  |

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

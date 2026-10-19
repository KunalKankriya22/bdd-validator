---
tags:
  - table
  - SBCSYS
---
# NY_RSM_REPORT_OTHERS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 14
**Last Analyzed**: 2025-09-16 03:14:32
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RESULT_PARM_ID | VARCHAR2(10) | Yes |  |  |
| 2 | REPORT_ID | VARCHAR2(30) | Yes |  |  |
| 3 | CLIENT_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 4 | TESTED_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 5 | COLL_DATE | DATE | Yes |  |  |
| 6 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 7 | RESULT_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | RECEIVED_DATE | DATE | Yes |  |  |

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

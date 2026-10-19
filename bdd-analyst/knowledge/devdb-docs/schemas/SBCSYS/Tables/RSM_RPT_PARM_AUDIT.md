---
tags:
  - table
  - SBCSYS
---
# RSM_RPT_PARM_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 788
**Last Analyzed**: 2025-09-16 03:14:38
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | Yes |  |  |
| 2 | USER_NAME | VARCHAR2(30) | Yes |  |  |
| 3 | REPORT_NAME | VARCHAR2(38) | Yes |  |  |
| 4 | RESULT_PARM_ID | VARCHAR2(20) | Yes |  |  |
| 5 | REPORT_ID | VARCHAR2(20) | Yes |  |  |
| 6 | SUBMIT_DATE | DATE | Yes |  |  |
| 7 | REPORT_STATUS | VARCHAR2(1) | Yes |  |  |
| 8 | REPORT_FILE_NAME | VARCHAR2(100) | Yes |  |  |
| 9 | PRINT_REQUEST_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 12 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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

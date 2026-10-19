---
tags:
  - table
  - SBCSYS
---
# RSM_RPT_PARM

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 922
**Last Analyzed**: 2025-09-16 03:14:38
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | USER_NAME | VARCHAR2(30) | No |  |  |
| 3 | REPORT_NAME | VARCHAR2(38) | No |  |  |
| 4 | RESULT_PARM_ID | VARCHAR2(20) | No |  |  |
| 5 | REPORT_ID | VARCHAR2(20) | No |  |  |
| 6 | SUBMIT_DATE | DATE | Yes |  |  |
| 7 | REPORT_STATUS | VARCHAR2(1) | Yes |  |  |
| 8 | REPORT_FILE_NAME | VARCHAR2(100) | Yes |  |  |
| 9 | PRINT_REQUEST_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/RSM_RPT_PARM_BD|RSM_RPT_PARM_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/RSM_RPT_PARM_BI|RSM_RPT_PARM_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/RSM_RPT_PARM_BU|RSM_RPT_PARM_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

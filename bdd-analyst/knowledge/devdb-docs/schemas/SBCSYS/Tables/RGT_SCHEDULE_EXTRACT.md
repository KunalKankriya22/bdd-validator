---
tags:
  - table
  - SBCSYS
---
# RGT_SCHEDULE_EXTRACT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 53
**Last Analyzed**: 2025-09-16 03:14:36
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | FILE_NAME | VARCHAR2(240) | No |  |  |
| 2 | EXTRACT_DATE_TIME | DATE | No |  |  |
| 3 | STATUS | VARCHAR2(1) | Yes |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 5 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 6 | RESULT_PARM_ID | VARCHAR2(20) | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | Yes |  |  |
| 8 | GEN_REPORT | VARCHAR2(1) | Yes |  |  |
| 9 | REPORT_ID | VARCHAR2(20) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/RGT_SCHEDULE_EXTRACT_BD|RGT_SCHEDULE_EXTRACT_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_SCHEDULE_EXTRACT_BI|RGT_SCHEDULE_EXTRACT_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_SCHEDULE_EXTRACT_BU|RGT_SCHEDULE_EXTRACT_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

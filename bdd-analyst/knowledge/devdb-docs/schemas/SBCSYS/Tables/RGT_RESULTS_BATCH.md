---
tags:
  - table
  - SBCSYS
---
# RGT_RESULTS_BATCH

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3153
**Last Analyzed**: 2025-09-16 03:14:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | RESULT_BATCH_ID | VARCHAR2(15) | No |  |  |
| 3 | PARM_ID | VARCHAR2(15) | No |  |  |
| 4 | EXTRACT_DATE | DATE | Yes |  |  |
| 5 | EXTRACT_USER_ID | VARCHAR2(6) | No |  |  |
| 6 | BATCH_STATUS_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | UNIT_COUNT | NUMBER(6) | Yes |  |  |
| 8 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 9 | UNDER_EXTRACT_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | RESULT_TYPE | VARCHAR2(1) | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/RGT_RESULTS_BATCH_BD|RGT_RESULTS_BATCH_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_RESULTS_BATCH_BI|RGT_RESULTS_BATCH_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_RESULTS_BATCH_BU|RGT_RESULTS_BATCH_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

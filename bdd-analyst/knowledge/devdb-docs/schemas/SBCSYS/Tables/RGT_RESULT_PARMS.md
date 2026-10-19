---
tags:
  - table
  - SBCSYS
---
# RGT_RESULT_PARMS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1748
**Last Analyzed**: 2025-09-16 03:14:36
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 3 | RESULT_PARM_ID | VARCHAR2(20) | No |  |  |
| 4 | FROM_DATE | DATE | Yes |  |  |
| 5 | TO_DATE | DATE | Yes |  |  |
| 6 | INSERT_DATS | DATE | Yes |  |  |
| 7 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 8 | BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 9 | UNIT_LIST | VARCHAR2(1) | Yes |  |  |
| 10 | STAT_TESTS | VARCHAR2(1) | Yes |  |  |
| 11 | RESULT_TYPE | VARCHAR2(1) | Yes |  |  |
| 12 | OTHER_BATCHES | VARCHAR2(1) | Yes |  |  |
| 13 | UNIT_COUNT | NUMBER(6) | Yes |  |  |
| 14 | UNDER_EXTRACT_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | RE_EXTRACT_FLAG | VARCHAR2(1) | Yes |  |  |
| 16 | AUDIT_KEY | NUMBER | Yes |  |  |
| 17 | ABORT_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/RGT_RESULT_PARMS_BD|RGT_RESULT_PARMS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_RESULT_PARMS_BI|RGT_RESULT_PARMS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_RESULT_PARMS_BU|RGT_RESULT_PARMS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

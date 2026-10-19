---
tags:
  - table
  - SBCSYS
---
# RGT_UNIT_EXTRACT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:37
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PARM_ID | VARCHAR2(20) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 5 | COLL_DATE | DATE | No |  |  |
| 6 | BATCH_ID | VARCHAR2(14) | No |  |  |
| 7 | TEST_SEQ_NO | NUMBER(2) | Yes |  |  |
| 8 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/RGT_UNIT_EXTRACT_BD|RGT_UNIT_EXTRACT_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_UNIT_EXTRACT_BI|RGT_UNIT_EXTRACT_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_UNIT_EXTRACT_BU|RGT_UNIT_EXTRACT_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

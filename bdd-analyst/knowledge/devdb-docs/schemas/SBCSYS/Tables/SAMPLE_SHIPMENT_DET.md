---
tags:
  - table
  - SBCSYS
---
# SAMPLE_SHIPMENT_DET

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 46
**Last Analyzed**: 2025-09-16 03:14:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BOX_ID | VARCHAR2(30) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | COLL_DATE | DATE | No |  |  |
| 5 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 6 | SAMPLE_TYPE | VARCHAR2(5) | No |  |  |
| 7 | FROZEN_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | PREV_FROZEN_FLAG | VARCHAR2(1) | Yes |  |  |
| 9 | PREV_FROZEN_CNT | NUMBER | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 14 | SAMPLE_SEQ_NO | VARCHAR2(20) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/SAMPLE_SHIPMENT_DET_BD|SAMPLE_SHIPMENT_DET_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/SAMPLE_SHIPMENT_DET_BI|SAMPLE_SHIPMENT_DET_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/SAMPLE_SHIPMENT_DET_BU|SAMPLE_SHIPMENT_DET_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

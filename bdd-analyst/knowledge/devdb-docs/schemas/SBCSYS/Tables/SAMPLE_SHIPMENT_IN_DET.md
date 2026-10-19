---
tags:
  - table
  - SBCSYS
---
# SAMPLE_SHIPMENT_IN_DET

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 48
**Last Analyzed**: 2025-09-16 03:14:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BOX_ID | VARCHAR2(30) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | INT_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 4 | EXT_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 5 | COLL_DATE | DATE | No |  |  |
| 6 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 7 | SAMPLE_TYPE | VARCHAR2(5) | No |  |  |
| 8 | FROZEN_FLAG | VARCHAR2(1) | Yes |  |  |
| 9 | THAW_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | THAW_START_TIME | DATE | Yes |  |  |
| 11 | ALIQUOT | VARCHAR2(2) | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |
| 14 | INSERT_DATE | DATE | No |  |  |
| 15 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 16 | ACCEPT_FLAG | VARCHAR2(1) | Yes |  |  |
| 17 | OVR_DATE | DATE | Yes |  |  |
| 18 | OVR_USER_ID | VARCHAR2(10) | Yes |  |  |
| 19 | OVR_REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 20 | OVR_NOTE_ID | NUMBER(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/SAMPLE_SHIPMENT_IN_DET_BD|SAMPLE_SHIPMENT_IN_DET_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/SAMPLE_SHIPMENT_IN_DET_BI|SAMPLE_SHIPMENT_IN_DET_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/SAMPLE_SHIPMENT_IN_DET_BU|SAMPLE_SHIPMENT_IN_DET_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

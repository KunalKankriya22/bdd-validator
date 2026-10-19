---
tags:
  - table
  - SBCSYS
---
# SAMPLE_SHIPMENT_IN_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 103
**Last Analyzed**: 2025-09-16 03:14:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BOX_ID | VARCHAR2(30) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TRANSFER_MODE | VARCHAR2(1) | No |  |  |
| 4 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 5 | PROFILE_SET_ID | VARCHAR2(20) | Yes |  |  |
| 6 | SHIPMENT_NO | VARCHAR2(50) | Yes |  |  |
| 7 | SHIPMENT_DATE | DATE | Yes |  |  |
| 8 | RECEIVED_DATE | DATE | No |  |  |
| 9 | BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 14 | BOX_IN_STATUS | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/SAMPLE_SHIPMENT_IN_HDR_BD|SAMPLE_SHIPMENT_IN_HDR_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/SAMPLE_SHIPMENT_IN_HDR_BI|SAMPLE_SHIPMENT_IN_HDR_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/SAMPLE_SHIPMENT_IN_HDR_BU|SAMPLE_SHIPMENT_IN_HDR_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

---
tags:
  - table
  - SBCSYS
---
# SAMPLE_SHIPMENT_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 33
**Last Analyzed**: 2025-09-16 03:14:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BOX_ID | VARCHAR2(30) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | SHIPMENT_NO | VARCHAR2(50) | Yes |  |  |
| 4 | PACK_DATE | DATE | No |  |  |
| 5 | FACILITY_CODE | VARCHAR2(5) | No |  |  |
| 6 | BOX_STATUS | VARCHAR2(1) | Yes |  |  |
| 7 | BOX_CLOSED_DATE | DATE | Yes |  |  |
| 8 | BOX_CLOSED_USER | VARCHAR2(30) | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |
| 12 | INSERT_USER | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/SAMPLE_SHIPMENT_HDR_BD|SAMPLE_SHIPMENT_HDR_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/SAMPLE_SHIPMENT_HDR_BI|SAMPLE_SHIPMENT_HDR_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/SAMPLE_SHIPMENT_HDR_BU|SAMPLE_SHIPMENT_HDR_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

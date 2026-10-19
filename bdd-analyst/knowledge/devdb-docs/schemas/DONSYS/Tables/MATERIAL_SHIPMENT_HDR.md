---
tags:
  - table
  - DONSYS
---
# MATERIAL_SHIPMENT_HDR

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 640
**Last Analyzed**: 2025-10-22 03:00:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SHIPPER_NO | VARCHAR2(50) | No |  |  |
| 2 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 3 | COLL_DATE | DATE | No |  |  |
| 4 | SHIP_TYPE | VARCHAR2(2) | No |  |  |
| 5 | SHIP_FROM_SITE | VARCHAR2(10) | Yes |  |  |
| 6 | SHIP_STATUS | VARCHAR2(2) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| MATERIAL_SHIPMENT_HDR_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| MAT_SHIP_HDR_IDX_1 | NORMAL | NONUNIQUE | SHIPPER_NO | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/MATERIAL_SHIPMENT_HDR_BI|MATERIAL_SHIPMENT_HDR_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

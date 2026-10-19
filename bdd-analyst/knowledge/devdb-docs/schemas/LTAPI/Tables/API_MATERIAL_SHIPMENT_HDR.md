---
tags:
  - table
  - LTAPI
---
# API_MATERIAL_SHIPMENT_HDR

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 27
**Last Analyzed**: 2025-10-25 03:00:09
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
| 11 | TRANSACTION_MODE | VARCHAR2(2) | Yes |  |  |
| 12 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 13 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 14 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 15 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 16 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 17 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_MATERIAL_SHIPMENT_HDR_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

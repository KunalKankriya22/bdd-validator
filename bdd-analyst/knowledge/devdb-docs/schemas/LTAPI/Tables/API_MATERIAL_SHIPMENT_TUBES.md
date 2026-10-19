---
tags:
  - table
  - LTAPI
---
# API_MATERIAL_SHIPMENT_TUBES

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 128
**Last Analyzed**: 2025-10-25 03:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SHIPPER_NO | VARCHAR2(50) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | TUBE_TYPE | VARCHAR2(10) | No |  |  |
| 4 | INSERT_DATE | DATE | No |  |  |
| 5 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 6 | PROGRAM_ID | VARCHAR2(20) | No |  |  |
| 7 | AUDIT_KEY | NUMBER | No |  |  |
| 8 | TRANSACTION_MODE | VARCHAR2(2) | Yes |  |  |
| 9 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 10 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 11 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 12 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 13 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 14 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_MATERIAL_SHIPMENT_TUBES_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

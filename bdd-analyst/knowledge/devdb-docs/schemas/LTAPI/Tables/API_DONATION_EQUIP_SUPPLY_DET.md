---
tags:
  - table
  - LTAPI
---
# API_DONATION_EQUIP_SUPPLY_DET

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1119
**Last Analyzed**: 2025-10-25 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 3 | EQUIP_OR_SUPPLY | VARCHAR2(10) | No |  |  |
| 4 | EQUIP_SUPPLY_CODE | VARCHAR2(10) | No |  |  |
| 5 | SUPPLY_ID | VARCHAR2(50) | Yes |  |  |
| 6 | EQUIP_REFERENCE | VARCHAR2(9) | Yes |  |  |
| 7 | CATALOG_NO | VARCHAR2(10) | Yes |  |  |
| 8 | LOT_NO | VARCHAR2(20) | Yes |  |  |
| 9 | QC_STATUS | VARCHAR2(10) | Yes |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |
| 11 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |
| 14 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 15 | TRANSACTION_MODE | VARCHAR2(2) | Yes |  |  |
| 16 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 17 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 18 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 19 | SET_ID | VARCHAR2(50) | Yes |  |  |
| 20 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 21 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 22 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONATION_EQUIP_SUP_DET_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

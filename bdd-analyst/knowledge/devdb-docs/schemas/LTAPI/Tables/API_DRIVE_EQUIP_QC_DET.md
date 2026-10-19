---
tags:
  - table
  - LTAPI
---
# API_DRIVE_EQUIP_QC_DET

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1509
**Last Analyzed**: 2025-10-25 03:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | DRIVE_DATE | DATE | No |  |  |
| 3 | DRIVE_PROFILE_CODE | VARCHAR2(10) | No |  |  |
| 4 | EQUIP_OR_SUPPLY | VARCHAR2(10) | Yes |  |  |
| 5 | EQUIP_SUPPLY_CODE | VARCHAR2(10) | Yes |  |  |
| 6 | QC_TEST_PARM_CODE | VARCHAR2(10) | No |  |  |
| 7 | QC_VALUE_DATE | DATE | Yes |  |  |
| 8 | QC_VALUE_SCAN | VARCHAR2(50) | Yes |  |  |
| 9 | QC_VALUE_DATA | VARCHAR2(30) | Yes |  |  |
| 10 | BAG_CATALOG_NO | VARCHAR2(10) | Yes |  |  |
| 11 | BAG_LOT_NO | VARCHAR2(20) | Yes |  |  |
| 12 | BAG_OPENED | VARCHAR2(1) | Yes |  |  |
| 13 | BAG_OPENED_DATE | DATE | Yes |  |  |
| 14 | BAG_EXPIRY_DATE | DATE | Yes |  |  |
| 15 | QC_STATUS | VARCHAR2(10) | Yes |  |  |
| 16 | INSERT_DATE | DATE | No |  |  |
| 17 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 18 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 19 | AUDIT_KEY | NUMBER | No |  |  |
| 20 | EQUIP_TYPE | VARCHAR2(5) | Yes |  |  |
| 21 | EQUIP_REFERENCE | VARCHAR2(9) | Yes |  |  |
| 22 | SUPPLY_ID | VARCHAR2(50) | Yes |  |  |
| 23 | SET_ID | VARCHAR2(50) | Yes |  |  |
| 24 | SORT_SEQUENCE | NUMBER | Yes |  |  |
| 25 | QC_CONDITION_CODE | VARCHAR2(10) | Yes |  |  |
| 26 | DATA_TYPE | VARCHAR2(1) | Yes |  |  |
| 27 | TRANSACTION_MODE | VARCHAR2(2) | Yes |  |  |
| 28 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 29 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 30 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 31 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 32 | IS_COPY | NUMBER(1) | Yes |  |  |
| 33 | DEVICE_STATUS | VARCHAR2(10) | Yes |  |  |
| 34 | DEVICE_COMMENTS | VARCHAR2(240) | Yes |  |  |
| 35 | COPY_NUMBER | NUMBER | Yes |  |  |
| 36 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 37 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 38 | GROUP_STATUS | VARCHAR2(10) | Yes |  |  |
| 39 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DRIVE_EQUIP_QC_DET_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

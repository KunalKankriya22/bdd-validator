---
tags:
  - table
  - DONSYS
---
# DRIVE_EQUIP_QC_DET

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 31391
**Last Analyzed**: 2025-10-02 03:00:20
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
| 27 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 28 | IS_COPY | NUMBER(1) | Yes |  |  |
| 29 | DEVICE_STATUS | VARCHAR2(10) | Yes |  |  |
| 30 | DEVICE_COMMENTS | VARCHAR2(240) | Yes |  |  |
| 31 | COPY_NUMBER | NUMBER | Yes |  |  |
| 32 | GROUP_STATUS | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DRIVE_EQUIP_QC_DET_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| DRIVE_EQUIP_QC_DET_IDX1 | NORMAL | NONUNIQUE | SET_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DRIVE_EQUIP_QC_DET_BD|DRIVE_EQUIP_QC_DET_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DRIVE_EQUIP_QC_DET_BI|DRIVE_EQUIP_QC_DET_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DRIVE_EQUIP_QC_DET_BU|DRIVE_EQUIP_QC_DET_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

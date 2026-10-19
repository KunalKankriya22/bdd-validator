---
tags:
  - table
  - SRVSYS
---
# RACK_DETAILS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 608
**Last Analyzed**: 2025-09-16 03:16:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | WAREHOUSE_ID | VARCHAR2(1) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DEVICE_TYPE | VARCHAR2(1) | No |  |  |
| 4 | DEVICE_NUMBER | VARCHAR2(2) | No |  |  |
| 5 | BLOOD_TYPE | VARCHAR2(4) | Yes |  |  |
| 6 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 7 | RACK_NUMBER | VARCHAR2(2) | No |  |  |
| 8 | RACK_DESCRIPTION | VARCHAR2(50) | Yes |  |  |
| 9 | SHELF_COUNT | NUMBER(2) | Yes |  |  |
| 10 | TRAY_COUNT | NUMBER(4) | Yes |  |  |
| 11 | STORAGE_CLASS | VARCHAR2(2) | Yes |  |  |
| 12 | EFFECTIVE_DATE | DATE | No |  |  |
| 13 | TERM_DATE | DATE | Yes |  |  |
| 14 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 15 | AUDIT_KEY | NUMBER | No |  |  |
| 16 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 17 | MIX_ABO | VARCHAR2(1) | Yes |  |  |
| 18 | MIX_PRODUCT | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RACK_DETAILS_IDX_1 | NORMAL | UNIQUE | WAREHOUSE_ID, CHAPTER_ID, DEVICE_TYPE, DEVICE_NUMBER, BLOOD_TYPE, PRODUCT_TYPE, RACK_NUMBER | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/RACK_DETAILS_BD|RACK_DETAILS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/RACK_DETAILS_BI|RACK_DETAILS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/RACK_DETAILS_BU|RACK_DETAILS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

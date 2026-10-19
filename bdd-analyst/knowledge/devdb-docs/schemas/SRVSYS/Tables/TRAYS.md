---
tags:
  - table
  - SRVSYS
---
# TRAYS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1849
**Last Analyzed**: 2026-05-23 15:07:17
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRAY_NUMBER | VARCHAR2(4) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |
| 4 | DEVICE_TYPE | VARCHAR2(1) | Yes |  |  |
| 5 | DEVICE_NUMBER | VARCHAR2(2) | Yes |  |  |
| 6 | RACK_NUMBER | VARCHAR2(2) | Yes |  |  |
| 7 | SHELF_NUMBER | VARCHAR2(2) | Yes |  |  |
| 8 | TRAY_DESCRIPTION | VARCHAR2(30) | Yes |  |  |
| 9 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 10 | ITEM_COUNT | NUMBER | Yes |  |  |
| 11 | TRAY_STATUS | VARCHAR2(2) | Yes |  |  |
| 12 | EFFECTIVE_DATE | DATE | No |  |  |
| 13 | TERM_DATE | DATE | Yes |  |  |
| 14 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 15 | AUDIT_KEY | NUMBER | No |  |  |
| 16 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 17 | BLOOD_TYPE | VARCHAR2(4) | Yes |  |  |

## Primary Key

**TRAYS_PK**: `TRAY_NUMBER, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TRAYS_PK | NORMAL | UNIQUE | TRAY_NUMBER, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/TRAYS_BD|TRAYS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/TRAYS_BI|TRAYS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/TRAYS_BU|TRAYS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

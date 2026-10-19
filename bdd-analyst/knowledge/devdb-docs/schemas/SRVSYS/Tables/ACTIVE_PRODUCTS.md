---
tags:
  - table
  - SRVSYS
---
# ACTIVE_PRODUCTS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 8695
**Last Analyzed**: 2025-09-16 03:16:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 5 | ALIQUOT | VARCHAR2(2) | No |  |  |
| 6 | BLOOD_TYPE | VARCHAR2(4) | No |  |  |
| 7 | EXP_DATE | DATE | No |  |  |
| 8 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | APPL_CUSTODY | VARCHAR2(2) | No |  |  |
| 11 | STOCK_STATE | VARCHAR2(2) | No |  |  |
| 12 | LOCATION_ID | VARCHAR2(12) | No |  |  |
| 13 | IMPORT_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | WORK_ORDER_NO | VARCHAR2(13) | Yes |  |  |
| 15 | INVENTORY_CLASS | VARCHAR2(2) | Yes |  |  |
| 16 | OSOK_FLAG | VARCHAR2(1) | Yes |  |  |
| 17 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 18 | AUDIT_KEY | NUMBER | Yes |  |  |
| 19 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 20 | WAREHOUSE_ID | VARCHAR2(1) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ACTIVE_PRODUCTS_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, ALIQUOT | VALID |
| ACTIVE_PRODUCTS_IDX_2 | NORMAL | NONUNIQUE | STOCK_STATE | VALID |
| ACTIVE_PRODUCTS_IDX_3 | NORMAL | NONUNIQUE | EXP_DATE | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/AP_BD|AP_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/AP_BI|AP_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/AP_BU|AP_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

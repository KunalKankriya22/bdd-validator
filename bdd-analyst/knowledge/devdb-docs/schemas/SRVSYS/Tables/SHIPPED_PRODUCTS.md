---
tags:
  - table
  - SRVSYS
---
# SHIPPED_PRODUCTS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4166
**Last Analyzed**: 2025-09-16 03:16:12
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
| 8 | STOCK_STATE | VARCHAR2(2) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | SHIPPED_DATE | DATE | No |  |  |
| 11 | SHIPPED_TO | VARCHAR2(10) | No |  |  |
| 12 | SHIPMENT_NO | VARCHAR2(14) | No |  |  |
| 13 | PATIENT_ID | VARCHAR2(11) | Yes |  |  |
| 14 | TRANSFUSED_DATE | DATE | Yes |  |  |
| 15 | TRANSFER_RESERVE_FLAG | VARCHAR2(1) | Yes |  |  |
| 16 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 17 | IMPORT_FLAG | VARCHAR2(1) | Yes |  |  |
| 18 | INVENTORY_CLASS | VARCHAR2(2) | Yes |  |  |
| 19 | SHIPPED_FROM | VARCHAR2(10) | Yes |  |  |
| 20 | REJECT_REASON | VARCHAR2(5) | Yes |  |  |
| 21 | CP6_DEST | VARCHAR2(4) | Yes |  |  |
| 22 | OSOK_FLAG | VARCHAR2(1) | Yes |  |  |
| 23 | AUDIT_KEY | NUMBER | Yes |  |  |
| 24 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 25 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SHIPPED_PRODUCTS_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, ALIQUOT, SHIPMENT_NO | VALID |
| SHIPPED_PRODUCTS_IDX_2 | NORMAL | NONUNIQUE | SHIPPED_DATE | VALID |
| SHIPPED_PRODUCTS_IDX_3 | NORMAL | NONUNIQUE | SHIPMENT_NO, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/SHIP_SF_INTERFACE|SHIP_SF_INTERFACE]] — AFTER EACH ROW INSERT OR UPDATE (ENABLED)
- [[schemas/SRVSYS/Triggers/SP_BD|SP_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/SP_BI|SP_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/SP_BU|SP_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

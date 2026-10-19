---
tags:
  - table
  - SRVSYS
---
# PICK_SLIP_PRODUCTS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 11069
**Last Analyzed**: 2025-09-16 03:16:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PICK_SLIP_ID | VARCHAR2(13) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 4 | COLL_DATE | DATE | No |  |  |
| 5 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 6 | ALIQUOT | VARCHAR2(2) | No |  |  |
| 7 | BLOOD_TYPE | VARCHAR2(4) | No |  |  |
| 8 | PRODUCT_STATUS | VARCHAR2(2) | No |  |  |
| 9 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 10 | EXP_DATE | DATE | No |  |  |
| 11 | ITEM_NO | NUMBER(2) | Yes |  |  |
| 12 | PRODUCT_PRICE | NUMBER(9,2) | Yes |  |  |
| 13 | QC_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | QC_DATE | DATE | Yes |  |  |
| 15 | BOX_ID | VARCHAR2(10) | Yes |  |  |
| 16 | ORD_PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 17 | ORD_BLOOD_TYPE | VARCHAR2(4) | Yes |  |  |
| 18 | ORD_TIER | NUMBER(2) | Yes |  |  |
| 19 | ORD_INVENTORY_CLASS | VARCHAR2(2) | Yes |  |  |
| 20 | WORK_ORDER_NO | VARCHAR2(13) | Yes |  |  |
| 21 | INSPECTED_BY | VARCHAR2(10) | Yes |  |  |
| 22 | TIER | NUMBER(2) | Yes |  |  |
| 23 | AUDIT_KEY | NUMBER | Yes |  |  |
| 24 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**PICK_SLIP_PRODUCTS_PK**: `PICK_SLIP_ID, CHAPTER_ID, UNIT_ID, COLL_DATE, PRODUCT_CODE, ALIQUOT`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SRVSYS/Tables/PICK_SLIP_PRODUCT_ANTGNS\|SRVSYS.PICK_SLIP_PRODUCT_ANTGNS]] | PROD_PICK_SLIP_PROD_ANTIG_FK | PICK_SLIP_ID, CHAPTER_ID, UNIT_ID, COLL_DATE, PRODUCT_CODE, ALIQUOT → PICK_SLIP_ID, CHAPTER_ID, UNIT_ID, COLL_DATE, PRODUCT_CODE, ALIQUOT |
| [[schemas/SRVSYS/Tables/PICK_SLIP_PRODUCT_ATTR\|SRVSYS.PICK_SLIP_PRODUCT_ATTR]] | PROD_PICK_SLIP_PROD_ATTR_FK | PICK_SLIP_ID, CHAPTER_ID, UNIT_ID, COLL_DATE, PRODUCT_CODE, ALIQUOT → PICK_SLIP_ID, CHAPTER_ID, UNIT_ID, COLL_DATE, PRODUCT_CODE, ALIQUOT |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PICK_SLIP_PRODUCTS_IDX_1 | NORMAL | UNIQUE | PICK_SLIP_ID, CHAPTER_ID, UNIT_ID, COLL_DATE, PRODUCT_CODE, ALIQUOT | VALID |
| PICK_SLIP_PRODUCTS_IDX_2 | NORMAL | NONUNIQUE | PRODUCT_STATUS | VALID |
| PSP_BOX_IDX_3 | NORMAL | NONUNIQUE | BOX_ID, CHAPTER_ID | VALID |
| PSP_UNIT_PROD_IDX | NORMAL | NONUNIQUE | UNIT_ID, COLL_DATE, PRODUCT_CODE | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/PICK_SLIP_PRODUCTS_BEF_INS|PICK_SLIP_PRODUCTS_BEF_INS]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| V_ALL_ORD_SHIP | VIEW | SRVSYS |
| V_ORDERS_TO_SHIPMENTS | VIEW | SRVSYS |

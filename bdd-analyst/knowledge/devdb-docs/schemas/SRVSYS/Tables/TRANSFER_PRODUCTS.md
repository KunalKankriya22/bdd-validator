---
tags:
  - table
  - SRVSYS
---
# TRANSFER_PRODUCTS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 66
**Last Analyzed**: 2025-09-20 19:00:19
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
| 9 | PICK_SLIP_STATUS | VARCHAR2(2) | No |  |  |
| 10 | PICK_SLIP_TYPE | VARCHAR2(2) | No |  |  |
| 11 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 12 | EXP_DATE | DATE | No |  |  |
| 13 | ORDER_NO | VARCHAR2(14) | No |  |  |
| 14 | INSERT_DATE | DATE | No |  |  |
| 15 | ITEM_NO | NUMBER(2) | Yes |  |  |
| 16 | PRODUCT_PRICE | NUMBER(9,2) | Yes |  |  |
| 17 | QC_FLAG | VARCHAR2(1) | Yes |  |  |
| 18 | QC_DATE | DATE | Yes |  |  |
| 19 | BOX_ID | VARCHAR2(10) | Yes |  |  |
| 20 | ORD_PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 21 | ORD_BLOOD_TYPE | VARCHAR2(4) | Yes |  |  |
| 22 | ORD_TIER | NUMBER(2) | Yes |  |  |
| 23 | ORD_INVENTORY_CLASS | VARCHAR2(2) | Yes |  |  |
| 24 | INSPECTED_BY | VARCHAR2(10) | Yes |  |  |
| 25 | PICKED_BY | VARCHAR2(10) | Yes |  |  |
| 26 | TIER | NUMBER(2) | Yes |  |  |
| 27 | SOURCE_HOSPITAL | VARCHAR2(10) | Yes |  |  |
| 28 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

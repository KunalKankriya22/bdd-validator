---
tags:
  - table
  - SRVSYS
---
# DISCARD_PRODUCTS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 417
**Last Analyzed**: 2025-09-21 03:00:35
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
| 7 | PRODUCT_STATUS | VARCHAR2(2) | No |  |  |
| 8 | EXP_DATE | DATE | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | DISCARD_TYPE | VARCHAR2(2) | No |  |  |
| 11 | LOCATION_ID | VARCHAR2(12) | No |  |  |
| 12 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 13 | PRODUCT_PRICE | NUMBER(9,2) | Yes |  |  |
| 14 | PICK_SLIP_ID | VARCHAR2(13) | Yes |  |  |
| 15 | BOX_ID | VARCHAR2(10) | Yes |  |  |
| 16 | REJECT_REASON | VARCHAR2(5) | Yes |  |  |
| 17 | AUDIT_KEY | NUMBER | Yes |  |  |
| 18 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 19 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DISCARD_PRODUCTS_IDX_1 | NORMAL | NONUNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, ALIQUOT | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/DP_BD|DP_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/DP_BI|DP_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/DP_BU|DP_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

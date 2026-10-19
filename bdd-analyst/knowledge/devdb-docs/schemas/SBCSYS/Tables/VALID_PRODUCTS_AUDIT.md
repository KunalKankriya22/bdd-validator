---
tags:
  - table
  - SBCSYS
---
# VALID_PRODUCTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 31317
**Last Analyzed**: 2025-09-16 03:16:01
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 2 | PRODUCT_SHORT_NAME | VARCHAR2(10) | Yes |  |  |
| 3 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 4 | DUMMY_PRODUCT_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | PRODUCT_DESC | VARCHAR2(254) | Yes |  |  |
| 6 | LIFE_SPAN_IND | VARCHAR2(1) | Yes |  |  |
| 7 | LIFE_SPAN | NUMBER(4) | Yes |  |  |
| 8 | MAX_TEMP | NUMBER(5,2) | Yes |  |  |
| 9 | MIN_TEMP | NUMBER(5,2) | Yes |  |  |
| 10 | MIN_WEIGHT | NUMBER(5,2) | Yes |  |  |
| 11 | MAX_WEIGHT | NUMBER(5,2) | Yes |  |  |
| 12 | SPECIFIC_GRAVITY | NUMBER(5,3) | Yes |  |  |
| 13 | PRODUCT_COUNT | NUMBER(7,4) | Yes |  |  |
| 14 | MAX_BLEED_TIME | NUMBER(5,2) | Yes |  |  |
| 15 | TIME_LIMIT | NUMBER(6,2) | Yes |  |  |
| 16 | OFT_FLAG | VARCHAR2(1) | Yes |  |  |
| 17 | RH_LABEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 18 | MAX_RCV_TEMP | NUMBER(5,2) | Yes |  |  |
| 19 | MIN_RCV_TEMP | NUMBER(5,2) | Yes |  |  |
| 20 | INVENTORY_CLASS | VARCHAR2(2) | Yes |  |  |
| 21 | POOL_PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 22 | STD_PRICE | NUMBER(9,2) | Yes |  |  |
| 23 | OUT_OF_STATE_FLAG | VARCHAR2(1) | Yes |  |  |
| 24 | SERVICE_CODE | VARCHAR2(8) | Yes |  |  |
| 25 | RETURNABLE | VARCHAR2(1) | Yes |  |  |
| 26 | INV_PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 27 | EFF_DATE | DATE | Yes |  |  |
| 28 | TERM_DATE | DATE | Yes |  |  |
| 29 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 30 | AUDIT_KEY | NUMBER | No |  |  |
| 31 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 32 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 33 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 34 | CELL_COUNT_FLAG | VARCHAR2(1) | Yes |  |  |
| 35 | PHERESIS_FLAG | VARCHAR2(1) | Yes |  |  |
| 36 | UNIT_SCHEME_TYPE | VARCHAR2(1) | Yes |  |  |
| 37 | PRODUCT_FORMULA | VARCHAR2(100) | Yes |  |  |
| 38 | PREPRINTED_LABEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 39 | COMP_PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 40 | MANUF_PRODUCT_FLAG | VARCHAR2(1) | Yes |  |  |
| 41 | MODIFIER_CODE | VARCHAR2(10) | Yes |  |  |
| 42 | PRODUCT_CLASS | VARCHAR2(10) | Yes |  |  |
| 43 | OLD_PRODUCT_FORMULA | VARCHAR2(60) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_PRODUCTS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

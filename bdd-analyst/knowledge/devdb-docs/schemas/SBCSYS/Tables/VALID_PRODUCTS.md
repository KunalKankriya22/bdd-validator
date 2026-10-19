---
tags:
  - table
  - SBCSYS
---
# VALID_PRODUCTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 11021
**Last Analyzed**: 2026-05-21 03:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 2 | PRODUCT_SHORT_NAME | VARCHAR2(10) | No |  |  |
| 3 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 4 | DUMMY_PRODUCT_FLAG | VARCHAR2(1) | No |  |  |
| 5 | PRODUCT_DESC | VARCHAR2(254) | No |  |  |
| 6 | LIFE_SPAN_IND | VARCHAR2(1) | No |  |  |
| 7 | LIFE_SPAN | NUMBER(4) | No |  |  |
| 8 | MAX_TEMP | NUMBER(5,2) | No |  |  |
| 9 | MIN_TEMP | NUMBER(5,2) | No |  |  |
| 10 | MIN_WEIGHT | NUMBER(5,2) | Yes |  |  |
| 11 | MAX_WEIGHT | NUMBER(5,2) | Yes |  |  |
| 12 | SPECIFIC_GRAVITY | NUMBER(5,3) | Yes |  |  |
| 13 | PRODUCT_COUNT | NUMBER(7,4) | Yes |  |  |
| 14 | MAX_BLEED_TIME | NUMBER(5,2) | Yes |  |  |
| 15 | TIME_LIMIT | NUMBER(6,2) | Yes |  |  |
| 16 | OFT_FLAG | VARCHAR2(1) | No |  |  |
| 17 | RH_LABEL_FLAG | VARCHAR2(1) | No |  |  |
| 18 | MAX_RCV_TEMP | NUMBER(5,2) | Yes |  |  |
| 19 | MIN_RCV_TEMP | NUMBER(5,2) | Yes |  |  |
| 20 | INVENTORY_CLASS | VARCHAR2(2) | Yes |  |  |
| 21 | POOL_PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 22 | STD_PRICE | NUMBER(9,2) | Yes |  |  |
| 23 | OUT_OF_STATE_FLAG | VARCHAR2(1) | Yes |  |  |
| 24 | SERVICE_CODE | VARCHAR2(8) | Yes |  |  |
| 25 | RETURNABLE | VARCHAR2(1) | Yes |  |  |
| 26 | INV_PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 27 | EFF_DATE | DATE | No |  |  |
| 28 | TERM_DATE | DATE | Yes |  |  |
| 29 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 30 | AUDIT_KEY | NUMBER | No |  |  |
| 31 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 32 | CELL_COUNT_FLAG | VARCHAR2(1) | Yes |  |  |
| 33 | PHERESIS_FLAG | VARCHAR2(1) | Yes |  |  |
| 34 | UNIT_SCHEME_TYPE | VARCHAR2(1) | Yes |  |  |
| 35 | PRODUCT_FORMULA | VARCHAR2(100) | Yes |  |  |
| 36 | PREPRINTED_LABEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 37 | COMP_PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 38 | MANUF_PRODUCT_FLAG | VARCHAR2(1) | Yes |  |  |
| 39 | RESEARCH_PRODUCT_FLAG | VARCHAR2(1) | Yes |  |  |
| 40 | PATHOGEN_REDUCTION_FLAG | VARCHAR2(1) | Yes |  |  |
| 41 | MODIFIER_CODE | VARCHAR2(10) | Yes |  |  |
| 42 | PRODUCT_CLASS | VARCHAR2(10) | Yes |  |  |
| 43 | OLD_PRODUCT_FORMULA | VARCHAR2(60) | Yes |  |  |

## Primary Key

**VALID_PRODUCTS_PK**: `PRODUCT_CODE`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/FR_VPRODUCT_PROCESSES\|SBCSYS.FR_VPRODUCT_PROCESSES]] | PROD_FR_PROD_PROCESS_FK | PRODUCT_CODE → PRODUCT_CODE |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_PRODUCTS_IDX_1 | NORMAL | UNIQUE | PRODUCT_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_PRODUCTS_BEFORE_DELETE|VALID_PRODUCTS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_PRODUCTS_INSERT_UPDATE|VALID_PRODUCTS_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

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
| VSERV_PRODUCTS | VIEW | SBCSYS |

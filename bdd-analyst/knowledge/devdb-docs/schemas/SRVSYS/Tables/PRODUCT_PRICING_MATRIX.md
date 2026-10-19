---
tags:
  - table
  - SRVSYS
---
# PRODUCT_PRICING_MATRIX

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 6952
**Last Analyzed**: 2025-09-16 03:16:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CUSTOMER_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 4 | TIER | NUMBER(2) | No |  |  |
| 5 | FROM_DAY | NUMBER(4) | No |  |  |
| 6 | TO_DAY | NUMBER(4) | No |  |  |
| 7 | UNIT_PRICE | NUMBER(9,2) | Yes |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PRODUCT_PRICING_MATRIX_IDX_1 | NORMAL | UNIQUE | CUSTOMER_ID, CHAPTER_ID, PRODUCT_TYPE, TIER | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/PRODUCT_PRICING_MATRIX_BD|PRODUCT_PRICING_MATRIX_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/PRODUCT_PRICING_MATRIX_BI|PRODUCT_PRICING_MATRIX_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/PRODUCT_PRICING_MATRIX_BU|PRODUCT_PRICING_MATRIX_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

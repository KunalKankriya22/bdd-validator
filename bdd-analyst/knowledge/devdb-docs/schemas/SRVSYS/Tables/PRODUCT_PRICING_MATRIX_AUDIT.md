---
tags:
  - table
  - SRVSYS
---
# PRODUCT_PRICING_MATRIX_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 5547
**Last Analyzed**: 2025-09-16 03:16:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 3 | TIER | NUMBER(2) | Yes |  |  |
| 4 | FROM_DAY | NUMBER(4) | Yes |  |  |
| 5 | TO_DAY | NUMBER(4) | Yes |  |  |
| 6 | UNIT_PRICE | NUMBER(9,2) | Yes |  |  |
| 7 | EFF_DATE | DATE | Yes |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 10 | CUSTOMER_ID | VARCHAR2(10) | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 14 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PROD_PRICING_MAT_AUD_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

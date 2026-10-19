---
tags:
  - table
  - SRVSYS
---
# STOCK_SUMMARIES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SUMMARY_TYPE | VARCHAR2(1) | No |  |  |
| 2 | SUMMARY_PERIOD | NUMBER(4) | No |  |  |
| 3 | BLOOD_TYPE | VARCHAR2(4) | No |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 5 | CUSTOMER_ID | VARCHAR2(10) | Yes |  |  |
| 6 | ORDERED_QTY | NUMBER(5) | Yes |  |  |
| 7 | ORDERED_AMOUNT | NUMBER(9,2) | Yes |  |  |
| 8 | SHIPPED_QTY | NUMBER(5) | Yes |  |  |
| 9 | SHIPPED_AMOUNT | NUMBER(9,2) | Yes |  |  |
| 10 | RETURN_QTY | NUMBER(5) | Yes |  |  |
| 11 | RETURN_AMOUNT | NUMBER(9,2) | Yes |  |  |
| 12 | TRANSFUSED_QTY | NUMBER(5) | Yes |  |  |
| 13 | TRANSFUSED_AMOUNT | NUMBER(9,2) | Yes |  |  |
| 14 | OUTDATE_QTY | NUMBER(5) | Yes |  |  |
| 15 | OUTDATE_AMOUNT | NUMBER(9,2) | Yes |  |  |
| 16 | DISCARD_QTY | NUMBER(5) | Yes |  |  |
| 17 | DISCARD_AMOUNT | NUMBER(9,2) | Yes |  |  |
| 18 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |

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

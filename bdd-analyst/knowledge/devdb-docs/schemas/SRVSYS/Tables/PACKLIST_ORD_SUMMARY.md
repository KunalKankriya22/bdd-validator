---
tags:
  - table
  - SRVSYS
---
# PACKLIST_ORD_SUMMARY

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 127
**Last Analyzed**: 2025-10-17 03:00:22
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(30) | Yes |  |  |
| 2 | SHIPMENT_NO | VARCHAR2(20) | Yes |  |  |
| 3 | ORDER_NO | VARCHAR2(20) | Yes |  |  |
| 4 | PRODUCT_TYPE | VARCHAR2(10) | Yes |  |  |
| 5 | CODE_DESC | VARCHAR2(100) | Yes |  |  |
| 6 | REQUIRED_QTY | NUMBER(5) | Yes |  |  |
| 7 | FILLED_QTY | NUMBER(5) | Yes |  |  |
| 8 | SUB_QTY | NUMBER(3) | Yes |  |  |
| 9 | SHIPPED_QTY | NUMBER(4) | Yes |  |  |
| 10 | BACK_ORD_QTY | NUMBER(5) | Yes |  |  |

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

---
tags:
  - table
  - SRVSYS
---
# PACKLIST_ANT_ATTR_CHARGE

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 90
**Last Analyzed**: 2025-11-22 04:00:30
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(30) | Yes |  |  |
| 2 | SHIPMENT_NO | VARCHAR2(20) | Yes |  |  |
| 3 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 4 | PRODUCT_CODE | VARCHAR2(10) | Yes |  |  |
| 5 | ALIQUOT | VARCHAR2(2) | Yes |  |  |
| 6 | ORDER_NO | VARCHAR2(15) | Yes |  |  |
| 7 | CATEGORY | VARCHAR2(15) | Yes |  |  |
| 8 | CATEGORY_ID | VARCHAR2(10) | Yes |  |  |
| 9 | CATEGORY_DESC1 | VARCHAR2(100) | Yes |  |  |
| 10 | CATEGORY_DESC2 | VARCHAR2(100) | Yes |  |  |
| 11 | CATEGORY_PRICE | NUMBER | Yes |  |  |

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

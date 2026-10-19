---
tags:
  - table
  - SRVSYS
---
# PACKLIST_DETAILS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 185
**Last Analyzed**: 2025-10-17 03:00:22
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(30) | Yes |  |  |
| 2 | SHIPMENT_NO | VARCHAR2(20) | Yes |  |  |
| 3 | ORDER_NO | VARCHAR2(20) | Yes |  |  |
| 4 | BOX_ID | VARCHAR2(20) | Yes |  |  |
| 5 | PACKED_BY | VARCHAR2(30) | Yes |  |  |
| 6 | PACKED_DATE | DATE | Yes |  |  |
| 7 | MFG_PROD_TYPE | VARCHAR2(10) | Yes |  |  |
| 8 | MFG_PROD_VOL | NUMBER | Yes |  |  |
| 9 | UNIT_ID | VARCHAR2(25) | Yes |  |  |
| 10 | SUBFLAG | VARCHAR2(5) | Yes |  |  |
| 11 | BLOOD_TYPE | VARCHAR2(10) | Yes |  |  |
| 12 | EXP_COLL_DATE | DATE | Yes |  |  |
| 13 | PROD_ALIQ | VARCHAR2(10) | Yes |  |  |
| 14 | PRODUCT_CODE | VARCHAR2(10) | Yes |  |  |
| 15 | ALIQUOT | VARCHAR2(2) | Yes |  |  |
| 16 | PROD_DESC | VARCHAR2(150) | Yes |  |  |
| 17 | INSPECTED_BY | VARCHAR2(30) | Yes |  |  |
| 18 | PROD_PRICE | NUMBER | Yes |  |  |

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

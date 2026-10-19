---
tags:
  - table
  - SRVSYS
---
# PACKLIST_ORDER_TOTALS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 84
**Last Analyzed**: 2025-10-05 23:02:42
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(30) | Yes |  |  |
| 2 | SHIPMENT_NO | VARCHAR2(20) | Yes |  |  |
| 3 | ORDER_NO | VARCHAR2(20) | Yes |  |  |
| 4 | MFG_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | MFG_PROD_VOL | VARCHAR2(20) | Yes |  |  |
| 6 | MFG_STD_PRICE | VARCHAR2(20) | Yes |  |  |
| 7 | MFG_WEIGHT | VARCHAR2(20) | Yes |  |  |
| 8 | ORDER_SUB_TOTAL | VARCHAR2(20) | Yes |  |  |

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

---
tags:
  - table
  - SRVSYS
---
# PACKLIST_BOXES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 115
**Last Analyzed**: 2025-10-03 03:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(30) | Yes |  |  |
| 2 | SHIPMENT_NO | VARCHAR2(20) | Yes |  |  |
| 3 | BOX_ID | VARCHAR2(15) | Yes |  |  |
| 4 | ORDER_NO | VARCHAR2(20) | Yes |  |  |
| 5 | PACKED_BY | VARCHAR2(50) | Yes |  |  |
| 6 | PACKED_DATE | DATE | Yes |  |  |
| 7 | MFG_PROD_VOL | NUMBER | Yes |  |  |
| 8 | MFG_STD_PRICE | NUMBER | Yes |  |  |

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

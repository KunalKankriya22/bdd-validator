---
tags:
  - table
  - SRVSYS
---
# PACKLIST_PROD_IN_SHIPMENT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 122
**Last Analyzed**: 2025-10-17 03:00:22
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(30) | Yes |  |  |
| 2 | SHIPMENT_NO | VARCHAR2(20) | Yes |  |  |
| 3 | PRODUCT_TYPE | VARCHAR2(50) | Yes |  |  |
| 4 | BLOOD_TYPE | VARCHAR2(50) | Yes |  |  |
| 5 | PROD_COUNT | NUMBER | Yes |  |  |

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

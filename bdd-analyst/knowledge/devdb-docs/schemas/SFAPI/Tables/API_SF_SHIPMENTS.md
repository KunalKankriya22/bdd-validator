---
tags:
  - table
  - SFAPI
---
# API_SF_SHIPMENTS

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 714
**Last Analyzed**: 2025-09-18 03:00:25
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | COLL_DATE | DATE | No |  |  |
| 2 | SHIPPED_PRODUCT | VARCHAR2(8) | Yes |  |  |
| 3 | CUSTOMER_ID | VARCHAR2(15) | Yes |  |  |
| 4 | CONSIGNEE_ID | VARCHAR2(15) | Yes |  |  |
| 5 | INSERT_DATE | DATE | No |  |  |
| 6 | RECORD_READ_DATE | DATE | Yes |  |  |
| 7 | SHIPMENT_DATE | DATE | Yes |  |  |
| 8 | UNIT_ID | VARCHAR2(15) | Yes |  |  |

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

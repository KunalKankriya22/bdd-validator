---
tags:
  - table
  - LTAPI
---
# API_ORDER_RETURNS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:30
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | OS_RETURN_ID | VARCHAR2(15) | No |  |  |
| 2 | LT_RETURN_ID | VARCHAR2(15) | Yes |  |  |
| 3 | CUSTOMER_ID | VARCHAR2(15) | Yes |  |  |
| 4 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 5 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 6 | ALIQUOT | VARCHAR2(2) | Yes |  |  |
| 7 | RETURN_REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | RETURN_USER_ID | VARCHAR2(30) | Yes |  |  |
| 9 | LT_STATUS | VARCHAR2(10) | Yes |  |  |
| 10 | LT_UPDATED_ON | DATE | Yes |  |  |

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

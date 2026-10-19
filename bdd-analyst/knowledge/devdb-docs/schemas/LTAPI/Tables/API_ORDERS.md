---
tags:
  - table
  - LTAPI
---
# API_ORDERS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 53
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | OS_ORDER_NO | VARCHAR2(15) | No |  |  |
| 2 | LT_ORDER_NO | VARCHAR2(15) | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | CUSTOMER_ID | VARCHAR2(50) | Yes |  |  |
| 5 | ORDER_TYPE | VARCHAR2(30) | Yes |  |  |
| 6 | ORDER_CLASS | VARCHAR2(30) | Yes |  |  |
| 7 | ORDER_MODE | VARCHAR2(30) | Yes |  |  |
| 8 | ORDER_BY | VARCHAR2(50) | Yes |  |  |
| 9 | ORDER_COMMENTS | VARCHAR2(300) | Yes |  |  |
| 10 | LT_STATUS | VARCHAR2(10) | Yes |  |  |
| 11 | INSERT_DATE | DATE | Yes |  |  |
| 12 | LT_UPDATED_ON | DATE | Yes |  |  |

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

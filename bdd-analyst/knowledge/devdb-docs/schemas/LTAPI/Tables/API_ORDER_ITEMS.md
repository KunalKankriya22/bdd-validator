---
tags:
  - table
  - LTAPI
---
# API_ORDER_ITEMS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 57
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | OS_ORDER_NO | VARCHAR2(15) | No |  |  |
| 2 | LT_ORDER_NO | VARCHAR2(15) | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(5) | Yes |  |  |
| 4 | ITEM_NO | NUMBER(2) | Yes |  |  |
| 5 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 6 | BLOOD_TYPE | VARCHAR2(8) | Yes |  |  |
| 7 | SUBSTITUTION_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | TIER_CODE | VARCHAR2(2) | Yes |  |  |
| 9 | REQUIRED_QUANTITY | NUMBER(2) | Yes |  |  |
| 10 | ITEM_COMMENTS | VARCHAR2(300) | Yes |  |  |
| 11 | LT_STATUS | VARCHAR2(10) | Yes |  |  |
| 12 | INSERT_DATE | DATE | Yes |  |  |
| 13 | LT_UPDATED_ON | DATE | Yes |  |  |

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

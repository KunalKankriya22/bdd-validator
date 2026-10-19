---
tags:
  - table
  - LTAPI
---
# API_ORDER_ITEMS_ATTR

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 13
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | OS_ORDER_NO | VARCHAR2(15) | No |  |  |
| 2 | LT_ORDER_NO | VARCHAR2(15) | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | ITEM_NO | NUMBER(2) | Yes |  |  |
| 5 | ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 6 | LT_STATUS | VARCHAR2(10) | Yes |  |  |
| 7 | INSERT_DATE | DATE | Yes |  |  |
| 8 | LT_UPDATED_ON | DATE | Yes |  |  |

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
